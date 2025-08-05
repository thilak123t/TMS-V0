-- Seed initial data for Tender Management System

-- Insert admin user
INSERT INTO users (id, email, password_hash, first_name, last_name, role, phone, address, bio, email_verified) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'admin@tms.com', '$2b$10$rOzJqZxjdKjVxzK5tQqOHOmNqNqNqNqNqNqNqNqNqNqNqNqNqNqNq', 'Admin', 'User', 'admin', '+1 (555) 123-4567', '123 Business St, City, State 12345', 'System administrator with 5+ years of experience in tender management systems.', true);

-- Insert tender creators
INSERT INTO users (id, email, password_hash, first_name, last_name, role, phone, address, bio, email_verified) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'creator@tms.com', '$2b$10$rOzJqZxjdKjVxzK5tQqOHOmNqNqNqNqNqNqNqNqNqNqNqNqNqNqNq', 'Tender', 'Creator', 'tender-creator', '+1 (555) 987-6543', '456 Creator Ave, City, State 12345', 'Experienced tender creator specializing in construction and IT projects.', true),
('550e8400-e29b-41d4-a716-446655440002', 'john.creator@example.com', '$2b$10$rOzJqZxjdKjVxzK5tQqOHOmNqNqNqNqNqNqNqNqNqNqNqNqNqNqNq', 'John', 'Creator', 'tender-creator', '+1 (555) 234-5678', '789 Project Blvd, City, State 12345', 'Project manager with expertise in large-scale construction projects.', true);

-- Insert vendors
INSERT INTO users (id, email, password_hash, first_name, last_name, role, phone, address, bio, email_verified) VALUES
('550e8400-e29b-41d4-a716-446655440003', 'vendor@tms.com', '$2b$10$rOzJqZxjdKjVxzK5tQqOHOmNqNqNqNqNqNqNqNqNqNqNqNqNqNqNq', 'Vendor', 'User', 'vendor', '+1 (555) 456-7890', '789 Vendor Blvd, City, State 12345', 'Experienced vendor specializing in construction and infrastructure projects with 10+ years in the industry.', true),
('550e8400-e29b-41d4-a716-446655440004', 'john.vendor@example.com', '$2b$10$rOzJqZxjdKjVxzK5tQqOHOmNqNqNqNqNqNqNqNqNqNqNqNqNqNqNq', 'John', 'Vendor', 'vendor', '+1 (555) 345-6789', '123 Contractor St, City, State 12345', 'General contractor with 15+ years experience in commercial construction.', true),
('550e8400-e29b-41d4-a716-446655440005', 'mike.builder@example.com', '$2b$10$rOzJqZxjdKjVxzK5tQqOHOmNqNqNqNqNqNqNqNqNqNqNqNqNqNqNq', 'Mike', 'Builder', 'vendor', '+1 (555) 567-8901', '456 Builder Ave, City, State 12345', 'Specialized in residential and commercial building projects.', true),
('550e8400-e29b-41d4-a716-446655440006', 'sarah.tech@example.com', '$2b$10$rOzJqZxjdKjVxzK5tQqOHOmNqNqNqNqNqNqNqNqNqNqNqNqNqNqNq', 'Sarah', 'Tech', 'vendor', '+1 (555) 678-9012', '789 Tech Solutions Dr, City, State 12345', 'Technology solutions provider for smart building systems.', true);

-- Insert user settings for all users
INSERT INTO user_settings (user_id, email_notifications, weekly_reports, system_alerts, tender_updates, user_registrations, session_timeout, login_alerts)
SELECT id, true, true, true, true, true, 30, true FROM users;

-- Insert sample tenders
INSERT INTO tenders (id, title, description, creator_id, status, category, base_price, deadline, duration, location, contact_person, contact_email, requirements) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'Community Center Construction', 'Construction of a new community center with multipurpose halls, gymnasium, library, and meeting rooms. The facility will serve as a hub for local community activities and events.', '550e8400-e29b-41d4-a716-446655440001', 'published', 'open', 850000.00, '2024-04-30 23:59:59+00', 240, 'Community District - 123 Main Street', 'Jennifer Martinez', 'jennifer.martinez@citydev.gov', ARRAY['General contractor license required', 'Minimum 8 years construction experience', 'ADA compliance certification', 'Community facility construction experience', 'LEED Silver certification preferred', 'Local hiring preference (30% minimum)']),

