-- RSSB Wireless Management System - Full Database Schema
-- Generated for PostgreSQL

-- Users (ASP.NET Identity manages AspNetUsers)
-- The following are the custom domain tables:

CREATE TABLE visits (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    location VARCHAR(200) NOT NULL,
    visit_date DATE NOT NULL,
    remarks TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE incharges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    badge_number VARCHAR(50) NOT NULL UNIQUE,
    mobile_number VARCHAR(20) NOT NULL,
    group_name VARCHAR(200),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE wireless_sets (
    id SERIAL PRIMARY KEY,
    item_number VARCHAR(50) NOT NULL UNIQUE,
    brand VARCHAR(20) NOT NULL CHECK (brand IN ('Kenwood', 'Vertel', 'Aspera')),
    status VARCHAR(20) DEFAULT 'Available' CHECK (status IN ('Available', 'Issued', 'Broken')),
    remarks TEXT,
    qr_code_url TEXT,  -- Kenwood only
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chargers (
    id SERIAL PRIMARY KEY,
    item_number VARCHAR(50),  -- NULL for Aspera
    brand VARCHAR(20) NOT NULL CHECK (brand IN ('Kenwood', 'Vertel', 'Aspera')),
    status VARCHAR(20) DEFAULT 'Available',
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE kits (
    id SERIAL PRIMARY KEY,
    item_number VARCHAR(50) NOT NULL UNIQUE,  -- Kenwood earphone kits only
    status VARCHAR(20) DEFAULT 'Available',
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE collectors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    badge_number VARCHAR(50) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE issues (
    id SERIAL PRIMARY KEY,
    visit_id INT NOT NULL REFERENCES visits(id),
    incharge_id INT NOT NULL REFERENCES incharges(id),
    is_group_issue BOOLEAN DEFAULT FALSE,
    group_name VARCHAR(200),
    group_set_count INT,
    issued_by VARCHAR(100) NOT NULL,
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    returned_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'Issued',  -- Issued | Returned | Partial
    remarks TEXT,
    collector_id INT REFERENCES collectors(id)
);

CREATE TABLE issue_items (
    id SERIAL PRIMARY KEY,
    issue_id INT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    item_type VARCHAR(20) NOT NULL,  -- WirelessSet | Charger | Kit
    wireless_set_id INT REFERENCES wireless_sets(id),
    charger_id INT REFERENCES chargers(id),
    kit_id INT REFERENCES kits(id),
    is_returned BOOLEAN DEFAULT FALSE,
    returned_at TIMESTAMPTZ,
    return_remarks TEXT
);

CREATE TABLE breakages (
    id SERIAL PRIMARY KEY,
    visit_id INT NOT NULL REFERENCES visits(id),
    wireless_set_id INT REFERENCES wireless_sets(id),
    item_number VARCHAR(50) NOT NULL,
    breakage_reason TEXT NOT NULL,
    reported_by VARCHAR(200) NOT NULL,
    remarks TEXT,
    reported_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE photos (
    id SERIAL PRIMARY KEY,
    issue_id INT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    public_id TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sms_logs (
    id SERIAL PRIMARY KEY,
    issue_id INT NOT NULL REFERENCES issues(id),
    mobile_number VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL,  -- Sent | Failed
    error_message TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_issues_visit ON issues(visit_id);
CREATE INDEX idx_issues_incharge ON issues(incharge_id);
CREATE INDEX idx_issue_items_issue ON issue_items(issue_id);
CREATE INDEX idx_wireless_sets_brand ON wireless_sets(brand);
CREATE INDEX idx_wireless_sets_status ON wireless_sets(status);
CREATE INDEX idx_breakages_visit ON breakages(visit_id);
