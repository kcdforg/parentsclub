<?php
require_once '../../config/database.php';
require_once '../../config/session.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, DELETE, OPTIONS');
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

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'POST':
            handleUpload($admin['id']);
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
    error_log("Upload API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

function handleUpload($adminId) {
    global $pdo;
    
    if (!isset($_FILES['file'])) {
        http_response_code(400);
        echo json_encode(['error' => 'No file uploaded']);
        return;
    }
    
    $file = $_FILES['file'];
    $uploadType = $_POST['upload_type'] ?? 'announcement';
    $referenceId = $_POST['reference_id'] ?? null;
    
    // Validate file
    if ($file['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['error' => 'File upload error: ' . getUploadError($file['error'])]);
        return;
    }
    
    // Check file size (5MB limit)
    $maxSize = 5 * 1024 * 1024; // 5MB
    if ($file['size'] > $maxSize) {
        http_response_code(400);
        echo json_encode(['error' => 'File too large. Maximum size is 5MB']);
        return;
    }
    
    // Get file info
    $originalName = $file['name'];
    $tmpName = $file['tmp_name'];
    $fileSize = $file['size'];
    $mimeType = mime_content_type($tmpName);
    $isImage = strpos($mimeType, 'image/') === 0;
    
    // Generate unique filename
    $extension = pathinfo($originalName, PATHINFO_EXTENSION);
    $filename = uniqid() . '_' . time() . '.' . $extension;
    
    // Create upload directory if it doesn't exist
    $uploadDir = '../../uploads/' . $uploadType . '/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    $filePath = $uploadDir . $filename;
    $webPath = 'uploads/' . $uploadType . '/' . $filename;
    
    try {
        // Move uploaded file
        if (!move_uploaded_file($tmpName, $filePath)) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to save file']);
            return;
        }
        
        // Save file info to database
        $stmt = $pdo->prepare("
            INSERT INTO files (filename, original_filename, file_path, file_size, mime_type, uploaded_by, upload_type, reference_id, is_image, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $filename,
            $originalName,
            $webPath,
            $fileSize,
            $mimeType,
            $adminId,
            $uploadType,
            $referenceId,
            $isImage
        ]);
        
        $fileId = $pdo->lastInsertId();
        
        echo json_encode([
            'success' => true,
            'data' => [
                'id' => (int)$fileId,
                'filename' => $filename,
                'original_filename' => $originalName,
                'file_path' => $webPath,
                'file_size' => $fileSize,
                'mime_type' => $mimeType,
                'is_image' => $isImage,
                'url' => getBaseUrl() . $webPath
            ]
        ]);
        
    } catch (PDOException $e) {
        // Clean up file if database insert fails
        if (file_exists($filePath)) {
            unlink($filePath);
        }
        
        error_log("Database error in handleUpload: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
    }
}

function handleDelete() {
    global $pdo;
    
    if (!isset($_GET['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'File ID is required']);
        return;
    }
    
    $fileId = (int)$_GET['id'];
    
    try {
        // Get file info
        $stmt = $pdo->prepare("SELECT file_path FROM files WHERE id = ?");
        $stmt->execute([$fileId]);
        $file = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$file) {
            http_response_code(404);
            echo json_encode(['error' => 'File not found']);
            return;
        }
        
        // Delete from database
        $stmt = $pdo->prepare("DELETE FROM files WHERE id = ?");
        $stmt->execute([$fileId]);
        
        // Delete physical file
        $filePath = '../../' . $file['file_path'];
        if (file_exists($filePath)) {
            unlink($filePath);
        }
        
        echo json_encode(['success' => true]);
        
    } catch (PDOException $e) {
        error_log("Database error in handleDelete: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
    }
}

function getUploadError($code) {
    switch ($code) {
        case UPLOAD_ERR_INI_SIZE:
            return 'File exceeds upload_max_filesize';
        case UPLOAD_ERR_FORM_SIZE:
            return 'File exceeds MAX_FILE_SIZE';
        case UPLOAD_ERR_PARTIAL:
            return 'File was partially uploaded';
        case UPLOAD_ERR_NO_FILE:
            return 'No file was uploaded';
        case UPLOAD_ERR_NO_TMP_DIR:
            return 'Missing temporary folder';
        case UPLOAD_ERR_CANT_WRITE:
            return 'Failed to write file to disk';
        case UPLOAD_ERR_EXTENSION:
            return 'File upload stopped by extension';
        default:
            return 'Unknown upload error';
    }
}

function getBaseUrl() {
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    $path = dirname(dirname($_SERVER['SCRIPT_NAME'])); // Go up two levels from admin/backend
    return $protocol . '://' . $host . $path . '/';
}
?>
