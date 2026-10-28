# Expo certificate adapter

Private, limited compatibility adapter for the Node-based Expo 58 CLI. This is a new implementation, not Forge source or a patched Forge distribution. It is installed under the `node-forge` dependency slot to support Expo CLI's certificate subject reader; its truthful package name is `@chef-ai/expo-certificate-crypto`.

RSA key generation, signing, signature verification and X.509 signature checks use Node `crypto` / OpenSSL. Pinned Peculiar ASN.1 schemas serialize certificates and CSRs and decode certificate metadata. The adapter does not implement RSA padding or signature validation itself. It rejects malformed/noncanonical DER, unsupported CSR signature algorithms, invalid CSR signatures and mismatched signing keys.

## Supported surface

- `require('node-forge').pki.certificateFromPem`: certificate subject fields CN/O/OU used by Expo CLI's iOS identity reader.
- `require('node-forge/code-signing')`: the high-level `@expo/code-signing-certificates@0.0.7` exports used by Expo CLI.
- Key values are Node KeyObjects; certificates/CSRs are immutable adapter views, not Forge objects.
- `certificate.verify(child)` checks the issuer name and cryptographic signature only, matching the narrow parent-signature operation. It is not a trust-chain validator. `validateSelfSignedCertificate` additionally checks validity, usage and key consistency.

No browser/mobile runtime support or general Forge API compatibility is promised. A new dependency that imports other Forge APIs requires review. Future Expo changes must be reviewed before updating bridge hashes. Native iOS provisioning and signed-update acceptance still require a future authorized device/build validation.

## Packaging and integrity

From `mobile/vendor/expo-certificate-crypto`, run `npm pack --pack-destination ..`. Review the source, update the adapter hashes in `mobile/security/patches.json`, and refresh the local tarball integrity in the mobile lockfile. Run a clean `npm ci` and existing application/security tests from `mobile/`. Do not install from the repository root.

The postinstall bridge replaces the exact reviewed Expo code-signing JS/declaration files and checks the adapter source hashes. Unknown upstream content fails installation. Lockfile SHA512 protects the tarball, including this source and its exact dependency declarations. No Snyk ignore or advisory suppression is used.
