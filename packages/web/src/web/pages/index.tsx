import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Coordinate } from "ol/coordinate";
import MapView, { type MapHandle } from "../components/map-view";
import Sidebar from "../components/sidebar";
import LocationPanel from "../components/location-panel";
import Toolbar from "../components/toolbar";
import CoordPicker from "../components/coord-picker";
import type { LocationKind } from "../data/locations";
import { MAP_META, locations as allLocations } from "../data/locations";

function useGmMode() {
  const [gm, setGm] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setGm(params.get("gm") === "1");
  }, []);
  return gm;
}

function Index() {
  const gm = useGmMode();
  const [handle, setHandle] = useState<MapHandle | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeKinds, setActiveKinds] = useState<Set<LocationKind>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [rulerActive, setRulerActive] = useState(false);
  const [rulerPoints, setRulerPoints] = useState<Coordinate[]>([]);
  const [pickActive, setPickActive] = useState(false);
  const [pickedPoint, setPickedPoint] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [pixelsPerLeague, setPixelsPerLeague] = useState(
    MAP_META.pixelsPerLeague,
  );

  const visible = useMemo(
    () => allLocations.filter((loc) => gm || !loc.hidden),
    [gm],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visible.filter((loc) => {
      if (activeKinds.size > 0 && !activeKinds.has(loc.kind)) return false;
      if (!q) return true;
      const haystack = [
        loc.name,
        loc.summary,
        loc.lore,
        loc.tags.join(" "),
        gm ? (loc.gmNotes ?? "") : "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [visible, query, activeKinds, gm]);

  const selected = useMemo(
    () => visible.find((loc) => loc.id === selectedId) ?? null,
    [visible, selectedId],
  );

  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const sync = () => setIsNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const onReady = useCallback((h: MapHandle) => setHandle(h), []);

  const insets = useMemo(
    () => ({
      left: !isNarrow && sidebarOpen ? 356 : 0,
      right: !isNarrow && selectedId ? 416 : 0,
      bottom:
        isNarrow && selectedId
          ? Math.round(window.innerHeight * 0.72)
          : 0,
    }),
    [isNarrow, sidebarOpen, selectedId],
  );

  // перелёт откладываем до следующего рендера: к этому моменту insets
  // уже учитывают открывшуюся панель, и точка не уезжает под карточку
  const pendingFly = useRef<{ x: number; y: number } | null>(null);

  const selectAndFly = useCallback(
    (id: string | null) => {
      setSelectedId(id);
      if (!id) return;
      if (isNarrow) setSidebarOpen(false);
      const loc = visible.find((item) => item.id === id);
      if (loc) pendingFly.current = { x: loc.x, y: loc.y };
    },
    [visible, isNarrow],
  );

  useEffect(() => {
    const target = pendingFly.current;
    if (!target || !handle) return;
    pendingFly.current = null;
    handle.flyTo(target.x, target.y);
  }, [handle, insets, selectedId]);

  const toggleKind = useCallback((kind: LocationKind) => {
    setActiveKinds((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  }, []);

  const onRulerClick = useCallback((coord: Coordinate) => {
    setRulerPoints((prev) => [...prev, coord]);
  }, []);

  const onPick = useCallback((coord: Coordinate) => {
    setPickedPoint({ x: Math.round(coord[0]), y: Math.round(coord[1]) });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (pickActive) {
          setPickActive(false);
          setPickedPoint(null);
        } else if (rulerActive) {
          setRulerActive(false);
          setRulerPoints([]);
        } else {
          setSelectedId(null);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rulerActive, pickActive]);

  return (
    <main className="relative h-full w-full overflow-hidden bg-[var(--ink)]">
      <MapView
        locations={filtered}
        selectedId={selectedId}
        onSelect={selectAndFly}
        showLabels={showLabels}
        rulerActive={rulerActive}
        rulerPoints={rulerPoints}
        onRulerClick={onRulerClick}
        pickActive={gm && pickActive}
        onPick={onPick}
        insets={insets}
        onReady={onReady}
      />

      {/* виньетка поверх карты */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          boxShadow: "inset 0 0 180px 40px rgba(8,6,4,0.75)",
        }}
      />

      <Sidebar
        locations={filtered}
        total={visible.length}
        query={query}
        onQuery={setQuery}
        activeKinds={activeKinds}
        onToggleKind={toggleKind}
        onResetFilters={() => {
          setQuery("");
          setActiveKinds(new Set());
        }}
        selectedId={selectedId}
        onSelect={selectAndFly}
        gm={gm}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {selected && (
        <LocationPanel
          location={selected}
          gm={gm}
          onClose={() => setSelectedId(null)}
        />
      )}

      {gm && pickActive && (
        <div className="pointer-events-none absolute top-4 right-0 left-0 z-40 flex justify-center px-4">
          <CoordPicker
            point={pickedPoint}
            onClose={() => {
              setPickActive(false);
              setPickedPoint(null);
            }}
          />
        </div>
      )}

      {!(isNarrow && selected) && (
      <Toolbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(true)}
        showLabels={showLabels}
        onToggleLabels={() => setShowLabels((v) => !v)}
        rulerActive={rulerActive}
        onToggleRuler={() => {
          setRulerActive((v) => {
            if (v) setRulerPoints([]);
            return !v;
          });
        }}
        onReset={() => handle?.reset()}
        onZoom={(delta) => handle?.zoomBy(delta)}
        gm={gm}
        rulerPoints={rulerPoints}
        onClearRuler={() => setRulerPoints([])}
        onUndoRuler={() => setRulerPoints((prev) => prev.slice(0, -1))}
        pixelsPerLeague={pixelsPerLeague}
        onPixelsPerLeague={setPixelsPerLeague}
        pickActive={pickActive}
        onTogglePick={() => {
          setPickActive((v) => {
            if (v) setPickedPoint(null);
            else setRulerActive(false);
            return !v;
          });
        }}
      />
      )}
    </main>
  );
}

export default Index;
