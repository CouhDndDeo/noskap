/**
 * Строит путь к статике из /public с учётом base, под которым собрано приложение.
 * Нужно, чтобы карта работала не только на корне домена, но и на GitHub Pages
 * (например, https://user.github.io/noskap/).
 */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function assetUrl(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${BASE}${clean}`;
}
