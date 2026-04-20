# Empathy-First Dashboard Brief

## Goal
Create a dashboard experience that helps the user *feel* coached, supported, and intentionally progressed by Ryan's program without relying on heavy explanatory text.

This brief translates the current product goal into a visual and interaction strategy. The dashboard should communicate five things at a glance:

1. The program is intentional.
2. The program is personalized.
3. The current week fits into a larger plan.
4. The user is on track, not guessing.
5. Ryan is adapting intelligently, not improvising.

## Core Emotional Signals

### 1. Structure
The user should feel that each week and each session sits inside a designed system.

**Visual implication:**
- Repeated layout patterns.
- Consistent color coding.
- Clear sequence from goals to sessions to outcomes.
- Visible grouping of related work.

### 2. Progress
The user should feel that effort is accumulating meaningfully.

**Visual implication:**
- Progress rings and completion bars.
- Goal versus actual overlays.
- Smooth cumulative charts instead of isolated numbers.
- “In range” states that reduce uncertainty.

### 3. Personalization
The user should feel that the plan is tailored to them, not generic.

**Visual implication:**
- Thresholds that reflect Ryan’s weekly calls.
- Weekly targets tied to this client’s current phase.
- Visual emphasis on the user’s current objective, not generic fitness metrics.
- Session distribution that reflects the actual program, not a canned split.

### 4. Safety and guidance
The user should feel held by the plan rather than judged by the data.

**Visual implication:**
- Calm, stable color system.
- Fewer alarm-oriented elements.
- Visual “target range” bands instead of harsh pass/fail styling.
- Completion and consistency cues over red/green critique.

### 5. Intentional planning
The user should feel that variation in volume, targets, and session emphasis is planned.

**Visual implication:**
- Week-to-week rhythm.
- Distinct but related visual states for heavy, lighter, and mixed-focus weeks.
- Mesocycle and weekly cadence that visually reads as designed.

## Design Principles

### Favor coherence over explanation
The dashboard should reassure by making the plan look visibly connected and internally consistent.

### Favor comparison to plan over comparison to self-critique
The most reassuring pattern is not “up/down” but “plan vs actual”.

### Favor calm precision over loud performance UI
The dashboard should look intelligent and composed, not gamified or corrective.

### Favor repeated visual language
A repeated icon, color, or shape system builds trust because it suggests rules and intent.

## Non-Text Reassurance Patterns

## 1. Goal-to-execution strip
A single horizontal strip for each week that shows:
- weekly calorie goal
- reported calories above threshold
- zone-minute goal
- reported zone minutes
- session count or completion state

**Why it works:**
It visually links Ryan’s prescription to actual execution. The user sees that the week has a target, a path, and a result.

**Recommended treatment:**
- ghost bar for planned target
- filled bar for achieved work
- small threshold chips for `>40% HR` and `>90% HR`
- completion marker when the week lands in range

## 2. Weekly scorecard rings
Use 2–3 circular progress visuals for the current week:
- calories above threshold
- zone minutes in prescribed HR zone
- sessions completed or planned exposures

**Why it works:**
Rings feel contained and complete. They reduce anxiety better than raw stats.

**Recommended treatment:**
- muted background rings
- warm accent fill
- avoid danger colors unless something is seriously off-plan

## 3. Plan vs actual overlays
For weekly planning, show target and actual together rather than in separate cards.

**Why it works:**
It answers the user’s core reassurance question instantly: “Am I doing what Ryan asked?”

**Recommended treatment:**
- target bar as outline/ghost
- actual as filled bar
- slight overfill glow when the user clears target
- soft “in range” state when close

## 4. Session cadence timeline
Use a horizontal weekly or monthly timeline where each workout is a colored block tied to session emphasis.

**Why it works:**
Cadence communicates structure better than text. Alternation and distribution make the program feel designed.

**Recommended categories:**
- strength emphasis
- mixed / hybrid session
- conditioning emphasis
- recovery / lighter week feel
- special target-zone focus

## 5. Body-region balance map
Use a heat map, radial diagram, or grouped body map for recent work distribution.

**Why it works:**
The user can see that training is balanced and comprehensive, which reinforces Ryan’s intelligence.

**Recommended treatment:**
- recent week layer
- rolling month layer
- calm emphasis differences instead of aggressive heat colors

## 6. Load / recovery range band
Display a banded meter showing whether the current week sits inside the intended load corridor.

**Why it works:**
A band says “this is within the plan,” which is far more reassuring than just showing a delta.

**Recommended treatment:**
- low / intended / high bands
- highlight current week position
- keep colors soft and neutral

## 7. Phase framing without heavy labels
Even without explicitly surfacing macro/meso/micro terminology, show grouped week segments and repeated weekly patterns.

