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

function parseSvgPaths(svgRaw) {
  if (!svgRaw || typeof svgRaw !== "string") {
    return {
      viewBox: `0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`,
      paths: [],
    };
  }

  if (typeof DOMParser !== "undefined") {
    const parsed = new DOMParser().parseFromString(svgRaw, "image/svg+xml");
    const svgNode = parsed.querySelector("svg");
    const viewBox = svgNode?.getAttribute("viewBox") || `0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`;
    const paths = Array.from(parsed.querySelectorAll("path")).map((pathNode, index) => ({
      index,
      d: pathNode.getAttribute("d") ?? "",
    }));
    return {
      viewBox,
      paths,
    };
  }

  const pathMatches = [...svgRaw.matchAll(/<path\s+[^>]*d="([^"]+)"[^>]*>/g)];
  return {
    viewBox: `0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`,
    paths: pathMatches.map((match, index) => ({ index, d: match[1] ?? "" })),
  };
}

function estimatePathBounds(pathData) {
  const values = (pathData.match(/-?\d*\.?\d+/g) ?? []).map((value) => Number(value)).filter((value) => Number.isFinite(value));
  if (values.length < 2) {
    return {
      minX: 0,
      maxX: VIEWBOX_WIDTH,
      minY: 0,
      maxY: VIEWBOX_HEIGHT,
      centerX: VIEWBOX_WIDTH / 2,
      centerY: VIEWBOX_HEIGHT / 2,
    };
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
    return {
      minX: 0,
      maxX: VIEWBOX_WIDTH,
      minY: 0,
      maxY: VIEWBOX_HEIGHT,
      centerX: VIEWBOX_WIDTH / 2,
      centerY: VIEWBOX_HEIGHT / 2,
    };
  }

  return {
    minX,
    maxX,
    minY,
    maxY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}

function resolveFamilyForPath(bounds) {
  if (bounds.centerY >= 240) return "Lower Body";
  if (bounds.centerY >= 170) {
    if (bounds.centerX >= 140 && bounds.centerX <= 245) return "Core";
    return "Arms";
  }
  if (bounds.centerY >= 95) {
    if (bounds.centerX <= 120 || bounds.centerX >= 265) return "Arms";
    return "Upper Body";
  }
  return "Upper Body";
}

function buildFamilyPathMap(paths) {
  const map = {
    "Upper Body": [],
    "Lower Body": [],
    Core: [],
    Arms: [],
  };

  paths.forEach((path) => {
    const family = resolveFamilyForPath(estimatePathBounds(path.d));
    map[family].push(path.index);
  });

  return map;
}

function modifySelectedSvgPaths(paths, selectedPathIndexes, buildStyle) {
  if (!Array.isArray(paths) || paths.length === 0) return [];
  const selectedIndexSet = new Set(selectedPathIndexes);
  return paths.map((path) => {
    if (!selectedIndexSet.has(path.index)) return path;
    return {
      ...path,
      ...buildStyle(path),
    };
  });
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
  const parsedSvg = useMemo(() => parseSvgPaths(muscleMaleSvgRaw), []);

  const options = useMemo(() => {
    return workouts.map((workout) => ({
      key: getWorkoutKey(workout),
      label: `Workout ${workout.workout} · ${workout.dateLabel}`,
    }));
  }, [workouts]);

  const [selectedWorkoutKey, setSelectedWorkoutKey] = useState("all");

  useEffect(() => {
    if (selectedWorkoutKey !== "all" && !options.some((option) => option.key === selectedWorkoutKey)) {
      setSelectedWorkoutKey("all");
    }
  }, [options, selectedWorkoutKey]);

  const selectedWorkouts = useMemo(() => {
    if (selectedWorkoutKey === "all") return workouts;
    return workouts.filter((workout) => getWorkoutKey(workout) === selectedWorkoutKey);
  }, [selectedWorkoutKey, workouts]);

  const familyTotals = useMemo(() => buildFamilySetTotals(selectedWorkouts), [selectedWorkouts]);
  const effectiveFamilyTotals = useMemo(() => getEffectiveFamilyTotals(familyTotals), [familyTotals]);
  const familyPathMap = useMemo(() => buildFamilyPathMap(parsedSvg.paths), [parsedSvg.paths]);

  const peakSets = useMemo(() => {
    const values = bodyFamilies.map((family) => effectiveFamilyTotals[family] ?? 0);
    return values.length > 0 ? Math.max(...values, 0) : 0;
  }, [effectiveFamilyTotals]);

  const recoloredPaths = useMemo(() => {
    const basePaths = parsedSvg.paths.map((path) => ({
      ...path,
      fill: withAlpha("#232b24", 0.95),
      stroke: withAlpha("#5f6e61", 0.35),
      strokeWidth: 0.8,
    }));

    return bodyFamilies.reduce((updatedPaths, family) => {
      const selectedIndexes = familyPathMap[family] ?? [];
      const sets = effectiveFamilyTotals[family] ?? 0;
      const intensity = peakSets > 0 ? sets / peakSets : 0;
      if (selectedIndexes.length === 0 || intensity <= 0) return updatedPaths;
      const baseColor = familyColors[family]?.color ?? theme.accentStrong;
      return modifySelectedSvgPaths(updatedPaths, selectedIndexes, () => ({
        fill: withAlpha(baseColor, Math.max(0.3, 0.2 + intensity * 0.78)),
        stroke: withAlpha(baseColor, Math.min(0.95, 0.35 + intensity * 0.6)),
        strokeWidth: 1.1,
      }));
    }, basePaths);
  }, [effectiveFamilyTotals, familyColors, familyPathMap, parsedSvg.paths, peakSets, theme.accentStrong]);

  const familyBreakdown = useMemo(() => {
    const presentFamilies = Object.keys(familyTotals);
    const orderedFamilies = [
      ...prioritizedFamilies.filter((family) => presentFamilies.includes(family)),
      ...presentFamilies.filter((family) => !prioritizedFamilies.includes(family)).sort((left, right) => left.localeCompare(right)),
    ];
    return orderedFamilies.map((family) => ({
      family,
      sets: familyTotals[family] ?? 0,
      color: familyColors[family]?.color ?? theme.accentStrong,
    }));
  }, [familyColors, familyTotals, theme.accentStrong]);

  const selectedLabel = selectedWorkoutKey === "all"
    ? "All workouts"
    : options.find((option) => option.key === selectedWorkoutKey)?.label ?? "Selected workout";

  if (workouts.length === 0) {
    return <div style={{ color: theme.textSoft }}>No workout data available for the muscle heatmap yet.</div>;
  }

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
        <svg viewBox={parsedSvg.viewBox} width="100%" role="img" aria-label={`Muscle heatmap for ${selectedLabel}`}>
          {recoloredPaths.map((path) => (
            <path key={`muscle-path-${path.index}`} d={path.d} fill={path.fill} stroke={path.stroke} strokeWidth={path.strokeWidth} />
          ))}
        </svg>
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
