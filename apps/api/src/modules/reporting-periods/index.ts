export interface ReportingPeriodsModuleContract {
  getCurrentPeriod(): Promise<void>;
  getReportingPeriodSummary(): Promise<void>;
}
