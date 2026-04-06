import { error } from "@sveltejs/kit";
import { dev } from "$app/environment";
export var apiGuard = function (event) {
    var request = event.request, url = event.url, cookies = event.cookies;
    var cookieName = "x-api-guard-token";
    var headerName = "x-api-guard-token";
    // 1. POBIERZ ISTNIEJĄCY TOKEN
    var token = cookies.get(cookieName);
    // 2. JEŚLI TO ŚCIEŻKA API -> TUTAJ JESTEŚMY RESTRYKCYJNI
    if (url.pathname.startsWith("/api")) {
        var requestToken = request.headers.get(headerName);
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
