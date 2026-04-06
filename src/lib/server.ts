import { error, type RequestEvent } from "@sveltejs/kit";
import { ApiGuardOptions } from "./types";
import { dev } from "$app/environment";

export const apiGuard = (event: RequestEvent) => {
  const { request, url, cookies } = event;
  const cookieName = "x-api-guard-token";
  const headerName = "x-api-guard-token";

  // 1. POBIERZ ISTNIEJĄCY TOKEN
  let token = cookies.get(cookieName);

  // 2. JEŚLI TO ŚCIEŻKA API -> TUTAJ JESTEŚMY RESTRYKCYJNI
  if (url.pathname.startsWith("/api")) {
    const requestToken = request.headers.get(headerName);

    // BLOKADA: Jeśli nie ma tokena w ogóle lub się nie zgadza
    if (!token || !requestToken || requestToken !== token) {
      throw error(403, "Direct API access is forbidden");
    }

    // Jeśli doszliśmy tutaj, API jest bezpieczne
    return;
  }

  // 3. JEŚLI TO ZWYKŁA STRONA (nie API) -> GENERUJEMY TOKEN DLA FRONTENDU
  // To się wykona, gdy użytkownik wejdzie na "/" lub "/dashboard"
  if (!token) {
    token = crypto.randomUUID();
    cookies.set(cookieName, token, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: !dev,
    });
  }
};
