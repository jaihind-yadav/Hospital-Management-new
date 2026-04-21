# Hospital Management (Separated Frontend + Backend)

## Tech Stack
- Backend: Node.js, Express, MySQL
- Frontend: React (Vite)
- Connection: REST APIs only (`frontend` -> `backend`)

## Folder Structure
- `backend` - API server and database integration
- `frontend` - React client app

## Setup

### 1) Database
Run:

```sql
SOURCE backend/sql/schema.sql;
```

### 2) Backend
```bash
cd backend
npm install
npm run dev
```

Backend URL: `http://localhost:5000`

### 3) Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

## Environment Files

- Backend env: `backend/.env`
- Frontend env: `frontend/.env`

Both `.env.example` files are included as templates.
