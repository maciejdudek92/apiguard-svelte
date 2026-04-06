/**
 * Helper tworzący zabezpieczony fetch.
 * @param token - Token pobrany z page data (server-side load)
 * @param headerName - Nazwa nagłówka (musi być spójna z serwerem)
 */
export const createSecureFetch = (
  token: string,
  headerName = "x-api-guard-token",
) => {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    headers.set(headerName, token);

    return fetch(input, {
      ...init,
      headers,
    });
  };
};
