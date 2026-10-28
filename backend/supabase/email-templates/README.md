# Chef-AI auth email setup

Status: prepared source templates, **not installed or sent**. The user reports receiving and using the existing Supabase confirmation email on Android. This does not verify branded delivery, arbitrary recipient delivery or recovery email delivery.

## Required before activation

- Confirm an owned sending domain, From address and SMTP host/port/username/password. Sender display name: Chef-AI. Keep credentials in the provider dashboard, never in either repo or mobile public environment.
- Verify domain ownership and provider-required SPF/DKIM; configure DMARC. Do not create a paid plan or accept provider terms without the owner's decision.
- Supabase new Free projects using default SMTP cannot customize auth templates since 3 June 2026. Custom SMTP is required here. The default service is restricted and unsuitable for production.
- Configure the **staging** project first (`vcyqtbzhfanbpclfhibv`). Keep email confirmation enabled and the exact existing `chefai://auth/callback` allowlist. Do not add wildcard redirects.

## Installation after SMTP is ready

1. Set sender display name `Chef-AI` and the verified From address in Authentication → Email → SMTP settings.
2. In Confirm signup, use `confirmation.html`; subject: `Chef-AI — E-postanı doğrula / Confirm your email`.
3. In Reset password, use `recovery.html`; subject: `Chef-AI — Parolanı yenile / Reset your password`.
4. Keep the Supabase-generated `{{ .ConfirmationURL }}`. It verifies the one-time token and preserves the requested redirect/PKCE exchange. Do not replace it with SiteURL, hardcoded tokens or an unverified custom link.
5. Disable SMTP click tracking/link rewriting. Never log verification links. Do not interpolate user-supplied metadata into HTML.
6. Test fresh signup/resend and password recovery with the app both open and closed; test expired/reused links, rate limiting and a recipient outside the Supabase organization. Verify From, SPF/DKIM/DMARC and spam delivery in the real inbox.
7. Apply to production only after staging acceptance and the final production origin/sender are confirmed.

These are bilingual transactional templates in the existing cream/green/lime palette. No marketing, tracking pixels, fake support address or invented legal identity is included. The templates do not change the SMTP envelope sender themselves.

Sources: [Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [Email templates](https://supabase.com/docs/guides/auth/auth-email-templates), [Free-tier change](https://supabase.com/changelog/46599-changes-to-email-template-customisation-on-free-tier).
