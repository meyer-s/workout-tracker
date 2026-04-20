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
  if (!svgRaw || typeof svgRaw !== "string") return [];
  const pathMatches = [...svgRaw.matchAll(/<path\s+[^>]*d="([^"]+)"[^>]*>/g)];
  return pathMatches.map((match, index) => ({
    index,
    tag: match[0],
    d: match[1] ?? "",
  }));
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

function stripColorAttributes(pathTag) {
  return pathTag
    .replace(/\sfill="[^"]*"/gi, "")
    .replace(/\sstroke="[^"]*"/gi, "")
    .replace(/\sstroke-width="[^"]*"/gi, "")
    .replace(/\sfill-opacity="[^"]*"/gi, "")
    .replace(/\sstroke-opacity="[^"]*"/gi, "");
}

function applyPathStyle(pathTag, style) {
  const cleanedTag = stripColorAttributes(pathTag).replace(/\s*\/?>$/, "");
  const fill = style.fill ? ` fill="${style.fill}"` : "";
  const stroke = style.stroke ? ` stroke="${style.stroke}"` : "";
  const strokeWidth = style.strokeWidth !== undefined && style.strokeWidth !== null ? ` stroke-width="${style.strokeWidth}"` : "";
  const suffix = pathTag.endsWith("/>") ? " />" : ">";
  return `${cleanedTag}${fill}${stroke}${strokeWidth}${suffix}`;
}

function modifySelectedSvgPaths(pathTags, selectedPathIndexes, buildStyle) {
  if (!Array.isArray(pathTags) || pathTags.length === 0) return [];
  const selectedIndexSet = new Set(selectedPathIndexes);
  return pathTags.map((pathTag, index) => {
    if (!selectedIndexSet.has(index)) return pathTag;
    return applyPathStyle(pathTag, buildStyle(index));
  });
}

function applyPathStylesToSvg(svgRaw, pathTags) {
  if (!svgRaw || typeof svgRaw !== "string") return "";
  let pathIndex = 0;
  const withoutXmlHeader = svgRaw.replace(/^\s*<\?xml[^>]*>\s*/i, "");
  return withoutXmlHeader.replace(/<path\s+[^>]*d="[^"]+"[^>]*>/g, () => {
    const nextTag = pathTags[pathIndex];
    pathIndex += 1;
    return nextTag ?? "";
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
  const parsedSvgPaths = useMemo(() => parseSvgPaths(muscleMaleSvgRaw), []);

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
  const familyPathMap = useMemo(() => buildFamilyPathMap(parsedSvgPaths), [parsedSvgPaths]);

  const peakSets = useMemo(() => {
    const values = bodyFamilies.map((family) => effectiveFamilyTotals[family] ?? 0);
    return values.length > 0 ? Math.max(...values, 0) : 0;
  }, [effectiveFamilyTotals]);

  const recoloredSvgMarkup = useMemo(() => {
    const basePathTags = parsedSvgPaths.map((path) => applyPathStyle(path.tag, {
      fill: withAlpha("#2f3a34", 0.95),
      stroke: withAlpha("#5f6e61", 0.55),
      strokeWidth: 0.7,
    }));

    const familyTintedPathTags = bodyFamilies.reduce((updatedPathTags, family) => {
      const selectedIndexes = familyPathMap[family] ?? [];
      const sets = effectiveFamilyTotals[family] ?? 0;
      const intensity = peakSets > 0 ? sets / peakSets : 0;
      if (selectedIndexes.length === 0 || intensity <= 0) return updatedPathTags;
      const baseColor = familyColors[family]?.color ?? theme.accentStrong;
      return modifySelectedSvgPaths(updatedPathTags, selectedIndexes, () => ({
        fill: withAlpha(baseColor, Math.max(0.45, 0.28 + intensity * 0.72)),
        stroke: withAlpha(baseColor, Math.min(0.95, 0.45 + intensity * 0.5)),
        strokeWidth: 0.95,
      }));
    }, basePathTags);

    return applyPathStylesToSvg(muscleMaleSvgRaw, familyTintedPathTags);
  }, [effectiveFamilyTotals, familyColors, familyPathMap, parsedSvgPaths, peakSets, theme.accentStrong]);

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
