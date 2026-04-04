import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

function toQueryString(params = {}) {
	const query = new URLSearchParams();

	Object.entries(params).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== '') {
			query.append(key, value);
		}
	});

	const text = query.toString();
	return text ? `?${text}` : '';
}

async function compatRequest(path, { method = 'GET', params = {}, body } = {}) {
	const response = await window.CTFd.fetch(`${path}${toQueryString(params)}`, {
		method,
		body: body ? JSON.stringify(body) : undefined,
	});

	let payload = {};
	try {
		payload = await response.json();
	} catch {
		payload = { success: false, errors: { response: ['Unable to parse server response'] } };
	}

	return {
		status: response.status,
		...payload,
	};
}

function ensureCompatibilityApi() {
	if (!window.CTFd) {
		return;
	}

	const api = window.CTFd.api || {};

	if (!api.get_challenge) {
		api.get_challenge = ({ challengeId }) => compatRequest(`/api/v1/challenges/${challengeId}`);
	}

	if (!api.get_challenge_list) {
		api.get_challenge_list = () => compatRequest('/api/v1/challenges');
	}

	if (!api.post_challenge_attempt) {
		api.post_challenge_attempt = (params = {}, body = {}) =>
			compatRequest('/api/v1/challenges/attempt', {
				method: 'POST',
				params,
				body,
			});
	}

	if (!api.get_challenge_solves) {
		api.get_challenge_solves = ({ challengeId }) =>
			compatRequest(`/api/v1/challenges/${challengeId}/solves`);
	}

	if (!api.get_hint) {
		api.get_hint = ({ hintId, preview } = {}) =>
			compatRequest(`/api/v1/hints/${hintId}`, {
				params: preview ? { preview: true } : {},
			});
	}

	if (!api.unlock_hint) {
		api.unlock_hint = ({ hintId }) =>
			compatRequest('/api/v1/unlocks', {
				method: 'POST',
				body: {
					target: hintId,
					type: 'hints',
				},
			});
	}

	window.CTFd.api = api;
}

function getChallengeWindow() {
	return document.getElementById('challenge-window');
}

function getChallengeModal() {
	const challengeWindow = getChallengeWindow();
	if (!challengeWindow) {
		return null;
	}

	return window.bootstrap.Modal.getOrCreateInstance(challengeWindow);
}

