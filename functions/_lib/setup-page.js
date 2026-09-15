// functions/_lib/setup-page.js
// Pagina di login e pannello di configurazione.
//
// L'interfaccia del pannello è in italiano (è la pagina del proprietario);
// i contenuti destinati agli ospiti — nomi porte e istruzioni — sono invece
// campi localizzati compilabili in ogni lingua attivata.

import { BASE_STYLES, escapeHtml, jsonForScript } from "./html.js";
import { LANGUAGES, LANGUAGE_LABELS } from "./i18n.js";

const SETUP_STYLES = `
  body { padding: 2rem 1rem 6rem; }
  .container { max-width: 680px; margin: 0 auto; }
  .card {
    background: var(--card-bg); padding: 1.75rem; border-radius: var(--radius);
    border: 2px solid var(--border-dark); box-shadow: 4px 4px 0px var(--border-dark);
  }
  h1 { font-size: 1.6rem; margin: 0; font-weight: 800; }
  .header-bar {
    display: flex; justify-content: space-between; align-items: center; gap: 1rem;
    border-bottom: 2px solid var(--border); padding-bottom: 1.25rem; margin-bottom: 1.5rem;
  }
  .header-bar a { color: var(--text-subtle); text-decoration: none; font-size: 0.9rem; font-weight: 700; white-space: nowrap; }
  .banner {
    display: flex; gap: 0.75rem; align-items: flex-start; padding: 0.9rem 1rem;
    border-radius: 10px; border: 2px solid; margin-bottom: 1.5rem; font-size: 0.88rem; line-height: 1.45;
  }
  .banner strong { display: block; margin-bottom: 0.15rem; }
  .banner.ok { background: #f0fdf4; border-color: var(--brand-green); color: #14532d; }
  .banner.warn { background: #fffbeb; border-color: #b45309; color: #78350f; }
  .banner code { background: rgba(0,0,0,0.07); padding: 0.1rem 0.35rem; border-radius: 4px; font-size: 0.85em; }
  .section { margin-bottom: 1.5rem; background: var(--section-bg); padding: 1.25rem; border-radius: 10px; border: 2px solid var(--border); }
  .section-title { font-weight: 700; font-size: 1.05rem; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }
  .section-title .count { font-size: 0.8rem; font-weight: 700; color: var(--text-subtle); }
  .section-intro { font-size: 0.82rem; color: var(--text-subtle); line-height: 1.5; margin: -0.5rem 0 1rem; }
  .field { margin-bottom: 1rem; }
  .field:last-child { margin-bottom: 0; }
  .hint { font-size: 0.78rem; color: var(--text-subtle); margin: 0.35rem 0 0; line-height: 1.4; }
  .hint code, .section-intro code { background: rgba(0,0,0,0.06); padding: 0.05rem 0.3rem; border-radius: 4px; }
  .row { display: flex; gap: 0.75rem; }
  .row > * { flex: 1; min-width: 0; }
  .loc-row { display: flex; gap: 0.5rem; align-items: flex-start; margin-bottom: 0.5rem; }
  .loc-row:last-child { margin-bottom: 0; }
  .loc-tag {
    flex: 0 0 2rem; padding-top: 0.85rem; font-size: 0.7rem; font-weight: 700;
    color: var(--text-subtle); text-transform: uppercase; letter-spacing: 0.05em;
  }
  .loc-row textarea { resize: vertical; min-height: 4.5rem; line-height: 1.5; }
  .lang-picker { display: flex; gap: 1.25rem; flex-wrap: wrap; margin-bottom: 0.35rem; }
  .lang-picker label {
    display: flex; align-items: center; gap: 0.45rem; text-transform: none;
    letter-spacing: 0; font-size: 0.95rem; color: var(--text-main); margin: 0; cursor: pointer;
  }
  .lang-picker input { width: auto; padding: 0; margin: 0; accent-color: var(--border-dark); }
  .door { background: var(--card-bg); border: 2px solid var(--border-dark); border-radius: 10px; padding: 1.1rem; margin-bottom: 1rem; }
  .door-head { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; margin-bottom: 1rem; }
  .door-head .title { font-weight: 800; font-size: 0.95rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .door-tools { display: flex; gap: 0.35rem; flex-shrink: 0; }
  .icon-btn { padding: 0.3rem 0.55rem; font-size: 0.85rem; background: #fff; color: var(--text-main); border: 2px solid var(--border); }
  .icon-btn:hover:not(:disabled) { border-color: var(--border-dark); }
  .icon-btn.danger { color: var(--danger); border-color: #fecaca; }
  .icon-btn.danger:hover { border-color: var(--danger); }
  .btn-add { width: 100%; background: #fff; color: var(--text-main); border-style: dashed; }
  .btn-test { background: #fff; color: var(--text-main); border-color: var(--border); padding: 0.45rem 0.8rem; font-size: 0.82rem; }
  .empty { text-align: center; padding: 1.5rem 1rem; color: var(--text-subtle); font-size: 0.9rem; border: 2px dashed var(--border); border-radius: 10px; background: #fff; margin-bottom: 1rem; }
  details.advanced { margin-top: 0.85rem; border-top: 2px solid var(--border); padding-top: 0.75rem; }
  details.advanced summary { cursor: pointer; font-size: 0.8rem; font-weight: 700; color: var(--text-subtle); text-transform: uppercase; letter-spacing: 0.05em; }
  details.advanced > div { padding-top: 0.9rem; }
  .with-toggle { position: relative; }
  .with-toggle input { padding-right: 4.2rem; }
  .with-toggle .peek {
    position: absolute; right: 0.4rem; top: 50%; transform: translateY(-50%);
    padding: 0.25rem 0.5rem; font-size: 0.72rem; background: var(--section-bg); border-color: var(--border);
    color: var(--text-subtle);
  }
  .savebar {
    position: fixed; left: 0; right: 0; bottom: 0; background: var(--card-bg);
    border-top: 2px solid var(--border-dark); padding: 0.85rem 1rem;
    padding-bottom: calc(0.85rem + env(safe-area-inset-bottom, 0px));
    display: flex; align-items: center; gap: 1rem; justify-content: center;
  }
  .savebar-inner { max-width: 680px; width: 100%; display: flex; align-items: center; gap: 1rem; }
  .savebar .status { flex: 1; font-size: 0.85rem; font-weight: 700; min-width: 0; }
  .savebar .status.ok { color: var(--brand-green); }
  .savebar .status.err { color: var(--danger); }
  .savebar .status.dirty { color: var(--brand); }
  .savebar .status.idle { color: var(--text-subtle); }
  .btn-save { background: var(--border-dark); color: #fff; padding: 0.8rem 1.6rem; flex-shrink: 0; }
  .door-status { font-size: 0.82rem; font-weight: 700; margin-top: 0.6rem; min-height: 1rem; }
  .door-status.ok { color: var(--brand-green); }
  .door-status.err { color: var(--danger); }
  .door-status.pending { color: var(--text-subtle); }
  textarea.json { height: 200px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.82rem; background: #18181b; color: #38bdf8; border-color: var(--border-dark); }
  @media (max-width: 480px) {
    .card { padding: 1.25rem; }
    .row { flex-direction: column; gap: 0; }
  }
`;

