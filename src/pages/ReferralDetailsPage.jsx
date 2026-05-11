import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import BackendStatus from '../components/common/BackendStatus.jsx';
import { fetchOnchainStatus, markReferralUsed, revealReferralSecret } from '../services/referralService.js';
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

function ReferralDetailsPage({ reservedReferrals, backendStatus = 'loading' }) {
	const { walletAddress, disconnectWallet } = useWallet();
	const navigate = useNavigate();
	const { id } = useParams();
	const reservedReferral = useMemo(
		() => reservedReferrals.find((item) => String(item.id) === id),
		[reservedReferrals, id]
	);
	const [revealedReferral, setRevealedReferral] = useState(null);
	const [isRevealing, setIsRevealing] = useState(true);
	const [revealError, setRevealError] = useState('');
	const [useError, setUseError] = useState('');
	const [isMarkingUsed, setIsMarkingUsed] = useState(false);
	const [referralStatus, setReferralStatus] = useState(reservedReferral?.status || 'reserved');
	const referral = revealedReferral || reservedReferral;
	const [timeLeft, setTimeLeft] = useState(reservedReferral ? getTimeLeft(reservedReferral.expiry) : '0h 0m');
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		console.log('CONNECTED WALLET:', walletAddress);
		if (!walletAddress) navigate('/');
	}, [walletAddress, navigate]);

	useEffect(() => {
		setReferralStatus(reservedReferral?.status || 'reserved');
	}, [reservedReferral]);

	useEffect(() => {
		if (!id) {
			return undefined;
		}

		let isMounted = true;

		fetchOnchainStatus(id)
			.then((onchainStatus) => {
				if (!isMounted || !onchainStatus?.status) return;
				setReferralStatus(onchainStatus.status);
			})
			.catch(() => {
				if (!isMounted) return;
				setReferralStatus(reservedReferral?.status || 'reserved');
			});

		return () => {
			isMounted = false;
		};
	}, [id, reservedReferral]);

	useEffect(() => {
		if (!walletAddress || !id) {
			return;
		}

		if (referralStatus === 'used') {
			setIsRevealing(false);
			return;
		}

		let isMounted = true;

		setIsRevealing(true);
		setRevealError('');

		console.log('CONNECTED WALLET:', walletAddress);

		revealReferralSecret(walletAddress, id)
			.then((secretReferral) => {
				if (!isMounted) return;

				setRevealedReferral({
					...reservedReferral,
					...secretReferral,
					expiry: reservedReferral?.expiry || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
					validatorPubkey: reservedReferral?.validatorPubkey || '0xb7f9c2a641e981f3d4c290b9a27e5f44c61702d8a13c9e5d6b21c442ab81f930',
				});
			})
			.catch((error) => {
				if (!isMounted) return;

				setRevealError(error.message || 'Unable to reveal this referral secret.');
			})
			.finally(() => {
				if (isMounted) {
					setIsRevealing(false);
				}
			});

		return () => {
			isMounted = false;
		};
	}, [walletAddress, id, reservedReferral, referralStatus]);

	useEffect(() => {
		if (!reservedReferral?.expiry) {
			return undefined;
		}

		const intervalId = window.setInterval(() => {
			setTimeLeft(getTimeLeft(reservedReferral.expiry));
		}, 60000);

		setTimeLeft(getTimeLeft(reservedReferral.expiry));

		return () => window.clearInterval(intervalId);
	}, [reservedReferral]);

	const handleDisconnect = () => {
		disconnectWallet();
		navigate('/');
	};

	const handleCopy = async () => {
		if (!referral?.secret) {
			return;
		}

		await navigator.clipboard.writeText(referral.secret);
		setCopied(true);
		window.setTimeout(() => setCopied(false), 1600);
	};

	const handleMarkUsed = () => {
		if (isMarkingUsed || referralStatus === 'used') {
			return;
		}

		console.log('CONNECTED WALLET:', walletAddress);

		if (!walletAddress) {
			setUseError('Wallet not connected');
			return;
		}

		setIsMarkingUsed(true);
		setUseError('');

		markReferralUsed(walletAddress, id)
			.then(() => {
				console.log('REMOVED LOCAL USED STATUS MUTATION AFTER MARK USED');
				console.log('REFETCHING STATUS AFTER MARK USED', id);
				return fetchOnchainStatus(id);
			})
			.then((statusData) => {
				console.log('FINAL STATUS RESPONSE', statusData);
				if (statusData?.status) {
					setReferralStatus(statusData.status);
				}
			})
			.catch((error) => {
				setUseError(error.message || 'Unable to mark this referral as used.');
			})
			.finally(() => {
				setIsMarkingUsed(false);
			});
	};

	if (!reservedReferral && !isRevealing && revealError) {
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
					<section className="details-panel details-panel--empty">
						<h1 className="dashboard-title">Unable to reveal referral</h1>
						<p className="marketplace-subtitle">{revealError}</p>
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
				<div className="wallet-section">
					<BackendStatus status={backendStatus} />
					<span className="wallet-pill">{walletAddress}</span>
					<button className="button button--ghost" onClick={handleDisconnect}>Disconnect</button>
				</div>
			</nav>

			<main className="dashboard-shell details-shell">
				<section className="dashboard-topline">
					<div>
						<p className="dashboard-kicker">Reserved referral</p>
						<h1 className="dashboard-title">{referral?.label || 'Referral details'}</h1>
						<p className="marketplace-subtitle">Reservation expires in {timeLeft}</p>
					</div>
					<button className="button button--ghost" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
				</section>

				<section className="details-panel">
					<div className="details-grid">
						<div className="details-field">
							<span>Referral Label</span>
							<strong>{referral?.label || 'Loading...'}</strong>
						</div>
						<div className="details-field">
							<span>Referrer Wallet</span>
							<strong>{referral?.referrer || 'Loading...'}</strong>
						</div>
						<div className="details-field">
							<span>Reservation Expiry</span>
							<strong>{referral?.expiry ? new Date(referral.expiry).toLocaleString() : 'Loading...'}</strong>
						</div>
						<div className="details-field">
							<span>Validator Pubkey</span>
							<strong>{referral?.validatorPubkey || 'Loading...'}</strong>
						</div>
						<div className="details-field">
							<span>Status</span>
							<strong>{referralStatus}</strong>
						</div>
					</div>

					<div className="secret-box">
						<div>
							<span>Secret Code</span>
							<code>
								{isRevealing && 'Revealing secret...'}
								{!isRevealing && revealError && revealError}
								{!isRevealing && referralStatus === 'used' && 'Referral has been marked as used.'}
								{!isRevealing && !revealError && referralStatus !== 'used' && referral?.secret}
							</code>
						</div>
						<div className="secret-actions">
							<button
								className="button button--ghost"
								onClick={handleCopy}
								disabled={!referral?.secret || isRevealing || referralStatus === 'used'}
							>
								{copied ? 'Copied' : 'Copy'}
							</button>
							<button
								className="button button--primary"
								onClick={() => downloadReferral(referral)}
								disabled={!referral?.secret || isRevealing || referralStatus === 'used'}
							>
								Download
							</button>
							<button
								className="button button--primary"
								onClick={handleMarkUsed}
								disabled={isMarkingUsed || referralStatus === 'used'}
							>
								{referralStatus === 'used' ? 'Used' : isMarkingUsed ? 'Marking' : 'Mark as Used'}
							</button>
						</div>
					</div>
					{useError && <p className="details-error">{useError}</p>}
				</section>
			</main>
		</div>
	);
}

export default ReferralDetailsPage;
