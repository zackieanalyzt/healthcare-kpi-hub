INSERT OR IGNORE INTO roles (code, name) VALUES
  ('admin', 'Administrator'),
  ('manager', 'Manager'),
  ('editor', 'Editor'),
  ('viewer', 'Viewer');

INSERT OR IGNORE INTO permissions (code, name) VALUES
  ('worklist.read', 'Read worklist'),
  ('kpi.read', 'Read KPI pages and entries'),
  ('kpi.update', 'Update KPI entries'),
  ('kpi.import', 'Run imports'),
  ('dashboard.read', 'Read dashboard'),
  ('admin.navigation', 'Manage navigation'),
  ('admin.kpi_definition', 'Manage KPI definitions'),
  ('admin.users', 'Manage users'),
  ('audit.read', 'Read audit events');

INSERT OR IGNORE INTO role_permissions (role_code, permission_code) VALUES
  ('admin', 'worklist.read'),
  ('admin', 'kpi.read'),
  ('admin', 'kpi.update'),
  ('admin', 'kpi.import'),
  ('admin', 'dashboard.read'),
  ('admin', 'admin.navigation'),
  ('admin', 'admin.kpi_definition'),
  ('admin', 'admin.users'),
  ('admin', 'audit.read'),
  ('manager', 'worklist.read'),
  ('manager', 'kpi.read'),
  ('manager', 'kpi.update'),
  ('manager', 'dashboard.read'),
  ('manager', 'audit.read'),
  ('editor', 'worklist.read'),
  ('editor', 'kpi.read'),
  ('editor', 'kpi.update'),
  ('viewer', 'worklist.read'),
  ('viewer', 'kpi.read'),
  ('viewer', 'dashboard.read');
