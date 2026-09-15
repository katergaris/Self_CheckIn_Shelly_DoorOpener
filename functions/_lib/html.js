// functions/_lib/html.js
// Utility condivise per la generazione delle pagine HTML.

/** Escape per interpolazione sicura dentro il markup. */
export function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Serializza un valore per inserirlo dentro un tag <script> senza romperlo. */
export function jsonForScript(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/** Palette e stili di base condivisi da tutte le pagine. */
export const BASE_STYLES = `
  :root {
    --bg: #fbf9f5;
    --card-bg: #ffffff;
    --section-bg: #f6f3ed;
    --border: #e5e0d8;
    --border-dark: #18181b;
    --text-main: #18181b;
    --text-subtle: #71717a;
    --brand: #e05d38;
    --brand-green: #15803d;
    --danger: #dc2626;
    --radius: 14px;
  }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: var(--bg);
    color: var(--text-main);
    margin: 0;
  }
  .badge {
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.12em; color: var(--brand); display: block;
  }
  label {
    display: block; font-size: 0.8rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.05em; margin-bottom: 0.35rem; color: var(--text-subtle);
  }
  input, select, textarea {
    width: 100%; padding: 0.75rem; border: 2px solid var(--border); border-radius: 8px;
    font-size: 0.95rem; background: #ffffff; color: var(--text-main);
    font-family: inherit;
  }
  input:focus, select:focus, textarea:focus { border-color: var(--border-dark); outline: none; }
  button {
    padding: 0.75rem 1.2rem; font-weight: 700; border-radius: 8px; cursor: pointer;
    border: 2px solid var(--border-dark); font-size: 0.95rem;
    transition: transform 0.1s; font-family: inherit;
  }
  button:active { transform: scale(0.98); }
  button:disabled { opacity: 0.55; cursor: not-allowed; }
`;

/** Risposta HTML con header anti-cache (le pagine sono sempre dinamiche). */
export function htmlResponse(body, init = {}) {
  return new Response(body, {
    status: init.status || 200,
    headers: {
      "Content-Type": "text/html;charset=UTF-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "same-origin",
      ...(init.headers || {}),
    },
  });
}

/** Risposta JSON con header anti-cache. */
export function jsonResponse(payload, init = {}) {
  return new Response(JSON.stringify(payload), {
    status: init.status || 200,
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      "Cache-Control": "no-store",
      ...(init.headers || {}),
    },
  });
}
