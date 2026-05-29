export interface NavigationModuleContract {
  getNavigationTree(): Promise<void>;
  getKpiPageDetail(): Promise<void>;
}
