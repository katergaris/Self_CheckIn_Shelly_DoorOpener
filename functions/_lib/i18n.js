// functions/_lib/i18n.js
// Traduzioni dell'interfaccia pubblica (ospiti) e dei messaggi di apertura.
//
// I testi scritti dall'amministratore (nomi porte, istruzioni) NON stanno qui:
// sono campi localizzati salvati in configurazione, vedi pickText().

export const LANGUAGES = ["it", "en"];
export const DEFAULT_LANGUAGE = "it";

export const STRINGS = {
  it: {
    badge: "Controllo Ingressi",
    locked_title: "Codice di accesso",
    locked_hint: "Inserisci il codice che hai ricevuto.",
    locked_button: "Entra",
    locked_error: "Codice errato ❌",
    locked_expired: "Sessione scaduta: reinserisci il codice di accesso.",
    choose_title: "Seleziona ingresso",
    sequence_done: "Tutto aperto! Benvenuto",
    instructions_title: "Come fare",
    open_now: "Apri ora",
    open_verify: "Verifica e Apri",
    back: "Indietro",
    pin_title: "PIN per {name}",
    pin_placeholder: "••••",
    opening: "Apertura in corso…",
    connection_error: "Errore di connessione.",
    emergency: "📞 Assistenza Immediata",
    no_doors_title: "Nessuna porta configurata",
    no_doors_hint: "Apri la pagina {setup} per configurare i dispositivi.",
    door_opened: "{name} aperta! ✅",
    door_not_found: "Porta non trovata",
    pin_wrong: "PIN errato ❌",
    bad_request: "Richiesta non valida.",
    shelly_bad_server: "Server Shelly non valido ⚠️",
    shelly_not_configured: "Dispositivo non configurato correttamente ⚠️",
    shelly_unreachable: "Shelly Cloud non raggiungibile 📡",
    shelly_bad_auth: "Auth Key rifiutata da Shelly Cloud 🔑",
    shelly_device_not_found: "Device ID non trovato su Shelly Cloud ❓",
    shelly_error: "Errore Shelly Cloud ({status})",
  },
  en: {
    badge: "Entry Control",
    locked_title: "Access code",
    locked_hint: "Enter the code you were given.",
    locked_button: "Enter",
    locked_error: "Wrong code ❌",
    locked_expired: "Session expired: please enter the access code again.",
    choose_title: "Select entrance",
    sequence_done: "All open! Welcome",
    instructions_title: "What to do",
    open_now: "Open now",
    open_verify: "Check and open",
    back: "Back",
    pin_title: "PIN for {name}",
    pin_placeholder: "••••",
    opening: "Opening…",
    connection_error: "Connection error.",
    emergency: "📞 Immediate assistance",
    no_doors_title: "No doors configured",
    no_doors_hint: "Open {setup} to configure your devices.",
    door_opened: "{name} open! ✅",
    door_not_found: "Door not found",
    pin_wrong: "Wrong PIN ❌",
    bad_request: "Invalid request.",
    shelly_bad_server: "Invalid Shelly server ⚠️",
    shelly_not_configured: "Device not configured correctly ⚠️",
    shelly_unreachable: "Shelly Cloud unreachable 📡",
    shelly_bad_auth: "Auth Key rejected by Shelly Cloud 🔑",
    shelly_device_not_found: "Device ID not found on Shelly Cloud ❓",
    shelly_error: "Shelly Cloud error ({status})",
  },
};

/** Nome della lingua nella lingua stessa, per il selettore. */
export const LANGUAGE_LABELS = { it: "Italiano", en: "English" };

export function isLanguage(value) {
  return LANGUAGES.includes(value);
}

/** Traduce una chiave, sostituendo i segnaposto {nome}. */
export function t(lang, key, params) {
  const table = STRINGS[isLanguage(lang) ? lang : DEFAULT_LANGUAGE];
  let text = table[key] ?? STRINGS[DEFAULT_LANGUAGE][key] ?? key;
  if (params) {
    for (const name of Object.keys(params)) {
      text = text.split("{" + name + "}").join(String(params[name]));
    }
  }
  return text;
}

/**
 * Sceglie la lingua da usare: preferenza esplicita (?lang=), poi header
 * Accept-Language, poi lingua predefinita della configurazione.
 * `available` limita la scelta alle lingue attivate dall'amministratore.
 */
export function resolveLanguage({ explicit, acceptLanguage, fallback, available }) {
  const allowed = Array.isArray(available) && available.length ? available : LANGUAGES;
  const preferred = isLanguage(fallback) && allowed.includes(fallback) ? fallback : allowed[0];

  if (isLanguage(explicit) && allowed.includes(explicit)) return explicit;

  if (acceptLanguage) {
    const ranked = String(acceptLanguage)
      .split(",")
      .map((part) => {
        const [tag, ...rest] = part.trim().split(";");
        const quality = rest.find((piece) => piece.trim().startsWith("q="));
        return {
          code: tag.trim().toLowerCase().split("-")[0],
          weight: quality ? parseFloat(quality.split("=")[1]) || 0 : 1,
        };
      })
      .sort((a, b) => b.weight - a.weight);
    for (const entry of ranked) {
      if (allowed.includes(entry.code)) return entry.code;
    }
  }

  return preferred;
}

/**
 * Estrae un testo localizzato da un campo { it, en }, con ricadute
 * successive per non lasciare mai l'ospite davanti a un campo vuoto.
 */
export function pickText(field, lang, fallback) {
  if (!field) return "";
  if (typeof field === "string") return field;
  const order = [lang, fallback, DEFAULT_LANGUAGE, ...LANGUAGES];
  for (const code of order) {
    if (code && typeof field[code] === "string" && field[code].trim()) return field[code].trim();
  }
  return "";
}
