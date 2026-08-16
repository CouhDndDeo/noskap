import { useEffect, useRef } from "react";
import Map from "ol/Map";
import View from "ol/View";
import Projection from "ol/proj/Projection";
import TileGrid from "ol/tilegrid/TileGrid";
import TileImage from "ol/source/TileImage";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import LineString from "ol/geom/LineString";
import { Style, Icon, Text, Fill, Stroke, Circle as CircleStyle } from "ol/style";
import { getCenter } from "ol/extent";
import type { Coordinate } from "ol/coordinate";
import type { Location } from "../data/locations";
import { MAP_META } from "../data/locations";
import { pinDataUrl } from "../lib/pins";
import { assetUrl } from "../lib/asset";

export type MapHandle = {
  flyTo: (x: number, y: number) => void;
  reset: () => void;
  zoomBy: (delta: number) => void;
};

type Props = {
  locations: Location[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  showLabels: boolean;
  rulerActive: boolean;
  rulerPoints: Coordinate[];
  onRulerClick: (coord: Coordinate) => void;
  /** Режим пипетки координат (только для мастера) */
  pickActive: boolean;
  onPick: (coord: Coordinate) => void;
  /** Ширина перекрывающих карту панелей, чтобы центрировать в свободной области */
  insets: { left: number; right: number; bottom: number };
  onReady: (handle: MapHandle) => void;
};

const { width, height, tileSize, maxZoom } = MAP_META;
const EXTENT: [number, number, number, number] = [0, 0, width, height];
const resolutions = Array.from(
  { length: maxZoom + 1 },
  (_, z) => 2 ** (maxZoom - z),
);
const cols = (z: number) => Math.ceil(width / 2 ** (maxZoom - z) / tileSize);
const rows = (z: number) => Math.ceil(height / 2 ** (maxZoom - z) / tileSize);

function MapView({
  locations,
  selectedId,
  onSelect,
  showLabels,
  rulerActive,
  rulerPoints,
  onRulerClick,
  pickActive,
  onPick,
  insets,
  onReady,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const pinSourceRef = useRef<VectorSource | null>(null);
  const rulerSourceRef = useRef<VectorSource | null>(null);
  const handlersRef = useRef({
    onSelect,
    onRulerClick,
    rulerActive,
    pickActive,
    onPick,
  });
  const insetsRef = useRef(insets);

  handlersRef.current = { onSelect, onRulerClick, rulerActive, pickActive, onPick };
  insetsRef.current = insets;

  // --- init map once ---
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const projection = new Projection({
      code: "noskap",
      units: "pixels",
      extent: EXTENT,
    });

    const tileGrid = new TileGrid({
      extent: EXTENT,
      origin: [0, height],
      resolutions,
      tileSize,
    });

    const tileSource = new TileImage({
      projection,
      tileGrid,
      transition: 180,
      tileUrlFunction: (coord) => {
        const [z, x, y] = coord;
        if (z < 0 || z > maxZoom) return undefined;
        if (x < 0 || y < 0 || x >= cols(z) || y >= rows(z)) return undefined;
        return assetUrl(`/tiles/${z}/${x}/${y}.jpg`);
      },
    });

    const pinSource = new VectorSource();
    const rulerSource = new VectorSource();
    pinSourceRef.current = pinSource;
    rulerSourceRef.current = rulerSource;

    const map = new Map({
      target: containerRef.current,
      layers: [
        new TileLayer({ source: tileSource }),
        new VectorLayer({ source: pinSource, declutter: true }),
        new VectorLayer({ source: rulerSource }),
      ],
      controls: [],
      view: new View({
        projection,
        center: getCenter(EXTENT),
        resolution: 4,
        minResolution: 0.35,
        maxResolution: 4,
        extent: EXTENT,
        constrainOnlyCenter: true,
        smoothExtentConstraint: true,
      }),
    });

    const fitAll = (duration?: number) => {
      map.updateSize();
      const size = map.getSize();
      if (!size || size[0] === 0 || size[1] === 0) return false;
      const { left, right, bottom } = insetsRef.current;
      map.getView().fit(EXTENT, {
        padding: [32, right + 32, bottom + 96, left + 32],
        duration,
      });
      return true;
    };
    if (!fitAll()) {
      map.once("postrender", () => fitAll());
    }
    requestAnimationFrame(() => fitAll());

    map.on("singleclick", (evt) => {
      const {
        rulerActive: ruler,
        onRulerClick: rulerCb,
        onSelect: select,
        pickActive: pick,
        onPick: pickCb,
      } = handlersRef.current;
      if (pick) {
        pickCb(evt.coordinate);
        return;
      }
      if (ruler) {
        rulerCb(evt.coordinate);
        return;
      }
      const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f, {
        hitTolerance: 8,
      });
      const id = feature?.get("locationId");
      select(typeof id === "string" ? id : null);
    });

    map.on("pointermove", (evt) => {
      if (evt.dragging) return;
      const hit = map.hasFeatureAtPixel(evt.pixel, { hitTolerance: 8 });
      map.getTargetElement().style.cursor =
        handlersRef.current.rulerActive || handlersRef.current.pickActive
          ? "crosshair"
          : hit
            ? "pointer"
            : "grab";
    });

    mapRef.current = map;

    onReady({
      flyTo: (x, y) => {
        const view = map.getView();
        const resolution = Math.min(view.getResolution() ?? 2, 1.2);
        const { left, right, bottom } = insetsRef.current;
        // сдвигаем центр, чтобы точка встала в видимую часть карты
        const shiftX = ((left - right) / 2) * resolution;
        const shiftY = (bottom / 2) * resolution;
        // и подтягиваем к краям, чтобы под панелями не зияла пустота
        const size = map.getSize() ?? [0, 0];
        const visW = Math.max(1, size[0] - left - right) * resolution;
        const visH = Math.max(1, size[1] - bottom) * resolution;
        const clamp = (v: number, lo: number, hi: number) =>
          lo > hi ? (lo + hi) / 2 : Math.min(Math.max(v, lo), hi);
        const cx = visW < width ? clamp(x, visW / 2, width - visW / 2) : x;
        const cy = visH < height ? clamp(y, visH / 2, height - visH / 2) : y;
        view.animate({
          center: [cx - shiftX, cy - shiftY],
          resolution,
          duration: 520,
        });
      },
      reset: () => fitAll(420),
      zoomBy: (delta) => {
        const view = map.getView();
        const res = view.getResolution() ?? 2;
        view.animate({ resolution: res / 2 ** delta, duration: 220 });
      },
    });

    const onResize = () => map.updateSize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      map.setTarget(undefined);
      mapRef.current = null;
    };
  }, [onReady]);

  // --- pins ---
  useEffect(() => {
    const source = pinSourceRef.current;
    if (!source) return;
    source.clear();
    for (const loc of locations) {
      const feature = new Feature({ geometry: new Point([loc.x, loc.y]) });
      feature.set("locationId", loc.id);
      const selected = loc.id === selectedId;
      feature.setStyle(
        new Style({
          image: new Icon({
            src: pinDataUrl(loc.kind, selected, Boolean(loc.hidden)),
            anchor: [0.5, 1],
            scale: selected ? 0.7 : 0.58,
          }),
          text: showLabels
            ? new Text({
                text: loc.name,
                font: `${selected ? 15 : 13}px Forum, serif`,
                offsetY: 12,
                textBaseline: "top",
                fill: new Fill({ color: selected ? "#F3E3BC" : "#E9DDC1" }),
                stroke: new Stroke({ color: "rgba(10,8,5,0.92)", width: 3.5 }),
                padding: [2, 4, 2, 4],
              })
            : undefined,
          zIndex: selected ? 20 : 10,
        }),
      );
      source.addFeature(feature);
    }
  }, [locations, selectedId, showLabels]);

  // --- ruler geometry ---
  useEffect(() => {
    const source = rulerSourceRef.current;
    if (!source) return;
    source.clear();
    if (rulerPoints.length === 0) return;

    if (rulerPoints.length > 1) {
      const line = new Feature({ geometry: new LineString(rulerPoints) });
      line.setStyle([
        new Style({
          stroke: new Stroke({ color: "rgba(10,8,5,0.75)", width: 6 }),
        }),
        new Style({
          stroke: new Stroke({
            color: "#E8C06A",
            width: 2.2,
            lineDash: [10, 7],
          }),
        }),
      ]);
      source.addFeature(line);
    }

    rulerPoints.forEach((coord, i) => {
      const dot = new Feature({ geometry: new Point(coord) });
      dot.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 5,
            fill: new Fill({ color: "#E8C06A" }),
            stroke: new Stroke({ color: "#14110C", width: 2 }),
          }),
          text: new Text({
            text: String(i + 1),
            font: "11px Spectral, serif",
            offsetY: -14,
            fill: new Fill({ color: "#E9DDC1" }),
            stroke: new Stroke({ color: "rgba(10,8,5,0.9)", width: 3 }),
          }),
        }),
      );
      source.addFeature(dot);
    });
  }, [rulerPoints]);

  return <div ref={containerRef} className="absolute inset-0" />;
}

export default MapView;
