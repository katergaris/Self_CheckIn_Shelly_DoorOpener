// functions/_lib/store.js
// Persistenza della configurazione.
//
// Priorità delle sorgenti:
//   1. Namespace KV collegato al progetto  -> lettura E scrittura (modifiche immediate)
//   2. Variabile d'ambiente CONFIG         -> sola lettura (modalità legacy / bootstrap)
//
// Al primo avvio, se esiste un namespace KV vuoto e una variabile CONFIG,
// la configurazione viene migrata automaticamente dentro KV.

import { normalizeShellyServer } from "./shelly.js";
import { LANGUAGES, DEFAULT_LANGUAGE, isLanguage } from "./i18n.js";

export const CONFIG_KEY = "config";

// Nomi di binding riconosciuti automaticamente, in ordine di preferenza.
const PREFERRED_BINDINGS = [
  "CONFIG_KV", "SETUP_KV", "OPENDOOR_KV", "SETTINGS_KV",
  "CONFIG_STORE", "SETTINGS", "STORE", "KV",
];

/**
 * Un binding KV espone get/put/delete/list/getWithMetadata.
 * `getWithMetadata` distingue KV da altri binding simili (es. R2).
 */
function isKvNamespace(binding) {
  return (
    !!binding &&
    typeof binding === "object" &&
    typeof binding.get === "function" &&
    typeof binding.put === "function" &&
    typeof binding.delete === "function" &&
    typeof binding.getWithMetadata === "function"
  );
}

/** Trova il namespace KV collegato, qualunque nome gli sia stato dato. */
export function findStore(env) {
  for (const name of PREFERRED_BINDINGS) {
    if (isKvNamespace(env[name])) return { name, kv: env[name] };
  }
  for (const name of Object.keys(env)) {
    if (isKvNamespace(env[name])) return { name, kv: env[name] };
  }
  return null;
}

