<?php
/**
 * Intro Questions API Endpoint
 * Handles saving user answers from the getIntro.html questions
 */

require_once '../../config/database.php';
require_once '../../config/session.php';

// Set content type to JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

class IntroQuestionsHandler {
    private $db;
    private $sessionManager;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
        $this->sessionManager = SessionManager::getInstance();
    }

    public function handleRequest() {
        try {
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new Exception('Method not allowed', 405);
            }

            // Get JSON input
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input) {
                throw new Exception('Invalid JSON input');
            }

            // Validate required fields
            $this->validateInput($input);

            // Verify user authentication (invitation code not required for login flow)
            $user = $this->verifyUserAuthentication($input);

            // Save intro questions data
            $this->saveIntroData($user['id'], $input);

            return $this->sendResponse([
                'success' => true,
                'message' => 'Intro questions saved successfully',
                'user_id' => $user['id']
            ]);

        } catch (Exception $e) {
            error_log("Intro Questions Error: " . $e->getMessage());
            return $this->sendResponse([
                'success' => false,
                'error' => $e->getMessage()
            ], $e->getCode() ?: 400);
        }
    }

    private function validateInput($input) {
        $required = ['gender', 'marriageType'];
        
        foreach ($required as $field) {
            if (!isset($input[$field]) || empty(trim($input[$field]))) {
                throw new Exception("Missing required field: $field");
            }
        }

        // Validate gender
        if (!in_array($input['gender'], ['male', 'female', 'others'])) {
            throw new Exception('Invalid gender value');
        }

        // Validate marriage type
        $validMarriageTypes = ['unmarried', 'married', 'widowed', 'divorced', 'remarried'];
        if (!in_array($input['marriageType'], $validMarriageTypes)) {
            throw new Exception('Invalid marriage type');
        }

        // If married, validate hasChildren
        $marriedTypes = ['married', 'widowed', 'divorced', 'remarried'];
        if (in_array($input['marriageType'], $marriedTypes)) {
            if (!isset($input['hasChildren']) || !in_array($input['hasChildren'], ['yes', 'no'])) {
                throw new Exception('Missing or invalid hasChildren value for married user');
            }
        }
    }

    private function verifyUserAuthentication($input) {
        // Get session token from Authorization header
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        $authHeader = $headers['Authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';

        if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            throw new Exception('Authorization token required');
        }

        $sessionToken = $matches[1];
        $sessionUser = $this->sessionManager->getUserFromSession($sessionToken);
        
        if (!$sessionUser || $sessionUser['user_type'] !== 'user') {
            throw new Exception('Invalid or expired session');
        }

        $userId = $sessionUser['id'];

        // Verify user exists and get details
        $stmt = $this->db->prepare("
            SELECT u.id, u.email, u.created_via_invitation, u.invitation_id,
                   up.profile_completion_step
            FROM users u 
            LEFT JOIN user_profiles up ON u.id = up.user_id 
            WHERE u.id = ?
        ");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            throw new Exception('User not found');
        }

        // For login flow, we don't need to verify invitation codes
        // The user is already authenticated via session token
        // Invitation codes are only required during registration flow

        return $user;
    }

    private function saveIntroData($userId, $data) {
        $this->db->beginTransaction();

        try {
            // Calculate derived fields
            $derivedData = $this->calculateDerivedFields($data);

            // Check if user_profile exists
            $stmt = $this->db->prepare("SELECT id FROM user_profiles WHERE user_id = ?");
            $stmt->execute([$userId]);
            $profileExists = $stmt->fetch();

            if ($profileExists) {
                // Update existing profile
                $stmt = $this->db->prepare("
                    UPDATE user_profiles SET 
                        gender = ?,
                        marriageType = ?,
                        hasChildren = ?,
                        isMarried = ?,
                        marriageStatus = ?,
                        statusAcceptance = ?,
                        role = ?,
                        intro_completed = TRUE,
                        questions_completed = TRUE,
                        profile_completion_step = 'member_details',
                        updated_at = NOW()
                    WHERE user_id = ?
                ");
                $stmt->execute([
                    $data['gender'],
                    $data['marriageType'],
                    $derivedData['hasChildren'],
                    $derivedData['isMarried'],
                    $derivedData['marriageStatus'],
                    $derivedData['statusAcceptance'],
                    $derivedData['role'],
                    $userId
                ]);
            } else {
                // Insert new profile
                $stmt = $this->db->prepare("
                    INSERT INTO user_profiles (
                        user_id, gender, marriageType, hasChildren, 
                        isMarried, marriageStatus, statusAcceptance, role,
                        intro_completed, questions_completed, profile_completion_step,
                        created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE, TRUE, 'member_details', NOW(), NOW())
                ");
                $stmt->execute([
                    $userId,
                    $data['gender'],
                    $data['marriageType'],
                    $derivedData['hasChildren'],
                    $derivedData['isMarried'],
                    $derivedData['marriageStatus'],
                    $derivedData['statusAcceptance'],
                    $derivedData['role']
                ]);
            }

            $this->db->commit();

        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }

    private function calculateDerivedFields($data) {
        $marriageType = $data['marriageType'];
        $gender = $data['gender'];
        $hasChildren = isset($data['hasChildren']) ? $data['hasChildren'] : 'no';

        // Calculate isMarried, marriageStatus, statusAcceptance
        switch ($marriageType) {
            case 'unmarried':
                $isMarried = 'no';
                $marriageStatus = 'unmarried';
                $statusAcceptance = 'valid';
                break;
            case 'married':
                $isMarried = 'yes';
                $marriageStatus = 'married';
                $statusAcceptance = 'valid';
                break;
            case 'widowed':
                $isMarried = 'yes';
                $marriageStatus = 'married';
                $statusAcceptance = 'valid';
                break;
            case 'divorced':
                $isMarried = 'yes';
                $marriageStatus = 'married';
                $statusAcceptance = 'invalid';
                break;
            case 'remarried':
                $isMarried = 'yes';
                $marriageStatus = 'complicated';
                $statusAcceptance = 'invalid';
                break;
            default:
                throw new Exception('Invalid marriage type');
        }

        // Calculate role
        if ($gender === 'others') {
            // For "others" gender, use neutral role
            $role = 'member';
        } elseif ($isMarried === 'no') {
            $role = $gender === 'male' ? 'son' : 'daughter';
        } else {
            if ($hasChildren === 'yes') {
                $role = $gender === 'male' ? 'father' : 'mother';
            } else {
                $role = $gender === 'male' ? 'husband' : 'wife';
            }
        }

        return [
            'isMarried' => $isMarried,
            'marriageStatus' => $marriageStatus,
            'statusAcceptance' => $statusAcceptance,
            'role' => $role,
            'hasChildren' => $hasChildren
        ];
    }

    private function sendResponse($data, $statusCode = 200) {
        http_response_code($statusCode);
        echo json_encode($data);
        exit();
    }
}

// Handle the request
$handler = new IntroQuestionsHandler();
$handler->handleRequest();
?>
