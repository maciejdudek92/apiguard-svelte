import { page } from "$app/state";

// Cache dla klucza CryptoKey na kliencie
let cachedToken: string | null = null;
let cachedKey: CryptoKey | null = null;

async function getDecryptionKey(sessionToken: string): Promise<CryptoKey> {
  if (cachedToken === sessionToken && cachedKey) {
    return cachedKey;
  }

  const cryptoObj =
    typeof window !== "undefined" ? window.crypto : globalThis.crypto;

  if (!cryptoObj || !cryptoObj.subtle) {
    throw new Error(
      "Web Crypto API (crypto.subtle) is not available. " +
        "This usually happens when the site is not served over HTTPS or localhost (Secure Context).",
    );
  }

  const encoder = new TextEncoder();
  const keyRaw = await cryptoObj.subtle.digest(
    "SHA-256",
    encoder.encode(sessionToken),
  );

  cachedKey = await cryptoObj.subtle.importKey(
    "raw",
    keyRaw,
    { name: "AES-GCM" },
    false,
    ["decrypt"],
  );
  cachedToken = sessionToken;

  return cachedKey;
}

/**
 * Deszyfruje dane zakodowane AES-256-GCM po stronie serwera.
 * @param encData String w Base64 (IV + Data + Tag)
 * @param sessionToken Surowy token (UUID) lub wynik generateEncryptionKey
 */
async function decrypt(encData: string, sessionToken: string): Promise<string> {
  const key = await getDecryptionKey(sessionToken);

  const cryptoObj =
    typeof window !== "undefined" ? window.crypto : globalThis.crypto;

  const base64ToUint8 = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  // 1. Zoptymalizowany parsing jednej wartości Base64
  const bytes = base64ToUint8(encData);

  // IV jest zawsze na pierwszych 12 bajtach
  const ivBuffer = bytes.slice(0, 12);
  // Sklejone dane + tag to reszta
  const dataWithTagBuffer = bytes.slice(12);

  // 2. Deszyfrowanie
  try {
    const decryptedBuffer = await cryptoObj.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: ivBuffer,
        tagLength: 128, // Standardowa długość tagu w bitach (16 bajtów * 8)
      },
      key,
      dataWithTagBuffer,
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    console.error(
      "BŁĄD DESZYFROWANIA: Klucz nie pasuje lub dane są uszkodzone.",
    );
    throw error;
  }
}
export interface SecureFetchInit extends RequestInit {
  fetch?: typeof fetch;
  token?: string;
}

export const secureFetch = async <T = any>(
  input: RequestInfo | URL,
  init?: SecureFetchInit,
): Promise<T> => {
  try {
    let token = init?.token;

    if (!token) {
      try {
        const pageData = page.data;
        token = pageData.apiToken || pageData.x_api_guard_token;
      } catch {
        // Ignorujemy brak $app/state po stronie serwera
      }
    }

    if (!token) {
      if (typeof window !== "undefined") {
        console.warn("ApiGuard: No token found. Requests might fail.");
      }
    }

    const headers = new Headers(init?.headers);
    if (token) headers.set("x-api-guard-token", token);

    const fetcher = init?.fetch || fetch;
    const request = await fetcher(input, { ...init, headers });

    const contentType = request.headers.get("content-type");
    let parsedData: any;

    if (contentType?.includes("application/json")) {
      const responseData = await request.json();

      if (responseData._enc) {
        if (!token) {
          parsedData = responseData;
        } else {
          try {
            const decryptedStr = await decrypt(responseData._enc, token);
            parsedData = JSON.parse(decryptedStr);
          } catch (e) {
            console.error("Decryption failed!", e);
            parsedData = responseData;
          }
        }
      } else {
        parsedData = responseData;
      }
    } else {
      // Fallback dla odpowiedzi typu text lub innych
      const textData = await request.text();
      try {
        parsedData = JSON.parse(textData);
      } catch {
        parsedData = { data: textData };
      }
    }

    // --- Normalizacja Formatowania ---
    // Jeżeli żądanie jest nieudane na poziomie HTTP (np status 403 z ApiGuard lub 500)
    if (!request.ok) {
      // SvelteKit najczęściej w rzucanych errorach umieszcza treść pod propercją `message`
      const errorMessage =
        parsedData?.message ||
        parsedData?.error ||
        `HTTP Error ${request.status}`;
      return {
        success: false,
        data: null,
        error: errorMessage,
        status: request.status,
      } as unknown as T;
    }

    // Jeśli sukces, to *ZAWSZE* bezwzględnie zamykamy odpowiedź serwera do property 'data'
    return { success: true, data: parsedData } as unknown as T;
  } catch (err: any) {
    // Kiedy padnie kompletnie np sieć (Network Offline lub parsowanie)
    return {
      success: false,
      data: null,
      error: err?.message || "Wystąpił nieoczekiwany błąd podczas połączenia.",
    } as unknown as T;
  }
};
