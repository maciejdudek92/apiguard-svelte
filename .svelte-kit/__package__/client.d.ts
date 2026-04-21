export interface SecureFetchInit extends RequestInit {
    fetch?: typeof fetch;
    token?: string;
}
export declare const secureFetch: <T = any>(input: RequestInfo | URL, init?: SecureFetchInit) => Promise<T>;
