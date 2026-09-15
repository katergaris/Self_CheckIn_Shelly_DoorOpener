// functions/_lib/auth.js
// Sessione amministrativa firmata (cookie HttpOnly), al posto della password in URL.

const COOKIE_NAME = "sc_setup";
const GUEST_COOKIE_NAME = "sc_guest";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 ore (amministratore)
const GUEST_TTL_SECONDS = 60 * 60 * 12; // 12 ore (ospite)
const encoder = new TextEncoder();

/** Confronto a tempo costante, per non far trapelare la password carattere per carattere. */
export function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);
  let diff = bufA.length ^ bufB.length;
  const length = Math.max(bufA.length, bufB.length);
  for (let i = 0; i < length; i++) {
    diff |= (bufA[i] || 0) ^ (bufB[i] || 0);
  }
  return diff === 0;
}

async function sign(secret, payload) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** Token di sessione: "<scadenza>.<hmac>", firmato con il segreto indicato. */
export async function createSessionToken(password, ttlSeconds = SESSION_TTL_SECONDS) {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  return `${expiresAt}.${await sign(password, String(expiresAt))}`;
}

export async function verifySessionToken(password, token) {
  if (!token || typeof token !== "string") return false;
  const separator = token.lastIndexOf(".");
  if (separator <= 0) return false;
  const expiresAt = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!/^[0-9]+$/.test(expiresAt) || Number(expiresAt) < Date.now()) return false;
  return safeEqual(signature, await sign(password, expiresAt));
}

export function readCookie(request, name = COOKIE_NAME) {
  const header = request.headers.get("Cookie") || "";
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index).trim() === name) {
      return decodeURIComponent(part.slice(index + 1).trim());
    }
  }
  return null;
}

function cookieAttributes(url, maxAge, sameSite) {
  const secure = url.protocol === "https:" ? " Secure;" : "";
  return `Path=/; HttpOnly;${secure} SameSite=${sameSite}; Max-Age=${maxAge}`;
}

export function sessionCookie(url, token) {
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; ${cookieAttributes(url, SESSION_TTL_SECONDS, "Strict")}`;
}

export function clearSessionCookie(url) {
  return `${COOKIE_NAME}=; ${cookieAttributes(url, 0, "Strict")}`;
}

/** true se la richiesta porta una sessione amministrativa valida. */
export async function isAuthenticated(request, password) {
  return verifySessionToken(password, readCookie(request));
}

/* ------------------------------------------------------------------ */
/* Sessione ospite: sblocco del codice di accesso                      */
/* ------------------------------------------------------------------ */

export async function createGuestToken(accessPin) {
  return createSessionToken(accessPin, GUEST_TTL_SECONDS);
}

export function guestCookie(url, token) {
  // SameSite=Lax (non Strict): l'ospite arriva quasi sempre da un link
  // esterno (WhatsApp, email, QR code) e non deve ridigitare il codice.
  return `${GUEST_COOKIE_NAME}=${encodeURIComponent(token)}; ${cookieAttributes(url, GUEST_TTL_SECONDS, "Lax")}`;
}

/** true se l'ospite ha già superato il codice di accesso (o se non è richiesto). */
export async function hasGuestAccess(request, accessPin) {
  if (!accessPin) return true;
  return verifySessionToken(accessPin, readCookie(request, GUEST_COOKIE_NAME));
}
