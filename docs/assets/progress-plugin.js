import {
	calculateProgress,
	findNextTask,
	parseProgressImport,
} from './progress-model.js'

const boundRoots = new WeakSet()

function taskMarkerForInput(input) {
	return input.closest('li')?.querySelector('[data-task-id]') ?? null
}

function setStatus(root, message, isError = false) {
	const status = root.querySelector('[data-progress-status]')
	if (!status) return
	status.textContent = message
	status.dataset.state = isError ? 'error' : 'success'
}

export function extractTasks(root) {
	return [...root.querySelectorAll('[data-task-id]')].flatMap((marker) => {
		const item = marker.closest('li')
		const checkbox = item?.querySelector('input[type="checkbox"]')
		if (!item || !checkbox || !marker.dataset.taskId) return []

		checkbox.disabled = false
		checkbox.setAttribute?.('aria-label', item.textContent.trim())
		return [
			{
				id: marker.dataset.taskId,
				title: item.textContent.trim(),
				phase: marker.dataset.taskPhase || 'guide',
				required: marker.dataset.taskRequired !== 'false',
			},
		]
	})
}

export function renderProgress(root, { tasks, progress, persistent }) {
	const completed = new Set(progress.completedTaskIds)
	for (const marker of root.querySelectorAll('[data-task-id]')) {
		const checkbox = marker.closest('li')?.querySelector('input[type="checkbox"]')
		if (checkbox) checkbox.checked = completed.has(marker.dataset.taskId)
	}

	const totals = calculateProgress(
		tasks.map((task) => task.id),
		progress.completedTaskIds,
	)
	const summary = root.querySelector('[data-progress-summary]')
	if (summary) {
		summary.textContent = `${totals.completed} of ${totals.total} tasks complete · ${totals.percent}%`
	}
	const bar = root.querySelector('[data-progress-bar]')
	if (bar) {
		bar.value = totals.percent
		bar.textContent = `${totals.percent}%`
	}
	const next = root.querySelector('[data-progress-next]')
	if (next) {
		next.textContent = findNextTask(tasks, progress.completedTaskIds)?.title ?? 'Core route complete — choose what sounds fun next.'
	}
	const temporary = root.querySelector('[data-progress-temporary]')
	if (temporary) temporary.hidden = persistent
	for (const phaseSlot of root.querySelectorAll('[data-progress-phase]')) {
		const phaseTasks = tasks.filter(
			(task) => task.phase === phaseSlot.dataset.progressPhase,
		)
		const phaseProgress = calculateProgress(
			phaseTasks.map((task) => task.id),
			progress.completedTaskIds,
		)
		phaseSlot.textContent = `${phaseProgress.completed}/${phaseProgress.total} · ${phaseProgress.percent}%`
	}
	const post99 = root.querySelector('[data-post-99]')
	if (post99) post99.hidden = !completed.has(post99.dataset.progressTaskId)
}

function downloadProgress(progress) {
	const blob = new Blob([JSON.stringify(progress, null, 2)], {
		type: 'application/json',
	})
	const link = document.createElement('a')
	link.href = URL.createObjectURL(blob)
	link.download = 'ffxi-guide-progress.json'
	link.click()
	URL.revokeObjectURL(link.href)
}

function bindControls(root, state) {
	if (boundRoots.has(root) || typeof root.addEventListener !== 'function') return
	boundRoots.add(root)

	root.addEventListener('change', (event) => {
		if (!event.target.matches?.('input[type="checkbox"]')) return
		const marker = taskMarkerForInput(event.target)
		if (!marker?.dataset.taskId) return

		const completed = new Set(state.progress.completedTaskIds)
		if (event.target.checked) completed.add(marker.dataset.taskId)
		else completed.delete(marker.dataset.taskId)
		state.progress = {
			...state.progress,
			completedTaskIds: [...completed],
			lastVisitedPhase: marker.dataset.taskPhase || null,
		}
		state.store.save(state.progress)
		renderProgress(root, { ...state, persistent: state.store.persistent })
	})

	root.addEventListener('click', (event) => {
		const action = event.target.closest?.('[data-progress-action]')?.dataset.progressAction
		if (!action) return
		if (action === 'export') downloadProgress(state.progress)
		if (action === 'reset' && window.confirm('Reset every saved guide checkbox?')) {
			state.store.clear()
			state.progress = state.store.load(new Set(state.tasks.map((task) => task.id)))
			renderProgress(root, { ...state, persistent: state.store.persistent })
			setStatus(root, 'Progress reset.')
		}
		if (action === 'import') {
			const text = window.prompt('Paste the contents of an FFXI guide progress backup:')
			if (text === null) return
			const result = parseProgressImport(text, new Set(state.tasks.map((task) => task.id)))
			if (!result.ok) {
				setStatus(root, result.error, true)
				return
			}
			state.progress = result.value
			state.store.save(state.progress)
			renderProgress(root, { ...state, persistent: state.store.persistent })
			setStatus(root, 'Progress imported.')
		}
	})
}

export function installProgressPlugin(hook, _vm, options) {
	hook.doneEach(() => {
		const root =
			typeof options.root === 'function'
				? options.root()
				: options.root ?? document.querySelector('.markdown-section')
		if (!root) return

		extractTasks(root)
		const knownTaskIds = new Set(options.tasks.map((task) => task.id))
		const state = {
			tasks: options.tasks,
			store: options.store,
			progress: options.store.load(knownTaskIds),
		}
		renderProgress(root, {
			...state,
			persistent: options.store.persistent,
		})
		bindControls(root, state)
	})
}
