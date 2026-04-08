import { ResolveOptions, type RequestEvent, type MaybePromise } from "@sveltejs/kit";
import { ApiGuardOptions } from "./types";
export declare const createApiGuard: (options?: ApiGuardOptions) => (event: RequestEvent, resolve: (event: RequestEvent, opts?: ResolveOptions) => MaybePromise<Response>) => MaybePromise<Response>;
