import { sanitizeWorkout } from "./workoutParser";

export function getWorkoutKey(workout) {
  return `${workout.workout}-${workout.date}`;
}

export function createWorkoutDraft(workout) {
  return {
    workout: String(workout.workout ?? ""),
    date: workout.date ?? "",
    title: workout.title ?? "",
    circuits: (workout.circuits ?? []).map((circuit) => ({
      name: circuit.name ?? "",
      itemsText: (circuit.items ?? []).join("\n"),
    })),
  };
}

export function createEmptyCircuitDraft(index = 0) {
  return {
    name: `Circuit ${index + 1}`,
    itemsText: "",
  };
}

export function parseWorkoutDraft(draft, fallbackNumber) {
  const workout = sanitizeWorkout({
    workout: Number(draft.workout),
    date: draft.date,
    title: draft.title,
    circuits: (draft.circuits ?? []).map((circuit) => ({
      name: circuit.name,
      items: String(circuit.itemsText ?? "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
    })),
  }, fallbackNumber);

  const errors = [];
  if (!workout.date) errors.push("Date is required.");
  if (!workout.title) errors.push("Title is required.");
  if (workout.circuits.length === 0) errors.push("Add at least one circuit with exercise lines.");
  if (workout.circuits.some((circuit) => circuit.items.length === 0)) errors.push("Each circuit needs at least one exercise line.");

  return { workout, errors };
}
