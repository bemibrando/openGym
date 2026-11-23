import { describe, expect, it } from 'vitest'
import { LADDERS, allLadders, ladderOf, nextRung, prevRung, reachedRung, saveLadder, deleteLadder, ownLadders, insertRung, removeRung, STEPS_MAX } from './ladders.js'
import { nextPrescription, POLICIES_FOR, LADDER_TOP } from './progression.js'
import { EXIDX } from './exercises.js'

const done = (d, id, reps, sets = 3) => ({ d, entries: [{ id, target: { id, sets, reps, prog: 'ladder', weight: 0 }, sets: Array.from({ length: sets }, () => ({ w: 0, r: reps, done: true })) }] })

describe('ladders', () => {
  it('every built-in rung is a catalogue exercise, easiest first', () => {
    for (const l of LADDERS) {
      expect(l.steps.length).toBeGreaterThanOrEqual(4)
      for (const id of l.steps) expect(EXIDX[id], id).toBeTruthy()
    }
    expect(nextRung({}, '0662')).toBe('0283')   // push-up → diamond push-up
    expect(prevRung({}, '0662')).toBe('3211')
    expect(nextRung({}, '0725')).toBe(null)      // one-arm push-up: the top
    expect(nextRung({}, '0025')).toBe(null)      // a barbell lift is in no ladder
  })

  it('your own chain wins for its exercises and can be edited and deleted', () => {
    const s = {}
    const l = saveLadder(s, { name: '  My  push ', steps: ['0662', '0725', '0662'] })
    expect(l.steps).toEqual(['0662', '0725'])
    expect(ownLadders(s)[0].name).toBe('My push')
    expect(nextRung(s, '0662')).toBe('0725')
    expect(allLadders(s)[0].own).toBe(true)
    expect(saveLadder(s, { name: 'x', steps: ['0662'] })).toBe(null)
    saveLadder(s, { id: l.id, name: 'Renamed', steps: ['0493', '0662'] })
    expect(ownLadders(s)).toHaveLength(1)
    expect(ladderOf(s, '0493').ladder.name).toBe('Renamed')
    deleteLadder(s, l.id)
    expect('ladders' in s).toBe(false)
  })

  it('puts an exercise a rung easier or harder, from the detail sheet', () => {
    // Outside any chain: a new chain of the two, in that order.
    const s = {}
    expect(insertRung(s, '0025', '0026', 1, 'Mine').steps).toEqual(['0025', '0026'])
    expect(insertRung(s, '0025', '0024', -1).steps).toEqual(['0024', '0025', '0026'])
    expect(ownLadders(s)).toHaveLength(1)
    expect(ownLadders(s)[0].name).toBe('Mine')
    // Moving a rung inside your own chain does not repeat it.
    expect(insertRung(s, '0026', '0024', 1).steps).toEqual(['0025', '0026', '0024'])
    expect(insertRung(s, '0025', '0025', 1)).toBe(null)
  })

  it('a rung put into a built-in chain makes your own copy, which then wins', () => {
    const s = {}
    const l = insertRung(s, '0662', '0025', 1, 'My push-ups')
    const push = LADDERS.find(x => x.id === 'push-up').steps
    expect(l.steps).toEqual([...push.slice(0, 4), '0025', ...push.slice(4)])
    expect(nextRung(s, '0662')).toBe('0025')
    expect(nextRung(s, '0025')).toBe('0283')
    expect(LADDERS.find(x => x.id === 'push-up').steps).toEqual(push)   // the built-in is untouched
    // Your copy is edited from then on, not copied again.
    insertRung(s, '0662', '0026', -1)
    expect(ownLadders(s)).toHaveLength(1)
    expect(prevRung(s, '0662')).toBe('0026')
  })

  it('a rung lives in one of your chains at a time', () => {
    const s = {}
    insertRung(s, '0025', '0026', 1, 'A')
    insertRung(s, '0027', '0028', 1, 'B')
    insertRung(s, '0027', '0026', -1)                // 0026 moves from A to B, and A is left with one
    expect(ownLadders(s)).toHaveLength(1)
    expect(ownLadders(s)[0].steps).toEqual(['0026', '0027', '0028'])
  })

  it('refuses a full chain', () => {
    const s = {}
    const ids = Array.from({ length: STEPS_MAX }, (_, i) => String(9000 + i))
    saveLadder(s, { name: 'Full', steps: ids })
    expect(insertRung(s, ids[0], '0025', 1)).toBe(null)
  })

  it('takes a rung out of your own chain, never out of a built-in one', () => {
    const s = {}
    insertRung(s, '0025', '0026', 1, 'A')
    insertRung(s, '0026', '0027', 1)
    expect(removeRung(s, '0026')).toBe(true)
    expect(ownLadders(s)[0].steps).toEqual(['0025', '0027'])
    expect(removeRung(s, '0027')).toBe(true)
    expect('ladders' in s).toBe(false)               // one rung is no ladder
    expect(removeRung(s, '0662')).toBe(false)
    expect(nextRung(s, '0662')).toBe('0283')
  })

  it('knows the highest rung you logged', () => {
    const push = LADDERS.find(l => l.id === 'push-up')
    expect(reachedRung({ workouts: [] }, push)).toBe(-1)
    expect(reachedRung({ workouts: [done('2026-11-01', '0662', 8)] }, push)).toBe(3)
  })
})

describe('the Skill ladder rule', () => {
  const cfg = { id: '0662', sets: 3, reps: 12, repsMin: 5, weight: 0, bodyweight: true, prog: 'ladder', mode: 'reps' }
  it('is a reps rule', () => { expect(POLICIES_FOR.reps).toContain('ladder'); expect(POLICIES_FOR.time).not.toContain('ladder') })

  it('starts at the bottom, climbs a rep per clean session, repeats a miss', () => {
    expect(nextPrescription({ workouts: [] }, cfg)).toMatchObject({ kind: 'first', reps: 5 })
    expect(nextPrescription({ workouts: [done('2026-11-01', '0662', 8)] }, cfg)).toMatchObject({ kind: 'up', reps: 9 })
    const miss = done('2026-11-01', '0662', 8)
    miss.entries[0].sets[2].r = 6
    expect(nextPrescription({ workouts: [miss] }, cfg)).toMatchObject({ kind: 'hold', reps: 8 })
  })

  it('at the top names the next rung, and at the last rung holds', () => {
    const p = nextPrescription({ workouts: [done('2026-11-01', '0662', LADDER_TOP)] }, cfg)
    expect(p).toMatchObject({ kind: 'ladder', next: '0283', reps: 12 })
    const last = nextPrescription({ workouts: [done('2026-11-01', '0725', 12)] }, { ...cfg, id: '0725' })
    expect(last.kind).toBe('hold')
    expect(last.next).toBeUndefined()
  })
})
