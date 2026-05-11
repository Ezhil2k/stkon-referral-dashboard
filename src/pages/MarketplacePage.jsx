import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import BackendStatus from '../components/common/BackendStatus.jsx';
import MarketplaceCard from '../components/marketplace/MarketplaceCard.jsx';
import MarketplaceFilters from '../components/marketplace/MarketplaceFilters.jsx';
import MarketplaceToggle from '../components/marketplace/MarketplaceToggle.jsx';
import MyReservationsPanel from '../components/marketplace/MyReservationsPanel.jsx';
import {
	cancelReservation,
	fetchMarketplaceReferrals,
	fetchMyReservations,
	reserveReferral,
} from '../services/referralService.js';
import '../styles/dashboard.css';
import '../styles/marketplace.css';

const reserveErrorMessages = {
	'Referral not available': 'That referral is no longer available. The list will refresh shortly.',
	'Maximum 2 active reservations allowed': 'You already have the maximum 2 active reservations.',
	'Invalid wallet address': 'Your connected wallet address was rejected by the server.',
};

function MarketplacePage({ onReserveReferral, backendStatus = 'loading' }) {
	const { walletAddress, disconnectWallet } = useWallet();
	const navigate = useNavigate();
	const [marketplaceItems, setMarketplaceItems] = useState([]);
	const [locallyReservedIds, setLocallyReservedIds] = useState([]);
	const [reservations, setReservations] = useState([]);
	const [search, setSearch] = useState('');
	const [activeTab, setActiveTab] = useState('marketplace');
	const [isLoading, setIsLoading] = useState(true);
	const [isReservationsLoading, setIsReservationsLoading] = useState(true);
	const [error, setError] = useState('');
	const [reservationsError, setReservationsError] = useState('');
	const [reserveError, setReserveError] = useState('');
	const [reservingId, setReservingId] = useState(null);
	const [cancelingId, setCancelingId] = useState(null);

	useEffect(() => {
		console.log('CONNECTED WALLET:', walletAddress);
		if (!walletAddress) navigate('/');
	}, [walletAddress, navigate]);

	const loadMarketplace = useCallback(async ({ silent = false } = {}) => {
			if (!silent) {
				setIsLoading(true);
			}

			try {
				const referrals = await fetchMarketplaceReferrals();
				setMarketplaceItems(referrals);
				setError('');
			} catch (requestError) {
				setError(requestError.message || 'Unable to load marketplace referrals.');
			} finally {
				setIsLoading(false);
			}
	}, []);

	const loadReservations = useCallback(async ({ silent = false } = {}) => {
		if (!walletAddress) {
			setReservations([]);
			return;
		}

		if (!silent) {
			setIsReservationsLoading(true);
		}

		try {
			const myReservations = await fetchMyReservations(walletAddress);
			setReservations(myReservations);
			setReservationsError('');
		} catch (requestError) {
			setReservationsError(requestError.message || 'Unable to load your reservations.');
		} finally {
			setIsReservationsLoading(false);
		}
	}, [walletAddress]);

	useEffect(() => {
		let isMounted = true;

		const loadAll = async ({ silent = false } = {}) => {
			if (!isMounted) return;
			await Promise.all([
				loadMarketplace({ silent }),
				loadReservations({ silent }),
			]);
		};

		loadAll();
		const intervalId = window.setInterval(() => {
			loadAll({ silent: true });
		}, 30000);

		return () => {
			isMounted = false;
			window.clearInterval(intervalId);
		};
	}, [loadMarketplace, loadReservations]);

	useEffect(() => {
		const handleReferralsFinalized = () => {
			loadMarketplace({ silent: true });
		};

		window.addEventListener('referrals:finalized', handleReferralsFinalized);

		return () => {
			window.removeEventListener('referrals:finalized', handleReferralsFinalized);
		};
	}, [loadMarketplace]);

	const filteredItems = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();

		return marketplaceItems.filter((item) =>
			item.status === 'available' &&
			!locallyReservedIds.includes(item.id) &&
			item.label.toLowerCase().includes(normalizedSearch)
		);
	}, [marketplaceItems, locallyReservedIds, search]);

	const handleDisconnect = () => {
		disconnectWallet();
		navigate('/');
	};

	const handleReserve = (id) => {
		if (reservingId) {
			return;
		}

		console.log('CONNECTED WALLET:', walletAddress);

		if (!walletAddress) {
			setReserveError('Wallet not connected');
			return;
		}

		setReservingId(id);
		setReserveError('');

		const referral = marketplaceItems.find((item) => item.id === id);

		reserveReferral(walletAddress, id)
			.then((reservation) => {
				const reservedReferral = onReserveReferral({
					...referral,
					...reservation,
					referrer: referral?.referrer,
				});

				if (reservedReferral) {
					setLocallyReservedIds((ids) => [...ids, id]);
					loadReservations({ silent: true });
					navigate(`/marketplace/${reservedReferral.id}`);
				}
			})
			.catch((requestError) => {
				const message = requestError.message || 'Unable to reserve this referral.';
				setReserveError(reserveErrorMessages[message] || message);
			})
			.finally(() => {
				setReservingId(null);
			});
	};

	const handleCancelReservation = (id) => {
		if (cancelingId) {
			return;
		}

		console.log('CONNECTED WALLET:', walletAddress);

		if (!walletAddress) {
			setReservationsError('Wallet not connected');
			return;
		}

		setCancelingId(id);
		setReservationsError('');

		cancelReservation(walletAddress, id)
			.then(() => {
				setReservations((items) => items.filter((item) => item.id !== id));
				setLocallyReservedIds((ids) => ids.filter((reservedId) => reservedId !== id));
				loadMarketplace({ silent: true });
				loadReservations({ silent: true });
			})
			.catch((requestError) => {
				setReservationsError(requestError.message || 'Unable to cancel this reservation.');
			})
			.finally(() => {
				setCancelingId(null);
			});
	};

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

			<main className="dashboard-shell marketplace-shell">
				<section className="dashboard-topline marketplace-topline">
					<div>
						<h1 className="dashboard-title">Referral Marketplace</h1>
						<p className="marketplace-subtitle">Browse available referral slots</p>
					</div>
				</section>

				<MarketplaceToggle activeTab={activeTab} onChange={setActiveTab} />

				{activeTab === 'marketplace' && (
					<>
						<div className="marketplace-filter-row">
							<MarketplaceFilters
								search={search}
								onSearchChange={setSearch}
							/>
						</div>

						<section className="marketplace-panel">
							<div className="marketplace-header-row">
								<span>Referral</span>
								<span>Created</span>
								<span>Action</span>
							</div>
							<div className="marketplace-list">
								{isLoading && <p className="marketplace-state">Loading marketplace referrals...</p>}
								{!isLoading && error && <p className="marketplace-state marketplace-state--error">{error}</p>}
								{reserveError && <p className="marketplace-state marketplace-state--error">{reserveError}</p>}
								{!isLoading && !error && filteredItems.length === 0 && (
									<p className="marketplace-state">No available referrals found.</p>
								)}
								{!isLoading && !error && filteredItems.map((item) => (
									<MarketplaceCard
										key={item.id}
										item={item}
										isReserving={reservingId === item.id}
										isDisabled={Boolean(reservingId)}
										onReserve={handleReserve}
									/>
								))}
							</div>
						</section>
					</>
				)}

				{activeTab === 'reservations' && (
					<MyReservationsPanel
						reservations={reservations}
						isLoading={isReservationsLoading}
						error={reservationsError}
						cancelingId={cancelingId}
						onOpen={(id) => navigate(`/marketplace/${id}`)}
						onCancel={handleCancelReservation}
					/>
				)}
			</main>
		</div>
	);
}

export default MarketplacePage;
