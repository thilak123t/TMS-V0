-- Insert sample users with hashed passwords (password123)
-- Note: In production, passwords should be properly hashed using bcrypt
INSERT INTO users (id, email, password, first_name, last_name, role, company_name, phone, address, is_active, email_verified) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin@tms.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'System', 'Administrator', 'admin', 'TMS Admin', '+1-555-0001', '123 Admin Street, Admin City, AC 12345', true, true),
('550e8400-e29b-41d4-a716-446655440002', 'creator@tms.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'John', 'Creator', 'tender-creator', 'Government Agency', '+1-555-0002', '456 Creator Ave, Creator City, CC 23456', true, true),
('550e8400-e29b-41d4-a716-446655440003', 'vendor@tms.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'Jane', 'Vendor', 'vendor', 'ABC Construction', '+1-555-0003', '789 Vendor Blvd, Vendor City, VC 34567', true, true),
('550e8400-e29b-41d4-a716-446655440004', 'vendor2@tms.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'Mike', 'Builder', 'vendor', 'XYZ Engineering', '+1-555-0004', '321 Builder St, Builder City, BC 45678', true, true),
('550e8400-e29b-41d4-a716-446655440005', 'creator2@tms.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'Sarah', 'Manager', 'tender-creator', 'City Council', '+1-555-0005', '654 Manager Way, Manager City, MC 56789', true, true),
('550e8400-e29b-41d4-a716-446655440006', 'vendor3@tms.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'Robert', 'Supplier', 'vendor', 'Tech Solutions Inc', '+1-555-0006', '987 Supplier Rd, Supplier City, SC 67890', true, true);

-- Insert user settings for all users
INSERT INTO user_settings (user_id, email_notifications, push_notifications, marketing_emails, language, timezone) VALUES
('550e8400-e29b-41d4-a716-446655440001', true, true, false, 'en', 'UTC'),
('550e8400-e29b-41d4-a716-446655440002', true, true, true, 'en', 'America/New_York'),
('550e8400-e29b-41d4-a716-446655440003', true, false, true, 'en', 'America/Los_Angeles'),
('550e8400-e29b-41d4-a716-446655440004', false, true, false, 'en', 'America/Chicago'),
('550e8400-e29b-41d4-a716-446655440005', true, true, true, 'en', 'America/New_York'),
('550e8400-e29b-41d4-a716-446655440006', true, true, false, 'en', 'Europe/London');

-- Insert sample tenders
INSERT INTO tenders (id, title, description, category, budget, currency, deadline, location, requirements, attachments, status, created_by, views_count) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'Road Construction Project', 'Construction of a 5-mile highway extension with proper drainage and lighting systems. The project includes excavation, paving, and installation of safety barriers.', 'Construction', 2500000.00, 'USD', '2024-06-30 23:59:59', 'Highway 101, California', '{"experience": "5+ years", "certification": "DOT certified", "equipment": "Heavy machinery required", "timeline": "6 months"}', '{"specifications": "highway_specs.pdf", "drawings": "construction_drawings.dwg"}', 'published', '550e8400-e29b-41d4-a716-446655440002', 45),
('660e8400-e29b-41d4-a716-446655440002', 'IT Infrastructure Upgrade', 'Complete overhaul of city hall IT infrastructure including servers, networking equipment, and security systems. Must include 24/7 support for first year.', 'Technology', 750000.00, 'USD', '2024-05-15 17:00:00', 'City Hall, Downtown', '{"security_clearance": "required", "support": "24/7 first year", "warranty": "3 years minimum", "migration": "zero downtime"}', '{"current_setup": "current_infrastructure.pdf", "requirements": "it_requirements.docx"}', 'published', '550e8400-e29b-41d4-a716-446655440005', 32),
('660e8400-e29b-41d4-a716-446655440003', 'Office Supplies Contract', 'Annual contract for office supplies including paper, pens, computers, and furniture for all government departments. Delivery must be within 48 hours of order.', 'Supplies', 150000.00, 'USD', '2024-04-20 12:00:00', 'Multiple Locations', '{"delivery": "48 hours max", "quality": "premium grade", "bulk_discount": "required", "eco_friendly": "preferred"}', '{"catalog": "required_items.xlsx", "locations": "delivery_addresses.pdf"}', 'published', '550e8400-e29b-41d4-a716-446655440002', 28),
('660e8400-e29b-41d4-a716-446655440004', 'Park Renovation Project', 'Complete renovation of Central Park including new playground equipment, walking paths, landscaping, and lighting. Project must be completed before summer season.', 'Construction', 450000.00, 'USD', '2024-03-31 18:00:00', 'Central Park, Main Street', '{"safety": "playground safety certified", "materials": "weather resistant", "accessibility": "ADA compliant", "landscaping": "native plants preferred"}', '{"site_plan": "park_layout.pdf", "equipment_specs": "playground_specs.pdf"}', 'closed', '550e8400-e29b-41d4-a716-446655440005', 67),
('660e8400-e29b-41d4-a716-446655440005', 'Security Services Contract', 'Comprehensive security services for government buildings including 24/7 monitoring, access control, and emergency response. 2-year contract with option to extend.', 'Services', 320000.00, 'USD', '2024-07-15 23:59:59', 'Government District', '{"licensing": "state licensed", "background_check": "required for all personnel", "response_time": "under 5 minutes", "reporting": "monthly reports required"}', '{"building_layouts": "security_plans.pdf", "current_systems": "existing_security.docx"}', 'published', '550e8400-e29b-41d4-a716-446655440002', 19),
('660e8400-e29b-41d4-a716-446655440006', 'Website Development', 'Development of new city website with citizen portal, online services, and mobile responsiveness. Must include CMS and training for staff.', 'Technology', 85000.00, 'USD', '2024-05-01 17:00:00', 'Remote/On-site hybrid', '{"responsive": "mobile-first design", "cms": "user-friendly CMS required", "training": "staff training included", "maintenance": "1 year free maintenance", "accessibility": "WCAG 2.1 AA compliant"}', '{"wireframes": "site_wireframes.pdf", "content": "existing_content.docx", "branding": "brand_guidelines.pdf"}', 'published', '550e8400-e29b-41d4-a716-446655440005', 41),
('660e8400-e29b-41d4-a716-446655440007', 'Fleet Vehicle Maintenance', 'Annual maintenance contract for city fleet vehicles including regular servicing, emergency repairs, and parts replacement. Must provide loaner vehicles during repairs.', 'Services', 180000.00, 'USD', '2024-08-30 23:59:59', 'City Garage, Industrial District', '{"certification": "ASE certified technicians", "parts": "OEM or equivalent", "response": "emergency repairs within 2 hours", "loaners": "replacement vehicles provided", "reporting": "monthly maintenance reports"}', '{"fleet_list": "vehicle_inventory.xlsx", "current_contract": "existing_maintenance.pdf"}', 'draft', '550e8400-e29b-41d4-a716-446655440002', 3);

-- Insert sample bids
INSERT INTO bids (id, tender_id, vendor_id, amount, currency, proposal, delivery_time, documents, status, submitted_at) VALUES
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 2350000.00, 'USD', 'We propose to complete the highway construction using our experienced team and state-of-the-art equipment. Our approach includes phased construction to minimize traffic disruption, use of high-quality materials exceeding DOT standards, and implementation of advanced drainage systems. We have successfully completed 15 similar projects in the past 3 years with zero safety incidents.', 150, '{"proposal": "detailed_proposal.pdf", "certifications": "dot_certifications.pdf", "equipment_list": "machinery_inventory.pdf", "timeline": "project_schedule.pdf", "safety_record": "safety_certifications.pdf"}', 'submitted', '2024-02-15 10:30:00'),
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 2480000.00, 'USD', 'XYZ Engineering brings 20 years of highway construction expertise to this project. Our proposal includes premium asphalt materials, advanced LED lighting systems, and smart traffic management during construction. We guarantee completion within 140 days with a 5-year warranty on all work. Our team includes certified engineers and experienced project managers.', 140, '{"technical_proposal": "engineering_proposal.pdf", "company_profile": "xyz_profile.pdf", "past_projects": "portfolio.pdf", "warranty": "warranty_terms.pdf"}', 'under_review', '2024-02-18 14:45:00'),
('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440006', 720000.00, 'USD', 'Tech Solutions Inc specializes in government IT infrastructure with security clearance and 24/7 support capabilities. Our proposal includes enterprise-grade servers, redundant networking, advanced cybersecurity measures, and comprehensive staff training. We offer 3-year warranty and guaranteed 99.9% uptime with our managed services package.', 90, '{"infrastructure_design": "network_design.pdf", "security_plan": "cybersecurity_proposal.pdf", "support_plan": "24x7_support.pdf", "certifications": "security_clearances.pdf", "references": "government_references.pdf"}', 'submitted', '2024-02-20 09:15:00'),
('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 142000.00, 'USD', 'ABC Construction offers comprehensive office supply solutions with competitive pricing and reliable delivery. Our proposal includes premium quality supplies, bulk discounts, eco-friendly options, and guaranteed 24-hour delivery. We maintain local inventory and have partnerships with major manufacturers to ensure consistent supply and competitive pricing.', 365, '{"catalog": "supply_catalog.pdf", "pricing": "bulk_pricing.pdf", "delivery_plan": "logistics_plan.pdf", "eco_products": "green_alternatives.pdf", "contracts": "manufacturer_agreements.pdf"}', 'submitted', '2024-02-12 16:20:00'),
('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 425000.00, 'USD', 'Our park renovation proposal focuses on creating a safe, accessible, and beautiful community space. We specialize in playground safety and ADA compliance, using weather-resistant materials and native landscaping. The project includes modern playground equipment, LED lighting, permeable paving for walkways, and a comprehensive irrigation system for landscaping.', 75, '{"design_plans": "park_design.pdf", "equipment_specs": "playground_equipment.pdf", "landscaping": "landscape_design.pdf", "safety_certs": "playground_safety.pdf", "accessibility": "ada_compliance.pdf"}', 'accepted', '2024-01-25 11:00:00'),
('770e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440006', 78000.00, 'USD', 'Tech Solutions Inc proposes a modern, responsive city website with integrated citizen services portal. Our solution includes custom CMS, mobile-first design, accessibility compliance, and comprehensive staff training. We use latest web technologies, implement robust security measures, and provide ongoing support and maintenance for the first year.', 60, '{"website_mockups": "design_mockups.pdf", "technical_specs": "development_specs.pdf", "cms_demo": "cms_features.pdf", "training_plan": "staff_training.pdf", "maintenance": "support_package.pdf"}', 'submitted', '2024-02-22 13:30:00');

-- Update tender with awarded information
UPDATE tenders SET status = 'awarded', awarded_to = '550e8400-e29b-41d4-a716-446655440003', awarded_bid_id = '770e8400-e29b-41d4-a716-446655440005' WHERE id = '660e8400-e29b-41d4-a716-446655440004';

-- Insert sample comments
INSERT INTO comments (id, tender_id, user_id, content, is_public) VALUES
('880e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'We have extensive experience with similar highway projects and would like to schedule a site visit to better understand the terrain and existing infrastructure.', true),
('880e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'Site visits can be scheduled Monday through Friday, 9 AM to 4 PM. Please contact our office at least 48 hours in advance. Safety equipment is required.', true),
('880e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440006', 'Can you provide more details about the current network infrastructure and any legacy systems that need to be integrated?', true),
('880e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005', 'Detailed infrastructure documentation will be provided to qualified bidders after NDA signature. Please submit your company credentials for review.', true),
('880e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440006', 'We would like to understand the expected traffic volume and any specific performance requirements for the website.', true);

-- Insert sample notifications
INSERT INTO notifications (id, user_id, title, message, type, related_id, is_read) VALUES
('990e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'New Tender Published', 'A new tender "Road Construction Project" has been published that matches your interests.', 'tender_published', '660e8400-e29b-41d4-a716-446655440001', false),
('990e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'New Bid Received', 'You have received a new bid for "Road Construction Project" from ABC Construction.', 'bid_received', '770e8400-e29b-41d4-a716-446655440001', true),
('990e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'Bid Accepted', 'Congratulations! Your bid for "Park Renovation Project" has been accepted.', 'bid_accepted', '770e8400-e29b-41d4-a716-446655440005', false),
('990e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'Tender Awarded', 'The tender "Park Renovation Project" has been awarded to ABC Construction.', 'tender_awarded', '660e8400-e29b-41d4-a716-446655440004', true),
('990e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440006', 'New Comment', 'A new comment has been posted on "IT Infrastructure Upgrade" tender.', 'comment_added', '880e8400-e29b-41d4-a716-446655440003', false),
('990e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440005', 'System Notification', 'Welcome to the Tender Management System! Please complete your profile setup.', 'system', null, true);

-- Insert sample tender invitations
INSERT INTO tender_invitations (id, tender_id, vendor_id, invited_by, message, status) VALUES
('aa0e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'We believe your company has the expertise and experience needed for this highway construction project. Please review the tender details and submit your proposal.', 'accepted'),
('aa0e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'Your company comes highly recommended for infrastructure projects. We would like to invite you to bid on this highway construction tender.', 'accepted'),
('aa0e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440005', 'Based on your IT expertise and government experience, we invite you to submit a proposal for our IT infrastructure upgrade project.', 'accepted'),
('aa0e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'We are seeking qualified security service providers for our government buildings. Your company profile matches our requirements.', 'pending'),
('aa0e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440005', 'We would like to invite your company to bid on our website development project. Your portfolio shows excellent work in government websites.', 'accepted');

-- Insert sample user favorites
INSERT INTO user_favorites (user_id, tender_id) VALUES
('550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440005'),
('550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440006');

-- Insert sample bid evaluations
INSERT INTO bid_evaluations (id, bid_id, evaluator_id, technical_score, financial_score, overall_score, comments) VALUES
('bb0e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', 92, 88, 90, 'Excellent technical proposal with comprehensive safety measures and quality materials. Competitive pricing and realistic timeline. Strong track record with similar projects.'),
('bb0e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 85, 95, 90, 'Good technical approach with proven methodology. Very competitive pricing and excellent value for money. Some concerns about timeline but overall strong proposal.'),
('bb0e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 88, 82, 85, 'Strong technical proposal with premium materials and advanced features. Pricing is higher than budget but justified by quality. Good project management approach.');

-- Insert sample activity logs
INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details, ip_address) VALUES
('550e8400-e29b-41d4-a716-446655440002', 'CREATE', 'tender', '660e8400-e29b-41d4-a716-446655440001', '{"title": "Road Construction Project", "budget": 2500000}', '192.168.1.100'),
('550e8400-e29b-41d4-a716-446655440003', 'CREATE', 'bid', '770e8400-e29b-41d4-a716-446655440001', '{"tender_id": "660e8400-e29b-41d4-a716-446655440001", "amount": 2350000}', '192.168.1.101'),
('550e8400-e29b-41d4-a716-446655440005', 'UPDATE', 'tender', '660e8400-e29b-41d4-a716-446655440004', '{"status": "awarded", "awarded_to": "550e8400-e29b-41d4-a716-446655440003"}', '192.168.1.102'),
('550e8400-e29b-41d4-a716-446655440001', 'LOGIN', 'user', '550e8400-e29b-41d4-a716-446655440001', '{"login_time": "2024-02-25T10:30:00Z"}', '192.168.1.103'),
('550e8400-e29b-41d4-a716-446655440006', 'CREATE', 'comment', '880e8400-e29b-41d4-a716-446655440003', '{"tender_id": "660e8400-e29b-41d4-a716-446655440002"}', '192.168.1.104');

-- Insert sample file uploads
INSERT INTO file_uploads (id, user_id, original_name, file_name, file_path, file_size, mime_type, related_type, related_id) VALUES
('cc0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'highway_specifications.pdf', 'highway_specs_20240215.pdf', '/uploads/tenders/highway_specs_20240215.pdf', 2048576, 'application/pdf', 'tender', '660e8400-e29b-41d4-a716-446655440001'),
('cc0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 'company_profile.pdf', 'abc_profile_20240215.pdf', '/uploads/bids/abc_profile_20240215.pdf', 1536000, 'application/pdf', 'bid', '770e8400-e29b-41d4-a716-446655440001'),
('cc0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440005', 'network_diagram.png', 'network_20240220.png', '/uploads/tenders/network_20240220.png', 512000, 'image/png', 'tender', '660e8400-e29b-41d4-a716-446655440002'),
('cc0e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440006', 'technical_proposal.docx', 'tech_proposal_20240222.docx', '/uploads/bids/tech_proposal_20240222.docx', 3072000, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'bid', '770e8400-e29b-41d4-a716-446655440006');

-- Create some views for common queries
CREATE OR REPLACE VIEW active_tenders AS
SELECT 
    t.*,
    u.first_name || ' ' || u.last_name as created_by_name,
    u.company_name as created_by_company,
    COUNT(b.id) as bid_count
FROM tenders t
JOIN users u ON t.created_by = u.id
LEFT JOIN bids b ON t.id = b.tender_id
WHERE t.status IN ('published', 'closed')
GROUP BY t.id, u.first_name, u.last_name, u.company_name;

CREATE OR REPLACE VIEW tender_statistics AS
SELECT 
    DATE_TRUNC('month', created_at) as month,
    status,
    COUNT(*) as count,
    AVG(budget) as avg_budget,
    SUM(budget) as total_budget
FROM tenders
GROUP BY DATE_TRUNC('month', created_at), status
ORDER BY month DESC, status;

CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
    u.id,
    u.email,
    u.first_name || ' ' || u.last_name as full_name,
    u.role,
    u.company_name,
    COUNT(DISTINCT t.id) as tenders_created,
    COUNT(DISTINCT b.id) as bids_submitted,
    COUNT(DISTINCT c.id) as comments_posted,
    u.last_login,
    u.created_at as joined_date
FROM users u
LEFT JOIN tenders t ON u.id = t.created_by
LEFT JOIN bids b ON u.id = b.vendor_id
LEFT JOIN comments c ON u.id = c.user_id
WHERE u.is_active = true
GROUP BY u.id, u.email, u.first_name, u.last_name, u.role, u.company_name, u.last_login, u.created_at;

-- Insert some additional notifications for better testing
INSERT INTO notifications (user_id, title, message, type, related_id, is_read) VALUES
('550e8400-e29b-41d4-a716-446655440003', 'Bid Status Update', 'Your bid for "Road Construction Project" is now under review.', 'bid_received', '770e8400-e29b-41d4-a716-446655440001', false),
('550e8400-e29b-41d4-a716-446655440004', 'New Tender Alert', 'A new tender "Security Services Contract" matches your company profile.', 'tender_published', '660e8400-e29b-41d4-a716-446655440005', false),
('550e8400-e29b-41d4-a716-446655440006', 'Bid Deadline Reminder', 'Reminder: Bid deadline for "Website Development" is in 3 days.', 'system', '660e8400-e29b-41d4-a716-446655440006', false);

-- Update some timestamps to make data more realistic
UPDATE tenders SET created_at = created_at - INTERVAL '30 days' WHERE id = '660e8400-e29b-41d4-a716-446655440004';
UPDATE tenders SET created_at = created_at - INTERVAL '15 days' WHERE id = '660e8400-e29b-41d4-a716-446655440001';
UPDATE tenders SET created_at = created_at - INTERVAL '10 days' WHERE id = '660e8400-e29b-41d4-a716-446655440002';
UPDATE tenders SET created_at = created_at - INTERVAL '5 days' WHERE id = '660e8400-e29b-41d4-a716-446655440003';

UPDATE bids SET submitted_at = submitted_at - INTERVAL '25 days' WHERE id = '770e8400-e29b-41d4-a716-446655440005';
UPDATE bids SET submitted_at = submitted_at - INTERVAL '12 days' WHERE id = '770e8400-e29b-41d4-a716-446655440001';
UPDATE bids SET submitted_at = submitted_at - INTERVAL '8 days' WHERE id = '770e8400-e29b-41d4-a716-446655440002';

-- Final verification queries (optional - you can run these to verify data)
-- SELECT 'Users' as table_name, COUNT(*) as count FROM users
-- UNION ALL
-- SELECT 'Tenders', COUNT(*) FROM tenders
-- UNION ALL  
-- SELECT 'Bids', COUNT(*) FROM bids
-- UNION ALL
-- SELECT 'Comments', COUNT(*) FROM comments
-- UNION ALL
-- SELECT 'Notifications', COUNT(*) FROM notifications
-- UNION ALL
-- SELECT 'Tender Invitations', COUNT(*) FROM tender_invitations
-- UNION ALL
-- SELECT 'User Favorites', COUNT(*) FROM user_favorites
-- UNION ALL
-- SELECT 'Bid Evaluations', COUNT(*) FROM bid_evaluations
-- UNION ALL
-- SELECT 'Activity Logs', COUNT(*) FROM activity_logs
-- UNION ALL
-- SELECT 'File Uploads', COUNT(*) FROM file_uploads;
