import { dedupeWorkouts, formatDateLabel, groupBy, normalizeText, parseExerciseItem } from "./workoutParser";

function getBestCountDelta(currentRecord, previousRecord) {
  if (!previousRecord) return null;
  if ((currentRecord.bestCountSet ?? 0) <= 0 && (previousRecord.bestCountSet ?? 0) <= 0) return null;
  return (currentRecord.bestCountSet ?? 0) - (previousRecord.bestCountSet ?? 0);
}

function getBestTimeDelta(currentRecord, previousRecord) {
  if (!previousRecord) return null;
  if ((currentRecord.bestTimeSet ?? 0) <= 0 && (previousRecord.bestTimeSet ?? 0) <= 0) return null;
  return (currentRecord.bestTimeSet ?? 0) - (previousRecord.bestTimeSet ?? 0);
}

function getGrowthScore({ loadDelta, bestCountDelta, bestTimeDelta, setDelta, sessionCount }) {
  return (loadDelta ?? 0) * 5 + (bestCountDelta ?? 0) * 3 + (bestTimeDelta ?? 0) / 5 + setDelta * 2 + Math.max(sessionCount - 1, 0) * 3;
}

export function buildDashboardData(workoutList) {
  const structuredWorkouts = dedupeWorkouts(workoutList).map((workout, workoutIndex) => {
    const circuits = workout.circuits.map((circuit, circuitIndex) => {
      const exercises = circuit.items.map((item, itemIndex) => parseExerciseItem(item, {
        workoutNumber: workout.workout,
        workoutTitle: workout.title,
        date: workout.date,
        dateLabel: formatDateLabel(workout.date),
        timestamp: new Date(`2026/${workout.date}`).getTime(),
        workoutIndex,
        circuitName: circuit.name,
        circuitIndex,
        itemIndex,
      }));
      return {
        ...circuit,
        exercises,
        totalSets: exercises.reduce((sum, exercise) => sum + exercise.totalSets, 0),
        totalVolume: exercises.reduce((sum, exercise) => sum + exercise.totalVolume, 0),
      };
    });
    return {
      ...workout,
      workoutIndex,
      dateLabel: formatDateLabel(workout.date),
      timestamp: new Date(`2026/${workout.date}`).getTime(),
      circuits,
      exercises: circuits.flatMap((circuit) => circuit.exercises),
      totalSets: circuits.reduce((sum, circuit) => sum + circuit.totalSets, 0),
      totalVolume: circuits.reduce((sum, circuit) => sum + circuit.totalVolume, 0),
      searchText: normalizeText([workout.title, workout.date, ...circuits.flatMap((circuit) => [circuit.name, ...circuit.exercises.map((exercise) => `${exercise.name} ${exercise.movementLabel} ${exercise.taxonomy.group}`)])].join(" ")),
    };
  });

  const exerciseRecords = structuredWorkouts.flatMap((workout) => workout.exercises);
  const exerciseHistories = Array.from(groupBy(exerciseRecords, (exercise) => exercise.movementKey).values())
    .map((records) => {
      const sortedRecords = [...records].sort((left, right) => left.timestamp - right.timestamp);
      const first = sortedRecords[0];
      const latest = sortedRecords[sortedRecords.length - 1];
      const loadDelta = first.bestLoad !== null && latest.bestLoad !== null ? latest.bestLoad - first.bestLoad : null;
      const bestCountDelta = getBestCountDelta(latest, first);
      const bestTimeDelta = getBestTimeDelta(latest, first);
      const setDelta = latest.totalSets - first.totalSets;
      return {
        canonicalName: first.movementKey,
        name: first.movementLabel,
        exampleExerciseName: first.name,
        taxonomy: first.taxonomy,
        sessionCount: sortedRecords.length,
        totalSets: sortedRecords.reduce((sum, record) => sum + record.totalSets, 0),
        totalVolume: sortedRecords.reduce((sum, record) => sum + record.totalVolume, 0),
        bestLoad: sortedRecords.reduce((max, record) => record.bestLoad === null ? max : max === null ? record.bestLoad : Math.max(max, record.bestLoad), null),
        first,
        latest,
        loadDelta,
        bestCountDelta,
        bestTimeDelta,
        setDelta,
        growthScore: getGrowthScore({ loadDelta, bestCountDelta, bestTimeDelta, setDelta, sessionCount: sortedRecords.length }),
        searchText: normalizeText([first.movementLabel, first.name, first.taxonomy.family, first.taxonomy.group, ...sortedRecords.map((record) => `${record.workoutTitle} ${record.date} ${record.raw}`)].join(" ")),
        records: sortedRecords,
      };
    })
    .sort((left, right) => right.growthScore - left.growthScore || right.sessionCount - left.sessionCount);

  exerciseHistories.forEach((history) => {
    history.records.forEach((record, index) => {
      const previousRecord = index > 0 ? history.records[index - 1] : null;
      record.trend = {
        previousDateLabel: previousRecord?.dateLabel ?? null,
        repDelta: getBestCountDelta(record, previousRecord),
        timeDelta: getBestTimeDelta(record, previousRecord),
        loadDelta: previousRecord && record.bestLoad !== null && previousRecord.bestLoad !== null ? record.bestLoad - previousRecord.bestLoad : null,
        hasRepData: (record.bestCountSet ?? 0) > 0 || (previousRecord?.bestCountSet ?? 0) > 0,
        hasTimeData: (record.bestTimeSet ?? 0) > 0 || (previousRecord?.bestTimeSet ?? 0) > 0,
      };
    });
  });

  const taxonomySummary = Array.from(groupBy(exerciseHistories, (history) => `${history.taxonomy.family}::${history.taxonomy.group}`).values())
    .map((histories) => ({
      family: histories[0].taxonomy.family,
      group: histories[0].taxonomy.group,
      exerciseCount: histories.length,
      sessionCount: histories.reduce((sum, history) => sum + history.sessionCount, 0),
      totalSets: histories.reduce((sum, history) => sum + history.totalSets, 0),
      totalVolume: histories.reduce((sum, history) => sum + history.totalVolume, 0),
      topExercises: [...histories].sort((left, right) => right.sessionCount - left.sessionCount).slice(0, 6),
    }))
    .sort((left, right) => right.totalSets - left.totalSets);

  const exerciseIndex = [...exerciseHistories]
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((history) => ({
      name: history.name,
      exampleExerciseName: history.exampleExerciseName,
      family: history.taxonomy.family,
      group: history.taxonomy.group,
      sessionCount: history.sessionCount,
    }));

  const repeatedExercises = exerciseHistories.filter((history) => history.sessionCount > 1);
  return {
    structuredWorkouts,
    exerciseHistories,
    taxonomySummary,
    exerciseIndex,
    repeatedExercises,
    topGrowthLeaders: repeatedExercises.slice(0, 8),
    totalParsedSets: exerciseHistories.reduce((sum, history) => sum + history.totalSets, 0),
    dominantGroup: taxonomySummary[0] ?? null,
  };
}

export function formatLoad(loadValue) {
  return loadValue === null ? "BW / mixed" : `${loadValue} lb`;
}

export function formatDelta(value, suffix = "") {
  if (value === null) return "n/a";
  if (value === 0) return `0${suffix}`;
  return `${value > 0 ? "+" : ""}${value}${suffix}`;
}
