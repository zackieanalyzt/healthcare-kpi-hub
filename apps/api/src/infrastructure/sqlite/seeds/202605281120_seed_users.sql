INSERT OR IGNORE INTO users (id, username, full_name, role_code, is_active, last_login_at, created_at, updated_at) VALUES
  ('usr_admin', 'admin.user', 'Admin User', 'admin', 1, NULL, '2026-05-28T00:00:00Z', '2026-05-28T00:00:00Z'),
  ('usr_manager', 'manager.user', 'Manager User', 'manager', 1, NULL, '2026-05-28T00:00:00Z', '2026-05-28T00:00:00Z'),
  ('usr_editor', 'editor.user', 'Editor User', 'editor', 1, NULL, '2026-05-28T00:00:00Z', '2026-05-28T00:00:00Z'),
  ('usr_viewer', 'viewer.user', 'Viewer User', 'viewer', 1, NULL, '2026-05-28T00:00:00Z', '2026-05-28T00:00:00Z'),
  ('usr_inactive', 'inactive.user', 'Inactive User', 'viewer', 0, NULL, '2026-05-28T00:00:00Z', '2026-05-28T00:00:00Z');
