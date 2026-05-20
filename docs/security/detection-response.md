# Detection and Response Playbook

## Covered Advisories

This playbook currently covers the recent advisory families reviewed on 2026-05-11:

- Vite dev-server arbitrary file read: CVE-2026-39363 / GHSA-p9ff-h696-f583, plus related Vite 7.3.1 file-read advisories.
- i18next-http-backend locale path traversal / URL injection: CVE-2026-41691 / GHSA-q89c-q3h5-w34g.
- protobufjs generated-code execution through attacker-controlled schemas: CVE-2026-41242 / GHSA-xq3m-2v4x-88gg.
- fast-xml-parser entity expansion DoS: CVE-2026-33036 / GHSA-8gc5-j5rx-235r and related XML entity advisories.

## Runbook

Run the local detector against repository logs:

```bash
npm run security:scan-logs
```

Run it against exported Firebase or hosting logs:

```bash
node scripts/scan-security-logs.mjs path/to/exported/logs
```

The script exits with code `1` when it finds suspicious indicators. Treat a hit as an investigation trigger, not proof of compromise.

## Detector Mapping

| Detector | Looks for | First response |
| --- | --- | --- |
| `vite-file-read-probe` | `vite:invoke`, `fetchModule`, `file://`, `@fs`, `?raw`, `.map` probing, `.env`, `etc/passwd`, `win.ini` | Stop exposed dev server, preserve logs, rotate local secrets, confirm no tunnel or proxy exposed Vite. |
| `i18next-locale-injection` | `lng`/`ns` traversal, encoded traversal, unexpected locale asset path manipulation | Confirm served path/status, purge caches, check locale config, upgrade backend package. |
| `xml-entity-expansion` | `DOCTYPE`, `<!ENTITY`, dense numeric entities | Disable offending feed/source, cap parser input, patch parser chain, inspect function memory/timeout metrics. |
| `protobuf-descriptor-injection` | Suspicious protobuf JSON descriptor/function injection strings | Confirm no endpoint loads untrusted descriptors, block source, patch transitive protobuf dependency. |
| `common-secret-probing` | Requests for `.git/config`, private keys, env files, tokens, API keys | Preserve evidence, rotate exposed secrets if the request may have succeeded, block origin if public. |

## Cloud Logging Queries

Use these as starting points in Google Cloud Logging for Firebase Hosting / Cloud Functions:

```text
textPayload=~"(?i)(vite:invoke|fetchModule|@fs|file://|\\.env|etc/passwd|win\\.ini|server\\.fs|\\.map\\?|\\?raw)"
```

```text
textPayload=~"(?i)(lng|ns)(=|%3d).*(\\.\\.|%2e%2e|%2f|%5c|/|\\\\|\\?|%3f)"
```

```text
textPayload=~"(?i)(<!DOCTYPE|<!ENTITY|&#x?[0-9a-f]{2,};)"
```

```text
textPayload=~"(?i)(protobuf|proto3|nested.*fields|child_process|process\\.mainModule|Function\\(|constructor\\.constructor)"
```

## Response Criteria

Escalate to high severity when:

- A Vite probe reached a server bound to anything other than loopback.
- A log shows successful response status for file-read or traversal indicators.
- A function handling external feeds shows XML entity payloads followed by memory, timeout, or crash symptoms.
- Any endpoint is found accepting user-controlled protobuf descriptors.

Close as no evidence of exploitation only after:

- Affected dependency versions and runtime exposure are documented.
- Logs from the relevant environment and time window are searched.
- Any secret-bearing files possibly exposed by the route are rotated or proven unreachable.
- Package upgrade or compensating control is tracked.
