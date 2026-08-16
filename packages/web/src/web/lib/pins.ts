import type { LocationKind } from "../data/locations";
import { KIND_META } from "../data/locations";

/** Гравюрные глифы внутри медальона. Рисуются в системе координат 24×24. */
const GLYPHS: Record<string, string> = {
  crown:
    "M4 16 L4 9 L8 12.5 L12 6.5 L16 12.5 L20 9 L20 16 Z M4 18 L20 18 L20 19.6 L4 19.6 Z",
  town: "M3.2 19.5 L3.2 12 L8 8.4 L12.8 12 L12.8 19.5 Z M14.2 19.5 L14.2 10.2 L17.6 7.4 L21 10.2 L21 19.5 Z M6.6 19.5 L6.6 15.4 L9.4 15.4 L9.4 19.5 Z",
  tower:
    "M8 20 L8 8.6 L6.6 8.6 L6.6 5.6 L8.6 5.6 L8.6 7 L11 7 L11 5.6 L13 5.6 L13 7 L15.4 7 L15.4 5.6 L17.4 5.6 L17.4 8.6 L16 8.6 L16 20 Z M10.4 12.4 L13.6 12.4 L13.6 16.2 L10.4 16.2 Z",
  peak: "M2 19.6 L9 6.4 L12.6 12.6 L14.6 9.4 L22 19.6 Z M9 9.8 L11.2 13.8 L6.8 13.8 Z",
  tree: "M12 3.4 L17.6 12 L14.6 12 L19.4 18.6 L4.6 18.6 L9.4 12 L6.4 12 Z M10.8 18.6 L13.2 18.6 L13.2 21.2 L10.8 21.2 Z",
  skull:
    "M12 3.2 C7.2 3.2 4 6.4 4 10.6 C4 13.2 5.2 15 6.8 16.1 L6.8 19 C6.8 19.8 7.4 20.4 8.2 20.4 L15.8 20.4 C16.6 20.4 17.2 19.8 17.2 19 L17.2 16.1 C18.8 15 20 13.2 20 10.6 C20 6.4 16.8 3.2 12 3.2 Z M9 9.4 A2 2 0 1 1 9 13.4 A2 2 0 1 1 9 9.4 Z M15 9.4 A2 2 0 1 1 15 13.4 A2 2 0 1 1 15 9.4 Z M11 15.6 L13 15.6 L13 18.6 L11 18.6 Z",
  wild: "M12 2.8 L14.2 8.4 L20 8.4 L15.4 12 L17.2 18 L12 14.4 L6.8 18 L8.6 12 L4 8.4 L9.8 8.4 Z",
};

function svgPin(opts: {
  color: string;
  glyph: string;
  selected: boolean;
  hidden: boolean;
}) {
  const { color, glyph, selected, hidden } = opts;
  const ring = selected ? "#E8C06A" : "#C0902F";
  const ringWidth = selected ? 3 : 2;
  const body = hidden ? "#2A1412" : "#17130C";
  const stroke = hidden ? "#8C2F22" : ring;
  const d = GLYPHS[glyph] ?? GLYPHS.town;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="46" height="58" viewBox="0 0 46 58">
  <defs>
    <filter id="s" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="2" stdDeviation="2.2" flood-color="#000" flood-opacity="0.55"/>
    </filter>
  </defs>
  <g filter="url(#s)">
    <path d="M23 55 L18.4 40 L27.6 40 Z" fill="${stroke}" opacity="0.9"/>
    <circle cx="23" cy="22" r="18" fill="${body}"/>
    <circle cx="23" cy="22" r="18" fill="none" stroke="${stroke}" stroke-width="${ringWidth}"/>
    <circle cx="23" cy="22" r="14.4" fill="none" stroke="${color}" stroke-width="1" opacity="0.75"/>
    ${selected ? `<circle cx="23" cy="22" r="21" fill="none" stroke="#E8C06A" stroke-width="1" opacity="0.55"/>` : ""}
    <g transform="translate(12.8,11.8) scale(0.85)">
      <path d="${d}" fill="${color}"/>
    </g>
  </g>
</svg>`;
}

const cache = new Map<string, string>();

export function pinDataUrl(
  kind: LocationKind,
  selected: boolean,
  hidden: boolean,
) {
  const key = `${kind}-${selected}-${hidden}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const meta = KIND_META[kind];
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    svgPin({ color: meta.color, glyph: meta.glyph, selected, hidden }),
  )}`;
  cache.set(key, url);
  return url;
}

/** Тот же глиф, но как inline-SVG для списка в сайдбаре. */
export function glyphPath(kind: LocationKind) {
  return GLYPHS[KIND_META[kind].glyph] ?? GLYPHS.town;
}
