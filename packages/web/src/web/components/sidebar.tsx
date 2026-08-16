import type { Location, LocationKind } from "../data/locations";
import { KIND_META } from "../data/locations";
import { glyphPath } from "../lib/pins";

type Props = {
  locations: Location[];
  total: number;
  query: string;
  onQuery: (value: string) => void;
  activeKinds: Set<LocationKind>;
  onToggleKind: (kind: LocationKind) => void;
  onResetFilters: () => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  gm: boolean;
  open: boolean;
  onClose: () => void;
};

function KindGlyph({ kind, size = 18 }: { kind: LocationKind; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d={glyphPath(kind)} fill={KIND_META[kind].color} />
    </svg>
  );
}

function Sidebar({
  locations,
  total,
  query,
  onQuery,
  activeKinds,
  onToggleKind,
  onResetFilters,
  selectedId,
  onSelect,
  gm,
  open,
  onClose,
}: Props) {
  const kinds = Object.keys(KIND_META) as LocationKind[];

  return (
    <aside
      className="parchment anim-left pointer-events-auto absolute top-4 bottom-4 left-4 z-20 flex w-[340px] max-w-[calc(100vw-2rem)] flex-col rounded-sm"
      style={{ display: open ? "flex" : "none" }}
    >
      <header className="px-5 pt-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1
              className="text-[26px] leading-none"
              style={{ letterSpacing: "0.02em" }}
            >
              Земли Носкапа
            </h1>
            <p className="label-caps mt-2">
              {gm ? "режим мастера" : "карта для игроков"} · {total} локаций
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-sm border border-[rgba(120,92,44,0.5)] px-2 py-1 text-[13px] leading-none opacity-70 transition hover:opacity-100"
            title="Свернуть панель"
          >
            ‹‹
          </button>
        </div>
      </header>

      <div className="brass-rule mx-5" />

      <div className="px-5 pt-4">
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Поиск по названию и лору…"
          className="w-full rounded-sm border border-[rgba(120,92,44,0.5)] bg-[rgba(255,248,230,0.45)] px-3 py-2 text-[14px] outline-none placeholder:text-[rgba(107,91,65,0.75)] focus:border-[rgba(120,92,44,0.9)]"
        />

        <div className="mt-3 flex flex-wrap gap-1.5">
          {kinds.map((kind) => (
            <button
              key={kind}
              type="button"
              className="chip"
              data-active={activeKinds.has(kind)}
              onClick={() => onToggleKind(kind)}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: KIND_META[kind].color }}
              />
              {KIND_META[kind].label}
            </button>
          ))}
          {(activeKinds.size > 0 || query) && (
            <button type="button" className="chip" onClick={onResetFilters}>
              сбросить
            </button>
          )}
        </div>
      </div>

      <div className="scroll-thin mt-4 flex-1 overflow-y-auto px-3 pb-4">
        {locations.length === 0 && (
          <p className="px-2 py-6 text-center text-[14px] text-[var(--muted-foreground)]">
            Ничего не нашлось.
          </p>
        )}
        <ul className="flex flex-col gap-1">
          {locations.map((loc) => {
            const active = loc.id === selectedId;
            return (
              <li key={loc.id}>
                <button
                  type="button"
                  onClick={() => onSelect(loc.id)}
                  className="w-full cursor-pointer rounded-sm px-2 py-2 text-left transition"
                  style={{
                    background: active
                      ? "rgba(36,28,17,0.92)"
                      : "transparent",
                    color: active ? "var(--parchment)" : "var(--foreground)",
                    borderLeft: `3px solid ${
                      active ? KIND_META[loc.kind].color : "transparent"
                    }`,
                  }}
                >
                  <span className="flex items-start gap-2.5">
                    <span className="mt-0.5 shrink-0">
                      <KindGlyph kind={loc.kind} />
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[16px]"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {loc.name}
                        {loc.hidden && (
                          <span
                            className="ml-1.5 align-middle text-[10px] tracking-wider uppercase"
                            style={{ color: "var(--blood)" }}
                          >
                            гм
                          </span>
                        )}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[12.5px]"
                        style={{
                          color: active
                            ? "rgba(233,221,193,0.7)"
                            : "var(--muted-foreground)",
                        }}
                      >
                        {loc.summary}
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}

export default Sidebar;
