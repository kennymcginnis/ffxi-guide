import assert from 'node:assert/strict'
import test from 'node:test'

import {
	extractTasks,
	installProgressPlugin,
	renderProgress,
} from '../docs/assets/progress-plugin.js'

function makeRoot(taskFixtures = []) {
	const phaseSlots = [
		{ dataset: { progressPhase: 'setup' }, textContent: '' },
		{ dataset: { progressPhase: 'level' }, textContent: '' },
	]
	const slots = new Map([
		['[data-progress-summary]', { textContent: '' }],
		['[data-progress-next]', { textContent: '' }],
		['[data-progress-temporary]', { hidden: true }],
		['[data-progress-bar]', { value: 0, textContent: '' }],
		['[data-post-99]', { hidden: true, dataset: { progressTaskId: 'setup-trusts' } }],
	])
	const phaseNextSlots = [
		{ dataset: { progressNextPhase: 'brd' }, textContent: '' },
	]
	const markers = taskFixtures.map((fixture) => {
		const input = {
			checked: false,
			disabled: true,
			attributes: new Map(),
			setAttribute(name, value) {
				this.attributes.set(name, value)
			},
		}
		const item = {
			textContent: fixture.title,
			querySelector: (selector) =>
				selector === 'input[type="checkbox"]' ? input : null,
		}
		return {
			dataset: {
				taskId: fixture.id,
				taskPhase: fixture.phase,
				taskRequired: String(fixture.required),
			},
			closest: (selector) => (selector === 'li' ? item : null),
			input,
		}
	})

	return {
		markers,
		phaseSlots,
		phaseNextSlots,
		slots,
		querySelectorAll: (selector) => {
			if (selector === '[data-task-id]') return markers
			if (selector === '[data-progress-phase]') return phaseSlots
			if (selector === '[data-progress-next-phase]') return phaseNextSlots
			return []
		},
		querySelector: (selector) => slots.get(selector) ?? null,
	}
}

test('extracts task metadata and enables its rendered checkbox', () => {
	const root = makeRoot([
		{ id: 'setup-trusts', title: 'Unlock Trusts', phase: 'setup', required: true },
	])

	const tasks = extractTasks(root)

	assert.deepEqual(tasks, [
		{ id: 'setup-trusts', title: 'Unlock Trusts', phase: 'setup', required: true },
	])
	assert.equal(root.markers[0].input.disabled, false)
	assert.equal(root.markers[0].input.attributes.get('aria-label'), 'Unlock Trusts')
})

test('renders the next project in a dedicated phase independently of the main route', () => {
	const root = makeRoot()
	const tasks = [
		{ id: 'cor-entry', title: 'Finish entry COR', phase: 'cor', required: true },
		{ id: 'brd-skills', title: 'Cap BRD skills', phase: 'brd', required: true },
		{ id: 'brd-three-song', title: 'Obtain a three-song instrument', phase: 'brd', required: true },
	]

	renderProgress(root, {
		tasks,
		progress: {
			version: 1,
			completedTaskIds: ['brd-skills'],
			lastVisitedPhase: 'brd',
		},
		persistent: true,
	})

	assert.equal(root.slots.get('[data-progress-next]').textContent, 'Finish entry COR')
	assert.equal(root.phaseNextSlots[0].textContent, 'Obtain a three-song instrument')
})

test('renders restored checks, totals, and the next required action', () => {
	const root = makeRoot([
		{ id: 'setup-trusts', title: 'Unlock Trusts', phase: 'setup', required: true },
		{ id: 'reach-80', title: 'Reach level 80', phase: 'level', required: true },
	])
	const tasks = extractTasks(root)

	renderProgress(root, {
		tasks,
		progress: {
			version: 1,
			completedTaskIds: ['setup-trusts'],
			lastVisitedPhase: 'setup',
		},
		persistent: true,
	})

	assert.equal(root.markers[0].input.checked, true)
	assert.equal(root.markers[1].input.checked, false)
	assert.equal(root.slots.get('[data-progress-summary]').textContent, '1 of 2 tasks complete · 50%')
	assert.equal(root.slots.get('[data-progress-next]').textContent, 'Reach level 80')
	assert.equal(root.slots.get('[data-progress-bar]').value, 50)
	assert.equal(root.slots.get('[data-progress-temporary]').hidden, true)
	assert.equal(root.slots.get('[data-post-99]').hidden, false)
	assert.equal(root.phaseSlots[0].textContent, '1/1 · 100%')
	assert.equal(root.phaseSlots[1].textContent, '0/1 · 0%')
})

test('excludes archived tasks from active dashboard progress', () => {
	const root = makeRoot([
		{ id: 'old-return-task', title: 'Old return task', phase: 'setup', required: true },
		{ id: 'current-goal', title: 'Build current gear', phase: 'level', required: true },
	])
	const tasks = [
		{
			id: 'old-return-task',
			title: 'Old return task',
			phase: 'setup',
			required: true,
			active: false,
		},
		{
			id: 'current-goal',
			title: 'Build current gear',
			phase: 'level',
			required: true,
		},
	]

	renderProgress(root, {
		tasks,
		progress: {
			version: 1,
			completedTaskIds: ['old-return-task'],
			lastVisitedPhase: 'setup',
		},
		persistent: true,
	})

	assert.equal(root.markers[0].input.checked, true)
	assert.equal(root.slots.get('[data-progress-summary]').textContent, '0 of 1 tasks complete · 0%')
	assert.equal(root.slots.get('[data-progress-next]').textContent, 'Build current gear')
	assert.equal(root.phaseSlots[0].textContent, '0/0 · 0%')
	assert.equal(root.phaseSlots[1].textContent, '0/1 · 0%')
})

test('shows a temporary-progress notice when persistence is unavailable', () => {
	const root = makeRoot()

	renderProgress(root, {
		tasks: [],
		progress: { version: 1, completedTaskIds: [], lastVisitedPhase: null },
		persistent: false,
	})

	assert.equal(root.slots.get('[data-progress-temporary]').hidden, false)
})

test('installs one Docsify doneEach handler', () => {
	const callbacks = []
	const hook = { doneEach: (callback) => callbacks.push(callback) }

	installProgressPlugin(hook, {}, {
		root: makeRoot(),
		tasks: [],
		store: {
			persistent: true,
			load: () => ({ version: 1, completedTaskIds: [], lastVisitedPhase: null }),
			save() {},
			clear() {},
		},
	})

	assert.equal(callbacks.length, 1)
})
