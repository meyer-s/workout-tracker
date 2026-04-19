import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  buildOverviewInsights,
  buildTaxonomyInsights,
  buildTrainerPreviewModel,
} from "./dashboardViewModels";

const weeklyTargets = [
  { week: 1, calories: 4999, intensity: null },
  { week: 2, calories: 5205, intensity: null },
  { week: 3, calories: 5379, intensity: 4 },
  { week: 4, calories: 6367, intensity: 1 },
  { week: 5, calories: 8026, intensity: 18 },
  { week: 6, calories: 8061, intensity: 13 },
  { week: 7, calories: 8168, intensity: 19 },
  { week: 8, calories: 8257, intensity: 2 },
  { week: 9, calories: 6351, intensity: null },
  { week: 10, calories: 5687, intensity: 9 },
  { week: 11, calories: 5541, intensity: 0 },
  { week: 12, calories: 5290, intensity: 4 },
  { week: 13, calories: 4301, intensity: 5 },
];

const workouts = [
  {
    workout: 1,
    date: "2/26",
    title: "Foundation Strength + Core",
    circuits: [
      {
        name: "Strength Circuit #1 (2x)",
        items: [
          "Thrusters — 15lbs @ 20, 20 | 20lbs, 4 tiers @ 22 | 25lbs, 4 tiers @ 16",
          "Bent Over Rows — 20lbs @ 20/20, 20/20 | 25lbs @ 21/22, 20/20",
          "Palof Press — Red/Red @ 20/20, 20/20 | Blue/Blue @ 20/20, 20/20",
          "Glute Kick Backs — Black @ 20/20, 20/20 | 10lbs @ 20/20 | 15lbs @ 13/20",
        ],
      },
      {
        name: "Strength Circuit #2 (2x)",
        items: [
          "Gunslinger Curls — 35lbs @ 24/22",
          "Scapular P-ups — Bi BW @ 20 | Uni BW @ —",
          "Forearm Curls — 20lbs @ 20/20, 20/20 | 25lbs @ —",
          "Forearm Extensions — 8lbs @ 20/20, 20/20 | 10lbs @ —",
          "Suitcase Carries — 55lbs @ 36/30 | 60lbs @ —",
        ],
      },
      {
        name: "Abdominals & Core",
        items: ["Deadbugs @ 21", "Evil Wheel assessment @ —", "Plank @ 2:02"],
      },
    ],
  },
  {
    workout: 4,
    date: "3/9",
    title: "Machine Strength + Posterior Chain",
    circuits: [
      {
        name: "Strength Circuit #1 (2x)",
        items: [
          "Vargas Squats — BW & Blue @ 20 | BW & Black @ 20 | 15lbs & Black @ 20 | 20lbs & Black @ 20",
          "Hip Flexion — Green & 5 @ 20/20 | Green & 6 @ 20/20 | Blue & 5 @ 20/20 | Blue & 6 @ 20/20",
          "Machine Rows — 90lbs @ 20 | 105lbs @ 20 | 120lbs @ 20 | 125lbs @ 20",
          "Machine Chest Press — 90lbs @ 20 | 105lbs @ 20 | 120lbs @ 20 | 125lbs @ 20",
        ],
      },
      {
        name: "Strength Circuit #2 (2x)",
        items: [
          "Bent over Uni Rev DB Flies — 8lbs @ 20/20, 20/20 | 10lbs @ 20/20, 20/20",
          "Kickstand RDLs — 15lbs @ 20/20, 8/8 | 20lbs @ 20/20",
          "Concentration Curls — 20lbs @ 15/15 | 25lbs @ 15/10, 14/14",
          "Swiss Ham Bridge — Bi @ 20, 20",
        ],
      },
    ],
  },
  {
    workout: 5,
    date: "3/12",
    title: "Kettlebell Power + Core",
    circuits: [
      {
        name: "Strength Circuit #1 (2x)",
        items: [
          "SDHP — 35lbs @ 20, 20 | HR goals: 35 reps @ 78 HR / 25 reps @ 85 HR",
          "Halos — 35lbs @ 20, 16",
          "Glute Medius Hip Thrust — Green @ 20/20 | Blue @ 20/20 | Black @ 25/25",
          "KB Curls — 35lbs @ 25, 20",
        ],
      },
      {
        name: "Strength Circuit #2",
        items: [
          "Swing Technique — notes logged",
          "35lbs double arm @ 21 | single @ 20/21 | alt arm @ 50 (84 HR)",
          "Banded Flies — Red @ 25 | Blue @ 20 | Purple close @ 20 | Purple far @ 20",
          "French Press — 20lbs @ 20 | 25lbs @ 20 | 35lbs @ 20, 20",
          "DB Hamstring Curls — 8lbs @ 20/20 | 10lbs @ 20/20 | 15lbs @ 20/20",
        ],
      },
      {
        name: "Strength Super Set (2x)",
        items: ["Chest Support Rows — 25lbs @ 10", "Waiter Press — 35lbs @ 12/20"],
      },
      {
        name: "Abdominals & Core",
        items: [
          "Side Plank — BW @ 1:05/1:05",
          "Hollow Hold — hands over head @ 32",
          "Evil Wheel — Small @ 20 | Med @ 20 | Large @ —",
          "Endurance: 2-round circuit of Bike Crunches / Short Crunches / Plank Twisters",
        ],
      },
    ],
  },
  {
    workout: 6,
    date: "3/16",
    title: "Pressing Strength + Core Ramp",
    circuits: [
      {
        name: "Strength Circuit #1 (2x)",
        items: [
          "Bulgarians — 4 tiers, dowel BW @ 20/20, 14/14 | 4 tiers, no dowel BW @ —",
          "Reverse Grip Press (Flat) — 20lbs @ 20 | 25lbs @ 20 | 30lbs @ 20, 20 | 35lbs @ —",
          "Reverse Grip Lat Pull — 105lbs @ 20, 20 | 120lbs @ 12, 12",
          "Clamshells — Blue @ 23/23 | Black @ 20/20 | Black & Yellow @ 20/20 | Black & Green @ 20/20",
        ],
      },
      {
        name: "Strength Circuit #2 (2x)",
        items: [
          "KB Clean Technique",
          "Banded Straight Arm Lat Pulls — Red @ 20 | Blue @ 20 | Purple @ 20, 20",
          "Banded Dowel Biceps — Purple @ 20, 15 | Purple & Yellow @ 8",
          "Z Press — 20lbs @ 20 | 25lbs @ 18",
          "Froggers — BW @ 30 | 20lbs @ 20 | 40lbs @ —",
        ],
      },
      {
        name: "Core",
        items: [
          "Plank Twisters — BW @ 20",
          "Russian Twist — feet down @ 20 | feet up @ 20",
          "Swiss Ball Sit Ups — BW lvl 1 @ 20 | BW lvl 2 @ 20",
          "Core Ramp Countdown: knee tucks / crunches / supermen 20, 15, 10, 5",
        ],
      },
    ],
  },
  {
    workout: 6,
    date: "3/18",
    title: "Step Ups + Rotation/Core Endurance",
    circuits: [
      {
        name: "Strength Circuit #1 (2x)",
        items: [
          "Glute Focused Step Ups — BW to 20lb contra, all @ 20/20",
          "QL Side Bend — Red @ 20/20 | Blue @ 20/20 | Purple @ 20/20, 20/20",
          "Lat Pull Over — Flat 15lbs @ 20 | Thoracic 20lbs @ 21 | Thoracic 35lbs @ 20, 20",
          "Swimmer Curls — 15lbs @ 21 | 20lbs @ 20 | 25lbs @ 15",
        ],
      },
      {
        name: "Strength Circuit #2 (2x)",
        items: [
          "Snatches — 20lbs @ 18/18, 16/15 | 25lbs @ —",
          "Uni Glute Act Fly — 15lbs @ 19/19 | 20lbs @ 20/20, 20/20 | 25lbs @ —",
          "Pronation Curls (dowel) — Red @ 20 | Blue @ 20, 11 | Blue wide @ 9",
          "Donkey Kicks — Green @ 30/30 | Blue @ 20/20",
        ],
      },
      {
        name: "Core",
        items: [
          "Plank army crawls — BW lvl 1 @ 10",
          "Swiss Ball Tornados @ —",
          "Stir The Pot @ —",
          "Spetznaz P-up @ —",
          "Endurance circuit: IT Band Crunches / Full Sit Ups / Knee Tucks / Leg Lifts",
        ],
      },
    ],
  },
  {
    workout: 7,
    date: "3/23",
    title: "Split Squats + Upper Body Strength",
    circuits: [
      {
        name: "Strength Circuit #1 (2x)",
        items: [
          "Split Squats — BW/dowel to 15lbs per side, mostly @ 20/20",
          "Zotman Curls — 15lbs @ 20, 18 | 20lbs @ 20",
          "Shrugs — 40lbs @ 22 | 50lbs @ 21 | 60lbs @ 20, 20",
          "Jane Fondas — BW @ 30/30 | Yellow @ 25/25 | Green @ 25/25",
        ],
      },
      {
        name: "Strength Circuit #2 (2x)",
        items: [
          "Pistols — Bench & BW @ 13/20; note left side affected by fall/elliptical fatigue",
          "Close Grip Press (Flat) — 20lbs @ 30 | 25lbs @ 25 | 30lbs @ 30 | 40lbs @ 20",
          "Saxon Side Band — 8lbs @ 20/20 | 10lbs @ 20/20 | 15lbs @ 20/20",
          "Preacher Curl (Uni) — 15lbs @ 20/20 | 20lbs @ 18/18",
        ],
      },
      { name: "Core", items: ["Leg Lifts @ 12"] },
    ],
  },
  {
    workout: 8,
    date: "3/26",
    title: "Banded Press/Row + Overhead Stability",
    circuits: [
      {
        name: "Strength Circuit #1 (2x)",
        items: [
          "Spanish Squats (Purple) — BW @ 20 | 10lb bow tie @ 20 | 15lb bow tie @ 20",
          "Banded French Press — Blue close @ 20 | Purple @ 20 | Purple & Yellow @ 20 | Purple & Green @ 19",
          "Bi Lateral Rev Grip Row — 20lbs @ 20 | 25lbs @ 20 | 30lbs @ 20, 20",
          "Uni Calve Bounce — BW @ 75/74 | 10lbs/side @ 50/50 | 15lbs/side @ 50/50, 50/50",
        ],
      },
      {
        name: "Strength Circuit #2 (2x)",
        items: [
          "Uni OH Squat — 10–15lbs at 4–5 tiers, all @ 10/10",
          "HR P-ups (handles) @ 10, 6",
          "Face Pulls — Green @ 20 | Red @ 20 | Blue @ 20 | Blue farther @ 20",
          "Donkey Raise — BW @ 30/30 | 8lbs @ 20/20 | 10lbs @ 20/20, 20/20",
        ],
      },
      {
        name: "Core",
        items: [
          "V-Ups — level 1 @ 18",
          "Endurance circuit: IT Band Crunches / Full Sit Ups / Knee Tucks",
        ],
      },
    ],
  },
  {
    workout: 9,
    date: "3/31",
    title: "Cluster Curls + Swiss Ball Work",
    circuits: [
      {
        name: "Strength Circuit #1",
        items: [
          "Pulsing Squats — BW to 20lb bow tie, 4 tiers, all @ 20",
          "Hammer Curl to Sup — 15lbs @ 20 | 20lbs @ 18 | 25lbs @ 18, 9",
          "Scaptions — 8lbs @ 20 | 10lbs @ 20 | 15lbs wall-supported @ 18, 10",
          "Rev Hypers — Swiss ball on bench @ 25, 25",
        ],
      },
      {
        name: "Strength Circuit #2 (2x)",
        items: [
          "Shins, Shoulders, Sky — 15lbs @ 20 | 20lbs @ 20, 14",
          "Swiss Ball Rebound P-Up — BW @ 20, 17",
          "Banded High Rows — Purple @ 20 | Purple & Yellow @ 22 | Purple & Green @ 20, 20",
          "Swiss Ball Roll Outs — Bi @ 20, 20 | Uni @ 15/15",
        ],
      },
      {
        name: "Strength Super Set (2x)",
        items: [
          "Spider Curls — 20lbs @ 12, 6",
          "Chest Supported Tri Kickbacks — 10lbs @ 12, 12 | 15lbs @ —",
        ],
      },
      {
        name: "Core",
        items: [
          "Plank Oblique Rotations @ 16/16",
          "Side Plank Raises @ 15/15",
          "Hanging leg raises — knees bent / knee straight / toes to bar @ —",
          "Endurance circuit: Bike Crunches / Core Hackey Sacks / Starfish",
        ],
      },
    ],
  },
  {
    workout: 10,
    date: "4/2",
    title: "Stand Ups + Pressing Progression",
    circuits: [
      {
        name: "Strength Circuit #1 (2x)",
        items: [
          "Japanese Stand Up — BW @ 20 | 15lbs @ 20 | 20lbs @ 20 | 30lbs @ 20",
          "Dragon Press — 15lbs @ 20 | 20lbs @ 20 | 25lbs @ 20 | 30lbs @ 12",
          "Hollow Hold Flies — 15lbs @ 20 | 20lbs @ 20 | 25lbs @ 11",
          "Book Opener Hip Raise — 15lbs @ 20/20 | 20lbs @ 20/20 | 25lbs @ 20/20 | 30lbs @ 16/16",
        ],
      },
      {
        name: "Strength Circuit #2 (2x)",
        items: [
          "Good Morning — 30lb BB @ 20 | 50lb BB @ 20 | 50lb BB + pauses @ 20",
          "Clean Technique",
          "Clean — 35lbs @ 10/10",
          "Swiss Ball Back Extension — BW @ 20 with variations",
          "Decline Press — 20lbs @ 22 | 25lbs @ 20 | 30lbs @ 20",
        ],
      },
      {
        name: "Core",
        items: [
          "Hollow Hold to cocoons — BW @ —",
          "Core endurance circuit: IT Band Crunch / Toe Touches / Big Flutters",
        ],
      },
    ],
  },
  {
    workout: 11,
    date: "4/6",
    title: "Lunges + Hip Thrust Progression",
    circuits: [
      {
        name: "Strength Circuit #1 (2x)",
        items: [
          "Rev Lunges (Alt) — BW @ 20/20 | 10lb bow tie @ 20/20 | 15lbs @ 20/20 | 20lbs @ 20/20",
          "Bench Incline Dead Hang DB Curls — 15lbs @ 20, 15 | 20lbs @ 12",
          "Diamond P-ups — Knees @ 20, 20 | Full @ 13, 9",
          "Figure 4 inner thigh raise — BW @ 20/20, 20/20",
        ],
      },
      {
        name: "Strength Circuit #2 (2x)",
        items: [
          "Cossack Switch Offs — 15lbs @ 20/20, 20/20 | 20lbs @ 20/20 | 35lb KB @ 20/20",
          "Jerks — 25lbs @ 20, 12 | 30lbs @ 15, 12",
          "Supinated Banded Low Rows — Red close @ 20 | Blue close @ 20 | Purple close @ 20 | Purple medium distance @ 18",
          "Banded Hip Thrust — Blue BW @ 20 | Black BW @ 20 | Black + 20lb @ 20 | Black + 30lbs @ 15",
        ],
      },
      {
        name: "Bonus Super Set (2x)",
        items: ["Palof Circles (up & away) — Red/Red @ 20/20 | Blue/Blue @ —", "AT Raises — Bi @ 20"],
      },
      {
        name: "Core",
        items: [
          "Log Roll — arms up @ 15 | legs up @ —",
          "L Sit — hands down @ 20 | hands up @ —",
          "Hollow Rocks @ 20",
          "Evil Wheel countdown with 100 bike crunches total",
        ],
      },
    ],
  },
  {
    workout: 12,
    date: "4/9",
    title: "Isometric Holds + Drop Sets",
    circuits: [
      {
        name: "Strength Circuit #1 (2x)",
        items: [
          "Wall Squat — Bi @ 1:15, 1:00 | B stance @ —",
          "Iron Cross — 8lbs @ 1:30 | 10lbs @ 1:00 | 15lbs @ 30",
          "Iso Hip Flexion Hold — 10lbs @ 1:00/1:00 | 15lbs @ 1:00/1:00, 34/30",
          "Iso Jane Fonda Hold — 10lbs @ 42/42 | 15lbs @ 22/22, 22/15",
          "Bottoms up hold — 35lbs & pinky @ —",
          "Scapular Pup — Bi @ 30 | Uni kneeling @ 20/20",
        ],
      },
      {
        name: "Drop Sets & Accessory Work",
        items: [
          "OH Press Drop Set — 40lbs @ 0 | 35lbs @ 8 | 30lbs @ 13 | 25lbs @ 8 | 20lbs @ 11 | 15lbs @ 8 | 12lbs @ 20",
          "DB Curl Drop Set — 30lbs @ 4, 10 | 25lbs @ 6, 4 | 20lbs @ 7, 7 | 15lbs @ 7, 7 | 10lbs @ 20, 20",
          "DB Incline Flies — 25lbs @ 13 | 20lbs @ 20",
          "Lat Pull Downs (Wide Grip) — lvl 8 @ 4, 2 | lvl 7 @ 6, 7 | lvl 6 @ 5, 6 | lvl 5 @ 10, 11 | lvl 4 @ 15, 6 | lvl 3 @ 20, 20",
        ],
      },
      {
        name: "Core",
        items: [
          "Reverse Crunch @ 20 (brutal)",
          "Janda Sit Ups — Yellow support @ 4 | Green @ —",
          "2-round endurance circuit: Russian twist smashes / Deadbug Smashed / Short Crunches",
        ],
      },
    ],
  },
];

