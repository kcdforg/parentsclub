<?php
require_once '../../config/database.php';
require_once '../../config/session.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Authenticate admin
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';

if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(['error' => 'Authorization token required']);
    exit;
}

$sessionToken = $matches[1];
$sessionManager = SessionManager::getInstance();
$admin = $sessionManager->getUserFromSession($sessionToken);

if (!$admin || $admin['user_type'] !== 'admin') {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid or expired session']);
    exit;
}

// Validate admin session is still valid
if (!$admin || !$admin['is_active']) {
    http_response_code(401);
    echo json_encode(['error' => 'Admin account is not active']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

try {
    switch ($method) {
        case 'GET':
            handleGet();
            break;
        case 'POST':
            handlePost($input);
            break;
        case 'PUT':
            handlePut($input);
            break;
        case 'DELETE':
            handleDelete();
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    error_log("Form Values API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

function handleGet() {
    global $pdo;
    
    try {
        // Get all form values grouped by type
        $stmt = $pdo->prepare("
            SELECT id, type, value, parent_id, created_at, updated_at 
            FROM form_values 
            ORDER BY type ASC, value ASC
        ");
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Group by type
        $formValues = [
            'kulam' => [],
            'kulaDeivam' => [],
            'kaani' => [],
            'degree' => [],
            'department' => [],
            'institution' => [],
            'company' => [],
            'position' => []
        ];
        
        foreach ($results as $row) {
            if (array_key_exists($row['type'], $formValues)) {
                $formValues[$row['type']][] = [
                    'id' => (int)$row['id'],
                    'value' => $row['value'],
                    'parent_id' => $row['parent_id'] ? (int)$row['parent_id'] : null,
                    'created_at' => $row['created_at'],
                    'updated_at' => $row['updated_at']
                ];
            }
        }
        
        // Also get relationships
        $relationships = [];
        
        // Kaani relationships (children of Kula Deivam)
        $stmt = $pdo->prepare("
            SELECT k.id, k.value, k.parent_id, kd.value as parent_value
            FROM form_values k
            LEFT JOIN form_values kd ON k.parent_id = kd.id
            WHERE k.type = 'kaani' AND k.parent_id IS NOT NULL
        ");
        $stmt->execute();
        $kaaniRelations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $relationships['kaani'] = [];
        foreach ($kaaniRelations as $relation) {
            if (!isset($relationships['kaani'][$relation['parent_id']])) {
                $relationships['kaani'][$relation['parent_id']] = [];
            }
            $relationships['kaani'][$relation['parent_id']][] = [
                'id' => (int)$relation['id'],
                'value' => $relation['value']
            ];
        }
        
        // Department relationships (children of Degree)
        $stmt = $pdo->prepare("
            SELECT d.id, d.value, d.parent_id, deg.value as parent_value
            FROM form_values d
            LEFT JOIN form_values deg ON d.parent_id = deg.id
            WHERE d.type = 'department' AND d.parent_id IS NOT NULL
        ");
        $stmt->execute();
        $departmentRelations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $relationships['department'] = [];
        foreach ($departmentRelations as $relation) {
            if (!isset($relationships['department'][$relation['parent_id']])) {
                $relationships['department'][$relation['parent_id']] = [];
            }
            $relationships['department'][$relation['parent_id']][] = [
                'id' => (int)$relation['id'],
                'value' => $relation['value']
            ];
        }
        
        echo json_encode([
            'success' => true,
            'data' => $formValues,
            'relationships' => $relationships
        ]);
        
    } catch (PDOException $e) {
        error_log("Database error in handleGet: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
    }
}

function handlePost($input) {
    global $pdo;
    
    if (!isset($input['type']) || !isset($input['value'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Type and value are required']);
        return;
    }
    
    $type = trim($input['type']);
    $value = trim($input['value']);
    $parent_id = isset($input['parent_id']) ? (int)$input['parent_id'] : null;
    
    // Validate type
    $validTypes = ['kulam', 'kulaDeivam', 'kaani', 'degree', 'department', 'institution', 'company', 'position'];
    if (!in_array($type, $validTypes)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid type']);
        return;
    }
    
    if (empty($value)) {
        http_response_code(400);
        echo json_encode(['error' => 'Value cannot be empty']);
        return;
    }
    
    try {
        // Check for duplicates
        $stmt = $pdo->prepare("
            SELECT COUNT(*) FROM form_values 
            WHERE type = ? AND LOWER(value) = LOWER(?)
        ");
        $stmt->execute([$type, $value]);
        
        if ($stmt->fetchColumn() > 0) {
            http_response_code(409);
            echo json_encode(['error' => 'Value already exists']);
            return;
        }
        
        // Insert new value
        $stmt = $pdo->prepare("
            INSERT INTO form_values (type, value, parent_id, created_at, updated_at) 
            VALUES (?, ?, ?, NOW(), NOW())
        ");
        $stmt->execute([$type, $value, $parent_id]);
        
        $newId = $pdo->lastInsertId();
        
        echo json_encode([
            'success' => true,
            'data' => [
                'id' => (int)$newId,
                'type' => $type,
                'value' => $value,
                'parent_id' => $parent_id
            ]
        ]);
        
    } catch (PDOException $e) {
        error_log("Database error in handlePost: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
    }
}

function handlePut($input) {
    global $pdo;
    
    if (!isset($input['id']) || !isset($input['value'])) {
        http_response_code(400);
        echo json_encode(['error' => 'ID and value are required']);
        return;
    }
    
    $id = (int)$input['id'];
    $value = trim($input['value']);
    
    if (empty($value)) {
        http_response_code(400);
        echo json_encode(['error' => 'Value cannot be empty']);
        return;
    }
    
    try {
        // Get current record to check type
        $stmt = $pdo->prepare("SELECT type FROM form_values WHERE id = ?");
        $stmt->execute([$id]);
        $current = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$current) {
            http_response_code(404);
            echo json_encode(['error' => 'Value not found']);
            return;
        }
        
        // Check for duplicates (excluding current record)
        $stmt = $pdo->prepare("
            SELECT COUNT(*) FROM form_values 
            WHERE type = ? AND LOWER(value) = LOWER(?) AND id != ?
        ");
        $stmt->execute([$current['type'], $value, $id]);
        
        if ($stmt->fetchColumn() > 0) {
            http_response_code(409);
            echo json_encode(['error' => 'Value already exists']);
            return;
        }
        
        // Update value
        $stmt = $pdo->prepare("
            UPDATE form_values 
            SET value = ?, updated_at = NOW() 
            WHERE id = ?
        ");
        $stmt->execute([$value, $id]);
        
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Value not found']);
            return;
        }
        
        echo json_encode([
            'success' => true,
            'data' => [
                'id' => $id,
                'value' => $value
            ]
        ]);
        
    } catch (PDOException $e) {
        error_log("Database error in handlePut: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
    }
}

function handleDelete() {
    global $pdo;
    
    if (!isset($_GET['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'ID is required']);
        return;
    }
    
    $id = (int)$_GET['id'];
    
    try {
        $stmt = $pdo->prepare("DELETE FROM form_values WHERE id = ?");
        $stmt->execute([$id]);
        
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Value not found']);
            return;
        }
        
        echo json_encode(['success' => true]);
        
    } catch (PDOException $e) {
        error_log("Database error in handleDelete: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
    }
}

/**
 * Create the form_values table if it doesn't exist
 * This function should be called during setup/migration
 */
function createFormValuesTable() {
    global $pdo;
    
    $sql = "
        CREATE TABLE IF NOT EXISTS form_values (
            id INT AUTO_INCREMENT PRIMARY KEY,
            type VARCHAR(50) NOT NULL,
            value VARCHAR(255) NOT NULL,
            parent_id INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_type_value (type, value),
            INDEX idx_type (type),
            INDEX idx_parent (parent_id),
            FOREIGN KEY (parent_id) REFERENCES form_values(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";
    
    try {
        $pdo->exec($sql);
        return true;
    } catch (PDOException $e) {
        error_log("Error creating form_values table: " . $e->getMessage());
        return false;
    }
}

// Auto-create table if it doesn't exist (for development)
if ($method === 'GET' && !tableExists('form_values')) {
    createFormValuesTable();
}

function tableExists($tableName) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("SHOW TABLES LIKE ?");
        $stmt->execute([$tableName]);
        return $stmt->rowCount() > 0;
    } catch (PDOException $e) {
        return false;
    }
}
?>
