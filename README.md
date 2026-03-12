# Adria Dev — Autopilot Outreach

Autonomni AI sales agent za web dev agenciju. App sam odlučuje koga kontaktirati, generira personalizirane poruke i šalje emailove. Korisnik konfigurira SMTP/API keyeve, klikne "Start Autopilot" i ~10 min dnevno radi WhatsApp queue ručno.

## Pokretanje

1. **Kopiraj .env**
   ```bash
   cp .env.example .env
   ```
   Uredi `.env`: postavi `GOOGLE_MAPS_API_KEY` i `OPENAI_API_KEY`.

2. **Instalacija**
   ```bash
   npm run install:all
   ```

3. **Dev**
   ```bash
   npm run dev
   ```
   - Backend: http://localhost:3001  
   - Frontend: http://localhost:5173 (Vite proxy na /api)

## Što napraviti u appu

1. **Settings** — dodaj 3 email (SMTP) računa (npr. Brevo: smtp-relay.brevo.com, port 587).
2. **Settings** — API ključevi idu u `.env` (Google Maps, OpenAI).
3. **Dashboard** — klikni **Start Autopilot**.
4. **WhatsApp** — ručno pošalji do 15 WhatsApp poruka dnevno iz queuea.

## Tech

- **Frontend:** React, Vite, Tailwind, Zustand, Recharts, Radix UI, Lucide
- **Backend:** Node.js, Express, SQLite (better-sqlite3), node-cron
- **AI:** OpenAI gpt-4o-mini (odluke + poruke)
- **Email:** Nodemailer, više SMTP accounta, warming limiti po domeni

## Billing

- **Ponude & računi** — lista, nova ponuda/račun, PDF preuzimanje.
- **Klijenti** — iz Leads možeš "Pretvori u klijenta", zatim Nova ponuda s tim klijentom.
- **Postavke agencije** — podaci za PDF (naziv, OIB, IBAN, logo).
