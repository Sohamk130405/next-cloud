# SecureVault Cybersecurity Project Report

## 1. Project Title

**SecureVault: Client-Side Encrypted Media Storage with Google Drive Integration**

## 2. Abstract

SecureVault is a full-stack cybersecurity project built with Next.js that protects user files through password-based client-side encryption before cloud upload. The application uses Google Drive as the storage backend, but only encrypted file blobs are stored there. Users can upload, preview, download, delete, and share encrypted files through controlled public links. The system also includes authentication, OAuth integration, audit logging, security headers, API rate limiting with Arcjet, and a dedicated security architecture page.

The project demonstrates applied cryptography, access control, cloud security, secure API design, and auditability in a practical web application.

## 3. Objectives

- Build a secure file storage application focused on confidentiality and controlled access.
- Encrypt files before they are uploaded to cloud storage.
- Use password-derived cryptographic keys instead of storing plaintext passwords.
- Integrate Google Drive while keeping stored file contents encrypted.
- Provide secure share links with expiry and download limits.
- Add audit logs for sensitive security events.
- Protect APIs against abuse using rate limiting and security headers.
- Present the project as a clear cybersecurity system with documented threat model and limitations.

## 4. Technology Stack

- **Frontend:** Next.js App Router, React, TypeScript, Tailwind CSS
- **Authentication:** Clerk
- **Storage Provider:** Google Drive API
- **Database:** PostgreSQL with Drizzle ORM
- **Cryptography:** Web Crypto API, AES-GCM, PBKDF2, SHA-256
- **Rate Limiting / WAF:** Arcjet
- **Charts / Analytics:** Recharts
- **Theme System:** next-themes with multiple light and dark palettes

## 5. Core Cybersecurity Concepts Implemented

### 5.1 Authentication

The application uses Clerk for user authentication. Dashboard and authenticated APIs require a valid signed-in user. Server-side route handlers call Clerk's `auth()` helper before accessing user-owned data.

### 5.2 Google OAuth and Secure Storage

Users connect their Google Drive account using OAuth. Encrypted files are uploaded to the user's Google Drive app folder. This keeps storage under the user's control while avoiding plaintext storage in Drive.

### 5.3 Client-Side Encryption

Files are encrypted before upload using AES-GCM. The user's encryption password is used to derive a cryptographic key with PBKDF2 and a random salt. Each file stores its own salt and IV metadata, while the encrypted binary data is stored externally in Google Drive.

### 5.4 Password-Based Key Derivation

The project uses PBKDF2 with SHA-256 and 100,000 iterations. This slows brute-force attacks compared with direct password hashing.

### 5.5 Authenticated Encryption

AES-GCM provides both confidentiality and integrity. If ciphertext is modified, decryption fails.

### 5.6 Access Control

Authenticated file operations verify that the requested file belongs to the current user. Public share downloads validate the share token, expiry time, download limit, and file association before allowing access.

### 5.7 Audit Logging

Security-relevant actions are logged, including uploads, downloads, deletes, share creation, password changes, and account deletion. Logs can include timestamp, IP address, user agent, file ID, and share ID.

### 5.8 Rate Limiting

Arcjet protects sensitive API routes such as password verification, upload, download, share, public share access, and analytics. This reduces brute-force attempts, scraping, and endpoint abuse.

### 5.9 Security Headers

The application configures security headers such as Content Security Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy.

## 6. System Architecture

### 6.1 High-Level Flow

1. User signs in using Clerk.
2. User connects Google Drive through OAuth.
3. User selects a file and enters an encryption password.
4. The browser encrypts the file with AES-GCM.
5. The encrypted file blob is uploaded to Google Drive.
6. File metadata such as file name, MIME type, IV, salt, auth tag, and Drive file ID is stored in the database.
7. For download or preview, the encrypted blob is fetched and decrypted only after the user enters the correct password.

### 6.2 Data Storage Model

| Data | Storage Location | Security Notes |
| --- | --- | --- |
| Encrypted file blob | Google Drive app folder | Stored encrypted |
| File metadata | PostgreSQL | Includes IV and salt, not plaintext file content |
| User identity | Clerk | Managed authentication provider |
| Google tokens | PostgreSQL | Used for Drive API access |
| Activity logs | PostgreSQL | Supports audit and monitoring |
| Plaintext file content | Not stored | Exists temporarily during encryption/decryption |

