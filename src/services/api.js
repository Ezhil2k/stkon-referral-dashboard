export const BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
		throw new Error(message);
	}

	return data;
}
