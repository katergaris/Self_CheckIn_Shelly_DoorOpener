# 🚪 Opendoor Cloudflare Pages — Guida Completa all'Installazione

Benvenuto! Questa guida è pensata per accompagnarti **passo dopo passo** nella configurazione di un sistema di apertura remota per cancelli, portoni o porte gestiti da relè **Shelly**.

Non è richiesta alcuna competenza di programmazione: ti basterà seguire le istruzioni nell'ordine riportato.

> 💡 **La configurazione è persistente.** Porte, PIN e credenziali vengono salvati direttamente dalla pagina `/setup` e restano memorizzati: non devi più reinserirli ogni volta, né copiare-incollare codice, né rifare il deploy.

**In breve, il sistema offre:**
- 🌍 sito per gli ospiti in **italiano e inglese**, con selettore di lingua;
- 🔒 **codice di accesso** opzionale, richiesto prima ancora di mostrare quali porte esistono;
- 📝 **istruzioni** personalizzabili, generali e per singolo ingresso;
- 🚪 più porte sullo **stesso dispositivo Shelly**, per l'installazione con un solo pulsante che apre più cancelli.

---

## 📋 Indice
1. [Prerequisiti](#1-prerequisiti)
2. [Recuperare i dati da Shelly Cloud](#2-recuperare-i-dati-da-shelly-cloud)
3. [Preparare i file su GitHub](#3-preparare-i-file-su-github)
4. [Configurare Cloudflare Pages](#4-configurare-cloudflare-pages)
5. [Impostare la Password di Setup](#5-impostare-la-password-di-setup)
6. [Attivare il salvataggio permanente (KV)](#6-attivare-il-salvataggio-permanente-kv)
7. [Configurare le porte (`/setup`)](#7-configurare-le-porte-setup)
8. [Lingue, codice di accesso e istruzioni](#8-lingue-codice-di-accesso-e-istruzioni)
9. [Caso pratico: un pulsante, due cancelli](#9-caso-pratico-un-pulsante-due-cancelli)
10. [Utilizzo Quotidiano](#10-utilizzo-quotidiano)
11. [Risoluzione Problemi Frequenti](#11-risoluzione-problemi-frequenti)
12. [Struttura del progetto](#12-struttura-del-progetto)

---

## 1. Prerequisiti

Prima di iniziare, assicurati di avere:
- Un **account GitHub** (gratuito).
- Un **account Cloudflare** (gratuito).
- Un relè **Shelly** (es. Shelly Plus 1, Shelly 1PM, ecc.) già installato, collegato al Wi-Fi di casa e associato al tuo account **Shelly Cloud**.

---

## 2. Recuperare i dati da Shelly Cloud

Per fare in modo che il sito possa inviare il comando di apertura al tuo cancello, devi recuperare tre informazioni fondamentali dal tuo account Shelly.

> ℹ️ **Buona notizia:** Auth Key e Server si inseriscono **una sola volta** (sono condivisi da tutte le porte). Per ogni dispositivo aggiuntivo ti servirà solo il **Device ID**.

### A. Trovare la Chiave di Autorizzazione (Auth Key / Token)
1. Apri l'applicazione **Shelly Smart Control** sul tuo smartphone (oppure vai su [home.shelly.cloud](https://home.shelly.cloud/) dal computer).
2. Clicca sull'icona del tuo **Profilo** o sul menu in alto a destra (☰).
3. Clicca su **Impostazioni account** (User Settings).
4. Clicca sulla voce **Authorization Key** (Chiave di autorizzazione / API Key).
5. Clicca sul pulsante **Get Key** (o *Create/Re-generate* se non ne hai mai creata una).
6. Sullo schermo apparirà un codice alfanumerico molto lungo (es. `M2Y0ODk2N...`). **Copialo interamente e salvalo in un luogo sicuro**.

### B. Individuare il Server Cloud
Nella stessa schermata in cui hai recuperato la chiave, o guardando la barra degli indirizzi del browser quando sei connesso a Shelly Cloud, troverai l'indicazione del tuo server assegnato (es. `shelly-281-eu.shelly.cloud` oppure `shelly-281-eu`). Annotalo: **vanno bene entrambe le forme**, il sistema completa l'indirizzo automaticamente.

### C. Trovare l'ID del Dispositivo (Device ID)
1. Dall'app Shelly, apri la scheda del dispositivo che aziona il cancello o la porta.
2. Clicca sull'icona delle **Impostazioni** (l'ingranaggio ⚙️ in alto a destra).
3. Scorri fino alla sezione **Device Information** (Informazioni dispositivo).
4. Troverai la voce **Device ID** (un codice alfanumerico di 12 caratteri, es. `34845d62a12c`). Copialo.

---

## 3. Preparare i file su GitHub

1. Entra nel tuo account **GitHub** ed entra nel repository del progetto.
2. Assicurati che la cartella **`functions/`** contenga il file `functions/[[path]].js` **e** la sottocartella `functions/_lib/` con i suoi file.

   > ⚠️ **Perché `[[path]].js`?** Questo nome speciale dice a Cloudflare di usare lo stesso file sia per la pagina del tastierino principale (`/`), sia per la pagina di configurazione (`/setup`).
   >
   > ⚠️ **Perché `_lib/`?** Il trattino basso iniziale dice a Cloudflare che quei file sono codice di supporto e non pagine pubbliche. Non rinominare la cartella.

3. *(Opzionale)* Se vuoi mostrare un logo personalizzato in cima alla pagina, carica la tua immagine chiamata `logo.png` dentro la cartella `public/` (quindi il percorso sarà `public/logo.png`).

---

## 4. Configurare Cloudflare Pages

Ora dobbiamo collegare il tuo codice GitHub a Cloudflare in modo da pubblicare il sito web.

1. Accedi a [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Dal menu laterale a sinistra, clicca su **Workers & Pages**.
3. Clicca sul pulsante blu **Create application** e poi seleziona la scheda **Pages**.
4. Clicca su **Connect to Git**.
5. Seleziona il tuo account GitHub e poi scegli il repository di questo progetto.
6. Clicca su **Begin setup**.
7. Nelle opzioni della pagina che appare:
   - **Framework preset:** Seleziona *None*.
   - **Build command:** Lascia **completamente vuoto**.
   - **Build output directory:** Lascia **completamente vuoto**.
8. Clicca su **Save and Deploy**. Attendi un paio di minuti finché Cloudflare non completa la creazione del sito.

---

## 5. Impostare la Password di Setup

Per evitare che chiunque possa accedere alla schermata di configurazione e modificare le impostazioni dei tuoi cancelli, devi impostare una password segreta.

1. Rimani all'interno del tuo progetto su Cloudflare.
2. Clicca sulla scheda **Settings** (Impostazioni) in alto.
3. Nel menu a sinistra, seleziona **Environment variables** (Variabili d'ambiente).
4. Clicca su **Add variable** (o *Edit variables* se la schermata è diversa).
5. Inserisci questi dati:
   - **Variable name (Nome):** `SETUP_PASSWORD` *(scrivilo tutto in maiuscolo)*
   - **Value (Valore):** Scrivi la password personale che userai per accedere al setup (es. `MiaPasswordSicura2026`).
6. Clicca sul pulsante **Save** in fondo alla pagina per confermare.

> 🔒 Se non imposti questa variabile, la password predefinita è `admin`: impostane una tua prima di mettere online il sistema.

---

## 6. Attivare il salvataggio permanente (KV)

Questo passaggio si esegue **una volta sola** ed è ciò che rende la configurazione persistente: da quel momento le porte si aggiungono e si modificano direttamente dal browser, senza più toccare Cloudflare.

1. Dal menu laterale di Cloudflare clicca su **Storage & Databases** ➔ **KV**.
2. Clicca su **Create instance / Create a namespace**.
3. Dai un nome qualsiasi al namespace (es. `opendoor-config`) e conferma.
4. Torna nel tuo progetto Pages ➔ scheda **Settings** ➔ sezione **Bindings** (in alcune versioni: *Functions* ➔ *KV namespace bindings*).
5. Clicca su **Add binding** e inserisci:
   - **Variable name (nome del binding):** `CONFIG_KV`
   - **KV namespace:** seleziona il namespace appena creato.
6. Salva, poi vai su **Deployments**, clicca i **tre pallini (`...`)** sull'ultimo deploy e scegli **Retry deployment**.

> ✅ **Come verificare:** apri `/setup`, fai login e controlla il riquadro in alto. Se è **verde** ("Salvataggio automatico attivo") tutto è a posto. Se è **giallo**, il binding non è stato riconosciuto: ricontrolla il nome `CONFIG_KV` e rifai il *Retry deployment*.

> 🔄 **Stai aggiornando da una versione precedente?** Se avevi già la variabile `CONFIG`, al primo accesso dopo il collegamento del KV la tua configurazione viene **importata automaticamente**: la ritroverai già compilata dentro `/setup`. A quel punto la variabile `CONFIG` non serve più e puoi rimuoverla.

---

## 7. Configurare le porte (`/setup`)

### Passo 1: Aprire il configuratore
Vai all'indirizzo del tuo sito aggiungendo `/setup` alla fine.
Esempio: `https://opendoor-8id.pages.dev/setup`

Inserisci la password scelta al punto 5. La sessione resta attiva per 8 ore, quindi non dovrai ridigitarla a ogni modifica.

### Passo 2: Compilare i dati
La pagina si apre **già compilata con la configurazione attuale**: modifichi solo ciò che ti serve.

1. **Impostazioni Generali**
   - *Modalità Sequenziale:* utile con due ingressi consecutivi (es. Cancello Pedonale ➔ Portone d'Ingresso). Il sito guida l'ospite ad aprire prima uno e poi l'altro.
   - *Modalità Selezione Libera:* mostra l'elenco dei pulsanti e lascia scegliere quale aprire.
   - *Lingue del sito* e *Lingua predefinita:* vedi il [punto 8](#8-lingue-codice-di-accesso-e-istruzioni).
   - *Telefono Assistenza (Opzionale):* fa comparire un pulsante "Chiama Assistenza" sul sito.

2. **Codice di Accesso** *(opzionale)* — il PIN chiesto all'ospite prima di mostrargli le porte. Vedi il [punto 8](#8-lingue-codice-di-accesso-e-istruzioni).

3. **Istruzioni per gli Ospiti** *(opzionale)* — testo libero mostrato nella pagina di apertura.

4. **Account Shelly Condiviso** — inserisci **una sola volta** Server e Auth Key. Tutte le porte li erediteranno.

5. **Porte e Dispositivi** — clicca **Aggiungi Porta** e compila:
   - **Nome identificativo** (es. *Cancello Esterno*), in ogni lingua attivata.
   - **Istruzioni per questa apertura** *(opzionale)*: mostrate all'ospite subito prima del pulsante.
   - **Shelly Device ID** recuperato al punto 2.C. **Più porte possono usare lo stesso Device ID**: vedi il [punto 9](#9-caso-pratico-un-pulsante-due-cancelli).
   - **PIN di sblocco** *(opzionale)*: da 3 a 10 cifre; lascia vuoto per aprire senza codice. È distinto dal codice di accesso al sito.

   Per ogni porta hai a disposizione:
   - **↑ ↓** per riordinarle (conta nella modalità sequenziale);
   - **⧉** per duplicare una porta **mantenendo il Device ID** (utile nel caso del [punto 9](#9-caso-pratico-un-pulsante-due-cancelli));
   - **✕** per rimuoverla;
   - **🔌 Prova apertura** per testare subito il dispositivo, ancora prima di salvare;
   - **Credenziali specifiche per questa porta**, da usare solo nel caso raro di un secondo account Shelly.

### Passo 3: Salvare
Clicca **Salva configurazione** nella barra in basso. Fine: la modifica è immediatamente attiva sul sito pubblico. **Nessun copia-incolla e nessun nuovo deploy.**

### Backup (opzionale)
Nella sezione **Backup e opzioni avanzate** trovi la configurazione in formato testo: copiala per conservarne una copia di sicurezza, o incolla un backup e premi *Importa dal testo* per ripristinarla.

---

## 8. Lingue, codice di accesso e istruzioni

### 🌍 Italiano e inglese
Il sito per gli ospiti è bilingue. Pulsanti, messaggi ed errori sono già tradotti; i testi che scrivi tu (nomi delle porte e istruzioni) hanno un campo per ogni lingua attivata, contrassegnato da `IT` e `EN`.

- La pagina parte **nella lingua del telefono dell'ospite**; in alto c'è un selettore `IT / EN` e la scelta viene ricordata.
- Se un testo in inglese è vuoto, viene mostrato quello italiano: non resta mai uno spazio bianco.
- Puoi disattivare una lingua togliendo la spunta in *Lingue del sito*: il selettore sparisce e i campi corrispondenti non ti vengono più chiesti.
- Il **pannello `/setup` è in italiano**: la traduzione riguarda la pagina vista dagli ospiti.

> 💡 Vuoi vedere il sito in una lingua precisa? Aggiungi `?lang=en` o `?lang=it` al link.

### 🔒 Codice di accesso (il PIN "a monte")
Nella sezione *Codice di Accesso* puoi impostare un PIN richiesto **prima ancora di mostrare quali porte esistono**. Finché non viene inserito, l'elenco degli ingressi non viene nemmeno inviato al browser, e nessun comando di apertura viene accettato.

- Da 4 a 12 cifre, **consigliate almeno 6**.
- Superato il codice, l'ospite resta autenticato per **12 ore**; cambiando il codice tutte le sessioni decadono subito.
- Resta indipendente dal **PIN della singola porta**: puoi usare un codice per entrare nel sito e un PIN diverso, per esempio, sul solo garage.
- Lascia il campo vuoto per lasciare il sito libero (comportamento precedente).

> ⚠️ **Onestà sul livello di sicurezza:** è un deterrente paragonabile al codice di una cassetta portachiavi, non una password robusta. I tentativi errati vengono rallentati, ma chi ha il link può provare a indovinare: usa 6 cifre o più e cambia il codice fra un ospite e l'altro.

### 📝 Istruzioni
Ci sono due livelli, entrambi opzionali:

| Campo | Dove appare |
|---|---|
| **Istruzioni generali** | In cima alla pagina, prima dell'elenco degli ingressi |
| **Istruzioni per questa apertura** | Nella schermata della singola porta, subito sopra il pulsante |

Servono a spiegare all'ospite cosa deve fare *fisicamente*: da quale citofono suonare, dove si trova il portone, cosa aspettarsi dopo aver premuto. Gli a capo vengono rispettati.

---

## 9. Caso pratico: un pulsante, due cancelli

Un'installazione ricorrente: **un solo relè Shelly** collegato al pulsante del citofono, che però apre due cancelli diversi a seconda di dove ti trovi.

> Suoni dal pulsante fuori dal cancello principale, premi il tasto 1 e si apre il principale.
> Suoni dal pulsante del portone, premi il tasto 1 e si apre il portone.

Il dispositivo è sempre lo stesso: quello che cambia è **da quale citofono hai suonato**. Il sistema non può saperlo, ma l'ospite sì — quindi si configurano **due porte distinte che condividono lo stesso Device ID**, differenziate dalle istruzioni.

**Come si imposta:**

1. Metti la **Modalità Sequenziale**: l'ospite viene guidato prima a un ingresso e poi all'altro, nell'ordine giusto.
2. Crea la prima porta:
   - Nome: `Cancello principale`
   - Device ID: quello del tuo relè (es. `34845d62a12c`)
   - Istruzioni: *"Suona dal pulsante fuori dal cancello principale, poi premi Apri ora."*
3. Premi **⧉ Duplica**: la copia conserva il Device ID e va solo rinominata.
4. Sistema la seconda porta:
   - Nome: `Portone`
   - Device ID: **lo stesso** della prima
   - Istruzioni: *"Una volta dentro, suona dal pulsante del portone e premi di nuovo Apri ora."*
5. Usa **↑ ↓** per verificare che l'ordine rispecchi il percorso reale, poi **Salva configurazione**.

L'ospite vedrà una schermata alla volta, con scritto esattamente cosa fare prima di premere. Ripetere lo stesso Device ID è del tutto legittimo: la validazione non lo segnala come errore.

---

## 10. Utilizzo Quotidiano

Il tuo sistema è pronto!

- **Per gli utenti / ospiti:** basta collegarsi all'indirizzo base del sito (es. `https://opendoor-8id.pages.dev/`). Se hai impostato un codice di accesso verrà chiesto per primo; poi apparirà il tastierino con le istruzioni, i pulsanti di apertura e l'eventuale PIN della singola porta.
- **Per modificare la configurazione:** torna su `/setup`, cambia ciò che ti serve e premi **Salva configurazione**. Le modifiche sono immediate.

---

## 11. Risoluzione Problemi Frequenti

#### ❓ Errore 404 / Pagina non trovata
- **Causa:** il file del codice non si chiama esattamente `[[path]].js` dentro `functions/`, oppure manca la cartella `functions/_lib/`.
- **Risoluzione:** verifica i nomi su GitHub e fai un commit.

#### ❓ Il riquadro in `/setup` è giallo e il pulsante "Salva" è disattivato
- **Causa:** nessun namespace KV collegato al progetto.
- **Risoluzione:** esegui il [punto 6](#6-attivare-il-salvataggio-permanente-kv) e ricordati del *Retry deployment*.

#### ❓ Ho dimenticato la password di setup
- **Risoluzione:** cambia il valore di `SETUP_PASSWORD` su Cloudflare (*Settings* ➔ *Environment variables*) e fai *Retry deployment*. La configurazione salvata su KV non viene toccata.

#### ❓ Premendo il pulsante la porta non si apre
- **Risoluzione:** usa il pulsante **🔌 Prova apertura** dentro `/setup`: il messaggio d'errore ti dice esattamente dove sta il problema.
  - *"Auth Key rifiutata"* ➔ il token è errato o scaduto: rigeneralo dall'app Shelly.
  - *"Device ID non trovato"* ➔ controlla il Device ID nell'app Shelly.
  - *"Server Shelly non valido"* ➔ il server deve essere nella forma `shelly-281-eu` o `shelly-281-eu.shelly.cloud`.
  - *"Shelly Cloud non raggiungibile"* ➔ il relè è offline: verifica il Wi-Fi del dispositivo.

#### ❓ L'ospite non riesce a entrare con il codice di accesso
- **Risoluzione:** controlla il codice in `/setup` (pulsante *Mostra* accanto al campo). Ricorda che è diverso dal PIN della singola porta e che, cambiandolo, chi era già entrato deve reinserirlo.

#### ❓ Il sito appare in inglese a un ospite italiano (o viceversa)
- **Causa:** la lingua iniziale segue le impostazioni del telefono dell'ospite.
- **Risoluzione:** può cambiarla dal selettore `IT / EN` in alto. Per forzarla nel link che gli mandi, aggiungi `?lang=it`.

#### ❓ Ho perso la configurazione
- **Risoluzione:** se avevi fatto un backup dalla sezione *Backup e opzioni avanzate*, incollalo lì e premi *Importa dal testo*, poi *Salva configurazione*.

---

## 12. Struttura del progetto

```
functions/
├── [[path]].js          Router: /setup (pannello) e /* (tastierino + apertura)
└── _lib/
    ├── store.js         Lettura/scrittura della configurazione (KV, fallback CONFIG)
    ├── i18n.js          Traduzioni dell'interfaccia e scelta della lingua
    ├── auth.js          Sessioni firmate: amministratore e ospite (cookie HttpOnly)
    ├── shelly.js        Chiamate a Shelly Cloud e validazione del server
    ├── setup-page.js    Pagina di login e pannello di configurazione
    ├── keypad-page.js   Pagina pubblica di apertura
    └── html.js          Stili condivisi e utilità HTML
```

### Variabili e binding

| Nome | Tipo | Obbligatorio | Descrizione |
|---|---|---|---|
| `SETUP_PASSWORD` | Variabile d'ambiente | Consigliato | Password di accesso a `/setup` (default: `admin`). |
| `CONFIG_KV` | Binding KV | Consigliato | Namespace in cui viene salvata la configurazione. Senza, `/setup` è in sola lettura. |
| `CONFIG` | Variabile d'ambiente | No | Vecchio metodo, ancora supportato in sola lettura. Usato per la migrazione automatica verso KV. |
