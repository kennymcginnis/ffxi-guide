const PROGRESS_VERSION = 1

export function createEmptyProgress() {
	return {
		version: PROGRESS_VERSION,
		completedTaskIds: [],
		lastVisitedPhase: null,
	}
}

export function getSafeStorage(getStorage) {
	try {
		return getStorage()
	} catch {
		return null
	}
}

function asKnownTaskSet(knownTaskIds) {
	return knownTaskIds instanceof Set ? knownTaskIds : new Set(knownTaskIds)
}

function copyProgress(progress) {
	return {
		version: progress.version,
		completedTaskIds: [...progress.completedTaskIds],
		lastVisitedPhase: progress.lastVisitedPhase,
	}
}

export function normalizeProgress(value, knownTaskIds) {
	if (!value || typeof value !== 'object' || value.version !== PROGRESS_VERSION) {
		return createEmptyProgress()
	}

	const known = asKnownTaskSet(knownTaskIds)
	const completedTaskIds = Array.isArray(value.completedTaskIds)
		? [...new Set(value.completedTaskIds)].filter(
				(id) => typeof id === 'string' && known.has(id),
			)
		: []
	const lastVisitedPhase =
		typeof value.lastVisitedPhase === 'string' ? value.lastVisitedPhase : null

	return { version: PROGRESS_VERSION, completedTaskIds, lastVisitedPhase }
}

export function calculateProgress(taskIds, completedTaskIds) {
	const tasks = [...new Set(taskIds)]
	const completed = new Set(completedTaskIds)
	const completedCount = tasks.filter((id) => completed.has(id)).length

	return {
		completed: completedCount,
		total: tasks.length,
		percent: tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100),
	}
}

export function findNextTask(tasks, completedTaskIds) {
	const completed = new Set(completedTaskIds)
	return tasks.find((task) => task.required && !completed.has(task.id)) ?? null
}

export function parseProgressImport(text, knownTaskIds) {
	let value
	try {
		value = JSON.parse(text)
	} catch {
		return { ok: false, error: 'That backup is not valid JSON.' }
	}

	if (!value || typeof value !== 'object' || value.version !== PROGRESS_VERSION) {
		return {
			ok: false,
			error: 'That backup uses an unsupported progress version.',
		}
	}

	if (!Array.isArray(value.completedTaskIds)) {
		return { ok: false, error: 'That backup does not contain a task list.' }
	}
	if (!value.completedTaskIds.every((id) => typeof id === 'string')) {
		return { ok: false, error: 'That backup contains invalid task IDs.' }
	}

	return { ok: true, value: normalizeProgress(value, knownTaskIds) }
}

export function createProgressStore(storage, key) {
	let memory = createEmptyProgress()
	let persistent = Boolean(storage)

	function disablePersistence() {
		persistent = false
	}

	return {
		get persistent() {
			return persistent
		},
		load(knownTaskIds) {
			if (!persistent) return copyProgress(memory)

			try {
				const stored = storage.getItem(key)
				if (stored === null) return copyProgress(memory)
				memory = normalizeProgress(JSON.parse(stored), knownTaskIds)
				return copyProgress(memory)
			} catch {
				disablePersistence()
				return copyProgress(memory)
			}
		},
		save(progress) {
			memory = copyProgress(progress)
			if (!persistent) return

			try {
				storage.setItem(key, JSON.stringify(memory))
			} catch {
				disablePersistence()
			}
		},
		clear() {
			memory = createEmptyProgress()
			if (!persistent) return

			try {
				storage.removeItem(key)
			} catch {
				disablePersistence()
			}
		},
	}
}