## 7. Threat Model

### 7.1 Assets Protected

- File contents
- User account access
- Google Drive file storage
- Share links
- Encryption password verification
- Audit history

### 7.2 Threats Considered

- Unauthorized access to another user's files
- Brute-force attempts against password verification
- Abuse of public share links
- Excessive API requests or scraping
- Clickjacking
- MIME sniffing attacks
- Leakage of plaintext file contents to cloud storage

### 7.3 Defenses

- Clerk authentication
- Owner checks in API routes
- Token validation for public shares
- Expiry and download limits for share links
- Arcjet rate limiting
- Security headers
- AES-GCM encryption
- PBKDF2 password-derived keys
- Audit logs

## 8. Important Security Features

### 8.1 Encrypted Upload

The application encrypts files before upload. This ensures the cloud storage provider receives encrypted data rather than raw file contents.

### 8.2 Secure Preview and Download

Files are decrypted only after the user enters the encryption password. Preview and download reuse the same decryption flow.

### 8.3 Public Share Links

The file owner can create public share links with optional expiration and maximum download count. Share links can be revoked individually or all at once.

### 8.4 Google Drive Onboarding

The dashboard prompts users to connect Google Drive before using upload functionality. This improves usability while keeping the storage model explicit.

### 8.5 Security Architecture Page

The application includes a dedicated dashboard page explaining the encryption flow, controls, protected assets, limitations, and evaluation talking points.

## 9. API Security

Sensitive API endpoints are protected by authentication, authorization checks, Arcjet rate limiting, and structured error handling.

Examples:

- `/api/auth/verify-password`
- `/api/files/upload`
- `/api/files/download`
- `/api/files/share`
- `/api/share/[token]`
- `/api/analytics/activity`
- `/api/analytics/stats`

## 10. Arcjet Rate Limiting

Arcjet is configured in `lib/arcjet.ts`. Protection profiles are defined for:

- Authentication-sensitive routes
- Upload routes
- Download routes
- Share routes
- Analytics routes

If `ARCJET_KEY` is not configured, the application runs locally without blocking requests. In production, setting `ARCJET_KEY` enables enforcement.

## 11. Theme and User Experience

The application supports multiple themes through `next-themes`:

- System
- Light
- Dark
- Ocean Light
- Ocean Dark
- Forest Light
- Forest Dark
- Rose Light
- Rose Dark
- Slate Light
- Slate Dark

This improves accessibility, visual polish, and demo quality.

## 12. Testing and Verification

The project was verified with:

```bash
npx tsc --noEmit
npm run build
```

Both checks passed after implementation.

Recommended manual tests:

- Sign up and sign in.
- Connect Google Drive.
- Upload an encrypted file.
- Preview and download the file with the correct password.
- Try decrypting with a wrong password.
- Create a share link with expiry and download limit.
- Revoke share links.
- Review audit logs.
- Switch between all themes.
- Confirm rate limiting behavior after setting `ARCJET_KEY`.

## 13. Limitations

- If the user forgets the encryption password, file contents cannot be recovered.
- A compromised browser or device can expose decrypted files after the user unlocks them.
- Public share links should be treated as secrets.
- The background re-encryption job is currently in-memory and should use a persistent job queue in production.
- Google OAuth token storage should be hardened further for production deployments.
- The project is educational and should undergo professional security testing before real-world use.

## 14. Future Enhancements

- Add optional passwords for public share links.
- Add multi-factor authentication enforcement policy.
- Add persistent job queue for re-encryption.
- Add per-file access history view.
- Add anomaly detection for suspicious downloads.
- Add encrypted filename mode.
- Add backup and recovery documentation.
- Add formal penetration testing report.

## 15. Conclusion

SecureVault is a cybersecurity-focused full-stack application that demonstrates practical use of encryption, authentication, OAuth, access control, audit logging, rate limiting, and browser security headers. It is suitable as a cybersecurity subject project because it combines theoretical security concepts with a working implementation and clearly documents its architecture, defenses, and limitations.
