import { useEffect, useState } from 'react';

function GenerateReferralModal({ isOpen, onClose, onGenerate }) {
	const [count, setCount] = useState(1);

	useEffect(() => {
		if (isOpen) {
			setCount(1);
		}
	}, [isOpen]);

	if (!isOpen) {
		return null;
	}

	const handleSubmit = (event) => {
		event.preventDefault();
		const safeCount = Math.min(50, Math.max(1, Number(count) || 1));
		onGenerate(safeCount);
	};

	return (
		<div className="generate-modal-backdrop" role="presentation" onMouseDown={onClose}>
			<form className="generate-modal" onSubmit={handleSubmit} onMouseDown={(event) => event.stopPropagation()}>
				<div>
					<h2>Generate Referral Codes</h2>
					<p>Select how many referral codes to create.</p>
				</div>

				<label className="generate-modal__field">
					<span>Quantity</span>
					<input
						type="number"
						min="1"
						max="50"
						value={count}
						onChange={(event) => setCount(event.target.value)}
					/>
				</label>

				<div className="generate-modal__actions">
					<button className="button button--ghost" type="button" onClick={onClose}>
						Cancel
					</button>
					<button className="button button--primary" type="submit">
						Generate
					</button>
				</div>
			</form>
		</div>
	);
}

export default GenerateReferralModal;
