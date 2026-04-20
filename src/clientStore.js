const DEFAULT_CLIENT_ID = "client-steven";
const DEFAULT_CALORIE_THRESHOLD_PERCENT = 40;
const DEFAULT_ZONE_THRESHOLD_PERCENT = 90;

function createId() {
  return `client-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeWeeklyTarget(target = {}, index = 0) {
  const rawZoneMinutes = target?.zoneMinutes ?? target?.intensity ?? null;
  const zoneMinutes = rawZoneMinutes === null || rawZoneMinutes === undefined || rawZoneMinutes === "" ? null : Number(rawZoneMinutes);
  const rawCalorieThresholdPercent = target?.calorieThresholdPercent ?? null;
  const calorieThresholdPercent = rawCalorieThresholdPercent === null || rawCalorieThresholdPercent === undefined || rawCalorieThresholdPercent === ""
    ? DEFAULT_CALORIE_THRESHOLD_PERCENT
    : Number(rawCalorieThresholdPercent);
  const rawZonePercent = target?.zonePercent ?? null;
  const zonePercent = rawZonePercent === null || rawZonePercent === undefined || rawZonePercent === ""
    ? zoneMinutes === null ? null : DEFAULT_ZONE_THRESHOLD_PERCENT
    : Number(rawZonePercent);
  const calories = Number(target?.calories ?? target?.calorieGoal ?? 0) || 0;
  const reportedCalories = target?.reportedCalories === null || target?.reportedCalories === undefined || target?.reportedCalories === ""
    ? calories
    : Number(target.reportedCalories);
  const reportedZoneMinutes = target?.reportedZoneMinutes === null || target?.reportedZoneMinutes === undefined || target?.reportedZoneMinutes === ""
    ? null
    : Number(target.reportedZoneMinutes);
  const unsupervisedCalories = target?.unsupervisedCalories === null || target?.unsupervisedCalories === undefined || target?.unsupervisedCalories === ""
    ? 0
    : Number(target.unsupervisedCalories);
  const unsupervisedZoneMinutes = target?.unsupervisedZoneMinutes === null || target?.unsupervisedZoneMinutes === undefined || target?.unsupervisedZoneMinutes === ""
    ? 0
    : Number(target.unsupervisedZoneMinutes);
  const unsupervisedNotes = String(target?.unsupervisedNotes ?? "");

  return {
    week: Number(target?.week ?? index + 1),
    calories,
    reportedCalories,
    calorieThresholdPercent,
    zoneMinutes,
    zonePercent,
    reportedZoneMinutes,
    unsupervisedCalories,
    unsupervisedZoneMinutes,
    unsupervisedNotes,
  };
}

function normalizeWeeklyTargets(targets = []) {
  if (!Array.isArray(targets)) return [];
  return targets.map((target, index) => normalizeWeeklyTarget(target, index));
}

function normalizeWorkoutEditRecords(records = []) {
  if (!Array.isArray(records)) return [];
  return records
    .filter((record) => record?.originalKey && record?.workout)
    .map((record) => ({
      originalKey: String(record.originalKey),
      workout: record.workout,
    }));
}

function normalizeImpactGroupKeys(groupKeys) {
  if (!Array.isArray(groupKeys)) return [];
  const seen = new Set();
  const normalized = [];
  groupKeys.forEach((groupKey) => {
    const value = String(groupKey ?? "").trim();
    if (!value || !value.includes("::")) return;
    if (seen.has(value)) return;
    seen.add(value);
    normalized.push(value);
  });
  return normalized;
}

function normalizeExerciseImpactOverrides(overrides = {}) {
  if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) return {};
  const normalized = {};
  Object.entries(overrides).forEach(([movementKey, impact]) => {
    const normalizedMovementKey = String(movementKey ?? "").trim();
    if (!normalizedMovementKey) return;
    const primary = normalizeImpactGroupKeys(impact?.primary);
    const secondary = normalizeImpactGroupKeys(impact?.secondary).filter((groupKey) => !primary.includes(groupKey));
    if (primary.length === 0 && secondary.length === 0) return;
    normalized[normalizedMovementKey] = {
      primary,
      secondary,
    };
  });
  return normalized;
}

export function createSeedClient({ seedWorkouts = [], seedWeeklyTargets = [], trainerNotesExample = "" } = {}) {
  return {
    id: DEFAULT_CLIENT_ID,
    name: "Steven Meyer",
    notes: "Seed client with the restored workout archive.",
    usesSeedData: true,
    workouts: seedWorkouts,
    weeklyTargets: normalizeWeeklyTargets(seedWeeklyTargets),
    importedWorkouts: [],
    editedWorkoutRecords: [],
    exerciseImpactOverrides: {},
    trainerNotes: trainerNotesExample,
  };
}

export function createBlankClient(name) {
  return {
    id: createId(),
    name: String(name || "New client").trim() || "New client",
    notes: "",
    usesSeedData: false,
    workouts: [],
    weeklyTargets: [],
    importedWorkouts: [],
    editedWorkoutRecords: [],
    exerciseImpactOverrides: {},
    trainerNotes: "",
  };
}

export function normalizeClientRecord(client, fallback) {
  return {
    id: String(client?.id || fallback?.id || createId()),
    name: String(client?.name || fallback?.name || "Untitled client").trim() || "Untitled client",
    notes: String(client?.notes || "").trim(),
    usesSeedData: Boolean(client?.usesSeedData ?? fallback?.usesSeedData),
    workouts: Array.isArray(client?.workouts) ? client.workouts : Array.isArray(fallback?.workouts) ? fallback.workouts : [],
    weeklyTargets: normalizeWeeklyTargets(Array.isArray(client?.weeklyTargets) ? client.weeklyTargets : Array.isArray(fallback?.weeklyTargets) ? fallback.weeklyTargets : []),
    importedWorkouts: Array.isArray(client?.importedWorkouts) ? client.importedWorkouts : [],
    editedWorkoutRecords: normalizeWorkoutEditRecords(client?.editedWorkoutRecords),
    exerciseImpactOverrides: normalizeExerciseImpactOverrides(client?.exerciseImpactOverrides ?? fallback?.exerciseImpactOverrides),
    trainerNotes: String(client?.trainerNotes ?? fallback?.trainerNotes ?? ""),
  };
}

export function normalizeClientStore(storedClients, seedClient) {
  const fallbackSeed = normalizeClientRecord(seedClient, seedClient);
  if (!Array.isArray(storedClients) || storedClients.length === 0) {
    return [fallbackSeed];
  }

  const normalized = storedClients.map((client) => {
    const fallback = client?.id === fallbackSeed.id ? fallbackSeed : undefined;
    return normalizeClientRecord(client, fallback);
  });

  if (!normalized.some((client) => client.id === fallbackSeed.id)) {
    normalized.unshift(fallbackSeed);
  }

  return normalized;
}

export function updateClientRecord(clients, clientId, updater) {
  return clients.map((client) => client.id === clientId ? updater(client) : client);
}
