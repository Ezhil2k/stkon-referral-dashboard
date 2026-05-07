function MarketplaceCard({ item, isReserving = false, isDisabled = false, onReserve }) {
	return (
		<article className="marketplace-card">
			<div className="marketplace-card__identity">
				<strong>{item.label}</strong>
				<span>{item.referrer}</span>
			</div>
			<span className="marketplace-card__date">{item.createdAt}</span>
			<button
				className="button marketplace-reserve"
				type="button"
				onClick={() => onReserve(item.id)}
				disabled={isDisabled}
			>
				{isReserving ? 'Reserving' : 'Reserve'}
			</button>
		</article>
	);
}

export default MarketplaceCard;
