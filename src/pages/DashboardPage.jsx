
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import BackendStatus from '../components/common/BackendStatus.jsx';
import GenerateReferralModal from '../components/dashboard/GenerateReferralModal.jsx';
import { createReferralCommitment } from '../services/blockchainService.js';
import { fetchMyReferrals, generateReferrals } from '../services/referralService.js';
import '../styles/dashboard.css';

const statusColors = {
	available: '#2ecc40',
	reserved: '#f1c40f',
	used: '#e74c3c',
	generating: '#7f8c8d',
	awaiting_signature: '#f39c12',
	transaction_pending: '#3498db',
	active: '#2ecc40',
	failed: '#e74c3c',
};

const activationLabels = {
	generating: 'Generating...',
	awaiting_signature: 'Waiting for wallet signature...',
	transaction_pending: 'Transaction pending...',
	active: 'Referral active',
	failed: 'Activation failed',
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

function ActivationStatus({ status }) {
	if (!status) {
		return null;
	}

	return (
		<p
			className={`referral-activation referral-activation--${status}`}
			style={{ margin: '6px 0 0', color: statusColors[status], fontSize: 13 }}
		>
			{activationLabels[status] || status}
		</p>
	);
}

function DashboardPage({ backendStatus = 'loading' }) {
	const { walletAddress, isSupernode, roleChecking, roleError, disconnectWallet } = useWallet();
	const navigate = useNavigate();
	const [referrals, setReferrals] = useState([]);
	const [isReferralsLoading, setIsReferralsLoading] = useState(true);
	const [referralsError, setReferralsError] = useState('');
	const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);
	const [generateError, setGenerateError] = useState('');
	const [, setGeneratedReferrals] = useState([]);

	const updateReferralActivationStatus = (id, activationStatus, extraFields = {}) => {
		setReferrals((currentReferrals) =>
			currentReferrals.map((referral) =>
				referral.id === id
					? { ...referral, activationStatus, ...extraFields }
					: referral
			)
		);
	};

	useEffect(() => {
		console.log('CONNECTED WALLET:', walletAddress);
	}, [walletAddress]);

	useEffect(() => {
		if (!walletAddress || isSupernode !== true) {
			setReferrals([]);
			setIsReferralsLoading(false);
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
	}, [walletAddress, isSupernode]);

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

	const handleGenerateReferrals = async (count) => {
		const safeCount = Math.min(20, Math.max(1, Number(count) || 1));

		console.log('CONNECTED WALLET:', walletAddress);

		if (!walletAddress) {
			setGenerateError('Wallet not connected');
			return;
		}

		setIsGenerating(true);
		setGenerateError('');

		try {
			const newReferrals = await generateReferrals(walletAddress, safeCount);
			const pendingReferrals = newReferrals.map((referral) => ({
				...referral,
				activationStatus: referral.commitmentHash ? 'awaiting_signature' : 'failed',
				activationError: referral.commitmentHash ? '' : 'Missing commitment hash.',
			}));

			setReferrals((currentReferrals) => [...currentReferrals, ...pendingReferrals]);
			setGeneratedReferrals(pendingReferrals);
			setIsGenerateModalOpen(false);

			for (const referral of pendingReferrals) {
				if (!referral.commitmentHash) {
					continue;
				}

				try {
					let submittedTxHash = '';
					updateReferralActivationStatus(referral.id, 'awaiting_signature');
					const receipt = await createReferralCommitment(referral.commitmentHash, {
						onSubmitted: (tx) => {
							submittedTxHash = tx.hash;
							updateReferralActivationStatus(referral.id, 'transaction_pending', {
								activationTxHash: tx.hash,
							});
						},
					});
					updateReferralActivationStatus(referral.id, 'active', {
						activationReceipt: receipt,
						activationTxHash: receipt?.hash || receipt?.transactionHash || submittedTxHash,
						activationError: '',
					});
				} catch (error) {
					updateReferralActivationStatus(referral.id, 'failed', {
						activationError: error.message || 'Activation failed.',
					});
				}
			}
		} catch (error) {
			setGenerateError(error.message || 'Unable to generate referrals.');
		} finally {
			setIsGenerating(false);
		}
	};

	// Redirect if not connected
	React.useEffect(() => {
		if (!walletAddress) {
			navigate('/');
			return;
		}

		if (roleChecking) {
			return;
		}

		if (roleError) {
			navigate('/');
			return;
		}

		if (isSupernode === false) {
			navigate('/marketplace');
		}
	}, [walletAddress, isSupernode, roleChecking, roleError, navigate]);

	return (
		<div className="dashboard-page">
			<nav className="dashboard-nav">
				<div className="dashboard-brand">STKON</div>
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
					<button
						className="button button--primary"
						disabled={isGenerating}
						onClick={() => setIsGenerateModalOpen(true)}
					>
						{isGenerating ? 'Generating...' : 'Generate Referrals'}
					</button>
				</section>

				<section className="stat-grid">
					<StatCard label="Total Referrals" value={stats.total} />
					<StatCard label="Available" value={stats.available} />
					<StatCard label="Reserved" value={stats.reserved} />
					<StatCard label="Used" value={stats.used} />
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
										<ActivationStatus status={r.activationStatus} />
									</div>
									<Badge status={r.activationStatus || r.status} />
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
