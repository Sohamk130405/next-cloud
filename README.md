# next-media (SecureVault)

SecureVault (next-media) is a Next.js (App Router) application that provides secure, encrypted media storage backed by a user's Google Drive account. Files are encrypted using AES-256-GCM and a password-derived key (PBKDF2). The app includes upload/download, share links, activity logging, analytics, and a background re-encryption job to migrate files when the user changes their encryption password.

> Note: This README documents the current development implementation in this workspace (Next.js app, Drizzle ORM + PostgreSQL, Clerk auth, Google Drive integration). It includes design notes, endpoints, and operational details.

## Table of Contents
- Project overview
- Tech stack
- Repo layout
- Local setup
- Environment variables
- Dev / build / start scripts
- Database
- Authentication
- Google Drive integration
- APIs (summary)
- Re-encryption (password change) flow
- Activity logging
- Analytics & frontend features
- Theme toggle
- Production notes & scaling
- Troubleshooting & common issues
- Contributing

---

## Project overview
SecureVault is a full-stack app built with Next.js that allows users to:
- Encrypt files client-side with a user-chosen password (AES-256-GCM)
- Upload encrypted files to the user's Google Drive `appDataFolder`
- Download & decrypt files for preview/download
- Create shareable links for files
- Track user activities (upload/download/share/delete/login/password_change)
- View analytics (storage, activity counts, trends)
- Change encryption password and re-encrypt existing files in the background

This workspace contains server APIs under `app/api/*`, UI pages under `app/*`, and a `lib/` set of utilities for crypto and Google Drive.

## Tech stack
- Next.js (App Router) - v16+ (Turbopack)
- React + TypeScript
- Clerk for authentication
- Drizzle ORM with PostgreSQL
- Recharts for analytics visualizations
- next-themes for theme toggling
- Google Drive API for file storage
- AES-256-GCM encryption + PBKDF2 (100,000 iterations, SHA-256) for password-derived keys

## Repo layout (important files)
- `app/` - Next.js app routes, pages, and API routes (e.g. `app/dashboard`, `app/api/*`)
- `components/` - UI components (theme toggle, file preview dialog, UI primitives)
- `lib/` - utilities (crypto-utils.ts, google-drive.ts, db.ts, utils)
  - `lib/utils/file-reencryption.ts` - background re-encryption job implementation (in-memory job tracking in dev)
  - `lib/utils/activity-logger.ts` - centralized activity logging helper
- `db/schema.ts` - Drizzle table definitions
- `next.config.mjs`, `drizzle.config.ts`, `tsconfig.json`
- `package.json`, `pnpm-lock.yaml`

## Local setup
1. Clone the repo and enter the project directory.
2. Install dependencies (this project uses pnpm in the workspace):

```powershell
pnpm install
```

3. Create a PostgreSQL database and run the migrations / initialize schema. There is a SQL file at `scripts/init-db.sql` that can be used for quick local initialization, but production should use proper migration tooling.

4. Create a `.env` file at project root with the required environment variables (see below).

5. Run the dev server:

```powershell
pnpm dev
```

The app should be available at `http://localhost:3000` (or the port configured in your environment).

## Environment variables
The app requires environment variables for runtime configuration. Example variables used across the codebase:

- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_APP_URL` - Public URL for the app (used in share links)
- `GOOGLE_CLIENT_ID` - OAuth client ID for Google
- `GOOGLE_CLIENT_SECRET` - OAuth client secret for Google
- `GOOGLE_REDIRECT_URI` - Redirect URL configured in Google console (e.g. `${NEXT_PUBLIC_APP_URL}/api/auth/google/callback`)
- `CLERK_SECRET` / other Clerk variables - configure Clerk according to their docs

Always keep secrets out of version control. Use platform-specific secret management in production.

## Scripts (from package.json)
Typical scripts you can run:

- `pnpm dev` - start dev server
- `pnpm build` - build for production
- `pnpm start` - start production server after build

(If package.json uses a different runner, adapt accordingly.)

## Database
The DB schema uses Drizzle `db/schema.ts`. Important tables:
- `users` - app users
- `user_keys` - stores salt & hashed derived key for each user (used to verify encryption password)
- `files` - file metadata (drive_file_id, iv, salt, auth_tag, file_name, mime_type, file_size)
- `activity_logs` - audit trail of user actions
- `share_links` - generated shareable links
- `storage_stats` - aggregated per-user stats

Notes:
- `files` contains `iv` and `salt` for each file. Encrypted binary blobs are stored in Google Drive (appDataFolder).
- `activity_logs` references `files.id` with `ON DELETE SET NULL` so logs aren't broken if files are removed.

## Authentication
- The app uses Clerk for user authentication. You must configure Clerk keys in your environment.
- `app/api/auth/*` routes integrate with Clerk and the server uses `auth()` (Clerk server helper) in route handlers.

## Google Drive integration
- Files are stored in the user's `appDataFolder` using the Drive REST upload API with metadata marking the file as encrypted.
- Token management: access tokens and refresh tokens are stored in the `google_tokens` table. The app handles token refreshes and reports errors with details from Google's responses.

Key helper functions are in `lib/google-drive.ts`:
- `uploadToGoogleDrive(userId, file, encryptedBuffer, fileName)`
- `downloadFromGoogleDrive(userId, driveFileId)`
- `deleteFromGoogleDrive(userId, driveFileId)`

## APIs (summary)
Important API endpoints (server-side routes under `app/api`):

- `POST /api/files/upload` - Upload encrypted file
- `GET /api/files/list` - List user's files
- `POST /api/files/delete` - Delete file (also deletes from Drive if available)
- `GET /api/files/download/[fileId]` - Download file (server-side will stream and decrypt)
- `POST /api/files/share` - Create shareable link

- `POST /api/auth/verify-password` - Verify a password before upload/encryption (prevents encrypting with wrong password)
- `POST /api/auth/user-init` - Initialize user on first login

- `POST /api/settings/change-password` - Change encryption password; now requires `oldPassword` and `newPassword`. It updates the key hash and starts a background re-encryption job (returns `reEncryptionJobId`).
- `GET /api/settings/reencryption/[jobId]` - Check status of re-encryption job

- `GET /api/analytics/stats` - Aggregated analytics for dashboard (storage, activities, trends)
- `GET /api/analytics/activity` - Fetch recent activity logs

Refer to the code in `app/api/*` for exact request/response shapes.

## Re-encryption (password change) flow
When a user changes their encryption password, existing encrypted files must be re-encrypted using the new password. The main points implemented here:

1. The `POST /api/settings/change-password` endpoint now accepts `oldPassword` and `newPassword`. It verifies `oldPassword` by hashing it with the stored salt and comparing to the stored hash in `user_keys`.
2. After updating the stored key hash, the endpoint starts a **background re-encryption job** via `lib/utils/file-reencryption.ts` which:
   - Iterates user files
   - Downloads each encrypted file from Google Drive
   - Decrypts using `oldPassword` (must be provided by user)
   - Re-encrypts with `newPassword`
   - Uploads re-encrypted file and updates file metadata (`iv`, `salt`, `driveFileId` if replaced)
3. The job is tracked in-memory in `lib/utils/file-reencryption.ts` (dev implementation). A job id (e.g. `reencrypt-<userId>-<timestamp>`) is returned to the client to poll `GET /api/settings/reencryption/[jobId]` and monitor progress.

Important considerations:
- The background job in this repo is an in-memory implementation for convenience and proof-of-concept. In production use a persistent queue (Bull, RabbitMQ, SQS) and workers to avoid in-memory volatility.
- The user must provide their `oldPassword`. Re-encryption will fail (cipher errors) if old password is incorrect.
- Re-encryption jobs are resilient in that individual file failures are logged and the job proceeds to the next file.

## Activity logging
- `lib/utils/activity-logger.ts` centralizes activity logging
- The app logs actions such as `upload`, `download`, `delete`, `share`, `login`, `password_change`, `account_delete` with metadata (userId, fileId, description, ip agent)
- Logs are stored in `activity_logs` table and consumed by the analytics endpoint

## Analytics & frontend features
- Dashboard (app/dashboard) contains:
  - Key metrics (total files, storage used, files shared, total activities)
  - Activity breakdown (Bar chart)
  - Recent activity feed
- Recharts is used for visualization
- The analytics API returns aggregated counts and a 30-day storage trend used by the UI

## Theme toggle
- `components/theme-toggle.tsx` uses `next-themes` to toggle light/dark modes. Theme toggle is integrated in the dashboard header.

## Production notes & scaling
- Replace in-memory re-encryption tracking with a queue and worker pool
- Persist job metadata in DB and add retry policies for failed files
- Consider encrypting files server-side in a secure environment if client-side approach is being changed; ensure secrets are protected and rotate keys safely
- Add rate limiting and robust error/exception monitoring for Google Drive API calls

## Troubleshooting & common issues
- "Cipher job failed" during re-encryption: indicates the decryption password is incorrect. Ensure the `oldPassword` was provided and verified.
- Foreign key constraint when logging activity after deletion: logging is now performed before deleting DB rows (so the referenced file still exists when the log is written), or referenced columns use ON DELETE SET NULL to avoid blocking deletes.
- Token refresh errors for Google Drive: check `google_tokens` table and ensure `refreshToken` exists. The server logs include Google's error response; check Cloud Console for token revocation.

## Security notes
- Never store user plaintext passwords. This app stores a derived key hash and salt (PBKDF2 + SHA256). Stored salt is base64 encoded.
- Secrets: do not check `GOOGLE_CLIENT_SECRET` or `DATABASE_URL` into source control.
- Re-encryption must be performed in a trusted environment. Current implementation uses Node webcrypto with subtle APIs; for production, consider HSM or secure worker environments.

## Contributing
- Run `pnpm install` then `pnpm dev` to develop locally.
- Follow repository code conventions (TypeScript, Prettier/ESLint if configured).
- When working on re-encryption, test with a small number of files first.

---

If you'd like, I can:
- Add sample `.env.example` with the env var names
- Add scripts and a small `pnpm` task to run the re-encryption job in a non-blocking worker process
- Replace in-memory job tracking with a DB-backed job table and a simple worker

Let me know which of the above you'd like next and I will implement it.