function str(value) {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

let idCounter = 0;
function newDoorId() {
  idCounter += 1;
  return `door_${Date.now().toString(36)}_${idCounter.toString(36)}`;
}

export function emptyConfig() {
  return {
    mode: "sequence",
    languages: [...LANGUAGES],
    default_language: DEFAULT_LANGUAGE,
    emergency_contact: "",
    access_pin: "",
    instructions: emptyText(),
    shelly: { server: "", auth_key: "" },
    doors: [],
  };
}

function emptyText() {
  const value = {};
  for (const code of LANGUAGES) value[code] = "";
  return value;
}

/**
 * Normalizza un campo di testo localizzato.
 * Una stringa semplice (formato precedente) finisce nella lingua predefinita.
 */
function localizedText(raw, defaultLanguage) {
  const value = emptyText();
  if (raw && typeof raw === "object") {
    for (const code of LANGUAGES) {
      if (typeof raw[code] === "string") value[code] = raw[code].trim();
    }
    return value;
  }
  const plain = str(raw);
  if (plain) value[isLanguage(defaultLanguage) ? defaultLanguage : DEFAULT_LANGUAGE] = plain;
  return value;
}

function hasText(field) {
  return LANGUAGES.some((code) => field[code]);
}

/**
 * Normalizza qualsiasi configurazione (anche nel vecchio formato) nello schema corrente.
 * Accetta sia `shelly.server` / `shelly.auth_key` condivisi, sia i valori per singola porta.
 */
export function normalizeConfig(raw) {
  const config = emptyConfig();
  if (!raw || typeof raw !== "object") return config;

  config.mode = raw.mode === "choice" ? "choice" : "sequence";

  config.default_language = isLanguage(raw.default_language) ? raw.default_language : DEFAULT_LANGUAGE;
  const requested = Array.isArray(raw.languages) ? raw.languages.filter(isLanguage) : null;
  config.languages = requested && requested.length ? [...new Set(requested)] : [...LANGUAGES];
  // La lingua predefinita deve essere fra quelle attive.
  if (!config.languages.includes(config.default_language)) {
    config.default_language = config.languages[0];
  }

  config.emergency_contact = str(raw.emergency_contact);
  config.access_pin = str(raw.access_pin);
  config.instructions = localizedText(raw.instructions, config.default_language);

  const shared = raw.shelly && typeof raw.shelly === "object" ? raw.shelly : {};
  config.shelly.server = str(shared.server ?? raw.server);
  config.shelly.auth_key = str(shared.auth_key ?? raw.auth_key);

  const doors = Array.isArray(raw.doors) ? raw.doors : [];
  config.doors = doors
    .filter((door) => door && typeof door === "object")
    .map((door) => ({
      id: str(door.id) || newDoorId(),
      name: localizedText(door.name, config.default_language),
      instructions: localizedText(door.instructions, config.default_language),
      server: str(door.server),
      device_id: str(door.device_id ?? door.deviceId),
      auth_key: str(door.auth_key ?? door.authKey),
      pin: str(door.pin),
    }));

  hoistSharedCredentials(config);
  return config;
}

/**
 * Se tutte le porte usano lo stesso server / auth key, li promuove a credenziali
 * condivise e li rimuove dalle singole porte: aggiungere un dispositivo richiede
 * poi solo nome + Device ID.
 */
function hoistSharedCredentials(config) {
  for (const field of ["server", "auth_key"]) {
    if (config.shelly[field]) continue;
    const values = config.doors.map((door) => door[field]).filter(Boolean);
    if (values.length !== config.doors.length || values.length === 0) continue;
    if (values.some((value) => value !== values[0])) continue;
    config.shelly[field] = values[0];
  }
  // Rimuove gli override ridondanti (identici al valore condiviso).
  for (const door of config.doors) {
    for (const field of ["server", "auth_key"]) {
      if (door[field] && door[field] === config.shelly[field]) door[field] = "";
    }
  }
}

/** Credenziali effettive di una porta: override della porta, altrimenti condivise. */
export function resolveDoor(config, door) {
  if (!door) return null;
  return {
    ...door,
    server: door.server || config.shelly.server,
    auth_key: door.auth_key || config.shelly.auth_key,
  };
}

/** Errori bloccanti per il salvataggio (lista vuota = configurazione valida). */
export function validateConfig(config) {
  const errors = [];
  if (!Array.isArray(config.doors) || config.doors.length === 0) {
    errors.push("Aggiungi almeno una porta.");
  }
  if (config.access_pin && !/^[0-9]{4,12}$/.test(config.access_pin)) {
    errors.push("Il codice di accesso deve contenere da 4 a 12 cifre.");
  }
  config.doors.forEach((door, index) => {
    const position = `Porta #${index + 1}`;
    const resolved = resolveDoor(config, door);
    if (!hasText(door.name)) errors.push(`${position}: manca il nome.`);
    else if (!door.name[config.default_language]) {
      const label = config.default_language === "it" ? "italiano" : "inglese";
      errors.push(`${position}: manca il nome in ${label} (lingua predefinita).`);
    }
    if (!resolved.device_id) errors.push(`${position}: manca il Device ID.`);
    if (!resolved.server) errors.push(`${position}: manca il server Shelly.`);
    else if (!normalizeShellyServer(resolved.server)) {
      errors.push(`${position}: server Shelly non valido (es. shelly-281-eu).`);
    }
    if (!resolved.auth_key) errors.push(`${position}: manca la Auth Key.`);
    if (door.pin && !/^[0-9]{3,10}$/.test(door.pin)) {
      errors.push(`${position}: il PIN deve contenere da 3 a 10 cifre.`);
    }
  });
  return errors;
}

function parseEnvConfig(env) {
  if (!env.CONFIG || typeof env.CONFIG !== "string") return null;
  try {
    return normalizeConfig(JSON.parse(env.CONFIG));
  } catch {
    return null;
  }
}

/**
 * Carica la configurazione corrente.
 * Ritorna { config, source, storeName, writable }.
 *   source: "kv" | "kv-migrated" | "env" | "empty"
 */
export async function loadConfig(env) {
  const store = findStore(env);

  if (store) {
    let stored = null;
    try {
      stored = await store.kv.get(CONFIG_KEY, { type: "json" });
    } catch {
      stored = null;
    }
    if (stored) {
      return { config: normalizeConfig(stored), source: "kv", storeName: store.name, writable: true };
    }

    // Namespace vuoto: migra una eventuale configurazione legacy da env.CONFIG.
    const legacy = parseEnvConfig(env);
    if (legacy) {
      try {
        await store.kv.put(CONFIG_KEY, JSON.stringify(legacy));
        return { config: legacy, source: "kv-migrated", storeName: store.name, writable: true };
      } catch {
        return { config: legacy, source: "env", storeName: store.name, writable: false };
      }
    }
    return { config: emptyConfig(), source: "empty", storeName: store.name, writable: true };
  }

  const legacy = parseEnvConfig(env);
  if (legacy) return { config: legacy, source: "env", storeName: null, writable: false };
  return { config: emptyConfig(), source: "empty", storeName: null, writable: false };
}

/** Salva la configurazione su KV. Lancia un errore se non c'è nessun namespace collegato. */
export async function saveConfig(env, config) {
  const store = findStore(env);
  if (!store) {
    throw new Error(
      "Nessun namespace KV collegato al progetto: il salvataggio automatico non è disponibile. " +
        "Collega un namespace KV dalle impostazioni di Cloudflare Pages, oppure usa l'esportazione manuale."
    );
  }
  await store.kv.put(CONFIG_KEY, JSON.stringify(config));
  return { storeName: store.name };
}
