import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { downloadReferral } from '../utilities/downloadReferral.js';
import '../styles/dashboard.css';
import '../styles/marketplace.css';
import '../styles/referralDetails.css';

function getTimeLeft(expiry) {
	const remaining = Math.max(0, new Date(expiry).getTime() - Date.now());
	const hours = Math.floor(remaining / (60 * 60 * 1000));
	const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

	return `${hours}h ${minutes}m`;
}

function ReferralDetailsPage({ reservedReferrals }) {
	const { wallet, disconnectWallet } = useWallet();
	const navigate = useNavigate();
	const { id } = useParams();
	const referral = useMemo(
		() => reservedReferrals.find((item) => String(item.id) === id),
		[reservedReferrals, id]
	);
	const [timeLeft, setTimeLeft] = useState(referral ? getTimeLeft(referral.expiry) : '0h 0m');
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (!wallet) navigate('/');
	}, [wallet, navigate]);

	useEffect(() => {
		if (!referral) {
			return undefined;
		}

		const intervalId = window.setInterval(() => {
			setTimeLeft(getTimeLeft(referral.expiry));
		}, 60000);

		setTimeLeft(getTimeLeft(referral.expiry));

		return () => window.clearInterval(intervalId);
	}, [referral]);

	const handleDisconnect = () => {
		disconnectWallet();
		navigate('/');
	};

	const handleCopy = async () => {
		if (!referral) {
			return;
		}

		await navigator.clipboard.writeText(referral.secret);
		setCopied(true);
		window.setTimeout(() => setCopied(false), 1600);
	};

	if (!referral) {
		return (
			<div className="dashboard-page">
				<nav className="dashboard-nav">
					<div className="dashboard-brand">STKON</div>
					<div className="dashboard-tabs">
						<NavLink className="dashboard-tab" to="/dashboard">Dashboard</NavLink>
						<NavLink className="dashboard-tab" to="/marketplace">Referral Marketplace</NavLink>
					</div>
					<div className="wallet-section">
						<span className="wallet-pill">{wallet}</span>
						<button className="button button--ghost" onClick={handleDisconnect}>Disconnect</button>
					</div>
				</nav>
				<main className="dashboard-shell">
					<section className="details-panel details-panel--empty">
						<h1 className="dashboard-title">Reserved referral not found</h1>
						<p className="marketplace-subtitle">Reserve an available referral from the marketplace to reveal details.</p>
						<button className="button button--primary" onClick={() => navigate('/marketplace')}>Back to Marketplace</button>
					</section>
				</main>
			</div>
		);
	}

	return (
		<div className="dashboard-page">
			<nav className="dashboard-nav">
				<div className="dashboard-brand">STKON</div>
				<div className="dashboard-tabs">
					<NavLink className="dashboard-tab" to="/dashboard">Dashboard</NavLink>
					<NavLink className="dashboard-tab" to="/marketplace">Referral Marketplace</NavLink>
				</div>
				<div className="wallet-section">
					<span className="wallet-pill">{wallet}</span>
					<button className="button button--ghost" onClick={handleDisconnect}>Disconnect</button>
				</div>
			</nav>

			<main className="dashboard-shell details-shell">
				<section className="dashboard-topline">
					<div>
						<p className="dashboard-kicker">Reserved referral</p>
						<h1 className="dashboard-title">{referral.label}</h1>
						<p className="marketplace-subtitle">Reservation expires in {timeLeft}</p>
					</div>
					<button className="button button--ghost" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
				</section>

				<section className="details-panel">
					<div className="details-grid">
						<div className="details-field">
							<span>Referral Label</span>
							<strong>{referral.label}</strong>
						</div>
						<div className="details-field">
							<span>Referrer Wallet</span>
							<strong>{referral.referrer}</strong>
						</div>
						<div className="details-field">
							<span>Reservation Expiry</span>
							<strong>{new Date(referral.expiry).toLocaleString()}</strong>
						</div>
						<div className="details-field">
							<span>Validator Pubkey</span>
							<strong>{referral.validatorPubkey}</strong>
						</div>
					</div>

					<div className="secret-box">
						<div>
							<span>Secret Code</span>
							<code>{referral.secret}</code>
						</div>
						<div className="secret-actions">
							<button className="button button--ghost" onClick={handleCopy}>{copied ? 'Copied' : 'Copy'}</button>
							<button className="button button--primary" onClick={() => downloadReferral(referral)}>Download</button>
						</div>
					</div>
				</section>
			</main>
		</div>
	);
}

export default ReferralDetailsPage;
