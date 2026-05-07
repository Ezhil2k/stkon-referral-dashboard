function MarketplaceFilters({ search, onSearchChange }) {
	return (
		<div className="marketplace-filters">
			<input
				className="marketplace-search"
				type="search"
				value={search}
				onChange={(event) => onSearchChange(event.target.value)}
				placeholder="Search by referral label"
			/>
		</div>
	);
}

export default MarketplaceFilters;
