# Multi-Client Database Outline

This app is ready to evolve from a single-user dashboard into a coach-facing system that supports many clients without flattening everyone into one dataset.

## Product Goal

Support a trainer who manages multiple clients, their workout history, note intake, plans, and derived insights while keeping each client's data isolated and editable.

## Recommended Stack

- **App:** React + Vite frontend
- **API:** Node.js with `Express` or `Fastify`
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Auth:** Clerk, Auth0, or Supabase Auth
- **File storage:** S3-compatible object storage for uploads, scans, and attachments

## Core Entities

### `users`
For trainer logins and future assistant/co-coach roles.

- `id`
- `email`
- `name`
- `role` (`trainer`, `assistant`, `admin`)
- `created_at`
- `updated_at`

### `clients`
One record per athlete/client.

- `id`
- `trainer_id` → `users.id`
- `first_name`
- `last_name`
- `display_name`
- `date_of_birth`
- `sex`
- `height_cm`
- `notes`
- `status` (`active`, `inactive`, `archived`)
- `created_at`
- `updated_at`

### `client_profiles`
More detailed intake / health / preference data.

- `id`
- `client_id` → `clients.id`
- `goals`
- `injuries_limitations`
- `equipment_access`
- `training_age`
- `availability_notes`
- `nutrition_notes`
- `lifestyle_notes`
- `updated_at`

### `program_cycles`
Lets the trainer structure macro, meso, and microcycles without the dashboard pretending to replace that thinking.

- `id`
- `client_id` → `clients.id`
- `name`
- `cycle_type` (`macro`, `meso`, `micro`, `block`, `phase`)
- `start_date`
- `end_date`
- `focus`
- `notes`
- `created_at`
- `updated_at`

### `workouts`
One workout session per client per date.

- `id`
- `client_id` → `clients.id`
- `program_cycle_id` → `program_cycles.id` nullable
- `workout_number`
- `performed_on`
- `title`
- `source` (`seed`, `trainer_note_import`, `manual_edit`, `api`)
- `source_confidence`
- `trainer_note_raw` nullable
- `session_notes`
- `created_at`
- `updated_at`

### `workout_sections`
Circuits, supersets, core blocks, finishers, etc.

- `id`
- `workout_id` → `workouts.id`
- `position`
- `name`
- `section_type` (`circuit`, `superset`, `warmup`, `core`, `accessory`, `general`)
- `notes`

### `exercise_entries`
Each named movement inside a workout section.

- `id`
- `workout_section_id` → `workout_sections.id`
- `position`
- `raw_text`
- `exercise_name`
- `movement_label`
- `movement_key`
- `taxonomy_family`
- `taxonomy_group`
- `parse_confidence`
- `is_user_edited`
- `notes`

### `exercise_variations`
Parsed load/reps/time variants under an exercise entry.

- `id`
- `exercise_entry_id` → `exercise_entries.id`
- `position`
- `load_text`
- `load_value`
- `summary`
- `count_volume`
- `time_volume`
- `volume_score`

### `set_records`
Optional lower-level structure for granular tracking.

- `id`
- `exercise_variation_id` → `exercise_variations.id`
- `position`
- `label`
- `measurement_type` (`count`, `time`, `mixed`)
- `count_value`
- `time_seconds`

### `weekly_targets`
Editable weekly targets per client.

- `id`
- `client_id` → `clients.id`
- `week_index`
- `start_date`
- `end_date`
- `calories_target`
- `intensity_target`
- `notes`

### `insight_snapshots`
Stores derived summaries so dashboards can load fast and preserve historical context.

- `id`
- `client_id` → `clients.id`
- `snapshot_type` (`overview`, `taxonomy`, `growth`, `compliance`)
- `window_start`
- `window_end`
- `payload_json`
- `generated_at`

## Editing Strategy

Because all data should be editable:

- Treat parser output as an initial structured draft, not the final truth.
- Save both:
  - the **raw trainer note text**
  - the **structured parsed records**
- Mark edits with:
  - `is_user_edited`
  - `source`
  - `updated_at`
- Never destroy the original imported text.
- Support edit history later with an audit table like `change_log`.

## Suggested Relationships

- One trainer → many clients
- One client → many program cycles
- One client → many workouts
- One workout → many sections
- One section → many exercise entries
- One exercise entry → many variations
- One variation → many set records

## API Surface

### Client endpoints
- `GET /clients`
- `POST /clients`
- `GET /clients/:id`
- `PATCH /clients/:id`

### Workout endpoints
- `GET /clients/:id/workouts`
- `POST /clients/:id/workouts`
- `PATCH /workouts/:id`
- `DELETE /workouts/:id`

### Import endpoints
- `POST /clients/:id/import/trainer-notes`
- `POST /clients/:id/import/preview`

### Targets and cycles
- `GET /clients/:id/weekly-targets`
- `PATCH /weekly-targets/:id`
- `GET /clients/:id/program-cycles`
- `POST /clients/:id/program-cycles`

## Frontend Evolution

The current dashboard can evolve into:

- a **client switcher**
- a **trainer workspace** with multiple clients
- per-client `Overview`, `Workouts`, `Taxonomy`, `Growth`, `Targets`, `Notes`
- an **edit drawer** reused across workouts, targets, and client profile data

## Migration Path From Current App

1. Move static workout and weekly target arrays into seed scripts
2. Add a backend with PostgreSQL + Prisma
3. Store one client record for the current user
4. Replace localStorage with API-backed persistence
5. Add authentication and trainer/client ownership rules
6. Add audit history for edits and trainer-note imports

## Next Recommended Build Step

Implement a minimal backend with these first tables:

- `users`
- `clients`
- `workouts`
- `workout_sections`
- `exercise_entries`
- `weekly_targets`

That gives enough structure to support multiple clients and editable workout data without overbuilding too early.
