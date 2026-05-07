
import React, { createContext, useContext, useState } from 'react';

const WalletContext = createContext();

export function useWallet() {
	return useContext(WalletContext);
}

export function WalletProvider({ children }) {
	const [wallet, setWallet] = useState(null);
	const [connecting, setConnecting] = useState(false);

	const connectWallet = async () => {
		if (!window.ethereum) {
			alert('MetaMask is not installed.');
			return;
		}
		setConnecting(true);
		try {
			const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
			setWallet(accounts[0]);
		} catch (err) {
			setWallet(null);
		}
		setConnecting(false);
	};

	const disconnectWallet = () => {
		setWallet(null);
	};

	return (
		<WalletContext.Provider value={{ wallet, connectWallet, disconnectWallet, connecting }}>
			{children}
		</WalletContext.Provider>
	);
}
