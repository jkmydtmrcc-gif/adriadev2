# Deployment na VPS + domena adriadev.site

Kratki vodič kako postaviti Adria Dev Outreach na svoj VPS i povezati ga na **adriadev.site**.

---

## 1. Što trebaš na VPS-u

- **OS:** npr. Ubuntu 22.04 (ili sličan Linux)
- **Node.js:** 18+ (LTS)
- **Nginx:** reverse proxy + SSL
- **PM2:** da Node app radi u pozadini i preživi restart

---

## 2. Priprema VPS-a (prvi put)

Spoji se na VPS (npr. SSH):

```bash
ssh root@tvoja-ip-adresa
# ili: ssh tvoj_user@tvoja-ip-adresa
```

### Instalacija Node.js (Ubuntu/Debian)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v   # npr. v20.x
```

### Instalacija Nginx

```bash
sudo apt update
sudo apt install -y nginx
sudo systemctl enable nginx
```

### Instalacija PM2 (globalno)

```bash
sudo npm install -g pm2
```

---

## 3. Upload projekta na VPS

**Opcija A — Git (preporučeno)**

Na svom računalu:
- Stavi projekt u Git repo (GitHub/GitLab), **ne committaj** `.env` (ostavi u `.gitignore`).

Na VPS-u:

```bash
cd /var/www   # ili gdje god želiš (npr. /home/tvoj_user)
sudo mkdir -p adria-dev-outreach
sudo chown $USER:$USER adria-dev-outreach
git clone https://github.com/tvoj-repo/adria-dev-outreach.git
cd adria-dev-outreach
```

**Opcija B — ručno (SCP / SFTP)**

S računala uploadaj cijeli folder npr.:

```bash
scp -r ./adria-dev-outreach tvoj_user@tvoja-ip:/var/www/
```

Zatim na VPS-u:

```bash
cd /var/www/adria-dev-outreach
```

---

## 4. Konfiguracija na VPS-u

### Dependencije

```bash
cd /var/www/adria-dev-outreach
npm run install:all
```

### Environment (.env)

```bash
nano .env
```

Unesi (zamijeni vrijednosti):

```env
GOOGLE_MAPS_API_KEY=tzvoj_google_maps_key
OPENAI_API_KEY=tzvoj_openai_key
PORT=3001
NODE_ENV=production
```

Spremi (Ctrl+O, Enter, Ctrl+X).

### Production build frontenda

```bash
npm run build
```

To napravi build u `client/dist`. Backend treba posluživati te statičke datoteke kad korisnik dođe na domenu (to namjestimo preko Nginx-a).

---

## 5. Pokretanje aplikacije (PM2)

Server mora raditi na portu **3001** (ili drugom ako promijeniš `PORT` u `.env`). Da app radi u pozadini i nakon restarta:

```bash
cd /var/www/adria-dev-outreach
pm2 start server/index.js --name adria-outreach
pm2 save
pm2 startup   # ispiše naredbu koju trebaš pokrenuti (copy-paste)
```

Korisne naredbe:

```bash
pm2 status           # status
pm2 logs adria-outreach   # logovi
pm2 restart adria-outreach
pm2 stop adria-outreach
```

---

## 6. Nginx + domena adriadev.site

Nginx će:
- primati zahtjeve na **adriadev.site**
- API (`/api`) prosljeđivati na Node (port 3001)
- statičke datoteke (React build) posluživati iz `client/dist`
- SSE stream (`/api/autopilot/stream`) ispravno proslijediti

### Nginx config

```bash
sudo nano /etc/nginx/sites-available/adriadev.site
```

Zalijepi (zamijeni putanju ako ti je projekt negdje drugdje):

```nginx
server {
    listen 80;
    server_name adriadev.site www.adriadev.site;

    root /var/www/adria-dev-outreach/client/dist;
    index index.html;

    # React SPA — sve rute idu na index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # SSE stream — mora biti prije općeg /api/ da Nginx ne bufferira
    location /api/autopilot/stream {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection '';
        proxy_set_header Cache-Control no-cache;
        proxy_buffering off;
        chunked_transfer_encoding off;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # Ostali API zahtjevi
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Aktiviraj site i testiraj konfiguraciju:

```bash
sudo ln -s /etc/nginx/sites-available/adriadev.site /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 7. SSL (HTTPS) za adriadev.site

Koristi Let's Encrypt (Certbot):

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d adriadev.site -d www.adriadev.site
```

Slijedi upite (email, agree, redirect HTTP → HTTPS). Certbot će sam dodati SSL u Nginx.

Osvježi cert automatski:

```bash
sudo certbot renew --dry-run
```

(cron za obnovu je obično već postavljen)

---

## 8. DNS za adriadev.site

Kod registrara domene (gdje si kupio adriadev.site) postavi **A zapis**:

| Type | Name | Value        | TTL |
|------|------|--------------|-----|
| A    | @    | IP_tvog_VPSa | 300 |
| A    | www  | IP_tvog_VPSa | 300 |

Nakon što DNS prođe (nekoliko minuta do par sati), **https://adriadev.site** će otvarati app.

---

## 9. Sažetak naredbi (copy-paste)

```bash
# Na VPS, u folderu projekta
cd /var/www/adria-dev-outreach
npm run install:all
nano .env   # GOOGLE_MAPS_API_KEY, OPENAI_API_KEY, PORT=3001, NODE_ENV=production
npm run build
pm2 start server/index.js --name adria-outreach
pm2 save
pm2 startup
```

Zatim Nginx config (gore), `nginx -t`, `reload nginx`, pa **certbot** za SSL i **DNS A zapis** na IP VPS-a.

---

## 10. Ažuriranje appa kasnije

```bash
cd /var/www/adria-dev-outreach
git pull
npm run install:all
npm run build
pm2 restart adria-outreach
```

Ako mijenjaš samo backend (bez frontenda): `pm2 restart adria-outreach` je dovoljno.

---

## Troubleshooting

- **502 Bad Gateway** — Node ne radi. Provjeri: `pm2 status`, `pm2 logs adria-outreach`.
- **API ne radi / CORS** — Nginx treba prosljeđivati `/api` na `http://127.0.0.1:3001`; frontend koristi relativne putanje `/api`, pa CORS ne bi trebao biti problem kad sve ide preko iste domene.
- **SSE (Autopilot stream) prekida se** — Nginx mora imati `proxy_buffering off` i `Connection ''` za `/api/autopilot/stream` (to je u configu gore).
- **Domena ne otvara** — provjeri DNS (npr. `dig adriadev.site`) i da Nginx sluša na `server_name adriadev.site`.
