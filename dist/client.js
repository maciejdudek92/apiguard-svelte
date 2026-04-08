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
/**
 * Deszyfruje dane zakodowane AES-256-GCM po stronie serwera.
 * @param encObject Obiekt zawierający iv, data i tag w Base64
 * @param sessionToken Surowy token (UUID) lub wynik generateEncryptionKey
 */
function decrypt(encObject, sessionToken) {
    return __awaiter(this, void 0, Promise, function () {
        var iv, data, tag, encoder, keyRaw, key, base64ToUint8, ivBuffer, dataBuffer, tagBuffer, combinedBuffer, decryptedBuffer, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    iv = encObject.iv, data = encObject.data, tag = encObject.tag;
                    encoder = new TextEncoder();
                    return [4 /*yield*/, crypto.subtle.digest("SHA-256", encoder.encode(sessionToken))];
                case 1:
                    keyRaw = _a.sent();
                    return [4 /*yield*/, crypto.subtle.importKey("raw", keyRaw, { name: "AES-GCM" }, false, ["decrypt"])];
                case 2:
                    key = _a.sent();
                    base64ToUint8 = function (base64) {
                        var binaryString = atob(base64);
                        var bytes = new Uint8Array(binaryString.length);
                        for (var i = 0; i < binaryString.length; i++) {
                            bytes[i] = binaryString.charCodeAt(i);
                        }
                        return bytes;
                    };
                    ivBuffer = base64ToUint8(iv);
                    dataBuffer = base64ToUint8(data);
                    tagBuffer = base64ToUint8(tag);
                    combinedBuffer = new Uint8Array(dataBuffer.length + tagBuffer.length);
                    combinedBuffer.set(dataBuffer);
                    combinedBuffer.set(tagBuffer, dataBuffer.length);
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, crypto.subtle.decrypt({
                            name: "AES-GCM",
                            iv: ivBuffer,
                            tagLength: 128, // Standardowa długość tagu w bitach (16 bajtów * 8)
                        }, key, combinedBuffer)];
                case 4:
                    decryptedBuffer = _a.sent();
                    return [2 /*return*/, new TextDecoder().decode(decryptedBuffer)];
                case 5:
                    error_1 = _a.sent();
                    console.error("BŁĄD DESZYFROWANIA: Klucz nie pasuje lub dane są uszkodzone.");
                    throw error_1;
                case 6: return [2 /*return*/];
            }
        });
    });
}
export var secureFetch = function (input, init) { return __awaiter(void 0, void 0, void 0, function () {
    var pageData, token, headers, request, responseData, decryptedStr, e_1;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                pageData = page.data;
                token = pageData.apiToken || pageData.x_api_guard_token;
                if (!token) {
                    console.warn("ApiGuard: No token found in page data. Requests might fail.");
                }
                headers = new Headers(init === null || init === void 0 ? void 0 : init.headers);
                if (token)
                    headers.set("x-api-guard-token", token);
                return [4 /*yield*/, fetch(input, __assign(__assign({}, init), { headers: headers }))];
            case 1:
                request = _b.sent();
                if (!(request.ok &&
                    ((_a = request.headers.get("content-type")) === null || _a === void 0 ? void 0 : _a.includes("application/json")))) return [3 /*break*/, 7];
                return [4 /*yield*/, request.json()];
            case 2:
                responseData = _b.sent();
                if (!responseData._enc) return [3 /*break*/, 6];
                if (!token)
                    throw new Error("Missing token for decryption");
                _b.label = 3;
            case 3:
                _b.trys.push([3, 5, , 6]);
                return [4 /*yield*/, decrypt(responseData._enc, token)];
            case 4:
                decryptedStr = _b.sent();
                // Zwracamy nową odpowiedź z odszyfrowanym stringiem
                return [2 /*return*/, new Response(decryptedStr, {
                        status: request.status,
                        headers: request.headers, // Zachowujemy oryginalne nagłówki
                    })];
            case 5:
                e_1 = _b.sent();
                console.error("Decryption failed! Key mismatch (did date change?) or corrupted data.", e_1);
                // W razie błędu zwracamy oryginalny (zaszyfrowany) JSON, żeby nie "ubić" aplikacji całkowicie
                return [2 /*return*/, new Response(JSON.stringify(responseData), {
                        status: request.status,
                    })];
            case 6: 
            // Jeśli nie było pola _enc, zwróć oryginalny JSON
            return [2 /*return*/, new Response(JSON.stringify(responseData), {
                    status: request.status,
                    headers: request.headers,
                })];
            case 7: return [2 /*return*/, request];
        }
    });
}); };
