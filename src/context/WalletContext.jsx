
import React, { createContext, useContext, useEffect, useState } from 'react';

const WalletContext = createContext();

export function useWallet() {
	return useContext(WalletContext);
}

export function WalletProvider({ children }) {
	const [walletAddress, setWalletAddress] = useState(null);
	const [connecting, setConnecting] = useState(false);
	const isConnected = Boolean(walletAddress);

	useEffect(() => {
		if (!window.ethereum) {
			return;
		}

		window.ethereum
			.request({ method: 'eth_accounts' })
			.then((accounts) => {
				if (accounts?.[0]) {
					setWalletAddress(accounts[0]);
					console.log('CONNECTED WALLET:', accounts[0]);
				}
			})
			.catch(() => {
				setWalletAddress(null);
			});
	}, []);

	const connectWallet = async () => {
		if (!window.ethereum) {
			alert('MetaMask is not installed.');
			return;
		}
		setConnecting(true);
		try {
			const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
			setWalletAddress(accounts[0]);
			console.log('CONNECTED WALLET:', accounts[0]);
		} catch (err) {
			setWalletAddress(null);
		}
		setConnecting(false);
	};

	const disconnectWallet = () => {
		setWalletAddress(null);
	};

	return (
		<WalletContext.Provider
			value={{
				walletAddress,
				wallet: walletAddress,
				isConnected,
				connectWallet,
				disconnectWallet,
				connecting,
			}}
		>
			{children}
		</WalletContext.Provider>
	);
}
