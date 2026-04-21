var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { error, } from "@sveltejs/kit";
import crypto from "node:crypto";
var keyCache = new Map();
function getEncryptionKey(token) {
    var key = keyCache.get(token);
    if (!key) {
        key = crypto.createHash("sha256").update(token).digest();
        keyCache.set(token, key);
    }
    return key;
}
function encrypt(text, token) {
    var iv = crypto.randomBytes(12);
    var key = getEncryptionKey(token);
    var cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    var encrypted = cipher.update(text, "utf8");
    var final = cipher.final();
    var authTag = cipher.getAuthTag();
    // Łączymy w jeden bufor: IV (12 bajtów) + zaszyfrowane dane + AuthTag (16 bajtów)
    var combinedBuffer = Buffer.concat([iv, encrypted, final, authTag]);
    // Zwracamy jako jeden łańcuch znaków w Base64
    return combinedBuffer.toString("base64");
}
export var createApiGuard = function (options) {
    if (options === void 0) { options = {}; }
    var _a = options.apiPrefix, apiPrefix = _a === void 0 ? "/api" : _a, _b = options.cookieName, cookieName = _b === void 0 ? "x-api-guard-token" : _b, _c = options.headerName, headerName = _c === void 0 ? "x-api-guard-token" : _c, _d = options.dev, dev = _d === void 0 ? false : _d;
    return function (event, resolve) { return __awaiter(void 0, void 0, void 0, function () {
        var request, url, cookies, isApi, token, requestToken, response, shouldEncrypt, originalData, encryptedData, newHeaders;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    request = event.request, url = event.url, cookies = event.cookies;
                    isApi = url.pathname.startsWith(apiPrefix);
                    token = cookies.get(cookieName);
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
                            requestToken = request.headers.get(headerName);
                            // Walidacja: Token musi istnieć i zgadzać się z tym zapisanym w ciasteczku/locals
                            if (!token || !requestToken || requestToken !== token) {
                                throw error(403, {
                                    message: "Access Denied: ApiGuard validation failed",
                                });
                            }
                        }
                    }
                    return [4 /*yield*/, resolve(event)];
                case 1:
                    response = _b.sent();
                    shouldEncrypt = isApi && !dev;
                    if (!(shouldEncrypt &&
                        ((_a = response.headers.get("content-type")) === null || _a === void 0 ? void 0 : _a.includes("application/json")))) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.text()];
                case 2:
                    originalData = _b.sent();
                    encryptedData = encrypt(originalData, token);
                    newHeaders = new Headers(response.headers);
                    newHeaders.delete("content-length");
                    newHeaders.delete("content-encoding");
                    return [2 /*return*/, new Response(JSON.stringify({ _enc: encryptedData }), {
                            status: response.status,
                            headers: newHeaders,
                        })];
                case 3: return [2 /*return*/, response];
            }
        });
    }); };
};
