<?php
/**
 * Profile Completion API Endpoint
 * Handles multi-step profile completion data
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

class ProfileCompletionHandler {
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

            // Verify user authentication
            $user = $this->verifyAuthentication();

            // Handle different steps
            $step = $input['step'] ?? '';
            
            switch ($step) {
                case 'basic_details':
                    return $this->handleBasicDetails($user['id'], $input);
                case 'member_details':
                    return $this->handleMemberDetails($user['id'], $input);
                case 'spouse_details':
                    return $this->handleSpouseDetails($user['id'], $input);
                case 'children_details':
                    return $this->handleChildrenDetails($user['id'], $input);
                case 'member_family_tree':
                    return $this->handleMemberFamilyTree($user['id'], $input);
                case 'spouse_family_tree':
                    return $this->handleSpouseFamilyTree($user['id'], $input);
                case 'family_tree':
                    return $this->handleFamilyTree($user['id'], $input);
                case 'complete_profile':
                    return $this->handleCompleteProfile($user['id']);
                
                // Get endpoints for loading existing data
                case 'get_spouse_details':
                    return $this->getSpouseDetails($user['id']);
                case 'get_children_details':
                    return $this->getChildrenDetails($user['id']);
                case 'get_member_family_tree':
                    return $this->getMemberFamilyTree($user['id']);
                case 'get_spouse_family_tree':
                    return $this->getSpouseFamilyTree($user['id']);
                
                // Individual family tree save endpoints
                case 'save_member_parents':
                    return $this->saveFamilyTreeSubsection($user['id'], 'member', 'parents', $input);
                case 'save_member_paternal_grandparents':
                    return $this->saveFamilyTreeSubsection($user['id'], 'member', 'paternal_grandparents', $input);
                case 'save_member_maternal_grandparents':
                    return $this->saveFamilyTreeSubsection($user['id'], 'member', 'maternal_grandparents', $input);
                case 'save_spouse_parents':
                    return $this->saveFamilyTreeSubsection($user['id'], 'spouse', 'parents', $input);
                case 'save_spouse_paternal_grandparents':
                    return $this->saveFamilyTreeSubsection($user['id'], 'spouse', 'paternal_grandparents', $input);
                case 'save_spouse_maternal_grandparents':
                    return $this->saveFamilyTreeSubsection($user['id'], 'spouse', 'maternal_grandparents', $input);
                    
                default:
                    throw new Exception('Invalid step');
            }

        } catch (Exception $e) {
            error_log("Profile Completion Error: " . $e->getMessage());
            return $this->sendResponse([
                'success' => false,
                'error' => $e->getMessage()
            ], $e->getCode() ?: 400);
        }
    }

    private function verifyAuthentication() {
        // Get session token from Authorization header with fallback
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        $authHeader = $headers['Authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        
        // Additional fallbacks for different server configurations
        if (!$authHeader) {
            foreach ($_SERVER as $name => $value) {
                if (strtolower($name) === 'http_authorization') {
                    $authHeader = $value;
                    break;
                }
            }
        }

        if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            error_log("Profile Completion Auth Error: No valid authorization header found. Headers: " . json_encode($headers));
            throw new Exception('Authorization token required', 401);
        }

        $sessionToken = $matches[1];
        $sessionUser = $this->sessionManager->getUserFromSession($sessionToken);
        
        if (!$sessionUser || $sessionUser['user_type'] !== 'user') {
            error_log("Profile Completion Auth Error: Invalid session for token: " . substr($sessionToken, 0, 8) . "...");
            throw new Exception('Invalid or expired session', 401);
        }

        $userId = $sessionUser['id'];

        // Verify user exists
        $stmt = $this->db->prepare("SELECT id, email FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            error_log("Profile Completion Auth Error: User not found with ID: " . $userId);
            throw new Exception('User not found', 404);
        }

        return $user;
    }

    private function handleBasicDetails($userId, $input) {
        $this->db->beginTransaction();

        try {
            // Save member details to user_profile
            if (isset($input['member_details'])) {
                $this->saveMemberDetails($userId, $input['member_details']);
            }

            // Save spouse details if provided
            if (isset($input['spouse_details']) && !empty($input['spouse_details'])) {
                $this->saveSpouseDetails($userId, $input['spouse_details']);
            }

            // Save children details if provided
            if (isset($input['children_details']) && !empty($input['children_details'])) {
                $this->saveChildrenDetails($userId, $input['children_details']);
            }

            // Update profile completion step
            $this->updateProfileStep($userId, 'member_family_tree');

            $this->db->commit();

            return $this->sendResponse([
                'success' => true,
                'message' => 'Basic details saved successfully'
            ]);

        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }

    private function handleFamilyTree($userId, $input) {
        $this->db->beginTransaction();

        try {
            // Save member family tree
            if (isset($input['member_family_tree'])) {
                $this->saveFamilyTree($userId, 'member', $input['member_family_tree']);
            }

            // Save spouse family tree if provided
            if (isset($input['spouse_family_tree']) && !empty($input['spouse_family_tree'])) {
                $this->saveFamilyTree($userId, 'spouse', $input['spouse_family_tree']);
            }

            // Update profile completion step to completed
            $this->updateProfileStep($userId, 'completed');

            $this->db->commit();

            return $this->sendResponse([
                'success' => true,
                'message' => 'Profile completed successfully'
            ]);

        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }

    private function saveMemberDetails($userId, $memberDetails) {
        error_log("Saving member details for user ID: $userId with data: " . json_encode($memberDetails));
        
        // Check if profile exists
        $stmt = $this->db->prepare("SELECT id FROM user_profiles WHERE user_id = ?");
        $stmt->execute([$userId]);
        $profileExists = $stmt->fetch();

        // Validate email format if provided
        if (!empty($memberDetails['email']) && !filter_var($memberDetails['email'], FILTER_VALIDATE_EMAIL)) {
            error_log("Invalid email format provided: " . $memberDetails['email']);
            throw new Exception('Invalid email format');
        }

        // Handle primary phone number - it may already include country code from frontend
        $phoneNumber = '';
        if (!empty($memberDetails['phone'])) {
            // If phone already starts with +, use as is (frontend already formatted)
            if (strpos($memberDetails['phone'], '+') === 0) {
                $phoneNumber = $memberDetails['phone'];
                error_log("Primary phone number already formatted: " . $phoneNumber);
            } else {
                // Otherwise concatenate country code and phone
                $phoneNumber = ($memberDetails['country_code'] ?? '') . ($memberDetails['phone'] ?? '');
                error_log("Primary phone number formatted from parts: " . $phoneNumber);
            }
            
            // Log final phone number length for debugging
            error_log("Final primary phone number length: " . strlen($phoneNumber) . " characters");
            
            // Ensure phone number is not too long for database column
            if (strlen($phoneNumber) > 20) {
                error_log("Primary phone number too long: " . $phoneNumber . " (length: " . strlen($phoneNumber) . ")");
                throw new Exception('Primary phone number is too long');
            }
        }

        // Handle secondary phone number (optional)
        $secondaryPhoneNumber = '';
        if (!empty($memberDetails['secondary_phone'])) {
            // If secondary phone already starts with +, use as is
            if (strpos($memberDetails['secondary_phone'], '+') === 0) {
                $secondaryPhoneNumber = $memberDetails['secondary_phone'];
                error_log("Secondary phone number already formatted: " . $secondaryPhoneNumber);
            } else {
                // Otherwise concatenate country code and phone
                $secondaryPhoneNumber = ($memberDetails['secondary_country_code'] ?? '') . ($memberDetails['secondary_phone'] ?? '');
                error_log("Secondary phone number formatted from parts: " . $secondaryPhoneNumber);
            }
            
            // Validate secondary phone number length
            if (strlen($secondaryPhoneNumber) > 20) {
                error_log("Secondary phone number too long: " . $secondaryPhoneNumber . " (length: " . strlen($secondaryPhoneNumber) . ")");
                throw new Exception('Secondary phone number is too long');
            }
        }
        
        if ($profileExists) {
            // Update existing profile
            $stmt = $this->db->prepare("
                UPDATE user_profiles SET 
                    name = ?,
                    first_name = ?,
                    second_name = ?,
                    gender = ?,
                    date_of_birth = ?,
                    phone = ?,
                    secondary_phone = ?,
                    email = ?,
                    address_line1 = ?,
                    address_line2 = ?,
                    city = ?,
                    state = ?,
                    country = ?,
                    pin_code = ?,
                    permanent_address_line1 = ?,
                    permanent_address_line2 = ?,
                    permanent_city = ?,
                    permanent_state = ?,
                    permanent_country = ?,
                    permanent_pin_code = ?,
                    same_as_current_address = ?,
                    updated_at = NOW()
                WHERE user_id = ?
            ");
            $stmt->execute([
                trim(($memberDetails['first_name'] ?? '') . ' ' . ($memberDetails['second_name'] ?? '')),
                $memberDetails['first_name'] ?? '',
                $memberDetails['second_name'] ?? '',
                $memberDetails['gender'] ?? null,
                $memberDetails['date_of_birth'] ?? null,
                $phoneNumber,
                $secondaryPhoneNumber,
                $memberDetails['email'] ?? '',
                $memberDetails['address_line1'] ?? '',
                $memberDetails['address_line2'] ?? '',
                $memberDetails['city'] ?? '',
                $memberDetails['state'] ?? '',
                $memberDetails['country'] ?? '',
                $memberDetails['pin_code'] ?? '',
                $memberDetails['permanent_address_line1'] ?? '',
                $memberDetails['permanent_address_line2'] ?? '',
                $memberDetails['permanent_city'] ?? '',
                $memberDetails['permanent_state'] ?? '',
                $memberDetails['permanent_country'] ?? '',
                $memberDetails['permanent_pin_code'] ?? '',
                isset($memberDetails['same_as_current']) ? 1 : 0,
                $userId
            ]);
        } else {
            // Insert new profile
            $stmt = $this->db->prepare("
                INSERT INTO user_profiles (
                    user_id, name, first_name, second_name, gender, date_of_birth, phone, secondary_phone, email,
                    address_line1, address_line2, city, state, country, pin_code,
                    permanent_address_line1, permanent_address_line2, permanent_city, permanent_state, permanent_country, permanent_pin_code,
                    same_as_current_address, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");
            $stmt->execute([
                $userId,
                trim(($memberDetails['first_name'] ?? '') . ' ' . ($memberDetails['second_name'] ?? '')),
                $memberDetails['first_name'] ?? '',
                $memberDetails['second_name'] ?? '',
                $memberDetails['gender'] ?? null,
                $memberDetails['date_of_birth'] ?? null,
                $phoneNumber,
                $secondaryPhoneNumber,
                $memberDetails['email'] ?? '',
                $memberDetails['address_line1'] ?? '',
                $memberDetails['address_line2'] ?? '',
                $memberDetails['city'] ?? '',
                $memberDetails['state'] ?? '',
                $memberDetails['country'] ?? '',
                $memberDetails['pin_code'] ?? '',
                $memberDetails['permanent_address_line1'] ?? '',
                $memberDetails['permanent_address_line2'] ?? '',
                $memberDetails['permanent_city'] ?? '',
                $memberDetails['permanent_state'] ?? '',
                $memberDetails['permanent_country'] ?? '',
                $memberDetails['permanent_pin_code'] ?? '',
                isset($memberDetails['same_as_current']) ? 1 : 0
            ]);
        }
    }

    private function saveSpouseDetails($userId, $spouseDetails) {
        error_log("Saving spouse details for user ID: $userId with data: " . json_encode($spouseDetails));
        
        // Validate spouse email format if provided
        if (!empty($spouseDetails['spouse_email']) && !filter_var($spouseDetails['spouse_email'], FILTER_VALIDATE_EMAIL)) {
            error_log("Invalid spouse email format provided: " . $spouseDetails['spouse_email']);
            throw new Exception('Invalid spouse email format');
        }
        
        // Delete existing spouse details
        $stmt = $this->db->prepare("DELETE FROM spouse_details WHERE user_id = ?");
        $stmt->execute([$userId]);

        // Insert new spouse details
        $stmt = $this->db->prepare("
            INSERT INTO spouse_details (
                user_id, first_name, second_name, gender, date_of_birth, phone, email,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        $stmt->execute([
            $userId,
            $spouseDetails['spouse_first_name'] ?? '',
            $spouseDetails['spouse_second_name'] ?? '',
            $spouseDetails['spouse_gender'] ?? '',
            $spouseDetails['spouse_date_of_birth'] ?? null,
            ($spouseDetails['spouse_country_code'] ?? '') . ($spouseDetails['spouse_phone'] ?? ''),
            $spouseDetails['spouse_email'] ?? null
        ]);
    }

    private function saveChildrenDetails($userId, $childrenDetails) {
        error_log("Saving children details for user ID: $userId with data: " . json_encode($childrenDetails));
        
        // Delete existing children details
        $stmt = $this->db->prepare("DELETE FROM children_details WHERE user_id = ?");
        $stmt->execute([$userId]);

        // Insert new children details
        foreach ($childrenDetails as $child) {
            if (!empty($child['child_first_name'])) {
                $stmt = $this->db->prepare("
                    INSERT INTO children_details (
                        user_id, first_name, second_name, gender, date_of_birth,
                        relationship, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
                ");
                
                $relationship = ($child['child_gender'] === 'male') ? 'son' : 'daughter';
                
                $stmt->execute([
                    $userId,
                    $child['child_first_name'] ?? '',
                    $child['child_second_name'] ?? '',
                    $child['child_gender'] ?? '',
                    $child['child_date_of_birth'] ?? null,
                    $relationship
                ]);
            }
        }
    }

    private function saveFamilyTree($userId, $treeType, $familyTreeData) {
        // Delete existing family tree data for this type
        $stmt = $this->db->prepare("DELETE FROM family_tree WHERE user_id = ? AND tree_type = ?");
        $stmt->execute([$userId, $treeType]);

        // Insert new family tree data
        $stmt = $this->db->prepare("
            INSERT INTO family_tree (
                user_id, tree_type, father_name, mother_name,
                paternal_grandfather_name, paternal_grandmother_name,
                maternal_grandfather_name, maternal_grandmother_name,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");

        // Handle field mapping based on tree type
        if ($treeType === 'spouse') {
            $fatherName = $familyTreeData['spouse_father_name'] ?? $familyTreeData['father_name'] ?? '';
            $motherName = $familyTreeData['spouse_mother_name'] ?? $familyTreeData['mother_name'] ?? '';
            $paternalGrandfatherName = $familyTreeData['spouse_paternal_grandfather_name'] ?? $familyTreeData['paternal_grandfather_name'] ?? '';
            $paternalGrandmotherName = $familyTreeData['spouse_paternal_grandmother_name'] ?? $familyTreeData['paternal_grandmother_name'] ?? '';
            $maternalGrandfatherName = $familyTreeData['spouse_maternal_grandfather_name'] ?? $familyTreeData['maternal_grandfather_name'] ?? '';
            $maternalGrandmotherName = $familyTreeData['spouse_maternal_grandmother_name'] ?? $familyTreeData['maternal_grandmother_name'] ?? '';
        } else {
            $fatherName = $familyTreeData['father_name'] ?? '';
            $motherName = $familyTreeData['mother_name'] ?? '';
            $paternalGrandfatherName = $familyTreeData['paternal_grandfather_name'] ?? '';
            $paternalGrandmotherName = $familyTreeData['paternal_grandmother_name'] ?? '';
            $maternalGrandfatherName = $familyTreeData['maternal_grandfather_name'] ?? '';
            $maternalGrandmotherName = $familyTreeData['maternal_grandmother_name'] ?? '';
        }

        $stmt->execute([
            $userId,
            $treeType,
            $fatherName,
            $motherName,
            $paternalGrandfatherName,
            $paternalGrandmotherName,
            $maternalGrandfatherName,
            $maternalGrandmotherName
        ]);
    }

    private function handleMemberDetails($userId, $input) {
        $this->db->beginTransaction();
        
        try {
            if (isset($input['member_details'])) {
                $this->saveMemberDetails($userId, $input['member_details']);
            }
            
            $this->db->commit();
            
            return $this->sendResponse([
                'success' => true,
                'message' => 'Member details saved successfully'
            ]);
            
        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }
    
    private function handleSpouseDetails($userId, $input) {
        $this->db->beginTransaction();
        
        try {
            if (isset($input['spouse_details'])) {
                $this->saveSpouseDetails($userId, $input['spouse_details']);
            }
            
            $this->db->commit();
            
            return $this->sendResponse([
                'success' => true,
                'message' => 'Spouse details saved successfully'
            ]);
            
        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }
    
    private function handleChildrenDetails($userId, $input) {
        $this->db->beginTransaction();
        
        try {
            if (isset($input['children_details'])) {
                $this->saveChildrenDetails($userId, $input['children_details']);
            }
            
            $this->db->commit();
            
            return $this->sendResponse([
                'success' => true,
                'message' => 'Children details saved successfully'
            ]);
            
        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }
    
    private function handleMemberFamilyTree($userId, $input) {
        $this->db->beginTransaction();
        
        try {
            if (isset($input['member_family_tree'])) {
                $this->saveFamilyTree($userId, 'member', $input['member_family_tree']);
            }
            
            $this->db->commit();
            
            return $this->sendResponse([
                'success' => true,
                'message' => 'Member family tree saved successfully'
            ]);
            
        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }
    
    private function handleSpouseFamilyTree($userId, $input) {
        $this->db->beginTransaction();
        
        try {
            if (isset($input['spouse_family_tree'])) {
                $this->saveFamilyTree($userId, 'spouse', $input['spouse_family_tree']);
            }
            
            $this->db->commit();
            
            return $this->sendResponse([
                'success' => true,
                'message' => 'Spouse family tree saved successfully'
            ]);
            
        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }
    
    private function handleCompleteProfile($userId) {
        $this->db->beginTransaction();
        
        try {
            // Mark profile as completed
            $this->updateProfileStep($userId, 'completed');
            
            $this->db->commit();
            
            return $this->sendResponse([
                'success' => true,
                'message' => 'Profile completed successfully'
            ]);
            
        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }

    private function updateProfileStep($userId, $step) {
        if ($step === 'completed') {
            // When profile is completed, update both completion step and profile_completed flag
            $stmt = $this->db->prepare("
                UPDATE user_profiles 
                SET profile_completion_step = ?, profile_completed = TRUE, updated_at = NOW() 
                WHERE user_id = ?
            ");
            $stmt->execute([$step, $userId]);
            
            // Also update the users table profile_completed flag for backward compatibility
            $stmt = $this->db->prepare("
                UPDATE users 
                SET profile_completed = TRUE 
                WHERE id = ?
            ");
            $stmt->execute([$userId]);
        } else {
            // For other steps, just update the completion step
            $stmt = $this->db->prepare("
                UPDATE user_profiles 
                SET profile_completion_step = ?, updated_at = NOW() 
                WHERE user_id = ?
            ");
            $stmt->execute([$step, $userId]);
        }
    }

    private function getSpouseDetails($userId) {
        $stmt = $this->db->prepare("SELECT * FROM spouse_details WHERE user_id = ?");
        $stmt->execute([$userId]);
        $spouse = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($spouse) {
            return $this->sendResponse([
                'success' => true,
                'spouse' => $spouse
            ]);
        } else {
            return $this->sendResponse([
                'success' => false,
                'message' => 'No spouse details found'
            ]);
        }
    }
    
    private function getChildrenDetails($userId) {
        $stmt = $this->db->prepare("SELECT * FROM children_details WHERE user_id = ? ORDER BY id");
        $stmt->execute([$userId]);
        $children = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return $this->sendResponse([
            'success' => true,
            'children' => $children
        ]);
    }
    
    private function getMemberFamilyTree($userId) {
        $stmt = $this->db->prepare("SELECT * FROM family_tree WHERE user_id = ? AND tree_type = 'member'");
        $stmt->execute([$userId]);
        $familyTree = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($familyTree) {
            return $this->sendResponse([
                'success' => true,
                'family_tree' => $familyTree
            ]);
        } else {
            return $this->sendResponse([
                'success' => false,
                'message' => 'No member family tree found'
            ]);
        }
    }
    
    private function getSpouseFamilyTree($userId) {
        $stmt = $this->db->prepare("SELECT * FROM family_tree WHERE user_id = ? AND tree_type = 'spouse'");
        $stmt->execute([$userId]);
        $familyTree = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($familyTree) {
            return $this->sendResponse([
                'success' => true,
                'family_tree' => $familyTree
            ]);
        } else {
            return $this->sendResponse([
                'success' => false,
                'message' => 'No spouse family tree found'
            ]);
        }
    }

    private function saveFamilyTreeSubsection($userId, $treeType, $subsection, $input) {
        error_log("Saving family tree subsection for user ID: $userId, tree type: $treeType, subsection: $subsection with data: " . json_encode($input));
        
        $this->db->beginTransaction();
        
        try {
            $data = $input['data'] ?? [];
            
            if (empty($data)) {
                error_log("No data provided for family tree subsection save");
                throw new Exception('No data provided for family tree subsection');
            }
            
            // Get or create family tree record
            $stmt = $this->db->prepare("SELECT * FROM family_tree WHERE user_id = ? AND tree_type = ?");
            $stmt->execute([$userId, $treeType]);
            $existingRecord = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($existingRecord) {
                // Update specific fields based on subsection
                $updateFields = $this->getFamilyTreeUpdateFields($subsection, $data);
                if (!empty($updateFields)) {
                    $setClause = implode(', ', array_map(fn($field) => "$field = ?", array_keys($updateFields)));
                    $stmt = $this->db->prepare("
                        UPDATE family_tree 
                        SET $setClause, updated_at = NOW() 
                        WHERE user_id = ? AND tree_type = ?
                    ");
                    $stmt->execute([...array_values($updateFields), $userId, $treeType]);
                }
            } else {
                // Create new record with the subsection data
                $insertData = $this->getFamilyTreeInsertData($subsection, $data);
                $stmt = $this->db->prepare("
                    INSERT INTO family_tree (
                        user_id, tree_type, father_name, mother_name,
                        paternal_grandfather_name, paternal_grandmother_name,
                        maternal_grandfather_name, maternal_grandmother_name,
                        created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                ");
                $stmt->execute([
                    $userId,
                    $treeType,
                    $insertData['father_name'] ?? '',
                    $insertData['mother_name'] ?? '',
                    $insertData['paternal_grandfather_name'] ?? '',
                    $insertData['paternal_grandmother_name'] ?? '',
                    $insertData['maternal_grandfather_name'] ?? '',
                    $insertData['maternal_grandmother_name'] ?? ''
                ]);
            }
            
            $this->db->commit();
            
            return $this->sendResponse([
                'success' => true,
                'message' => ucfirst(str_replace('_', ' ', $subsection)) . ' saved successfully'
            ]);
            
        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }
    
    private function getFamilyTreeUpdateFields($subsection, $data) {
        switch ($subsection) {
            case 'parents':
                return [
                    'father_name' => $data['father_name'] ?? '',
                    'mother_name' => $data['mother_name'] ?? ''
                ];
            case 'paternal_grandparents':
                return [
                    'paternal_grandfather_name' => $data['paternal_grandfather_name'] ?? '',
                    'paternal_grandmother_name' => $data['paternal_grandmother_name'] ?? ''
                ];
            case 'maternal_grandparents':
                return [
                    'maternal_grandfather_name' => $data['maternal_grandfather_name'] ?? '',
                    'maternal_grandmother_name' => $data['maternal_grandmother_name'] ?? ''
                ];
            default:
                return [];
        }
    }
    
    private function getFamilyTreeInsertData($subsection, $data) {
        $insertData = [
            'father_name' => '',
            'mother_name' => '',
            'paternal_grandfather_name' => '',
            'paternal_grandmother_name' => '',
            'maternal_grandfather_name' => '',
            'maternal_grandmother_name' => ''
        ];
        
        $updateFields = $this->getFamilyTreeUpdateFields($subsection, $data);
        return array_merge($insertData, $updateFields);
    }

    private function sendResponse($data, $statusCode = 200) {
        http_response_code($statusCode);
        echo json_encode($data);
        exit();
    }
}

// Handle the request
$handler = new ProfileCompletionHandler();
$handler->handleRequest();
?>
