import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import MarketplaceCard from '../components/marketplace/MarketplaceCard.jsx';
import MarketplaceFilters from '../components/marketplace/MarketplaceFilters.jsx';
import '../styles/dashboard.css';
import '../styles/marketplace.css';

function MarketplacePage({ marketplaceItems, onReserveReferral }) {
	const { wallet, disconnectWallet } = useWallet();
	const navigate = useNavigate();
	const [search, setSearch] = useState('');

	useEffect(() => {
		if (!wallet) navigate('/');
	}, [wallet, navigate]);

	const filteredItems = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();

		return marketplaceItems.filter((item) =>
			item.label.toLowerCase().includes(normalizedSearch)
		);
	}, [marketplaceItems, search]);

	const handleDisconnect = () => {
		disconnectWallet();
		navigate('/');
	};

	const handleReserve = (id) => {
		const reservedReferral = onReserveReferral(id);

		if (reservedReferral) {
			navigate(`/marketplace/${reservedReferral.id}`);
		}
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
					<span className="wallet-pill">{wallet}</span>
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
						{filteredItems.map((item) => (
							<MarketplaceCard key={item.id} item={item} onReserve={handleReserve} />
						))}
					</div>
				</section>
			</main>
		</div>
	);
}

export default MarketplacePage;
