# Skill ladder audit

A check of the built-in ladders in `frontend/src/lib/ladders.js` (`LADDERS`) against the catalogue
(`catalogue/exercises/<id>.json`), on `personal` at upstream 1.4.5 (`e4a68a9`). Each ladder is
listed easiest first, as the code holds it.

**Fixed on `feature/ladder-fixes`** (everything in section 4 except the muscle-up ladder): holds
took option 2, so a chain is all reps or all holds and the Skill ladder rule climbs holds in
seconds (20 s to 60 s, 5 s a session, `ladderHoldPrescription` in `lib/progression.js`); Train it
starts a hold rung as a timed hold. `ladders.test.js` now fails if a chain mixes holds and reps, or
if two chains share a rung. The "handstand" chain is now the handstand push-up ladder. The tables
below are the audit as it was found.

Status key: **OK** fits, **Wrong** a rung that should not be where it is, **Missing** a rung the
catalogue has that would close a gap, **Mode** a timed hold in a ladder of rep exercises.

Female drawings (`femaleVariant`) are aliases of the same exercise id, so they need no rungs of
their own.

## Summary

| Ladder | Rungs | Problems |
|---|---|---|
| push-up | 7 | Missing decline push-up; big jump archer → one-arm |
| pull-up | 7 | Big jump archer pull-up → one-arm chin-up |
| dip | 5 | Wrong: chest dip is not harder than triceps dip; missing feet-up bench dip |
| squat | 6 | Missing Bulgarian split squat |
| hinge | 5 | **Wrong: ends in Nordic curl**, a different movement; not a hinge at all |
| core | 6 | **Mode** ×3; mixes plank holds with hanging leg raises |
| handstand | 5 | **Mode** ×1; freestanding handstand before the wall version |

Plus a code problem (holds in rep ladders, below) and five ladders the catalogue could support
but nobody has built.

## 1. The code problem: timed holds in rep ladders

Four rungs are holds in the catalogue (`"hold": true`): `0463` front plank, `1246` hollow hold,
`3419` L-sit on floor, `3302` handstand.

- **Train it** (`components/Ladders.jsx` `rungEntry`) always adds a rung as `mode: 'reps'`,
  5 to 12 reps, Skill ladder rule. A plank added that way asks for "12 reps".
- The Skill ladder rule only exists for reps (`POLICIES_FOR.time` is `['off', 'time']`), so a hold
  logged as a hold never names its next rung.
- **Swap in routine** from a rep rung to a hold rung (hanging leg raise → L-sit) keeps
  `prog: 'ladder'` on an exercise that should be timed.

Fix options, pick one:

1. **Keep holds out of rep ladders** and give holds their own ladders (core holds, handstand
   holds, planche, below). Data only, no code change. Recommended.
2. **Let ladders mix modes:** `rungEntry` uses `isHold(id)` to start a hold as `mode: 'time'` on the
   `time` rule, and the `time` rule names `nextRung` at its cap, the way the bodyweight rep
   ceiling now does on `personal`. Needs a test in `progression.test.js`.

## 2. Built-in ladders, one by one

### push-up

| # | id | Exercise | Status |
|---|---|---|---|
| 1 | 0659 | push-up (wall) | OK |
| 2 | 0493 | incline push-up | OK |
| 3 | 3211 | kneeling push-up (male) | OK (some coaches put kneeling before incline; either order works) |
| 4 | 0662 | push-up | OK |
| + | 0279 | decline push-up | **Missing**: the usual step between push-up and diamond |
| 5 | 0283 | diamond push-up | OK (targets triceps, still the standard close-grip step) |
| 6 | 3294 | archer push up | OK |
| + | 3002 | single arm push up (on knees) | **Missing**: closes the jump to one-arm |
| 7 | 0725 | single arm push-up | OK |

### pull-up

| # | id | Exercise | Status |
|---|---|---|---|
| 1 | 0499 | inverted row | OK as the on-ramp |
| 2 | 0970 | band assisted pull-up | OK (needs a band) |
| 3 | 4725 | chin up (isometric and negative) | OK (`1198` jumping pull up is a fair alternative) |
| 4 | 1326 | chin-up | OK |
| 5 | 0652 | pull-up | OK |
| 6 | 3293 | archer pull up | OK |
| + | 10902 | eccentric single arm pull up | **Missing**: closes the jump to one-arm |
| 7 | 0638 | one arm chin-up | OK |

### dip

| # | id | Exercise | Status |
|---|---|---|---|
| 1 | 0129 | bench dip (knees bent) | OK |
| + | 1753 | three bench dip (feet up) | **Missing**: harder bench dip before bars |
| 2 | 0814 | triceps dip | OK |
| 3 | 0251 | chest dip | **Wrong**: the same bar dip leaning forward, not a harder rung. Drop it from the chain |
| 4 | 0677 | ring dips | OK |
| 5 | 3288 | korean dips | OK |

### squat (single-leg squat ladder)

