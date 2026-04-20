import React, { useEffect, useMemo, useState } from "react";
import muscleMaleSvgUrl from "../assets/muscle-male.svg";

const VIEWBOX_WIDTH = 383.37;
const VIEWBOX_HEIGHT = 355.79;

const hotspotConfig = [
  { id: "upper-center", family: "Upper Body", cx: 191.7, cy: 112, r: 46, label: "Upper body" },
  { id: "upper-left", family: "Upper Body", cx: 152, cy: 122, r: 36, label: "Upper body" },
  { id: "upper-right", family: "Upper Body", cx: 231, cy: 122, r: 36, label: "Upper body" },
  { id: "arms-left", family: "Arms", cx: 109, cy: 142, r: 30, label: "Arms" },
  { id: "arms-right", family: "Arms", cx: 274, cy: 142, r: 30, label: "Arms" },
  { id: "core", family: "Core", cx: 191.7, cy: 178, r: 36, label: "Core" },
  { id: "athletic", family: "Athletic", cx: 191.7, cy: 226, r: 42, label: "Athletic" },
  { id: "lower-left", family: "Lower Body", cx: 162, cy: 272, r: 46, label: "Lower body" },
  { id: "lower-right", family: "Lower Body", cx: 222, cy: 272, r: 46, label: "Lower body" },
  { id: "mixed", family: "Mixed", cx: 191.7, cy: 188, r: 92, label: "Mixed" },
];

const prioritizedFamilies = ["Upper Body", "Lower Body", "Core", "Arms", "Athletic", "Mixed"];

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
  const peakSets = useMemo(() => {
    const values = Object.values(familyTotals);
    return values.length > 0 ? Math.max(...values, 0) : 0;
  }, [familyTotals]);

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
        <div style={{ color: theme.textSoft, fontSize: 13 }}>Highlight distribution by set count for each movement family (secondary groups contribute 0.5x).</div>
        <label style={{ display: "grid", gap: 4, fontSize: 12, color: theme.textMuted }}>
          Heatmap scope
          <select value={selectedWorkoutKey} onChange={(event) => setSelectedWorkoutKey(event.target.value)} style={{ border: `1px solid ${theme.border}`, background: theme.surface, color: theme.text, borderRadius: 10, padding: "8px 10px", minWidth: isMobile ? 180 : 230 }}>
            <option value="all">All workouts</option>
            {options.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
          </select>
        </label>
      </div>

      <div style={{ border: `1px solid ${theme.border}`, borderRadius: 18, background: theme.surfaceStrong, padding: isMobile ? 10 : 14 }}>
        <svg viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`} width="100%" role="img" aria-label={`Muscle heatmap for ${selectedLabel}`}>
          <image href={muscleMaleSvgUrl} x="0" y="0" width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} preserveAspectRatio="xMidYMid meet" />
          {hotspotConfig.map((hotspot) => {
            const sets = familyTotals[hotspot.family] ?? 0;
            const intensity = peakSets > 0 ? sets / peakSets : 0;
            const baseColor = familyColors[hotspot.family]?.color ?? theme.accentStrong;
            const fill = withAlpha(baseColor, Math.max(0.05, intensity * 0.68));
            return <circle key={hotspot.id} cx={hotspot.cx} cy={hotspot.cy} r={hotspot.r} fill={fill} stroke={withAlpha(baseColor, Math.min(0.9, 0.25 + intensity * 0.65))} strokeWidth={1.5} />;
          })}
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
