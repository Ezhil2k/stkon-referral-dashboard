import { useEffect, useState } from 'react';

function GenerateReferralModal({ isOpen, isGenerating = false, error = '', onClose, onGenerate }) {
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
		if (isGenerating) {
			return;
		}

		const safeCount = Math.min(20, Math.max(1, Number(count) || 1));
		onGenerate(safeCount);
	};

	return (
		<div className="generate-modal-backdrop" role="presentation" onMouseDown={onClose}>
			<form className="generate-modal" onSubmit={handleSubmit} onMouseDown={(event) => event.stopPropagation()}>
				<div>
					<h2>Generate Referral Codes</h2>
					<p>Select how many referral codes to create. Maximum 20.</p>
				</div>

				<label className="generate-modal__field">
					<span>Quantity</span>
					<input
						type="number"
						min="1"
						max="20"
						value={count}
						disabled={isGenerating}
						onChange={(event) => setCount(event.target.value)}
					/>
				</label>

				{error && <p className="generate-modal__error">{error}</p>}

				<div className="generate-modal__actions">
					<button className="button button--ghost" type="button" onClick={onClose} disabled={isGenerating}>
						Cancel
					</button>
					<button className="button button--primary" type="submit" disabled={isGenerating}>
						{isGenerating ? 'Generating' : 'Generate'}
					</button>
				</div>
			</form>
		</div>
	);
}

export default GenerateReferralModal;