const TRAINER_IMPORT_STORAGE_KEY = "workout-tracker-imported-workouts-v1";
const trainerNotesExample = `Workout 13 · 4/12
Title: Trainer-written session title

Strength Circuit #1 (2x):
- Thrusters — 15lbs @ 20, 20 | 20lbs @ 16
- Bent Over Rows — 20lbs @ 20/20, 20/20 | 25lbs @ 21/22, 20/20
- Palof Press — Red/Red @ 20/20, 20/20

Strength Circuit #2 (2x):
- Gunslinger Curls — 35lbs @ 24/22
- Suitcase Carries — 55lbs @ 36/30 | 60lbs @ —

Core:
- Deadbugs @ 21
- Plank @ 2:02`;

const theme = {
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

const familyColors = {
  "Upper Body": { background: "#d8e1dc", color: "#4f6558", border: "#c1cec4" },
  "Lower Body": { background: "#dfe6d6", color: "#60714f", border: "#cbd5bf" },
  Arms: { background: "#eadfcd", color: "#86684c", border: "#d9cbb5" },
  Core: { background: "#ddd8e6", color: "#6a5f79", border: "#cac2d6" },
  Athletic: { background: "#e5d9d6", color: "#7a615a", border: "#d5c4bf" },
  Mixed: { background: "#e1e5de", color: "#687269", border: "#cfd6ce" },
};

const taxonomyRules = [
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

function normalizeText(value = "") {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function groupBy(items, getKey) {
  return items.reduce((map, item) => {
    const key = getKey(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
    return map;
  }, new Map());
}

function formatDateLabel(dateText) {
  return new Date(`2026/${dateText}`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function parseLoadValue(loadText) {
  if (!loadText) return null;
  const poundsMatch = loadText.match(/(\d+(?:\.\d+)?)\s*lb[s]?/i);
  if (poundsMatch) return Number(poundsMatch[1]);
  const levelMatch = loadText.match(/lvl\s*(\d+(?:\.\d+)?)/i);
  return levelMatch ? Number(levelMatch[1]) : null;
}

function parseMeasurement(token) {
  const trimmed = token.trim();
  const timeMatch = trimmed.match(/^(\d+):(\d+)$/);
  if (timeMatch) return { label: trimmed, type: "time", value: Number(timeMatch[1]) * 60 + Number(timeMatch[2]) };
  const numberMatch = trimmed.match(/-?\d+(?:\.\d+)?/);
  if (numberMatch) return { label: trimmed, type: "count", value: Number(numberMatch[0]) };
  return null;
}

function parseSetFragment(fragment, index) {
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

function parseVariation(rawVariation, index) {
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
    summary: `${loadText} · ${sets.length ? sets.map((set) => set.label).join(", ") : repText || "notes"}`,
  };
}

function inferTaxonomy(exerciseName) {
  const normalized = normalizeText(exerciseName);
  const match = taxonomyRules.find((rule) => rule.keywords.some((keyword) => normalized.includes(normalizeText(keyword))));
  return match ?? { family: "Mixed", group: "Accessory / Skill" };
}

function deriveMovementPattern(exerciseName, taxonomy) {
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

function parseExerciseItem(item, context) {
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
    bestLoad: variations.reduce((max, variation) => variation.loadValue === null ? max : max === null ? variation.loadValue : Math.max(max, variation.loadValue), null),
    performanceScore: variations.reduce((sum, variation) => sum + variation.volumeScore, 0) + variations.reduce((sum, variation) => sum + variation.setCount, 0) * 4,
    searchText: normalizeText([name, movementPattern.label, taxonomy.family, taxonomy.group, detailText, context.circuitName, context.workoutTitle].join(" ")),
    ...context,
  };
}

function sortWorkouts(workoutList) {
  return [...workoutList].sort((a, b) => new Date(`2026/${a.date}`).getTime() - new Date(`2026/${b.date}`).getTime());
}

function sanitizeWorkout(workout, fallbackNumber) {
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

function dedupeWorkouts(workoutList) {
  const byKey = new Map();
  workoutList.forEach((workout, index) => {
    const sanitized = sanitizeWorkout(workout, index + 1);
    byKey.set(`${sanitized.workout}-${sanitized.date}`, sanitized);
  });
  return sortWorkouts([...byKey.values()]);
}

function normalizeDateInput(value) {
  const trimmed = String(value).trim();
  const numericMatch = trimmed.match(/(\d{1,2})[\/\-.](\d{1,2})/);
  if (numericMatch) return `${Number(numericMatch[1])}/${Number(numericMatch[2])}`;
  const monthNames = {
    jan: 1,
    january: 1,
    feb: 2,
    february: 2,
    mar: 3,
    march: 3,
    apr: 4,
    april: 4,
    may: 5,
    jun: 6,
    june: 6,
    jul: 7,
    july: 7,
    aug: 8,
    august: 8,
    sep: 9,
    sept: 9,
    september: 9,
    oct: 10,
    october: 10,
    nov: 11,
    november: 11,
    dec: 12,
    december: 12,
  };
  const monthMatch = trimmed.match(/\b([A-Za-z]{3,9})\s+(\d{1,2})\b/);
  if (monthMatch) {
    const monthNumber = monthNames[monthMatch[1].toLowerCase()];
    if (monthNumber) return `${monthNumber}/${Number(monthMatch[2])}`;
  }
  return "";
}

function stripBulletPrefix(value) {
  return value.replace(/^[-*•]\s+/, "").replace(/^\d+[.)]\s+/, "").trim();
}

function isLikelyCircuitHeader(value) {
  const normalized = normalizeText(value.replace(/:$/, ""));
  return value.endsWith(":") || /^(?:block|circuit|section|series|pairing|tri set|giant set|warm up|warmup|cool down|cooldown|core|super set|superset|drop set|accessory|bonus|finisher|strength|mobility|conditioning|upper|lower)/.test(normalized);
}

function extractDateFromLine(value) {
  return normalizeDateInput(value);
}

function looksLikeExerciseDetail(value) {
  return /(\d+(?:\.\d+)?\s*lb[s]?|\bbw\b|bodyweight|lvl\s*\d+|@|\d+\s*[xX]\s*\d+|\d+:\d+|\d+\/\d+|red|blue|green|purple|black|yellow|orange|pink|reps?|seconds?|secs?|mins?|minutes?)/i.test(value);
}

function isLikelyExerciseLine(value) {
  const trimmed = stripBulletPrefix(value.trim());
  if (!trimmed) return false;
  if (isLikelyCircuitHeader(trimmed)) return false;
  if (/^(date|title|notes?)\s*:/i.test(trimmed)) return false;
  if (/^(workout|session|day)\s*#?\s*\d+/i.test(trimmed)) return false;
  if (looksLikeExerciseDetail(trimmed)) return true;
  return /[A-Za-z]/.test(trimmed) && trimmed.split(/\s+/).length >= 2 && trimmed.length <= 140;
}

function isLikelyContinuationLine(value) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (isLikelyCircuitHeader(trimmed) || /^(date|title|workout|session|day)\b/i.test(trimmed)) return false;
  return /^[|/+,&()]/.test(trimmed) || /^(notes?|focus|cue|tempo|rest|alt\b|alternate\b|same\b|then\b)/i.test(trimmed) || (!isLikelyExerciseLine(trimmed) && trimmed.length <= 120);
}

function deriveWorkoutTitle(circuits) {
  const names = circuits
    .flatMap((circuit) => circuit.items)
    .slice(0, 2)
    .map((item) => stripBulletPrefix(item).split(/—|:|@/)[0].trim())
    .filter(Boolean);
  return names.length > 0 ? names.join(" + ") : "Trainer intake workout";
}

function normalizeTrainerExerciseLine(value) {
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

function extractWorkoutMetadataFromLine(value) {
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

function parseTrainerWorkoutBlock(blockText, fallbackWorkoutNumber) {
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
    if (metadata.workoutNumber !== null) {
      workoutNumber = metadata.workoutNumber;
    }
    if (metadata.date && !date) {
      date = metadata.date;
    }
    if (metadata.title && !title) {
      title = metadata.title;
    }
    if (metadata.hasMetadata && /^(?:workout|session|day|title|date)\b/i.test(line)) {
      return;
    }
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

function parseTrainerWorkoutNotes(rawText, existingWorkouts = []) {
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

function buildDashboardData(workoutList) {
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
      const volumeDelta = latest.totalVolume - first.totalVolume;
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
        volumeDelta,
        setDelta,
        growthScore: (loadDelta ?? 0) * 5 + volumeDelta + setDelta * 3 + (sortedRecords.length - 1) * 4,
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
        repDelta: previousRecord ? record.totalCountVolume - previousRecord.totalCountVolume : null,
        timeDelta: previousRecord ? record.totalTimeVolume - previousRecord.totalTimeVolume : null,
        loadDelta: previousRecord && record.bestLoad !== null && previousRecord.bestLoad !== null ? record.bestLoad - previousRecord.bestLoad : null,
        hasRepData: record.totalCountVolume > 0 || (previousRecord?.totalCountVolume ?? 0) > 0,
        hasTimeData: record.totalTimeVolume > 0 || (previousRecord?.totalTimeVolume ?? 0) > 0,
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

const totalCalories = weeklyTargets.reduce((sum, week) => sum + week.calories, 0);
const avgCalories = Math.round(totalCalories / weeklyTargets.length);
const maxCaloriesWeek = weeklyTargets.reduce((max, week) => week.calories > max.calories ? week : max, weeklyTargets[0]);
const intensityWeeks = weeklyTargets.filter((week) => week.intensity !== null);
const avgIntensity = Math.round(intensityWeeks.reduce((sum, week) => sum + (week.intensity ?? 0), 0) / intensityWeeks.length);

function formatLoad(loadValue) {
  return loadValue === null ? "BW / mixed" : `${loadValue} lb`;
}

function formatDelta(value, suffix = "") {
  if (value === null) return "n/a";
  if (value === 0) return `0${suffix}`;
  return `${value > 0 ? "+" : ""}${value}${suffix}`;
}

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

function SectionCard({ title, subtitle = "", children }) {
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

function StatCard({ title, value, subtitle }) {
  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 18, padding: 20, boxShadow: theme.shadow }}>
      <p style={{ margin: 0, fontSize: 14, color: theme.textSoft }}>{title}</p>
      <p style={{ margin: "8px 0 0", fontSize: 28, fontWeight: 700, color: theme.text }}>{value}</p>
      {subtitle ? <p style={{ margin: "6px 0 0", fontSize: 12, color: theme.textMuted }}>{subtitle}</p> : null}
    </div>
  );
}

function GroupBadge({ family, group }) {
  const tone = familyColors[family] ?? familyColors.Mixed;
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 999, padding: "6px 10px", background: tone.background, color: tone.color, border: `1px solid ${tone.border}`, fontSize: 12, fontWeight: 700 }}>{family} · {group}</span>;
}

function MetricChip({ label, value }) {
  return (
    <div style={{ border: `1px solid ${theme.border}`, borderRadius: 14, padding: "8px 10px", minWidth: 112, background: theme.surfaceStrong }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", color: theme.textMuted, letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4, color: theme.text }}>{value}</div>
    </div>
  );
}

const insightTones = {
  positive: { background: "#d9e4d7", border: "#bcccb8", accent: "#567053", text: "#3f5441" },
  warning: { background: "#e8ddda", border: "#d5c5c0", accent: "#7e645e", text: "#654f49" },
  neutral: { background: theme.surfaceStrong, border: theme.border, accent: theme.accentStrong, text: theme.textSoft },
};

function InsightStatCard({ label, value, subtitle, tone = "neutral" }) {
  const palette = insightTones[tone] ?? insightTones.neutral;
  return (
    <div style={{ background: palette.background, border: `1px solid ${palette.border}`, borderRadius: 18, padding: 18, boxShadow: theme.shadow, display: "grid", gap: 8 }}>
      <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, color: palette.accent }}>{label}</div>
      <div style={{ fontSize: 27, fontWeight: 700, color: theme.text }}>{value}</div>
      <div style={{ fontSize: 13, color: palette.text, lineHeight: 1.5 }}>{subtitle}</div>
    </div>
  );
}

function InsightCalloutCard({ title, body, tone = "neutral" }) {
  const palette = insightTones[tone] ?? insightTones.neutral;
  return (
    <div style={{ border: `1px solid ${palette.border}`, borderRadius: 16, padding: 16, background: palette.background, display: "grid", gap: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: palette.accent, textTransform: "uppercase", letterSpacing: 0.4 }}>{title}</div>
      <div style={{ fontSize: 14, color: theme.text, lineHeight: 1.6 }}>{body}</div>
    </div>
  );
}

function DistributionBar({ label, detail, percent, color }) {
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

function ConfidenceBadge({ level, score }) {
  const tone = level === "High" ? insightTones.positive : level === "Medium" ? insightTones.neutral : insightTones.warning;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 999, padding: "7px 11px", border: `1px solid ${tone.border}`, background: tone.background, color: tone.accent, fontSize: 12, fontWeight: 700 }}>
      <span>{level} confidence</span>
      <span style={{ opacity: 0.72 }}>{score}%</span>
    </span>
  );
}

function TrendPill({ label, delta, suffix = "", emptyLabel = "No baseline" }) {
  const tone = getTrendTone(delta);
  if (delta === null) {
    return <span style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 999, padding: "6px 10px", border: `1px solid ${tone.border}`, background: tone.background, color: tone.color, fontSize: 12, fontWeight: 700 }}><span>{label}</span><span>{emptyLabel}</span></span>;
  }
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 999, padding: "6px 10px", border: `1px solid ${tone.border}`, background: tone.background, color: tone.color, fontSize: 12, fontWeight: 700 }}><span>{tone.symbol}</span><span>{getTrendMessage(delta)}</span><span style={{ opacity: 0.8 }}>{label.toLowerCase()}</span><span>{`${delta > 0 ? "+" : ""}${delta}${suffix}`}</span></span>;
}

