-- Form Values Migration Script
-- Version: 001
-- Description: Create form_values table with initial data for dropdown options and relationships
-- Date: 2024-01-01

-- Create form_values table
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Clear existing data (for re-running migration)
DELETE FROM form_values;

-- Reset auto increment
ALTER TABLE form_values AUTO_INCREMENT = 1;

-- Insert Kulam values
INSERT INTO form_values (type, value) VALUES
('kulam', 'Agastya'),
('kulam', 'Angirasa'),
('kulam', 'Atri'),
('kulam', 'Bharadwaja'),
('kulam', 'Bhrigu'),
('kulam', 'Gautama'),
('kulam', 'Jamadagni'),
('kulam', 'Kashyapa'),
('kulam', 'Kaundinya'),
('kulam', 'Vasishta'),
('kulam', 'Viswamitra'),
('kulam', 'Vatsya');

-- Insert Kula Deivam values
INSERT INTO form_values (type, value) VALUES
('kulaDeivam', 'Murugan'),
('kulaDeivam', 'Ganesha'),
('kulaDeivam', 'Shiva'),
('kulaDeivam', 'Vishnu'),
('kulaDeivam', 'Devi'),
('kulaDeivam', 'Hanuman'),
('kulaDeivam', 'Krishna'),
('kulaDeivam', 'Rama'),
('kulaDeivam', 'Lakshmi'),
('kulaDeivam', 'Saraswati');

-- Insert Kaani values with relationships to Kula Deivam
INSERT INTO form_values (type, value, parent_id) VALUES
-- Murugan related Kaanis (parent_id: 13)
('kaani', 'Palani', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'kulaDeivam' AND value = 'Murugan') AS temp)),
('kaani', 'Tiruchendur', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'kulaDeivam' AND value = 'Murugan') AS temp)),
('kaani', 'Thiruparankundram', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'kulaDeivam' AND value = 'Murugan') AS temp)),
('kaani', 'Swamimalai', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'kulaDeivam' AND value = 'Murugan') AS temp)),
('kaani', 'Thiruthani', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'kulaDeivam' AND value = 'Murugan') AS temp)),
('kaani', 'Pazhamudircholai', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'kulaDeivam' AND value = 'Murugan') AS temp)),

-- Ganesha related Kaanis (parent_id: 14)
('kaani', 'Pillayarpatti', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'kulaDeivam' AND value = 'Ganesha') AS temp)),
('kaani', 'Thiruvindalur', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'kulaDeivam' AND value = 'Ganesha') AS temp)),
('kaani', 'Kanchipuram Ekambareswarar', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'kulaDeivam' AND value = 'Ganesha') AS temp)),

-- Shiva related Kaanis (parent_id: 15)
('kaani', 'Chidambaram', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'kulaDeivam' AND value = 'Shiva') AS temp)),
('kaani', 'Madurai Meenakshi', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'kulaDeivam' AND value = 'Shiva') AS temp)),
('kaani', 'Rameswaram', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'kulaDeivam' AND value = 'Shiva') AS temp)),
('kaani', 'Thanjavur Brihadeeswara', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'kulaDeivam' AND value = 'Shiva') AS temp)),

-- Vishnu related Kaanis (parent_id: 16)
('kaani', 'Tirupati', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'kulaDeivam' AND value = 'Vishnu') AS temp)),
('kaani', 'Srirangam', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'kulaDeivam' AND value = 'Vishnu') AS temp)),
('kaani', 'Kanchipuram Varadaraja', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'kulaDeivam' AND value = 'Vishnu') AS temp)),
('kaani', 'Tirumala', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'kulaDeivam' AND value = 'Vishnu') AS temp)),

-- Devi related Kaanis (parent_id: 17)
('kaani', 'Meenakshi Amman', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'kulaDeivam' AND value = 'Devi') AS temp)),
('kaani', 'Kamakshi Amman', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'kulaDeivam' AND value = 'Devi') AS temp)),
('kaani', 'Mariamman', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'kulaDeivam' AND value = 'Devi') AS temp));

-- Insert Degree values
INSERT INTO form_values (type, value) VALUES
('degree', 'Bachelor of Engineering'),
('degree', 'Master of Engineering'),
('degree', 'Bachelor of Technology'),
('degree', 'Master of Technology'),
('degree', 'Bachelor of Science'),
('degree', 'Master of Science'),
('degree', 'Bachelor of Arts'),
('degree', 'Master of Arts'),
('degree', 'Bachelor of Commerce'),
('degree', 'Master of Commerce'),
('degree', 'Bachelor of Computer Applications'),
('degree', 'Master of Computer Applications'),
('degree', 'Bachelor of Business Administration'),
('degree', 'Master of Business Administration'),
('degree', 'Doctor of Philosophy'),
('degree', 'Bachelor of Medicine'),
('degree', 'Master of Medicine'),
('degree', 'Bachelor of Laws'),
('degree', 'Master of Laws'),
('degree', 'Diploma');

