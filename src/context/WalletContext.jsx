
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { checkSupernodeStatus } from '../services/referralService.js';

const WalletContext = createContext();

export function useWallet() {
	return useContext(WalletContext);
}

export function WalletProvider({ children }) {
	const [walletAddress, setWalletAddress] = useState(null);
	const [isSupernode, setIsSupernode] = useState(null);
	const [roleChecking, setRoleChecking] = useState(false);
	const [roleError, setRoleError] = useState('');
	const [walletInitializing, setWalletInitializing] = useState(true);
	const [connecting, setConnecting] = useState(false);
	const isConnected = Boolean(walletAddress);

	const loadRole = useCallback(async (address) => {
		console.log('ROLE CHECK START');
		console.log('CHECKING ACCOUNT TYPE...');
		setRoleChecking(true);
		setRoleError('');

		try {
			const supernodeStatus = await checkSupernodeStatus(address);
			setIsSupernode(supernodeStatus);
			console.log('ROLE RESOLVED', supernodeStatus);
			return supernodeStatus;
		} catch (error) {
			console.error('SUPERNODE STATUS CHECK FAILED', error.response?.data || error);
			setIsSupernode(null);
			setRoleError(error.message || 'Unable to verify account type.');
			return null;
		} finally {
			setRoleChecking(false);
		}
	}, []);

	useEffect(() => {
		if (!window.ethereum) {
			setWalletInitializing(false);
			return;
		}

		const handleAccountsChanged = (accounts) => {
			if (accounts?.[0]) {
				setWalletAddress(accounts[0]);
				console.log('CONNECTED WALLET:', accounts[0]);
				console.log('CONNECTED WALLET ADDRESS', accounts[0]);
				loadRole(accounts[0]);
				return;
			}

			setWalletAddress(null);
			setIsSupernode(null);
			setRoleError('');
		};

		window.ethereum
			.request({ method: 'eth_accounts' })
			.then((accounts) => {
				if (accounts?.[0]) {
					setWalletAddress(accounts[0]);
					console.log('CONNECTED WALLET:', accounts[0]);
					console.log('CONNECTED WALLET ADDRESS', accounts[0]);
					return loadRole(accounts[0]);
				}

				return null;
			})
			.catch(() => {
				setWalletAddress(null);
				setIsSupernode(null);
			})
			.finally(() => {
				setWalletInitializing(false);
			});

		window.ethereum.on?.('accountsChanged', handleAccountsChanged);

		return () => {
			window.ethereum.removeListener?.('accountsChanged', handleAccountsChanged);
		};
	}, [loadRole]);

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
			console.log('CONNECTED WALLET ADDRESS', accounts[0]);
			await loadRole(accounts[0]);
		} catch (err) {
			setWalletAddress(null);
			setIsSupernode(null);
			setRoleError(err.message || 'Unable to connect wallet.');
		}
		setConnecting(false);
	};

	const disconnectWallet = () => {
		setWalletAddress(null);
		setIsSupernode(null);
		setRoleError('');
		setRoleChecking(false);
	};

	return (
		<WalletContext.Provider
			value={{
				walletAddress,
				wallet: walletAddress,
				isConnected,
				isSupernode,
				walletInitializing,
				roleChecking,
				roleError,
				connectWallet,
				disconnectWallet,
				connecting,
			}}
		>
			{children}
		</WalletContext.Provider>
	);
}
