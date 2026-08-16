import type { Coordinate } from "ol/coordinate";

export const TRAVEL_MODES = [
  { key: "foot", label: "пешком", leaguesPerDay: 8 },
  { key: "horse", label: "верхом", leaguesPerDay: 16 },
  { key: "forced", label: "форсированный марш", leaguesPerDay: 24 },
] as const;

type Props = {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  showLabels: boolean;
  onToggleLabels: () => void;
  rulerActive: boolean;
  onToggleRuler: () => void;
  onReset: () => void;
  onZoom: (delta: number) => void;
  gm: boolean;
  rulerPoints: Coordinate[];
  onClearRuler: () => void;
  onUndoRuler: () => void;
  pixelsPerLeague: number;
  onPixelsPerLeague: (value: number) => void;
  pickActive: boolean;
  onTogglePick: () => void;
};

function plural(n: number, one: string, few: string, many: string) {
  const abs = Math.abs(Math.round(n));
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

function totalPixels(points: Coordinate[]) {
  let sum = 0;
  for (let i = 1; i < points.length; i += 1) {
    const [x1, y1] = points[i - 1];
    const [x2, y2] = points[i];
    sum += Math.hypot(x2 - x1, y2 - y1);
  }
  return sum;
}

function Toolbar({
  sidebarOpen,
  onToggleSidebar,
  showLabels,
  onToggleLabels,
  rulerActive,
  onToggleRuler,
  onReset,
  onZoom,
  gm,
  rulerPoints,
  onClearRuler,
  onUndoRuler,
  pixelsPerLeague,
  onPixelsPerLeague,
  pickActive,
  onTogglePick,
}: Props) {
  const px = totalPixels(rulerPoints);
  const leagues = px / Math.max(1, pixelsPerLeague);
  const km = leagues * 5;
  const segments = Math.max(0, rulerPoints.length - 1);

  return (
    <div className="pointer-events-none absolute right-0 bottom-4 left-0 z-30 flex flex-col items-center gap-2 px-4">
      {rulerActive && (
        <div className="parchment anim-rise pointer-events-auto w-full max-w-[560px] rounded-sm px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="label-caps">путь</p>
              <p className="text-[20px]" style={{ fontFamily: "var(--font-display)" }}>
                {leagues.toFixed(1)}{" "}
                {plural(leagues, "лига", "лиги", "лиг")}{" "}
                <span className="text-[13px] text-[var(--muted-foreground)]">
                  ≈ {Math.round(km)} км · {segments}{" "}
                  {plural(segments, "отрезок", "отрезка", "отрезков")}
                </span>
              </p>
            </div>
            <label className="flex items-center gap-2 text-[12px] text-[var(--muted-foreground)]">
              пикселей в лиге
              <input
                type="number"
                min={4}
                max={200}
                value={pixelsPerLeague}
                onChange={(e) =>
                  onPixelsPerLeague(Math.max(4, Number(e.target.value) || 4))
                }
                className="w-[70px] rounded-sm border border-[rgba(120,92,44,0.5)] bg-[rgba(255,248,230,0.5)] px-2 py-1 text-[13px] text-[var(--foreground)] outline-none"
              />
            </label>
          </div>

          <div className="brass-rule my-2.5" />

          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
            {TRAVEL_MODES.map((mode) => {
              const days = leagues / mode.leaguesPerDay;
              return (
                <div key={mode.key} className="text-[13px]">
                  <span className="text-[var(--muted-foreground)]">
                    {mode.label}:
                  </span>{" "}
                  <strong>
                    {days < 0.05
                      ? "—"
                      : days < 1
                        ? `${Math.round(days * 8)} ч`
                        : `${days.toFixed(1)} ${plural(days, "день", "дня", "дней")}`}
                  </strong>
                </div>
              );
            })}
          </div>

          <div className="mt-2.5 flex items-center gap-2">
            <button type="button" className="btn-brass" onClick={onUndoRuler}>
              убрать точку
            </button>
            <button type="button" className="btn-brass" onClick={onClearRuler}>
              очистить
            </button>
            <span className="text-[12px] text-[var(--muted-foreground)]">
              кликайте по карте, чтобы ставить точки маршрута
            </span>
          </div>
        </div>
      )}

      <div className="parchment anim-rise pointer-events-auto flex flex-wrap items-center gap-1.5 rounded-sm px-2 py-2">
        {!sidebarOpen && (
          <button type="button" className="btn-brass" onClick={onToggleSidebar}>
            локации
          </button>
        )}
        <button
          type="button"
          className="btn-brass"
          data-active={rulerActive}
          onClick={onToggleRuler}
        >
          линейка
        </button>
        <button
          type="button"
          className="btn-brass"
          data-active={showLabels}
          onClick={onToggleLabels}
        >
          подписи
        </button>
        <button type="button" className="btn-brass" onClick={() => onZoom(1)}>
          +
        </button>
        <button type="button" className="btn-brass" onClick={() => onZoom(-1)}>
          −
        </button>
        <button type="button" className="btn-brass" onClick={onReset}>
          вся карта
        </button>
        {gm && (
          <button
            type="button"
            className="btn-brass"
            data-active={pickActive}
            onClick={onTogglePick}
            title="Снять координаты точки для новой локации"
          >
            координаты
          </button>
        )}
        {gm && (
          <span
            className="ml-1 rounded-sm px-2.5 py-1.5 text-[11px] tracking-[0.14em] uppercase"
            style={{
              background: "rgba(140,47,34,0.14)",
              border: "1px solid rgba(140,47,34,0.5)",
              color: "var(--blood)",
            }}
          >
            режим мастера
          </span>
        )}
      </div>
    </div>
  );
}

export default Toolbar;
