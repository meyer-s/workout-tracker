import React from "react";
import { formatDelta, formatLoad } from "./workoutAnalytics";

export const theme = {
  background: "#edf1ea",
  backgroundAccent: "#e5ebe2",
  surface: "#f7f8f3",
  surfaceStrong: "#eef1ea",
  surfaceMuted: "#e8ece4",
  border: "#cfd7cc",
  borderStrong: "#bcc6b9",
  text: "#2f3a33",
  textSoft: "#5f6d63",
  textMuted: "#7b877e",
  accent: "#6e7f6f",
  accentStrong: "#566557",
  accentSoft: "#d8e0d2",
  shadow: "0 10px 30px rgba(70, 84, 72, 0.08)",
};

export const familyColors = {
  "Upper Body": { background: "#d8e1dc", color: "#4f6558", border: "#c1cec4" },
  "Lower Body": { background: "#dfe6d6", color: "#60714f", border: "#cbd5bf" },
  Arms: { background: "#eadfcd", color: "#86684c", border: "#d9cbb5" },
  Core: { background: "#ddd8e6", color: "#6a5f79", border: "#cac2d6" },
  Athletic: { background: "#e5d9d6", color: "#7a615a", border: "#d5c4bf" },
  Mixed: { background: "#e1e5de", color: "#687269", border: "#cfd6ce" },
};

function getTrendTone(delta) {
  if (delta === null) return { background: "#e6ebe4", color: "#67746b", border: "#cfd8cd", symbol: "•" };
  if (delta > 0) return { background: "#d9e4d7", color: "#567053", border: "#bcccb8", symbol: "▲" };
  if (delta < 0) return { background: "#e8ddda", color: "#7e645e", border: "#d5c5c0", symbol: "▼" };
  return { background: "#e6ebe4", color: "#67746b", border: "#cfd8cd", symbol: "•" };
}

function getTrendMessage(delta) {
  if (delta === null) return "No baseline";
  if (delta > 0) return "Stronger";
  if (delta < 0) return "Fatigued";
  return "Holding steady";
}

export function SectionCard({ title, subtitle = "", children }) {
  return (
    <section style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 20, boxShadow: theme.shadow }}>
      {title ? (
        <div style={{ padding: "18px 22px", borderBottom: `1px solid ${theme.border}` }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: theme.text }}>{title}</h2>
          {subtitle ? <p style={{ margin: "6px 0 0", color: theme.textSoft, fontSize: 13 }}>{subtitle}</p> : null}
        </div>
      ) : null}
      <div style={{ padding: 22 }}>{children}</div>
    </section>
  );
}

export function GroupBadge({ family, group }) {
  const tone = familyColors[family] ?? familyColors.Mixed;
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 999, padding: "6px 10px", background: tone.background, color: tone.color, border: `1px solid ${tone.border}`, fontSize: 12, fontWeight: 700 }}>{family} · {group}</span>;
}

export function MetricChip({ label, value }) {
  return (
    <div style={{ border: `1px solid ${theme.border}`, borderRadius: 14, padding: "8px 10px", minWidth: 112, background: theme.surfaceStrong }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", color: theme.textMuted, letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4, color: theme.text }}>{value}</div>
    </div>
  );
}

export function TrendPill({ label, delta, suffix = "", emptyLabel = "No baseline" }) {
  const tone = getTrendTone(delta);
  if (delta === null) {
    return <span style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 999, padding: "6px 10px", border: `1px solid ${tone.border}`, background: tone.background, color: tone.color, fontSize: 12, fontWeight: 700 }}><span>{label}</span><span>{emptyLabel}</span></span>;
  }
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 999, padding: "6px 10px", border: `1px solid ${tone.border}`, background: tone.background, color: tone.color, fontSize: 12, fontWeight: 700 }}><span>{tone.symbol}</span><span>{getTrendMessage(delta)}</span><span style={{ opacity: 0.8 }}>{label.toLowerCase()}</span><span>{`${delta > 0 ? "+" : ""}${delta}${suffix}`}</span></span>;
}

