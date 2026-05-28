CREATE TABLE IF NOT EXISTS roles (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS permissions (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_code TEXT NOT NULL,
  permission_code TEXT NOT NULL,
  PRIMARY KEY (role_code, permission_code),
  FOREIGN KEY (role_code) REFERENCES roles(code) ON UPDATE CASCADE ON DELETE RESTRICT,
  FOREIGN KEY (permission_code) REFERENCES permissions(code) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role_code TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  last_login_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (role_code) REFERENCES roles(code) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_seen_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_user_id TEXT,
  actor_username TEXT,
  occurred_at TEXT NOT NULL,
  payload_json TEXT,
  FOREIGN KEY (actor_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_actor_user_id ON audit_events(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_entity_type_entity_id ON audit_events(entity_type, entity_id);
