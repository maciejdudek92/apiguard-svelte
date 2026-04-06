/**
 * Helper tworzący zabezpieczony fetch.
 * @param token - Token pobrany z page data (server-side load)
 * @param headerName - Nazwa nagłówka (musi być spójna z serwerem)
 */
export declare const createSecureFetch: (token: string, headerName?: string) => (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
