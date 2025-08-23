<?php
/**
 * Extended Profile Data API Endpoint
 * Handles education, profession, and kulam details
 */

require_once '../../config/database.php';
require_once '../../config/session.php';

// Set content type to JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

class ExtendedProfileHandler {
    private $db;
    private $sessionManager;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
        $this->sessionManager = SessionManager::getInstance();
    }

    public function handleRequest() {
        try {
            // Verify user authentication
            $user = $this->verifyAuthentication();

            // Handle different request methods
            switch ($_SERVER['REQUEST_METHOD']) {
                case 'GET':
                    return $this->handleGet($user['id']);
                case 'POST':
                    return $this->handlePost($user['id']);
                case 'PUT':
                    return $this->handlePut($user['id']);
                case 'DELETE':
                    return $this->handleDelete($user['id']);
                default:
                    throw new Exception('Method not allowed', 405);
            }

        } catch (Exception $e) {
            error_log("Extended Profile Error: " . $e->getMessage());
            return $this->sendResponse([
                'success' => false,
                'error' => $e->getMessage()
            ], $e->getCode() ?: 400);
        }
    }

    private function verifyAuthentication() {
        // Get session token from Authorization header
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        $authHeader = $headers['Authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        
        if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            throw new Exception('Authorization token required', 401);
        }

        $sessionToken = $matches[1];
        $sessionUser = $this->sessionManager->getUserFromSession($sessionToken);
        
        if (!$sessionUser || $sessionUser['user_type'] !== 'user') {
            throw new Exception('Invalid or expired session', 401);
        }

        // Verify user exists
        $stmt = $this->db->prepare("SELECT id, email FROM users WHERE id = ?");
        $stmt->execute([$sessionUser['id']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            throw new Exception('User not found', 404);
        }

        return $user;
    }

    private function handleGet($userId) {
        $action = $_GET['action'] ?? '';
        
        switch ($action) {
            case 'education':
                return $this->getEducationData($userId);
            case 'profession':
                return $this->getProfessionData($userId);
            case 'kulam':
                return $this->getKulamData($userId);
            case 'family_additional':
                return $this->getFamilyAdditionalData($userId);
            case 'all':
                return $this->getAllExtendedData($userId);
            default:
                throw new Exception('Invalid action for GET request');
        }
    }

    private function handlePost($userId) {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            throw new Exception('Invalid JSON input');
        }

        $action = $input['action'] ?? '';
        
        switch ($action) {
            case 'save_education':
                return $this->saveEducationData($userId, $input);
            case 'save_profession':
                return $this->saveProfessionData($userId, $input);
            case 'save_kulam':
                return $this->saveKulamData($userId, $input);
            case 'save_family_additional':
                return $this->saveFamilyAdditionalData($userId, $input);
            case 'save_all':
                return $this->saveAllExtendedData($userId, $input);
            default:
                throw new Exception('Invalid action for POST request');
        }
    }

    private function saveEducationData($userId, $input) {
        $this->db->beginTransaction();

        try {
            $educationData = $input['education_data'] ?? [];
            $familyMemberType = $input['family_member_type'] ?? 'member';
            $familyMemberIndex = $input['family_member_index'] ?? null;

            // Delete existing education data for this family member
            $stmt = $this->db->prepare("
                DELETE FROM user_education 
                WHERE user_id = ? AND family_member_type = ? 
                AND (family_member_index = ? OR (family_member_index IS NULL AND ? IS NULL))
            ");
            $stmt->execute([$userId, $familyMemberType, $familyMemberIndex, $familyMemberIndex]);

            // Insert new education data
            $stmt = $this->db->prepare("
                INSERT INTO user_education (
                    user_id, family_member_type, family_member_index, 
                    degree, department, institution, year_of_completion
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ");

            foreach ($educationData as $education) {
                if (!empty($education['degree'])) {
                    $stmt->execute([
                        $userId,
                        $familyMemberType,
                        $familyMemberIndex,
                        $education['degree'],
                        $education['department'] ?? null,
                        $education['institution'] ?? null,
                        !empty($education['year_of_completion']) ? intval($education['year_of_completion']) : null
                    ]);
                }
            }

            $this->db->commit();

            return $this->sendResponse([
                'success' => true,
                'message' => 'Education data saved successfully'
            ]);

        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }

    private function saveProfessionData($userId, $input) {
        $this->db->beginTransaction();

        try {
            $professionData = $input['profession_data'] ?? [];
            $familyMemberType = $input['family_member_type'] ?? 'member';
            $familyMemberIndex = $input['family_member_index'] ?? null;

            // Delete existing profession data for this family member
            $stmt = $this->db->prepare("
                DELETE FROM user_profession 
                WHERE user_id = ? AND family_member_type = ? 
                AND (family_member_index = ? OR (family_member_index IS NULL AND ? IS NULL))
            ");
            $stmt->execute([$userId, $familyMemberType, $familyMemberIndex, $familyMemberIndex]);

            // Insert new profession data
            $stmt = $this->db->prepare("
                INSERT INTO user_profession (
                    user_id, family_member_type, family_member_index, 
                    job_type, job_type_other, company_name, position, 
                    experience_years, experience_months
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            foreach ($professionData as $profession) {
                if (!empty($profession['job_type'])) {
                    $stmt->execute([
                        $userId,
                        $familyMemberType,
                        $familyMemberIndex,
                        $profession['job_type'],
                        $profession['job_type'] === 'Others' ? ($profession['job_type_other'] ?? null) : null,
                        $profession['company_name'] ?? null,
                        $profession['position'] ?? null,
                        intval($profession['experience_years'] ?? 0),
                        intval($profession['experience_months'] ?? 0)
                    ]);
                }
            }

            $this->db->commit();

            return $this->sendResponse([
                'success' => true,
                'message' => 'Profession data saved successfully'
            ]);

        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }

    private function saveKulamData($userId, $input) {
        $this->db->beginTransaction();

        try {
            $kulamData = $input['kulam_data'] ?? [];
            $familyMemberType = $input['family_member_type'] ?? 'member';
            $familyMemberIndex = $input['family_member_index'] ?? null;
            $familyMemberSubtype = $input['family_member_subtype'] ?? null;

            // Delete existing kulam data for this family member
            $stmt = $this->db->prepare("
                DELETE FROM user_kulam_details 
                WHERE user_id = ? AND family_member_type = ? 
                AND (family_member_index = ? OR (family_member_index IS NULL AND ? IS NULL))
                AND (family_member_subtype = ? OR (family_member_subtype IS NULL AND ? IS NULL))
            ");
            $stmt->execute([$userId, $familyMemberType, $familyMemberIndex, $familyMemberIndex, $familyMemberSubtype, $familyMemberSubtype]);

            // Insert new kulam data
            if (!empty($kulamData)) {
                $stmt = $this->db->prepare("
                    INSERT INTO user_kulam_details (
                        user_id, family_member_type, family_member_index, family_member_subtype,
                        kulam, kulam_other, kula_deivam, kula_deivam_other, kaani, kaani_other
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");

                $stmt->execute([
                    $userId,
                    $familyMemberType,
                    $familyMemberIndex,
                    $familyMemberSubtype,
                    $kulamData['kulam'] ?? null,
                    $kulamData['kulam'] === 'Other' ? ($kulamData['kulam_other'] ?? null) : null,
                    $kulamData['kula_deivam'] ?? null,
                    $kulamData['kula_deivam'] === 'Other' ? ($kulamData['kula_deivam_other'] ?? null) : null,
                    $kulamData['kaani'] ?? null,
                    $kulamData['kaani'] === 'Other' ? ($kulamData['kaani_other'] ?? null) : null
                ]);
            }

            $this->db->commit();

            return $this->sendResponse([
                'success' => true,
                'message' => 'Kulam data saved successfully'
            ]);

        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }

    private function saveFamilyAdditionalData($userId, $input) {
        $this->db->beginTransaction();

        try {
            $familyData = $input['family_data'] ?? [];
            $familyMemberType = $input['family_member_type'] ?? 'parent';
            $familyMemberSubtype = $input['family_member_subtype'] ?? '';

            // Delete existing family additional data for this family member
            $stmt = $this->db->prepare("
                DELETE FROM user_family_additional_details 
                WHERE user_id = ? AND family_member_type = ? AND family_member_subtype = ?
            ");
            $stmt->execute([$userId, $familyMemberType, $familyMemberSubtype]);

            // Insert new family additional data
            if (!empty($familyData)) {
                $stmt = $this->db->prepare("
                    INSERT INTO user_family_additional_details (
                        user_id, family_member_type, family_member_subtype,
                        native_place, place_of_residence, same_as_native, live_status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                ");

                $stmt->execute([
                    $userId,
                    $familyMemberType,
                    $familyMemberSubtype,
                    $familyData['native_place'] ?? null,
                    $familyData['place_of_residence'] ?? null,
                    !empty($familyData['same_as_native']) ? 1 : 0,
                    $familyData['live_status'] ?? null
                ]);
            }

            $this->db->commit();

            return $this->sendResponse([
                'success' => true,
                'message' => 'Family additional data saved successfully'
            ]);

        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }

    private function saveAllExtendedData($userId, $input) {
        $this->db->beginTransaction();

        try {
            // Save education data if provided
            if (isset($input['education_data']) && !empty($input['education_data'])) {
                $educationInput = array_merge($input, ['education_data' => $input['education_data']]);
                $this->saveEducationData($userId, $educationInput);
            }

            // Save profession data if provided
            if (isset($input['profession_data']) && !empty($input['profession_data'])) {
                $professionInput = array_merge($input, ['profession_data' => $input['profession_data']]);
                $this->saveProfessionData($userId, $professionInput);
            }

            // Save kulam data if provided
            if (isset($input['kulam_data']) && !empty($input['kulam_data'])) {
                $kulamInput = array_merge($input, ['kulam_data' => $input['kulam_data']]);
                $this->saveKulamData($userId, $kulamInput);
            }

            $this->db->commit();

            return $this->sendResponse([
                'success' => true,
                'message' => 'All extended profile data saved successfully'
            ]);

        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }

    private function saveFamilyAdditionalData($userId, $input) {
        $this->db->beginTransaction();

        try {
            $familyData = $input['family_data'] ?? [];
            $familyMemberType = $input['family_member_type'] ?? 'parent';
            $familyMemberSubtype = $input['family_member_subtype'] ?? '';

            // Delete existing family additional data for this family member
            $stmt = $this->db->prepare("
                DELETE FROM user_family_additional_details 
                WHERE user_id = ? AND family_member_type = ? AND family_member_subtype = ?
            ");
            $stmt->execute([$userId, $familyMemberType, $familyMemberSubtype]);

            // Insert new family additional data
            if (!empty($familyData)) {
                $stmt = $this->db->prepare("
                    INSERT INTO user_family_additional_details (
                        user_id, family_member_type, family_member_subtype,
                        native_place, place_of_residence, same_as_native, live_status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                ");

                $stmt->execute([
                    $userId,
                    $familyMemberType,
                    $familyMemberSubtype,
                    $familyData['native_place'] ?? null,
                    $familyData['place_of_residence'] ?? null,
                    !empty($familyData['same_as_native']) ? 1 : 0,
                    $familyData['live_status'] ?? null
                ]);
            }

            $this->db->commit();

            return $this->sendResponse([
                'success' => true,
                'message' => 'Family additional data saved successfully'
            ]);

        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }

    private function getEducationData($userId) {
        $stmt = $this->db->prepare("
            SELECT * FROM user_education 
            WHERE user_id = ? 
            ORDER BY family_member_type, family_member_index, year_of_completion DESC
        ");
        $stmt->execute([$userId]);
        $education = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return $this->sendResponse([
            'success' => true,
            'education' => $education
        ]);
    }

    private function getProfessionData($userId) {
        $stmt = $this->db->prepare("
            SELECT * FROM user_profession 
            WHERE user_id = ? 
            ORDER BY family_member_type, family_member_index, experience_years DESC
        ");
        $stmt->execute([$userId]);
        $profession = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return $this->sendResponse([
            'success' => true,
            'profession' => $profession
        ]);
    }

    private function getKulamData($userId) {
        $stmt = $this->db->prepare("
            SELECT * FROM user_kulam_details 
            WHERE user_id = ? 
            ORDER BY family_member_type, family_member_index
        ");
        $stmt->execute([$userId]);
        $kulam = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return $this->sendResponse([
            'success' => true,
            'kulam' => $kulam
        ]);
    }

    private function getFamilyAdditionalData($userId) {
        $stmt = $this->db->prepare("
            SELECT * FROM user_family_additional_details 
            WHERE user_id = ? 
            ORDER BY family_member_type, family_member_subtype
        ");
        $stmt->execute([$userId]);
        $familyData = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return $this->sendResponse([
            'success' => true,
            'family_additional' => $familyData
        ]);
    }

    private function getAllExtendedData($userId) {
        $education = $this->getEducationData($userId);
        $profession = $this->getProfessionData($userId);
        $kulam = $this->getKulamData($userId);
        $familyAdditional = $this->getFamilyAdditionalData($userId);

        return $this->sendResponse([
            'success' => true,
            'data' => [
                'education' => json_decode($education, true)['education'] ?? [],
                'profession' => json_decode($profession, true)['profession'] ?? [],
                'kulam' => json_decode($kulam, true)['kulam'] ?? [],
                'family_additional' => json_decode($familyAdditional, true)['family_additional'] ?? []
            ]
        ]);
    }

    private function sendResponse($data, $statusCode = 200) {
        http_response_code($statusCode);
        echo json_encode($data);
        exit();
    }
}

// Handle the request
$handler = new ExtendedProfileHandler();
$handler->handleRequest();
?>
