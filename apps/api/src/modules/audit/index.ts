export interface AuditModuleContract {
  recordEvent(): Promise<void>;
}
