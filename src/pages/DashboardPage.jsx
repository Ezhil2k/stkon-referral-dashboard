
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import BackendStatus from '../components/common/BackendStatus.jsx';
import GenerateReferralModal from '../components/dashboard/GenerateReferralModal.jsx';
import { createReferralCommitment } from '../services/blockchainService.js';
import {
	fetchMyReferrals,
	fetchOnchainStatus,
	finalizeReferrals,
	generateReferrals,
} from '../services/referralService.js';
import '../styles/dashboard.css';

const statusColors = {
	pending: '#7f8c8d',
	available: '#2ecc40',
	reserved: '#f1c40f',
	used: '#e74c3c',
	generating: '#7f8c8d',
	awaiting_signature: '#f39c12',
	tx_pending: '#3498db',
	transaction_pending: '#3498db',
	finalizing: '#9b59b6',
	failed: '#e74c3c',
	finalization_failed: '#e74c3c',
};

const activationLabels = {
	generating: 'Generating...',
	awaiting_signature: 'Waiting for wallet signature...',
	tx_pending: 'Transaction pending...',
	transaction_pending: 'Transaction pending...',
	finalizing: 'Finalizing referrals...',
	failed: 'Activation failed',
	finalization_failed: 'Finalization failed',
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

async function applyOnchainStatuses(referrals) {
	const statusResults = await Promise.all(
		referrals.map((referral) =>
			fetchOnchainStatus(referral.id)
				.then((onchainStatus) => ({ id: referral.id, onchainStatus }))
				.catch(() => ({ id: referral.id, onchainStatus: null }))
		)
	);
	const statusesById = new Map(statusResults.map((result) => [result.id, result.onchainStatus]));

	return referrals.map((referral) => {
		const onchainStatus = statusesById.get(referral.id);

		if (!onchainStatus?.status) {
			return referral;
		}

		return {
			...referral,
			status: onchainStatus.status,
			commitmentHash: onchainStatus.commitmentHash || referral.commitmentHash,
			raw: {
				...referral.raw,
				onchainStatus: onchainStatus.raw,
			},
		};
	});
}

async function refetchFinalizedOnchainStatuses(referralIds) {
	const statusResults = await Promise.all(
		referralIds.map((referralId) => {
			console.log('REFETCHING STATUS AFTER FINALIZE', referralId);
			return fetchOnchainStatus(referralId)
				.then((statusData) => {
					console.log('FINAL STATUS RESPONSE', statusData);
					return { referralId, statusData };
				})
				.catch((error) => {
					console.error('FINAL STATUS RESPONSE', error.response?.data || error);
					return { referralId, statusData: null };
				});
		})
	);

	return new Map(statusResults.map(({ referralId, statusData }) => [referralId, statusData]));
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

	const loadMyReferrals = useCallback(async ({ apply = true } = {}) => {
		if (!walletAddress || isSupernode !== true) {
			if (apply) {
				setReferrals([]);
				setIsReferralsLoading(false);
			}
			return [];
		}

		const myReferrals = await fetchMyReferrals(walletAddress);
		const referralsWithOnchainStatus = await applyOnchainStatuses(myReferrals);
		if (apply) {
			setReferrals(referralsWithOnchainStatus);
		}
		return referralsWithOnchainStatus;
	}, [walletAddress, isSupernode]);

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

		loadMyReferrals({ apply: false })
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
	}, [walletAddress, isSupernode, loadMyReferrals]);

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

			const successfullyConfirmedReferrals = [];

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
							updateReferralActivationStatus(referral.id, 'tx_pending', {
								activationTxHash: tx.hash,
							});
						},
					});
					successfullyConfirmedReferrals.push(referral);
					updateReferralActivationStatus(referral.id, 'tx_pending', {
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

			if (successfullyConfirmedReferrals.length === 0) {
				return;
			}

			const successfulReferralIds = successfullyConfirmedReferrals.map((referral) => referral.id);

			successfulReferralIds.forEach((id) => {
				updateReferralActivationStatus(id, 'finalizing');
			});

			try {
				await finalizeReferrals(successfulReferralIds);
				console.log('REMOVED LOCAL ACTIVE STATUS MUTATION AFTER FINALIZE');
				const finalStatusesById = await refetchFinalizedOnchainStatuses(successfulReferralIds);

				setReferrals((currentReferrals) =>
					currentReferrals.map((referral) => {
						const statusData = finalStatusesById.get(referral.id);

						if (!statusData?.status) {
							return referral;
						}

						return {
							...referral,
							status: statusData.status,
							activationStatus: '',
							activationError: '',
							commitmentHash: statusData.commitmentHash || referral.commitmentHash,
							raw: {
								...referral.raw,
								onchainStatus: statusData.raw,
							},
						};
					})
				);

				window.dispatchEvent(new CustomEvent('referrals:finalized', {
					detail: { referralIds: successfulReferralIds },
				}));

				try {
					const refreshedReferrals = await loadMyReferrals({ apply: false });
					setReferrals(refreshedReferrals.map((referral) =>
						finalStatusesById.get(referral.id)?.status
							? { ...referral, activationStatus: '', activationError: '' }
							: referral
					));
				} catch (refreshError) {
					console.error('DASHBOARD REFERRALS REFRESH ERROR', refreshError);
				}
			} catch (error) {
				successfulReferralIds.forEach((id) => {
					updateReferralActivationStatus(id, 'finalization_failed', {
						activationError: error.message || 'Finalization failed.',
					});
				});
				setGenerateError(error.message || 'Finalization failed. Referrals remain generated and can be retried later.');
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
