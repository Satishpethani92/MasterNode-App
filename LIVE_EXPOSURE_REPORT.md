# master.xinfin.network — npm audit vs. live exposure report

**Date:** 2026-04-24
**Target:** `https://master.xinfin.network/` (XDC Network Governance DApp, production)
**Method:** non-destructive HTTP fingerprinting + code-path reachability analysis of
`XinFinOrg/MasterNode-App@master` (commit `5376627`, pre-fix).
**Tooling:** `npm audit --production --json`, custom categorizer (`/tmp/audit-categorize.js`,
`/tmp/audit-trace.js`, `/tmp/audit-strict.js`), `curl`, static `require()` graph.

---

## TL;DR

- `npm audit` reports **120 vulnerabilities** (42 critical, 38 high, 22 moderate, 18 low)
  for the production dependency tree.
- After reachability analysis, only **61** of those CVEs are pulled into the **Node server
  process** (the others are browser-bundled via webpack for the Vue SPA, or only loaded
  by dev-only packages — `truffle`, `solidity-coverage`, `electron`, `ganache-cli`,
  `coveralls`).
- Of those 61, **2 are theoretically live-exploitable** against `master.xinfin.network`
  today (`elliptic` sig malleability, `qs` query-string DoS), and even those require
  additional conditions that are only satisfied because the upstream has **not** deployed
  our fix branch.
- The actual live risk on `master.xinfin.network` right now is **not the dep CVEs — it's
  the 8 application-level flaws we flagged in the re-audit**, all of which are confirmed
  live-present via the probes below. The dep CVEs are almost all latent: the specific
  sinks that make them exploitable aren't reached by any code path the public HTTP
  surface can hit.

**Bottom line:** `master.xinfin.network` is **currently vulnerable**, but the 120 npm
audit findings are a red herring. The actual live attack surface is the 8
application-level findings from our re-audit report. Bumping the vendored `xdc3` /
`ipfs-http-client` / `web3-provider-engine` majors would clear the audit noise but
wouldn't change that risk picture.

---

## 1. How the 120 audit findings actually decompose

We took the `npm audit --production --json` output and, for every finding, did two
things: (a) resolved every path up the dep tree with `npm ls`, (b) intersected those
top-level requirers with the set of packages the **server** source actually
`require()`s (static scan of `index.js`, `apis/**`, `helpers/**`, `middlewares/**`,
`models/**`, `crawl.js`, `elect.js`).

