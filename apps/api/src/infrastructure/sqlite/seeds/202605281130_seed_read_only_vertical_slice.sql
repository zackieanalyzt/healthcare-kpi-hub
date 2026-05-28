INSERT OR IGNORE INTO workgroups (id, code, name, sort_order, is_active) VALUES
  ('wrk_public_health', 'PH', 'Public Health', 10, 1),
  ('wrk_inactive', 'OLD', 'Legacy Group', 20, 0);

INSERT OR IGNORE INTO sections (id, workgroup_id, code, name, sort_order, is_active) VALUES
  ('sec_disease_control', 'wrk_public_health', 'DC', 'Disease Control', 10, 1),
  ('sec_health_promotion', 'wrk_public_health', 'HP', 'Health Promotion', 20, 1),
  ('sec_inactive', 'wrk_public_health', 'OLDSEC', 'Inactive Section', 30, 0);

INSERT OR IGNORE INTO kpi_pages (id, section_id, code, name, description, sort_order, is_active) VALUES
  ('pag_prevention', 'sec_disease_control', 'PREVENTION', 'Prevention Metrics', 'Monthly prevention KPIs', 10, 1),
  ('pag_promotion', 'sec_health_promotion', 'PROMOTION', 'Promotion Metrics', 'Community health promotion KPIs', 20, 1),
  ('pag_inactive', 'sec_health_promotion', 'OLDPAGE', 'Inactive Page', 'Retired page', 30, 0);

INSERT OR IGNORE INTO reporting_periods (id, period_key, period_type, starts_at, ends_at, status, created_at, updated_at) VALUES
  ('rpt_2026_05', '2026-05', 'monthly', '2026-05-01T00:00:00Z', '2026-05-31T23:59:59Z', 'open', '2026-05-01T00:00:00Z', '2026-05-01T00:00:00Z'),
  ('rpt_2026_04', '2026-04', 'monthly', '2026-04-01T00:00:00Z', '2026-04-30T23:59:59Z', 'closed', '2026-04-01T00:00:00Z', '2026-04-01T00:00:00Z');

INSERT OR IGNORE INTO kpi_definitions (id, kpi_page_id, code, name, unit, value_type, preset_code, owner_label, sort_order, is_active, created_at, updated_at) VALUES
  ('kpd_vaccination', 'pag_prevention', 'KPI-001', 'Vaccination Coverage', '%', 'percentage', 'percentage', 'District Epidemiology Team', 10, 1, '2026-05-01T00:00:00Z', '2026-05-01T00:00:00Z'),
  ('kpd_home_visit', 'pag_promotion', 'KPI-002', 'Home Visit Completion', '%', 'percentage', 'percentage', 'Community Health Team', 20, 1, '2026-05-01T00:00:00Z', '2026-05-01T00:00:00Z');

INSERT OR IGNORE INTO kpi_entries (id, kpi_definition_id, reporting_period_id, status, assigned_to_user_id, due_at, updated_at, updated_by_user_id, created_at) VALUES
  ('ent_vaccination_2026_05', 'kpd_vaccination', 'rpt_2026_05', 'pending', 'usr_editor', '2026-05-31T17:00:00Z', '2026-05-20T08:00:00Z', 'usr_manager', '2026-05-01T00:00:00Z'),
  ('ent_home_visit_2026_05', 'kpd_home_visit', 'rpt_2026_05', 'locked', 'usr_viewer', '2026-05-31T17:00:00Z', '2026-05-18T09:00:00Z', 'usr_manager', '2026-05-01T00:00:00Z');

INSERT OR IGNORE INTO entry_values (id, kpi_entry_id, target_value, actual_value, progress_value, note, extra_json, updated_at) VALUES
  ('val_vaccination_2026_05', 'ent_vaccination_2026_05', '95', '91', 0.9579, 'Awaiting final district confirmation', NULL, '2026-05-20T08:00:00Z'),
  ('val_home_visit_2026_05', 'ent_home_visit_2026_05', '90', '88', 0.9777, 'Data locked after monthly review', NULL, '2026-05-18T09:00:00Z');
