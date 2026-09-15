// functions/_lib/keypad-page.js
// Pagina pubblica: codice di accesso, istruzioni e tastierino di apertura.

import { BASE_STYLES, jsonForScript } from "./html.js";

const KEYPAD_STYLES = `
  body { display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 1.5rem; }
  .box {
    text-align: center; padding: 2.25rem 2rem; border-radius: 16px; background: var(--card-bg);
    border: 2px solid var(--border-dark); box-shadow: 4px 4px 0px var(--border-dark);
    width: 100%; max-width: 360px; position: relative;
  }
  .lang-switch { display: flex; gap: 0.3rem; justify-content: center; margin-bottom: 1.1rem; }
  .lang-switch button {
    padding: 0.28rem 0.7rem; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.06em;
    text-transform: uppercase; background: transparent; color: var(--text-subtle);
    border: 2px solid var(--border); border-radius: 999px;
  }
  .lang-switch button[aria-pressed="true"] { background: var(--border-dark); color: #fff; border-color: var(--border-dark); }
  .logo { max-width: 110px; height: auto; margin: 0 auto 1.25rem; display: block; }
  h1 { font-size: 1.35rem; font-weight: 800; margin: 0.5rem 0 1.25rem; line-height: 1.3; }
  .instructions {
    text-align: left; background: var(--section-bg); border: 2px solid var(--border);
    border-radius: 10px; padding: 0.9rem 1rem; margin-bottom: 1.25rem;
  }
  .instructions .heading {
    font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;
    color: var(--brand); margin-bottom: 0.4rem;
  }
  .instructions p { margin: 0; font-size: 0.92rem; line-height: 1.55; white-space: pre-wrap; }
  input {
    font-size: 1.4rem; text-align: center; letter-spacing: 0.3rem; padding: 0.85rem;
    border-color: var(--border-dark); margin-bottom: 1rem; background: #faf8f5;
  }
  button.action {
    width: 100%; padding: 0.9rem 1rem; font-size: 1rem; font-weight: 700; color: #fff;
    background: var(--border-dark); border: 2px solid var(--border-dark); border-radius: 10px;
    margin-bottom: 0.75rem; cursor: pointer;
  }
  button.action:active { transform: scale(0.97); }
  button.action:disabled { background: #a1a1aa; border-color: #a1a1aa; cursor: not-allowed; }
  .btn-choice { background: #fff; color: var(--text-main); box-shadow: 2px 2px 0px var(--border-dark); }
  .btn-choice:active { box-shadow: 0px 0px 0px var(--border-dark); }
  .btn-back { background: transparent; color: var(--text-subtle); border-color: var(--border); }
  .hint { font-size: 0.88rem; color: var(--text-subtle); line-height: 1.5; margin: 0 0 1.1rem; }
  #statusMessage { margin-top: 1.25rem; font-weight: 700; font-size: 1rem; min-height: 24px; word-break: break-word; }
  .emergency { margin-top: 1.75rem; border-top: 2px solid var(--border); padding-top: 1.25rem; }
  .emergency a {
    color: var(--brand); text-decoration: none; font-size: 0.85rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.05em;
  }
  .setup-hint a { color: var(--brand); font-weight: 700; }
`;

