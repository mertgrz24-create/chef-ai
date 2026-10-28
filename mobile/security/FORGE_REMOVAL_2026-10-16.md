# Forge removal and final Snyk follow-up — 2026-10-16

## Source change

The remaining high finding was `SNYK-JS-NODEFORGE-19635204` / `CVE-2026-85393`. The prior Forge PR snapshot still matched Snyk's all-versions advisory. Forge implementation code has now been removed from the mobile dependency graph.

`vendor/expo-certificate-crypto` is a new, limited Expo adapter. Node `crypto` / OpenSSL performs RSA signing and verification; exact Peculiar ASN.1 2.11.0 schemas handle certificate/CSR serialization and metadata. The actual package identity is `@chef-ai/expo-certificate-crypto@1.0.0`, installed from a checked-in SHA512-pinned tarball under Expo's `node-forge` import slot. No vulnerable Forge code was relabeled. It is not a general Forge replacement.

The adapter preserves Expo's synchronous high-level code-signing exports and its iOS certificate CN/O/OU reader. It validates CSR signatures, matching key pairs, certificate usage/validity and canonical DER. The hash-checked postinstall bridge replaces the reviewed `@expo/code-signing-certificates@0.0.7` JS/declaration entry points; four integrity checks protect the adapter implementation. Unknown dependency changes fail installation. See [adapter scope and packaging](../vendor/expo-certificate-crypto/README.md).

## Development dependencies

A fresh authenticated `snyk test --dev` found four additional development-tool advisories, beyond the extension's zero-issue result. The original raw report is [snyk-dev-before-2026-10-16.json](snyk-dev-before-2026-10-16.json).

- Replace `uri-js@4.4.1` with `fast-uri@4.2.2` under the old import slot. AJV 6 uses its `parse`, `serialize` and `resolve` APIs. The replacement is maintained by Fastify; its actual canonical name and integrity are retained in the lockfile. [Producer source](https://github.com/fastify/fast-uri).
- Override `test-exclude` to official 7.0.2, whose modern glob dependency removes the `inflight` chain used by older Istanbul/Babel tooling. [Producer changelog](https://github.com/istanbuljs/test-exclude/blob/master/CHANGELOG.md).
- Adopt the available Expo 58 patch releases for Expo, dev-client and router. No build or publication occurs.

No ignore, finding exclusion, severity downgrade or risk acceptance was added.

## Verification scope

Existing tests were explicitly authorized by the user. The certificate regression now runs through the actual adapter and native Node verifier: valid signatures, four malformed RSA DigestInfo variants, tampered data/CSR, mismatched keys, development certificates, issuer checks and subject parsing. Application mocks were adjusted for RNTL 14's asynchronous events and native Text requirements, preserving the deferred-request and double-tap checks.

HawkScan 6.6.0 and its skills are current. No `HAWK_API_KEY` or initialized `hawk.properties` exists, so authenticated DAST could not run. No account was created. Independent crypto review and a future authorized native/device acceptance remain outstanding. The current source targets Expo 58; installed Expo 57 APKs are unchanged and must not receive this source by OTA.

## Final command results

- Mobile: clean `npm ci` and `npm run check` passed: lint/typecheck, 14 Jest suites / 97 application tests, 17 actual-dependency security tests.
- Backend: 42 security tests and typecheck passed; lint now reports zero warnings/errors. The two cooking-mode state-reset warnings were fixed by mounting a fresh session on open/recipe change and resetting timer state in navigation events. Two unused staging `api` constants were removed; staging integration scripts were not executed.
- Authenticated Snyk CLI with `--dev`: mobile **0 findings / 1,076 dependencies**; backend **0 findings / 359 dependencies**. Backend's additional URI/Zod dev-tool findings were fixed with the same Fastify URI replacement and official Zod 4.6.7. Raw final reports: [mobile](snyk-dev-final-2026-10-16.json), [backend](../../backend/security/snyk-dev-final-2026-10-16.json).
- npm audit including dev dependencies: **0** in both directories. Raw reports: [mobile](audit-forge-removal-2026-10-16.json), [backend](../../backend/security/audit-dev-final-2026-10-16.json).
- Mobile `npm ls --all --omit=optional` passed. Online `expo install --check` recommends Jest 29 / @types/jest 29 even though installed jest-expo 58.0.11 explicitly supports Jest 29 or 30 and its own Jest packages use 30. Jest 30.5.2 is retained with passing real tests. This recommendation is not suppressed; the online check exits 1. Expo/dev-client/router patch recommendations were applied.
- No build, export, deployment, OTA or push. Native/device validation and independent review remain outside these test results.

## Editor diagnostics

Before editor refresh, Problems retained an old Forge finding, the already-remediated password/HMAC findings and transient missing Node/Expo types from reinstalling dependencies. Fresh Snyk CLI, TypeScript and lint results supersede those stale diagnostics. The user was asked to reload the VS Code window because UI automation did not reliably execute the reload command. Do not equate passing CLI checks with a verified empty Problems panel.