('660e8400-e29b-41d4-a716-446655440002', 'Modern Office Complex Construction', 'Construction of a 10-story modern office complex with sustainable features, smart building technology, LEED certification requirements, and underground parking for 200 vehicles.', '550e8400-e29b-41d4-a716-446655440002', 'published', 'open', 2500000.00, '2024-03-20 23:59:59+00', 365, 'Downtown Metro City', 'Sarah Johnson', 'sarah.johnson@metrodev.com', ARRAY['LEED Gold certification mandatory', 'Minimum 10 years construction experience', 'Licensed general contractor', 'Bonding capacity of $3M minimum', 'Previous high-rise experience required']),

('660e8400-e29b-41d4-a716-446655440003', 'Office Building Construction', 'Complete construction of a 5-story office building with modern amenities, parking facilities, and green building standards compliance.', '550e8400-e29b-41d4-a716-446655440002', 'published', 'open', 500000.00, '2024-03-15 23:59:59+00', 180, 'Business District', 'John Creator', 'john@company.com', ARRAY['Licensed contractor required', '5+ years experience', 'Insurance coverage minimum $1M', 'Local permits handling']),

('660e8400-e29b-41d4-a716-446655440004', 'Residential Complex Development', 'Development of a 50-unit residential complex with amenities including swimming pool, gym, and community center.', '550e8400-e29b-41d4-a716-446655440001', 'awarded', 'closed', 1200000.00, '2024-01-30 23:59:59+00', 240, 'Suburban Area', 'Housing Authority', 'projects@housing.gov', ARRAY['Residential construction license', 'Previous multi-unit experience', 'Environmental compliance', 'Safety certifications']),

('660e8400-e29b-41d4-a716-446655440005', 'Shopping Mall Renovation', 'Complete renovation of existing shopping mall including facade updates, interior modernization, and infrastructure improvements.', '550e8400-e29b-41d4-a716-446655440002', 'closed', 'open', 800000.00, '2024-01-25 23:59:59+00', 150, 'City Center Mall', 'Mike Wilson', 'mike@retailprops.com', ARRAY['Commercial renovation experience', 'Working with occupied buildings', 'Retail construction background', 'Project management certification']),

('660e8400-e29b-41d4-a716-446655440006', 'Hospital Wing Extension', 'Extension of hospital''s east wing with 30 additional patient rooms and modern medical facilities.', '550e8400-e29b-41d4-a716-446655440001', 'published', 'closed', 1800000.00, '2024-03-25 23:59:59+00', 300, 'City Medical Center', 'Dr. Emily Chen', 'projects@citymedical.org', ARRAY['Healthcare facility construction license', 'Medical equipment installation experience', 'HIPAA compliance knowledge', 'Specialized medical construction background', '24/7 construction capability']),

('660e8400-e29b-41d4-a716-446655440007', 'School Cafeteria Renovation', 'Complete renovation of school cafeteria including kitchen equipment upgrade and dining area modernization.', '550e8400-e29b-41d4-a716-446655440002', 'published', 'open', 150000.00, '2024-03-10 23:59:59+00', 90, 'Lincoln Elementary School', 'Maria Rodriguez', 'maria.rodriguez@cityschools.edu', ARRAY['Food service construction license', 'Health department compliance', 'School construction experience', 'Background checks for all workers']);

