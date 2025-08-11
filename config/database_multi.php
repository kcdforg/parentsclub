<?php
/**
 * Multi-Database Configuration
 * Supports current single DB setup and future admin/public separation
 */

class MultiDatabase {
    private static $instances = [];
    private $connections = [];
    
    // Database configurations
    private $configs = [
        'main' => [
            'host' => 'localhost',
            'port' => '3306',
            'dbname' => 'regapp_db',
            'username' => 'root',
            'password' => '',
            'charset' => 'utf8mb4'
        ],
        // Future admin database (currently points to same DB)
        'admin' => [
            'host' => 'localhost', 
            'port' => '3306',
            'dbname' => 'regapp_db', // Change to 'admin_regapp_db' when separating
            'username' => 'root',
            'password' => '',
            'charset' => 'utf8mb4'
        ],
        // Future public database (currently points to same DB)
        'public' => [
            'host' => 'localhost',
            'port' => '3306', 
            'dbname' => 'regapp_db', // Change to 'public_regapp_db' when separating
            'username' => 'root',
            'password' => '',
            'charset' => 'utf8mb4'
        ]
    ];
    
    public static function getInstance() {
        if (!isset(self::$instances['main'])) {
            self::$instances['main'] = new self();
        }
        return self::$instances['main'];
    }
    
    public function getConnection($database = 'main') {
        if (!isset($this->connections[$database])) {
            $config = $this->configs[$database] ?? $this->configs['main'];
            
            $dsn = "mysql:host={$config['host']};port={$config['port']};dbname={$config['dbname']};charset={$config['charset']}";
            
            try {
                $this->connections[$database] = new PDO($dsn, $config['username'], $config['password'], [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]);
            } catch (PDOException $e) {
                throw new Exception("Database connection failed for '$database': " . $e->getMessage());
            }
        }
        
        return $this->connections[$database];
    }
    
    // Get admin database connection (future-ready)
    public function getAdminConnection() {
        return $this->getConnection('admin');
    }
    
    // Get public database connection (future-ready)
    public function getPublicConnection() {
        return $this->getConnection('public');
    }
    
    // Get main connection (current default)
    public function getMainConnection() {
        return $this->getConnection('main');
    }
    
    // Check if database separation is enabled
    public function isDatabaseSeparated() {
        return $this->configs['admin']['dbname'] !== $this->configs['public']['dbname'];
    }
    
    // Update configuration for database separation
    public function enableDatabaseSeparation($adminDb = 'admin_regapp_db', $publicDb = 'public_regapp_db') {
        $this->configs['admin']['dbname'] = $adminDb;
        $this->configs['public']['dbname'] = $publicDb;
        
        // Clear existing connections to force reconnection
        $this->connections = [];
    }
}

// Backward compatibility - keep existing Database class working
if (!class_exists('Database')) {
    class Database {
        private static $instance = null;
        
        public static function getInstance() {
            if (self::$instance === null) {
                self::$instance = new self();
            }
            return self::$instance;
        }
        
        public function getConnection() {
            return MultiDatabase::getInstance()->getMainConnection();
        }
    }
}
?>
