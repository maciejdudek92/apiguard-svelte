// 1. Eksportujemy typy (ułatwia pracę w TS)
export type { ApiGuardOptions } from "./types";

// 2. Eksportujemy logikę serwerową (do hooks.server.ts)
export { apiGuard } from "./server";

// 3. Eksportujemy helper kliencki (do komponentów i ładowania danych)
export { createSecureFetch } from "./client";
