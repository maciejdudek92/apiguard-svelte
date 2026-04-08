import crypto from "node:crypto";

const algorithm = "aes-256-cbc";
// Klucz powinien mieć 32 bajty dla aes-256
const key = crypto.scryptSync(
  process.env.SECRET_SALT ?? "default-salt",
  "constant-salt",
  32,
);

function encrypt(text: string): string {
  // IV generujemy WEWNĄTRZ funkcji dla każdego wywołania
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Zwracamy IV i zaszyfrowany tekst rozdzielone dwukropkiem
  return `${iv.toString("hex")}:${encrypted}`;
}

/**
 * Odszyfrowywanie tokena
 */
function decrypt(encryptedData: string): string {
  const [ivHex, encryptedText] = encryptedData.split(":");

  if (!ivHex || !encryptedText) {
    throw new Error("Nieprawidłowy format zaszyfrowanych danych");
  }

  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(algorithm, key, iv);

  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
