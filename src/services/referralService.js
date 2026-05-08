import {
	apiRequest,
	BASE_URL,
	logApiError,
	logApiRequest,
	logApiResponse,
} from './api.js';

function maskSecrets(value) {
	if (Array.isArray(value)) {
		return value.map(maskSecrets);
	}

	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value).map(([key, itemValue]) => [
				key,
				key === 'secret' && itemValue ? '[HIDDEN]' : maskSecrets(itemValue),
			])
		);
	}

	return value;
}

export async function healthCheck() {
	const apiName = 'healthCheck';
	const url = `${BASE_URL}/health`;

	logApiRequest(apiName, 'GET', url, {});

	try {
		const response = await apiRequest('/health');
		logApiResponse(apiName, response);
		return response;
	} catch (error) {
		logApiError(apiName, error);
		throw error;
	}
}

export async function fetchMarketplaceReferrals() {
	const apiName = 'fetchMarketplaceReferrals';
	const url = `${BASE_URL}/marketplace`;

	logApiRequest(apiName, 'GET', url, {});

	try {
		const response = await apiRequest('/marketplace');
		logApiResponse(apiName, response);

		if (!response?.success) {
			throw new Error(response?.message || 'Unable to load marketplace referrals.');
		}

		const referrals = Array.isArray(response?.data) ? response.data : [];

		return referrals.map((item) => ({
			id: item._id,
			label: item.label,
			referrer: item.referrerAddress,
			status: item.status,
			createdAt: item.createdAt,
			raw: item,
		}));
	} catch (error) {
		logApiError(apiName, error);
		throw error;
	}
}

export async function fetchMyReferrals(walletAddress) {
	const apiName = 'fetchMyReferrals';
	const url = `${BASE_URL}/my/${encodeURIComponent(walletAddress)}`;

	console.log('FETCH MY REFERRALS WALLET', walletAddress);
	logApiRequest(apiName, 'GET', url, { walletAddress });

	try {
		const response = await apiRequest(`/my/${encodeURIComponent(walletAddress)}`);
		console.log('MY REFERRALS RESPONSE', maskSecrets(response?.data));
		logApiResponse(apiName, response);

		if (!response?.success) {
			throw new Error(response?.message || 'Unable to load your referrals.');
		}

		const referrals = Array.isArray(response?.data) ? response.data : [];

		return referrals.map((item) => ({
			id: item._id || item.id,
			label: item.label,
			secret: item.secret,
			commitmentHash: item.commitmentHash,
			status: item.status,
			createdAt: item.createdAt,
			referrer: item.referrerAddress || item.referrer,
			reservedWallet: item.reservedBy || item.reservedWallet || null,
			raw: item,
		}));
	} catch (error) {
		logApiError(apiName, error);
		throw error;
	}
}

export async function fetchMyReservations(walletAddress) {
	const apiName = 'fetchMyReservations';
	const url = `${BASE_URL}/reservations/${encodeURIComponent(walletAddress)}`;

	console.log('FETCH MY RESERVATIONS WALLET', walletAddress);
	logApiRequest(apiName, 'GET', url, { walletAddress });

	try {
		const response = await apiRequest(`/reservations/${encodeURIComponent(walletAddress)}`);
		console.log('MY RESERVATIONS RESPONSE', maskSecrets(response?.data));
		logApiResponse(apiName, response);

		if (!response?.success) {
			throw new Error(response?.message || 'Unable to load your reservations.');
		}

		const reservations = Array.isArray(response?.data) ? response.data : [];

		return reservations.map((item) => ({
			id: item.referralId?._id || item.referral?._id || item.referralId || item._id || item.id,
			label: item.label || item.referralId?.label || item.referral?.label,
			referrer: item.referrerAddress || item.referrer || item.referralId?.referrerAddress || item.referral?.referrerAddress,
			reservedAt: item.reservedAt,
			expiresAt: item.expiresAt || item.expiry || item.expiryAt,
			status: item.status,
			raw: item,
		}));
	} catch (error) {
		logApiError(apiName, error);
		throw error;
	}
}

export async function checkSupernodeStatus(walletAddress) {
	const apiName = 'checkSupernodeStatus';
	const url = `${BASE_URL}/supernode/${encodeURIComponent(walletAddress)}`;

	console.log('CHECKING SUPERNODE STATUS', walletAddress);
	logApiRequest(apiName, 'GET', url, { walletAddress });

	try {
		const response = await apiRequest(`/supernode/${encodeURIComponent(walletAddress)}`);
		console.log('SUPERNODE RESPONSE', response?.data ?? response);
		logApiResponse(apiName, response);

		if (!response?.success) {
			throw new Error(response?.message || 'Unable to verify account type.');
		}

		return Boolean(response.isSupernode);
	} catch (error) {
		logApiError(apiName, error);
		throw error;
	}
}

