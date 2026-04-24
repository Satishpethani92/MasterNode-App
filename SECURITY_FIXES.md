# Security Fixes — 2026-04-24

This branch (`security-fixes-2026-04-24`) implements the P0 / P1 remediations
from the April 2026 re-audit of the MasterNode-App codebase. Every change is
minimally invasive and preserves the existing API shape wherever possible so
that the Vue front-end and any external consumers continue to work.

## Summary of changes

| # | File(s) | Severity addressed | Change |
|---|---|---|---|
| 1 | `index.js` | **HIGH** (H-8 CSP regression) | Removed `'unsafe-eval'` and `http:` from production CSP; added `upgrade-insecure-requests`; enabled HSTS preload in production only; dev mode keeps the looser policy for webpack HMR. |
| 2 | `index.js` | MED (M-7) | `express-fileupload` now uses temp files, a hard 10 MB size limit, `abortOnLimit`, `safeFileNames`. |
| 3 | `index.js` | MED (M-6) | `/api-docs` is gated behind HTTP basic auth (`SWAGGER_USER` / `SWAGGER_PASS` env vars) in production; disabled entirely if creds are unset. |
| 4 | `helpers/rateLimiters.js`, `apis/index.js`, `apis/candidates.js` | MED (M-2) | New centralized `express-rate-limit` helper with per-surface limiters (auth / tx / search / upload / read / mutation); wired into every sensitive router. |
| 5 | `apis/auth.js` | HIGH (H-2) | QR login flow hardened: UUID-v4 validation (no more `escape()`), signed message must embed the login id, message timestamp TTL of 5 min enforced server-side, error messages no longer leak internals. |
| 6 | `apis/candidates.js` | HIGH (H-1) + MED | `/search` escapes regex metacharacters via `lodash.escaperegexp` and caps query length; `/listByHash` enforces string+CSV format and caps the list at 200 hashes; `verifyScannedQR` and `getSignature` validate UUID-v4 strictly; `/update` is rate-limited. |
| 7 | `apis/ipfs.js` | **CRITICAL** (M-9 promoted) | Two-step KYC upload. Client must (a) `POST /api/ipfs/requestKYCNonce` to get a server-issued per-account nonce, (b) sign `[XDCmaster KYC <nonce>] Upload <sha256(file)> for <account>`, (c) submit file + signature to `/addKYC`. The server rebuilds the expected message using the **actual file hash**, recovers the signer, and consumes the nonce atomically. Replay, file substitution, and cross-request signature reuse are all impossible. |
| 8 | `models/mongodb/ipfsNonce.js` | — | New MongoDB model backing the nonce. 5-minute TTL index auto-evicts unused nonces. |
| 9 | `apis/voters.js` | HIGH (H-7) | `/verifyTx` now parses the `rawTx`, extracts the EIP-155 chainId from the `v` byte, and rejects any transaction that is either unprotected (`v=27|28`) or signed for a different chain. Action is restricted to an allowlist (`vote / unvote / resign / withdraw`). `escape()` and `console.trace(e)` calls removed. |
| 10 | `middlewares/error.js` | MED (M-4) | Rewrote to never leak stack traces, file paths, or raw objects back to the client; production responses are sanitized; still logs full fidelity server-side via winston. |
| 11 | `models/mongodb/index.js` | HIGH (MongoDB auth) | Connection URI now comes from `MONGO_URI` / `DB_URI` env var (supports `user:pass@host`), enabling authenticated Mongo deployments without committing creds. Logs only a masked URI. |
| 12 | `package.json` | CRIT (C-5), MED | `xdc3` pinned from `"latest"` → `"1.3.13416"`. `lodash` bumped to `^4.17.21` (prototype pollution). `express-fileupload` moved to runtime deps. New runtime deps: `express-rate-limit`, `express-basic-auth`, `lodash.escaperegexp`. |
| 13 | `sslcert/*`, `travis.pem.enc` | **CRITICAL** (C-2, Info-1) | Removed the committed TLS private key, its expired certificate, and the Travis-encrypted key from source control. Added `sslcert/README.md` with rotation instructions. `*.key`, `*.crt`, `*.pem`, `*.p12`, `*.pfx` are now ignored globally. |
| 14 | `Dockerfile` | MED | Replaced EOL `node:16.16.0-alpine` with `node:20.18.0-alpine` (multi-stage build). Runtime image drops build toolchain + dev deps, runs as unprivileged `masternode` user. |
| 15 | `.env.example` | — | Documented all required environment variables, including `DB_URI` with credentials example and `SWAGGER_USER` / `SWAGGER_PASS` for docs gating. |

## Deployment checklist for the XDC Ops team

Before merging / deploying this branch into production, please complete the
following **out-of-band** steps:

1. **Rotate TLS material.** The old `sslcert/server.key` must be treated as
   compromised. Issue a fresh certificate for `master.xinfin.network` and
   revoke the prior certificate at the CA. Do the same for any other service
   that ever loaded that key.
2. **Rotate Travis CI credential.** The old `travis.pem.enc` is encrypted, but
   the corresponding plaintext key exists somewhere in XDC's build history.
   Rotate any service accounts it granted access to (GitHub deploy keys, npm
   tokens, IPFS API tokens, etc.).
3. **Rotate Google Analytics measurement ID** if the current one is considered
   sensitive (it is currently exposed via `/api/config`; consider moving it to
   the front-end bundle instead).
4. **Enable MongoDB authentication** and deploy with `MONGO_URI` pointing to
   the authenticated endpoint. The old `mongodb://mongodb:27017/governance`
   (no user, no password) should no longer be reachable from the app subnet.
5. **Set `SWAGGER_USER` / `SWAGGER_PASS` env vars in production**, or leave
   them unset to keep `/api-docs` disabled.
6. **Rebuild the Docker image** (`docker build .`) — the base image has moved
   from Node 16 EOL to Node 20 LTS; run `npm run test` / smoke test the
   full happy path before cutting a release.
7. **Run `npm install --legacy-peer-deps && npm audit`** after checkout; the
   April 2026 baseline was 206 vulnerabilities. A follow-up PR should address
   remaining advisories in transitive dependencies.

## Known remaining work (not in this branch)

These were out of scope for a minimally-invasive security fix PR but should be
scheduled as follow-ups:

- **C-1 / C-3 (private key & mnemonic entered in browser, HDWalletProvider in
  memory).** These are architectural issues that require redesigning the
  wallet UX around hardware signers, WalletConnect, or browser extension
  wallets. Cannot be fixed without UI rework.
- **C-4 (Solidity 0.4.21 in `contracts/XDCValidator.sol`).** Requires a
  contract upgrade path and on-chain migration.
- **Nonce-based CSP.** The current CSP still allows `'unsafe-inline'` for
  scripts and styles. Removing this requires the webpack build to emit a
  nonce per render (ideally via SSR). Tracked as a follow-up task.
- **Transitive `npm audit` issues** (206 advisories from deep deps). Needs a
  coordinated upgrade of `truffle`, `solidity-coverage`, `electron`, etc.

## How to verify locally

```bash
git fetch origin security-fixes-2026-04-24
git checkout security-fixes-2026-04-24

# Syntax-check every changed file
node --check index.js
for f in apis/*.js middlewares/*.js models/mongodb/*.js helpers/*.js; do
  node --check "$f" || echo "FAIL $f"
done

# Install & run
cp .env.example .env
# edit .env with your DB_URI etc.
npm install --legacy-peer-deps
npm run dev
```

Reach out to `security@` (or the audit contact) with any questions before
merging.
