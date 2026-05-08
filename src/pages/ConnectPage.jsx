
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';

const ConnectPage = () => {
	const { walletAddress, isSupernode, walletInitializing, roleChecking, roleError, connectWallet, connecting } = useWallet();
	const navigate = useNavigate();

	useEffect(() => {
		if (!walletAddress || walletInitializing || roleChecking || roleError || isSupernode === null) {
			return;
		}

		if (isSupernode) {
			navigate('/dashboard');
		} else {
			navigate('/marketplace');
		}
	}, [walletAddress, isSupernode, walletInitializing, roleChecking, roleError, navigate]);

	return (
		<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#181c20' }}>
			<div style={{ background: '#23272b', padding: 32, borderRadius: 12, boxShadow: '0 2px 16px #0004', minWidth: 320, textAlign: 'center' }}>
				<h2 style={{ color: '#fff', marginBottom: 24 }}>Connect your Wallet</h2>
				{(walletInitializing || roleChecking) && (
					<p style={{ color: '#9aa79f', margin: '0 0 16px', fontSize: 14 }}>Checking account type...</p>
				)}
				{roleError && (
					<p style={{ color: '#f2a6a0', margin: '0 0 16px', fontSize: 14 }}>{roleError}</p>
				)}
				<button
					onClick={connectWallet}
					disabled={connecting || walletInitializing || roleChecking}
					style={{
						padding: '12px 32px',
						borderRadius: 8,
						border: 'none',
						background: '#2d7d46',
						color: '#fff',
						fontWeight: 600,
						fontSize: 18,
						cursor: connecting || walletInitializing || roleChecking ? 'not-allowed' : 'pointer',
						opacity: connecting || walletInitializing || roleChecking ? 0.7 : 1,
						transition: 'background 0.2s',
					}}
				>
					{connecting ? 'Connecting...' : walletInitializing || roleChecking ? 'Checking...' : 'Connect MetaMask'}
				</button>
			</div>
		</div>
	);
};

export default ConnectPage;
