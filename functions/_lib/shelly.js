// functions/_lib/shelly.js
// Normalizzazione dell'host Shelly Cloud e invio del comando di apertura.

const SHELLY_DOMAIN = ".shelly.cloud";

/**
 * Accetta tutte le forme in cui l'host viene copiato dall'app Shelly
 * ("shelly-281-eu", "shelly-281-eu.shelly.cloud", "https://shelly-281-eu.shelly.cloud/")
 * e restituisce l'hostname completo, oppure null se non è un host Shelly valido.
 */
export function normalizeShellyServer(input) {
  let host = String(input || "").trim().toLowerCase();
  if (!host) return null;

  host = host.replace(/^https?:\/\//, "").split("/")[0].split("?")[0].split("@").pop();
  host = host.split(":")[0].replace(/\.$/, "");
  if (!host) return null;

  // Forma abbreviata: "shelly-281-eu" -> "shelly-281-eu.shelly.cloud"
  if (!host.includes(".")) host += SHELLY_DOMAIN;

  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(host)) return null;
  // Vincolo di sicurezza: il worker può contattare solo Shelly Cloud.
  if (!host.endsWith(SHELLY_DOMAIN)) return null;

  return host;
}

/**
 * Invia l'impulso di apertura al relè.
 * Ritorna { success, code, status } — il messaggio viene tradotto dal chiamante,
 * perché dipende dalla lingua scelta dall'ospite.
 */
export async function openDoor(door, { toggleAfter = 2 } = {}) {
  const host = normalizeShellyServer(door.server);
  if (!host) return { success: false, code: "shelly_bad_server" };
  if (!door.device_id || !door.auth_key) {
    return { success: false, code: "shelly_not_configured" };
  }

  let response;
  try {
    // auth_key inviata sia in querystring (forma storica, già collaudata)
    // sia nel body (forma documentata dall'API v2): Shelly accetta entrambe.
    const endpoint =
      `https://${host}/v2/devices/api/set/switch` +
      `?auth_key=${encodeURIComponent(door.auth_key)}`;
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: door.device_id,
        channel: 0,
        on: true,
        toggle_after: toggleAfter,
        auth_key: door.auth_key,
      }),
    });
  } catch {
    return { success: false, code: "shelly_unreachable" };
  }

  if (response.ok) return { success: true, code: "door_opened" };
  if (response.status === 401 || response.status === 403) {
    return { success: false, code: "shelly_bad_auth" };
  }
  if (response.status === 404) return { success: false, code: "shelly_device_not_found" };
  return { success: false, code: "shelly_error", status: response.status };
}
