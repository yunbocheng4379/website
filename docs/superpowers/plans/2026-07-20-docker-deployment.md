# Docker Production Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a verified production Docker deployment for the Vite frontend and document the exact Chinese-language server workflow.

**Architecture:** A Node.js build stage compiles the frontend and an Nginx runtime stage serves only the generated assets. Docker Compose supplies the public port and build-time related-app settings; the browser falls back to the current server hostname plus port `3015` when no full related-app URL is supplied.

**Tech Stack:** React 18, TypeScript 5.6, Vite 5, Node.js 22 Alpine, Nginx Alpine, Docker Compose V2

## Global Constraints

- The public web port defaults to `8080` and is configurable through `.env`.
- The related application port defaults to `3015`.
- `VITE_NOTE_APP_URL` overrides automatic URL generation when set.
- The production image contains only Nginx and the compiled `dist` output.
- The current directory is not a Git repository, so commit steps are intentionally omitted.
- Do not package the remote video or font resources into the image.

---

### Task 1: Generate the related application server URL

**Files:**
- Create: `src/noteAppUrl.ts`
- Create: `scripts/check-note-app-url.mjs`
- Modify: `src/App.tsx`
- Modify: `package.json`

**Interfaces:**
- Produces: `getNoteAppUrl(location: Pick<Location, 'protocol' | 'hostname'>): string`
- Consumes: optional `VITE_NOTE_APP_URL` and `VITE_NOTE_APP_PORT` build variables

- [x] **Step 1: Add a failing source contract check**

Create `scripts/check-note-app-url.mjs` to assert that `src/noteAppUrl.ts` exists, exports `getNoteAppUrl`, reads both Vite variables, defaults to `3015`, and that `src/App.tsx` contains no `http://localhost:3015/`.

- [x] **Step 2: Run the contract check and verify RED**

Run: `node scripts/check-note-app-url.mjs`

Expected: non-zero exit with `src/noteAppUrl.ts does not exist`.

- [x] **Step 3: Implement the URL helper and use it in both links**

Use this behavior in `src/noteAppUrl.ts`:

```ts
export function getNoteAppUrl(
  location: Pick<Location, 'protocol' | 'hostname'> = window.location,
) {
  const configuredUrl = import.meta.env.VITE_NOTE_APP_URL?.trim()
  if (configuredUrl) return configuredUrl

  const port = import.meta.env.VITE_NOTE_APP_PORT?.trim() || '3015'
  return `${location.protocol}//${location.hostname}:${port}/`
}
```

Import the helper in `src/App.tsx`, evaluate it once in `App`, and replace both hard-coded links with the resulting value. Add `check:deployment` to `package.json` with value `node scripts/check-note-app-url.mjs`.

- [x] **Step 4: Verify GREEN and compile**

Run: `npm run check:deployment && npm run lint && npm run build`

Expected: all commands exit `0`; compiled assets do not contain `http://localhost:3015/`.

---

### Task 2: Add production container configuration

**Files:**
- Create: `Dockerfile`
- Create: `nginx.conf`
- Create: `docker-compose.yml`
- Create: `.dockerignore`
- Create: `.env.example`
- Modify: `scripts/check-note-app-url.mjs`

**Interfaces:**
- Consumes: `APP_PORT`, `NOTE_APP_PORT`, `NOTE_APP_URL`, and `IMAGE_TAG` from Compose environment substitution
- Produces: an HTTP site on `${APP_PORT:-8080}` and a health endpoint at `/health`

- [x] **Step 1: Extend the contract check before creating configuration**

Check for all five deployment files and assert these required contracts: multi-stage `Dockerfile`, `npm ci`, `npm run build`, Nginx SPA fallback, `/health`, Compose build args, default port mapping, health check, and restart policy.

- [x] **Step 2: Run the contract check and verify RED**

Run: `npm run check:deployment`

Expected: non-zero exit identifying the first missing deployment file.

- [x] **Step 3: Add the minimal production configuration**

Use a `node:22-alpine` builder and `nginx:1.28-alpine` runtime. Copy `package*.json`, run `npm ci`, copy source, expose the two Vite build arguments, run the production build, and copy `dist` into `/usr/share/nginx/html`.

Configure Nginx with `try_files $uri $uri/ /index.html`, no-cache HTML, one-year immutable caching under `/assets/`, gzip, and `location = /health { return 200 "ok\n"; }`.

Configure Compose with `${APP_PORT:-8080}:80`, `restart: unless-stopped`, both Vite build args, image tag `${IMAGE_TAG:-latest}`, and a `wget` health check against `127.0.0.1/health`.

- [ ] **Step 4: Validate configuration and build the image**

Run: `npm run check:deployment && docker compose config && docker compose build`

Expected: all commands exit `0` and Docker produces the application image.

- [ ] **Step 5: Start and probe the container**

Run: `docker compose up -d && docker compose ps && curl --fail http://127.0.0.1:8080/health && curl --fail http://127.0.0.1:8080/`

Expected: the service becomes `healthy`, `/health` returns `ok`, and `/` returns the Vite HTML document.

---

### Task 3: Write and verify the server deployment guide

**Files:**
- Create: `DEPLOYMENT.md`
- Modify: `scripts/check-note-app-url.mjs`

**Interfaces:**
- Consumes: the configuration and commands produced by Tasks 1 and 2
- Produces: a Chinese-language runbook usable on an Ubuntu server

- [x] **Step 1: Add documentation contract assertions**

Require `DEPLOYMENT.md` to mention Docker/Compose verification, `.env.example` to `.env`, `docker compose up -d --build`, status, logs, health probing, update, stop, port `8080`, related port `3015`, firewall/security-group notes, and HTTPS URL override guidance.

- [x] **Step 2: Run the contract check and verify RED**

Run: `npm run check:deployment`

Expected: non-zero exit stating that `DEPLOYMENT.md` is missing.

- [x] **Step 3: Write the Chinese deployment runbook**

Document prerequisites, official Ubuntu Docker Engine repository installation, project upload, environment configuration, launch, validation, cloud firewall rules, update, logs, restart, stop, cleanup cautions, rollback guidance, HTTPS/domain integration, and troubleshooting. Link the official Docker Engine installation pages instead of duplicating every distribution-specific command.

- [ ] **Step 4: Run final verification**

Run: `npm run check:deployment && npm run lint && npm run build && docker compose config && docker compose build`

Then start the service and run: `curl --fail http://127.0.0.1:8080/health` and `curl --fail http://127.0.0.1:8080/`.

Expected: every command exits `0`, the container is healthy, the health endpoint returns `ok`, and the home page returns HTML.

- [ ] **Step 5: Stop the local verification container**

Run: `docker compose down`

Expected: the verification container and Compose network are removed; the built image remains available.
