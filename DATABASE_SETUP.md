# Database Setup Guide

This guide helps you set up PostgreSQL for the SMS Assistant project.

## Quick Reference

### Default Configuration (Port 5433)
```bash
DATABASE_URL=postgresql://user:password@localhost:5433/sms_assistant
```

### If Using Existing PostgreSQL (Port 5432)
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/sms_assistant
```

## Setup Options

### Option 1: Docker (Recommended for Development)

**Advantages**: Isolated, easy to start/stop, no conflicts with existing PostgreSQL

```bash
# Start PostgreSQL container on port 5433
docker run --name sms-assistant-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_USER=user \
  -e POSTGRES_DB=sms_assistant \
  -p 5433:5432 \
  -d postgres:15

# Verify it's running
docker ps | grep sms-assistant-db

# Stop when done
docker stop sms-assistant-db

# Start again later
docker start sms-assistant-db

# Remove completely
docker rm -f sms-assistant-db
```

**Environment Configuration**:
```env
DATABASE_URL=postgresql://user:password@localhost:5433/sms_assistant
```

### Option 2: New PostgreSQL Instance on Custom Port

**Use this if**: You have PostgreSQL installed but port 5432 is in use

```bash
# 1. Initialize new database cluster
initdb -D ~/postgres-5433-data

# 2. Configure custom port
echo "port = 5433" >> ~/postgres-5433-data/postgresql.conf

# 3. Start PostgreSQL
pg_ctl -D ~/postgres-5433-data -l ~/postgres-5433-data/logfile start

# 4. Create database
createdb -p 5433 sms_assistant

# 5. Verify connection
psql -p 5433 -d sms_assistant -c "SELECT version();"

# Stop PostgreSQL when needed
pg_ctl -D ~/postgres-5433-data stop
```

**Environment Configuration**:
```env
DATABASE_URL=postgresql://postgres:@localhost:5433/sms_assistant
```

### Option 3: Use Existing PostgreSQL (Port 5432)

**Use this if**: You already have PostgreSQL running and want to use it

```bash
# 1. Create database
createdb sms_assistant

# OR with specific user
createdb -U myuser sms_assistant

# 2. Verify connection
psql -d sms_assistant -c "SELECT version();"
```

**Environment Configuration**:
```env
DATABASE_URL=postgresql://myuser:mypassword@localhost:5432/sms_assistant
```

## Verifying Your Setup

```bash
# Check if PostgreSQL is running on a specific port
pg_isready -h localhost -p 5433

# List all databases
psql -p 5433 -l

# Connect to your database
psql -p 5433 -d sms_assistant

# Test connection from Node.js
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => console.log('Connected!')).catch(e => console.error(e));"
```

## Common Issues

### "Port is already allocated" (Docker)
```bash
# Check what's using port 5433
lsof -i :5433

# Use a different port
docker run -p 5434:5432 ...
# Update DATABASE_URL to use port 5434
```

### "Connection refused"
```bash
# Check if PostgreSQL is running
pg_isready -p 5433

# Start PostgreSQL if not running
pg_ctl -D ~/postgres-5433-data start  # Native
docker start sms-assistant-db          # Docker
```

### "Database does not exist"
```bash
# Create database
createdb -p 5433 sms_assistant

# OR in Docker
docker exec -it sms-assistant-db createdb -U user sms_assistant
```

### "Authentication failed"
```bash
# Check your credentials in DATABASE_URL
# Format: postgresql://USERNAME:PASSWORD@localhost:PORT/DATABASE

# For local PostgreSQL without password:
DATABASE_URL=postgresql://postgres:@localhost:5433/sms_assistant

# For Docker with password:
DATABASE_URL=postgresql://user:password@localhost:5433/sms_assistant
```

## Prisma Commands with Custom Database

All Prisma commands automatically use the `DATABASE_URL` from your `.env` file:

```bash
# Run migrations
npm run prisma:migrate

# Generate Prisma client
npm run prisma:generate

# Seed database
npm run prisma:seed

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## Production Setup

For production, use a managed PostgreSQL service:

- **Railway**: Automatically provisions PostgreSQL
- **Render**: Free PostgreSQL tier available
- **Heroku**: Postgres add-on
- **AWS RDS**: Managed PostgreSQL
- **DigitalOcean**: Managed Databases

These services provide the `DATABASE_URL` automatically. Just add it to your environment variables.