-- Insert Department values with relationships to Degrees
INSERT INTO form_values (type, value, parent_id) VALUES
-- Engineering Departments (Bachelor of Engineering - parent_id varies, need to calculate)
('department', 'Computer Science Engineering', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'degree' AND value = 'Bachelor of Engineering') AS temp)),
('department', 'Electronics and Communication Engineering', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'degree' AND value = 'Bachelor of Engineering') AS temp)),
('department', 'Mechanical Engineering', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'degree' AND value = 'Bachelor of Engineering') AS temp)),
('department', 'Civil Engineering', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'degree' AND value = 'Bachelor of Engineering') AS temp)),
('department', 'Electrical and Electronics Engineering', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'degree' AND value = 'Bachelor of Engineering') AS temp)),
('department', 'Chemical Engineering', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'degree' AND value = 'Bachelor of Engineering') AS temp)),
('department', 'Aerospace Engineering', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'degree' AND value = 'Bachelor of Engineering') AS temp)),
('department', 'Biomedical Engineering', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'degree' AND value = 'Bachelor of Engineering') AS temp)),

-- Master of Engineering Departments
('department', 'Advanced Computer Science', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'degree' AND value = 'Master of Engineering') AS temp)),
('department', 'VLSI Design', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'degree' AND value = 'Master of Engineering') AS temp)),
('department', 'Structural Engineering', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'degree' AND value = 'Master of Engineering') AS temp)),
('department', 'Thermal Engineering', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'degree' AND value = 'Master of Engineering') AS temp)),

-- Technology Departments (Bachelor of Technology)
('department', 'Information Technology', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'degree' AND value = 'Bachelor of Technology') AS temp)),
('department', 'Computer Science and Technology', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'degree' AND value = 'Bachelor of Technology') AS temp)),
('department', 'Electronics and Communication Technology', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'degree' AND value = 'Bachelor of Technology') AS temp)),

-- Science Departments (Bachelor of Science)
('department', 'Mathematics', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'degree' AND value = 'Bachelor of Science') AS temp)),
('department', 'Physics', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'degree' AND value = 'Bachelor of Science') AS temp)),
('department', 'Chemistry', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'degree' AND value = 'Bachelor of Science') AS temp)),
('department', 'Biology', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'degree' AND value = 'Bachelor of Science') AS temp)),
('department', 'Computer Science', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'degree' AND value = 'Bachelor of Science') AS temp)),
('department', 'Statistics', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'degree' AND value = 'Bachelor of Science') AS temp)),

-- Arts Departments (Bachelor of Arts)
('department', 'English Literature', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'degree' AND value = 'Bachelor of Arts') AS temp)),
('department', 'Tamil Literature', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'degree' AND value = 'Bachelor of Arts') AS temp)),
('department', 'History', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'degree' AND value = 'Bachelor of Arts') AS temp)),
('department', 'Political Science', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'degree' AND value = 'Bachelor of Arts') AS temp)),
('department', 'Economics', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'degree' AND value = 'Bachelor of Arts') AS temp)),
('department', 'Psychology', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'degree' AND value = 'Bachelor of Arts') AS temp)),

-- Commerce Departments (Bachelor of Commerce)
('department', 'Accounting and Finance', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'degree' AND value = 'Bachelor of Commerce') AS temp)),
('department', 'Banking and Insurance', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'degree' AND value = 'Bachelor of Commerce') AS temp)),
('department', 'Business Administration', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'degree' AND value = 'Bachelor of Commerce') AS temp)),
('department', 'Corporate Secretaryship', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'degree' AND value = 'Bachelor of Commerce') AS temp)),

-- Computer Applications (BCA/MCA)
('department', 'Software Development', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'degree' AND value = 'Bachelor of Computer Applications') AS temp)),
('department', 'Web Technologies', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'degree' AND value = 'Bachelor of Computer Applications') AS temp)),
('department', 'Database Management', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'degree' AND value = 'Bachelor of Computer Applications') AS temp)),

-- MBA Specializations
('department', 'Marketing', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'degree' AND value = 'Master of Business Administration') AS temp)),
('department', 'Finance', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'degree' AND value = 'Master of Business Administration') AS temp)),
('department', 'Human Resources', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'degree' AND value = 'Master of Business Administration') AS temp)),
('department', 'Operations Management', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'degree' AND value = 'Master of Business Administration') AS temp)),
('department', 'Information Technology', (SELECT id FROM (SELECT id FROM form_values WHERE type = 'degree' AND value = 'Master of Business Administration') AS temp));

