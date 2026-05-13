export interface ApiGuardOptions {
  apiPrefix?: string | string[]; // Domyślnie: /api
  cookieName?: string; // Domyślnie: x-api-guard-token
  dev?: boolean;
}
