const DEFAULT_CLIENT_ID = "client-steven";

function createId() {
  return `client-${Math.random().toString(36).slice(2, 10)}`;
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

export function createSeedClient({ seedWorkouts = [], seedWeeklyTargets = [], trainerNotesExample = "" } = {}) {
  return {
    id: DEFAULT_CLIENT_ID,
    name: "Steven Meyer",
    notes: "Seed client with the restored workout archive.",
    usesSeedData: true,
    workouts: seedWorkouts,
    weeklyTargets: seedWeeklyTargets,
    importedWorkouts: [],
    editedWorkoutRecords: [],
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
    weeklyTargets: Array.isArray(client?.weeklyTargets) ? client.weeklyTargets : Array.isArray(fallback?.weeklyTargets) ? fallback.weeklyTargets : [],
    importedWorkouts: Array.isArray(client?.importedWorkouts) ? client.importedWorkouts : [],
    editedWorkoutRecords: normalizeWorkoutEditRecords(client?.editedWorkoutRecords),
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
