function MarketplaceToggle({ activeTab, onChange }) {
	return (
		<div className="marketplace-toggle" aria-label="Marketplace views">
			<button
				className={`marketplace-toggle__button ${activeTab === 'marketplace' ? 'is-active' : ''}`}
				type="button"
				onClick={() => onChange('marketplace')}
			>
				Marketplace
			</button>
			<button
				className={`marketplace-toggle__button ${activeTab === 'reservations' ? 'is-active' : ''}`}
				type="button"
				onClick={() => onChange('reservations')}
			>
				My Reservations
			</button>
		</div>
	);
}

export default MarketplaceToggle;