-- Insert Institution values
INSERT INTO form_values (type, value) VALUES
('institution', 'Anna University'),
('institution', 'IIT Madras'),
('institution', 'IIT Delhi'),
('institution', 'IIT Bombay'),
('institution', 'IIT Kanpur'),
('institution', 'IIT Kharagpur'),
('institution', 'IISc Bangalore'),
('institution', 'VIT University'),
('institution', 'SRM University'),
('institution', 'Madras University'),
('institution', 'Bharathiar University'),
('institution', 'Madurai Kamaraj University'),
('institution', 'Periyar University'),
('institution', 'Annamalai University'),
('institution', 'Bharathidasan University'),
('institution', 'Manonmaniam Sundaranar University'),
('institution', 'Tamil Nadu Open University'),
('institution', 'Vellore Institute of Technology'),
('institution', 'Amrita Vishwa Vidyapeetham'),
('institution', 'Kalasalingam University'),
('institution', 'Karunya University'),
('institution', 'Loyola College'),
('institution', 'Stella Maris College'),
('institution', 'Presidency College'),
('institution', 'PSG College of Technology'),
('institution', 'Coimbatore Institute of Technology'),
('institution', 'Thiagarajar College of Engineering'),
('institution', 'SSN College of Engineering'),
('institution', 'CEG Campus'),
('institution', 'MIT Campus');

-- Insert Company values
INSERT INTO form_values (type, value) VALUES
('company', 'Tata Consultancy Services'),
('company', 'Infosys'),
('company', 'Wipro'),
('company', 'Cognizant'),
('company', 'HCL Technologies'),
('company', 'Tech Mahindra'),
('company', 'Accenture'),
('company', 'IBM'),
('company', 'Google'),
('company', 'Microsoft'),
('company', 'Amazon'),
('company', 'Oracle'),
('company', 'SAP'),
('company', 'Zoho Corporation'),
('company', 'Freshworks'),
('company', 'HDFC Bank'),
('company', 'ICICI Bank'),
('company', 'State Bank of India'),
('company', 'Axis Bank'),
('company', 'Kotak Mahindra Bank'),
('company', 'HDFC Ltd'),
('company', 'Reliance Industries'),
('company', 'Tata Group'),
('company', 'Aditya Birla Group'),
('company', 'ITC Limited'),
('company', 'Larsen & Toubro'),
('company', 'Mahindra Group'),
('company', 'Bajaj Group'),
('company', 'TVS Group'),
('company', 'Ashok Leyland'),
('company', 'Ford India'),
('company', 'Hyundai Motor India'),
('company', 'Maruti Suzuki'),
('company', 'Hero MotoCorp'),
('company', 'Apollo Hospitals'),
('company', 'Dr. Reddy\'s Laboratories'),
('company', 'Sun Pharmaceutical'),
('company', 'Cipla'),
('company', 'Biocon'),
('company', 'Government of Tamil Nadu'),
('company', 'Government of India'),
('company', 'Indian Railways'),
('company', 'Indian Army'),
('company', 'Indian Navy'),
('company', 'Indian Air Force'),
('company', 'Reserve Bank of India'),
('company', 'Life Insurance Corporation'),
('company', 'Oil and Natural Gas Corporation'),
('company', 'Indian Oil Corporation'),
('company', 'Bharat Petroleum');

