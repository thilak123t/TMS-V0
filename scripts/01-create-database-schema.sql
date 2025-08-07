-- Create database schema for Tender Management System
-- PostgreSQL Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'tender-creator', 'vendor')),
    company_name VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tenders table
CREATE TABLE tenders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    budget DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    deadline TIMESTAMP NOT NULL,
    location VARCHAR(255),
    requirements JSONB,
    attachments JSONB,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'awarded', 'cancelled')),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    awarded_to UUID REFERENCES users(id),
    awarded_bid_id UUID,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bids table
CREATE TABLE bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    proposal TEXT NOT NULL,
    delivery_time INTEGER NOT NULL, -- in days
    documents JSONB,
    status VARCHAR(50) DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'accepted', 'rejected', 'withdrawn')),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tender_id, vendor_id)
);

-- Comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('tender_published', 'bid_received', 'bid_accepted', 'bid_rejected', 'tender_awarded', 'comment_added', 'system')),
    related_id UUID, -- Can reference tender_id, bid_id, etc.
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tender invitations table
CREATE TABLE tender_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP,
    UNIQUE(tender_id, vendor_id)
);

-- User favorites table
CREATE TABLE user_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, tender_id)
);

-- Bid evaluations table
CREATE TABLE bid_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bid_id UUID NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
    evaluator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    technical_score INTEGER CHECK (technical_score >= 0 AND technical_score <= 100),
    financial_score INTEGER CHECK (financial_score >= 0 AND financial_score <= 100),
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User settings table
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Activity logs table
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- File uploads table
CREATE TABLE file_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    related_type VARCHAR(50), -- 'tender', 'bid', 'user'
    related_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

CREATE INDEX idx_tenders_status ON tenders(status);
CREATE INDEX idx_tenders_created_by ON tenders(created_by);
CREATE INDEX idx_tenders_category ON tenders(category);
CREATE INDEX idx_tenders_deadline ON tenders(deadline);
CREATE INDEX idx_tenders_created_at ON tenders(created_at);

CREATE INDEX idx_bids_tender_id ON bids(tender_id);
CREATE INDEX idx_bids_vendor_id ON bids(vendor_id);
CREATE INDEX idx_bids_status ON bids(status);
CREATE INDEX idx_bids_created_at ON bids(created_at);

CREATE INDEX idx_comments_tender_id ON comments(tender_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

CREATE INDEX idx_tender_invitations_tender_id ON tender_invitations(tender_id);
CREATE INDEX idx_tender_invitations_vendor_id ON tender_invitations(vendor_id);
CREATE INDEX idx_tender_invitations_status ON tender_invitations(status);

CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_tender_id ON user_favorites(tender_id);

CREATE INDEX idx_bid_evaluations_bid_id ON bid_evaluations(bid_id);
CREATE INDEX idx_bid_evaluations_evaluator_id ON bid_evaluations(evaluator_id);

CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

CREATE INDEX idx_file_uploads_user_id ON file_uploads(user_id);
CREATE INDEX idx_file_uploads_related_type_id ON file_uploads(related_type, related_id);

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenders_updated_at BEFORE UPDATE ON tenders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bids_updated_at BEFORE UPDATE ON bids FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bid_evaluations_updated_at BEFORE UPDATE ON bid_evaluations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add foreign key constraint for awarded_bid_id after bids table is created
ALTER TABLE tenders ADD CONSTRAINT fk_tenders_awarded_bid FOREIGN KEY (awarded_bid_id) REFERENCES bids(id);