-- Insert tender invitations
INSERT INTO tender_invitations (tender_id, vendor_id, invited_by, status, invited_at, viewed_at, responded_at) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'submitted', '2024-01-25 09:00:00+00', '2024-01-25 10:30:00+00', '2024-01-28 15:30:00+00'),
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'submitted', '2024-01-25 09:00:00+00', '2024-01-26 08:15:00+00', '2024-01-26 10:30:00+00'),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'invited', '2024-01-15 10:00:00+00', NULL, NULL),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'submitted', '2024-01-10 10:00:00+00', '2024-01-11 09:30:00+00', '2024-01-12 14:30:00+00'),
('660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'submitted', '2024-01-20 09:00:00+00', '2024-01-20 11:00:00+00', '2024-01-21 09:15:00+00');

-- Insert sample bids
INSERT INTO bids (id, tender_id, vendor_id, amount, notes, status, ranking, total_bidders, variance, submitted_at, feedback) VALUES
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 830000.00, 'Comprehensive proposal with community engagement plan and sustainable design elements.', 'pending', NULL, 5, -2.4, '2024-01-28 15:30:00+00', NULL),
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 825000.00, 'Competitive pricing with local workforce commitment.', 'pending', NULL, 5, -2.9, '2024-01-26 10:30:00+00', NULL),
('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 485000.00, 'Competitive pricing with premium materials and accelerated timeline.', 'revised', 2, 8, -3.0, '2024-01-12 14:30:00+00', 'Your technical proposal is strong, but we''d like to see more detail on the timeline.'),
('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 1150000.00, 'Comprehensive residential development with sustainable features.', 'accepted', 1, 15, -4.2, '2024-01-08 16:45:00+00', 'Excellent proposal with strong sustainability features. Your team''s experience was a key factor.'),
('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440003', 145000.00, 'Cost-effective renovation with modern equipment and quick turnaround.', 'pending', 3, 7, -3.3, '2024-01-21 09:15:00+00', NULL);

-- Insert bid evaluations
INSERT INTO bid_evaluations (bid_id, price_score, technical_score, experience_score, timeline_score, total_score, price_weight, technical_weight, experience_weight, timeline_weight, evaluated_by, notes) VALUES
('770e8400-e29b-41d4-a716-446655440003', 38.0, 28.0, 18.0, 9.0, 93.0, 40.0, 30.0, 20.0, 10.0, '550e8400-e29b-41d4-a716-446655440002', 'Strong technical proposal with competitive pricing.'),
('770e8400-e29b-41d4-a716-446655440004', 33.0, 35.0, 24.0, 5.0, 97.0, 35.0, 35.0, 25.0, 5.0, '550e8400-e29b-41d4-a716-446655440001', 'Outstanding proposal with excellent sustainability features.');

-- Insert sample comments
INSERT INTO comments (tender_id, author_id, message) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Welcome to the Community Center Construction tender! This is an exciting project that will benefit our entire community. Please review all requirements carefully and don''t hesitate to ask questions.'),
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 'What are the specific requirements for the gymnasium flooring and equipment installation?'),
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'The gymnasium requires professional-grade hardwood flooring suitable for basketball and volleyball. Equipment installation includes retractable bleachers and scoreboards. Full specifications are in attachment 2.'),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'Could you please clarify the specific requirements for the parking structure foundation?'),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'The foundation should be reinforced concrete with a minimum depth of 8 feet. Please refer to attachment 2 for detailed specifications.');

-- Insert sample notifications
INSERT INTO notifications (user_id, type, title, message, tender_id, priority, action_url) VALUES
('550e8400-e29b-41d4-a716-446655440003', 'invitation', 'New Tender Invitation', 'You have been invited to bid on ''Community Center Construction''', '660e8400-e29b-41d4-a716-446655440001', 'high', '/vendor/tenders/660e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440003', 'comment', 'Question Answered', 'Your question about delivery timeline has been answered', '660e8400-e29b-41d4-a716-446655440003', 'medium', '/vendor/tenders/660e8400-e29b-41d4-a716-446655440003#comments'),
('550e8400-e29b-41d4-a716-446655440003', 'award', 'Congratulations! Bid Won', 'You have won the ''Residential Complex Development'' tender', '660e8400-e29b-41d4-a716-446655440004', 'high', '/vendor/bids/770e8400-e29b-41d4-a716-446655440004'),
('550e8400-e29b-41d4-a716-446655440001', 'system', 'New Bid Submitted', 'Vendor User submitted a bid for Community Center Construction', '660e8400-e29b-41d4-a716-446655440001', 'medium', '/tender-creator/tenders/660e8400-e29b-41d4-a716-446655440001');

-- Insert user favorites
INSERT INTO user_favorites (user_id, tender_id) VALUES
('550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003');