-- Insert Position values
INSERT INTO form_values (type, value) VALUES
('position', 'Software Engineer'),
('position', 'Senior Software Engineer'),
('position', 'Lead Software Engineer'),
('position', 'Principal Software Engineer'),
('position', 'Software Architect'),
('position', 'Tech Lead'),
('position', 'Engineering Manager'),
('position', 'Senior Engineering Manager'),
('position', 'Director of Engineering'),
('position', 'Vice President of Engineering'),
('position', 'Chief Technology Officer'),
('position', 'Project Manager'),
('position', 'Senior Project Manager'),
('position', 'Program Manager'),
('position', 'Product Manager'),
('position', 'Senior Product Manager'),
('position', 'Product Owner'),
('position', 'Business Analyst'),
('position', 'Senior Business Analyst'),
('position', 'Data Scientist'),
('position', 'Senior Data Scientist'),
('position', 'Data Analyst'),
('position', 'Machine Learning Engineer'),
('position', 'DevOps Engineer'),
('position', 'Senior DevOps Engineer'),
('position', 'Site Reliability Engineer'),
('position', 'Quality Assurance Engineer'),
('position', 'Test Engineer'),
('position', 'Automation Engineer'),
('position', 'UI/UX Designer'),
('position', 'Frontend Developer'),
('position', 'Backend Developer'),
('position', 'Full Stack Developer'),
('position', 'Mobile App Developer'),
('position', 'Database Administrator'),
('position', 'System Administrator'),
('position', 'Network Engineer'),
('position', 'Cybersecurity Analyst'),
('position', 'Cloud Architect'),
('position', 'Solutions Architect'),
('position', 'Consultant'),
('position', 'Senior Consultant'),
('position', 'Principal Consultant'),
('position', 'Team Lead'),
('position', 'Department Head'),
('position', 'General Manager'),
('position', 'Assistant General Manager'),
('position', 'Deputy General Manager'),
('position', 'Chief Executive Officer'),
('position', 'Chief Operating Officer'),
('position', 'Chief Financial Officer'),
('position', 'Chief Human Resources Officer'),
('position', 'Vice President'),
('position', 'Assistant Vice President'),
('position', 'Deputy Vice President'),
('position', 'Director'),
('position', 'Assistant Director'),
('position', 'Senior Manager'),
('position', 'Manager'),
('position', 'Assistant Manager'),
('position', 'Officer'),
('position', 'Senior Officer'),
('position', 'Executive'),
('position', 'Senior Executive'),
('position', 'Associate'),
('position', 'Senior Associate'),
('position', 'Analyst'),
('position', 'Senior Analyst'),
('position', 'Specialist'),
('position', 'Senior Specialist'),
('position', 'Coordinator'),
('position', 'Administrator'),
('position', 'Supervisor'),
('position', 'Team Leader'),
('position', 'Research Scientist'),
('position', 'Research Engineer'),
('position', 'Professor'),
('position', 'Associate Professor'),
('position', 'Assistant Professor'),
('position', 'Lecturer'),
('position', 'Doctor'),
('position', 'Consultant Doctor'),
('position', 'Senior Doctor'),
('position', 'Nurse'),
('position', 'Staff Nurse'),
('position', 'Pharmacist'),
('position', 'Civil Engineer'),
('position', 'Mechanical Engineer'),
('position', 'Electrical Engineer'),
('position', 'Chemical Engineer'),
('position', 'Sales Manager'),
('position', 'Marketing Manager'),
('position', 'Sales Executive'),
('position', 'Marketing Executive'),
('position', 'Account Manager'),
('position', 'Customer Success Manager'),
('position', 'Human Resources Manager'),
('position', 'HR Executive'),
('position', 'Finance Manager'),
('position', 'Accountant'),
('position', 'Senior Accountant'),
('position', 'Financial Analyst'),
('position', 'Auditor'),
('position', 'Tax Consultant'),
('position', 'Legal Advisor'),
('position', 'Lawyer'),
('position', 'Advocate'),
('position', 'Government Officer'),
('position', 'IAS Officer'),
('position', 'IPS Officer'),
('position', 'Bank Manager'),
('position', 'Assistant Bank Manager'),
('position', 'Bank Officer'),
('position', 'Clerk'),
('position', 'Cashier'),
('position', 'Teacher'),
('position', 'Principal'),
('position', 'Vice Principal'),
('position', 'School Administrator'),
('position', 'Entrepreneur'),
('position', 'Business Owner'),
('position', 'Freelancer'),
('position', 'Self Employed');

-- Verify the data
SELECT 
    (SELECT COUNT(*) FROM form_values WHERE type = 'kulam') as kulam_count,
    (SELECT COUNT(*) FROM form_values WHERE type = 'kulaDeivam') as kula_deivam_count,
    (SELECT COUNT(*) FROM form_values WHERE type = 'kaani') as kaani_count,
    (SELECT COUNT(*) FROM form_values WHERE type = 'degree') as degree_count,
    (SELECT COUNT(*) FROM form_values WHERE type = 'department') as department_count,
    (SELECT COUNT(*) FROM form_values WHERE type = 'institution') as institution_count,
    (SELECT COUNT(*) FROM form_values WHERE type = 'company') as company_count,
    (SELECT COUNT(*) FROM form_values WHERE type = 'position') as position_count;

-- Show relationship counts
SELECT 
    'Kaani relationships' as relationship_type,
    COUNT(*) as count
FROM form_values 
WHERE type = 'kaani' AND parent_id IS NOT NULL
UNION ALL
SELECT 
    'Department relationships' as relationship_type,
    COUNT(*) as count
FROM form_values 
WHERE type = 'department' AND parent_id IS NOT NULL;

-- Migration completed successfully
SELECT 'Form values migration completed successfully!' as status;
