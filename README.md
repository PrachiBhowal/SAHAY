# SAHAY

SAHAY is an offline-first cognitive care platform for elderly dementia patients in the North Eastern Region.

## Project layout

- `ner-patient-app/` - patient-facing React PWA with games, reminders, voice, and IndexedDB offline storage
- `ner-dementia-dashboard/` - caregiver and ASHA dashboard
- `backend/` - Express API, PostgreSQL schema, authentication, reminders, sessions, and sync
- `CONTRACTS.md` - shared API and data contracts
- `AI_HANDOFF_PROJECT_CONTEXT (1).md` - hackathon requirements and team ownership

## Local setup

From this folder in PowerShell:

```powershell
npm run install:all
Copy-Item backend/.env.example backend/.env
```

Set `DATABASE_URL` and `JWT_SECRET` in `backend/.env`, then prepare the database:

```powershell
npm run seed
```

Start the API and both web apps:

```powershell
npm run dev
```

Open:

- Patient app: http://localhost:5173
- Caregiver dashboard: http://localhost:5174
- API health: http://localhost:4000/api/health

The patient app uses `p1` and the demo device token `patient-demo-token-p1` by default. Dashboard demo login: `family@sahay.demo` or `asha@sahay.demo`, password `demo1234`.

To run services separately:

```powershell
npm run dev:backend
npm run dev:patient
npm run dev:dashboard
```

Production checks:

```powershell
npm run build
```
