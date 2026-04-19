# Workout Tracker

A Vite + React training dashboard for tracking workouts, weekly targets, movement taxonomy, growth trends, and coach-entered workout notes.

## Features

- Overview cards for logged sessions and training distribution
- Workout history with movement parsing and trend signals
- Weekly calorie and intensity charts
- Taxonomy views grouped by family and movement pattern
- Growth summaries for high-signal exercises
- Flexible trainer intake that accepts less rigid note formatting

## Getting Started

```bash
cd workout-tracker
npm install
npm run dev
```

Open the local URL Vite prints, typically `http://127.0.0.1:5173/`.

## Build

```bash
npm run build
```

## Key Files

- `src/workouttracker.jsx` — main dashboard UI, parsing helpers, and analytics logic
- `src/App.jsx` — renders the dashboard component
- `src/main.jsx` — React entry point

## Trainer Intake Notes

The trainer intake parser is tolerant of common real-world note styles, including:

- `Workout 12 - 4/19`
- `Session 13 Apr 20`
- bulleted or unbulleted exercise lines
- shorthand like `3x10`, `25 lbs 4x8`, `bodyweight`, and band colors
- loose section headers like `Warm Up`, `Circuit`, `Finisher`, or `Upper`

Parsed workouts are stored in local browser storage so imported sessions persist between reloads.
