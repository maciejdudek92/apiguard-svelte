import { page } from "$app/state";

/**
 * Deszyfruje dane zakodowane AES-256-GCM po stronie serwera.
 * @param encObject Obiekt zawierający iv, data i tag w Base64
 * @param sessionToken Surowy token (UUID) lub wynik generateEncryptionKey
 */
async function decrypt(
  encObject: { iv: string; data: string; tag: string },
  sessionToken: string,
): Promise<string> {
  const { iv, data, tag } = encObject;

  // 1. Przygotowanie klucza (Musi być identyczne z crypto.createHash("sha256") na serwerze)
  const encoder = new TextEncoder();
  const keyRaw = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(sessionToken),
  );

  const key = await crypto.subtle.importKey(
    "raw",
    keyRaw,
    { name: "AES-GCM" },
    false,
    ["decrypt"],
  );

  // 2. Dekodowanie Base64 do Uint8Array
  const base64ToUint8 = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const ivBuffer = base64ToUint8(iv);
  const dataBuffer = base64ToUint8(data);
  const tagBuffer = base64ToUint8(tag);

  // 3. Łączenie Ciphertextu i Auth Tagu
  // Web Crypto API wymaga, aby tag był doklejony na końcu encrypted data
  const combinedBuffer = new Uint8Array(dataBuffer.length + tagBuffer.length);
  combinedBuffer.set(dataBuffer);
  combinedBuffer.set(tagBuffer, dataBuffer.length);

  // 4. Deszyfrowanie
  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: ivBuffer,
        tagLength: 128, // Standardowa długość tagu w bitach (16 bajtów * 8)
      },
      key,
      combinedBuffer,
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    console.error(
      "BŁĄD DESZYFROWANIA: Klucz nie pasuje lub dane są uszkodzone.",
    );
    throw error;
  }
}
export const secureFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit,
) => {
  const pageData = page.data;
  // Sprawdź dokładnie klucz, pod którym przekazujesz token w load()
  const token = pageData.apiToken || pageData.x_api_guard_token;

  if (!token) {
    console.warn("ApiGuard: No token found in page data. Requests might fail.");
  }

  const headers = new Headers(init?.headers);
  if (token) headers.set("x-api-guard-token", token);

  const request = await fetch(input, { ...init, headers });

  if (
    request.ok &&
    request.headers.get("content-type")?.includes("application/json")
  ) {
    // Klonujemy odpowiedź, aby móc ją przeczytać jako JSON
    const responseData = await request.json();

    if (responseData._enc) {
      if (!token) throw new Error("Missing token for decryption");

      try {
        const decryptedStr = await decrypt(responseData._enc, token);

        // Zwracamy nową odpowiedź z odszyfrowanym stringiem
        return new Response(decryptedStr, {
          status: request.status,
          headers: request.headers, // Zachowujemy oryginalne nagłówki
        });
      } catch (e) {
        console.error(
          "Decryption failed! Key mismatch (did date change?) or corrupted data.",
          e,
        );
        // W razie błędu zwracamy oryginalny (zaszyfrowany) JSON, żeby nie "ubić" aplikacji całkowicie
        return new Response(JSON.stringify(responseData), {
          status: request.status,
        });
      }
    }

    // Jeśli nie było pola _enc, zwróć oryginalny JSON
    return new Response(JSON.stringify(responseData), {
      status: request.status,
      headers: request.headers,
    });
  }

  return request;
};
