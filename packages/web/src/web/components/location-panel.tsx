import Markdown from "react-markdown";
import type { Location } from "../data/locations";
import { KIND_META } from "../data/locations";
import { glyphPath } from "../lib/pins";
import { assetUrl } from "../lib/asset";

type Props = {
  location: Location;
  gm: boolean;
  onClose: () => void;
};

function LocationPanel({ location, gm, onClose }: Props) {
  const meta = KIND_META[location.kind];

  return (
    <section
      className="parchment anim-right pointer-events-auto absolute z-20 flex flex-col overflow-hidden rounded-sm
        max-md:right-0 max-md:bottom-0 max-md:left-0 max-md:max-h-[74vh] max-md:rounded-b-none
        md:top-4 md:right-4 md:bottom-4 md:w-[400px]"
    >
      <div className="relative shrink-0">
        <div className="flex justify-center pt-2 pb-1 md:hidden">
          <span className="h-1 w-10 rounded-full bg-[rgba(120,92,44,0.5)]" />
        </div>
        {location.art ? (
          <img
            src={assetUrl(location.art)}
            alt={location.name}
            className="h-[190px] w-full object-cover"
            style={{ filter: "saturate(0.9) contrast(1.05)" }}
          />
        ) : (
          <div
            className="flex h-[120px] w-full items-center justify-center"
            style={{
              background:
                "radial-gradient(ellipse at 50% 20%, rgba(36,28,17,0.16), transparent 70%)",
            }}
          >
            <svg width="56" height="56" viewBox="0 0 24 24" opacity="0.32">
              <path d={glyphPath(location.kind)} fill={meta.color} />
            </svg>
          </div>
        )}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2.5 right-2.5 cursor-pointer rounded-sm border border-[rgba(120,92,44,0.6)] bg-[rgba(20,17,12,0.72)] px-2 py-1 text-[13px] leading-none text-[var(--parchment)] transition hover:bg-[rgba(20,17,12,0.9)]"
          title="Закрыть"
        >
          ✕
        </button>
      </div>

      <div className="scroll-thin flex-1 overflow-y-auto px-6 pt-4 pb-6">
        <p className="label-caps" style={{ color: meta.color }}>
          {meta.label}
        </p>
        <h2 className="mt-1 text-[30px] leading-tight">{location.name}</h2>
        <p className="mt-1 text-[14px] italic text-[var(--muted-foreground)]">
          {location.summary}
        </p>

        {location.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {location.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[rgba(120,92,44,0.45)] bg-[rgba(255,248,230,0.35)] px-2.5 py-[3px] text-[11.5px]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="brass-rule my-4" />

        <div className="lore-prose">
          <Markdown>{location.lore}</Markdown>
        </div>

        {gm && location.gmNotes && (
          <div
            className="mt-5 rounded-sm border p-4"
            style={{
              borderColor: "rgba(140,47,34,0.55)",
              background: "rgba(140,47,34,0.08)",
            }}
          >
            <p className="label-caps" style={{ color: "var(--blood)" }}>
              заметки мастера
            </p>
            <div className="lore-prose mt-2 text-[14px]">
              <Markdown>{location.gmNotes}</Markdown>
            </div>
          </div>
        )}

        <p className="mt-5 text-[11.5px] text-[var(--muted-foreground)]">
          координаты: {location.x} × {location.y}
        </p>
      </div>
    </section>
  );
}

export default LocationPanel;
