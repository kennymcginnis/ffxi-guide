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
		slots,
		querySelectorAll: (selector) => {
			if (selector === '[data-task-id]') return markers
			if (selector === '[data-progress-phase]') return phaseSlots
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
