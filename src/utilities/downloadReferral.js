export function downloadReferral(referral) {
	const lines = [
		`Referral label: ${referral.label}`,
		`Secret: ${referral.secret}`,
		`Referrer: ${referral.referrer}`,
		`Expiry date: ${new Date(referral.expiry).toLocaleString()}`,
	];
	const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');

	link.href = url;
	link.download = `${referral.label}-reservation.txt`;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
}
