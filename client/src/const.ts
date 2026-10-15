export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "PetHealth";

export const APP_LOGO = `${import.meta.env.BASE_URL.replace(/\/+$/, "")}/app-icon.png`; // paw+heart mark, base-relative (TK 14/10)

// Login URL is now our own /login page (no external OAuth).
// TK 14/10: must be base-relative — the app lives under /pet-health/ on pedpro.online,
// root-relative "/login" escapes the app and 404s. import.meta.env.BASE_URL is "/" on
// pethealth.pages.dev and "/pet-health/" on the pedpro build.
export const getLoginUrl = () => `${import.meta.env.BASE_URL.replace(/\/+$/, "")}/login`;