export async function reserveReferral(walletAddress, referralId) {
	const apiName = 'reserveReferral';
	const url = `${BASE_URL}/reserve`;
	const payload = { walletAddress, referralId };

	logApiRequest(apiName, 'POST', url, payload);

	try {
		const response = await apiRequest('/reserve', {
			method: 'POST',
			body: JSON.stringify(payload),
		});

		logApiResponse(apiName, response);

		if (!response?.success) {
			throw new Error(response?.message || 'Unable to reserve this referral.');
		}

		const item = response?.data;

		return {
			id: item?._id,
			label: item?.label,
			status: item?.status,
			reservedBy: item?.reservedBy,
			reservedAt: item?.reservedAt,
			raw: item,
		};
	} catch (error) {
		logApiError(apiName, error);
		throw error;
	}
}

export async function cancelReservation(walletAddress, referralId) {
	const apiName = 'cancelReservation';
	const url = `${BASE_URL}/cancel-reservation`;
	const payload = { walletAddress, referralId };

	console.log('CANCEL RESERVATION PAYLOAD', payload);
	logApiRequest(apiName, 'POST', url, payload);

	try {
		const response = await apiRequest('/cancel-reservation', {
			method: 'POST',
			body: JSON.stringify(payload),
		});

		console.log('CANCEL RESPONSE', maskSecrets(response?.data));
		logApiResponse(apiName, response);

		if (!response?.success) {
			throw new Error(response?.message || 'Unable to cancel this reservation.');
		}

		return response?.data;
	} catch (error) {
		logApiError(apiName, error);
		throw error;
	}
}

export async function revealReferralSecret(walletAddress, referralId) {
	const apiName = 'revealReferralSecret';
	const url = `${BASE_URL}/reveal`;
	const payload = { walletAddress, referralId };

	logApiRequest(apiName, 'POST', url, payload);

	try {
		const response = await apiRequest('/reveal', {
			method: 'POST',
			body: JSON.stringify(payload),
		});

		logApiResponse(apiName, response);

		if (!response?.success) {
			throw new Error(response?.message || 'Unable to reveal this referral secret.');
		}

		const item = response?.data;

		return {
			id: item?.referralId,
			label: item?.label,
			referrer: item?.referrerAddress,
			secret: item?.secret,
			reservedAt: item?.reservedAt,
			raw: item,
		};
	} catch (error) {
		logApiError(apiName, error);
		throw error;
	}
}

export async function markReferralUsed(walletAddress, referralId) {
	const apiName = 'markReferralUsed';
	const url = `${BASE_URL}/use`;
	const payload = { walletAddress, referralId };

	logApiRequest(apiName, 'POST', url, payload);

	try {
		const response = await apiRequest('/use', {
			method: 'POST',
			body: JSON.stringify(payload),
		});

		logApiResponse(apiName, response);

		if (!response?.success) {
			throw new Error(response?.message || 'Unable to mark this referral as used.');
		}

		const item = response?.data;

		return {
			id: item?._id,
			status: item?.status,
			raw: item,
		};
	} catch (error) {
		logApiError(apiName, error);
		throw error;
	}
}

export async function generateReferrals(walletAddress, count) {
	const apiName = 'generateReferrals';
	const url = `${BASE_URL}/generate`;
	const requestBody = {
		referrerAddress: walletAddress,
		count: Number(count),
	};

	logApiRequest(apiName, 'POST', url, requestBody);

	let response;

	try {
		response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(requestBody),
		});
	} catch (error) {
		logApiError(apiName, error);
		throw error;
	}

	const data = await response.json();

	if (!response.ok || !data?.success) {
		const error = new Error(data?.message || `Request failed with status ${response.status}`);
		error.response = {
			data,
			status: response.status,
			url,
		};
		logApiError(apiName, error);
		throw error;
	}

	logApiResponse(apiName, data);

	const referrals = Array.isArray(data?.data) ? data.data : [];

	return referrals.map((item) => ({
		id: item.id || item._id,
		label: item.label,
		secret: item.secret,
		commitmentHash: item.commitmentHash,
		status: item.status,
		createdAt: item.createdAt || new Date().toISOString(),
		referrer: walletAddress,
		reservedWallet: item.reservedBy || null,
		raw: item,
	}));
}
