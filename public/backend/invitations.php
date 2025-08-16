<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../config/database.php';
require_once '../../config/session.php';

// Check request method
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    listMyInvitations();
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    createInvitation();
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    deleteInvitation();
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

function listMyInvitations() {
    try {
        // Verify user session
        $sessionToken = getAuthorizationToken();
        if (!$sessionToken) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            return;
        }

        $sessionManager = SessionManager::getInstance();
        $session = $sessionManager->validateSession($sessionToken);
        if (!$session || $session['user_type'] !== 'user') {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            return;
        }

        $db = Database::getInstance()->getConnection();
        
        // Check if user is approved or member (can invite others)
        $stmt = $db->prepare("
            SELECT u.id, u.user_type, u.approval_status, 
                   s.status as subscription_status, s.end_date as subscription_end
            FROM users u 
            LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
            WHERE u.id = ?
        ");
        $stmt->execute([$session['user_id']]);
        $user = $stmt->fetch();
        
        if (!$user || !in_array($user['user_type'], ['Approved', 'Member']) || $user['approval_status'] !== 'approved') {
            // Return empty result with eligibility info instead of 403 error
            echo json_encode([
                'success' => true,
                'invitations' => [],
                'pagination' => [
                    'current_page' => 1,
                    'total_pages' => 1,
                    'total_items' => 0,
                    'items_per_page' => 10
                ],
                'user_info' => [
                    'user_type' => $user['user_type'] ?? 'Unknown',
                    'can_invite' => false,
                    'message' => 'Only approved members can invite others'
                ]
            ]);
            return;
        }
        
        // Get query parameters
        $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
        $limit = 10;
        $offset = ($page - 1) * $limit;
        
        $statusFilter = isset($_GET['status']) ? $_GET['status'] : '';
        $searchFilter = isset($_GET['search']) ? $_GET['search'] : '';
        
        // Build WHERE clause
        $whereConditions = ['invited_by_type = ? AND invited_by_id = ?'];
        $params = ['user', $session['user_id']];
        
        if (!empty($statusFilter) && $statusFilter !== 'all') {
            $whereConditions[] = 'status = ?';
            $params[] = $statusFilter;
        }
        
        if (!empty($searchFilter)) {
            $whereConditions[] = '(invited_name LIKE ? OR invited_email LIKE ?)';
            $params[] = "%$searchFilter%";
            $params[] = "%$searchFilter%";
        }
        
        $whereClause = 'WHERE ' . implode(' AND ', $whereConditions);
        
        // Get total count
        $countSql = "SELECT COUNT(*) FROM invitations $whereClause";
        $countStmt = $db->prepare($countSql);
        $countStmt->execute($params);
        $totalInvitations = $countStmt->fetchColumn();
        
        // Get invitations with pagination
        $sql = "
            SELECT i.*, 
                   CASE 
                       WHEN i.used_by IS NOT NULL THEN u.email 
                       ELSE NULL 
                   END as used_by_email,
                   CASE 
                       WHEN i.used_by IS NOT NULL THEN up.full_name 
                       ELSE NULL 
                   END as used_by_name
            FROM invitations i
            LEFT JOIN users u ON i.used_by = u.id
            LEFT JOIN user_profiles up ON u.id = up.user_id
            $whereClause
            ORDER BY i.created_at DESC 
            LIMIT ? OFFSET ?
        ";
        
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $invitations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate pagination info
        $totalPages = ceil($totalInvitations / $limit);
        
        echo json_encode([
            'success' => true,
            'invitations' => $invitations,
            'pagination' => [
                'current_page' => $page,
                'total_pages' => $totalPages,
                'total_items' => $totalInvitations,
                'items_per_page' => $limit
            ],
            'user_info' => [
                'user_type' => $user['user_type'],
                'can_invite' => true
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("Error listing invitations: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch invitations']);
    }
}

function createInvitation() {
    try {
        // Verify user session
        $sessionToken = getAuthorizationToken();
        if (!$sessionToken) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            return;
        }

        $sessionManager = SessionManager::getInstance();
        $session = $sessionManager->validateSession($sessionToken);
        if (!$session || $session['user_type'] !== 'user') {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            return;
        }

        $db = Database::getInstance()->getConnection();
        
        // Check if user is approved or member (can invite others)
        $stmt = $db->prepare("
            SELECT u.id, u.user_type, u.approval_status, up.full_name as inviter_name,
                   s.status as subscription_status, s.end_date as subscription_end
            FROM users u 
            LEFT JOIN user_profiles up ON u.id = up.user_id
            LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
            WHERE u.id = ?
        ");
        $stmt->execute([$session['user_id']]);
        $user = $stmt->fetch();
        
        if (!$user || !in_array($user['user_type'], ['Approved', 'Member']) || $user['approval_status'] !== 'approved') {
            http_response_code(403);
            echo json_encode(['error' => 'Only approved members can invite others']);
            return;
        }
        
        // Get and validate input
        $input = json_decode(file_get_contents('php://input'), true);
        
        $invitedName = trim($input['invited_name'] ?? '');
        $invitedEmail = trim($input['invited_email'] ?? '');
        $invitedPhone = trim($input['invited_phone'] ?? '');
        $invitationType = $input['invitation_type'] ?? 'email';
        
        if (empty($invitedName)) {
            http_response_code(400);
            echo json_encode(['error' => 'Name is required']);
            return;
        }
        
        // Validate invitation type and corresponding field
        if ($invitationType === 'email') {
            if (empty($invitedEmail)) {
                http_response_code(400);
                echo json_encode(['error' => 'Email is required for email invitations']);
                return;
            }
            
            if (!filter_var($invitedEmail, FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid email address']);
                return;
            }
            
            // Check if email already exists in users table
            $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$invitedEmail]);
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(['error' => 'User with this email already exists']);
                return;
            }
            
            // Check if phone with this email exists (cross-check)
            if (!empty($invitedPhone)) {
                $stmt = $db->prepare("SELECT user_id FROM user_profiles WHERE phone = ?");
                $stmt->execute([$invitedPhone]);
                if ($stmt->fetch()) {
                    http_response_code(400);
                    echo json_encode(['error' => 'User with this phone number already exists']);
                    return;
                }
            }
            
        } elseif ($invitationType === 'phone') {
            if (empty($invitedPhone)) {
                http_response_code(400);
                echo json_encode(['error' => 'Phone number is required for phone invitations']);
                return;
            }
            
            // Validate phone number format
            if (!preg_match('/^\+\d{1,4}\d{7,15}$/', $invitedPhone)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid phone number format. Must include country code and be 7-15 digits.']);
                return;
            }
            
            // Check if phone already exists in user_profiles table
            $stmt = $db->prepare("SELECT user_id FROM user_profiles WHERE phone = ?");
            $stmt->execute([$invitedPhone]);
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(['error' => 'User with this phone number already exists']);
                return;
            }
            
            // Check if email with this phone exists (cross-check)
            if (!empty($invitedEmail)) {
                $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
                $stmt->execute([$invitedEmail]);
                if ($stmt->fetch()) {
                    http_response_code(400);
                    echo json_encode(['error' => 'User with this email already exists']);
                    return;
                }
            }
            
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid invitation type. Must be email or phone']);
            return;
        }
        
        // Check admin_users table for conflicts
        if ($invitationType === 'email' && !empty($invitedEmail)) {
            $stmt = $db->prepare("SELECT id FROM admin_users WHERE email = ?");
            $stmt->execute([$invitedEmail]);
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(['error' => 'An admin user with this email already exists']);
                return;
            }
        }
        
        // Check for existing pending invitations
        if ($invitationType === 'email') {
            // Check for existing email invitation
            $stmt = $db->prepare("SELECT id FROM invitations WHERE invited_email = ? AND status = 'pending' AND expires_at > NOW()");
            $stmt->execute([$invitedEmail]);
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(['error' => 'A pending invitation already exists for this email']);
                return;
            }
            
            // Check for cross-invite conflict (phone invitation for same person)
            if (!empty($invitedPhone)) {
                $stmt = $db->prepare("SELECT id FROM invitations WHERE invited_phone = ? AND status = 'pending' AND expires_at > NOW()");
                $stmt->execute([$invitedPhone]);
                if ($stmt->fetch()) {
                    http_response_code(400);
                    echo json_encode(['error' => 'A pending phone invitation already exists for this person']);
                    return;
                }
            }
            
        } elseif ($invitationType === 'phone') {
            // Check for existing phone invitation
            $stmt = $db->prepare("SELECT id FROM invitations WHERE invited_phone = ? AND status = 'pending' AND expires_at > NOW()");
            $stmt->execute([$invitedPhone]);
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(['error' => 'A pending invitation already exists for this phone number']);
                return;
            }
            
            // Check for cross-invite conflict (email invitation for same person)
            if (!empty($invitedEmail)) {
                $stmt = $db->prepare("SELECT id FROM invitations WHERE invited_email = ? AND status = 'pending' AND expires_at > NOW()");
                $stmt->execute([$invitedEmail]);
                if ($stmt->fetch()) {
                    http_response_code(400);
                    echo json_encode(['error' => 'A pending email invitation already exists for this person']);
                    return;
                }
            }
        }
        
        // Generate unique invitation code
        do {
            $invitationCode = bin2hex(random_bytes(32));
            $stmt = $db->prepare("SELECT id FROM invitations WHERE invitation_code = ?");
            $stmt->execute([$invitationCode]);
        } while ($stmt->fetch());
        
        // Set expiration (7 days from now)
        $expiresAt = date('Y-m-d H:i:s', strtotime('+7 days'));
        
        // Create invitation
        $stmt = $db->prepare("
            INSERT INTO invitations (invitation_code, invited_name, invited_email, invited_phone, invitation_type, invited_by_type, invited_by_id, expires_at)
            VALUES (?, ?, ?, ?, ?, 'user', ?, ?)
        ");
        $stmt->execute([$invitationCode, $invitedName, $invitedEmail, $invitedPhone, $invitationType, $session['user_id'], $expiresAt]);
        
        $invitationId = $db->lastInsertId();
        
        // Get the invitation details for response
        $stmt = $db->prepare("SELECT * FROM invitations WHERE id = ?");
        $stmt->execute([$invitationId]);
        $invitation = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Create invitation link
        $baseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'];
        $invitationLink = $baseUrl . '/regapp2/public/frontend/invitation.html?invitation=' . $invitationCode;
        
        echo json_encode([
            'success' => true,
            'message' => 'Invitation created successfully',
            'invitation' => $invitation,
            'invitation_link' => $invitationLink,
            'inviter_name' => $user['inviter_name']
        ]);
        
    } catch (Exception $e) {
        error_log("Error creating invitation: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create invitation']);
    }
}

