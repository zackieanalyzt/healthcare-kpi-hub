ALTER TABLE sessions ADD COLUMN revoked_at TEXT;

CREATE TABLE IF NOT EXISTS workgroups (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS sections (
  id TEXT PRIMARY KEY,
  workgroup_id TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  UNIQUE (workgroup_id, code),
  FOREIGN KEY (workgroup_id) REFERENCES workgroups(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS kpi_pages (
  id TEXT PRIMARY KEY,
  section_id TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  UNIQUE (section_id, code),
  FOREIGN KEY (section_id) REFERENCES sections(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS kpi_definitions (
  id TEXT PRIMARY KEY,
  kpi_page_id TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  unit TEXT,
  value_type TEXT NOT NULL,
  preset_code TEXT NOT NULL,
  owner_label TEXT,
  sort_order INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (kpi_page_id, code),
  FOREIGN KEY (kpi_page_id) REFERENCES kpi_pages(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS reporting_periods (
  id TEXT PRIMARY KEY,
  period_key TEXT NOT NULL UNIQUE,
  period_type TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS kpi_entries (
  id TEXT PRIMARY KEY,
  kpi_definition_id TEXT NOT NULL,
  reporting_period_id TEXT NOT NULL,
  status TEXT NOT NULL,
  assigned_to_user_id TEXT,
  due_at TEXT,
  updated_at TEXT NOT NULL,
  updated_by_user_id TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (kpi_definition_id, reporting_period_id),
  FOREIGN KEY (kpi_definition_id) REFERENCES kpi_definitions(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  FOREIGN KEY (reporting_period_id) REFERENCES reporting_periods(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (updated_by_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS entry_values (
  id TEXT PRIMARY KEY,
  kpi_entry_id TEXT NOT NULL UNIQUE,
  target_value TEXT,
  actual_value TEXT,
  progress_value REAL,
  note TEXT,
  extra_json TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (kpi_entry_id) REFERENCES kpi_entries(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sections_workgroup_id_sort_order ON sections(workgroup_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_kpi_pages_section_id_sort_order ON kpi_pages(section_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_kpi_definitions_page_id_sort_order ON kpi_definitions(kpi_page_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_kpi_entries_period_status ON kpi_entries(reporting_period_id, status);
CREATE INDEX IF NOT EXISTS idx_kpi_entries_assigned_due ON kpi_entries(assigned_to_user_id, due_at);
