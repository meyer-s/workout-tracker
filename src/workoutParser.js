const CURRENT_YEAR = 2026;

export const taxonomyRules = [
  { family: "Core", group: "Core", keywords: ["plank", "crunch", "deadbug", "hollow", "sit up", "russian twist", "twister", "leg lift", "l sit", "log roll", "reverse crunch", "toe touch", "flutter", "v up", "tornado", "stir the pot", "evil wheel", "bike crunch", "supermen", "knee tuck", "starfish", "core hackey", "swiss ball roll out"] },
  { family: "Arms", group: "Forearms & Grip", keywords: ["forearm", "pronation", "suitcase carr", "bottoms up hold", "palof"] },
  { family: "Arms", group: "Biceps", keywords: ["curl", "preacher", "zotman", "spider", "gunslinger", "swimmer"] },
  { family: "Arms", group: "Triceps", keywords: ["french press", "kickback", "diamond p up", "close grip press"] },
  { family: "Upper Body", group: "Back", keywords: ["row", "lat pull", "pull down", "pull over", "face pull", "dead hang", "high row"] },
  { family: "Upper Body", group: "Shoulders", keywords: ["thruster", "halo", "z press", "waiter press", "oh press", "iron cross", "scaption", "saxon", "shins shoulders sky", "at raises"] },
  { family: "Upper Body", group: "Chest", keywords: ["press", "fly", "p up", "push up", "decline", "dragon press", "chest press"] },
  { family: "Lower Body", group: "Glutes", keywords: ["glute", "hip thrust", "donkey", "clamshell", "jane fonda", "bridge", "kick back", "kickbacks"] },
  { family: "Lower Body", group: "Hamstrings", keywords: ["rdl", "hamstring", "good morning", "rev hyper", "back extension"] },
  { family: "Lower Body", group: "Quads", keywords: ["squat", "thruster", "stand up", "pistol", "cossack", "lunge", "split squat", "bulgarian", "step up", "vargas", "spanish squat", "wall squat"] },
  { family: "Lower Body", group: "Calves", keywords: ["calve", "calf", "donkey raise", "bounce"] },
  { family: "Athletic", group: "Power & Skill", keywords: ["clean", "snatch", "jerk", "swing", "sdhp"] },
];

