<?php
// Session management class
class SessionManager {
    private static $instance = null;
    private $db;
    
    private function __construct() {
        $this->db = Database::getInstance()->getConnection();
        $this->cleanExpiredSessions();
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function createSession($userType, $userId, $data = []) {
        $sessionId = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', time() + (24 * 60 * 60)); // 24 hours
        
        $stmt = $this->db->prepare("
            INSERT INTO sessions (id, user_type, user_id, data, expires_at) 
            VALUES (?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $sessionId,
            $userType,
            $userId,
            json_encode($data),
            $expiresAt
        ]);
        
        return $sessionId;
    }
    
    public function validateSession($sessionId) {
        $stmt = $this->db->prepare("
            SELECT * FROM sessions 
            WHERE id = ? AND expires_at > NOW()
        ");
        $stmt->execute([$sessionId]);
        
        return $stmt->fetch();
    }
    
    public function destroySession($sessionId) {
        $stmt = $this->db->prepare("DELETE FROM sessions WHERE id = ?");
        $stmt->execute([$sessionId]);
    }
    
    public function cleanExpiredSessions() {
        $stmt = $this->db->prepare("DELETE FROM sessions WHERE expires_at <= NOW()");
        $stmt->execute();
    }
    
    public function getUserFromSession($sessionId) {
        $session = $this->validateSession($sessionId);
        if (!$session) {
            return null;
        }
        
        if ($session['user_type'] === 'admin') {
            $stmt = $this->db->prepare("SELECT * FROM admin_users WHERE id = ? AND is_active = 1");
        } else {
            $stmt = $this->db->prepare("SELECT * FROM users WHERE id = ? AND is_active = 1");
        }
        
        $stmt->execute([$session['user_id']]);
        $user = $stmt->fetch();
        
        if ($user) {
            $user['user_type'] = $session['user_type'];
            $user['session_id'] = $sessionId;
        }
        
        return $user;
    }
}
?>