**Why it works:**
People feel safer when they can see that this week belongs to a broader arc.

**Recommended treatment:**
- grouped blocks of 4 weeks
- subtle background bands
- current week marker
- target shifts shown as step changes

## 8. Confidence through stability cues
Use small visual indicators to suggest a plan is stable and intentional.

**Examples:**
- checkmark-like completion states
- soft highlighted “in range” states
- connected lines rather than disjointed cards
- repeated spacing and card proportions

## Information Architecture Recommendations

## 1. Top of overview = plan coherence
The top of the dashboard should immediately show whether the current week is tracking to plan.

**Recommended components:**
- current week goal-to-execution strip
- two progress rings
- one compact cadence timeline

This should answer, with almost no reading:
- What was the goal?
- What have I done?
- Am I on track?
- Does this week fit the plan?

## 2. Weekly targets tab = scorecards, not text cards
The weekly targets area should become a visual planning board.

**Each week card should show:**
- calorie goal
- actual calories above threshold
- target zone minutes
- actual zone minutes
- threshold chips
- status state (on pace / ahead / still building)

## 3. Taxonomy = balance and coverage
The taxonomy experience should reassure the user that the plan is not random or repetitive in a sloppy way.

**Recommended focus:**
- body-region balance graphic
- movement family distribution
- cadence across the recent block

## 4. Workout log = intentional session identity
Each workout should visually communicate what kind of day it was.

**Possible signals:**
- session-type chip
- target-zone marker if the session was meant to chase HR work
- strength / hybrid / conditioning iconography

## 5. Exercise index = quiet reference
The exercise index should be present but visually de-emphasized.

**Reason:**
It supports trust, but it should not compete with the coaching and planning story.

## Concrete Dashboard Concepts To Build

## Concept A: “This week at a glance” dashboard rail
A compact overview rail containing:
- calories target vs actual
- zone minutes target vs actual
- session count completed
- body emphasis snapshot
- current week position in the monthly block

**Emotional outcome:**
“I know what this week is asking of me, and I can tell whether I’m following it.”

## Concept B: “Program rhythm” visual
A multi-week strip where each week is a block with:
- calorie target height
- zone-minute target marker
- session distribution color
- current week highlight

**Emotional outcome:**
“This week is part of a bigger pattern. Ryan is steering the plan.”

## Concept C: “Balanced training map”
A body or category balance panel showing what has been emphasized recently and what is intentionally quieter.

**Emotional outcome:**
“My program covers what it should. Nothing feels random.”

## Concept D: “Planned vs completed” matrix
A grid with planned weekly targets on one axis and actual execution on the other.

**Emotional outcome:**
“I can see that I’m progressing against the plan, not just collecting workouts.”

## Visual Tone Recommendations

## Use calm colors
Prefer:
- soft greens
- muted blue-greens
- warm stone neutrals
- restrained accent tones

Avoid overusing:
- aggressive red/orange warning states
- loud saturated success colors
- high-contrast performance dashboards that feel judgmental

## Use smooth shapes
Prefer:
- rings
- rounded bars
- connected strips
- grouped cards with predictable rhythm

These make the system feel safe and intentional.

## Use stable spacing
A consistent spacing system reinforces order and care.

## Use light hierarchy, not clutter
More information should come from:
- alignment
- comparison
- shape
- repeated pattern

not from adding more labels or explanatory paragraphs.

## Implementation Priorities

## Priority 1: Add a visual plan-vs-actual strip to `Overview`
This is the single highest-impact non-text reassurance upgrade.

**Include:**
- weekly calorie goal vs actual
- weekly zone-minute goal vs actual
- threshold markers
- current week highlight

## Priority 2: Convert `Weekly targets` into visual scorecards
Make each week feel like a coach-set target card with clear plan/execution visuals.

## Priority 3: Add a cadence timeline
Show the recent session rhythm so the plan reads as intentional and sequenced.

## Priority 4: Add a balance visualization to taxonomy
Use a more visual balance graphic to reassure the user that training is broad, planned, and distributed.

## Priority 5: Lightly classify workouts by purpose
Show, visually, what type of day each workout represents.

## Success Criteria
The empathy-focused dashboard work should succeed if a user can infer the following without reading much text:

- Ryan has a plan.
- This week fits into a bigger progression.
- My goals are specific and personalized.
- My performance is being tracked against a clear target.
- Variations in volume or intensity are intentional.
- I am being guided, not judged.

## Branch Scope Recommendation
The empathy branch should focus on:
- visual hierarchy
- plan-vs-actual patterns
- reassurance-oriented summary visuals
- calmer, more confident design language
- reduced reliance on explanatory copy

It should not yet expand into backend work unless needed to support visual target tracking.