function escapeHtml(value) {
	return String(value ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function clearResultState() {
	const challengeWindow = getChallengeWindow();
	if (!challengeWindow) {
		return;
	}

	const input = challengeWindow.querySelector('#challenge-input');
	const notification = challengeWindow.querySelector('#result-notification');
	const actions = challengeWindow.querySelector('#result-actions');

	if (input) {
		input.classList.remove('wrong', 'correct', 'too-fast');
	}

	if (notification) {
		notification.className = 'alert text-center w-100 d-none';
	}

	if (actions) {
		actions.innerHTML = '';
	}
}

function setResultState(message, variant, actionsMarkup = '') {
	const challengeWindow = getChallengeWindow();
	if (!challengeWindow) {
		return;
	}

	const notification = challengeWindow.querySelector('#result-notification');
	const resultMessage = challengeWindow.querySelector('#result-message');
	const actions = challengeWindow.querySelector('#result-actions');

	if (!notification || !resultMessage || !actions) {
		return;
	}

	notification.className = `alert alert-${variant} text-center w-100`;
	resultMessage.textContent = message;
	actions.innerHTML = actionsMarkup;
}

function applyModalSize(dialog) {
	if (!dialog) {
		return;
	}

	dialog.classList.remove('modal-sm', 'modal-lg', 'modal-xl');

	const size = window.CTFd?.config?.themeSettings?.challenge_window_size;
	if (size === 'sm') {
		dialog.classList.add('modal-sm');
	} else if (size === 'lg') {
		dialog.classList.add('modal-lg');
	} else if (size === 'xl') {
		dialog.classList.add('modal-xl');
	}
}

function enableSubmit() {
	const button = getChallengeWindow()?.querySelector('#challenge-submit');
	if (!button) {
		return;
	}

	button.disabled = false;
	button.classList.remove('disabled-button');
}

function disableSubmit() {
	const button = getChallengeWindow()?.querySelector('#challenge-submit');
	if (!button) {
		return;
	}

	button.disabled = true;
	button.classList.add('disabled-button');
}

function appendNextChallengeAction(nextId) {
	const challengeWindow = getChallengeWindow();
	const actions = challengeWindow?.querySelector('#result-actions');

	if (!actions || !nextId) {
		return;
	}

	actions.innerHTML = '<button type="button" class="btn btn-info mt-3" id="challenge-next">Next Challenge</button>';
	const nextButton = actions.querySelector('#challenge-next');

	if (!nextButton) {
		return;
	}

	nextButton.addEventListener('click', () => {
		const modal = getChallengeModal();
		const challengeWindowEl = getChallengeWindow();

		if (!modal || !challengeWindowEl) {
			return;
		}

		challengeWindowEl.addEventListener(
			'hidden.bs.modal',
			() => {
				loadChallengeById(nextId);
			},
			{ once: true },
		);

		modal.hide();
	});
}

function bumpSolveCount() {
	const solvesButton = getChallengeWindow()?.querySelector('.challenge-solves');
	if (!solvesButton) {
		return;
	}

	const match = solvesButton.textContent.match(/\d+/);
	if (!match) {
		return;
	}

	const solveCount = Number.parseInt(match[0], 10) + 1;
	solvesButton.textContent = `${solveCount} Solve${solveCount === 1 ? '' : 's'}`;
}

function flashInput(stateClass) {
	const input = getChallengeWindow()?.querySelector('#challenge-input');
	if (!input) {
		return;
	}

	input.classList.remove('wrong', 'correct', 'too-fast');
	input.classList.add(stateClass);

	if (stateClass !== 'correct') {
		window.setTimeout(() => {
			input.classList.remove(stateClass);
		}, 3000);
	}
}

function normalizeErrorMessage(response) {
	if (!response?.errors) {
		return 'Something went wrong while processing this request.';
	}

	return Object.values(response.errors)
		.flat()
		.join('\n');
}

async function revealHint(hintId) {
	const challengeWindow = getChallengeWindow();
	const hintButton = challengeWindow?.querySelector(`[data-hint-id="${hintId}"]`);
	const wrapper = hintButton?.closest('.hint-button-wrapper');

	if (!challengeWindow || !hintButton || !wrapper) {
		return;
	}

	let response = await window.CTFd.api.get_hint({ hintId });

	if (!response.success && response.status !== 403) {
		window.alert(normalizeErrorMessage(response));
		return;
	}

	if (!response.data?.content) {
		const confirmed = window.confirm('Unlock this hint?');
		if (!confirmed) {
			return;
		}

		const unlockResponse = await window.CTFd.api.unlock_hint({ hintId });
		if (!unlockResponse.success) {
			window.alert(normalizeErrorMessage(unlockResponse));
			return;
		}

		response = await window.CTFd.api.get_hint({ hintId });
	}

	if (!response.success || !response.data?.html) {
		window.alert(normalizeErrorMessage(response));
		return;
	}

	wrapper.classList.add('hint-button-wrapper--revealed');
	wrapper.innerHTML = `
		<div class="alert alert-warning text-start mb-0">
			<div class="small fw-bold text-uppercase mb-2">Hint</div>
			${response.data.html}
		</div>
	`;
}

function renderSolves(solves) {
	const tbody = getChallengeWindow()?.querySelector('#challenge-solves-names');
	if (!tbody) {
		return;
	}

	tbody.innerHTML = solves
		.map((solve) => {
			const accountName = escapeHtml(solve.name);
			const accountUrl = escapeHtml(solve.account_url);
			const solveTime = escapeHtml(dayjs(solve.date).fromNow());

			return `
				<tr>
					<td><a href="${accountUrl}">${accountName}</a></td>
					<td>${solveTime}</td>
				</tr>
			`;
		})
		.join('');
}

async function loadSolvesForChallenge(challengeId) {
	const response = await window.CTFd.api.get_challenge_solves({ challengeId });
	if (!response.success) {
		window.alert(normalizeErrorMessage(response));
		return;
	}

	renderSolves(response.data || []);
}

async function submitCurrentChallenge() {
	const challengeWindow = getChallengeWindow();
	if (!challengeWindow) {
		return;
	}

	const input = challengeWindow.querySelector('#challenge-input');
	const challengeId = Number.parseInt(
		challengeWindow.querySelector('#challenge-id')?.value || '',
		10,
	);

	if (!input || Number.isNaN(challengeId)) {
		return;
	}

	disableSubmit();
	clearResultState();

	let response;
	if (window.CTFd._internal?.challenge?.submit) {
		response = await window.CTFd._internal.challenge.submit(false);
	} else {
		response = await window.CTFd.api.post_challenge_attempt({}, {
			challenge_id: challengeId,
			submission: input.value,
		});
	}

	if (!response?.data) {
		setResultState('Unable to submit this flag right now.', 'warning');
		enableSubmit();
		return;
	}

	const result = response.data;
	const nextId = window.CTFd._internal?.challenge?.data?.next_id;

	if (result.status === 'authentication_required') {
		window.location = `${window.CTFd.config.urlRoot}/login?next=${window.CTFd.config.urlRoot}${window.location.pathname}${window.location.hash}`;
		return;
	}

	if (result.status === 'incorrect') {
		flashInput('wrong');
		setResultState(result.message, 'danger');
	} else if (result.status === 'correct') {
		input.value = '';
		flashInput('correct');
		setResultState(result.message, 'success');
		appendNextChallengeAction(nextId);
		bumpSolveCount();
	} else if (result.status === 'already_solved') {
		flashInput('correct');
		setResultState(result.message, 'info');
		appendNextChallengeAction(nextId);
	} else if (result.status === 'paused') {
		setResultState(result.message, 'warning');
	} else if (result.status === 'ratelimited') {
		flashInput('too-fast');
		setResultState(result.message, 'warning');
	} else {
		setResultState(result.message || 'Unexpected response received.', 'warning');
	}

	window.setTimeout(() => {
		enableSubmit();
	}, 3000);
}

function bindChallengeWindow(challengeId) {
	const challengeWindow = getChallengeWindow();
	if (!challengeWindow) {
		return;
	}

	const dialog = challengeWindow.querySelector('.modal-dialog');
	applyModalSize(dialog);

	const submitButton = challengeWindow.querySelector('#challenge-submit');
	if (submitButton) {
		submitButton.addEventListener('click', (event) => {
			event.preventDefault();
			submitCurrentChallenge();
		});
	}

	const challengeInput = challengeWindow.querySelector('#challenge-input');
	if (challengeInput) {
		challengeInput.addEventListener('keyup', (event) => {
			if (event.key === 'Enter') {
				event.preventDefault();
				submitCurrentChallenge();
			}
		});
	}

	challengeWindow.querySelectorAll('.load-hint').forEach((hintButton) => {
		hintButton.addEventListener('click', (event) => {
			event.preventDefault();
			revealHint(hintButton.dataset.hintId);
		});
	});

	const solvesButton = challengeWindow.querySelector('.challenge-solves');
	if (solvesButton) {
		solvesButton.addEventListener('click', () => {
			loadSolvesForChallenge(challengeId);
		});
	}

	challengeWindow.addEventListener('hide.bs.modal', () => {
		clearResultState();
		history.replaceState(null, '', window.location.pathname + window.location.search);
	}, { once: true });
}

async function loadChallengeById(challengeId) {
	ensureCompatibilityApi();

	const challengeWindow = getChallengeWindow();
	if (!challengeWindow) {
		return;
	}

	await window.CTFd.pages.challenge.displayChallenge(challengeId, (challenge) => {
		challengeWindow.innerHTML = challenge.data.view;
		bindChallengeWindow(challengeId);

		const modal = getChallengeModal();
		if (!modal) {
			return;
		}

		modal.show();
		history.replaceState(null, '', `#${challenge.data.name}-${challengeId}`);
	});
}

function loadChallengeFromHash() {
	if (!window.location.hash) {
		return;
	}

	const challengeHash = decodeURIComponent(window.location.hash.substring(1));
	const separatorIndex = challengeHash.lastIndexOf('-');
	if (separatorIndex < 0) {
		return;
	}

	const challengeId = challengeHash.slice(separatorIndex + 1);
	if (!/^\d+$/.test(challengeId)) {
		return;
	}

	loadChallengeById(challengeId);
}

ensureCompatibilityApi();
window.MarioKartChallenges = {
	loadChallenge: loadChallengeById,
};

document.addEventListener('DOMContentLoaded', () => {
	loadChallengeFromHash();
});
