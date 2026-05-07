
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';

const ConnectPage = () => {
	const { wallet, connectWallet, connecting } = useWallet();
	const navigate = useNavigate();

	useEffect(() => {
		if (wallet) {
			navigate('/dashboard');
		}
	}, [wallet, navigate]);

	return (
		<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#181c20' }}>
			<div style={{ background: '#23272b', padding: 32, borderRadius: 12, boxShadow: '0 2px 16px #0004', minWidth: 320, textAlign: 'center' }}>
				<h2 style={{ color: '#fff', marginBottom: 24 }}>Connect your Wallet</h2>
				<button
					onClick={connectWallet}
					disabled={connecting}
					style={{
						padding: '12px 32px',
						borderRadius: 8,
						border: 'none',
						background: '#2d7d46',
						color: '#fff',
						fontWeight: 600,
						fontSize: 18,
						cursor: connecting ? 'not-allowed' : 'pointer',
						opacity: connecting ? 0.7 : 1,
						transition: 'background 0.2s',
					}}
				>
					{connecting ? 'Connecting...' : 'Connect MetaMask'}
				</button>
			</div>
		</div>
	);
};

export default ConnectPage;
