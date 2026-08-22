-- 1. Operational Context (The Network)
CREATE TABLE IF NOT EXISTS sections (
    section_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100),
    corridor_id VARCHAR(50),
    length_km DECIMAL(8,2)
);

-- 2. Assets (Mapped to Sections)
CREATE TABLE IF NOT EXISTS assets (
    asset_id VARCHAR(50) PRIMARY KEY,
    section_id VARCHAR(50) REFERENCES sections(section_id),
    department VARCHAR(50),
    asset_type VARCHAR(100),
    location_lat DECIMAL(9,6),
    location_lon DECIMAL(9,6)
);

-- 3. Maintenance Backlog
CREATE TABLE IF NOT EXISTS maintenance_tasks (
    task_id VARCHAR(50) PRIMARY KEY,
    asset_id VARCHAR(50) REFERENCES assets(asset_id),
    task_type VARCHAR(100),
    criticality VARCHAR(20),
    due_date DATE,
    duration_minutes INT,
    priority_score FLOAT,
    status VARCHAR(20) DEFAULT 'Pending'
);

-- 4. Traffic & Constraints
CREATE TABLE IF NOT EXISTS train_movements (
    movement_id SERIAL PRIMARY KEY,
    train_id VARCHAR(50),
    section_id VARCHAR(50) REFERENCES sections(section_id),
    train_type VARCHAR(20),
    entry_time TIMESTAMP,
    exit_time TIMESTAMP
);

-- 5. Physical Resources
CREATE TABLE IF NOT EXISTS resources (
    resource_id VARCHAR(50) PRIMARY KEY,
    resource_type VARCHAR(50),
    department VARCHAR(50),
    capacity INT
);
