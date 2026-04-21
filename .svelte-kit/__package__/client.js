var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
import { page } from "$app/state";
// Cache dla klucza CryptoKey na kliencie
var cachedToken = null;
var cachedKey = null;
function getDecryptionKey(sessionToken) {
    return __awaiter(this, void 0, Promise, function () {
        var cryptoObj, encoder, keyRaw;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (cachedToken === sessionToken && cachedKey) {
                        return [2 /*return*/, cachedKey];
                    }
                    cryptoObj = typeof window !== "undefined" ? window.crypto : globalThis.crypto;
                    if (!cryptoObj || !cryptoObj.subtle) {
                        throw new Error("Web Crypto API (crypto.subtle) is not available. " +
                            "This usually happens when the site is not served over HTTPS or localhost (Secure Context).");
                    }
                    encoder = new TextEncoder();
                    return [4 /*yield*/, cryptoObj.subtle.digest("SHA-256", encoder.encode(sessionToken))];
                case 1:
                    keyRaw = _a.sent();
                    return [4 /*yield*/, cryptoObj.subtle.importKey("raw", keyRaw, { name: "AES-GCM" }, false, ["decrypt"])];
                case 2:
                    cachedKey = _a.sent();
                    cachedToken = sessionToken;
                    return [2 /*return*/, cachedKey];
            }
        });
    });
}
/**
 * Deszyfruje dane zakodowane AES-256-GCM po stronie serwera.
 * @param encData String w Base64 (IV + Data + Tag)
 * @param sessionToken Surowy token (UUID) lub wynik generateEncryptionKey
 */
function decrypt(encData, sessionToken) {
    return __awaiter(this, void 0, Promise, function () {
        var key, cryptoObj, base64ToUint8, bytes, ivBuffer, dataWithTagBuffer, decryptedBuffer, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getDecryptionKey(sessionToken)];
                case 1:
                    key = _a.sent();
                    cryptoObj = typeof window !== "undefined" ? window.crypto : globalThis.crypto;
                    base64ToUint8 = function (base64) {
                        var binaryString = atob(base64);
                        var bytes = new Uint8Array(binaryString.length);
                        for (var i = 0; i < binaryString.length; i++) {
                            bytes[i] = binaryString.charCodeAt(i);
                        }
                        return bytes;
                    };
                    bytes = base64ToUint8(encData);
                    ivBuffer = bytes.slice(0, 12);
                    dataWithTagBuffer = bytes.slice(12);
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, cryptoObj.subtle.decrypt({
                            name: "AES-GCM",
                            iv: ivBuffer,
                            tagLength: 128, // Standardowa długość tagu w bitach (16 bajtów * 8)
                        }, key, dataWithTagBuffer)];
                case 3:
                    decryptedBuffer = _a.sent();
                    return [2 /*return*/, new TextDecoder().decode(decryptedBuffer)];
                case 4:
                    error_1 = _a.sent();
                    console.error("BŁĄD DESZYFROWANIA: Klucz nie pasuje lub dane są uszkodzone.");
                    throw error_1;
                case 5: return [2 /*return*/];
            }
        });
    });
}
export var secureFetch = function (input, init) { return __awaiter(void 0, void 0, Promise, function () {
    var token, pageData, headers, fetcher, request, contentType, parsedData, responseData, decryptedStr, e_1, textData, errorMessage, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 12, , 13]);
                token = init === null || init === void 0 ? void 0 : init.token;
                if (!token) {
                    try {
                        pageData = page.data;
                        token = pageData.apiToken || pageData.x_api_guard_token;
                    }
                    catch (_b) {
                        // Ignorujemy brak $app/state po stronie serwera
                    }
                }
                if (!token) {
                    if (typeof window !== "undefined") {
                        console.warn("ApiGuard: No token found. Requests might fail.");
                    }
                }
                headers = new Headers(init === null || init === void 0 ? void 0 : init.headers);
                if (token)
                    headers.set("x-api-guard-token", token);
                fetcher = (init === null || init === void 0 ? void 0 : init.fetch) || fetch;
                return [4 /*yield*/, fetcher(input, __assign(__assign({}, init), { headers: headers }))];
            case 1:
                request = _a.sent();
                contentType = request.headers.get("content-type");
                parsedData = void 0;
                if (!(contentType === null || contentType === void 0 ? void 0 : contentType.includes("application/json"))) return [3 /*break*/, 9];
                return [4 /*yield*/, request.json()];
            case 2:
                responseData = _a.sent();
                if (!responseData._enc) return [3 /*break*/, 7];
                if (!!token) return [3 /*break*/, 3];
                parsedData = responseData;
                return [3 /*break*/, 6];
            case 3:
                _a.trys.push([3, 5, , 6]);
                return [4 /*yield*/, decrypt(responseData._enc, token)];
            case 4:
                decryptedStr = _a.sent();
                parsedData = JSON.parse(decryptedStr);
                return [3 /*break*/, 6];
            case 5:
                e_1 = _a.sent();
                console.error("Decryption failed!", e_1);
                parsedData = responseData;
                return [3 /*break*/, 6];
            case 6: return [3 /*break*/, 8];
            case 7:
                parsedData = responseData;
                _a.label = 8;
            case 8: return [3 /*break*/, 11];
            case 9: return [4 /*yield*/, request.text()];
            case 10:
                textData = _a.sent();
                try {
                    parsedData = JSON.parse(textData);
                }
                catch (_c) {
                    parsedData = { data: textData };
                }
                _a.label = 11;
            case 11:
                // --- Normalizacja Formatowania ---
                // Jeżeli żądanie jest nieudane na poziomie HTTP (np status 403 z ApiGuard lub 500)
                if (!request.ok) {
                    errorMessage = (parsedData === null || parsedData === void 0 ? void 0 : parsedData.message) ||
                        (parsedData === null || parsedData === void 0 ? void 0 : parsedData.error) ||
                        "HTTP Error ".concat(request.status);
                    return [2 /*return*/, {
                            success: false,
                            data: null,
                            error: errorMessage,
                            status: request.status,
                        }];
                }
                // Jeśli sukces, to *ZAWSZE* bezwzględnie zamykamy odpowiedź serwera do property 'data'
                return [2 /*return*/, { success: true, data: parsedData }];
            case 12:
                err_1 = _a.sent();
                // Kiedy padnie kompletnie np sieć (Network Offline lub parsowanie)
                return [2 /*return*/, {
                        success: false,
                        data: null,
                        error: (err_1 === null || err_1 === void 0 ? void 0 : err_1.message) || "Wystąpił nieoczekiwany błąd podczas połączenia.",
                    }];
            case 13: return [2 /*return*/];
        }
    });
}); };
