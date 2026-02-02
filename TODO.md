# TODO - App Manager Portal

## 📋 SAL (Stato Avanzamento Lavori)

**Data inizio:** 2 Febbraio 2026  
**Stack:** Next.js 16 + Prisma + SQLite + Tailwind CSS  
**Stato:** � MVP Completato

---

## ✅ Setup Iniziale
- [x] Creato progetto Next.js con App Router
- [x] Installato Prisma con SQLite
- [x] Tailwind CSS configurato
- [x] Schema database completo
- [x] Autenticazione custom con sessioni
- [x] Seed database con admin + app demo

---

## ✅ Funzionalità Implementate

### 1. 📡 Monitoraggio App Online/Offline
- [x] API heartbeat (`POST /api/heartbeat`)
- [x] Dashboard stato app con indicatore online/offline
- [x] Conteggio dispositivi online (ultimi 5 min)

### 2. 📥 Portale Download Software
- [x] Pagina pubblica home con lista app
- [x] Pagina download per singola app (`/download/[slug]`)
- [x] Upload .exe da admin panel
- [x] Gestione versioni multiple
- [x] Contatore download
- [x] Download file con tracking

### 3. 💬 Gestione Feedback
- [x] API ricezione feedback (`POST /api/feedback`)
- [x] Dashboard feedback admin
- [x] Filtri (app, letto/non letto)
- [x] Marcatura come letto
- [x] Badge tipo (bug, feature, generale)

### 4. 🔄 Gestione Aggiornamenti
- [x] Upload nuove versioni
- [x] API check update (`GET /api/updates/check`)
- [x] Changelog per versione
- [x] Flag "latest" per versione corrente

---

## 🗃️ Database (Completato)

Tabelle create:
- `User` - Utenti admin
- `Session` - Sessioni login
- `Application` - App gestite
- `AppVersion` - Versioni con file
- `Heartbeat` - Ping online
- `Feedback` - Feedback utenti

---

## 📁 Struttura Creata

```
src/
  app/
    page.tsx                    # ✅ Landing pubblica
    login/page.tsx              # ✅ Login admin
    download/[slug]/page.tsx    # ✅ Download pubblica
    admin/
      layout.tsx                # ✅ Layout protetto
      page.tsx                  # ✅ Dashboard
      apps/page.tsx             # ✅ Lista app
      apps/new/page.tsx         # ✅ Nuova app
      feedback/page.tsx         # ✅ Lista feedback
      downloads/page.tsx        # ✅ Gestione versioni
      downloads/[appId]/upload/ # ✅ Upload versione
      settings/page.tsx         # ✅ Impostazioni
    api/
      auth/login/               # ✅ Login
      auth/logout/              # ✅ Logout
      heartbeat/                # ✅ Heartbeat
      feedback/                 # ✅ Feedback
      updates/check/            # ✅ Check update
      download/[slug]/[id]/     # ✅ Download file
      admin/apps/               # ✅ CRUD apps
      admin/versions/           # ✅ Upload versioni
      admin/feedback/[id]/read/ # ✅ Segna letto
  components/
    ui/                         # ✅ Button, Input, Card, Badge
    layout/sidebar.tsx          # ✅ Sidebar admin
    status-indicator.tsx        # ✅ Indicatore online
  lib/
    prisma.ts                   # ✅ Client DB
    auth.ts                     # ✅ Auth helpers
    utils.ts                    # ✅ Utilities
```

---

## 🚀 Come Usare

### Avvio Development
```bash
npm run dev
```

### Credenziali Admin
- Email: `admin@example.com`
- Password: `admin123`

### API per App Desktop

**Heartbeat (ogni 1-2 min):**
```json
POST /api/heartbeat
{
  "appSlug": "cer-pdf-parser",
  "deviceId": "unique-device-id",
  "hostname": "PC-USER",
  "version": "1.0.0",
  "os": "Windows 11"
}
```

**Invia Feedback:**
```json
POST /api/feedback
{
  "appSlug": "cer-pdf-parser",
  "deviceId": "unique-device-id",
  "userName": "Mario Rossi",
  "email": "mario@example.com",
  "message": "Ottima app!",
  "type": "general" // bug, feature, general
}
```

**Check Aggiornamenti:**
```
GET /api/updates/check?appSlug=cer-pdf-parser&version=1.0.0
```

---

## 📝 TODO Futuri
- [ ] Dark mode toggle
- [ ] Statistiche avanzate con grafici
- [ ] Notifiche email per feedback
- [ ] API key per autenticazione API
- [ ] Multi-tenancy (più admin)
- [ ] Backup automatico database
