import {
  error,
  Handle,
  ResolveOptions,
  type RequestEvent,
  type MaybePromise,
} from "@sveltejs/kit";
import { ApiGuardOptions } from "./types";
import crypto from "node:crypto";

const keyCache = new Map<string, Buffer>();

function getEncryptionKey(token: string): Buffer {
  let key = keyCache.get(token);
  if (!key) {
    key = crypto.createHash("sha256").update(token).digest();
    keyCache.set(token, key);
  }
  return key;
}

function encrypt(text: string, token: string) {
  const iv = crypto.randomBytes(12);
  const key = getEncryptionKey(token);

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = cipher.update(text, "utf8");
  const final = cipher.final();
  const authTag = cipher.getAuthTag();

  // Łączymy w jeden bufor: IV (12 bajtów) + zaszyfrowane dane + AuthTag (16 bajtów)
  const combinedBuffer = Buffer.concat([iv, encrypted, final, authTag]);

  // Zwracamy jako jeden łańcuch znaków w Base64
  return combinedBuffer.toString("base64");
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
        secure: !dev, // W trybie dev (false) ciasteczko NIE będzie miało flagi Secure (działa na http)
      });
    }

    // --- DODANE: Przekazanie tokenu do locals dla łatwiejszego dostępu w load ---
    // @ts-ignore
    event.locals.apiToken = token;
    // @ts-ignore
    event.locals.x_api_guard_token = token;

    // 2. Blokada dostępu do API w poszukiwaniu x-api-guard-token
    if (isApi) {
      // Ignorujemy sprawdzanie dla wewnętrznych zapytań SvelteKita (np. fetch w load)
      if (!event.isSubRequest) {
        const requestToken = request.headers.get(headerName);

        // Walidacja: Token musi istnieć i zgadzać się z tym zapisanym w ciasteczku/locals
        if (!token || !requestToken || requestToken !== token) {
          throw error(403, {
            message: "Access Denied: ApiGuard validation failed",
          });
        }
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

      const newHeaders = new Headers(response.headers);
      newHeaders.delete("content-length");
      newHeaders.delete("content-encoding");

      return new Response(JSON.stringify({ _enc: encryptedData }), {
        status: response.status,
        headers: newHeaders,
      });
    }

    return response;
  };
};
