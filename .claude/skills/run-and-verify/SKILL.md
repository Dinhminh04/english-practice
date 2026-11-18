---
name: run-and-verify
description: Start the English Practice stack with Docker Compose and prove it works (health check, login, key pages, logs). Use when asked to run, rebuild or restart the app, after changing backend/frontend code or .env, or when a feature "doesn't work" and logs are needed to find out why.
when_to_use: Also use before reporting any change as done, to confirm the change runs in the real containers.
---

# Run and verify English Practice

The stack is 4 containers on the `app_net` network (see `docker-compose.yml`):

| Service | Container | Notes |
|---|---|---|
| `frontend` | `english_frontend` | Nginx: serves the React build, proxies `/api` and `/uploads` to the backend. Only port 80 is published. |
| `backend` | `english_backend` | Express API on port 5000 (internal). Reads `english-practice-backend/.env`. |
| `mysql` | `english_mysql` | MySQL 8, imports `db.sql` on first start, has a healthcheck. |
| `qdrant` | `english_qdrant` | Vector database for RAG (internal only). |

## Steps

1. **Docker running?** `docker ps`. If the daemon is down, start Docker Desktop and wait until `docker ps` works.
2. **Build and start only what changed:**
   - Backend code: `docker compose up -d --build backend`
   - Frontend code or `nginx.conf`: `docker compose up -d --build frontend`
   - Everything: `docker compose up -d --build`
3. **Wait for health**, do not sleep blindly: poll `http://localhost/api/health` until it returns 200 (give up after ~60 s and read the logs).
4. **Check startup logs:** `docker logs english_backend --tail 30`. Expect "Máy chủ đang chạy trên cổng 5000" and "Kết nối đến MySQL thành công." Any stack trace means the change is not done.
5. **Exercise the change itself**, not just the health route: call the endpoint you touched with a real token, or open the page in a browser. For UI changes, take a screenshot at desktop and phone width.
6. **Report** what was run and the observed result (status codes, log lines). If a step failed or was skipped, say so.

## Rules learned on this project

- **`.env` changes need a recreate:** `docker compose restart` does NOT reload `env_file`. Use `docker compose up -d <service>`.
- **Never print secret values.** To check a variable, print only whether it is set or its length, or compare hashes. Compare `.env` with the container by parsing it with `dotenv` *inside* the container: shell parsing on Windows breaks on CRLF line endings and gives false mismatches.
- **Git Bash on Windows** rewrites `/api/...` arguments in `docker exec`; prefix with `MSYS_NO_PATHCONV=1`. Vietnamese text passed as curl arguments is sent in the wrong encoding; send it from a UTF-8 file (`--data-binary @body.json`, `-F "title=<title.txt"`).
- **Slow AI requests:** Nginx `proxy_read_timeout` is 120 s and the agent times out at 50 s. A 504 from Nginx means the backend took longer than that; check the backend log, not the frontend.

## Reading logs to find a bug

- Nginx access log (`docker logs english_frontend`) shows which requests arrived and their status. A request that never appears never reached the server.
- Backend log (`docker logs english_backend --since 10m`) shows errors and stack traces.
- Example from this project: Google login "did not work". The Nginx log showed only `GET /api/auth/google 302` and never the `/callback`, so the failure was on Google's page (a broken browser session cookie), not in the app. Confirm the server side first (redirect URL, client id present), then look at the browser.
