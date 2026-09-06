/**
 * Base URL of the extension's own site/API (landing, changelog, tip
 * redirects, and the /api endpoints). The single place to change it — e.g.
 * point it at http://localhost:3210 while testing against a local API, via
 * `VITE_SITE_URL` in an .env.development.local (never commit that file). It is
 * mode-scoped on purpose: dev-only, so a production build/release always falls
 * back to the prod URL below and never bakes in localhost.
 */
export const SITE_URL: string =
    import.meta.env.VITE_SITE_URL ?? "https://nomi.zar.mx";

/** The user guide on the extension's site. */
export const HELP_URL = `${SITE_URL}/help`;
