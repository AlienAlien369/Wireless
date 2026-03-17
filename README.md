# RSSB Wireless Management System

A full-stack system for managing wireless sets (walkie talkies) during spiritual visits at Bhatti Center.

---

## 🚀 Quick Start

### Prerequisites
- .NET 8 SDK
- Node.js 20+
- PostgreSQL 15+
- Docker (optional)

---

### Option 1: Docker (Recommended)

```bash
# Clone / extract the project
cd rssb-wireless

# Edit backend/appsettings.json with your Cloudinary + Twilio keys

# Start all services
docker-compose up --build

# Access:
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# Swagger: http://localhost:5000/swagger
```

---

### Option 2: Manual Setup

#### Backend
```bash
cd backend

# Update appsettings.json with your database + API keys

# Run migrations and start
dotnet ef database update
dotnet run
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🔐 Default Login

| Role  | Username | Password  |
|-------|----------|-----------|
| Admin | admin    | Admin@123 |

---

## 📦 Modules

| Module | Description |
|--------|-------------|
| Admin Dashboard | Stats: total sets, issued, broken, visits |
| Visits | Create and manage visit events |
| Inventory | Wireless sets (Kenwood/Vertel/Aspera), Chargers, Kits |
| Incharges | Sewadar management with badge numbers |
| Issue Wireless | Issue sets individually or as group; SMS notification |
| Receive Wireless | Mark sets as returned per visit |
| Breakage | Report and track damaged equipment |
| Reports | Excel + PDF export for visits, inventory, breakages |
| QR Scanner | Scan Kenwood set QR codes via camera |
| Public Set Lookup | `GET /set/{number}` — anyone can see issuance details |

---

## 🔌 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/login` | Login |
| `GET /api/visits` | List visits |
| `POST /api/visits` | Create visit |
| `GET /api/inventory/wireless-sets` | List sets |
| `GET /api/inventory/wireless-sets/by-number/{n}` | Public set lookup |
| `POST /api/inventory/wireless-sets` | Add set (auto-generates Kenwood QR) |
| `GET /api/incharges` | List incharges |
| `POST /api/issues` | Issue wireless sets |
| `POST /api/issues/{id}/return` | Return items |
| `POST /api/issues/{id}/photos` | Upload photo |
| `GET /api/breakages` | List breakages |
| `POST /api/breakages` | Report breakage |
| `GET /api/reports/dashboard` | Dashboard stats |
| `GET /api/reports/visit/{id}/excel` | Visit Excel report |
| `GET /api/reports/inventory/excel` | Inventory Excel |
| `GET /api/reports/breakages/pdf` | Breakages PDF |

---

## 📋 Wireless Brand Rules

| Brand   | Set#  | Charger# | Kits/Earphones | QR Code | Issue Type |
|---------|-------|----------|----------------|---------|------------|
| Kenwood | ✅    | ✅        | ✅              | ✅      | Individual |
| Vertel  | ✅    | ✅        | ❌              | ❌      | Group      |
| Aspera  | ✅    | ❌        | ❌              | ❌      | Group      |

---

## ⚙️ Configuration

Edit `backend/appsettings.json`:

```json
{
  "Cloudinary": {
    "CloudName": "your-cloud-name",
    "ApiKey": "your-key",
    "ApiSecret": "your-secret"
  },
  "Twilio": {
    "AccountSid": "your-sid",
    "AuthToken": "your-token",
    "FromNumber": "+1234567890"
  },
  "AppSettings": {
    "Domain": "https://your-production-domain.com"
  }
}
```

---

## 🏗️ Architecture

```
Frontend (Next.js + Tailwind + shadcn)
    ↓ axios + JWT
Backend (ASP.NET Core 8 Web API)
    ↓ Entity Framework Core
PostgreSQL
    
External Services:
  - Cloudinary (photo storage)
  - Twilio (SMS notifications)
  - QRCoder (QR generation)
  - EPPlus (Excel reports)
  - iText7 (PDF reports)
```