function ExerciseHistoryCard({ history }) {
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

export default function TrainingLogDashboard() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [importedWorkouts, setImportedWorkouts] = useState([]);
  const [trainerNotes, setTrainerNotes] = useState(trainerNotesExample);
  const [previewWorkouts, setPreviewWorkouts] = useState([]);
  const [intakeError, setIntakeError] = useState("");
  const [intakeMessage, setIntakeMessage] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(TRAINER_IMPORT_STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) setImportedWorkouts(dedupeWorkouts(parsed));
    } catch {
      window.localStorage.removeItem(TRAINER_IMPORT_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TRAINER_IMPORT_STORAGE_KEY, JSON.stringify(importedWorkouts));
  }, [importedWorkouts]);

  const mergedWorkouts = useMemo(() => dedupeWorkouts([...workouts, ...importedWorkouts]), [importedWorkouts]);
  const dashboardData = useMemo(() => buildDashboardData(mergedWorkouts), [mergedWorkouts]);
  const { structuredWorkouts, exerciseHistories, taxonomySummary, exerciseIndex, repeatedExercises, topGrowthLeaders, totalParsedSets, dominantGroup } = dashboardData;
  const previewStructuredWorkouts = useMemo(() => buildDashboardData(previewWorkouts).structuredWorkouts, [previewWorkouts]);
  const overviewInsights = useMemo(() => buildOverviewInsights(dashboardData, weeklyTargets), [dashboardData]);
  const taxonomyInsights = useMemo(() => buildTaxonomyInsights(dashboardData), [dashboardData]);
  const trainerPreviewModel = useMemo(() => buildTrainerPreviewModel(previewStructuredWorkouts, structuredWorkouts), [previewStructuredWorkouts, structuredWorkouts]);

  const filteredWorkouts = useMemo(() => {
    if (!query.trim()) return structuredWorkouts;
    const normalizedQuery = normalizeText(query);
    return structuredWorkouts.filter((workout) => workout.searchText.includes(normalizedQuery));
  }, [query, structuredWorkouts]);

  const filteredHistories = useMemo(() => {
    if (!query.trim()) return exerciseHistories;
    const normalizedQuery = normalizeText(query);
    return exerciseHistories.filter((history) => history.searchText.includes(normalizedQuery));
  }, [query, exerciseHistories]);

  const filteredGroups = useMemo(() => {
    if (!query.trim()) return taxonomySummary;
    const normalizedQuery = normalizeText(query);
    return taxonomySummary.filter((group) => normalizeText(`${group.family} ${group.group}`).includes(normalizedQuery) || group.topExercises.some((exercise) => exercise.searchText.includes(normalizedQuery)));
  }, [query, taxonomySummary]);

  const previewTrainerNotes = () => {
    const result = parseTrainerWorkoutNotes(trainerNotes, mergedWorkouts);
    if (result.errors.length > 0) {
      setIntakeError(result.errors.join(" "));
      setIntakeMessage("");
      setPreviewWorkouts([]);
      return;
    }
    setPreviewWorkouts(result.workouts);
    setIntakeError("");
    setIntakeMessage(`Parsed ${result.workouts.length} workout${result.workouts.length === 1 ? "" : "s"} successfully.`);
  };

  const importTrainerNotes = () => {
    const result = parseTrainerWorkoutNotes(trainerNotes, mergedWorkouts);
    if (result.errors.length > 0) {
      setIntakeError(result.errors.join(" "));
      setIntakeMessage("");
      setPreviewWorkouts([]);
      return;
    }
    setImportedWorkouts((current) => dedupeWorkouts([...current, ...result.workouts]));
    setPreviewWorkouts(result.workouts);
    setIntakeError("");
    setIntakeMessage(`Imported ${result.workouts.length} workout${result.workouts.length === 1 ? "" : "s"} into the dashboard.`);
  };

  const renderGroupHeader = (group) => {
    const tone = familyColors[group.family] ?? familyColors.Mixed;
    return (
      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: tone.color, opacity: 0.8 }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: theme.text }}>{group.group}</span>
        </div>
        <div style={{ fontSize: 12, letterSpacing: 0.4, textTransform: "uppercase", color: theme.textMuted }}>{group.family}</div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(180deg, ${theme.backgroundAccent} 0%, ${theme.background} 100%)`, padding: 24, fontFamily: "Arial, Helvetica, sans-serif", color: theme.text }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "inline-block", padding: "6px 12px", borderRadius: 999, background: theme.accentSoft, color: theme.accentStrong, border: `1px solid ${theme.border}`, fontSize: 12, fontWeight: 600, marginBottom: 12 }}>Structured Training Archive</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ flex: "1 1 700px" }}>
              <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.1, color: theme.text }}>Workout Taxonomy & Growth Dashboard</h1>
              <p style={{ margin: "12px 0 0", maxWidth: 900, color: theme.textSoft, lineHeight: 1.6 }}>Your richer dashboard is back: grouped movement histories, taxonomy rollups, trend pills, and trainer intake.</p>
            </div>
            <div style={{ width: "100%", maxWidth: 360 }}>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search exercises, groups, workouts..." style={{ width: "100%", padding: "12px 14px", borderRadius: 14, border: `1px solid ${theme.border}`, fontSize: 14, boxSizing: "border-box", background: theme.surface, color: theme.text, boxShadow: theme.shadow }} />
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
          {overviewInsights.summaryCards.map((card) => (
            <InsightStatCard key={card.id} label={card.label} value={card.value} subtitle={card.subtitle} tone={card.tone} />
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {[["overview", "Overview"], ["progress", "Growth"], ["groups", "Taxonomy"], ["workouts", "Workout log"], ["index", "Exercise index"], ["intake", "Trainer intake"], ["weeks", "Weekly targets"]].map(([value, label]) => {
            const isActive = activeTab === value;
            return <button key={value} type="button" onClick={() => setActiveTab(value)} style={{ border: `1px solid ${isActive ? theme.borderStrong : theme.border}`, background: isActive ? theme.accent : theme.surface, color: isActive ? "#f4f6f1" : theme.text, borderRadius: 14, padding: "10px 14px", cursor: "pointer", fontWeight: 600, boxShadow: isActive ? theme.shadow : "none" }}>{label}</button>;
          })}
        </div>

        {activeTab === "overview" && (
          <div style={{ display: "grid", gap: 16 }}>
            <SectionCard title="What stands out" subtitle="A faster read on what changed, what is working, and where the plan may be getting narrow">
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.25fr) minmax(280px, 0.9fr)", gap: 16 }}>
                <div style={{ display: "grid", gap: 12 }}>
                  {overviewInsights.callouts.map((callout) => (
                    <InsightCalloutCard key={callout.id} title={callout.title} body={callout.body} tone={callout.tone} />
                  ))}
                </div>
                <div style={{ display: "grid", gap: 12 }}>
                  <div style={{ border: `1px solid ${theme.border}`, borderRadius: 16, padding: 16, background: theme.surfaceStrong, display: "grid", gap: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: theme.textMuted }}>Recent focus</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {overviewInsights.latestFocus.length > 0 ? overviewInsights.latestFocus.map((label) => (
                        <span key={label} style={{ display: "inline-flex", alignItems: "center", borderRadius: 999, padding: "7px 11px", background: theme.surface, border: `1px solid ${theme.border}`, color: theme.text, fontSize: 13, fontWeight: 600 }}>{label}</span>
                      )) : <span style={{ color: theme.textSoft, fontSize: 14 }}>No recent focus signal yet.</span>}
                    </div>
                  </div>
                  <div style={{ border: `1px solid ${theme.border}`, borderRadius: 16, padding: 16, background: theme.surfaceStrong, display: "grid", gap: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: theme.textMuted }}>Weekly target trend</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: theme.text }}>{overviewInsights.calorieTrend.recentCalories.toLocaleString()}</div>
                    <div style={{ color: theme.textSoft, lineHeight: 1.5 }}>{overviewInsights.calorieTrend.latestWindowLabel ? `${overviewInsights.calorieTrend.latestWindowLabel} total calories` : "No calorie window yet"}</div>
                    <div style={{ color: theme.textMuted, fontSize: 13 }}>{overviewInsights.calorieTrend.previousCalories > 0 ? `${overviewInsights.calorieTrend.deltaPercent > 0 ? "+" : ""}${overviewInsights.calorieTrend.deltaPercent ?? 0}% vs prior 4-week block` : `Peak week remains Week ${maxCaloriesWeek.week} at ${maxCaloriesWeek.calories.toLocaleString()} calories.`}</div>
                  </div>
                </div>
              </div>
            </SectionCard>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
              <SectionCard title="Calories by week">
                <div style={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyTargets}><CartesianGrid strokeDasharray="3 3" stroke={theme.border} /><XAxis dataKey="week" stroke={theme.textMuted} /><YAxis stroke={theme.textMuted} /><Tooltip contentStyle={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 14, color: theme.text }} /><Line type="monotone" dataKey="calories" stroke={theme.accentStrong} strokeWidth={3} dot={{ fill: theme.accentStrong, stroke: theme.surface, r: 4 }} /></LineChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>
              <SectionCard title="Intensity targets">
                <div style={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyTargets.filter((week) => week.intensity !== null)}><CartesianGrid strokeDasharray="3 3" stroke={theme.border} /><XAxis dataKey="week" stroke={theme.textMuted} /><YAxis stroke={theme.textMuted} /><Tooltip contentStyle={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 14, color: theme.text }} /><Bar dataKey="intensity" fill={theme.accent} radius={[10, 10, 0, 0]} /></BarChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>
            </div>
            <SectionCard title="Growth highlights" subtitle="Top repeated movement buckets with the clearest progression signal">
              <div style={{ display: "grid", gap: 12 }}>
                {topGrowthLeaders.map((history) => (
                  <div key={history.canonicalName} style={{ border: `1px solid ${theme.border}`, borderRadius: 16, padding: 14, background: theme.surface }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontWeight: 700, color: theme.text }}>{history.name}</div>
                        <div style={{ fontSize: 13, color: theme.textSoft, marginTop: 4 }}>{history.exampleExerciseName}</div>
                      </div>
                      <GroupBadge family={history.taxonomy.family} group={history.taxonomy.group} />
                    </div>
                    <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {history.latest.trend?.hasRepData ? <TrendPill label="Reps" delta={history.latest.trend.repDelta} /> : history.latest.trend?.hasTimeData ? <TrendPill label="Time" delta={history.latest.trend.timeDelta} suffix="s" /> : <TrendPill label="Reps" delta={null} emptyLabel="No baseline" />}
                      <TrendPill label="Load" delta={history.latest.trend?.loadDelta ?? null} suffix=" lb" />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        )}

        {activeTab === "progress" && <SectionCard title="Exercise progress cards" subtitle="Grouped across repeated movement patterns"><div style={{ display: "grid", gap: 14 }}>{filteredHistories.map((history) => <ExerciseHistoryCard key={history.canonicalName} history={history} />)}</div></SectionCard>}

        {activeTab === "groups" && <div style={{ display: "grid", gap: 16 }}><SectionCard title="Balance snapshot" subtitle="Use this view to spot concentration, under-served areas, and where volume is clustering"><div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(280px, 0.9fr)", gap: 16 }}><div style={{ display: "grid", gap: 14 }}>{taxonomyInsights.familyDistribution.map((family) => { const tone = familyColors[family.family] ?? familyColors.Mixed; return <DistributionBar key={family.family} label={family.family} detail={`${family.totalSets} sets across ${family.groupCount} groups`} percent={family.share} color={tone.color} />; })}</div><div style={{ display: "grid", gap: 12 }}>{taxonomyInsights.balanceNotes.map((note) => <InsightCalloutCard key={note.id} title={note.title} body={note.body} tone={note.tone} />)}</div></div></SectionCard><SectionCard title="Neglected groups" subtitle="Movement buckets that have gone quiet relative to the rest of the log"><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>{taxonomyInsights.neglectedGroups.map((group) => <div key={`${group.family}-${group.group}-neglected`} style={{ border: `1px solid ${theme.border}`, borderRadius: 16, padding: 14, background: theme.surfaceStrong, display: "grid", gap: 8 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}><div><div style={{ fontWeight: 700, color: theme.text }}>{group.group}</div><div style={{ fontSize: 13, color: theme.textSoft }}>{group.family}</div></div><div style={{ fontSize: 12, color: theme.textMuted }}>{group.share}% of sets</div></div><div style={{ fontSize: 13, color: theme.textSoft }}>{group.totalSets} sets · {group.sessionCount} appearances</div><div style={{ fontSize: 13, color: theme.textMuted }}>Last emphasized {group.latestDateLabel} · {group.daysSinceLatest} day gap</div></div>)}</div></SectionCard><SectionCard title="Taxonomy groups" subtitle="Detailed movement buckets, now with balance context instead of just rolled-up lists"><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, alignItems: "start" }}>{filteredGroups.map((group) => <div key={`${group.family}-${group.group}`} style={{ border: `1px solid ${theme.border}`, borderRadius: 18, padding: 18, display: "grid", gap: 14, background: theme.surface, boxShadow: theme.shadow, alignContent: "start" }}>{renderGroupHeader(group)}<div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 14, color: theme.textSoft }}><span>{group.exerciseCount} movements</span><span>{group.sessionCount} appearances</span><span>{group.totalSets} sets</span><span>{Math.round((group.totalSets / Math.max(totalParsedSets, 1)) * 100)}% of all parsed sets</span></div><div style={{ display: "grid", gap: 8, alignContent: "start" }}>{group.topExercises.slice(0, 5).map((exercise) => <div key={exercise.canonicalName} style={{ border: `1px solid ${theme.border}`, borderRadius: 14, padding: 12, background: theme.surfaceStrong }}><div style={{ fontWeight: 600, color: theme.text }}>{exercise.name}</div><div style={{ marginTop: 4, fontSize: 13, color: theme.textSoft }}>{exercise.sessionCount} sessions · best load {formatLoad(exercise.bestLoad)}</div></div>)}</div></div>)}</div></SectionCard></div>}

        {activeTab === "workouts" && <SectionCard title="Structured workout log" subtitle="Now with repeated movement grouping and trend cues"><div style={{ display: "grid", gap: 16 }}>{filteredWorkouts.map((workout) => <details key={`${workout.workout}-${workout.date}`} style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 16, background: "#fff" }}><summary style={{ cursor: "pointer" }}><div style={{ display: "inline-block" }}><div style={{ fontWeight: 600 }}>Workout {workout.workout} · {workout.dateLabel}</div><div style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>{workout.title}</div></div></summary><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginTop: 16 }}>{workout.circuits.map((circuit, circuitIndex) => <div key={`${workout.workout}-${workout.date}-${circuit.name}-${circuitIndex}`} style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 16, display: "grid", gap: 12 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><h4 style={{ margin: 0, fontSize: 16 }}>{circuit.name}</h4><span style={{ fontSize: 12, color: "#6b7280" }}>{circuit.totalSets} sets</span></div><div style={{ display: "grid", gap: 12 }}>{circuit.exercises.map((exercise) => <div key={exercise.id} style={{ border: "1px solid #f3f4f6", borderRadius: 14, padding: 12, background: "#f9fafb", display: "grid", gap: 10 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><div><div style={{ fontWeight: 700 }}>{exercise.movementLabel}</div><div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{exercise.name}</div>{exercise.trend?.previousDateLabel ? <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>vs previous on {exercise.trend.previousDateLabel}</div> : <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>First time this movement appears in your log</div>}</div><GroupBadge family={exercise.taxonomy.family} group={exercise.taxonomy.group} /></div><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{exercise.trend?.hasRepData ? <TrendPill label="Reps" delta={exercise.trend.repDelta} /> : exercise.trend?.hasTimeData ? <TrendPill label="Time" delta={exercise.trend.timeDelta} suffix="s" /> : <TrendPill label="Reps" delta={null} emptyLabel="No baseline" />}<TrendPill label="Load" delta={exercise.trend?.loadDelta ?? null} suffix=" lb" /></div><div style={{ display: "grid", gap: 6, color: "#4b5563", fontSize: 14 }}>{exercise.variations.map((variation) => <div key={variation.id}>{variation.summary}</div>)}</div></div>)}</div></div>)}</div></details>)}</div></SectionCard>}

        {activeTab === "index" && <SectionCard title="Exercise index" subtitle="Movement buckets with session counts"><div style={{ maxHeight: 620, overflow: "auto", paddingRight: 4 }}><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>{exerciseIndex.filter((exercise) => !query.trim() || normalizeText(`${exercise.name} ${exercise.family} ${exercise.group} ${exercise.exampleExerciseName}`).includes(normalizeText(query))).map((exercise) => <div key={`${exercise.family}-${exercise.group}-${exercise.name}`} style={{ border: `1px solid ${theme.border}`, borderRadius: 16, padding: 12, display: "grid", gap: 8, background: theme.surfaceStrong }}><div style={{ fontWeight: 600, color: theme.text }}>{exercise.name}</div><div style={{ fontSize: 13, color: theme.textSoft }}>{exercise.exampleExerciseName}</div><GroupBadge family={exercise.family} group={exercise.group} /><div style={{ fontSize: 13, color: theme.textMuted }}>{exercise.sessionCount} session{exercise.sessionCount === 1 ? "" : "s"}</div></div>)}</div></div></SectionCard>}

        {activeTab === "intake" && <div style={{ display: "grid", gap: 16 }}><SectionCard title="Trainer note intake" subtitle="Paste coach notes in a natural writing style, preview the parse, then merge them into the dashboard"><div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.25fr) minmax(280px, 0.9fr)", gap: 16 }}><div style={{ display: "grid", gap: 12 }}><textarea value={trainerNotes} onChange={(event) => setTrainerNotes(event.target.value)} spellCheck={false} style={{ width: "100%", minHeight: 420, resize: "vertical", padding: 14, borderRadius: 14, border: `1px solid ${theme.border}`, background: theme.surfaceStrong, color: theme.text, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 13, lineHeight: 1.6, boxSizing: "border-box" }} /><div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}><button type="button" onClick={previewTrainerNotes} style={{ border: `1px solid ${theme.border}`, background: theme.surface, borderRadius: 12, padding: "10px 14px", cursor: "pointer", fontWeight: 600, color: theme.text }}>Preview parse</button><button type="button" onClick={importTrainerNotes} style={{ border: `1px solid ${theme.borderStrong}`, background: theme.accent, color: "#f4f6f1", borderRadius: 12, padding: "10px 14px", cursor: "pointer", fontWeight: 600 }}>Import into dashboard</button></div>{intakeError ? <div style={{ border: "1px solid #d5c5c0", background: "#e8ddda", color: "#7e645e", borderRadius: 12, padding: 12 }}>{intakeError}</div> : null}{intakeMessage ? <div style={{ border: "1px solid #c2cec0", background: "#d9e4d7", color: "#567053", borderRadius: 12, padding: 12 }}>{intakeMessage}</div> : null}</div><div style={{ border: `1px solid ${theme.border}`, borderRadius: 16, padding: 16, background: theme.surfaceStrong, display: "grid", gap: 12 }}><div style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>Flexible parser cues</div><div style={{ fontSize: 13, color: theme.textSoft, lineHeight: 1.6 }}>The parser now tolerates loose headers, shorthand like `3x10`, unbulleted exercise rows, and softer section labels like `Warm Up`, `Circuit`, or `Finisher`.</div><pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12, lineHeight: 1.6, color: theme.textSoft }}>{trainerNotesExample}</pre></div></div></SectionCard><SectionCard title="Parsed preview" subtitle="Review confidence, structure, and flagged items before importing">{previewStructuredWorkouts.length === 0 ? <div style={{ color: theme.textSoft }}>No preview yet. Paste notes and click `Preview parse`.</div> : <div style={{ display: "grid", gap: 16 }}><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}><InsightStatCard label="Previewed workouts" value={previewStructuredWorkouts.length} subtitle={`${trainerPreviewModel.totalWarnings} flagged review item${trainerPreviewModel.totalWarnings === 1 ? "" : "s"}`} tone={trainerPreviewModel.totalWarnings > 0 ? "warning" : "positive"} /><InsightStatCard label="Average confidence" value={`${trainerPreviewModel.averageConfidenceScore}%`} subtitle="Higher scores mean cleaner structure and fewer review flags" tone={trainerPreviewModel.averageConfidenceScore >= 80 ? "positive" : trainerPreviewModel.averageConfidenceScore >= 55 ? "neutral" : "warning"} /><InsightStatCard label="Existing workouts" value={structuredWorkouts.length} subtitle="Used to flag possible duplicate dates or workout numbers" tone="neutral" /></div>{trainerPreviewModel.cards.map((card) => <div key={card.id} style={{ border: `1px solid ${theme.border}`, borderRadius: 18, padding: 16, background: theme.surfaceStrong, display: "grid", gap: 14 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}><div style={{ display: "grid", gap: 4 }}><div style={{ fontWeight: 700, color: theme.text }}>Workout {card.workout.workout} · {card.workout.dateLabel}</div><div style={{ color: theme.textSoft }}>{card.workout.title}</div><div style={{ fontSize: 13, color: theme.textMuted }}>{card.summary}</div></div><ConfidenceBadge level={card.confidence} score={card.score} /></div><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><MetricChip label="Sections" value={card.sectionCount} /><MetricChip label="Exercises" value={card.exerciseCount} /><MetricChip label="Parsed sets" value={card.parsedSetCount} /></div><div style={{ display: "grid", gap: 8 }}><div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: theme.textMuted }}>Likely focus</div><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{card.topGroups.length > 0 ? card.topGroups.map((group) => <GroupBadge key={`${card.id}-${group.family}-${group.group}`} family={group.family} group={group.group} />) : <span style={{ color: theme.textSoft, fontSize: 13 }}>No focus groups detected yet.</span>}</div></div><div style={{ display: "grid", gap: 8 }}>{card.warnings.length > 0 ? card.warnings.map((warning) => <div key={`${card.id}-${warning}`} style={{ border: `1px solid ${insightTones.warning.border}`, borderRadius: 12, padding: 12, background: insightTones.warning.background, color: insightTones.warning.accent, fontSize: 13 }}>{warning}</div>) : <div style={{ border: `1px solid ${insightTones.positive.border}`, borderRadius: 12, padding: 12, background: insightTones.positive.background, color: insightTones.positive.accent, fontSize: 13 }}>No review flags. This preview looks ready to import.</div>}</div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>{card.workout.circuits.map((circuit, circuitIndex) => <div key={`${card.id}-${circuit.name}-${circuitIndex}`} style={{ border: `1px solid ${theme.border}`, borderRadius: 14, padding: 12, background: theme.surface }}><div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}><div style={{ fontWeight: 600, color: theme.text }}>{circuit.name}</div><div style={{ fontSize: 12, color: theme.textMuted }}>{circuit.exercises.length} items</div></div><div style={{ marginTop: 8, display: "grid", gap: 6 }}>{circuit.exercises.slice(0, 3).map((exercise) => <div key={exercise.id} style={{ fontSize: 13, color: theme.textSoft }}>{exercise.movementLabel}</div>)}{circuit.exercises.length > 3 ? <div style={{ fontSize: 12, color: theme.textMuted }}>+{circuit.exercises.length - 3} more</div> : null}</div></div>)}</div></div>)}</div>}</SectionCard></div>}

        {activeTab === "weeks" && <SectionCard title="Weekly calorie and intensity targets"><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>{weeklyTargets.map((week) => <div key={week.week} style={{ border: `1px solid ${theme.border}`, borderRadius: 16, padding: 16, background: theme.surfaceStrong }}><div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}><h3 style={{ margin: 0, fontSize: 16, color: theme.text }}>Week {week.week}</h3><span style={{ display: "inline-block", padding: "6px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: week.intensity !== null ? theme.surfaceMuted : theme.surface, border: `1px solid ${theme.border}`, color: theme.textSoft }}>{week.intensity !== null ? `Intensity ${week.intensity}` : "No intensity logged"}</span></div><p style={{ margin: "12px 0 0", fontSize: 32, fontWeight: 700, color: theme.text }}>{week.calories.toLocaleString()}</p><p style={{ margin: "4px 0 0", fontSize: 14, color: theme.textSoft }}>target calories</p></div>)}</div></SectionCard>}
      </div>
    </div>
  );
}
