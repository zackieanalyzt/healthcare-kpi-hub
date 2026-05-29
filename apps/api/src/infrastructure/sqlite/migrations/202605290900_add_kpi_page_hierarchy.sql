CREATE TABLE IF NOT EXISTS kpi_page_hierarchy (
  kpi_page_id TEXT PRIMARY KEY,
  parent_kpi_page_id TEXT,
  hierarchy_level TEXT NOT NULL CHECK (
    hierarchy_level IN ('organization', 'department', 'unit', 'individual')
  ),
  owner_label TEXT,
  owner_user_id TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (kpi_page_id) REFERENCES kpi_pages(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (parent_kpi_page_id) REFERENCES kpi_pages(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (owner_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_kpi_page_hierarchy_parent_sort
  ON kpi_page_hierarchy(parent_kpi_page_id, sort_order);