| # | id | Exercise | Status |
|---|---|---|---|
| 1 | 1197 | squat | OK |
| 2 | 0781 | split squat | OK |
| + | 3743 | bulgarian split squat with chair | **Missing**: rear foot up, the usual step before pistols |
| 3 | 1762 | single leg squat with support (pistol) | OK (`3747` assisted pistol with bed sheet is the same level) |
| 4 | 2984 | pistol squat to box | OK |
| 5 | 1759 | single leg squat (pistol) male | OK |
| 6 | 3366 | shrimp squat | OK (`3367` skater squat sits near pistol level) |

### hinge: split it in two

The chain goes glute bridge → hip thrust → **Nordic curl**. The last rung is a knee-flexion
hamstring exercise, so finishing single-leg hip thrusts says nothing about being ready for it. And
none of these is a hinge (hip-hinge = deadlift pattern).

| # | id | Exercise | Status |
|---|---|---|---|
| 1 | 2471 | glute bridge two legs on floor | OK |
| 2 | 2475 | glute bridge one leg on floor (bent knee) | OK |
| 3 | 2072 | hip thrusts | OK |
| 4 | 2071 | single leg hip thrusts | OK, but should be the top of a glute ladder |
| 5 | 7746 | nordic hamstring curl | **Wrong**: belongs to a hamstring ladder (below) |

Proposed:

- **Glute bridge ladder**: 2471 glute bridge → 3561 glute bridge march → 2475 single-leg glute
  bridge → 2072 hip thrusts → 2071 single-leg hip thrusts.
- **Hamstring ladder**: 8358 hamstring bridge → 9359 single leg hamstring bridge → 3395 sliding leg
  curl with towel → 4204 band-assisted nordic curl → 7746 nordic hamstring curl.
- A real **hinge** ladder could be added later: 4971 bodyweight single-leg RDL is the only
  bodyweight hinge with a clear next step.

### core: split holds from reps

| # | id | Exercise | Status |
|---|---|---|---|
| 1 | 0463 | front plank | **Mode** (hold) |
| 2 | 1246 | hollow hold | **Mode** (hold) |
| 3 | 9819 | hanging knee raise | OK |
| 4 | 0472 | hanging leg raise | OK |
| 5 | 3419 | l-sit on floor | **Mode** (hold) |
| 6 | 4058 | leg raise dragon flag | OK as a top rung |

Two movements in one chain: bracing holds (plank, hollow, L-sit) and hanging leg raises.

Proposed:

- **Leg raise ladder** (reps): 1163 lying leg raise → 9819 hanging knee raise → 0472 hanging leg
  raise → 3891 hanging toes to bar → 4058 dragon flag.
- **Core hold ladder** (holds): 3238 kneeling plank → 0463 front plank → 1246 hollow hold →
  3419 L-sit on floor → 11877 hanging L-sit.

### handstand: split holds from reps

| # | id | Exercise | Status |
|---|---|---|---|
| 1 | 2921 | pike push up | OK |
| 2 | 2831 | pike push up (on bench) | OK |
| 3 | 5234 | wall walks | OK |
| 4 | 3302 | handstand | **Mode** (hold), and freestanding comes after the wall hold |
| 5 | 0471 | handstand push-up | OK |

Proposed:

- **Handstand push-up ladder** (reps): 2921 → 2831 → 9316 ring elevated pike push up from deficit
  (needs rings) → 5234 wall walks → 0471 handstand push-up.
- **Handstand hold ladder** (holds): 6545 handstand hold on wall → 3302 handstand.

## 3. Ladders that could be added

All rungs below are in the catalogue and bodyweight unless noted.

| Ladder | Rungs, easiest first | Mode |
|---|---|---|
| Row / front lever | 2300 inverted row bent knees → 0499 inverted row → 3536 elevated inverted row (check the animation: feet up?) → 11090 negative front lever raise → 3295 front lever reps | reps |
| Front lever hold | 3296 front lever (only one rung; tuck/straddle levers are not in the catalogue) | hold |
| Planche | 3300 lean planche → 3301 frog planche → 10989 tuck planche on parallette → 3298 straddle planche → 3299 full planche | hold |
| Calf raise | 3018 standing calf raise → 1490 calf raise on a staircase → 1387 one leg floor calf raise | reps |
| Muscle-up | 0652 pull-up → 0631 muscle up (too short until chest-to-bar pull-ups are in the catalogue) | reps |

`0688` scapular pull-up could also go before the pull-up ladder's first rung.

## 4. To do

1. Decide on the hold fix: data only (option 1) or mixed modes (option 2).
2. Hinge → glute bridge + hamstring ladders.
3. Core → leg raise + core hold ladders.
4. Handstand → push-up + hold ladders.
5. Dip: drop 0251, add 1753.
6. Add the missing rungs: 0279, 3002 (push-up), 10902 (pull-up), 3743 (squat).
7. New ladders: row/front lever, planche, calf raise.
8. Each new ladder name goes into `NAME` in `components/Ladders.jsx` and into every locale pack
   (`check-source-strings.mjs --strict`).
9. `ladders.test.js` already checks that every rung exists; add a check that a ladder does not
   mix holds and reps (if option 1).

A built-in chain can also be fixed for yourself only, without code: open the exercise, use
Easier / Harder on its ladder section, and your own copy replaces the built-in one.
