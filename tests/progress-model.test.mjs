import assert from 'node:assert/strict'
import test from 'node:test'

import {
	calculateProgress,
	createEmptyProgress,
	createProgressStore,
	findNextTask,
	getSafeStorage,
	normalizeProgress,
	parseProgressImport,
} from '../docs/assets/progress-model.js'

test('creates a versioned empty progress record', () => {
	assert.deepEqual(createEmptyProgress(), {
		version: 1,
		completedTaskIds: [],
		lastVisitedPhase: null,
	})
})

test('calculates zero percent for an empty task list', () => {
	assert.deepEqual(calculateProgress([], []), {
		completed: 0,
		total: 0,
		percent: 0,
	})
})

test('calculates completed tasks and rounds the percentage', () => {
	assert.deepEqual(calculateProgress(['a', 'b', 'c'], ['a', 'missing']), {
		completed: 1,
		total: 3,
		percent: 33,
	})
})

test('returns the first incomplete required task before optional work', () => {
	const tasks = [
		{ id: 'optional', title: 'Optional detour', required: false, phase: 'setup' },
		{ id: 'required-1', title: 'Unlock Trusts', required: true, phase: 'setup' },
		{ id: 'required-2', title: 'Reach 80', required: true, phase: 'level' },
	]

	assert.deepEqual(findNextTask(tasks, ['required-1']), tasks[2])
	assert.equal(findNextTask(tasks, ['required-1', 'required-2']), null)
})

test('normalizes progress and removes duplicate and unknown task ids', () => {
	assert.deepEqual(
		normalizeProgress(
			{
				version: 1,
				completedTaskIds: ['known', 'unknown', 'known'],
				lastVisitedPhase: 'level',
			},
			new Set(['known']),
		),
		{
			version: 1,
			completedTaskIds: ['known'],
			lastVisitedPhase: 'level',
		},
	)
})

test('rejects malformed and incompatible progress imports', () => {
	assert.deepEqual(parseProgressImport('{bad json', new Set()), {
		ok: false,
		error: 'That backup is not valid JSON.',
	})
	assert.deepEqual(
		parseProgressImport('{"version":2,"completedTaskIds":[]}', new Set()),
		{
			ok: false,
			error: 'That backup uses an unsupported progress version.',
		},
	)
	assert.deepEqual(
		parseProgressImport('{"version":1,"completedTaskIds":[7]}', new Set()),
		{
			ok: false,
			error: 'That backup contains invalid task IDs.',
		},
	)
})

test('returns no browser storage when the storage getter throws', () => {
	assert.equal(
		getSafeStorage(() => {
			throw new DOMException('Blocked', 'SecurityError')
		}),
		null,
	)
})

test('accepts a valid import and retains only recognized task ids', () => {
	assert.deepEqual(
		parseProgressImport(
			'{"version":1,"completedTaskIds":["known","stale"],"lastVisitedPhase":"post-99"}',
			new Set(['known']),
		),
		{
			ok: true,
			value: {
				version: 1,
				completedTaskIds: ['known'],
				lastVisitedPhase: 'post-99',
			},
		},
	)
})

test('persists, loads, and clears progress through the storage boundary', () => {
	const values = new Map()
	const storage = {
		getItem: (key) => values.get(key) ?? null,
		setItem: (key, value) => values.set(key, value),
		removeItem: (key) => values.delete(key),
	}
	const store = createProgressStore(storage, 'guide-progress')
	const progress = {
		version: 1,
		completedTaskIds: ['trusts'],
		lastVisitedPhase: 'setup',
	}

	store.save(progress)
	assert.deepEqual(store.load(new Set(['trusts'])), progress)
	assert.equal(store.persistent, true)
	store.clear()
	assert.deepEqual(store.load(new Set(['trusts'])), createEmptyProgress())
})

test('falls back to in-memory progress when browser storage throws', () => {
	const storage = {
		getItem() {
			throw new Error('blocked')
		},
		setItem() {
			throw new Error('blocked')
		},
		removeItem() {
			throw new Error('blocked')
		},
	}
	const store = createProgressStore(storage, 'guide-progress')
	const progress = {
		version: 1,
		completedTaskIds: ['trusts'],
		lastVisitedPhase: 'setup',
	}

	assert.deepEqual(store.load(new Set(['trusts'])), createEmptyProgress())
	assert.equal(store.persistent, false)
	store.save(progress)
	assert.deepEqual(store.load(new Set(['trusts'])), progress)
	store.clear()
	assert.deepEqual(store.load(new Set(['trusts'])), createEmptyProgress())
})
