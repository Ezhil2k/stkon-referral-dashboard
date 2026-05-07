
import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import BackendStatus from '../components/common/BackendStatus.jsx';
import GenerateReferralModal from '../components/dashboard/GenerateReferralModal.jsx';
import { generateReferrals } from '../services/referralService.js';
import { downloadReferral } from '../utilities/downloadReferral.js';
import '../styles/dashboard.css';

const initialReferrals = [
	{ id: 1, label: 'STKON-001', status: 'available', createdAt: '2026-05-01', secret: '0x47b81d9f2a64c013a91f7b82d53e09ad', referrer: '0x8a2...91f', reservedWallet: null },
	{ id: 2, label: 'STKON-002', status: 'reserved', createdAt: '2026-05-02', secret: '0x63f0c1a9ee2148b2a709e4f8d19b33c5', referrer: '0x2bc...71a', reservedWallet: '0x1234...abcd' },
	{ id: 3, label: 'STKON-003', status: 'used', createdAt: '2026-05-03', secret: '0x91aa7e1bd5804cc882d6a113ef70b681', referrer: '0x7df...442', reservedWallet: '0xabcd...1234' },
];

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

function DashboardPage({ reservedReferrals = [], backendStatus = 'loading' }) {
	const { walletAddress, disconnectWallet } = useWallet();
	const navigate = useNavigate();
	const [referrals, setReferrals] = useState(initialReferrals);
	const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);
	const [generateError, setGenerateError] = useState('');
	const [generatedReferrals, setGeneratedReferrals] = useState([]);

	useEffect(() => {
		console.log('CONNECTED WALLET:', walletAddress);
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

				<section className="reserved-panel">
					<div className="referral-panel__header">
						<div>
							<p className="dashboard-kicker">Private reservations</p>
							<h2 className="referral-panel__title">My Reserved Referrals</h2>
						</div>
						<span className="referral-count">{reservedReferrals.length} active</span>
					</div>

					{reservedReferrals.length ? (
						<div className="reserved-list">
							{reservedReferrals.map((referral) => (
								<div className="reserved-row" key={referral.id}>
									<strong>{referral.label}</strong>
									<span>{new Date(referral.reservedAt).toLocaleDateString()}</span>
									<span>{new Date(referral.expiry).toLocaleDateString()}</span>
									<button
										className="button button--ghost reserved-open"
										onClick={() => navigate(`/marketplace/${referral.id}`)}
									>
										Open
									</button>
								</div>
							))}
						</div>
					) : (
						<p className="reserved-empty">Reserved referrals will appear here after you claim a marketplace slot.</p>
					)}
				</section>

				<section className="referral-panel">
					<div className="referral-panel__header">
						<div>
							<p className="dashboard-kicker">Active registry</p>
							<h2 className="referral-panel__title">Referral cards</h2>
						</div>
						<span className="referral-count">{referrals.length} total</span>
					</div>

					<div className="referral-list">
						{referrals.map((r) => (
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
