# MongoDB setup (DC Space user app)

## Required environment variables

Set the **same** values in both files:

| File | Used by |
|------|---------|
| `.env.local` (repo root) | Next.js on port 3000 |
| `backend-user/.env` | API on port 4001 |

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=dcspace_user
JWT_SECRET=your-long-random-secret
```

### Common mistake (fixed automatically if you run the check script)

**Wrong:** database name in the hostname  
`mongodb+srv://user:pass@user-dcspace.xxxxx.mongodb.net/user-dcspace`

**Right:** Atlas cluster hostname + separate DB name  
`mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/`  
`MONGODB_DB_NAME=dcspace_user`

Get the correct host from [MongoDB Atlas](https://cloud.mongodb.com) → **Database** → **Connect** → **Drivers**.

URL-encode special characters in the password (`@` → `%40`, etc.).

## Atlas checklist

1. **Network Access** — add your current IP (or `0.0.0.0/0` for dev only).
2. **Database user** — username/password match the URI.
3. **Cluster running** — not paused.
4. **Connection string** — copy fresh from Atlas after any password change.

## Test connection

```bash
npm run check:mongo
```

- **OK** — Mongo is reachable; restart `npm run dev:all`.
- **503 / errors in app** — open `http://localhost:3000/api/user/health` (main app) or `http://localhost:4001/api/health` (backend-user).

## Local MongoDB (optional, no Atlas)

```env
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB_NAME=dcspace_user
```

Install and start MongoDB locally, then run `npm run check:mongo`.

## Run the app

```bash
npm run dev:all
```

Only one process should use port **4001**. If you see `EADDRINUSE`, stop the old server first.
