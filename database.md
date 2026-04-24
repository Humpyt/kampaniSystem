# Database Setup Guide

## Overview

This project uses **PostgreSQL** as its database. The current configuration is set up for local development. For production (Contabo server), you need to set up PostgreSQL and configure the connection.

---

## Current Configuration

The database connection is in `server/database.ts`. It **automatically** supports:

- **Production:** Uses `DATABASE_URL` environment variable (recommended)
- **Local Dev:** Falls back to hardcoded localhost settings

```typescript
// server/database.ts - already configured!
const connectionString = process.env.DATABASE_URL;

export const pool = new Pool(
  connectionString
    ? { connectionString, max: 20, idleTimeoutMillis: 30000 }
    : { host: 'localhost', port: 5432, database: 'kampani', user: 'postgres', password: 'postgres123', max: 20, idleTimeoutMillis: 30000 }
);
```

**No code changes needed.** Just set your `DATABASE_URL` in `.env`.

---

## Setting Up PostgreSQL on Contabo

### 1. Install PostgreSQL

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

### 2. Start PostgreSQL Service

```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 3. Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# In psql, run:
CREATE DATABASE kampani;
CREATE USER kampani_admin WITH PASSWORD 'your-strong-password';
GRANT ALL PRIVILEGES ON DATABASE kampani TO kampani_admin;

# Exit psql
\q
```

### 4. Configure Environment Variables

Copy the example env file and set your `DATABASE_URL`:

```bash
cp .env.example .env
```

Edit `.env` and set your database connection:

```env
DATABASE_URL=postgresql://kampani_admin:your-strong-password@localhost:5432/kampani
```

**That's it!** The app automatically reads `DATABASE_URL` and connects. No code changes needed.

---

## Database Schema

The schema is automatically created when the server first starts. It's defined in:

- `server/db/postgres-schema.ts` - Full database schema
- `server/db/postgres-seeds.ts` - Initial seed data

On first startup, the server will:
1. Connect to PostgreSQL
2. Create all tables if they don't exist
3. Seed initial data (services, categories, etc.)

---

## Verify Connection

### Test Locally

```bash
psql -U kampani_admin -d kampani -h localhost -W
```

### Test from App

Start the server:
```bash
npm run dev:server
```

Check the health endpoint:
```bash
curl http://localhost:3000/api/health
```

---

## Database Tables

The schema includes these main tables:

| Table | Description |
|-------|-------------|
| `customers` | Customer information |
| `operations` | Repair orders |
| `operation_shoes` | Shoes per repair order |
| `operation_services` | Services per shoe |
| `services` | Available services catalog |
| `products` | Product catalog |
| `categories` | Product categories |
| `supplies` | Supply inventory |
| `sales` | Sales transactions |
| `sales_items` | Items per sale |
| `staff` | Staff members |

---

## Troubleshooting

### Connection Refused

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check it's listening
sudo netstat -tlnp | grep 5432
```

### Authentication Failed

```bash
# Edit pg_hba.conf
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Ensure this line exists for local connections:
local   all             all                                     md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Database Does Not Exist

```bash
sudo -u postgres psql -c "CREATE DATABASE kampani;"
```

### Cannot Connect Remotely

Edit `postgresql.conf`:
```bash
sudo nano /etc/postgresql/*/main/postgresql.conf

# Find and update:
listen_addresses = '*'

# Edit pg_hba.conf to allow remote connections:
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Add this line:
host    all             all             0.0.0.0/0               md5
```

Then restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

---

## Backups

### Create Backup

```bash
pg_dump -U kampani_admin -d kampani -h localhost -F c -b -v -f kampani_backup.sql
```

### Restore Backup

```bash
pg_restore -U kampani_admin -d kampani -h localhost -v kampani_backup.sql
```

### Automated Backups (Cron)

```bash
# Edit crontab
crontab -e

# Add daily backup at 2am
0 2 * * * pg_dump -U kampani_admin -d kampani -h localhost -F c -b -v -f /path/to/backups/kampani_$(date +\%Y\%m\%d).sql
```

---

## Firewall

If using UFW:

```bash
sudo ufw allow 5432/tcp
```

Or if using Contabo's firewall, open port 5432 for your application server.