export function renderLoginPage({ actionPath, error }) {
  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>Accesso Limitato</title>
  <style>
    ${BASE_STYLES}
    body { display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 1rem; }
    .box {
      text-align: center; padding: 2rem 2.5rem; border-radius: var(--radius); background: var(--card-bg);
      border: 2px solid var(--border-dark); box-shadow: 4px 4px 0px var(--border-dark);
      width: 100%; max-width: 340px;
    }
    h1 { font-size: 1.4rem; margin: 0.5rem 0 1.5rem; font-weight: 800; }
    input { text-align: center; font-size: 1.1rem; padding: 0.85rem; margin-bottom: 1rem; background: #faf8f5; }
    button { width: 100%; padding: 0.85rem; font-size: 1rem; color: #fff; background: var(--border-dark); }
    .error-msg { color: var(--danger); font-size: 0.85rem; margin-bottom: 0.75rem; font-weight: 700; }
  </style>
</head>
<body>
  <div class="box">
    <span class="badge">Sicurezza</span>
    <h1>Area Riservata</h1>
    ${error ? `<div class="error-msg">${escapeHtml(error)}</div>` : ""}
    <form action="${escapeHtml(actionPath)}" method="POST">
      <input type="hidden" name="action" value="login">
      <input type="password" name="password" autofocus placeholder="Inserisci Password"
             autocomplete="current-password" required>
      <button type="submit">Accedi al Setup</button>
    </form>
  </div>
</body>
</html>`;
}

function renderBanner(storage) {
  if (storage.writable) {
    const migrated =
      storage.source === "kv-migrated"
        ? " La configurazione esistente è stata importata automaticamente dalla variabile <code>CONFIG</code>."
        : "";
    return `<div class="banner ok">
      <span>💾</span>
      <div>
        <strong>Salvataggio automatico attivo</strong>
        Le modifiche vengono salvate nel namespace KV <code>${escapeHtml(storage.storeName)}</code>
        e sono subito operative: nessun copia-incolla, nessun nuovo deploy.${migrated}
      </div>
    </div>`;
  }
  return `<div class="banner warn">
    <span>⚠️</span>
    <div>
      <strong>Salvataggio automatico non disponibile</strong>
      Nessun namespace KV collegato al progetto, quindi la configurazione non è persistente.
      Collega un namespace KV da <em>Cloudflare → Settings → Bindings → KV namespace</em>
      (nome del binding: <code>CONFIG_KV</code>) per salvare direttamente da questa pagina.
      Nel frattempo puoi usare l'esportazione manuale in fondo alla pagina.
    </div>
  </div>`;
}

function renderLanguageCheckboxes() {
  return LANGUAGES.map(
    (code) => `<label for="lang_${code}">
      <input type="checkbox" id="lang_${code}" data-lang="${code}">
      ${escapeHtml(LANGUAGE_LABELS[code])}
    </label>`
  ).join("");
}

export function renderSetupPage({ config, storage, actionPath }) {
  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>Configuratore Smart</title>
  <style>${BASE_STYLES}${SETUP_STYLES}</style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header-bar">
        <div>
          <span class="badge">Pannello Amministrativo</span>
          <h1>Configuratore Smart</h1>
        </div>
        <a href="${escapeHtml(actionPath)}?logout=1">Esci 🚪</a>
      </div>

      ${renderBanner(storage)}

      <div class="section">
        <div class="section-title">Impostazioni Generali</div>
        <div class="field">
          <label for="mode">Modalità di Apertura</label>
          <select id="mode">
            <option value="sequence">Sequenziale (Porta 1 → Porta 2)</option>
            <option value="choice">Selezione Libera (Scegli quale aprire)</option>
          </select>
        </div>
        <div class="field">
          <label>Lingue del sito</label>
          <div class="lang-picker">${renderLanguageCheckboxes()}</div>
          <p class="hint">
            L'ospite vede un selettore di lingua e il sito parte nella lingua del suo telefono.
            Testi dei pulsanti e messaggi sono già tradotti; nomi e istruzioni li scrivi tu qui sotto.
          </p>
        </div>
        <div class="field">
          <label for="defaultLanguage">Lingua predefinita</label>
          <select id="defaultLanguage"></select>
          <p class="hint">Usata quando la lingua del telefono non è fra quelle attivate, e come testo di ricaduta.</p>
        </div>
        <div class="field">
          <label for="emergency">Telefono Assistenza (Opzionale)</label>
          <input type="tel" id="emergency" placeholder="Es. +393331234567">
        </div>
      </div>

      <div class="section">
        <div class="section-title">Codice di Accesso</div>
        <p class="section-intro">
          Se lo imposti, all'apertura del sito viene chiesto <strong>prima di mostrare le porte</strong>:
          chi non ha il codice non vede nemmeno quali ingressi esistono. Comunicalo all'ospite
          insieme al link. Lascia vuoto per lasciare il sito libero.
        </p>
        <div class="field">
          <label for="accessPin">Codice richiesto all'ingresso (Opzionale)</label>
          <div class="with-toggle">
            <input type="password" id="accessPin" placeholder="Es. 481902" autocomplete="off"
                   inputmode="numeric">
            <button type="button" class="peek" data-peek="accessPin">Mostra</button>
          </div>
          <p class="hint">
            Da 4 a 12 cifre. Consigliate almeno 6: è un deterrente da cassetta di sicurezza,
            non una password. La sessione dell'ospite dura 12 ore.
          </p>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Istruzioni per gli Ospiti</div>
        <p class="section-intro">
          Testo mostrato nella pagina di apertura. Usalo per spiegare dove si trovano gli
          ingressi o come funziona il citofono. Puoi lasciarlo vuoto.
        </p>
        <div id="generalInstructions"></div>
      </div>

      <div class="section">
        <div class="section-title">Account Shelly Condiviso</div>
        <p class="section-intro">
          Inserisci qui server e Auth Key una volta sola: tutte le porte li useranno.
          Per aggiungere un dispositivo basteranno nome e Device ID.
        </p>
        <div class="field">
          <label for="sharedServer">Server Shelly</label>
          <input type="text" id="sharedServer" placeholder="Es. shelly-281-eu" autocomplete="off">
          <p class="hint">Puoi scrivere <code>shelly-281-eu</code> oppure l'indirizzo completo.</p>
        </div>
        <div class="field">
          <label for="sharedKey">Shelly Auth Key (Token)</label>
          <div class="with-toggle">
            <input type="password" id="sharedKey" placeholder="Incolla qui il token lungo" autocomplete="off">
            <button type="button" class="peek" data-peek="sharedKey">Mostra</button>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">
          <span>Porte e Dispositivi</span>
          <span class="count" id="doorCount"></span>
        </div>
        <p class="section-intro">
          Una voce per ogni apertura che l'ospite deve poter comandare. Se lo stesso pulsante
          Shelly apre più cancelli a seconda del citofono da cui si suona, crea
          <strong>una porta per ogni cancello con lo stesso Device ID</strong> (il pulsante ⧉ duplica
          mantenendolo) e spiega nelle istruzioni da quale citofono suonare.
        </p>
        <div id="doors"></div>
        <button type="button" class="btn-add" id="addDoor">＋ Aggiungi Porta</button>
      </div>

      <details class="section">
        <summary style="cursor:pointer; font-weight:700;">Backup e opzioni avanzate</summary>
        <div style="padding-top:1.25rem;">
          <p class="hint" style="margin-top:0;">
            Esporta la configurazione per conservarne una copia, o incolla un backup per ripristinarla.
            Questo testo è anche il valore da usare nella variabile <code>CONFIG</code> in assenza di KV.
          </p>
          <textarea class="json" id="jsonBox" spellcheck="false"></textarea>
          <div class="row" style="margin-top:0.75rem;">
            <button type="button" class="btn-test" id="copyJson">📋 Copia</button>
            <button type="button" class="btn-test" id="importJson">📥 Importa dal testo</button>
          </div>
          <p class="hint" id="jsonMsg"></p>
        </div>
      </details>
    </div>
  </div>

  <div class="savebar">
    <div class="savebar-inner">
      <div class="status idle" id="saveStatus">Nessuna modifica</div>
      <button type="button" class="btn-save" id="saveBtn">Salva configurazione</button>
    </div>
  </div>

  <script>
    var state = ${jsonForScript(config)};
    var storage = ${jsonForScript(storage)};
    var endpoint = ${jsonForScript(actionPath)};
    var LANGS = ${jsonForScript(LANGUAGES)};
    var LANG_LABELS = ${jsonForScript(LANGUAGE_LABELS)};
    var dirty = false;

    function h(tag, attrs, text) {
      var node = document.createElement(tag);
      if (attrs) {
        Object.keys(attrs).forEach(function (key) {
          if (key === 'class') node.className = attrs[key];
          else node.setAttribute(key, attrs[key]);
        });
      }
      if (text != null) node.textContent = text;
      return node;
    }

    function emptyText() {
      var value = {};
      LANGS.forEach(function (code) { value[code] = ''; });
      return value;
    }

    /** Primo testo disponibile, partendo dalla lingua predefinita. */
    function textOf(field) {
      if (!field) return '';
      if (typeof field === 'string') return field;
      var order = [state.default_language].concat(LANGS);
      for (var i = 0; i < order.length; i++) {
        if (field[order[i]] && field[order[i]].trim()) return field[order[i]].trim();
      }
      return '';
    }

    function setStatus(text, kind) {
      var node = document.getElementById('saveStatus');
      node.textContent = text;
      node.className = 'status ' + (kind || 'idle');
    }

    function markDirty() {
      dirty = true;
      setStatus('Modifiche non salvate', 'dirty');
      refreshJsonBox();
    }

    function refreshJsonBox() {
      var box = document.getElementById('jsonBox');
      if (box && document.activeElement !== box) box.value = JSON.stringify(state, null, 2);
    }

    function newDoor() {
      return {
        id: 'door_' + Date.now().toString(36) + '_' + Math.floor(Math.random() * 1e6).toString(36),
        name: emptyText(), instructions: emptyText(),
        server: '', device_id: '', auth_key: '', pin: ''
      };
    }

    function field(labelText, control, hintText) {
      var wrap = h('div', { class: 'field' });
      wrap.appendChild(h('label', {}, labelText));
      wrap.appendChild(control);
      if (hintText) wrap.appendChild(h('p', { class: 'hint' }, hintText));
      return wrap;
    }

    function input(value, placeholder, onInput, type, inputmode) {
      var node = h('input');
      node.type = type || 'text';
      node.value = value || '';
      node.placeholder = placeholder || '';
      node.autocomplete = 'off';
      if (inputmode) node.setAttribute('inputmode', inputmode);
      node.addEventListener('input', function () { onInput(node.value); markDirty(); });
      return node;
    }

    function secretInput(value, placeholder, onInput) {
      var wrap = h('div', { class: 'with-toggle' });
      var node = input(value, placeholder, onInput, 'password');
      var toggle = h('button', { type: 'button', class: 'peek' }, 'Mostra');
      toggle.addEventListener('click', function () {
        var hidden = node.type === 'password';
        node.type = hidden ? 'text' : 'password';
        toggle.textContent = hidden ? 'Nascondi' : 'Mostra';
      });
      wrap.appendChild(node);
      wrap.appendChild(toggle);
      return wrap;
    }

    /** Campo con una riga per ogni lingua attiva (nomi, istruzioni). */
    function localizedField(labelText, target, options) {
      options = options || {};
      var wrap = h('div', { class: 'field' });
      wrap.appendChild(h('label', {}, labelText));

      state.languages.forEach(function (code) {
        var row = h('div', { class: 'loc-row' });
        if (state.languages.length > 1) row.appendChild(h('span', { class: 'loc-tag' }, code));

        var control;
        if (options.multiline) {
          control = document.createElement('textarea');
          control.rows = options.rows || 3;
        } else {
          control = document.createElement('input');
          control.type = 'text';
          control.autocomplete = 'off';
        }
        control.value = target[code] || '';
        control.placeholder = (options.placeholders && options.placeholders[code]) || '';
        control.addEventListener('input', function () {
          target[code] = control.value;
          markDirty();
          if (options.onInput) options.onInput();
        });

        row.appendChild(control);
        wrap.appendChild(row);
      });

      if (options.hint) wrap.appendChild(h('p', { class: 'hint' }, options.hint));
      return wrap;
    }

    function move(index, delta) {
      var target = index + delta;
      if (target < 0 || target >= state.doors.length) return;
      var moved = state.doors.splice(index, 1)[0];
      state.doors.splice(target, 0, moved);
      markDirty();
      renderDoors();
    }

    function doorCard(door, index) {
      var card = h('div', { class: 'door' });

      function headingText() {
        var name = textOf(door.name);
        return 'Porta #' + (index + 1) + (name ? ' · ' + name : '');
      }

      var head = h('div', { class: 'door-head' });
      head.appendChild(h('span', { class: 'title' }, headingText()));

      var tools = h('div', { class: 'door-tools' });
      var up = h('button', { type: 'button', class: 'icon-btn', title: 'Sposta su' }, '↑');
      up.disabled = index === 0;
      up.addEventListener('click', function () { move(index, -1); });

      var down = h('button', { type: 'button', class: 'icon-btn', title: 'Sposta giù' }, '↓');
      down.disabled = index === state.doors.length - 1;
      down.addEventListener('click', function () { move(index, 1); });

      var clone = h('button', {
        type: 'button', class: 'icon-btn',
        title: 'Duplica (stesso dispositivo, istruzioni diverse)'
      }, '⧉');
      clone.addEventListener('click', function () {
        // Il Device ID viene mantenuto: è il caso di un solo pulsante che apre
        // più cancelli a seconda del citofono da cui si è suonato.
        var copy = JSON.parse(JSON.stringify(door));
        copy.id = newDoor().id;
        // Nome marcato come copia, così si vede subito quale va rinominata.
        LANGS.forEach(function (code) {
          if (copy.name[code]) copy.name[code] = copy.name[code] + ' (copia)';
        });
        state.doors.splice(index + 1, 0, copy);
        markDirty();
        renderDoors();
      });

      var remove = h('button', { type: 'button', class: 'icon-btn danger', title: 'Rimuovi' }, '✕');
      remove.addEventListener('click', function () {
        if (textOf(door.name) || door.device_id) {
          if (!confirm('Rimuovere "' + (textOf(door.name) || 'questa porta') + '"?')) return;
        }
        state.doors.splice(index, 1);
        markDirty();
        renderDoors();
      });

      tools.appendChild(up);
      tools.appendChild(down);
      tools.appendChild(clone);
      tools.appendChild(remove);
      head.appendChild(tools);
      card.appendChild(head);

      card.appendChild(localizedField('Nome identificativo', door.name, {
        placeholders: { it: 'Es. Cancello Esterno', en: 'Es. Outer Gate' },
        onInput: function () { head.querySelector('.title').textContent = headingText(); }
      }));

      card.appendChild(localizedField('Istruzioni per questa apertura (opzionale)', door.instructions, {
        multiline: true,
        placeholders: {
          it: 'Es. Suona dal citofono esterno, poi premi Apri ora.',
          en: 'Es. Ring the outside intercom, then press Open now.'
        },
        hint: 'Mostrate all\\'ospite subito prima del pulsante di apertura.'
      }));

      card.appendChild(field(
        'Shelly Device ID',
        input(door.device_id, 'Es. 34845d62a12c', function (value) { door.device_id = value; }),
        'Lo trovi nell\\'app Shelly: Impostazioni dispositivo → Device Information. ' +
        'Più porte possono condividere lo stesso Device ID.'
      ));

      card.appendChild(field(
        'PIN di sblocco (Opzionale)',
        input(door.pin, 'Es. 1234', function (value) { door.pin = value; }, 'text', 'numeric'),
        'PIN della singola porta, in aggiunta al codice di accesso al sito. Da 3 a 10 cifre.'
      ));

      var advanced = h('details', { class: 'advanced' });
      advanced.appendChild(h('summary', {}, 'Credenziali specifiche per questa porta'));
      var advancedBody = h('div');
      advancedBody.appendChild(h('p', { class: 'hint', style: 'margin-top:0;margin-bottom:0.9rem;' },
        'Da compilare solo se questa porta usa un account Shelly diverso da quello condiviso.'));
      advancedBody.appendChild(field(
        'Server Shelly (override)',
        input(door.server, 'Eredita: ' + (state.shelly.server || 'non impostato'), function (value) { door.server = value; })
      ));
      advancedBody.appendChild(field(
        'Auth Key (override)',
        secretInput(door.auth_key, 'Eredita l\\'account condiviso', function (value) { door.auth_key = value; })
      ));
      advanced.appendChild(advancedBody);
      if (door.server || door.auth_key) advanced.open = true;
      card.appendChild(advanced);

      var status = h('div', { class: 'door-status' });
      var test = h('button', { type: 'button', class: 'btn-test' }, '🔌 Prova apertura');
      test.addEventListener('click', function () {
        test.disabled = true;
        status.className = 'door-status pending';
        status.textContent = 'Invio comando…';
        api({
          action: 'test',
          door: {
            name: textOf(door.name) || 'Porta',
            server: door.server || state.shelly.server,
            device_id: door.device_id,
            auth_key: door.auth_key || state.shelly.auth_key
          }
        }).then(function (data) {
          status.className = 'door-status ' + (data.success ? 'ok' : 'err');
          status.textContent = data.msg;
        }).catch(function () {
          status.className = 'door-status err';
          status.textContent = 'Errore di connessione.';
        }).then(function () { test.disabled = false; });
      });

      var testRow = h('div', { style: 'margin-top:0.9rem;' });
      testRow.appendChild(test);
      testRow.appendChild(status);
      card.appendChild(testRow);

      return card;
    }

    function renderDoors() {
      var container = document.getElementById('doors');
      container.innerHTML = '';
      if (!state.doors.length) {
        container.appendChild(h('div', { class: 'empty' }, 'Nessuna porta configurata. Aggiungine una per iniziare.'));
      }
      state.doors.forEach(function (door, index) {
        container.appendChild(doorCard(door, index));
      });
      document.getElementById('doorCount').textContent =
        state.doors.length === 1 ? '1 porta' : state.doors.length + ' porte';
      refreshJsonBox();
    }

    function renderGeneralInstructions() {
      var container = document.getElementById('generalInstructions');
      container.innerHTML = '';
      container.appendChild(localizedField('Istruzioni generali (opzionale)', state.instructions, {
        multiline: true,
        rows: 4,
        placeholders: {
          it: 'Es. Gli ingressi sono in via Roma 10, sulla destra del portone verde.',
          en: 'Es. The entrances are at via Roma 10, to the right of the green door.'
        }
      }));
    }

    function renderLanguageControls() {
      LANGS.forEach(function (code) {
        var box = document.getElementById('lang_' + code);
        box.checked = state.languages.indexOf(code) !== -1;
      });
      var select = document.getElementById('defaultLanguage');
      select.innerHTML = '';
      state.languages.forEach(function (code) {
        var option = h('option', { value: code }, LANG_LABELS[code]);
        select.appendChild(option);
      });
      select.value = state.default_language;
    }

    function onLanguageToggle() {
      var next = LANGS.filter(function (code) {
        return document.getElementById('lang_' + code).checked;
      });
      if (!next.length) {
        // Almeno una lingua deve restare attiva.
        document.getElementById('lang_' + state.languages[0]).checked = true;
        return;
      }
      state.languages = next;
      if (next.indexOf(state.default_language) === -1) state.default_language = next[0];
      markDirty();
      renderLanguageControls();
      renderGeneralInstructions();
      renderDoors();
    }

    function api(payload) {
      return fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (response) {
        if (response.status === 401) {
          window.location.reload();
          throw new Error('sessione scaduta');
        }
        return response.json();
      });
    }

    function save() {
      var button = document.getElementById('saveBtn');
      button.disabled = true;
      setStatus('Salvataggio in corso…', 'idle');
      api({ action: 'save', config: state }).then(function (data) {
        if (data.ok) {
          dirty = false;
          state = data.config || state;
          renderAll();
          setStatus(data.msg || 'Configurazione salvata ✅', 'ok');
        } else {
          setStatus(data.msg || 'Salvataggio non riuscito', 'err');
        }
      }).catch(function () {
        setStatus('Errore di connessione.', 'err');
      }).then(function () { button.disabled = false; });
    }

    function syncGeneralFields() {
      document.getElementById('mode').value = state.mode;
      document.getElementById('emergency').value = state.emergency_contact || '';
      document.getElementById('accessPin').value = state.access_pin || '';
      document.getElementById('sharedServer').value = state.shelly.server || '';
      document.getElementById('sharedKey').value = state.shelly.auth_key || '';
    }

    function renderAll() {
      syncGeneralFields();
      renderLanguageControls();
      renderGeneralInstructions();
      renderDoors();
    }

    function bindGeneralFields() {
      document.getElementById('mode').addEventListener('change', function (event) {
        state.mode = event.target.value;
        markDirty();
      });
      document.getElementById('defaultLanguage').addEventListener('change', function (event) {
        state.default_language = event.target.value;
        markDirty();
      });
      document.getElementById('emergency').addEventListener('input', function (event) {
        state.emergency_contact = event.target.value;
        markDirty();
      });
      document.getElementById('accessPin').addEventListener('input', function (event) {
        state.access_pin = event.target.value;
        markDirty();
      });
      document.getElementById('sharedServer').addEventListener('input', function (event) {
        state.shelly.server = event.target.value;
        markDirty();
      });
      document.getElementById('sharedKey').addEventListener('input', function (event) {
        state.shelly.auth_key = event.target.value;
        markDirty();
      });
      LANGS.forEach(function (code) {
        document.getElementById('lang_' + code).addEventListener('change', onLanguageToggle);
      });
      document.querySelectorAll('[data-peek]').forEach(function (button) {
        button.addEventListener('click', function () {
          var target = document.getElementById(button.getAttribute('data-peek'));
          var hidden = target.type === 'password';
          target.type = hidden ? 'text' : 'password';
          button.textContent = hidden ? 'Nascondi' : 'Mostra';
        });
      });
    }

    /** Porta un testo importato nel formato localizzato { it, en }. */
    function importText(raw, defaultLanguage) {
      var value = emptyText();
      if (raw && typeof raw === 'object') {
        LANGS.forEach(function (code) {
          if (typeof raw[code] === 'string') value[code] = raw[code];
        });
      } else if (typeof raw === 'string' && raw) {
        value[defaultLanguage] = raw;
      }
      return value;
    }

    function bindAdvanced() {
      document.getElementById('copyJson').addEventListener('click', function () {
        var box = document.getElementById('jsonBox');
        box.select();
        document.execCommand('copy');
        document.getElementById('jsonMsg').textContent = 'Copiato negli appunti ✅';
      });
      document.getElementById('importJson').addEventListener('click', function () {
        var message = document.getElementById('jsonMsg');
        try {
          var parsed = JSON.parse(document.getElementById('jsonBox').value);
          if (!parsed || typeof parsed !== 'object') throw new Error('formato non valido');

          var languages = Array.isArray(parsed.languages)
            ? parsed.languages.filter(function (code) { return LANGS.indexOf(code) !== -1; })
            : [];
          if (!languages.length) languages = LANGS.slice();
          var defaultLanguage = LANGS.indexOf(parsed.default_language) !== -1
            ? parsed.default_language : languages[0];
          if (languages.indexOf(defaultLanguage) === -1) defaultLanguage = languages[0];

          state = {
            mode: parsed.mode === 'choice' ? 'choice' : 'sequence',
            languages: languages,
            default_language: defaultLanguage,
            emergency_contact: parsed.emergency_contact || '',
            access_pin: parsed.access_pin || '',
            instructions: importText(parsed.instructions, defaultLanguage),
            shelly: {
              server: (parsed.shelly && parsed.shelly.server) || parsed.server || '',
              auth_key: (parsed.shelly && parsed.shelly.auth_key) || parsed.auth_key || ''
            },
            doors: (Array.isArray(parsed.doors) ? parsed.doors : []).map(function (door, index) {
              return {
                id: door.id || 'imported_' + index,
                name: importText(door.name, defaultLanguage),
                instructions: importText(door.instructions, defaultLanguage),
                server: door.server || '',
                device_id: door.device_id || door.deviceId || '',
                auth_key: door.auth_key || door.authKey || '',
                pin: door.pin || ''
              };
            })
          };
          renderAll();
          markDirty();
          message.textContent = 'Configurazione importata: controllala e premi "Salva configurazione".';
        } catch (error) {
          message.textContent = 'Testo non valido: ' + error.message;
        }
      });
    }

    document.getElementById('addDoor').addEventListener('click', function () {
      state.doors.push(newDoor());
      markDirty();
      renderDoors();
      var cards = document.querySelectorAll('.door');
      var last = cards[cards.length - 1];
      if (last) {
        last.scrollIntoView({ behavior: 'smooth', block: 'center' });
        var firstInput = last.querySelector('input, textarea');
        if (firstInput) firstInput.focus();
      }
    });

    document.getElementById('saveBtn').addEventListener('click', save);

    window.addEventListener('beforeunload', function (event) {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    });

    bindGeneralFields();
    bindAdvanced();
    renderAll();
    if (!storage.writable) {
      document.getElementById('saveBtn').disabled = true;
      setStatus('Collega un namespace KV per salvare', 'err');
    }
  </script>
</body>
</html>`;
}
