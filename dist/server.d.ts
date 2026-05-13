import { ResolveOptions, type RequestEvent } from "@sveltejs/kit";
import { ApiGuardOptions } from "./types";
type MaybePromise<T> = T | Promise<T>;
export declare const createApiGuard: (options?: ApiGuardOptions) => (event: RequestEvent, resolve: (event: RequestEvent, opts?: ResolveOptions) => MaybePromise<Response>) => MaybePromise<Response>;
export {};
