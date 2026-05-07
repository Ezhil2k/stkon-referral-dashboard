export const BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const DEBUG_API = true;

export function logApiRequest(apiName, method, url, payload) {
	if (!DEBUG_API) return;

	console.groupCollapsed(`[API REQUEST] ${apiName}`);
	console.log('METHOD:', method);
	console.log('URL:', url);

	const safePayload = { ...(payload || {}) };

	if (safePayload.secret) {
		safePayload.secret = '[HIDDEN]';
	}

	console.log('PAYLOAD:', safePayload);
	console.groupEnd();
}

export function logApiResponse(apiName, response) {
	if (!DEBUG_API) return;

	console.groupCollapsed(`[API RESPONSE] ${apiName}`);

	const safeResponse = structuredClone(response);

	if (safeResponse?.data?.secret) {
		safeResponse.data.secret = '[HIDDEN]';
	}

	if (Array.isArray(safeResponse?.data)) {
		safeResponse.data = safeResponse.data.map((item) => ({
			...item,
			secret: item.secret ? '[HIDDEN]' : item.secret,
		}));
	}

	console.log(safeResponse);
	console.groupEnd();
}

export function logApiError(apiName, error) {
	if (!DEBUG_API) return;

	console.groupCollapsed(`[API ERROR] ${apiName}`);
	console.error(error?.response?.data || error);
	console.groupEnd();
}

export async function apiRequest(path, options = {}) {
	const url = `${BASE_URL}${path}`;
	const response = await fetch(url, {
		headers: {
			'Content-Type': 'application/json',
			...options.headers,
		},
		...options,
	});

	let data = null;

	try {
		data = await response.json();
	} catch {
		data = null;
	}

	if (!response.ok) {
		const message = data?.message || `Request failed with status ${response.status}`;
		const error = new Error(message);
		error.response = {
			data,
			status: response.status,
			url,
		};
		throw error;
	}

	return data;
}
