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
  buildCycleInsights,
  buildTaxonomyInsights,
  buildTrainerPreviewModel,
} from "./dashboardViewModels";
import {
  theme,
  familyColors,
  SectionCard,
  GroupBadge,
  MetricChip,
  TrendPill,
  ExerciseHistoryCard,
  InsightStatCard,
  InsightCalloutCard,
  DistributionBar,
  ConfidenceBadge,
  insightTones,
} from "./dashboardComponents.jsx";
import { buildDashboardData as buildAnalyticsData } from "./workoutAnalytics";
import { dedupeWorkouts as dedupeWorkoutList, parseTrainerWorkoutNotes as parseTrainerNotes } from "./workoutParser";
import { createEmptyCircuitDraft, createWorkoutDraft, getWorkoutKey, parseWorkoutDraft } from "./workoutEditor";
import { createBlankClient, createSeedClient, normalizeClientStore, updateClientRecord } from "./clientStore";

const DEFAULT_CALORIE_THRESHOLD_PERCENT = 40;
const DEFAULT_ZONE_THRESHOLD_PERCENT = 90;

function createWeeklyTarget({ week, calories, reportedCalories = calories, calorieThresholdPercent = DEFAULT_CALORIE_THRESHOLD_PERCENT, zoneMinutes = null, zonePercent = zoneMinutes === null ? null : DEFAULT_ZONE_THRESHOLD_PERCENT, reportedZoneMinutes = null }) {
  return {
    week,
    calories,
    reportedCalories,
    calorieThresholdPercent,
    zoneMinutes,
    zonePercent,
    reportedZoneMinutes,
  };
}

const weeklyTargets = [
  createWeeklyTarget({ week: 1, calories: 500, reportedCalories: 482 }),
  createWeeklyTarget({ week: 2, calories: 520, reportedCalories: 505 }),
  createWeeklyTarget({ week: 3, calories: 540, reportedCalories: 538, zoneMinutes: 4, zonePercent: 90, reportedZoneMinutes: 3 }),
  createWeeklyTarget({ week: 4, calories: 635, reportedCalories: 637, zoneMinutes: 1, zonePercent: 90, reportedZoneMinutes: 1 }),
  createWeeklyTarget({ week: 5, calories: 800, reportedCalories: 803, zoneMinutes: 18, zonePercent: 90, reportedZoneMinutes: 16 }),
  createWeeklyTarget({ week: 6, calories: 805, reportedCalories: 806, zoneMinutes: 13, zonePercent: 90, reportedZoneMinutes: 11 }),
  createWeeklyTarget({ week: 7, calories: 820, reportedCalories: 817, zoneMinutes: 19, zonePercent: 90, reportedZoneMinutes: 20 }),
  createWeeklyTarget({ week: 8, calories: 825, reportedCalories: 826, zoneMinutes: 2, zonePercent: 90, reportedZoneMinutes: 2 }),
  createWeeklyTarget({ week: 9, calories: 635, reportedCalories: 635 }),
  createWeeklyTarget({ week: 10, calories: 570, reportedCalories: 569, zoneMinutes: 9, zonePercent: 90, reportedZoneMinutes: 8 }),
  createWeeklyTarget({ week: 11, calories: 555, reportedCalories: 554, zoneMinutes: 0, zonePercent: 90, reportedZoneMinutes: 0 }),
  createWeeklyTarget({ week: 12, calories: 530, reportedCalories: 529, zoneMinutes: 4, zonePercent: 90, reportedZoneMinutes: 3 }),
  createWeeklyTarget({ week: 13, calories: 500, reportedCalories: 430, zoneMinutes: 8, zonePercent: 90, reportedZoneMinutes: 5 }),
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
const EDITED_WORKOUT_STORAGE_KEY = "workout-tracker-edited-workouts-v1";
const CLIENT_STORE_STORAGE_KEY = "workout-tracker-clients-v1";
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

function formatZoneThreshold(percent) {
  return percent === null || percent === undefined ? "No zone threshold" : `${percent}% HR`;
}

function formatCalorieThreshold(percent) {
  return percent === null || percent === undefined ? "No calorie threshold" : `${percent}% HR`;
}

function formatZoneTarget(week) {
  return week.zoneMinutes === null || week.zoneMinutes === undefined ? "No target-zone goal" : `${week.zoneMinutes} min over ${formatZoneThreshold(week.zonePercent)}`;
}

function formatZoneReport(week) {
  return week.reportedZoneMinutes === null || week.reportedZoneMinutes === undefined ? "No reported zone time yet" : `${week.reportedZoneMinutes} min logged in zone`;
}

function getZoneProgressTone(reportedValue, goalValue) {
  if (goalValue === null || goalValue === undefined) return theme.textMuted;
  if (reportedValue === null || reportedValue === undefined) return theme.textMuted;
  return reportedValue >= goalValue ? insightTones.positive.accent : theme.accentStrong;
}

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

function clamp(value, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max);
}

function getProgressRatio(actual, target) {
  if (!target || target <= 0) return 0;
  return clamp(actual / target);
}

function getCompletionTone(actual, target) {
  if (target === null || target === undefined || target <= 0) {
    return { fill: theme.surfaceMuted, accent: theme.textMuted, glow: "transparent" };
  }
  const ratio = actual / target;
  if (ratio >= 1) {
    return { fill: insightTones.positive.background, accent: insightTones.positive.accent, glow: "rgba(86, 112, 83, 0.12)" };
  }
  if (ratio >= 0.75) {
    return { fill: theme.accentSoft, accent: theme.accentStrong, glow: "rgba(110, 127, 111, 0.08)" };
  }
  return { fill: theme.surfaceMuted, accent: theme.textSoft, glow: "transparent" };
}

function getProgressRingBackground(progress, color) {
  const clampedProgress = clamp(progress);
  const degrees = clampedProgress * 360;
  return `conic-gradient(${color} 0deg ${degrees}deg, ${theme.surfaceMuted} ${degrees}deg 360deg)`;
}

function getWeeklyStatus(goalValue, actualValue) {
  if (!goalValue || goalValue <= 0) {
    return { label: "Set when ready", color: theme.textMuted, background: theme.surfaceMuted };
  }
  const ratio = actualValue / goalValue;
  if (ratio >= 1) {
    return { label: "Cleared", color: insightTones.positive.accent, background: insightTones.positive.background };
  }
  if (ratio >= 0.75) {
    return { label: "On pace", color: theme.accentStrong, background: theme.accentSoft };
  }
  return { label: "Building", color: theme.textSoft, background: theme.surfaceMuted };
}

