const CURRENT_YEAR = 2026;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

function toTimestamp(dateValue) {
  if (!dateValue) return null;
  const timestamp = new Date(`${CURRENT_YEAR}/${dateValue}`).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function sortByTimestamp(items, selector = (item) => item.timestamp) {
  return [...items].sort((left, right) => (selector(left) ?? 0) - (selector(right) ?? 0));
}

function sum(items, selector) {
  return items.reduce((total, item) => total + selector(item), 0);
}

function roundPercent(value) {
  return Number.isFinite(value) ? Math.round(value) : 0;
}

function percentageChange(currentValue, previousValue) {
  if (!previousValue) return null;
  return roundPercent(((currentValue - previousValue) / previousValue) * 100);
}

function formatDays(days) {
  if (days <= 0) return "today";
  if (days === 1) return "1 day";
  if (days < 7) return `${days} days`;
  const weeks = Math.round(days / 7);
  return `${weeks} week${weeks === 1 ? "" : "s"}`;
}

function getTopGroupsFromExercises(exercises, limit = 3) {
  const grouped = new Map();
  exercises.forEach((exercise) => {
    const key = `${exercise.taxonomy.family}::${exercise.taxonomy.group}`;
    const current = grouped.get(key) ?? {
      family: exercise.taxonomy.family,
      group: exercise.taxonomy.group,
      totalSets: 0,
      exerciseCount: 0,
    };
    current.totalSets += exercise.totalSets;
    current.exerciseCount += 1;
    grouped.set(key, current);
  });
  return [...grouped.values()].sort((left, right) => right.totalSets - left.totalSets || right.exerciseCount - left.exerciseCount).slice(0, limit);
}

function buildGroupActivity(exerciseHistories) {
  const grouped = new Map();
  exerciseHistories.forEach((history) => {
    const key = `${history.taxonomy.family}::${history.taxonomy.group}`;
    const latestTimestamp = history.latest?.timestamp ?? toTimestamp(history.latest?.date);
    const current = grouped.get(key) ?? {
      key,
      family: history.taxonomy.family,
      group: history.taxonomy.group,
      exerciseCount: 0,
      sessionCount: 0,
      totalSets: 0,
      totalVolume: 0,
      latestTimestamp,
      latestDateLabel: history.latest?.dateLabel ?? history.latest?.date ?? "",
    };
    current.exerciseCount += 1;
    current.sessionCount += history.sessionCount;
    current.totalSets += history.totalSets;
    current.totalVolume += history.totalVolume;
    if ((latestTimestamp ?? 0) > (current.latestTimestamp ?? 0)) {
      current.latestTimestamp = latestTimestamp;
      current.latestDateLabel = history.latest?.dateLabel ?? history.latest?.date ?? current.latestDateLabel;
    }
    grouped.set(key, current);
  });
  return [...grouped.values()].sort((left, right) => right.totalSets - left.totalSets);
}

function buildFamilyDistribution(groupActivity) {
  const totalSets = sum(groupActivity, (group) => group.totalSets);
  const grouped = new Map();
  groupActivity.forEach((group) => {
    const current = grouped.get(group.family) ?? { family: group.family, totalSets: 0, sessionCount: 0, groupCount: 0 };
    current.totalSets += group.totalSets;
    current.sessionCount += group.sessionCount;
    current.groupCount += 1;
    grouped.set(group.family, current);
  });
  return [...grouped.values()]
    .map((family) => ({
      ...family,
      share: totalSets > 0 ? roundPercent((family.totalSets / totalSets) * 100) : 0,
    }))
    .sort((left, right) => right.totalSets - left.totalSets);
}

function getLoadTone(value) {
  if (value === null) return "neutral";
  if (value > 0) return "positive";
  if (value < 0) return "warning";
  return "neutral";
}

export function buildOverviewInsights(dashboardData, weeklyTargets) {
  const { structuredWorkouts, repeatedExercises, exerciseHistories } = dashboardData;
  const orderedWorkouts = sortByTimestamp(structuredWorkouts);
  const recentWorkouts = orderedWorkouts.slice(-3);
  const previousWorkouts = orderedWorkouts.slice(-6, -3);
  const recentSets = sum(recentWorkouts, (workout) => workout.totalSets);
  const previousSets = sum(previousWorkouts, (workout) => workout.totalSets);
  const loadDeltaPercent = percentageChange(recentSets, previousSets);
  const uniqueGroups = new Set(exerciseHistories.map((history) => `${history.taxonomy.family}::${history.taxonomy.group}`));
  const recentGroups = new Set(recentWorkouts.flatMap((workout) => workout.exercises.map((exercise) => `${exercise.taxonomy.family}::${exercise.taxonomy.group}`)));
  const coveragePercent = uniqueGroups.size > 0 ? roundPercent((recentGroups.size / uniqueGroups.size) * 100) : 0;
  const topGrowth = repeatedExercises[0] ?? null;
  const groupActivity = buildGroupActivity(exerciseHistories);
  const latestTimestamp = orderedWorkouts[orderedWorkouts.length - 1]?.timestamp ?? null;
  const staleGroups = latestTimestamp === null ? [] : [...groupActivity]
    .map((group) => ({
      ...group,
      daysSinceLatest: Math.max(0, Math.round(((latestTimestamp ?? 0) - (group.latestTimestamp ?? latestTimestamp)) / DAY_IN_MS)),
    }))
    .sort((left, right) => right.daysSinceLatest - left.daysSinceLatest || left.totalSets - right.totalSets);
  const groupNeedingAttention = staleGroups[0] ?? null;
  const latestWorkout = orderedWorkouts[orderedWorkouts.length - 1] ?? null;
  const latestFocus = latestWorkout ? getTopGroupsFromExercises(latestWorkout.exercises, 2).map((group) => group.group) : [];
  const caloriesWindow = weeklyTargets.slice(-4);
  const previousCaloriesWindow = weeklyTargets.slice(-8, -4);
  const recentCalories = sum(caloriesWindow, (week) => week.calories);
  const previousCalories = sum(previousCaloriesWindow, (week) => week.calories);
  const calorieDeltaPercent = percentageChange(recentCalories, previousCalories);

  const summaryCards = [
    {
      id: "load",
      label: "Current training load",
      value: `${recentSets} sets`,
      subtitle: previousWorkouts.length > 0
        ? `${loadDeltaPercent > 0 ? "+" : ""}${loadDeltaPercent ?? 0}% vs previous ${previousWorkouts.length} sessions`
        : "Need at least 6 sessions for a rolling comparison",
      tone: getLoadTone(loadDeltaPercent),
    },
    {
      id: "momentum",
      label: "Most improved movement",
      value: topGrowth ? topGrowth.name : "No repeat data yet",
      subtitle: topGrowth
        ? `${topGrowth.sessionCount} sessions · ${topGrowth.loadDelta !== null ? `${topGrowth.loadDelta > 0 ? "+" : ""}${topGrowth.loadDelta} lb load change` : `${topGrowth.volumeDelta > 0 ? "+" : ""}${topGrowth.volumeDelta} volume change`}`
        : "Repeat movements to unlock progression signals",
      tone: topGrowth && ((topGrowth.loadDelta ?? 0) > 0 || topGrowth.volumeDelta > 0) ? "positive" : "neutral",
    },
    {
      id: "coverage",
      label: "Recent movement coverage",
      value: `${recentGroups.size}/${uniqueGroups.size || 0}`,
      subtitle: `${coveragePercent}% of tracked groups touched in the latest ${recentWorkouts.length || 0} sessions`,
      tone: coveragePercent >= 60 ? "positive" : coveragePercent >= 40 ? "neutral" : "warning",
    },
    {
      id: "attention",
      label: "Worth revisiting",
      value: groupNeedingAttention ? groupNeedingAttention.group : "No gap detected",
      subtitle: groupNeedingAttention
        ? `Last showed up ${formatDays(groupNeedingAttention.daysSinceLatest)} ago on ${groupNeedingAttention.latestDateLabel}`
        : "No obvious gap in the current log yet",
      tone: groupNeedingAttention && groupNeedingAttention.daysSinceLatest >= 10 ? "warning" : "neutral",
    },
  ];

  const callouts = [
    {
      id: "load-shift",
      title: "What changed",
      body: previousWorkouts.length > 0
        ? `Your latest ${recentWorkouts.length} sessions total ${recentSets} parsed sets, ${loadDeltaPercent > 0 ? "up" : loadDeltaPercent < 0 ? "down" : "flat"} ${Math.abs(loadDeltaPercent ?? 0)}% versus the prior block. That is useful context for you and your trainer, not a verdict on the plan.`
        : "You have enough data to log sessions, but not yet enough history to compare rolling training load.",
      tone: getLoadTone(loadDeltaPercent),
    },
    {
      id: "momentum",
      title: "What is working",
      body: topGrowth
        ? `${topGrowth.name} stands out as a positive signal right now, with ${topGrowth.sessionCount} logged exposures and ${topGrowth.loadDelta !== null ? `${topGrowth.loadDelta > 0 ? `a +${topGrowth.loadDelta} lb change` : `${topGrowth.loadDelta} lb change`}` : `${topGrowth.volumeDelta > 0 ? `+${topGrowth.volumeDelta}` : topGrowth.volumeDelta} volume change`}. Consider it a conversation starter alongside your trainer's larger programming intent.`
        : "Once a few movements repeat across sessions, this panel can highlight patterns without trying to replace your trainer's bigger-cycle planning.",
      tone: topGrowth ? "positive" : "neutral",
    },
    {
      id: "focus-gap",
      title: "Where context may help",
      body: groupNeedingAttention
        ? `${groupNeedingAttention.group} has gone the longest without showing up again. ${latestFocus.length > 0 ? `Recent focus has been ${latestFocus.join(" and ")}, which may simply reflect the current block emphasis.` : "That is a gentle flag to review with the coach if it stays quiet for too long."}`
        : "No obvious gap yet. This view can stay supportive by surfacing patterns without second-guessing the current macro, meso, or microcycle focus.",
      tone: groupNeedingAttention ? "warning" : "neutral",
    },
  ];

  return {
    summaryCards,
    callouts,
    latestFocus,
    calorieTrend: {
      recentCalories,
      previousCalories,
      deltaPercent: calorieDeltaPercent,
      latestWindowLabel: caloriesWindow.length > 0 ? `Weeks ${caloriesWindow[0].week}-${caloriesWindow[caloriesWindow.length - 1].week}` : "",
    },
  };
}

export function buildTaxonomyInsights(dashboardData) {
  const { exerciseHistories } = dashboardData;
  const groupActivity = buildGroupActivity(exerciseHistories);
  const familyDistribution = buildFamilyDistribution(groupActivity);
  const totalSets = sum(groupActivity, (group) => group.totalSets);
  const latestTimestamp = Math.max(...groupActivity.map((group) => group.latestTimestamp ?? 0), 0);
  const neglectedGroups = latestTimestamp > 0
    ? [...groupActivity]
      .map((group) => ({
        ...group,
        share: totalSets > 0 ? roundPercent((group.totalSets / totalSets) * 100) : 0,
        daysSinceLatest: Math.max(0, Math.round((latestTimestamp - (group.latestTimestamp ?? latestTimestamp)) / DAY_IN_MS)),
      }))
      .sort((left, right) => right.daysSinceLatest - left.daysSinceLatest || left.totalSets - right.totalSets)
      .slice(0, 4)
    : [];
  const emphasizedGroups = [...groupActivity]
    .map((group) => ({
      ...group,
      share: totalSets > 0 ? roundPercent((group.totalSets / totalSets) * 100) : 0,
    }))
    .sort((left, right) => right.totalSets - left.totalSets)
    .slice(0, 5);
  const heaviestFamily = familyDistribution[0] ?? null;
  const lightestFamily = familyDistribution[familyDistribution.length - 1] ?? null;

  const balanceNotes = [
    heaviestFamily && lightestFamily
      ? {
        id: "family-imbalance",
        title: "Volume balance",
        body: `${heaviestFamily.family} carries ${heaviestFamily.share}% of your parsed sets, while ${lightestFamily.family} sits at ${lightestFamily.share}%. That is useful context, while still leaving room for the trainer's intended emphasis in this phase.`,
        tone: heaviestFamily.share - lightestFamily.share >= 18 ? "warning" : "neutral",
      }
      : null,
    neglectedGroups[0]
      ? {
        id: "stale-group",
        title: "Most neglected group",
        body: `${neglectedGroups[0].group} has been quiet for ${formatDays(neglectedGroups[0].daysSinceLatest)}. It still represents ${neglectedGroups[0].share}% of all logged sets, so it may be worth checking whether that quiet stretch is intentional for the current training block.`,
        tone: neglectedGroups[0].daysSinceLatest >= 10 ? "warning" : "neutral",
      }
      : null,
    emphasizedGroups[0]
      ? {
        id: "dominant-group",
        title: "Current emphasis",
        body: `${emphasizedGroups[0].group} is the biggest bucket right now with ${emphasizedGroups[0].totalSets} sets and ${emphasizedGroups[0].sessionCount} appearances. That gives a clear picture of what this slice of training is emphasizing, without claiming it should be otherwise.`,
        tone: "positive",
      }
      : null,
  ].filter(Boolean);

  return {
    familyDistribution,
    neglectedGroups,
    emphasizedGroups,
    balanceNotes,
  };
}

export function buildTrainerPreviewModel(previewStructuredWorkouts, existingWorkouts = []) {
  const existingByDate = new Set(existingWorkouts.map((workout) => workout.date));
  const existingByWorkoutNumber = new Set(existingWorkouts.map((workout) => workout.workout));
  const cards = previewStructuredWorkouts.map((workout) => {
    const exerciseCount = workout.exercises.length;
    const generalCircuitCount = workout.circuits.filter((circuit) => circuit.name === "General").length;
    const detailGaps = workout.exercises.filter((exercise) => exercise.totalSets === 0 || exercise.variations.every((variation) => !variation.summary || variation.summary.toLowerCase().includes("notes logged") || variation.summary.includes("—"))).length;
    const duplicateDate = existingByDate.has(workout.date);
    const duplicateWorkoutNumber = existingByWorkoutNumber.has(workout.workout);
    const topGroups = getTopGroupsFromExercises(workout.exercises, 3);
    const warnings = [];

    if (generalCircuitCount > 0) warnings.push(`${generalCircuitCount} section${generalCircuitCount === 1 ? " uses" : "s use"} a generic heading`);
    if (detailGaps > 0) warnings.push(`${detailGaps} exercise line${detailGaps === 1 ? " is" : "s are"} thin on set detail`);
    if (duplicateDate) warnings.push("Date already exists in the dashboard");
    if (duplicateWorkoutNumber) warnings.push("Workout number already exists in the dashboard");

    const score = Math.max(20, 100 - generalCircuitCount * 10 - detailGaps * 8 - (duplicateDate ? 18 : 0) - (duplicateWorkoutNumber ? 12 : 0));
    const confidence = score >= 80 ? "High" : score >= 55 ? "Medium" : "Low";

    return {
      id: `${workout.workout}-${workout.date}`,
      workout,
      exerciseCount,
      parsedSetCount: workout.totalSets,
      sectionCount: workout.circuits.length,
      topGroups,
      warnings,
      confidence,
      score,
      summary: `${exerciseCount} exercises across ${workout.circuits.length} section${workout.circuits.length === 1 ? "" : "s"}`,
    };
  });

  return {
    cards,
    totalWarnings: sum(cards, (card) => card.warnings.length),
    averageConfidenceScore: cards.length > 0 ? roundPercent(sum(cards, (card) => card.score) / cards.length) : 0,
  };
}