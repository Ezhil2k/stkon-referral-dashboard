import { apiRequest, BASE_URL } from './api.js';

export async function healthCheck() {
	return apiRequest('/health');
}

export async function fetchMarketplaceReferrals() {
	const response = await apiRequest('/marketplace');

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
}

export async function reserveReferral(walletAddress, referralId) {
	const response = await apiRequest('/reserve', {
		method: 'POST',
		body: JSON.stringify({
			walletAddress,
			referralId,
		}),
	});

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
}

export async function revealReferralSecret(walletAddress, referralId) {
	const response = await apiRequest('/reveal', {
		method: 'POST',
		body: JSON.stringify({
			walletAddress,
			referralId,
		}),
	});

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
}

export async function markReferralUsed(walletAddress, referralId) {
	const response = await apiRequest('/use', {
		method: 'POST',
		body: JSON.stringify({
			walletAddress,
			referralId,
		}),
	});

	if (!response?.success) {
		throw new Error(response?.message || 'Unable to mark this referral as used.');
	}

	const item = response?.data;

	return {
		id: item?._id,
		status: item?.status,
		raw: item,
	};
}

export async function generateReferrals(walletAddress, count) {
	const requestBody = {
		referrerAddress: walletAddress,
		count: Number(count),
	};

	console.log('GENERATE REQUEST BODY', requestBody);

	let response;

	try {
		response = await fetch(`${BASE_URL}/generate`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(requestBody),
		});
	} catch (error) {
		console.error('GENERATE API ERROR', error.response?.data || error);
		throw error;
	}

	const data = await response.json();

	if (!response.ok || !data?.success) {
		console.error('GENERATE API ERROR', data);
		throw new Error(data?.message || `Request failed with status ${response.status}`);
	}

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
