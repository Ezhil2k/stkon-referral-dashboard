import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import BackendStatus from '../components/common/BackendStatus.jsx';
import MarketplaceCard from '../components/marketplace/MarketplaceCard.jsx';
import MarketplaceFilters from '../components/marketplace/MarketplaceFilters.jsx';
import { fetchMarketplaceReferrals, reserveReferral } from '../services/referralService.js';
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
	const [search, setSearch] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState('');
	const [reserveError, setReserveError] = useState('');
	const [reservingId, setReservingId] = useState(null);

	useEffect(() => {
		console.log('CONNECTED WALLET:', walletAddress);
		if (!walletAddress) navigate('/');
	}, [walletAddress, navigate]);

	useEffect(() => {
		let isMounted = true;

		const loadMarketplace = async ({ silent = false } = {}) => {
			if (!silent) {
				setIsLoading(true);
			}

			try {
				const referrals = await fetchMarketplaceReferrals();

				if (!isMounted) return;

				setMarketplaceItems(referrals);
				setError('');
			} catch (requestError) {
				if (!isMounted) return;

				setError(requestError.message || 'Unable to load marketplace referrals.');
			} finally {
				if (isMounted) {
					setIsLoading(false);
				}
			}
		};

		loadMarketplace();
		const intervalId = window.setInterval(() => {
			loadMarketplace({ silent: true });
		}, 30000);

		return () => {
			isMounted = false;
			window.clearInterval(intervalId);
		};
	}, []);

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

			<main className="dashboard-shell marketplace-shell">
				<section className="dashboard-topline marketplace-topline">
					<div>
						<h1 className="dashboard-title">Referral Marketplace</h1>
						<p className="marketplace-subtitle">Browse available referral slots</p>
					</div>
					<MarketplaceFilters
						search={search}
						onSearchChange={setSearch}
					/>
				</section>

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
			</main>
		</div>
	);
}

export default MarketplacePage;