export function normalizeText(value = "") {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function groupBy(items, getKey) {
  return items.reduce((map, item) => {
    const key = getKey(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
    return map;
  }, new Map());
}

export function formatDateLabel(dateText) {
  return new Date(`${CURRENT_YEAR}/${dateText}`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function parseLoadValue(loadText) {
  if (!loadText) return null;
  const poundsMatch = loadText.match(/(\d+(?:\.\d+)?)\s*lb[s]?/i);
  if (poundsMatch) return Number(poundsMatch[1]);
  const levelMatch = loadText.match(/lvl\s*(\d+(?:\.\d+)?)/i);
  return levelMatch ? Number(levelMatch[1]) : null;
}

export function parseMeasurement(token) {
  const trimmed = token.trim();
  const timeMatch = trimmed.match(/^(\d+):(\d+)$/);
  if (timeMatch) return { label: trimmed, type: "time", value: Number(timeMatch[1]) * 60 + Number(timeMatch[2]) };
  const numberMatch = trimmed.match(/-?\d+(?:\.\d+)?/);
  if (numberMatch) return { label: trimmed, type: "count", value: Number(numberMatch[0]) };
  return null;
}

export function parseSetFragment(fragment, index) {
  const label = fragment.trim();
  if (!label || label === "—") return null;
  const parts = label.split("/").map((part) => part.trim()).filter(Boolean);
  const measurements = parts.map(parseMeasurement).filter(Boolean);
  return {
    id: `${label}-${index}`,
    label,
    measurements,
    total: measurements.reduce((sum, measurement) => sum + measurement.value, 0),
    totalCount: measurements.filter((measurement) => measurement.type === "count").reduce((sum, measurement) => sum + measurement.value, 0),
    totalTime: measurements.filter((measurement) => measurement.type === "time").reduce((sum, measurement) => sum + measurement.value, 0),
  };
}

export function parseVariation(rawVariation, index) {
  const variationText = rawVariation.trim();
  if (!variationText) return null;
  const atIndex = variationText.indexOf("@");
  if (atIndex === -1) {
    return {
      id: `${variationText}-${index}`,
      raw: variationText,
      loadText: variationText,
      loadValue: parseLoadValue(variationText),
      sets: [],
      setCount: 0,
      volumeScore: 0,
      countVolume: 0,
      timeVolume: 0,
      bestSet: 0,
      bestCountSet: 0,
      bestTimeSet: 0,
      summary: variationText,
    };
  }
  const loadText = variationText.slice(0, atIndex).trim() || "Mixed / bodyweight";
  const repText = variationText.slice(atIndex + 1).trim();
  const sets = repText.split(",").map((part, setIndex) => parseSetFragment(part, setIndex)).filter(Boolean);
  return {
    id: `${loadText}-${index}`,
    raw: variationText,
    loadText,
    loadValue: parseLoadValue(loadText),
    sets,
    setCount: sets.length,
    volumeScore: sets.reduce((sum, set) => sum + set.total, 0),
    countVolume: sets.reduce((sum, set) => sum + set.totalCount, 0),
    timeVolume: sets.reduce((sum, set) => sum + set.totalTime, 0),
    bestSet: sets.reduce((max, set) => Math.max(max, set.total), 0),
    bestCountSet: sets.reduce((max, set) => Math.max(max, set.totalCount), 0),
    bestTimeSet: sets.reduce((max, set) => Math.max(max, set.totalTime), 0),
    summary: `${loadText} · ${sets.length ? sets.map((set) => set.label).join(", ") : repText || "notes"}`,
  };
}

export function inferTaxonomy(exerciseName) {
  const normalized = normalizeText(exerciseName);
  const match = taxonomyRules.find((rule) => rule.keywords.some((keyword) => normalized.includes(normalizeText(keyword))));
  return match ?? { family: "Mixed", group: "Accessory / Skill" };
}

export function deriveMovementPattern(exerciseName, taxonomy) {
  const normalized = normalizeText(exerciseName);
  const patternMatchers = [
    ["Curl", /(curl|preacher|zotman|spider|gunslinger|swimmer)/],
    ["Press", /(press|p up|push up|fly|flies)/],
    ["Row", /(row|high row|pull down|lat pull|face pull|pull over)/],
    ["Squat", /(squat|thruster|stand up|pistol|cossack)/],
    ["Lunge", /(lunge|split squat|bulgarian|step up)/],
    ["Hip Thrust", /(hip thrust|bridge|glute medius hip thrust)/],
    ["Hinge", /(rdl|good morning|hamstring curl|rev hyper|back extension)/],
    ["Calf Raise", /(calve|calf|bounce|donkey raise)/],
    ["Shoulder Raise", /(scaption|iron cross|at raises|halo|waiter press|z press|oh press)/],
    ["Core Hold", /(plank|hollow hold|l sit|side plank|log roll|stir the pot)/],
    ["Crunch / Sit Up", /(crunch|sit up|v ups|v up|toe touch|russian twist|deadbug|leg lift|knee tuck|reverse crunch)/],
    ["Carry / Grip", /(carry|bottoms up hold|pronation|forearm|palof)/],
    ["Olympic / Power", /(clean|snatch|jerk|swing|sdhp)/],
  ];
  const match = patternMatchers.find(([, matcher]) => matcher.test(normalized));
  if (match) return { key: `${taxonomy.group}::${normalizeText(match[0])}`, label: match[0] };
  const compactLabel = exerciseName.replace(/\([^)]*\)/g, " ").replace(/\b(uni|bi|alt|banded|db|kb|bb|swiss ball|machine|flat|incline|decline|reverse grip|close grip|wide grip|hr|bw|iso)\b/gi, " ").replace(/\s+/g, " ").trim();
  return { key: `${taxonomy.group}::${normalizeText(compactLabel || exerciseName)}`, label: compactLabel || exerciseName };
}

export function stripBulletPrefix(value) {
  return value.replace(/^[-*•]\s+/, "").replace(/^\d+[.)]\s+/, "").trim();
}

export function normalizeDateInput(value) {
  const trimmed = String(value).trim();
  const numericMatch = trimmed.match(/(\d{1,2})[\/\-.](\d{1,2})/);
  if (numericMatch) return `${Number(numericMatch[1])}/${Number(numericMatch[2])}`;
  const monthNames = {
    jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4, may: 5,
    jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9, september: 9,
    oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
  };
  const monthMatch = trimmed.match(/\b([A-Za-z]{3,9})\s+(\d{1,2})\b/);
  if (monthMatch) {
    const monthNumber = monthNames[monthMatch[1].toLowerCase()];
    if (monthNumber) return `${monthNumber}/${Number(monthMatch[2])}`;
  }
  return "";
}

export function isLikelyCircuitHeader(value) {
  const normalized = normalizeText(value.replace(/:$/, ""));
  return value.endsWith(":") || /^(?:block|circuit|section|series|pairing|tri set|giant set|warm up|warmup|cool down|cooldown|core|super set|superset|drop set|accessory|bonus|finisher|strength|mobility|conditioning|upper|lower)/.test(normalized);
}

export function extractDateFromLine(value) {
  return normalizeDateInput(value);
}

export function looksLikeExerciseDetail(value) {
  return /(\d+(?:\.\d+)?\s*lb[s]?|\bbw\b|bodyweight|lvl\s*\d+|@|\d+\s*[xX]\s*\d+|\d+:\d+|\d+\/\d+|red|blue|green|purple|black|yellow|orange|pink|reps?|seconds?|secs?|mins?|minutes?)/i.test(value);
}

export function isLikelyExerciseLine(value) {
  const trimmed = stripBulletPrefix(value.trim());
  if (!trimmed) return false;
  if (isLikelyCircuitHeader(trimmed)) return false;
  if (/^(date|title|notes?)\s*:/i.test(trimmed)) return false;
  if (/^(workout|session|day)\s*#?\s*\d+/i.test(trimmed)) return false;
  if (looksLikeExerciseDetail(trimmed)) return true;
  return /[A-Za-z]/.test(trimmed) && trimmed.split(/\s+/).length >= 2 && trimmed.length <= 140;
}

export function isLikelyContinuationLine(value) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (isLikelyCircuitHeader(trimmed) || /^(date|title|workout|session|day)\b/i.test(trimmed)) return false;
  return /^[|/+,&()]/.test(trimmed) || /^(notes?|focus|cue|tempo|rest|alt\b|alternate\b|same\b|then\b)/i.test(trimmed) || (!isLikelyExerciseLine(trimmed) && trimmed.length <= 120);
}

export function deriveWorkoutTitle(circuits) {
  const names = circuits
    .flatMap((circuit) => circuit.items)
    .slice(0, 2)
    .map((item) => stripBulletPrefix(item).split(/—|:|@/)[0].trim())
    .filter(Boolean);
  return names.length > 0 ? names.join(" + ") : "Trainer intake workout";
}

export function normalizeTrainerExerciseLine(value) {
  let normalized = stripBulletPrefix(value)
    .replace(/[–−]/g, "—")
    .replace(/\s*[|;•]\s*/g, " | ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized.includes("—") && normalized.includes(":")) {
    const [left, ...rest] = normalized.split(":");
    const right = rest.join(":").trim();
    if (right && looksLikeExerciseDetail(right)) normalized = `${left.trim()} — ${right}`;
  }

  normalized = normalized.replace(/\bbody ?weight\b/gi, "BW");
  normalized = normalized.replace(/(\b(?:\d+(?:\.\d+)?\s*lb[s]?|BW|lvl\s*\d+|Red|Blue|Green|Purple|Black|Yellow|Orange|Pink(?:\/[A-Za-z]+)?)\b[^|@;]*?)\s+[xX]\s*(?=\d)/g, "$1 @ ");
  normalized = normalized.replace(/(\b(?:\d+(?:\.\d+)?\s*lb[s]?|BW|lvl\s*\d+|Red|Blue|Green|Purple|Black|Yellow|Orange|Pink(?:\/[A-Za-z]+)?)\b)\s+(\d+)\s*[xX]\s*(\d+(?:\/\d+)?)/gi, (_, load, sets, reps) => {
    const safeSetCount = Math.min(Number(sets), 8);
    return `${load} @ ${Array.from({ length: safeSetCount }, () => reps).join(", ")}`;
  });
  normalized = normalized.replace(/\b(\d+)\s*[xX]\s*(\d+(?:\/\d+)?)\b/g, (_, sets, reps) => {
    const safeSetCount = Math.min(Number(sets), 8);
    return `BW @ ${Array.from({ length: safeSetCount }, () => reps).join(", ")}`;
  });
  normalized = normalized.replace(/\b(reps?|rep)\b/gi, "").replace(/\s+/g, " ").trim();
  return normalized;
}

export function extractWorkoutMetadataFromLine(value) {
  const line = value.trim();
  const date = extractDateFromLine(line);
  const workoutMatch = line.match(/^(?:workout|session|day)\s*#?\s*(\d+)\b/i) || line.match(/\b(?:workout|session|day)\s*#?\s*(\d+)\b/i);
  const titleMatch = line.match(/^title\s*:?\s*(.+)$/i);
  let inferredTitle = "";

  if (titleMatch) {
    inferredTitle = titleMatch[1].trim();
  } else if (/^(?:workout|session|day)\s*#?\s*\d+/i.test(line)) {
    inferredTitle = line
      .replace(/^(?:workout|session|day)\s*#?\s*\d+\b/i, "")
      .replace(/[·\-|]/g, " ")
      .replace(/\b\d{1,2}[\/\-.]\d{1,2}\b/, "")
      .trim();
  }

  return {
    workoutNumber: workoutMatch ? Number(workoutMatch[1]) : null,
    date,
    title: inferredTitle,
    hasMetadata: Boolean(workoutMatch || date || titleMatch),
  };
}

export function parseExerciseItem(item, context) {
  const normalizedItem = normalizeTrainerExerciseLine(item);
  const separatorCandidates = [normalizedItem.indexOf("—"), normalizedItem.indexOf(":"), normalizedItem.indexOf("@")] .filter((index) => index >= 0);
  const firstLoadMatch = normalizedItem.match(/\b(?:\d+(?:\.\d+)?\s*lb[s]?|bw|bodyweight|lvl\s*\d+|red|blue|green|purple|black|yellow|orange|pink)\b/i);
  const firstSetNotationMatch = normalizedItem.match(/\b\d+\s*[xX]\s*\d+(?:\/\d+)?\b/);
  if (firstLoadMatch?.index !== undefined) separatorCandidates.push(firstLoadMatch.index);
  if (firstSetNotationMatch?.index !== undefined) separatorCandidates.push(firstSetNotationMatch.index);
  const endOfName = separatorCandidates.length > 0 ? Math.min(...separatorCandidates) : normalizedItem.length;
  const hasDash = normalizedItem.includes("—");
  const hasColon = normalizedItem.includes(":") && endOfName === normalizedItem.indexOf(":");
  const hasAt = normalizedItem.includes("@");
  const name = normalizedItem.slice(0, endOfName).trim();
  const detailText = hasDash
    ? normalizedItem.slice(normalizedItem.indexOf("—") + 1).trim()
    : hasColon
      ? normalizedItem.slice(normalizedItem.indexOf(":") + 1).trim()
      : hasAt
        ? normalizedItem.slice(normalizedItem.indexOf("@") + 1).trim()
        : endOfName < normalizedItem.length
          ? normalizedItem.slice(endOfName).trim()
          : "";
  const variationSource = detailText ? detailText.split("|") : [normalizedItem];
  const variations = variationSource.map((part, index) => parseVariation(part, index)).filter(Boolean);
  const taxonomy = inferTaxonomy(name);
  const movementPattern = deriveMovementPattern(name, taxonomy);
  return {
    id: `${context.workoutNumber}-${context.date}-${context.circuitIndex}-${context.itemIndex}`,
    raw: normalizedItem,
    name,
    movementLabel: movementPattern.label,
    movementKey: movementPattern.key,
    taxonomy,
    variations,
    totalSets: variations.reduce((sum, variation) => sum + variation.setCount, 0),
    totalVolume: variations.reduce((sum, variation) => sum + variation.volumeScore, 0),
    totalCountVolume: variations.reduce((sum, variation) => sum + variation.countVolume, 0),
    totalTimeVolume: variations.reduce((sum, variation) => sum + variation.timeVolume, 0),
    bestCountSet: variations.reduce((max, variation) => Math.max(max, variation.bestCountSet ?? 0), 0),
    bestTimeSet: variations.reduce((max, variation) => Math.max(max, variation.bestTimeSet ?? 0), 0),
    bestLoad: variations.reduce((max, variation) => variation.loadValue === null ? max : max === null ? variation.loadValue : Math.max(max, variation.loadValue), null),
    performanceScore: variations.reduce((sum, variation) => sum + variation.volumeScore, 0) + variations.reduce((sum, variation) => sum + variation.setCount, 0) * 4,
    searchText: normalizeText([name, movementPattern.label, taxonomy.family, taxonomy.group, detailText, context.circuitName, context.workoutTitle].join(" ")),
    ...context,
  };
}

export function sortWorkouts(workoutList) {
  return [...workoutList].sort((a, b) => new Date(`${CURRENT_YEAR}/${a.date}`).getTime() - new Date(`${CURRENT_YEAR}/${b.date}`).getTime());
}

export function sanitizeWorkout(workout, fallbackNumber) {
  return {
    workout: Number(workout.workout) || fallbackNumber,
    date: String(workout.date ?? "").trim(),
    title: String(workout.title ?? "Untitled workout").trim(),
    circuits: (Array.isArray(workout.circuits) ? workout.circuits : []).map((circuit, index) => ({
      name: String(circuit.name ?? `Circuit ${index + 1}`).trim(),
      items: (Array.isArray(circuit.items) ? circuit.items : []).map((item) => String(item).trim()).filter(Boolean),
    })).filter((circuit) => circuit.name && circuit.items.length > 0),
  };
}

export function dedupeWorkouts(workoutList) {
  const byKey = new Map();
  workoutList.forEach((workout, index) => {
    const sanitized = sanitizeWorkout(workout, index + 1);
    byKey.set(`${sanitized.workout}-${sanitized.date}`, sanitized);
  });
  return sortWorkouts([...byKey.values()]);
}

export function parseTrainerWorkoutBlock(blockText, fallbackWorkoutNumber) {
  const rawLines = blockText.split(/\r?\n/).map((line) => line.trimEnd());
  const mergedLines = [];
  rawLines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    if (mergedLines.length > 0 && isLikelyContinuationLine(trimmed)) {
      mergedLines[mergedLines.length - 1] = `${mergedLines[mergedLines.length - 1]} ${stripBulletPrefix(trimmed)}`.replace(/\s+/g, " ").trim();
      return;
    }
    mergedLines.push(trimmed);
  });
  const lines = mergedLines;
  let workoutNumber = fallbackWorkoutNumber;
  let date = "";
  let title = "";
  const circuits = [];
  let currentCircuit = null;
  const ensureCircuit = (name = "General") => {
    if (!currentCircuit || currentCircuit.name !== name) {
      currentCircuit = { name, items: [] };
      circuits.push(currentCircuit);
    }
  };
  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    const metadata = extractWorkoutMetadataFromLine(line);
    if (metadata.workoutNumber !== null) workoutNumber = metadata.workoutNumber;
    if (metadata.date && !date) date = metadata.date;
    if (metadata.title && !title) title = metadata.title;
    if (metadata.hasMetadata && /^(?:workout|session|day|title|date)\b/i.test(line)) return;

    const explicitDateMatch = line.match(/^Date\s*:?\s*(.+)$/i);
    if (explicitDateMatch) {
      date = normalizeDateInput(explicitDateMatch[1]);
      return;
    }
    const explicitTitleMatch = line.match(/^Title\s*:?\s*(.+)$/i);
    if (explicitTitleMatch) {
      title = explicitTitleMatch[1].trim();
      return;
    }
    if (isLikelyCircuitHeader(line)) {
      ensureCircuit(line.replace(/:$/, "").trim());
      return;
    }
    if (/^[-*•]\s+/.test(line) || /^\d+[.)]\s+/.test(line) || isLikelyExerciseLine(line)) {
      ensureCircuit();
      currentCircuit.items.push(normalizeTrainerExerciseLine(line));
      return;
    }
    if (!title) {
      title = line;
      return;
    }
    if (currentCircuit?.items.length) {
      currentCircuit.items[currentCircuit.items.length - 1] = `${currentCircuit.items[currentCircuit.items.length - 1]} ${line}`.replace(/\s+/g, " ").trim();
      return;
    }
    ensureCircuit();
    currentCircuit.items.push(normalizeTrainerExerciseLine(line));
  });
  const derivedTitle = title || deriveWorkoutTitle(circuits);
  const workout = sanitizeWorkout({ workout: workoutNumber, date, title: derivedTitle, circuits }, fallbackWorkoutNumber);
  const errors = [];
  if (!workout.date) errors.push("Missing date. Use `4/12` or `Date: 4/12`.");
  if (workout.circuits.length === 0) errors.push("Missing circuit blocks and exercise lines.");
  return { workout, errors };
}

export function parseTrainerWorkoutNotes(rawText, existingWorkouts = []) {
  const trimmed = rawText.trim();
  if (!trimmed) return { workouts: [], errors: ["Paste a workout note block first."] };
  const existingMax = existingWorkouts.reduce((max, workout) => Math.max(max, Number(workout.workout) || 0), 0);
  const normalized = trimmed.replace(/\r\n/g, "\n");
  const headerMatches = [...normalized.matchAll(/^(?:workout|session|day)\s*#?\s*\d+/gim)];
  const blocks = [];
  if (headerMatches.length > 1) {
    headerMatches.forEach((match, index) => {
      const start = match.index ?? 0;
      const end = index + 1 < headerMatches.length ? headerMatches[index + 1].index ?? normalized.length : normalized.length;
      blocks.push(normalized.slice(start, end).trim());
    });
  } else {
    blocks.push(normalized);
  }
  const errors = [];
  const parsedWorkouts = blocks.map((block, index) => {
    const result = parseTrainerWorkoutBlock(block, existingMax + index + 1);
    if (result.errors.length > 0) errors.push(`Workout block ${index + 1}: ${result.errors.join(" ")}`);
    return result.workout;
  });
  return { workouts: dedupeWorkouts(parsedWorkouts), errors };
}
