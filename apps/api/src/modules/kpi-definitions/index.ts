export interface KpiDefinitionsModuleContract {
  listDefinitions(): Promise<void>;
  getDefinitionSummary(): Promise<void>;
}
