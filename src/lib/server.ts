import {
  error,
  Handle,
  ResolveOptions,
  type RequestEvent,
  type MaybePromise,
} from "@sveltejs/kit";
import { ApiGuardOptions } from "./types";
import crypto from "node:crypto";
import { generateEncryptionKey } from "./utils.js";

function encrypt(text: string, token: string) {
  const iv = crypto.randomBytes(12);
  const key = crypto.createHash("sha256").update(token).digest();

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(text, "utf8");
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Zwracamy jeden obiekt, ale dane jako Base64
  return {
    iv: iv.toString("base64"),
    data: encrypted.toString("base64"),
    tag: authTag.toString("base64"),
  };
}

export const createApiGuard = (options: ApiGuardOptions = {}) => {
  const {
    apiPrefix = "/api",
    cookieName = "x-api-guard-token",
    headerName = "x-api-guard-token",
    dev = false,
  } = options;

  return async (
    event: RequestEvent,
    resolve: (
      event: RequestEvent,
      opts?: ResolveOptions,
    ) => MaybePromise<Response>,
  ): MaybePromise<Response> => {
    const { request, url, cookies } = event;
    const isApi = url.pathname.startsWith(apiPrefix);

    // 1. Zarządzanie tokenem w ciasteczku
    let token = cookies.get(cookieName);

    if (!token) {
      token = crypto.randomUUID();
      cookies.set(cookieName, token, {
        path: "/",
        httpOnly: true,
        sameSite: "strict",
        secure: true,
      });
    }

    // 2. Blokada dostępu do API
    if (isApi) {
      const requestToken = request.headers.get(headerName);

      // Walidacja: Token musi istnieć i zgadzać się z ciasteczkiem
      if (!token || !requestToken || requestToken !== token) {
        throw error(403, {
          message: "Access Denied: ApiGuard validation failed",
        });
      }
    }

    const response = await resolve(event);

    const shouldEncrypt = isApi && !dev;

    if (
      shouldEncrypt &&
      response.headers.get("content-type")?.includes("application/json")
    ) {
      const originalData = await response.text();
      const encryptedData = encrypt(originalData, token); // Twoja funkcja AES

      return new Response(JSON.stringify({ _enc: encryptedData }), {
        status: response.status,
        headers: response.headers,
      });
    }

    return response;
  };
};
