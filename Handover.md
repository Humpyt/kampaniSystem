# Project Handover Document

## Kampani Shoe Repair POS System

### Overview

A full-stack Point of Sale (POS) system for shoe repair businesses. Built with **React + TypeScript (Vite)** frontend and **Express + PostgreSQL** backend. Currency is **Ugandan Shilling (UGX)**.

---

## Hosting Setup

### Server: Contabo

- **Location:** Contabo VPS (your VPS provider)
- **SSH Access:** You will need the server IP, username, and SSH key/password from the previous developer
- **Ports:** Frontend runs on port 5173 (Vite), Backend on port 3000 (Express)

### Domain: Namecheap

- Subdomain already configured to point to your Contabo server
- DNS A record should point to your Contabo server's public IP
- Allow 24-48 hours for DNS propagation if recently changed

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Material-UI |
| Backend | Express.js, TypeScript, pg (PostgreSQL driver) |
| Database | PostgreSQL |
| Authentication | JWT (jsonwebtoken), Zustand state |
| Icons | Lucide React, FontAwesome, Material-UI Icons |

---

## Deployment Steps

### 1. Clone the Repository

```bash
git clone https://github.com/Humpyt/kampaniSystem.git
cd kampaniSystem/ProShoeRepair
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Server URL (your domain)
VITE_SERVER_URL=https://your-subdomain.your-domain.com
```

### 4. Set Up PostgreSQL Database

On your Contabo server:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE kampani;

# Create user (optional - use postgres user if simpler)
CREATE USERkampani WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE kampani TO kampani;

# Exit
\q
```

The schema auto-migrates on first server start via `server/db/postgres-schema.ts`.

### 5. Build for Production

```bash
npm run build
```

This creates optimized files in the `dist/` folder.

### 6. Run the Server

**Option A: Direct (for testing)**
```bash
npm run dev
```

**Option B: PM2 (recommended for production)**
```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start npm --name "kampani-backend" -- start "npm run dev:server"

# Or if serving built files with Express in production:
pm2 start npm --name "kampani" -- start "npm run dev"
```

**PM2 Commands:**
```bash
pm2 list                    # Show running processes
pm2 logs kampani-backend    # View logs
pm2 restart kampani-backend # Restart after updates
pm2 save                    # Save process list for reboot
pm2 startup                 # Setup startup script
```

### 7. Configure Reverse Proxy (Nginx)

Install nginx on Contabo:
```bash
sudo apt update && sudo apt install nginx
```

Create nginx site config:
```bash
sudo nano /etc/nginx/sites-available/kampani
```

Add this config:
```nginx
server {
    listen 80;
    server_name your-subdomain.your-domain.com;

    # Frontend static files (if serving built Vite app)
    root /path/to/kampaniSystem/ProShoeRepair/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy to Express backend
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/kampani /etc/nginx/sites-enabled/
sudo nginx -t                    # Test config
sudo systemctl restart nginx     # Restart nginx
```

### 8. Set Up SSL (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-subdomain.your-domain.com
```

Certbot will automatically configure HTTPS. Renewals are automatic.

---

## Project Structure

```
ProShoeRepair/
├── src/                      # React frontend
│   ├── pages/                # Page components (38 files)
│   ├── components/           # Reusable components
│   │   ├── drop/             # Drop-off workflow (Cart system)
│   │   └── ...
│   ├── contexts/             # React Context providers
│   ├── store/                # Zustand auth store
│   ├── services/             # API service layer
│   ├── types/                # TypeScript types
│   └── config/               # App configuration
├── server/                    # Express backend
│   ├── index.ts              # Server entry (port 3000)
│   ├── database.ts           # PostgreSQL connection
│   ├── operations.ts         # Main repair order routes
│   ├── routes/              # API route handlers
│   ├── db/                   # Schema & seeds
│   └── config/              # Server config
├── dist/                     # Production build output
├── package.json
└── vite.config.ts
```

---

## Key Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev (frontend + backend) |
| `npm run dev:client` | Frontend only (Vite, port 5173) |
| `npm run dev:server` | Backend only (Express, port 3000) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

---

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret for JWT token signing | Yes |
| `VITE_SERVER_URL` | Backend URL for API calls | Yes |
| `VITE_FIREBASE_*` | Firebase config (if using) | No |

---

## Database

- **Type:** PostgreSQL
- **Auto-migration:** Schema runs automatically on server start
- **Seeds:** Sample data loads on first start via `postgres-seeds.ts`
- **Connection:** Configured via `DATABASE_URL` env var or in `server/database.ts`

---

## Troubleshooting

### Server won't start
```bash
# Check if ports are in use
lsof -i :3000
lsof -i :5173

# Check PostgreSQL is running
sudo systemctl status postgresql
```

### Database connection fails
```bash
# Test PostgreSQL connection
psql -U your_user -d your_database -h localhost

# Check connection string format
# postgresql://user:password@host:port/database
```

### Build fails
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```

### API returns 500
```bash
# Check server logs
pm2 logs kampani-backend

# Or if running directly
npm run dev:server
```

---

## Maintenance

### Updating the App

```bash
cd /path/to/kampaniSystem/ProShoeRepair
git pull origin main
npm install
npm run build
pm2 restart kampani-backend
```

### Database Backups

```bash
# Backup database
pg_dump -U postgres -d kampani > backup_$(date +%Y%m%d).sql

# Restore database
psql -U postgres -d kampani < backup_file.sql
```

---

## Support Contacts

- **Previous Developer:** (add contact info)
- **Contabo Support:** (if server issues)
- **Namecheap Support:** (if DNS issues)

---

## Notes

- The app uses a **SQLite-compatible wrapper** over PostgreSQL (`server/database.ts`). Always use `db.run()`, `db.get()`, `db.all()` methods — not raw `pool.query()`.
- Currency is **UGX** (0 decimal places). See `src/config/currency.ts`.
- Authentication is **local** (Zustand store + localStorage), not Firebase.
- Image uploads are stored as **base64** in the database (no cloud storage).
