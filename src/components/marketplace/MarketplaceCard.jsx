function MarketplaceCard({ item, onReserve }) {
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
			>
				Reserve
			</button>
		</article>
	);
}

export default MarketplaceCard;
