import { useEffect, useState } from 'react';

function getCountdown(expiresAt, now = Date.now()) {
	if (!expiresAt) {
		return 'No expiry';
	}

	const remaining = Math.max(0, new Date(expiresAt).getTime() - now);
	const hours = Math.floor(remaining / (60 * 60 * 1000));
	const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
	const seconds = Math.floor((remaining % (60 * 1000)) / 1000);

	return `${hours}h ${minutes}m ${seconds}s`;
}

function formatDate(value) {
	if (!value) {
		return '-';
	}

	return new Date(value).toLocaleString();
}

function MyReservationsPanel({
	reservations,
	isLoading = false,
	error = '',
	cancelingId = null,
	onOpen,
	onCancel,
}) {
	const [now, setNow] = useState(Date.now());

	useEffect(() => {
		const intervalId = window.setInterval(() => {
			setNow(Date.now());
		}, 1000);

		return () => window.clearInterval(intervalId);
	}, []);

	return (
		<section className="marketplace-panel">
			<div className="reservation-panel__header">
				<div>
					<p className="dashboard-kicker">Private reservations</p>
					<h2 className="referral-panel__title">My Reservations</h2>
				</div>
				<span className="referral-count">{reservations.length} / 2 Active Reservations</span>
			</div>

			{isLoading && <p className="marketplace-state">Loading your reservations...</p>}
			{!isLoading && error && <p className="marketplace-state marketplace-state--error">{error}</p>}
			{!isLoading && !error && reservations.length ? (
				<div className="reservation-list">
					{reservations.map((reservation) => (
						<div className="reservation-row" key={reservation.id}>
							<div className="reservation-identity">
								<strong>{reservation.label}</strong>
								<span>{reservation.referrer || '-'}</span>
							</div>
							<span>{formatDate(reservation.reservedAt)}</span>
							<span>
								{formatDate(reservation.expiresAt)}
								<small>{getCountdown(reservation.expiresAt, now)}</small>
							</span>
							<div className="reservation-actions">
								<button className="button button--ghost" onClick={() => onOpen(reservation.id)}>
									Open
								</button>
								<button
									className="button button--ghost"
									disabled={Boolean(cancelingId)}
									onClick={() => onCancel(reservation.id)}
								>
									{cancelingId === reservation.id ? 'Canceling' : 'Cancel'}
								</button>
							</div>
						</div>
					))}
				</div>
			) : null}
			{!isLoading && !error && reservations.length === 0 && (
				<p className="marketplace-state">No active reservations yet.</p>
			)}
		</section>
	);
}

export default MyReservationsPanel;