export function renderKeypadPage({ data }) {
  return `<!DOCTYPE html>
<html lang="${data.lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>Apertura Smart</title>
  <style>${BASE_STYLES}${KEYPAD_STYLES}</style>
</head>
<body>
  <div class="box">
    <div class="lang-switch" id="langSwitch"></div>
    <img src="/logo.png" class="logo" alt="" onerror="this.style.display='none'">
    <span class="badge" id="badge"></span>
    <h1 id="title"></h1>
    <div id="actionArea"></div>
    <div id="statusMessage" role="status" aria-live="polite"></div>
    <div id="emergencySection" class="emergency" style="display:none;">
      <a id="emergencyLink" href="#"></a>
    </div>
  </div>

  <script>
    var data = ${jsonForScript(data)};
    var lang = data.lang;
    var unlocked = !data.locked;
    var content = data.content;
    var selected = null;
    var currentStep = 0;

    try {
      var saved = window.localStorage.getItem('sc_lang');
      if (saved && data.languages.indexOf(saved) !== -1) lang = saved;
    } catch (error) { /* localStorage non disponibile: si usa la lingua del server */ }

    function T(key, params) {
      var table = data.ui[lang] || data.ui[data.languages[0]];
      var text = table[key] != null ? table[key] : key;
      if (params) {
        Object.keys(params).forEach(function (name) {
          text = text.split('{' + name + '}').join(String(params[name]));
        });
      }
      return text;
    }

    function text(field) {
      if (!field) return '';
      if (typeof field === 'string') return field;
      var order = [lang].concat(data.languages);
      for (var i = 0; i < order.length; i++) {
        if (field[order[i]] && field[order[i]].trim()) return field[order[i]].trim();
      }
      return '';
    }

    function h(tag, className, textContent) {
      var node = document.createElement(tag);
      if (className) node.className = className;
      if (textContent != null) node.textContent = textContent;
      return node;
    }

    function area() { return document.getElementById('actionArea'); }
    function title(value) { document.getElementById('title').textContent = value; }
    function status(value, color) {
      var node = document.getElementById('statusMessage');
      node.textContent = value || '';
      node.style.color = color || 'var(--text-subtle)';
    }

    function actionButton(label, extraClass, onClick) {
      var node = h('button', 'action' + (extraClass ? ' ' + extraClass : ''), label);
      node.type = 'button';
      node.addEventListener('click', onClick);
      return node;
    }

    function pinField(placeholder) {
      var node = document.createElement('input');
      node.type = 'password';
      node.id = 'pinCode';
      node.setAttribute('inputmode', 'numeric');
      node.setAttribute('pattern', '[0-9]*');
      node.setAttribute('autocomplete', 'off');
      node.maxLength = 12;
      node.placeholder = placeholder;
      return node;
    }

    function instructionsBlock(value) {
      if (!value) return null;
      var wrap = h('div', 'instructions');
      wrap.appendChild(h('div', 'heading', T('instructions_title')));
      wrap.appendChild(h('p', null, value));
      return wrap;
    }

    /* ---------------- richieste al server ---------------- */

    function post(payload) {
      payload.lang = lang;
      return fetch(window.location.pathname, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (response) { return response.json(); });
    }

    /* ---------------- schermate ---------------- */

    function renderLangSwitch() {
      var container = document.getElementById('langSwitch');
      container.innerHTML = '';
      if (data.languages.length < 2) return;
      data.languages.forEach(function (code) {
        var button = h('button', null, code.toUpperCase());
        button.type = 'button';
        button.setAttribute('aria-pressed', code === lang ? 'true' : 'false');
        button.setAttribute('aria-label', data.languageLabels[code] || code);
        button.addEventListener('click', function () {
          if (code === lang) return;
          lang = code;
          try { window.localStorage.setItem('sc_lang', code); } catch (error) { /* ignora */ }
          status('');
          render();
        });
        container.appendChild(button);
      });
    }

    function renderLocked() {
      title(T('locked_title'));
      area().appendChild(h('p', 'hint', T('locked_hint')));
      var input = pinField(T('pin_placeholder'));
      area().appendChild(input);
      var submit = actionButton(T('locked_button'), null, function () {
        if (!input.value) return;
        submit.disabled = true;
        status(T('opening'));
        post({ action: 'unlock', pin: input.value }).then(function (result) {
          if (result.success) {
            unlocked = true;
            content = result.content;
            status('');
            render();
            return;
          }
          status(result.msg, 'var(--danger)');
          input.value = '';
          input.focus();
        }).catch(function () {
          status(T('connection_error'), 'var(--danger)');
        }).then(function () { submit.disabled = false; });
      });
      area().appendChild(submit);
      input.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') submit.click();
      });
      input.focus();
    }

    function renderNoDoors() {
      title(T('no_doors_title'));
      var parts = T('no_doors_hint').split('{setup}');
      var paragraph = h('p', 'hint setup-hint', parts[0]);
      var link = h('a', null, data.setupPath);
      link.href = data.setupPath;
      paragraph.appendChild(link);
      if (parts[1]) paragraph.appendChild(document.createTextNode(parts[1]));
      area().appendChild(paragraph);
    }

    function renderMenu() {
      title(T('choose_title'));
      var general = instructionsBlock(text(content.instructions));
      if (general) area().appendChild(general);
      content.doors.forEach(function (door, index) {
        area().appendChild(actionButton(text(door.name), 'btn-choice', function () {
          // Apertura diretta solo se non c'è nulla da mostrare o da verificare.
          if (!door.requiresPin && !text(door.instructions)) {
            open(index);
            return;
          }
          selected = index;
          status('');
          render();
        }));
      });
    }

    function renderDoorScreen(index, canGoBack) {
      var door = content.doors[index];
      title(text(door.name));

      var doorInstructions = text(door.instructions) || (canGoBack ? '' : text(content.instructions));
      var block = instructionsBlock(doorInstructions);
      if (block) area().appendChild(block);

      var input = null;
      if (door.requiresPin) {
        input = pinField(T('pin_placeholder'));
        area().appendChild(input);
      }

      var submit = actionButton(door.requiresPin ? T('open_verify') : T('open_now'), null, function () {
        open(index, input ? input.value : '', submit);
      });
      area().appendChild(submit);

      if (input) {
        input.addEventListener('keydown', function (event) {
          if (event.key === 'Enter') submit.click();
        });
        input.focus();
      }

      if (canGoBack) {
        area().appendChild(actionButton(T('back'), 'btn-back', function () {
          selected = null;
          status('');
          render();
        }));
      }
    }

    function renderSequence() {
      if (currentStep >= content.doors.length) {
        title(T('sequence_done'));
        return;
      }
      renderDoorScreen(currentStep, false);
    }

    function render() {
      renderLangSwitch();
      document.documentElement.lang = lang;
      document.getElementById('badge').textContent = T('badge');
      area().innerHTML = '';

      var emergency = document.getElementById('emergencySection');
      if (unlocked && content && content.emergency_contact) {
        var link = document.getElementById('emergencyLink');
        link.href = 'tel:' + content.emergency_contact;
        link.textContent = T('emergency');
        emergency.style.display = 'block';
      } else {
        emergency.style.display = 'none';
      }

      if (!unlocked) return renderLocked();
      if (!content.doors.length) return renderNoDoors();
      if (content.mode === 'sequence') return renderSequence();
      if (selected === null) return renderMenu();
      return renderDoorScreen(selected, true);
    }

    function open(index, pin, button) {
      var door = content.doors[index];
      if (button) button.disabled = true;
      status(T('opening'));
      post({ action: 'open', doorId: door.id, doorIndex: index, pin: pin || '' })
        .then(function (result) {
          if (result.locked) {
            // Il codice di accesso è scaduto o è cambiato: si riparte dallo sblocco.
            unlocked = false;
            content = null;
            selected = null;
            render();
            status(result.msg, 'var(--danger)');
            return;
          }
          if (result.success) {
            status(result.msg, 'var(--brand-green)');
            if (content.mode === 'sequence') {
              currentStep++;
              setTimeout(function () { status(''); render(); }, 2000);
            } else {
              selected = null;
              setTimeout(function () { status(''); render(); }, 3000);
            }
            return;
          }
          status(result.msg, 'var(--danger)');
          var field = document.getElementById('pinCode');
          if (field) { field.value = ''; field.focus(); }
        })
        .catch(function () { status(T('connection_error'), 'var(--danger)'); })
        .then(function () { if (button) button.disabled = false; });
    }

    render();
  </script>
</body>
</html>`;
}