export default function TrainingLogDashboard() {
  const seedClient = useMemo(() => createSeedClient({ seedWorkouts: workouts, seedWeeklyTargets: weeklyTargets, trainerNotesExample }), []);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [viewportWidth, setViewportWidth] = useState(() => (typeof window === "undefined" ? 1440 : window.innerWidth));
  const [clients, setClients] = useState([seedClient]);
  const [activeClientId, setActiveClientId] = useState(seedClient.id);
  const [newClientName, setNewClientName] = useState("");
  const [trainerNotes, setTrainerNotes] = useState(trainerNotesExample);
  const [previewWorkouts, setPreviewWorkouts] = useState([]);
  const [intakeError, setIntakeError] = useState("");
  const [intakeMessage, setIntakeMessage] = useState("");
  const [editingWorkoutKey, setEditingWorkoutKey] = useState("");
  const [editingDraft, setEditingDraft] = useState(null);
  const [workoutEditError, setWorkoutEditError] = useState("");
  const [workoutEditMessage, setWorkoutEditMessage] = useState("");
  const [clientMessage, setClientMessage] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handleResize = () => setViewportWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(CLIENT_STORE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const normalizedClients = normalizeClientStore(parsed, seedClient);
        setClients(normalizedClients);
        setActiveClientId(normalizedClients[0]?.id ?? seedClient.id);
        return;
      }

      const legacyImported = (() => {
        try {
          const raw = window.localStorage.getItem(TRAINER_IMPORT_STORAGE_KEY);
          const parsed = raw ? JSON.parse(raw) : [];
          return Array.isArray(parsed) ? dedupeWorkoutList(parsed) : [];
        } catch {
          return [];
        }
      })();
      const legacyEdits = (() => {
        try {
          const raw = window.localStorage.getItem(EDITED_WORKOUT_STORAGE_KEY);
          const parsed = raw ? JSON.parse(raw) : [];
          return Array.isArray(parsed) ? parsed.filter((entry) => entry?.workout && entry?.originalKey).map((entry) => ({ originalKey: String(entry.originalKey), workout: entry.workout })) : [];
        } catch {
          return [];
        }
      })();

      const migratedSeed = {
        ...seedClient,
        importedWorkouts: legacyImported,
        editedWorkoutRecords: legacyEdits,
      };
      setClients([migratedSeed]);
      setActiveClientId(migratedSeed.id);
    } catch {
      window.localStorage.removeItem(CLIENT_STORE_STORAGE_KEY);
    }
  }, [seedClient]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CLIENT_STORE_STORAGE_KEY, JSON.stringify(clients));
  }, [clients]);

  const activeClient = useMemo(() => clients.find((client) => client.id === activeClientId) ?? clients[0] ?? seedClient, [clients, activeClientId, seedClient]);
  const importedWorkouts = activeClient?.importedWorkouts ?? [];
  const editedWorkoutRecords = activeClient?.editedWorkoutRecords ?? [];
  const activeSeedWorkouts = activeClient?.usesSeedData ? workouts : activeClient?.workouts ?? [];
  const activeWeeklyTargets = useMemo(() => {
    const sourceTargets = activeClient?.weeklyTargets?.length ? activeClient.weeklyTargets : activeClient?.usesSeedData ? weeklyTargets : [];
    return sourceTargets.map((week, index) => ({
      week: Number(week?.week ?? index + 1),
      calories: Number(week?.calories ?? 0) || 0,
      reportedCalories: week?.reportedCalories === null || week?.reportedCalories === undefined || week?.reportedCalories === "" ? Number(week?.calories ?? 0) || 0 : Number(week.reportedCalories),
      calorieThresholdPercent: week?.calorieThresholdPercent === null || week?.calorieThresholdPercent === undefined || week?.calorieThresholdPercent === "" ? DEFAULT_CALORIE_THRESHOLD_PERCENT : Number(week.calorieThresholdPercent),
      zoneMinutes: week?.zoneMinutes === null || week?.zoneMinutes === undefined || week?.zoneMinutes === "" ? week?.intensity === null || week?.intensity === undefined || week?.intensity === "" ? null : Number(week.intensity) : Number(week.zoneMinutes),
      zonePercent: week?.zonePercent === null || week?.zonePercent === undefined || week?.zonePercent === "" ? (week?.zoneMinutes === null || week?.zoneMinutes === undefined || week?.zoneMinutes === "" ? week?.intensity === null || week?.intensity === undefined || week?.intensity === "" ? null : DEFAULT_ZONE_THRESHOLD_PERCENT : DEFAULT_ZONE_THRESHOLD_PERCENT) : Number(week.zonePercent),
      reportedZoneMinutes: week?.reportedZoneMinutes === null || week?.reportedZoneMinutes === undefined || week?.reportedZoneMinutes === "" ? null : Number(week.reportedZoneMinutes),
    }));
  }, [activeClient]);

  useEffect(() => {
    setTrainerNotes(activeClient?.trainerNotes || trainerNotesExample);
    setPreviewWorkouts([]);
    setIntakeError("");
    setIntakeMessage("");
    setEditingWorkoutKey("");
    setEditingDraft(null);
    setWorkoutEditError("");
  }, [activeClient?.id]);

  useEffect(() => {
    if (!activeClient || trainerNotes === activeClient.trainerNotes) return;
    setClients((current) => updateClientRecord(current, activeClient.id, (client) => ({
      ...client,
      trainerNotes,
    })));
  }, [activeClient, trainerNotes]);

  const totalCalories = activeWeeklyTargets.reduce((sum, week) => sum + week.calories, 0);
  const avgCalories = activeWeeklyTargets.length > 0 ? Math.round(totalCalories / activeWeeklyTargets.length) : 0;
  const maxCaloriesWeek = activeWeeklyTargets.length > 0 ? activeWeeklyTargets.reduce((max, week) => week.calories > max.calories ? week : max, activeWeeklyTargets[0]) : null;
  const zoneTargetWeeks = activeWeeklyTargets.filter((week) => week.zoneMinutes !== null);
  const avgZoneMinutes = zoneTargetWeeks.length > 0 ? Math.round(zoneTargetWeeks.reduce((sum, week) => sum + (week.zoneMinutes ?? 0), 0) / zoneTargetWeeks.length) : 0;
  const latestWeeklyTarget = activeWeeklyTargets[activeWeeklyTargets.length - 1] ?? null;

  const updateActiveClient = (updater) => {
    if (!activeClient) return;
    setClients((current) => updateClientRecord(current, activeClient.id, updater));
  };

  const mergedWorkouts = useMemo(() => {
    const overriddenKeys = new Set(editedWorkoutRecords.map((entry) => entry.originalKey));
    const baseWorkouts = dedupeWorkoutList([...activeSeedWorkouts, ...importedWorkouts]).filter((workout) => !overriddenKeys.has(getWorkoutKey(workout)));
    return dedupeWorkoutList([...baseWorkouts, ...editedWorkoutRecords.map((entry) => entry.workout)]);
  }, [activeSeedWorkouts, editedWorkoutRecords, importedWorkouts]);
  const dashboardData = useMemo(() => buildAnalyticsData(mergedWorkouts), [mergedWorkouts]);
  const { structuredWorkouts, exerciseHistories, taxonomySummary, exerciseIndex, repeatedExercises, topGrowthLeaders, totalParsedSets, dominantGroup } = dashboardData;
  const previewStructuredWorkouts = useMemo(() => buildAnalyticsData(previewWorkouts).structuredWorkouts, [previewWorkouts]);
  const overviewInsights = useMemo(() => buildOverviewInsights(dashboardData, activeWeeklyTargets), [dashboardData, activeWeeklyTargets]);
  const cycleInsights = useMemo(() => buildCycleInsights(dashboardData, activeWeeklyTargets), [dashboardData, activeWeeklyTargets]);
  const taxonomyInsights = useMemo(() => buildTaxonomyInsights(dashboardData), [dashboardData]);
  const trainerPreviewModel = useMemo(() => buildTrainerPreviewModel(previewStructuredWorkouts, structuredWorkouts), [previewStructuredWorkouts, structuredWorkouts]);
  const editRecordLookup = useMemo(() => new Map(editedWorkoutRecords.map((entry) => [getWorkoutKey(entry.workout), entry])), [editedWorkoutRecords]);

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
    const result = parseTrainerNotes(trainerNotes, mergedWorkouts);
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
    const result = parseTrainerNotes(trainerNotes, mergedWorkouts);
    if (result.errors.length > 0) {
      setIntakeError(result.errors.join(" "));
      setIntakeMessage("");
      setPreviewWorkouts([]);
      return;
    }
    updateActiveClient((client) => ({
      ...client,
      importedWorkouts: dedupeWorkoutList([...(client.importedWorkouts ?? []), ...result.workouts]),
      trainerNotes,
    }));
    setPreviewWorkouts(result.workouts);
    setIntakeError("");
    setIntakeMessage(`Imported ${result.workouts.length} workout${result.workouts.length === 1 ? "" : "s"} into the dashboard.`);
  };

  const beginWorkoutEdit = (workout) => {
    setEditingWorkoutKey(getWorkoutKey(workout));
    setEditingDraft(createWorkoutDraft(workout));
    setWorkoutEditError("");
    setWorkoutEditMessage("");
  };

  const cancelWorkoutEdit = () => {
    setEditingWorkoutKey("");
    setEditingDraft(null);
    setWorkoutEditError("");
  };

  const updateWorkoutDraft = (field, value) => {
    setEditingDraft((current) => current ? { ...current, [field]: value } : current);
  };

  const updateCircuitDraft = (index, field, value) => {
    setEditingDraft((current) => current ? {
      ...current,
      circuits: current.circuits.map((circuit, circuitIndex) => circuitIndex === index ? { ...circuit, [field]: value } : circuit),
    } : current);
  };

  const addCircuitDraft = () => {
    setEditingDraft((current) => current ? {
      ...current,
      circuits: [...current.circuits, createEmptyCircuitDraft(current.circuits.length)],
    } : current);
  };

  const removeCircuitDraft = (index) => {
    setEditingDraft((current) => current ? {
      ...current,
      circuits: current.circuits.filter((_, circuitIndex) => circuitIndex !== index),
    } : current);
  };

  const saveWorkoutEdit = () => {
    if (!editingDraft || !editingWorkoutKey) return;
    const existingWorkout = structuredWorkouts.find((workout) => getWorkoutKey(workout) === editingWorkoutKey);
    const fallbackNumber = Number(existingWorkout?.workout) || Number(editingDraft.workout) || structuredWorkouts.length + 1;
    const result = parseWorkoutDraft(editingDraft, fallbackNumber);
    if (result.errors.length > 0) {
      setWorkoutEditError(result.errors.join(" "));
      setWorkoutEditMessage("");
      return;
    }
    updateActiveClient((client) => ({
      ...client,
      editedWorkoutRecords: [
        ...(client.editedWorkoutRecords ?? []).filter((entry) => entry.originalKey !== editingWorkoutKey),
        { originalKey: editingWorkoutKey, workout: result.workout },
      ],
    }));
    setWorkoutEditError("");
    setWorkoutEditMessage(`Saved edits for Workout ${result.workout.workout} · ${result.workout.date}.`);
    setEditingWorkoutKey("");
    setEditingDraft(null);
  };

  const revertWorkoutEdit = (workout) => {
    const editRecord = editRecordLookup.get(getWorkoutKey(workout));
    if (!editRecord) return;
    updateActiveClient((client) => ({
      ...client,
      editedWorkoutRecords: (client.editedWorkoutRecords ?? []).filter((entry) => entry.originalKey !== editRecord.originalKey),
    }));
    setWorkoutEditMessage(`Reverted edits for ${workout.title}.`);
    if (editingWorkoutKey === editRecord.originalKey) cancelWorkoutEdit();
  };

  const createClient = () => {
    const client = createBlankClient(newClientName);
    setClients((current) => [...current, client]);
    setActiveClientId(client.id);
    setNewClientName("");
    setClientMessage(`Added ${client.name}.`);
    setActiveTab("overview");
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

  const tabGroups = [
    {
      id: "analysis",
      label: "Analysis",
      subtitle: "Read the training story and spot patterns.",
      tabs: [["overview", "Overview"], ["progress", "Growth"], ["groups", "Taxonomy"]],
      tone: theme.surfaceStrong,
    },
    {
      id: "planning",
      label: "Planning",
      subtitle: "Review the log and the weekly target plan.",
      tabs: [["workouts", "Workout log"], ["weeks", "Weekly targets"]],
      tone: theme.surfaceStrong,
    },
    {
      id: "reference",
      label: "Reference",
      subtitle: "Lower-priority lookup tools and support views.",
      tabs: [["index", "Exercise index"]],
      tone: theme.surface,
    },
  ];
  const isMobile = viewportWidth < 760;
  const isTablet = viewportWidth < 1080;
  const isCompact = viewportWidth < 920;
  const pagePadding = isMobile ? 14 : isTablet ? 20 : 28;
  const pageSectionGap = isMobile ? 18 : 24;
  const chartHeight = isMobile ? 220 : 320;
  const cycleChartHeight = isMobile ? 210 : 240;
  const sectionCardGap = isMobile ? 16 : 20;
  const sectionGridStyle = { display: "grid", gap: pageSectionGap };
  const splitSectionStyle = { display: "grid", gridTemplateColumns: isCompact ? "minmax(0, 1fr)" : "minmax(0, 1.25fr) minmax(300px, 0.95fr)", gap: sectionCardGap, alignItems: "start" };
  const twoUpGridStyle = { display: "grid", gridTemplateColumns: isCompact ? "minmax(0, 1fr)" : "repeat(auto-fit, minmax(320px, 1fr))", gap: sectionCardGap };
  const cycleHeroGridStyle = { display: "grid", gridTemplateColumns: isCompact ? "minmax(0, 1fr)" : "minmax(0, 1.2fr) minmax(320px, 0.8fr)", gap: sectionCardGap, alignItems: "start" };
  const taxonomySplitStyle = { display: "grid", gridTemplateColumns: isCompact ? "minmax(0, 1fr)" : "minmax(0, 1.1fr) minmax(300px, 0.9fr)", gap: sectionCardGap, alignItems: "start" };
  const intakeSplitStyle = { display: "grid", gridTemplateColumns: isCompact ? "minmax(0, 1fr)" : "minmax(0, 1.25fr) minmax(280px, 0.9fr)", gap: sectionCardGap };
  const cycleHighlights = [
    {
      id: "microcycle",
      label: "Microcycle",
      title: cycleInsights.microcycle.label,
      detail: `${cycleInsights.microcycle.sessionCount || 0} sessions · ${cycleInsights.microcycle.totalSets} total sets`,
      accent: cycleInsights.microcycle.deltaPercent === null ? "No baseline yet" : `${cycleInsights.microcycle.deltaPercent > 0 ? "+" : ""}${cycleInsights.microcycle.deltaPercent}% vs prior microcycle`,
    },
    {
      id: "mesocycle",
      label: "Mesocycle",
      title: cycleInsights.mesocycle.currentBlock?.weekRange ?? "No block yet",
      detail: cycleInsights.mesocycle.currentBlock ? `${cycleInsights.mesocycle.currentBlock.totalCalories.toLocaleString()} target calories across the current 4-week block` : "Add weekly targets to surface rolling blocks.",
      accent: cycleInsights.mesocycle.currentBlock?.deltaPercent === null || cycleInsights.mesocycle.currentBlock?.deltaPercent === undefined ? "First block on record" : `${cycleInsights.mesocycle.currentBlock.deltaPercent > 0 ? "+" : ""}${cycleInsights.mesocycle.currentBlock.deltaPercent}% vs prior block`,
    },
    {
      id: "macrocycle",
      label: "Macrocycle",
      title: `${cycleInsights.macrocycle.totalWeeks} tracked weeks`,
      detail: latestWeeklyTarget ? `Latest plan: ${latestWeeklyTarget.calories.toLocaleString()} calories and ${formatZoneTarget(latestWeeklyTarget).toLowerCase()}` : cycleInsights.macrocycle.peakWeek ? `Peak week: Week ${cycleInsights.macrocycle.peakWeek.week} at ${cycleInsights.macrocycle.peakWeek.calories.toLocaleString()} calories` : "Add weekly targets to map the long arc.",
      accent: cycleInsights.macrocycle.deltaPercent === null ? "No start-to-now delta yet" : `${cycleInsights.macrocycle.deltaPercent > 0 ? "+" : ""}${cycleInsights.macrocycle.deltaPercent}% from start to latest week`,
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(180deg, ${theme.backgroundAccent} 0%, ${theme.background} 100%)`, padding: pagePadding, fontFamily: "Arial, Helvetica, sans-serif", color: theme.text }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "inline-block", padding: "6px 12px", borderRadius: 999, background: theme.accentSoft, color: theme.accentStrong, border: `1px solid ${theme.border}`, fontSize: 12, fontWeight: 600, marginBottom: 12 }}>Structured Training Archive</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ flex: "1 1 700px" }}>
              <h1 style={{ margin: 0, fontSize: isMobile ? 30 : isTablet ? 34 : 40, lineHeight: 1.1, color: theme.text }}>Workout Taxonomy & Growth Dashboard</h1>
              <p style={{ margin: "12px 0 0", maxWidth: 900, color: theme.textSoft, lineHeight: 1.65 }}>Now scoped to <strong style={{ color: theme.text }}>{activeClient?.name}</strong>, with client-specific imports, edits, targets, and trainer notes.</p>
            </div>
            <div style={{ width: "100%", maxWidth: isMobile ? "100%" : 360 }}>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search exercises, groups, workouts..." style={{ width: "100%", padding: "12px 14px", borderRadius: 14, border: `1px solid ${theme.border}`, fontSize: 14, boxSizing: "border-box", background: theme.surface, color: theme.text, boxShadow: theme.shadow }} />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: isMobile ? 26 : 36 }}>
          <SectionCard title="Client workspace" subtitle="Switch between client records here. Database-backed storage is the next step after this local multi-client layer.">
            <div style={{ display: "grid", gap: 16 }}>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "end" }}>
                <label style={{ display: "grid", gap: 6, minWidth: 240, flex: "1 1 260px", fontSize: 13, color: theme.textSoft }}>
                  Active client
                  <select value={activeClientId} onChange={(event) => { setActiveClientId(event.target.value); setClientMessage(""); }} style={{ padding: "11px 12px", borderRadius: 12, border: `1px solid ${theme.border}`, background: theme.surfaceStrong, color: theme.text }}>
                    {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                  </select>
                </label>
                <label style={{ display: "grid", gap: 6, minWidth: 220, flex: "1 1 220px", fontSize: 13, color: theme.textSoft }}>
                  New client
                  <input value={newClientName} onChange={(event) => setNewClientName(event.target.value)} placeholder="Client name" style={{ padding: "11px 12px", borderRadius: 12, border: `1px solid ${theme.border}`, background: theme.surfaceStrong, color: theme.text }} />
                </label>
                <button type="button" onClick={createClient} disabled={!newClientName.trim()} style={{ border: `1px solid ${theme.borderStrong}`, background: newClientName.trim() ? theme.accent : theme.surfaceMuted, color: newClientName.trim() ? "#f4f6f1" : theme.textMuted, borderRadius: 12, padding: "11px 14px", cursor: newClientName.trim() ? "pointer" : "not-allowed", fontWeight: 600 }}>Create client</button>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", color: theme.textSoft, fontSize: 13 }}>
                <span>{clients.length} client{clients.length === 1 ? "" : "s"} loaded</span>
                <span>•</span>
                <span>{structuredWorkouts.length} workouts for {activeClient?.name}</span>
                <span>•</span>
                <span>{activeWeeklyTargets.length} weekly target rows</span>
              </div>

              <div style={{ border: `1px solid ${theme.border}`, borderRadius: 14, padding: 14, background: theme.surface, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ display: "grid", gap: 4 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.45, color: theme.textMuted }}>Trainer-specific actions</div>
                  <div style={{ fontSize: 13, color: theme.textSoft }}>Upload and parse trainer notes before merging them into this client’s log.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("intake")}
                  style={{ border: `1px solid ${theme.borderStrong}`, background: theme.accent, color: "#f4f6f1", borderRadius: 12, padding: "10px 14px", cursor: "pointer", fontWeight: 700, whiteSpace: "nowrap" }}
                >
                  Upload trainer notes
                </button>
              </div>

              {clientMessage ? <div style={{ border: `1px solid ${insightTones.positive.border}`, background: insightTones.positive.background, color: insightTones.positive.accent, borderRadius: 12, padding: 12 }}>{clientMessage}</div> : null}
            </div>
          </SectionCard>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? 180 : 220}px, 1fr))`, gap: isMobile ? 14 : 18, marginBottom: 28 }}>
          {overviewInsights.summaryCards.map((card) => (
            <InsightStatCard key={card.id} label={card.label} value={card.value} subtitle={card.subtitle} tone={card.tone} />
          ))}
        </div>

        <div style={{ display: "grid", gap: 14, marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.45, color: theme.textMuted }}>Client-accessible navigation</div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? 220 : 250}px, 1fr))`, gap: 14 }}>
            {tabGroups.map((group) => {
              const isGroupActive = group.tabs.some(([value]) => value === activeTab);
              return (
                <div key={group.id} style={{ border: `1px solid ${isGroupActive ? theme.borderStrong : theme.border}`, borderRadius: 18, padding: 16, background: group.tone, boxShadow: isGroupActive ? theme.shadow : "none", display: "grid", gap: 12, alignContent: "start" }}>
                  <div style={{ display: "grid", gap: 4 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.45, color: isGroupActive ? theme.accentStrong : theme.textMuted }}>{group.label}</div>
                    <div style={{ fontSize: 13, lineHeight: 1.5, color: theme.textSoft }}>{group.subtitle}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {group.tabs.map(([value, label]) => {
                      const isActive = activeTab === value;
                      const isReference = group.id === "reference";
                      return <button key={value} type="button" onClick={() => setActiveTab(value)} style={{ border: `1px solid ${isActive ? theme.borderStrong : theme.border}`, background: isActive ? theme.accent : isReference ? theme.surfaceStrong : theme.surface, color: isActive ? "#f4f6f1" : theme.text, borderRadius: 14, padding: isMobile ? "9px 12px" : "10px 14px", cursor: "pointer", fontWeight: 600, boxShadow: isActive ? theme.shadow : "none", fontSize: isMobile ? 13 : 14, opacity: isReference && !isActive ? 0.92 : 1 }}>{label}</button>;
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {activeTab === "overview" && (
          <div style={sectionGridStyle}>
            <SectionCard title="What stands out" subtitle="A quick read on what changed, what is working, and where the plan is getting narrow.">
              <div style={splitSectionStyle}>
                <div style={{ display: "grid", gap: 16 }}>
                  {overviewInsights.callouts.map((callout) => (
                    <InsightCalloutCard key={callout.id} title={callout.title} body={callout.body} tone={callout.tone} />
                  ))}
                </div>
                <div style={{ display: "grid", gap: 16 }}>
                  <div style={{ border: `1px solid ${theme.border}`, borderRadius: 16, padding: 18, background: theme.surfaceStrong, display: "grid", gap: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: theme.textMuted }}>Recent focus</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {overviewInsights.latestFocus.length > 0 ? overviewInsights.latestFocus.map((label) => (
                        <span key={label} style={{ display: "inline-flex", alignItems: "center", borderRadius: 999, padding: "7px 11px", background: theme.surface, border: `1px solid ${theme.border}`, color: theme.text, fontSize: 13, fontWeight: 600 }}>{label}</span>
                      )) : <span style={{ color: theme.textSoft, fontSize: 14 }}>No recent focus yet.</span>}
                    </div>
                  </div>
                  <div style={{ border: `1px solid ${theme.border}`, borderRadius: 16, padding: 18, background: theme.surfaceStrong, display: "grid", gap: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: theme.textMuted }}>Weekly calorie plan</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: theme.text }}>{overviewInsights.calorieTrend.recentCalories.toLocaleString()}</div>
                    <div style={{ color: theme.textSoft, lineHeight: 1.5 }}>{overviewInsights.calorieTrend.latestWindowLabel ? `${overviewInsights.calorieTrend.latestWindowLabel} target calories` : "No target window yet"}</div>
                    <div style={{ color: theme.textMuted, fontSize: 13 }}>{overviewInsights.calorieTrend.previousCalories > 0 ? `${overviewInsights.calorieTrend.deltaPercent > 0 ? "+" : ""}${overviewInsights.calorieTrend.deltaPercent ?? 0}% vs prior 4-week block` : maxCaloriesWeek ? `Peak week remains Week ${maxCaloriesWeek.week} at ${maxCaloriesWeek.calories.toLocaleString()} calories.` : "No weekly target history yet."}</div>
                  </div>
                </div>
              </div>
            </SectionCard>
            <SectionCard title="Cycle snapshot" subtitle="A compact read on the current micro, meso, and macrocycle patterns, with `>40%` calorie reporting and `>90% HR` zone targets assumed unless the trainer sets a different threshold.">
              <div style={{ display: "grid", gap: isMobile ? 14 : 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ display: "grid", gap: 6, maxWidth: 760 }}>
                    <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: theme.text }}>Cycle context stays summarized here for now.</div>
                    <div style={{ fontSize: 14, color: theme.textSoft, lineHeight: 1.6 }}>This keeps the current dashboard focused while still showing the weekly calorie goal, the target heart-rate zone minutes, and the longer calorie arc at a glance. The default assumption is calories above 40% HR and zone work above 90% HR unless Ryan sets a different threshold for that week.</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
                  {cycleHighlights.map((highlight) => (
                    <div key={highlight.id} style={{ border: `1px solid ${theme.border}`, borderRadius: 18, padding: 18, background: theme.surfaceStrong, display: "grid", gap: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.45, color: theme.textMuted }}>{highlight.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: theme.text }}>{highlight.title}</div>
                      <div style={{ fontSize: 14, color: theme.textSoft, lineHeight: 1.55 }}>{highlight.detail}</div>
                      <div style={{ fontSize: 13, color: theme.accentStrong, fontWeight: 600 }}>{highlight.accent}</div>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>
            <div style={twoUpGridStyle}>
              <SectionCard title="Calorie goals by week">
                <div style={{ height: chartHeight }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activeWeeklyTargets}><CartesianGrid strokeDasharray="3 3" stroke={theme.border} /><XAxis dataKey="week" stroke={theme.textMuted} /><YAxis stroke={theme.textMuted} /><Tooltip contentStyle={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 14, color: theme.text }} /><Line type="monotone" dataKey="calories" stroke={theme.accentStrong} strokeWidth={3} dot={{ fill: theme.accentStrong, stroke: theme.surface, r: 4 }} /></LineChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>
              <SectionCard title="Target-zone minutes">
                <div style={{ height: chartHeight }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activeWeeklyTargets.filter((week) => week.zoneMinutes !== null)}><CartesianGrid strokeDasharray="3 3" stroke={theme.border} /><XAxis dataKey="week" stroke={theme.textMuted} /><YAxis stroke={theme.textMuted} /><Tooltip formatter={(value, _name, payload) => [`${value} min`, payload?.payload?.zonePercent !== null && payload?.payload?.zonePercent !== undefined ? `Over ${payload.payload.zonePercent}% HR` : "Target-zone minutes"]} contentStyle={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 14, color: theme.text }} /><Bar dataKey="zoneMinutes" fill={theme.accent} radius={[10, 10, 0, 0]} /></BarChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>
            </div>
            <SectionCard title="Growth highlights" subtitle="Repeated movement buckets with the clearest progression signal.">
              <div style={{ display: "grid", gap: 14 }}>
                {topGrowthLeaders.map((history) => (
                  <div key={history.canonicalName} style={{ border: `1px solid ${theme.border}`, borderRadius: 16, padding: 16, background: theme.surface }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontWeight: 700, color: theme.text }}>{history.name}</div>
                        <div style={{ fontSize: 13, color: theme.textSoft, marginTop: 4 }}>{history.exampleExerciseName}</div>
                      </div>
                      <GroupBadge family={history.taxonomy.family} group={history.taxonomy.group} />
                    </div>
                    <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {history.latest.trend?.hasRepData ? <TrendPill label="Best reps" delta={history.latest.trend.repDelta} /> : history.latest.trend?.hasTimeData ? <TrendPill label="Best hold" delta={history.latest.trend.timeDelta} suffix="s" /> : <TrendPill label="Best reps" delta={null} emptyLabel="No prior log" />}
                      <TrendPill label="Load" delta={history.latest.trend?.loadDelta ?? null} suffix=" lb" />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        )}

        {activeTab === "cycles" && (
          <div style={sectionGridStyle}>
            <SectionCard title="Cycle dashboard" subtitle="Dedicated microcycle, mesocycle, and macrocycle context so it does not get lost inside the other tabs.">
              <div style={{ display: "grid", gap: sectionCardGap }}>
                <div style={cycleHeroGridStyle}>
                  <div style={{ border: `1px solid ${theme.border}`, borderRadius: 18, padding: 20, background: theme.surfaceStrong, display: "grid", gap: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.45, color: theme.textMuted }}>Cycle headline</div>
                    <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, color: theme.text }}>Current block: {cycleInsights.mesocycle.currentBlock?.weekRange ?? "No mesocycle block yet"}</div>
                    <div style={{ fontSize: 15, color: theme.textSoft, lineHeight: 1.65 }}>Recent sessions are tracking as a microcycle from {cycleInsights.microcycle.label}. Weekly targets roll into 4-week mesocycles, while the macrocycle shows the full calorie climb from the first logged week to the latest one.</div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <MetricChip label="Microcycle sets" value={cycleInsights.microcycle.totalSets} />
                      <MetricChip label="Current block calories" value={cycleInsights.mesocycle.currentBlock ? cycleInsights.mesocycle.currentBlock.totalCalories.toLocaleString() : "n/a"} />
                      <MetricChip label="Macrocycle total" value={cycleInsights.macrocycle.totalCalories.toLocaleString()} />
                    </div>
                  </div>
                  <div style={{ display: "grid", gap: 14 }}>
                    {cycleHighlights.map((highlight) => (
                      <div key={highlight.id} style={{ border: `1px solid ${theme.border}`, borderRadius: 16, padding: 18, background: theme.surface, boxShadow: theme.shadow, display: "grid", gap: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.45, color: theme.textMuted }}>{highlight.label}</div>
                        <div style={{ fontSize: 17, fontWeight: 700, color: theme.text }}>{highlight.title}</div>
                        <div style={{ fontSize: 13, color: theme.textSoft, lineHeight: 1.55 }}>{highlight.detail}</div>
                        <div style={{ fontSize: 13, color: theme.accentStrong, fontWeight: 600 }}>{highlight.accent}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? 180 : 220}px, 1fr))`, gap: 14 }}>
                  {cycleInsights.mesocycle.blocks.map((block) => (
                    <div key={block.id} style={{ border: `1px solid ${theme.border}`, borderRadius: 16, padding: 16, background: theme.surface, display: "grid", gap: 10, boxShadow: theme.shadow }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                        <div style={{ fontWeight: 700, color: theme.text }}>{block.label}</div>
                        <span style={{ fontSize: 12, color: theme.textMuted }}>{block.weekRange}</span>
                      </div>
                      <div style={{ fontSize: 14, color: theme.textSoft }}>{block.totalCalories.toLocaleString()} target calories · avg {block.avgCalories.toLocaleString()}</div>
                      <div style={{ fontSize: 13, color: theme.textMuted }}>{block.avgZoneMinutes ?? "n/a"} min avg in target zone{block.latestZonePercent !== null ? ` over ${block.latestZonePercent}% HR` : ""} · peak Week {block.peakWeek.week}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: block.deltaPercent !== null && block.deltaPercent < 0 ? insightTones.warning.accent : theme.accentStrong }}>{block.deltaPercent === null ? "Baseline block" : `${block.deltaPercent > 0 ? "+" : ""}${block.deltaPercent}% vs prior block`}</div>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>

            <div style={twoUpGridStyle}>
              <SectionCard title="Microcycle" subtitle="The last three sessions and the focus groups driving them.">
                <div style={{ display: "grid", gap: 14 }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <MetricChip label="Avg sets" value={cycleInsights.microcycle.avgSets} />
                    <MetricChip label="Load shift" value={cycleInsights.microcycle.deltaPercent === null ? "n/a" : `${cycleInsights.microcycle.deltaPercent > 0 ? "+" : ""}${cycleInsights.microcycle.deltaPercent}%`} />
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {cycleInsights.microcycle.focus.length > 0 ? cycleInsights.microcycle.focus.map((focus) => <span key={focus} style={{ display: "inline-flex", alignItems: "center", borderRadius: 999, padding: "7px 11px", background: theme.surfaceStrong, border: `1px solid ${theme.border}`, color: theme.text, fontSize: 13, fontWeight: 600 }}>{focus}</span>) : <span style={{ color: theme.textSoft, fontSize: 13 }}>No focus tags yet.</span>}
                  </div>
                  <div style={{ height: cycleChartHeight }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={cycleInsights.microcycle.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                        <XAxis dataKey="label" stroke={theme.textMuted} tick={{ fontSize: 12 }} />
                        <YAxis stroke={theme.textMuted} />
                        <Tooltip contentStyle={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 14, color: theme.text }} />
                        <Bar dataKey="sets" fill={theme.accentStrong} radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Mesocycles" subtitle="Rolling 4-week blocks help show whether the weekly targets are ramping or tapering.">
                <div style={{ display: "grid", gap: 14 }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <MetricChip label="Avg calories" value={cycleInsights.mesocycle.currentBlock ? cycleInsights.mesocycle.currentBlock.avgCalories.toLocaleString() : "n/a"} />
                    <MetricChip label="Avg zone min" value={cycleInsights.mesocycle.currentBlock?.avgZoneMinutes ?? "n/a"} />
                  </div>
                  <div style={{ height: cycleChartHeight }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={cycleInsights.mesocycle.blocks}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                        <XAxis dataKey="label" stroke={theme.textMuted} tick={{ fontSize: 12 }} />
                        <YAxis stroke={theme.textMuted} />
                        <Tooltip contentStyle={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 14, color: theme.text }} />
                        <Bar dataKey="totalCalories" fill={theme.accent} radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Macrocycle" subtitle="A cumulative look at the longer runway, not just the latest week.">
                <div style={{ display: "grid", gap: 14 }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <MetricChip label="Total calories" value={cycleInsights.macrocycle.totalCalories.toLocaleString()} />
                    <MetricChip label="Start → now" value={cycleInsights.macrocycle.deltaPercent === null ? "n/a" : `${cycleInsights.macrocycle.deltaPercent > 0 ? "+" : ""}${cycleInsights.macrocycle.deltaPercent}%`} />
                  </div>
                  <div style={{ height: cycleChartHeight }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={cycleInsights.macrocycle.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                        <XAxis dataKey="week" stroke={theme.textMuted} tick={{ fontSize: 12 }} />
                        <YAxis stroke={theme.textMuted} />
                        <Tooltip contentStyle={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 14, color: theme.text }} />
                        <Line type="monotone" dataKey="cumulativeCalories" stroke={theme.accentStrong} strokeWidth={3} dot={{ fill: theme.accentStrong, stroke: theme.surface, r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>
        )}

        {activeTab === "progress" && <SectionCard title="Exercise progress cards" subtitle="Repeated movement patterns, first-to-latest session history, and progression markers."><div style={{ display: "grid", gap: 16 }}>{filteredHistories.map((history) => <ExerciseHistoryCard key={history.canonicalName} history={history} />)}</div></SectionCard>}

        {activeTab === "groups" && (
          <div style={sectionGridStyle}>
            <SectionCard title="Balance snapshot" subtitle="Spot where volume is concentrated, where coverage drops off, and which buckets are driving the split.">
              <div style={taxonomySplitStyle}>
                <div style={{ display: "grid", gap: 16 }}>
                  {taxonomyInsights.familyDistribution.map((family) => {
                    const tone = familyColors[family.family] ?? familyColors.Mixed;
                    return <DistributionBar key={family.family} label={family.family} detail={`${family.totalSets} sets across ${family.groupCount} groups`} percent={family.share} color={tone.color} />;
                  })}
                </div>
                <div style={{ display: "grid", gap: 16 }}>
                  {taxonomyInsights.balanceNotes.map((note) => <InsightCalloutCard key={note.id} title={note.title} body={note.body} tone={note.tone} />)}
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Neglected groups" subtitle="Movement buckets that have gone quiet relative to the rest of the log.">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                {taxonomyInsights.neglectedGroups.map((group) => (
                  <div key={`${group.family}-${group.group}-neglected`} style={{ border: `1px solid ${theme.border}`, borderRadius: 16, padding: 18, background: theme.surfaceStrong, display: "grid", gap: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontWeight: 700, color: theme.text }}>{group.group}</div>
                        <div style={{ fontSize: 13, color: theme.textSoft }}>{group.family}</div>
                      </div>
                      <div style={{ fontSize: 12, color: theme.textMuted }}>{group.share}% of sets</div>
                    </div>
                    <div style={{ fontSize: 13, color: theme.textSoft }}>{group.totalSets} sets · {group.sessionCount} appearances</div>
                    <div style={{ fontSize: 13, color: theme.textMuted }}>Last emphasized {group.latestDateLabel} · {group.daysSinceLatest} day gap</div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Taxonomy groups" subtitle="Detailed movement buckets with volume, coverage, and top exercise examples.">
              <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? 220 : 280}px, 1fr))`, gap: 20, alignItems: "start" }}>
                {filteredGroups.map((group) => (
                  <div key={`${group.family}-${group.group}`} style={{ border: `1px solid ${theme.border}`, borderRadius: 18, padding: 20, display: "grid", gap: 14, background: theme.surface, boxShadow: theme.shadow, alignContent: "start" }}>
                    {renderGroupHeader(group)}
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 14, color: theme.textSoft }}>
                      <span>{group.exerciseCount} movements</span>
                      <span>{group.sessionCount} appearances</span>
                      <span>{group.totalSets} sets</span>
                      <span>{Math.round((group.totalSets / Math.max(totalParsedSets, 1)) * 100)}% of all parsed sets</span>
                    </div>
                    <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
                      {group.topExercises.slice(0, 5).map((exercise) => (
                        <div key={exercise.canonicalName} style={{ border: `1px solid ${theme.border}`, borderRadius: 14, padding: 14, background: theme.surfaceStrong }}>
                          <div style={{ fontWeight: 600, color: theme.text }}>{exercise.name}</div>
                          <div style={{ marginTop: 4, fontSize: 13, color: theme.textSoft }}>{exercise.sessionCount} sessions · best load {formatLoad(exercise.bestLoad)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        )}

        {activeTab === "workouts" && (
          <SectionCard title="Structured workout log" subtitle="Review, edit, and refine workouts directly from the log without overwriting the original seed data.">
            <div style={{ display: "grid", gap: 18 }}>
              {workoutEditError ? <div style={{ border: `1px solid ${insightTones.warning.border}`, background: insightTones.warning.background, color: insightTones.warning.accent, borderRadius: 12, padding: 12 }}>{workoutEditError}</div> : null}
              {workoutEditMessage ? <div style={{ border: `1px solid ${insightTones.positive.border}`, background: insightTones.positive.background, color: insightTones.positive.accent, borderRadius: 12, padding: 12 }}>{workoutEditMessage}</div> : null}
              {filteredWorkouts.map((workout) => {
                const workoutKey = getWorkoutKey(workout);
                const isEditing = editingWorkoutKey === workoutKey;
                const editRecord = editRecordLookup.get(workoutKey);
                return (
                  <details key={workoutKey} style={{ border: `1px solid ${theme.border}`, borderRadius: 16, padding: 16, background: theme.surface }}>
                    <summary style={{ cursor: "pointer" }}>
                      <div style={{ display: "inline-block" }}>
                        <div style={{ fontWeight: 600, color: theme.text }}>Workout {workout.workout} · {workout.dateLabel}</div>
                        <div style={{ fontSize: 14, color: theme.textSoft, marginTop: 4 }}>{workout.title}</div>
                      </div>
                    </summary>
                    <div style={{ display: "grid", gap: 18, marginTop: 18 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <MetricChip label="Circuits" value={workout.circuits.length} />
                          <MetricChip label="Exercises" value={workout.exercises.length} />
                          <MetricChip label="Parsed sets" value={workout.totalSets} />
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {editRecord ? <span style={{ display: "inline-flex", alignItems: "center", borderRadius: 999, padding: "7px 11px", border: `1px solid ${theme.border}`, background: theme.accentSoft, color: theme.accentStrong, fontSize: 12, fontWeight: 700 }}>Edited</span> : null}
                          <button type="button" onClick={() => beginWorkoutEdit(workout)} style={{ border: `1px solid ${theme.border}`, background: theme.surfaceStrong, borderRadius: 12, padding: "10px 14px", cursor: "pointer", fontWeight: 600, color: theme.text }}>{isEditing ? "Editing" : "Edit workout"}</button>
                          {editRecord ? <button type="button" onClick={() => revertWorkoutEdit(workout)} style={{ border: `1px solid ${theme.border}`, background: theme.surface, borderRadius: 12, padding: "10px 14px", cursor: "pointer", fontWeight: 600, color: theme.textSoft }}>Restore original</button> : null}
                        </div>
                      </div>

                      {isEditing && editingDraft ? (
                        <div style={{ border: `1px solid ${theme.border}`, borderRadius: 16, padding: 16, background: theme.surfaceStrong, display: "grid", gap: 14 }}>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                            <label style={{ display: "grid", gap: 6, fontSize: 13, color: theme.textSoft }}>
                              Workout #
                              <input value={editingDraft.workout} onChange={(event) => updateWorkoutDraft("workout", event.target.value)} style={{ padding: "10px 12px", borderRadius: 12, border: `1px solid ${theme.border}`, background: theme.surface, color: theme.text }} />
                            </label>
                            <label style={{ display: "grid", gap: 6, fontSize: 13, color: theme.textSoft }}>
                              Date
                              <input value={editingDraft.date} onChange={(event) => updateWorkoutDraft("date", event.target.value)} style={{ padding: "10px 12px", borderRadius: 12, border: `1px solid ${theme.border}`, background: theme.surface, color: theme.text }} />
                            </label>
                            <label style={{ display: "grid", gap: 6, fontSize: 13, color: theme.textSoft, gridColumn: "span 2" }}>
                              Title
                              <input value={editingDraft.title} onChange={(event) => updateWorkoutDraft("title", event.target.value)} style={{ padding: "10px 12px", borderRadius: 12, border: `1px solid ${theme.border}`, background: theme.surface, color: theme.text }} />
                            </label>
                          </div>
                          <div style={{ display: "grid", gap: 12 }}>
                            {editingDraft.circuits.map((circuit, circuitIndex) => (
                              <div key={`${workoutKey}-draft-${circuitIndex}`} style={{ border: `1px solid ${theme.border}`, borderRadius: 14, padding: 14, background: theme.surface, display: "grid", gap: 10 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                                  <label style={{ display: "grid", gap: 6, flex: "1 1 260px", fontSize: 13, color: theme.textSoft }}>
                                    Circuit name
                                    <input value={circuit.name} onChange={(event) => updateCircuitDraft(circuitIndex, "name", event.target.value)} style={{ padding: "10px 12px", borderRadius: 12, border: `1px solid ${theme.border}`, background: theme.surfaceStrong, color: theme.text }} />
                                  </label>
                                  <button type="button" onClick={() => removeCircuitDraft(circuitIndex)} style={{ border: `1px solid ${theme.border}`, background: theme.surfaceStrong, borderRadius: 12, padding: "9px 12px", cursor: "pointer", fontWeight: 600, color: theme.textSoft }}>Remove circuit</button>
                                </div>
                                <label style={{ display: "grid", gap: 6, fontSize: 13, color: theme.textSoft }}>
                                  Exercise lines
                                  <textarea value={circuit.itemsText} onChange={(event) => updateCircuitDraft(circuitIndex, "itemsText", event.target.value)} spellCheck={false} style={{ minHeight: 120, resize: "vertical", padding: 12, borderRadius: 12, border: `1px solid ${theme.border}`, background: theme.surfaceStrong, color: theme.text, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", lineHeight: 1.5 }} />
                                </label>
                              </div>
                            ))}
                          </div>
                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            <button type="button" onClick={addCircuitDraft} style={{ border: `1px solid ${theme.border}`, background: theme.surface, borderRadius: 12, padding: "10px 14px", cursor: "pointer", fontWeight: 600, color: theme.text }}>Add circuit</button>
                            <button type="button" onClick={saveWorkoutEdit} style={{ border: `1px solid ${theme.borderStrong}`, background: theme.accent, color: "#f4f6f1", borderRadius: 12, padding: "10px 14px", cursor: "pointer", fontWeight: 600 }}>Save changes</button>
                            <button type="button" onClick={cancelWorkoutEdit} style={{ border: `1px solid ${theme.border}`, background: theme.surfaceStrong, borderRadius: 12, padding: "10px 14px", cursor: "pointer", fontWeight: 600, color: theme.textSoft }}>Cancel</button>
                          </div>
                        </div>
                      ) : null}

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18 }}>
                        {workout.circuits.map((circuit, circuitIndex) => (
                          <div key={`${workout.workout}-${workout.date}-${circuit.name}-${circuitIndex}`} style={{ border: `1px solid ${theme.border}`, borderRadius: 16, padding: 16, display: "grid", gap: 14, background: theme.surfaceStrong }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                              <h4 style={{ margin: 0, fontSize: 16, color: theme.text }}>{circuit.name}</h4>
                              <span style={{ fontSize: 12, color: theme.textMuted }}>{circuit.totalSets} sets</span>
                            </div>
                            <div style={{ display: "grid", gap: 14 }}>
                              {circuit.exercises.map((exercise) => (
                                <div key={exercise.id} style={{ border: `1px solid ${theme.border}`, borderRadius: 14, padding: 14, background: theme.surface, display: "grid", gap: 10 }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                                    <div>
                                      <div style={{ fontWeight: 700, color: theme.text }}>{exercise.movementLabel}</div>
                                      <div style={{ fontSize: 13, color: theme.textSoft, marginTop: 4 }}>{exercise.name}</div>
                                      {exercise.trend?.previousDateLabel ? <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>Compared with {exercise.trend.previousDateLabel}</div> : <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>First appearance in the current log</div>}
                                    </div>
                                    <GroupBadge family={exercise.taxonomy.family} group={exercise.taxonomy.group} compact />
                                  </div>
                                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                    {exercise.trend?.hasRepData ? <TrendPill label="Best reps" delta={exercise.trend.repDelta} compact /> : exercise.trend?.hasTimeData ? <TrendPill label="Best hold" delta={exercise.trend.timeDelta} suffix="s" compact /> : <TrendPill label="Best reps" delta={null} emptyLabel="No prior log" compact />}
                                    <TrendPill label="Load" delta={exercise.trend?.loadDelta ?? null} suffix=" lb" compact />
                                  </div>
                                  <div style={{ display: "grid", gap: 6, color: theme.textSoft, fontSize: 14 }}>{exercise.variations.map((variation) => <div key={variation.id}>{variation.summary}</div>)}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </details>
                );
              })}
            </div>
          </SectionCard>
        )}

        {activeTab === "index" && <SectionCard title="Exercise index" subtitle="Movement buckets with example exercises and total session counts."><div style={{ maxHeight: 620, overflow: "auto", paddingRight: 4 }}><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>{exerciseIndex.filter((exercise) => !query.trim() || normalizeText(`${exercise.name} ${exercise.family} ${exercise.group} ${exercise.exampleExerciseName}`).includes(normalizeText(query))).map((exercise) => <div key={`${exercise.family}-${exercise.group}-${exercise.name}`} style={{ border: `1px solid ${theme.border}`, borderRadius: 16, padding: 14, display: "grid", gap: 8, background: theme.surfaceStrong }}><div style={{ fontWeight: 600, color: theme.text }}>{exercise.name}</div><div style={{ fontSize: 13, color: theme.textSoft }}>{exercise.exampleExerciseName}</div><GroupBadge family={exercise.family} group={exercise.group} /><div style={{ fontSize: 13, color: theme.textMuted }}>{exercise.sessionCount} session{exercise.sessionCount === 1 ? "" : "s"}</div></div>)}</div></div></SectionCard>}

        {activeTab === "intake" && <div style={{ display: "grid", gap: 18 }}><SectionCard title="Trainer note intake" subtitle={`Paste coach notes for ${activeClient?.name}, preview the parse, and merge them into this client's dashboard.`}><div style={intakeSplitStyle}><div style={{ display: "grid", gap: 12 }}><textarea value={trainerNotes} onChange={(event) => setTrainerNotes(event.target.value)} spellCheck={false} style={{ width: "100%", minHeight: isMobile ? 320 : 420, resize: "vertical", padding: 14, borderRadius: 14, border: `1px solid ${theme.border}`, background: theme.surfaceStrong, color: theme.text, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 13, lineHeight: 1.6, boxSizing: "border-box" }} /><div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}><button type="button" onClick={previewTrainerNotes} style={{ border: `1px solid ${theme.border}`, background: theme.surface, borderRadius: 12, padding: "10px 14px", cursor: "pointer", fontWeight: 600, color: theme.text }}>Preview parse</button><button type="button" onClick={importTrainerNotes} style={{ border: `1px solid ${theme.borderStrong}`, background: theme.accent, color: "#f4f6f1", borderRadius: 12, padding: "10px 14px", cursor: "pointer", fontWeight: 600 }}>Import workouts</button></div>{intakeError ? <div style={{ border: "1px solid #d5c5c0", background: "#e8ddda", color: "#7e645e", borderRadius: 12, padding: 12 }}>{intakeError}</div> : null}{intakeMessage ? <div style={{ border: "1px solid #c2cec0", background: "#d9e4d7", color: "#567053", borderRadius: 12, padding: 12 }}>{intakeMessage}</div> : null}</div><div style={{ border: `1px solid ${theme.border}`, borderRadius: 16, padding: 18, background: theme.surfaceStrong, display: "grid", gap: 12 }}><div style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>Flexible parser cues</div><div style={{ fontSize: 13, color: theme.textSoft, lineHeight: 1.65 }}>The parser handles loose headers, shorthand like `3x10`, unbulleted exercise rows, and section labels like `Warm Up`, `Circuit`, or `Finisher`.</div><pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12, lineHeight: 1.6, color: theme.textSoft }}>{trainerNotesExample}</pre></div></div></SectionCard><SectionCard title="Parsed preview" subtitle="Review confidence, structure, and flagged items before importing.">{previewStructuredWorkouts.length === 0 ? <div style={{ color: theme.textSoft }}>No preview yet. Paste notes and click `Preview parse`.</div> : <div style={{ display: "grid", gap: 18 }}><div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? 180 : 220}px, 1fr))`, gap: 14 }}><InsightStatCard label="Previewed workouts" value={previewStructuredWorkouts.length} subtitle={`${trainerPreviewModel.totalWarnings} flagged review item${trainerPreviewModel.totalWarnings === 1 ? "" : "s"}`} tone={trainerPreviewModel.totalWarnings > 0 ? "warning" : "positive"} /><InsightStatCard label="Average confidence" value={`${trainerPreviewModel.averageConfidenceScore}%`} subtitle="Higher scores reflect cleaner structure and fewer review flags" tone={trainerPreviewModel.averageConfidenceScore >= 80 ? "positive" : trainerPreviewModel.averageConfidenceScore >= 55 ? "neutral" : "warning"} /><InsightStatCard label="Existing workouts" value={structuredWorkouts.length} subtitle="Used to flag duplicate dates or workout numbers" tone="neutral" /></div>{trainerPreviewModel.cards.map((card) => <div key={card.id} style={{ border: `1px solid ${theme.border}`, borderRadius: 18, padding: 18, background: theme.surfaceStrong, display: "grid", gap: 14 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}><div style={{ display: "grid", gap: 4 }}><div style={{ fontWeight: 700, color: theme.text }}>Workout {card.workout.workout} · {card.workout.dateLabel}</div><div style={{ color: theme.textSoft }}>{card.workout.title}</div><div style={{ fontSize: 13, color: theme.textMuted }}>{card.summary}</div></div><ConfidenceBadge level={card.confidence} score={card.score} /></div><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><MetricChip label="Sections" value={card.sectionCount} /><MetricChip label="Exercises" value={card.exerciseCount} /><MetricChip label="Parsed sets" value={card.parsedSetCount} /></div><div style={{ display: "grid", gap: 8 }}><div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: theme.textMuted }}>Likely focus</div><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{card.topGroups.length > 0 ? card.topGroups.map((group) => <GroupBadge key={`${card.id}-${group.family}-${group.group}`} family={group.family} group={group.group} />) : <span style={{ color: theme.textSoft, fontSize: 13 }}>No focus groups detected.</span>}</div></div><div style={{ display: "grid", gap: 8 }}>{card.warnings.length > 0 ? card.warnings.map((warning) => <div key={`${card.id}-${warning}`} style={{ border: `1px solid ${insightTones.warning.border}`, borderRadius: 12, padding: 12, background: insightTones.warning.background, color: insightTones.warning.accent, fontSize: 13 }}>{warning}</div>) : <div style={{ border: `1px solid ${insightTones.positive.border}`, borderRadius: 12, padding: 12, background: insightTones.positive.background, color: insightTones.positive.accent, fontSize: 13 }}>No review flags. Ready to import.</div>}</div><div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? 180 : 220}px, 1fr))`, gap: 12 }}>{card.workout.circuits.map((circuit, circuitIndex) => <div key={`${card.id}-${circuit.name}-${circuitIndex}`} style={{ border: `1px solid ${theme.border}`, borderRadius: 14, padding: 14, background: theme.surface }}><div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}><div style={{ fontWeight: 600, color: theme.text }}>{circuit.name}</div><div style={{ fontSize: 12, color: theme.textMuted }}>{circuit.exercises.length} items</div></div><div style={{ marginTop: 8, display: "grid", gap: 6 }}>{circuit.exercises.slice(0, 3).map((exercise) => <div key={exercise.id} style={{ fontSize: 13, color: theme.textSoft }}>{exercise.movementLabel}</div>)}{circuit.exercises.length > 3 ? <div style={{ fontSize: 12, color: theme.textMuted }}>+{circuit.exercises.length - 3} more</div> : null}</div></div>)}</div></div>)}</div>}</SectionCard></div>}

        {activeTab === "weeks" && (
          <SectionCard title="Weekly calorie and zone targets" subtitle={`Weekly scorecards for ${activeClient?.name}, with default thresholds set at ${DEFAULT_CALORIE_THRESHOLD_PERCENT}% HR for calorie reporting and ${DEFAULT_ZONE_THRESHOLD_PERCENT}% HR for zone work unless Ryan adjusts the week.`}>
            {activeWeeklyTargets.length === 0 ? (
              <div style={{ color: theme.textSoft }}>No weekly targets stored for this client yet.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? 260 : 300}px, 1fr))`, gap: 16 }}>
                {activeWeeklyTargets.map((week) => {
                  const calorieRatio = getProgressRatio(week.reportedCalories ?? 0, week.calories);
                  const zoneRatio = week.zoneMinutes === null ? 0 : getProgressRatio(week.reportedZoneMinutes ?? 0, week.zoneMinutes);
                  const calorieTone = getCompletionTone(week.reportedCalories ?? 0, week.calories);
                  const zoneTone = getCompletionTone(week.reportedZoneMinutes ?? 0, week.zoneMinutes);
                  const weekStatus = getWeeklyStatus(week.calories, week.reportedCalories ?? 0);
                  const zoneStatus = week.zoneMinutes === null ? { label: "Optional", color: theme.textMuted, background: theme.surfaceMuted } : getWeeklyStatus(week.zoneMinutes, week.reportedZoneMinutes ?? 0);
                  const isCurrentWeek = latestWeeklyTarget?.week === week.week;
                  return (
                    <div key={week.week} style={{ border: `1px solid ${isCurrentWeek ? theme.borderStrong : theme.border}`, borderRadius: 20, padding: 18, background: isCurrentWeek ? theme.surfaceStrong : theme.surface, display: "grid", gap: 16, boxShadow: isCurrentWeek ? theme.shadow : "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                        <div style={{ display: "grid", gap: 4 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.45, color: isCurrentWeek ? theme.accentStrong : theme.textMuted }}>{isCurrentWeek ? "Current week" : "Week plan"}</div>
                          <h3 style={{ margin: 0, fontSize: 20, color: theme.text }}>Week {week.week}</h3>
                        </div>
                        <span style={{ display: "inline-flex", alignItems: "center", borderRadius: 999, padding: "7px 11px", background: weekStatus.background, color: weekStatus.color, fontSize: 12, fontWeight: 700 }}>{weekStatus.label}</span>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
                        <div style={{ border: `1px solid ${theme.border}`, borderRadius: 18, padding: 14, background: theme.surfaceStrong, display: "grid", gap: 10, justifyItems: "center" }}>
                          <div style={{ width: 92, height: 92, borderRadius: "50%", background: getProgressRingBackground(calorieRatio, calorieTone.fill), padding: 8, display: "grid", placeItems: "center" }}>
                            <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: theme.surface, display: "grid", placeItems: "center", textAlign: "center" }}>
                              <div style={{ display: "grid", gap: 2 }}>
                                <div style={{ fontSize: 22, fontWeight: 700, color: calorieTone.accent }}>{Math.round(calorieRatio * 100)}%</div>
                                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.45, color: theme.textMuted }}>Calories</div>
                              </div>
                            </div>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>{(week.reportedCalories ?? 0).toLocaleString()} / {week.calories.toLocaleString()}</div>
                          <div style={{ fontSize: 12, color: theme.textSoft }}>{formatCalorieThreshold(week.calorieThresholdPercent)}</div>
                        </div>

                        <div style={{ border: `1px solid ${theme.border}`, borderRadius: 18, padding: 14, background: theme.surfaceStrong, display: "grid", gap: 10, justifyItems: "center" }}>
                          <div style={{ width: 92, height: 92, borderRadius: "50%", background: week.zoneMinutes === null ? theme.surfaceMuted : getProgressRingBackground(zoneRatio, zoneTone.fill), padding: 8, display: "grid", placeItems: "center" }}>
                            <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: theme.surface, display: "grid", placeItems: "center", textAlign: "center" }}>
                              <div style={{ display: "grid", gap: 2 }}>
                                <div style={{ fontSize: 22, fontWeight: 700, color: week.zoneMinutes === null ? theme.textMuted : zoneTone.accent }}>{week.zoneMinutes === null ? "—" : `${Math.round(zoneRatio * 100)}%`}</div>
                                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.45, color: theme.textMuted }}>Zone</div>
                              </div>
                            </div>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>{week.zoneMinutes === null ? "No zone target" : `${week.reportedZoneMinutes ?? 0} / ${week.zoneMinutes} min`}</div>
                          <div style={{ fontSize: 12, color: theme.textSoft }}>{week.zoneMinutes === null ? "Trainer can add when needed" : formatZoneThreshold(week.zonePercent)}</div>
                        </div>
                      </div>

                      <div style={{ display: "grid", gap: 12 }}>
                        <div style={{ display: "grid", gap: 7 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.45, color: theme.textMuted }}>Calorie track</div>
                            <div style={{ fontSize: 12, color: theme.textSoft }}>{week.calories.toLocaleString()} planned</div>
                          </div>
                          <div style={{ position: "relative", height: 14, borderRadius: 999, background: theme.surfaceMuted, overflow: "hidden" }}>
                            <div style={{ position: "absolute", inset: 0, width: `${Math.max(4, calorieRatio * 100)}%`, borderRadius: 999, background: calorieTone.fill }} />
                          </div>
                        </div>
                        <div style={{ display: "grid", gap: 7 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.45, color: theme.textMuted }}>Zone track</div>
                            <span style={{ display: "inline-flex", alignItems: "center", borderRadius: 999, padding: "5px 9px", background: zoneStatus.background, color: zoneStatus.color, fontSize: 11, fontWeight: 700 }}>{zoneStatus.label}</span>
                          </div>
                          <div style={{ position: "relative", height: 14, borderRadius: 999, background: theme.surfaceMuted, overflow: "hidden" }}>
                            <div style={{ position: "absolute", inset: 0, width: `${week.zoneMinutes === null ? 0 : Math.max(4, zoneRatio * 100)}%`, borderRadius: 999, background: week.zoneMinutes === null ? theme.surfaceMuted : zoneTone.fill }} />
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", borderRadius: 999, padding: "7px 11px", background: theme.surfaceStrong, border: `1px solid ${theme.border}`, color: theme.textSoft, fontSize: 12, fontWeight: 700 }}>{formatCalorieThreshold(week.calorieThresholdPercent)}</span>
                        <span style={{ display: "inline-flex", alignItems: "center", borderRadius: 999, padding: "7px 11px", background: theme.surfaceStrong, border: `1px solid ${theme.border}`, color: theme.textSoft, fontSize: 12, fontWeight: 700 }}>{week.zoneMinutes === null ? "Zone goal open" : formatZoneTarget(week)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        )}
      </div>
    </div>
  );
}
