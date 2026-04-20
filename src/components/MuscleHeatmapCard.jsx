import React, { useEffect, useMemo, useState } from "react";
import muscleMaleSvgRaw from "../assets/muscle-male.svg?raw";

const VIEWBOX_WIDTH = 383.37;
const VIEWBOX_HEIGHT = 355.79;

const prioritizedFamilies = ["Upper Body", "Lower Body", "Core", "Arms", "Athletic", "Mixed"];
const bodyFamilies = ["Upper Body", "Lower Body", "Core", "Arms"];

function withAlpha(hexColor, alpha) {
  if (!hexColor || typeof hexColor !== "string") return `rgba(126, 143, 123, ${alpha})`;
  const hex = hexColor.replace("#", "");
  if (hex.length !== 6) return `rgba(126, 143, 123, ${alpha})`;
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function getWorkoutKey(workout) {
  return `${workout.workout}-${workout.date}`;
}

function parseSvgMeta(svgRaw) {
  const fallback = { viewBox: `0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`, paths: [] };
  if (!svgRaw || typeof svgRaw !== "string") return fallback;

  if (typeof DOMParser !== "undefined") {
    const doc = new DOMParser().parseFromString(svgRaw, "image/svg+xml");
    const svg = doc.querySelector("svg");
    if (!svg) return fallback;
    const paths = Array.from(svg.querySelectorAll("path")).map((pathNode, index) => ({
      index,
      d: pathNode.getAttribute("d") ?? "",
    }));
    return {
      viewBox: svg.getAttribute("viewBox") || fallback.viewBox,
      paths,
    };
  }

  const pathMatches = [...svgRaw.matchAll(/<path\s+[^>]*d="([^"]+)"[^>]*>/g)];
  return {
    viewBox: fallback.viewBox,
    paths: pathMatches.map((match, index) => ({ index, d: match[1] ?? "" })),
  };
}

function estimatePathBounds(pathData) {
  const values = (pathData.match(/-?\d*\.?\d+/g) ?? []).map((value) => Number(value)).filter((value) => Number.isFinite(value));
  if (values.length < 2) {
    return { centerX: VIEWBOX_WIDTH / 2, centerY: VIEWBOX_HEIGHT / 2 };
  }

  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (let index = 0; index < values.length - 1; index += 2) {
    const x = values[index];
    const y = values[index + 1];
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
    return { centerX: VIEWBOX_WIDTH / 2, centerY: VIEWBOX_HEIGHT / 2 };
  }

  return { centerX: (minX + maxX) / 2, centerY: (minY + maxY) / 2 };
}

function resolveFamilyForPath(bounds) {
  if (bounds.centerY >= 240) return "Lower Body";
  if (bounds.centerY >= 170) return bounds.centerX >= 140 && bounds.centerX <= 245 ? "Core" : "Arms";
  if (bounds.centerY >= 95) return bounds.centerX <= 120 || bounds.centerX >= 265 ? "Arms" : "Upper Body";
  return "Upper Body";
}

function buildFamilyPathMap(paths) {
  const map = { "Upper Body": [], "Lower Body": [], Core: [], Arms: [] };
  paths.forEach((path) => {
    const family = resolveFamilyForPath(estimatePathBounds(path.d));
    map[family].push(path.index);
  });
  return map;
}

function modifySelectedSvgPaths(pathNodes, selectedPathIndexes, buildStyle) {
  const selectedIndexSet = new Set(selectedPathIndexes);
  pathNodes.forEach((pathNode, index) => {
    if (!selectedIndexSet.has(index)) return;
    const style = buildStyle(index);
    if (style.fill) pathNode.setAttribute("fill", style.fill);
    if (style.stroke) pathNode.setAttribute("stroke", style.stroke);
    if (style.strokeWidth !== undefined && style.strokeWidth !== null) {
      pathNode.setAttribute("stroke-width", String(style.strokeWidth));
    }
  });
}

function buildStyledSvgMarkup(svgRaw, options) {
  if (!svgRaw || typeof svgRaw !== "string") return "";
  if (typeof DOMParser === "undefined" || typeof XMLSerializer === "undefined") return svgRaw;

  const doc = new DOMParser().parseFromString(svgRaw, "image/svg+xml");
  const svg = doc.querySelector("svg");
  if (!svg) return svgRaw;

  const pathNodes = Array.from(svg.querySelectorAll("path"));
  const baseFill = options?.baseFill;
  const baseStroke = options?.baseStroke;
  const baseStrokeWidth = options?.baseStrokeWidth;

  pathNodes.forEach((pathNode) => {
    if (baseFill) pathNode.setAttribute("fill", baseFill);
    if (baseStroke) pathNode.setAttribute("stroke", baseStroke);
    if (baseStrokeWidth !== undefined && baseStrokeWidth !== null) {
      pathNode.setAttribute("stroke-width", String(baseStrokeWidth));
    }
  });

  const stylesByFamily = options?.stylesByFamily ?? [];
  stylesByFamily.forEach((entry) => {
    modifySelectedSvgPaths(pathNodes, entry.pathIndexes, () => entry.style);
  });

  return new XMLSerializer().serializeToString(svg);
}

function getEffectiveFamilyTotals(familyTotals) {
  const upperBody = familyTotals["Upper Body"] ?? 0;
  const lowerBody = familyTotals["Lower Body"] ?? 0;
  const core = familyTotals.Core ?? 0;
  const arms = familyTotals.Arms ?? 0;
  const athletic = familyTotals.Athletic ?? 0;
  const mixed = familyTotals.Mixed ?? 0;

  return {
    "Upper Body": upperBody + athletic * 0.35 + mixed * 0.25,
    "Lower Body": lowerBody + athletic * 0.35 + mixed * 0.25,
    Core: core + athletic * 0.3 + mixed * 0.25,
    Arms: arms + mixed * 0.25,
    Athletic: athletic,
    Mixed: mixed,
  };
}

function buildFamilySetTotals(workouts) {
  return workouts.reduce((totals, workout) => {
    workout.exercises.forEach((exercise) => {
      const sets = Number.isFinite(exercise.totalSets) ? exercise.totalSets : 0;
      const primaryFamilies = (exercise.impactProfile?.primary ?? []).map((impact) => impact.family);
      const secondaryFamilies = (exercise.impactProfile?.secondary ?? []).map((impact) => impact.family);
      const resolvedPrimaryFamilies = primaryFamilies.length > 0 ? primaryFamilies : [exercise.taxonomy.family];

      resolvedPrimaryFamilies.forEach((family) => {
        totals[family] = (totals[family] ?? 0) + sets;
      });

      secondaryFamilies.forEach((family) => {
        totals[family] = (totals[family] ?? 0) + sets * 0.5;
      });
    });
    return totals;
  }, {});
}

export function MuscleHeatmapCard({ workouts, theme, familyColors, isMobile = false }) {
  const parsedSvgMeta = useMemo(() => parseSvgMeta(muscleMaleSvgRaw), []);
  const [selectedWorkoutKey, setSelectedWorkoutKey] = useState("all");

  const options = useMemo(() => workouts.map((workout) => ({ key: getWorkoutKey(workout), label: `Workout ${workout.workout} · ${workout.dateLabel}` })), [workouts]);

  useEffect(() => {
    if (selectedWorkoutKey !== "all" && !options.some((option) => option.key === selectedWorkoutKey)) {
      setSelectedWorkoutKey("all");
    }
  }, [options, selectedWorkoutKey]);

  const selectedWorkouts = useMemo(() => selectedWorkoutKey === "all" ? workouts : workouts.filter((workout) => getWorkoutKey(workout) === selectedWorkoutKey), [selectedWorkoutKey, workouts]);
  const familyTotals = useMemo(() => buildFamilySetTotals(selectedWorkouts), [selectedWorkouts]);
  const effectiveFamilyTotals = useMemo(() => getEffectiveFamilyTotals(familyTotals), [familyTotals]);
  const familyPathMap = useMemo(() => buildFamilyPathMap(parsedSvgMeta.paths), [parsedSvgMeta.paths]);

  const peakSets = useMemo(() => {
    const values = bodyFamilies.map((family) => effectiveFamilyTotals[family] ?? 0);
    return values.length > 0 ? Math.max(...values, 0) : 0;
  }, [effectiveFamilyTotals]);

  const recoloredSvgMarkup = useMemo(() => {
    const stylesByFamily = bodyFamilies.reduce((entries, family) => {
      const selectedIndexes = familyPathMap[family] ?? [];
      const sets = effectiveFamilyTotals[family] ?? 0;
      const intensity = peakSets > 0 ? sets / peakSets : 0;
      if (selectedIndexes.length === 0 || intensity <= 0) return entries;
      const baseColor = familyColors[family]?.color ?? theme.accentStrong;
      entries.push({
        pathIndexes: selectedIndexes,
        style: {
          fill: withAlpha(baseColor, Math.max(0.5, 0.35 + intensity * 0.6)),
          stroke: withAlpha(baseColor, Math.min(0.95, 0.5 + intensity * 0.45)),
          strokeWidth: 0.9,
        },
      });
      return entries;
    }, []);

    return buildStyledSvgMarkup(muscleMaleSvgRaw, {
      baseFill: withAlpha("#25312b", 0.95),
      baseStroke: withAlpha("#6a776d", 0.6),
      baseStrokeWidth: 0.7,
      stylesByFamily,
    });
  }, [effectiveFamilyTotals, familyColors, familyPathMap, peakSets, theme.accentStrong]);

  const familyBreakdown = useMemo(() => {
    const presentFamilies = Object.keys(familyTotals);
    const orderedFamilies = [
      ...prioritizedFamilies.filter((family) => presentFamilies.includes(family)),
      ...presentFamilies.filter((family) => !prioritizedFamilies.includes(family)).sort((left, right) => left.localeCompare(right)),
    ];
    return orderedFamilies.map((family) => ({ family, sets: familyTotals[family] ?? 0, color: familyColors[family]?.color ?? theme.accentStrong }));
  }, [familyColors, familyTotals, theme.accentStrong]);

  const selectedLabel = selectedWorkoutKey === "all" ? "All workouts" : options.find((option) => option.key === selectedWorkoutKey)?.label ?? "Selected workout";

  if (workouts.length === 0) return <div style={{ color: theme.textSoft }}>No workout data available for the muscle heatmap yet.</div>;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
        <div style={{ color: theme.textSoft, fontSize: 13 }}>Direct SVG path heatmap by movement family (secondary groups contribute 0.5x).</div>
        <label style={{ display: "grid", gap: 4, fontSize: 12, color: theme.textMuted }}>
          Heatmap scope
          <select value={selectedWorkoutKey} onChange={(event) => setSelectedWorkoutKey(event.target.value)} style={{ border: `1px solid ${theme.border}`, background: theme.surface, color: theme.text, borderRadius: 10, padding: "8px 10px", minWidth: isMobile ? 180 : 230 }}>
            <option value="all">All workouts</option>
            {options.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
          </select>
        </label>
      </div>

      <div style={{ border: `1px solid ${theme.border}`, borderRadius: 18, background: theme.surfaceStrong, padding: isMobile ? 10 : 14 }}>
        <div role="img" aria-label={`Muscle heatmap for ${selectedLabel}`} style={{ width: "100%", lineHeight: 0 }} dangerouslySetInnerHTML={{ __html: recoloredSvgMarkup }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? 140 : 160}px, 1fr))`, gap: 10 }}>
        {familyBreakdown.map((item) => {
          const intensity = peakSets > 0 ? item.sets / peakSets : 0;
          return (
            <div key={item.family} style={{ border: `1px solid ${theme.border}`, borderRadius: 12, padding: "10px 12px", background: theme.surface }}>
              <div style={{ fontSize: 13, color: theme.textSoft }}>{item.family}</div>
              <div style={{ marginTop: 4, fontSize: 18, fontWeight: 700, color: theme.text }}>{Number.isInteger(item.sets) ? item.sets : item.sets.toFixed(1)} sets</div>
              <div style={{ marginTop: 6, height: 6, borderRadius: 999, background: theme.surfaceMuted, overflow: "hidden" }}>
                <div style={{ width: `${Math.round(intensity * 100)}%`, height: "100%", borderRadius: 999, background: item.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
