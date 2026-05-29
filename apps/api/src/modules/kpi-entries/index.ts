export interface KpiEntriesModuleContract {
  getEntry(): Promise<void>;
  getKpiEntryDetail(): Promise<void>;
}
