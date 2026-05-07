
import React, { useState, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import GenerateReferralModal from '../components/dashboard/GenerateReferralModal.jsx';
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

function DashboardPage({ reservedReferrals = [] }) {
	const { wallet, disconnectWallet } = useWallet();
	const navigate = useNavigate();
	const [referrals, setReferrals] = useState(initialReferrals);
	const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

	// Stats
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

	const createMockSecret = (index) => {
		const seed = `${Date.now()}${index}${Math.random()}`.replace(/\D/g, '');
		return `0x${seed.padEnd(64, '0').slice(0, 64)}`;
	};

	const getNextReferralNumber = () => {
		return referrals.reduce((highest, referral) => {
			const match = referral.label.match(/STKON-(\d+)/);
			return match ? Math.max(highest, Number(match[1])) : highest;
		}, 0) + 1;
	};

	const handleGenerateReferrals = (count) => {
		const startNumber = getNextReferralNumber();
		const createdAt = new Date().toISOString().slice(0, 10);
		const generatedReferrals = Array.from({ length: count }, (_, index) => {
			const nextNumber = startNumber + index;

			return {
				id: Date.now() + index,
				label: `STKON-${String(nextNumber).padStart(3, '0')}`,
				status: 'available',
				createdAt,
				secret: createMockSecret(index),
				referrer: wallet || '0x000...000',
				reservedWallet: null,
			};
		});

		setReferrals((currentReferrals) => [...currentReferrals, ...generatedReferrals]);
		setIsGenerateModalOpen(false);
	};

	// Redirect if not connected
	React.useEffect(() => {
		if (!wallet) navigate('/');
	}, [wallet, navigate]);

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
				onClose={() => setIsGenerateModalOpen(false)}
				onGenerate={handleGenerateReferrals}
			/>
		</div>
	);
}

export default DashboardPage;