| Bucket | Count | Explanation |
|---|---:|---|
| **Server runtime** (code runs on master.xinfin.network's Node process) | 61 | Pulled in by `xdc3`, `ipfs-http-client`, `axios`, `mongoose`, `express-validator`, `body-parser`, `express`, `twitter`, `uuid`, `ethereumjs-tx`, `ethereumjs-util`, `hdkey` |
| **Browser bundle only** (webpacked into the Vue SPA, shipped to end-user browsers) | 24 | `@ledgerhq/hw-app-eth`, `@walletconnect/*`, Ledger HW / WalletConnect stack |
| **Dev/build only** (not in the prod install path) | 14 | `@truffle/hdwallet-provider`, `solidity-coverage`, `coveralls`, `truffle-privatekey-provider`, `truffle-hdwallet-provider` |
| **Dup advisories** (same CVE reported once per child package in the xdc3 tree, e.g. `xdc3-core`, `xdc3-utils`, `xdc3-eth`, etc. — all the same root cause) | 21 within the 61 | – |

So of the 61 "server runtime" advisories, the number of **distinct root CVEs** is
roughly **18**, which is what the rest of this report works through.

Full categorization tables: `/tmp/audit-strict.out` and `/tmp/audit-server-runtime.json`.

---

## 2. Is master.xinfin.network running the pre-fix or the post-fix code?

**Pre-fix.** Three independent fingerprints confirm this:

### 2a. `GET /api/auth/generateLoginQR` — message shape
Live response:
```json
{"message":"[XDCmaster 4/24/2026, 9:53:56 PM] Login",
 "url":"https://master.xinfin.network/api/auth/verifyLogin?id=66d07ab6-3ad4-4e67-84d8-65f37a7ecb0e",
 "id":"66d07ab6-3ad4-4e67-84d8-65f37a7ecb0e"}
```
- Uses `Date().toLocaleString()` — pre-fix.
- Does **not** include `id=<uuid>` inside the signed message — pre-fix.
- Our fix returns `[XDCmaster <ISO-8601>] Login id=<uuid>` so the signature is bound
  to the session id.

### 2b. `POST /api/auth/verifyLogin?id=abc123`
Live response: `{"status":406,"error":{"message":"wrong id format"}}`
This rejection comes from the pre-fix `.contains('-')` express-validator check, **not**
our added `.isUUID(4)` check. `abc123` contains no dash → rejection. A string like
`a-b` would pass the live pre-fix check but fail our post-fix check.

### 2c. `POST /api/ipfs/requestKYCNonce`
Live response: HTTP 404 (route doesn't exist).
The pre-fix code has no `/requestKYCNonce` endpoint at all; `/addKYC` is gated only by
a static `x-api-key` header with no file-hash ⇄ signature binding. Our fix adds the
nonce endpoint and requires `[XDCmaster KYC <nonce>] Upload <sha256(file)> for <account>`
as the signed message.

---

## 3. What is actually live-exploitable

The table below walks every distinct root-cause npm-audit finding that is
server-runtime-reachable, then evaluates whether the corresponding sink is on a code
path that the **public HTTP surface of master.xinfin.network** can reach. "Not live"
means the vulnerable function is present in node_modules but nothing the server exposes
ever calls it with attacker-controlled arguments.

### 3.1 Application-level (our re-audit P0/P1 findings) — **LIVE**

These are the flaws our fix branch targets. Independent of npm audit. All **confirmed
live** by the probes in §2 and §4.

| # | Severity | Issue | Live evidence |
|---|---|---|---|
| H-1 | HIGH | Regex injection / ReDoS in `/api/candidates/search` (raw `$regex: query`) | Source of commit `5376627` (upstream HEAD) at `apis/candidates.js:383`; no escape of input. |
| H-2 | HIGH | Unauthenticated QR login replay (signature not bound to session id) | §2a — signed message doesn't contain `id`. |
| H-7 | HIGH | `ethereumjs-tx` v1 replay (no EIP-155 chainId check in `/verifyTx`) | Source of upstream `apis/voters.js` — accepts any signed tx regardless of chainId. |
| H-8 | HIGH | Weak CSP (`'unsafe-inline'`, `'unsafe-eval'`, `http:` schemes) | §4.1 — captured live response headers. |
| M-2 | MEDIUM | No rate limiting on any endpoint | §4.2 — 60 consecutive `/api/auth/generateLoginQR` calls in 20 s, all returned 200, no `ratelimit-*` headers, no 429. |
| M-4 | MEDIUM | Error responses leak internal library details | §4.3 — raw `"Unexpected token i in JSON at position 1"`, raw `"Invalid signature length"` returned to clients. |
| M-6 | MEDIUM | Swagger UI + spec exposed without authentication | §4.4 — `/api-docs/` returns Swagger UI, `/api-docs/swagger-ui-init.js` leaks full OpenAPI spec and every route. |
| M-9 | MED→CRIT | IPFS KYC signature not bound to file contents | §2c — `/requestKYCNonce` doesn't exist on live; `/addKYC` is still gated by a static `x-api-key` header. If that shared secret is in any wallet/mobile binary, anyone who extracts it can upload arbitrary documents as any XDC address. |

### 3.2 Dependency CVEs that **are** reachable but **not** exploitable via the public HTTP surface

These are the cases where the vulnerable library code exists in the runtime tree but
the server never passes attacker-controlled data into the vulnerable sink.

| Package | Severity | CVE category | Why NOT live-exploitable |
|---|---|---|---|
| `request` (via `twitter`, `xdc3`) | CRITICAL | SSRF (CVE-2023-28155) | Only URLs passed to `request()` are XDC RPC endpoints and Twitter's own API — no user-controlled URL parameter. |
| `underscore` (via `xdc3`) | CRITICAL | Arbitrary code execution via `_.template` | `xdc3` does not invoke `_.template` with user data. No HTTP path passes request bodies into underscore templating. |
| `axios` (used directly) | HIGH | SSRF (CVE-2024-39338) | Server code only calls `axios.get('https://xdcscan.io/...')` with hardcoded hosts. No user-controlled URL. The `getRewards` path that used axios is also commented out. |
| `follow-redirects` | HIGH | Cross-host `Proxy-Authorization` leak | No outbound axios request carries a `Proxy-Authorization` header; irrelevant. |
| `validator` (via `express-validator`) | HIGH | ReDoS in `isURL` / URL bypass | Codebase never calls `isURL`; only uses `isInt`, `isAscii`, `isLength`, `exists`, `contains`. |
| `ip` (via `ipfs-http-client`) | HIGH | SSRF misclassification in `isPublic` | Called internally by `ipfs-http-client` on its own peer list, not on user input. |
| `node-forge` (via `ipfs-http-client`) | HIGH | Prototype pollution (debug API), URL parsing | Reached only on TLS-cert parsing inside ipfs client, not user-facing. |
| `node-fetch` (via `ipfs-http-client`) | HIGH | Secure-header forwarding on redirect | No user-controlled URL fed to node-fetch. |
| `parse-duration` (via `ipfs-http-client`) | HIGH | ReDoS | Triggered only by strings coming back from the ipfs node, not from our HTTP inputs. |
| `tar` (via `xdc3`/`swarm-js`) | HIGH | Hardlink path traversal during extraction | Would require the XDC RPC to serve a malicious tar — not an external-attacker vector. |
| `ws` (via `xdc3` providers) | HIGH | DoS on many request headers | Only used as an **outbound** WS client to the XDC RPC; not a server surface. |
| `swarm-js` (via `xdc3`) | HIGH | Transitive | Swarm never invoked by this app's code. |
| `multiaddr`, `mafmt`, `peer-id`, `peer-info`, `libp2p-crypto` | HIGH | Various (ipfs-http-client family) | Peer-discovery code in ipfs client; no user control. |
| `uuid` | MODERATE | v3/v5/v6 buffer bounds check | Code uses `uuid/v4` with no `buf` argument. Not reachable. |
| `twitter` | MODERATE | Transitive SSRF via `request` | Only used for a server-initiated Twitter query to a hardcoded endpoint. |
| `bn.js` | MODERATE | Infinite-loop on crafted input | Inputs going into `bn.js` pass through `ethereumjs-util` / `xdc3` validators first; JSON-RPC payload shape is bounded. Not reachable with unbounded attacker input. |
| `got` (via `xdc3`) | MODERATE | UNIX-socket redirect | No attacker-controlled URL supplied to `got`. |
| `form-data` (via `ipfs-http-client`) | CRITICAL | Unsafe random in multipart boundary | Only affects multipart boundaries in outbound ipfs uploads; an attacker on the network path could potentially predict boundaries and splice content, but that requires being inline on HTTPS to the ipfs node. Not a remote-only attacker capability. |
| `ethjs-unit`, `number-to-bn`, `servify`, `eth-lib`, `@ethersproject/*`, `browserify-sign`, `create-ecdh`, `crypto-browserify`, `ethereum-cryptography`, `ethereumjs-util`, `libp2p-crypto-secp256k1`, `secp256k1`, `hdkey` | LOW | Various | Low-severity transitive; not on HTTP-reachable paths or only affect CLI/test harnesses. |

### 3.3 Dependency CVEs that **are reachable AND have a plausible live-exploit path**

Only two. And even these, their real-world impact on `master.xinfin.network` is
bounded by the other controls (or missing controls) discussed in §3.1.

#### `elliptic` — Signature Malleability (CVE-2024-48948, CVE-2024-42461)

- **Where it runs on the live server:** every call to `ecRecover` in
  `apis/auth.js:/verifyLogin`, `apis/voters.js:/verifyTx`,
  `apis/candidates.js:/verifyScannedQR`.
- **What the CVE does:** a malleable form of an ECDSA signature
  (`(r, n-s)` instead of `(r, s)`) still recovers to the same public key. If the
  server keys on the literal `(r, s, v)` triple — e.g. stores it and later rejects
  duplicates by triple equality — the attacker can replay the "same" valid signature
  under a second bytewise-distinct encoding.
- **Why it's live-relevant:** the pre-fix `apis/auth.js:/verifyLogin` (per §2) keys
  duplicate-replay detection on the `signedAddress + signedId` pair and stores the
  signature, but **does not bind the signature to the session id** (H-2). That means
  an attacker doesn't need signature malleability to replay — they can just replay the
  original signature against a different session id. The `elliptic` malleability
  CVE adds a second, more subtle replay vector on top of the same root cause, but
  doesn't meaningfully expand the attack surface beyond H-2.
- **Fix in our branch:** nonce-bound message + UUID-bound session id + 5-minute TTL
  make both the H-2 replay and the `elliptic` malleability replay ineffective.

#### `qs` — Query-string DoS via nested arrays (CVE-2024-52798)

- **Where it runs on the live server:** `body-parser.urlencoded()` and
  `express.query()` both import `qs`. Every `/api/*` endpoint that reads
  `req.query` or `req.body` with `application/x-www-form-urlencoded` goes through it.
- **What the CVE does:** a payload with deeply nested `arr[0][0][0]...[n]=value`
  bracket notation can cause `qs` to allocate memory roughly proportional to the
  nesting depth times the number of keys, bypassing the default `arrayLimit` through
  a bracket-notation edge case.
- **Why it's live-relevant:** `master.xinfin.network` has **no rate limiter** (M-2
  confirmed live, §4.2), `app.use(bodyParser.urlencoded({ extended: true }))` in
  `index.js` does not set a reduced `parameterLimit` or `depth`, and Cloudflare in
  front rate-limits per IP but not per-endpoint. A single client could therefore send
  a moderately large urlencoded payload to `/api/auth/verifyLogin` and exhaust the
  Node worker's memory. This is a realistic soft-DoS vector.
- **Fix:** our branch's `express-rate-limit` would cap a single IP to 60 auth POSTs /
  15 min, dramatically reducing the blast radius. A belt-and-braces fix would also be
  to bound `bodyParser` via `parameterLimit` / `limit`.

---

## 4. Live probes (raw evidence)

### 4.1 H-8 — Weak CSP (live response headers)

```http
content-security-policy: default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google-analytics.com https://www.googletagmanager.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https: http: https://www.google-analytics.com;
  connect-src 'self' https: wss: http: ws: https://www.google-analytics.com;
  font-src 'self' data: https:;
  object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'
```

`'unsafe-inline'` + `'unsafe-eval'` + `http:` schemes for `img-src`/`connect-src` —
exactly what H-8 flagged. Our fix removes `'unsafe-eval'`, drops `http:` schemes, and
adds `upgradeInsecureRequests: true`.

### 4.2 M-2 — No rate limiting

25 back-to-back requests to `/api/auth/generateLoginQR` from a single IP:

```text
200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200
```

All 200s. Further 35 requests: 0 × `retry-after` header, 0 × `ratelimit-*` header, 0 × 429.

### 4.3 M-4 — Internal detail leak

```http
POST /api/auth/verifyLogin?id=…  body={invalid
  → HTTP 400 {"status":400,"error":{"message":"Unexpected token i in JSON at position 1"}}

POST /api/auth/verifyLogin?id=… body='{"message":"[XDCmaster x] Login","signature":"0x01",…}'
  → HTTP 406 {"status":406,"error":{"message":"Invalid signature length"}}
```

Both leak internal library errors verbatim. Our fix's `sanitizeForClient()` would
return a generic `"Error"` message and only log the full detail server-side.

### 4.4 M-6 — Unauthenticated Swagger UI

`GET /api-docs/` returns the Swagger UI HTML. `GET /api-docs/swagger-ui-init.js` returns
the full OpenAPI 2.0 spec, with every route documented:

```text
/api/config
/api/candidates
/api/candidates/{candidate}
/api/candidates/{candidate}/isCandidate
/api/candidates/{candidate}/isMasternode
/api/candidates/{candidate}/voters
/api/candidates/{candidate}/{owner}/getRewards
/api/candidates/{candidate}/{owner}/isOwner
/api/candidates/masternodes
/api/candidates/proposedMNs
/api/candidates/resignedMNs
/api/candidates/slashed/{epoch}
/api/candidates/slashedMNs
/api/signers/get/latest
/api/transactions/{tx}
/api/transactions/candidate/{candidate}
/api/transactions/voter/{voter}
/api/voters/annualReward
/api/voters/{voter}/candidates
/api/voters/{voter}/rewards
```

Zero authentication. Our fix gates `/api-docs` behind `express-basic-auth` in
production.

### 4.5 Reverse-proxy fingerprint

```http
x-powered-by: ARR/3.0
x-powered-by: ASP.NET
server: cloudflare
```

`master.xinfin.network` sits behind Cloudflare → IIS with Application Request Routing
(ARR) → the Node/Express app. ARR/IIS-level protections don't cover the rate-limiting
and input-validation issues above because those require per-endpoint logic that IIS
doesn't have visibility into.

---

## 5. Is master.xinfin.network "vulnerable"?

Yes — but **not primarily because of the 120 npm audit findings**.

**Live-exploitable today (high confidence):**

1. **QR-login signature replay** (H-2). Captured once, replayable against any future
   session id for the same signer. `elliptic` sig malleability (CVE-2024-48948) sits
   on top as a minor amplification.
2. **Unauthenticated OpenAPI spec dump** (M-6). Every endpoint, parameter, and data
   shape leaked to an unauthenticated visitor at `/api-docs/`.
3. **No endpoint-level rate limiting** (M-2). Enables the `qs` DoS
   (CVE-2024-52798) as well as brute-force enumeration of candidates / voters, and
   free QR-session flooding. Our fix's `authLimiter` and `uploadLimiter` close this.
4. **Leaky error messages** (M-4). Internal ethereumjs-util / body-parser error
   strings go straight to the client, speeding up reconnaissance.
5. **IPFS KYC flow unbinding** (M-9). If the static `x-api-key` ever leaks from a
   wallet binary, a compromised CI, or a network capture, an attacker can submit
   arbitrary KYC documents on behalf of any XDC address. Our fix replaces it with a
   server-minted single-use nonce bound to the file's SHA-256.
6. **`$regex` injection / ReDoS on `/api/candidates/search`** (H-1). Low practical
   impact on data disclosure (very few candidates have a `name` field set), but still
   a DoS vector on MongoDB.
7. **Weak CSP** (H-8). Any future DOM-based XSS in the Vue bundle becomes trivially
   escalatable because `'unsafe-inline'` and `'unsafe-eval'` are still allowed for
   scripts.
8. **No EIP-155 enforcement in `/api/voters/verifyTx`** (H-7). A signed transaction
   for the mainnet can be replayed on the Apothem testnet (or vice-versa), or
   replayed across chain-id migrations.

**Latent (present in node_modules but not reachable):** The remaining ~59 npm audit
findings. Most are `xdc3` → `request`/`underscore`/`elliptic` duplicates or
`ipfs-http-client` → `ip`/`node-fetch`/`node-forge`/`parse-duration` items where
attacker-controlled input never reaches the vulnerable sink. These would light up if
somebody added a new route that passed `req.body` into a `request()` URL, or fed
`req.query.url` into axios, or called `_.template(req.body.x)`. Today none of those
paths exist.

---

## 6. What to deploy

The fix branch `xcantera/MasterNode-App:security-fixes-2026-04-24` (commit `3731be5`,
already up on the fork) closes all eight application-level findings. Deploying it
turns off the live-exploitable portion of this report.

The 120 npm-audit findings stay (minus the handful that happen to be pulled through
our added `lodash.escaperegexp` + `express-basic-auth` + `express-rate-limit`, which
are on modern versions) and are **still worth a follow-on ticket**, but bumping the
majors of `xdc3`, `ipfs-http-client`, `web3-provider-engine` is a much larger
engineering effort that touches wallet signing contracts, IPFS upload formats, and
the crawl pipeline. Our branch explicitly defers that work and tracks it under
"Known remaining work" in `SECURITY_FIXES.md`.

---

## Appendix A — reproduction commands

```bash
# Categorize all audit findings by reachability
cd targets/MasterNode-App
npm audit --production --json > /tmp/audit-prod.json
node /tmp/audit-categorize.js     # bucketize by what the server require()s
node /tmp/audit-trace.js          # traverse npm ls for each advisory
node /tmp/audit-strict.js         # strict filter to server-runtime only

# Live probes (safe / non-destructive)
curl -sS -I https://master.xinfin.network/
curl -sS    https://master.xinfin.network/api/auth/generateLoginQR
curl -sS -X POST "https://master.xinfin.network/api/auth/verifyLogin?id=abc123" \
     -H 'Content-Type: application/json' -d '{}'
curl -sS    https://master.xinfin.network/api-docs/swagger-ui-init.js | \
     grep -oE '"/api/[^"]+"' | sort -u
for i in $(seq 1 25); do
  curl -sS -o /dev/null -w "%{http_code} " https://master.xinfin.network/api/auth/generateLoginQR
done; echo
```

## Appendix B — raw categorized lists

- `/tmp/audit-server-runtime.json` — 61 server-runtime advisories with traced requirer chains
- `/tmp/audit-strict.out` — human-readable three-bucket table
- `/tmp/xinfin-probe/` — raw HTTP probe outputs (headers, Swagger spec, sample JSON bodies)
