// 2. Eksportujemy logikę serwerową (do hooks.server.ts)
export { createApiGuard } from "./server";
// 3. Eksportujemy helper kliencki (do komponentów i ładowania danych)
export { secureFetch } from "./client";
