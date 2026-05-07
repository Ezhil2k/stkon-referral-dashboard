
import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import BackendStatus from '../components/common/BackendStatus.jsx';
import GenerateReferralModal from '../components/dashboard/GenerateReferralModal.jsx';
import { fetchMyReferrals, generateReferrals } from '../services/referralService.js';
import { downloadReferral } from '../utilities/downloadReferral.js';
import '../styles/dashboard.css';

const statusColors = {
	available: '#2ecc40',
	reserved: '#f1c40f',
	used: '#e74c3c',
};

function StatCard({ label, value }) {
	return (
		<div className="stat-card">
			<div className="stat-card__label">{label}</div>
			<div className="stat-card__value">{value}</div>
		</div>
	);
}

function Badge({ status }) {
	return (
		<span className="status-badge" style={{ '--badge-color': statusColors[status] }}>{status}</span>
	);
}

function DashboardPage({ backendStatus = 'loading' }) {
	const { walletAddress, disconnectWallet } = useWallet();
	const navigate = useNavigate();
	const [referrals, setReferrals] = useState([]);
	const [isReferralsLoading, setIsReferralsLoading] = useState(true);
	const [referralsError, setReferralsError] = useState('');
	const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);
	const [generateError, setGenerateError] = useState('');
	const [generatedReferrals, setGeneratedReferrals] = useState([]);

	useEffect(() => {
		console.log('CONNECTED WALLET:', walletAddress);
	}, [walletAddress]);

	useEffect(() => {
		if (!walletAddress) {
			setReferrals([]);
			return;
		}

		let isMounted = true;

		setIsReferralsLoading(true);
		setReferralsError('');

		fetchMyReferrals(walletAddress)
			.then((myReferrals) => {
				if (!isMounted) return;
				setReferrals(myReferrals);
			})
			.catch((error) => {
				if (!isMounted) return;
				setReferralsError(error.message || 'Unable to load your referrals.');
			})
			.finally(() => {
				if (isMounted) {
					setIsReferralsLoading(false);
				}
			});

		return () => {
			isMounted = false;
		};
	}, [walletAddress]);

	const stats = useMemo(() => {
		const total = referrals.length;
		const available = referrals.filter(r => r.status === 'available').length;
		const reserved = referrals.filter(r => r.status === 'reserved').length;
		const used = referrals.filter(r => r.status === 'used').length;
		return { total, available, reserved, used };
	}, [referrals]);

	// Disconnect
	const handleDisconnect = () => {
		disconnectWallet();
		navigate('/');
	};

	const handleGenerateReferrals = (count) => {
		const safeCount = Math.min(20, Math.max(1, Number(count) || 1));

		console.log('CONNECTED WALLET:', walletAddress);

		if (!walletAddress) {
			setGenerateError('Wallet not connected');
			return;
		}

		setIsGenerating(true);
		setGenerateError('');

		generateReferrals(walletAddress, safeCount)
			.then((newReferrals) => {
				setReferrals((currentReferrals) => [...currentReferrals, ...newReferrals]);
				setGeneratedReferrals(newReferrals);
				setIsGenerateModalOpen(false);
			})
			.catch((error) => {
				setGenerateError(error.message || 'Unable to generate referrals.');
			})
			.finally(() => {
				setIsGenerating(false);
			});
	};

	const handleCopyGeneratedSecret = async (secret) => {
		await navigator.clipboard.writeText(secret);
	};

	// Redirect if not connected
	React.useEffect(() => {
		if (!walletAddress) navigate('/');
	}, [walletAddress, navigate]);

	return (
		<div className="dashboard-page">
			<nav className="dashboard-nav">
				<div className="dashboard-brand">STKON</div>
				<div className="dashboard-tabs">
					<NavLink className="dashboard-tab" to="/dashboard">Dashboard</NavLink>
					<NavLink className="dashboard-tab" to="/marketplace">Referral Marketplace</NavLink>
				</div>
				<div className="wallet-section">
					<BackendStatus status={backendStatus} />
					<span className="wallet-pill">{walletAddress}</span>
					<button className="button button--ghost" onClick={handleDisconnect}>Disconnect</button>
				</div>
			</nav>

			<main className="dashboard-shell">
				<section className="dashboard-topline">
					<div>
						<p className="dashboard-kicker">Referral dashboard</p>
						<h1 className="dashboard-title">Manage STKON referrals</h1>
					</div>
					<button className="button button--primary" onClick={() => setIsGenerateModalOpen(true)}>
						Generate Referrals
					</button>
				</section>

				<section className="stat-grid">
					<StatCard label="Total Referrals" value={stats.total} />
					<StatCard label="Available" value={stats.available} />
					<StatCard label="Reserved" value={stats.reserved} />
					<StatCard label="Used" value={stats.used} />
				</section>

				{generatedReferrals.length > 0 && (
					<section className="generated-panel">
						<div className="referral-panel__header">
							<div>
								<p className="dashboard-kicker">One-time secrets</p>
								<h2 className="referral-panel__title">Generated Referrals</h2>
							</div>
							<span className="referral-count">{generatedReferrals.length} new</span>
						</div>

						<div className="generated-list">
							{generatedReferrals.map((referral) => (
								<div className="generated-row" key={referral.id}>
									<div>
										<strong>{referral.label}</strong>
										<span>{referral.status}</span>
									</div>
									<code>{referral.secret}</code>
									<div className="generated-actions">
										<button className="button button--ghost" onClick={() => handleCopyGeneratedSecret(referral.secret)}>
											Copy
										</button>
										<button className="button button--primary" onClick={() => downloadReferral(referral)}>
											Download
										</button>
									</div>
								</div>
							))}
						</div>
					</section>
				)}

				<section className="referral-panel">
					<div className="referral-panel__header">
						<div>
							<p className="dashboard-kicker">Active registry</p>
							<h2 className="referral-panel__title">Referral cards</h2>
						</div>
						<span className="referral-count">{referrals.length} total</span>
					</div>

					<div className="referral-list">
						{isReferralsLoading && <p className="reserved-empty">Loading your referrals...</p>}
						{!isReferralsLoading && referralsError && <p className="reserved-empty">{referralsError}</p>}
						{!isReferralsLoading && !referralsError && referrals.length === 0 && (
							<p className="reserved-empty">No referrals generated yet.</p>
						)}
						{!isReferralsLoading && !referralsError && referrals.map((r) => (
							<article className="referral-card" key={r.label}>
								<div className="referral-card__main">
									<div>
										<p className="referral-label">{r.label}</p>
										<p className="referral-meta">Created {r.createdAt}</p>
									</div>
									<Badge status={r.status} />
								</div>
								<div className="referral-wallet">
									<span>Reserved wallet</span>
									<strong>{r.reservedWallet || '-'}</strong>
								</div>
							</article>
						))}
					</div>
				</section>
			</main>

			<GenerateReferralModal
				isOpen={isGenerateModalOpen}
				isGenerating={isGenerating}
				error={generateError}
				onClose={() => setIsGenerateModalOpen(false)}
				onGenerate={handleGenerateReferrals}
			/>
		</div>
	);
}

export default DashboardPage;