export function ExerciseHistoryCard({ history }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 16, display: "grid", gap: 12 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{history.name}</div>
          <div style={{ fontSize: 13, color: "#6b7280" }}>{history.exampleExerciseName}</div>
          <GroupBadge family={history.taxonomy.family} group={history.taxonomy.group} />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" }}>
          <MetricChip label="Sessions" value={history.sessionCount} />
          <MetricChip label="Best load" value={formatLoad(history.bestLoad)} />
          <MetricChip label="Set change" value={formatDelta(history.setDelta)} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        <div style={{ border: "1px solid #f3f4f6", borderRadius: 12, padding: 12, background: "#f9fafb" }}>
          <div style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase" }}>First logged</div>
          <div style={{ marginTop: 6, fontWeight: 600 }}>{history.first.dateLabel} · Workout {history.first.workoutNumber}</div>
          <div style={{ marginTop: 6, color: "#4b5563", fontSize: 14 }}>{history.first.variations.map((variation) => variation.summary).join(" • ")}</div>
        </div>
        <div style={{ border: "1px solid #f3f4f6", borderRadius: 12, padding: 12, background: "#f9fafb" }}>
          <div style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase" }}>Latest logged</div>
          <div style={{ marginTop: 6, fontWeight: 600 }}>{history.latest.dateLabel} · Workout {history.latest.workoutNumber}</div>
          <div style={{ marginTop: 6, color: "#4b5563", fontSize: 14 }}>{history.latest.variations.map((variation) => variation.summary).join(" • ")}</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {history.latest.trend?.hasRepData ? <TrendPill label="Reps" delta={history.latest.trend.repDelta} /> : history.latest.trend?.hasTimeData ? <TrendPill label="Time" delta={history.latest.trend.timeDelta} suffix="s" /> : <TrendPill label="Reps" delta={null} emptyLabel="No baseline" />}
        <TrendPill label="Load" delta={history.latest.trend?.loadDelta ?? null} suffix=" lb" />
      </div>
    </div>
  );
}

export const insightTones = {
  positive: { background: "#d9e4d7", border: "#bcccb8", accent: "#567053", text: "#3f5441" },
  warning: { background: "#e8ddda", border: "#d5c5c0", accent: "#7e645e", text: "#654f49" },
  neutral: { background: theme.surfaceStrong, border: theme.border, accent: theme.accentStrong, text: theme.textSoft },
};

export function InsightStatCard({ label, value, subtitle, tone = "neutral" }) {
  const palette = insightTones[tone] ?? insightTones.neutral;
  return (
    <div style={{ background: palette.background, border: `1px solid ${palette.border}`, borderRadius: 18, padding: 18, boxShadow: theme.shadow, display: "grid", gap: 8 }}>
      <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, color: palette.accent }}>{label}</div>
      <div style={{ fontSize: 27, fontWeight: 700, color: theme.text }}>{value}</div>
      <div style={{ fontSize: 13, color: palette.text, lineHeight: 1.5 }}>{subtitle}</div>
    </div>
  );
}

export function InsightCalloutCard({ title, body, tone = "neutral" }) {
  const palette = insightTones[tone] ?? insightTones.neutral;
  return (
    <div style={{ border: `1px solid ${palette.border}`, borderRadius: 16, padding: 16, background: palette.background, display: "grid", gap: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: palette.accent, textTransform: "uppercase", letterSpacing: 0.4 }}>{title}</div>
      <div style={{ fontSize: 14, color: theme.text, lineHeight: 1.6 }}>{body}</div>
    </div>
  );
}

export function DistributionBar({ label, detail, percent, color }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 700, color: theme.text }}>{label}</div>
          <div style={{ fontSize: 13, color: theme.textSoft }}>{detail}</div>
        </div>
        <div style={{ fontWeight: 700, color: theme.text }}>{percent}%</div>
      </div>
      <div style={{ width: "100%", height: 10, borderRadius: 999, background: theme.surfaceMuted, overflow: "hidden", border: `1px solid ${theme.border}` }}>
        <div style={{ width: `${Math.max(6, percent)}%`, height: "100%", background: color, borderRadius: 999 }} />
      </div>
    </div>
  );
}

export function ConfidenceBadge({ level, score }) {
  const tone = level === "High" ? insightTones.positive : level === "Medium" ? insightTones.neutral : insightTones.warning;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 999, padding: "7px 11px", border: `1px solid ${tone.border}`, background: tone.background, color: tone.accent, fontSize: 12, fontWeight: 700 }}>
      <span>{level} confidence</span>
      <span style={{ opacity: 0.72 }}>{score}%</span>
    </span>
  );
}