function deleteInvitation() {
    try {
        // Verify user session
        $sessionToken = getAuthorizationToken();
        if (!$sessionToken) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            return;
        }

        $sessionManager = SessionManager::getInstance();
        $session = $sessionManager->validateSession($sessionToken);
        if (!$session || $session['user_type'] !== 'user') {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            return;
        }

        $db = Database::getInstance()->getConnection();
        
        // Check if user is approved or member (can manage invitations)
        $stmt = $db->prepare("
            SELECT u.id, u.user_type, u.approval_status
            FROM users u 
            WHERE u.id = ?
        ");
        $stmt->execute([$session['user_id']]);
        $user = $stmt->fetch();
        
        if (!$user || !in_array($user['user_type'], ['Approved', 'Member']) || $user['approval_status'] !== 'approved') {
            http_response_code(403);
            echo json_encode(['error' => 'Only approved members can manage invitations']);
            return;
        }
        
        $invitationId = $_GET['id'] ?? '';
        
        if (empty($invitationId)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invitation ID is required']);
            return;
        }
        
        // Check if invitation belongs to this user
        $stmt = $db->prepare("SELECT id FROM invitations WHERE id = ? AND invited_by_type = 'user' AND invited_by_id = ?");
        $stmt->execute([$invitationId, $session['user_id']]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['error' => 'Invitation not found or access denied']);
            return;
        }
        
        // Delete invitation
        $stmt = $db->prepare("DELETE FROM invitations WHERE id = ?");
        $stmt->execute([$invitationId]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Invitation deleted successfully'
        ]);
        
    } catch (Exception $e) {
        error_log("Error deleting invitation: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete invitation']);
    }
}

function getAuthorizationToken() {
    $headers = getallheaders();
    
    foreach ($headers as $name => $value) {
        if (strtolower($name) === 'authorization') {
            if (preg_match('/Bearer\s+(.*)$/i', $value, $matches)) {
                return $matches[1];
            }
        }
    }
    
    return $_COOKIE['session_token'] ?? null;
}
?>
