import { useState } from "react";
import { KIND_META, type LocationKind } from "../data/locations";

type Props = {
  /** Последняя снятая точка, null — ещё не кликали */
  point: { x: number; y: number } | null;
  onClose: () => void;
};

const KINDS = Object.keys(KIND_META) as LocationKind[];

function slugify(name: string) {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh",
    з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
    п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c",
    ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu",
    я: "ya",
  };
  return (
    name
      .toLowerCase()
      .split("")
      .map((ch) => map[ch] ?? ch)
      .join("")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "new-location"
  );
}

function snippet(
  name: string,
  kind: LocationKind,
  x: number,
  y: number,
) {
  const title = name.trim() || "Название локации";
  return `  {
    id: "${slugify(title)}",
    x: ${x},
    y: ${y},
    kind: "${kind}",
    name: "${title}",
    summary: "Одна строка для списка и подписи на карте.",
    tags: ["метка", "ещё метка"],
    lore: \`Первый абзац — что это за место и как оно выглядит.

**Чем известно.** Детали, за которые цепляются игроки.

**Кто правит.** Кому принадлежит место и кто на самом деле решает.

**Настроение сейчас.** Что здесь изменилось прямо перед приходом партии.\`,
    gmNotes: \`Заметки только для мастера: что тут на самом деле происходит.

Крючок: зацепка для квеста.\`,
  },`;
}

function CoordPicker({ point, onClose }: Props) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<LocationKind>("city");
  const [copied, setCopied] = useState(false);

  const code = point ? snippet(name, kind, point.x, point.y) : "";

  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="parchment anim-rise pointer-events-auto w-full max-w-[560px] rounded-sm px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="label-caps">пипетка координат</p>
          <p
            className="text-[20px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {point ? (
              <>
                x: {point.x} · y: {point.y}
              </>
            ) : (
              <span className="text-[15px] text-[var(--muted-foreground)]">
                кликните по карте в нужном месте
              </span>
            )}
          </p>
        </div>
        <button type="button" className="btn-brass" onClick={onClose}>
          закрыть
        </button>
      </div>

      {point && (
        <>
          <div className="brass-rule my-2.5" />

          <div className="flex flex-wrap items-center gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Название локации"
              className="min-w-[180px] flex-1 rounded-sm border border-[rgba(120,92,44,0.5)] bg-[rgba(255,248,230,0.5)] px-2 py-1.5 text-[14px] text-[var(--foreground)] outline-none"
            />
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as LocationKind)}
              className="rounded-sm border border-[rgba(120,92,44,0.5)] bg-[rgba(255,248,230,0.5)] px-2 py-1.5 text-[14px] text-[var(--foreground)] outline-none"
            >
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {KIND_META[k].label}
                </option>
              ))}
            </select>
            <button type="button" className="btn-brass" onClick={copy}>
              {copied ? "скопировано" : "скопировать блок"}
            </button>
          </div>

          <pre className="mt-2.5 max-h-[150px] overflow-auto rounded-sm border border-[rgba(120,92,44,0.35)] bg-[rgba(30,22,14,0.06)] p-2 text-[11px] leading-[1.45] whitespace-pre">
            {code}
          </pre>

          <p className="mt-2 text-[12px] text-[var(--muted-foreground)]">
            Вставьте блок в конец массива{" "}
            <code>locations</code> в файле{" "}
            <code>src/web/data/locations.ts</code>
          </p>
        </>
      )}
    </div>
  );
}

export default CoordPicker;
