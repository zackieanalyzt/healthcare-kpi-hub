INSERT OR IGNORE INTO sections (id, workgroup_id, code, name, sort_order, is_active) VALUES
  ('sec_enterprise_kpi', 'wrk_public_health', 'ENT', 'Enterprise KPI', 15, 1),
  ('sec_digital_health', 'wrk_public_health', 'DH', 'Digital Health Division', 25, 1),
  ('sec_nursing_division', 'wrk_public_health', 'ND', 'Nursing Division', 35, 1);

INSERT OR IGNORE INTO kpi_pages (id, section_id, code, name, description, sort_order, is_active) VALUES
  ('pag_org_hospital', 'sec_enterprise_kpi', 'HOSPITAL', 'Hospital KPI Overview', 'Organization-level KPI ownership page for the hospital.', 5, 1),
  ('pag_dept_digital_health', 'sec_digital_health', 'DIGITAL-HEALTH', 'Digital Health Division KPI', 'Department-level KPI ownership page for Digital Health Division.', 5, 1),
  ('pag_unit_bi_team', 'sec_digital_health', 'BI-TEAM', 'BI Team KPI', 'Unit-level KPI ownership page for the BI Team.', 10, 1),
  ('pag_individual_analyst', 'sec_digital_health', 'ANALYST', 'KPI Analyst Page', 'Individual-level KPI ownership page for a staff member.', 15, 1),
  ('pag_empty_ward', 'sec_nursing_division', 'WARD-5A', 'Ward 5A KPI', 'Unit-level KPI page with no KPI assignments yet.', 5, 1);

INSERT OR REPLACE INTO kpi_page_hierarchy (
  kpi_page_id,
  parent_kpi_page_id,
  hierarchy_level,
  owner_label,
  owner_user_id,
  sort_order
) VALUES
  ('pag_org_hospital', NULL, 'organization', 'Phrae Hospital', NULL, 10),
  ('pag_promotion', 'pag_org_hospital', 'department', 'Health Promotion Division', NULL, 20),
  ('pag_prevention', 'pag_promotion', 'unit', 'Disease Control Unit', NULL, 30),
  ('pag_dept_digital_health', 'pag_org_hospital', 'department', 'Digital Health Division', NULL, 40),
  ('pag_unit_bi_team', 'pag_dept_digital_health', 'unit', 'BI Team', NULL, 50),
  ('pag_individual_analyst', 'pag_unit_bi_team', 'individual', 'Senior KPI Analyst', 'usr_editor', 60),
  ('pag_empty_ward', 'pag_org_hospital', 'unit', 'Ward 5A', NULL, 70);

INSERT OR IGNORE INTO kpi_definitions (
  id,
  kpi_page_id,
  code,
  name,
  unit,
  value_type,
  preset_code,
  owner_label,
  sort_order,
  is_active,
  created_at,
  updated_at
) VALUES
  ('kpd_org_bed_occupancy', 'pag_org_hospital', 'KPI-ORG-001', 'Hospital Bed Occupancy', '%', 'percentage', 'percentage', 'Hospital Executive Board', 10, 1, '2026-05-01T00:00:00Z', '2026-05-01T00:00:00Z'),
  ('kpd_dept_interop', 'pag_dept_digital_health', 'KPI-DEPT-001', 'Interoperability Feed Coverage', '%', 'percentage', 'percentage', 'Digital Health Division', 10, 1, '2026-05-01T00:00:00Z', '2026-05-01T00:00:00Z'),
  ('kpd_unit_bi_latency', 'pag_unit_bi_team', 'KPI-UNIT-001', 'BI Dashboard Delivery Timeliness', '%', 'percentage', 'percentage', 'BI Team', 10, 1, '2026-05-01T00:00:00Z', '2026-05-01T00:00:00Z'),
  ('kpd_individual_data_quality', 'pag_individual_analyst', 'KPI-IND-001', 'Analyst Data Quality Score', '%', 'percentage', 'percentage', 'Senior KPI Analyst', 10, 1, '2026-05-01T00:00:00Z', '2026-05-01T00:00:00Z');

INSERT OR IGNORE INTO kpi_entries (
  id,
  kpi_definition_id,
  reporting_period_id,
  status,
  assigned_to_user_id,
  due_at,
  updated_at,
  updated_by_user_id,
  created_at
) VALUES
  ('ent_org_bed_occupancy_2026_05', 'kpd_org_bed_occupancy', 'rpt_2026_05', 'submitted', 'usr_manager', '2026-05-31T17:00:00Z', '2026-05-19T09:00:00Z', 'usr_admin', '2026-05-01T00:00:00Z'),
  ('ent_dept_interop_2026_05', 'kpd_dept_interop', 'rpt_2026_05', 'pending', 'usr_manager', '2026-05-30T17:00:00Z', '2026-05-21T10:00:00Z', 'usr_admin', '2026-05-01T00:00:00Z'),
  ('ent_unit_bi_latency_2026_05', 'kpd_unit_bi_latency', 'rpt_2026_05', 'pending', 'usr_viewer', '2026-05-29T17:00:00Z', '2026-05-22T14:00:00Z', 'usr_manager', '2026-05-01T00:00:00Z'),
  ('ent_individual_data_quality_2026_05', 'kpd_individual_data_quality', 'rpt_2026_05', 'pending', 'usr_manager', '2026-05-28T17:00:00Z', '2026-05-23T11:30:00Z', 'usr_manager', '2026-05-01T00:00:00Z');

INSERT OR IGNORE INTO entry_values (
  id,
  kpi_entry_id,
  target_value,
  actual_value,
  progress_value,
  note,
  extra_json,
  updated_at
) VALUES
  ('val_org_bed_occupancy_2026_05', 'ent_org_bed_occupancy_2026_05', '85', '82', 0.9647, 'Hospital-wide occupancy remains within operational threshold.', NULL, '2026-05-19T09:00:00Z'),
  ('val_dept_interop_2026_05', 'ent_dept_interop_2026_05', '95', '89', 0.9368, 'Two legacy feeds are still pending interface remediation.', NULL, '2026-05-21T10:00:00Z'),
  ('val_unit_bi_latency_2026_05', 'ent_unit_bi_latency_2026_05', '98', '96', 0.9795, 'One dashboard release missed the same-day publication target.', NULL, '2026-05-22T14:00:00Z'),
  ('val_individual_data_quality_2026_05', 'ent_individual_data_quality_2026_05', '100', '97', 0.97, 'A small number of records required manual correction before publication.', NULL, '2026-05-23T11:30:00Z');
