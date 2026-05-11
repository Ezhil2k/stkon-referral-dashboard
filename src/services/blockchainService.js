import { BrowserProvider, Contract } from 'ethers';
import { REFERRAL_MANAGER_ADDRESS } from '../config/contracts.js';
import { REFERRAL_MANAGER_ABI } from '../contracts/referralManagerAbi.js';

function getEthereumProvider() {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not detected');
  }

  return window.ethereum;
}

function normalizeProviderError(error, fallbackMessage) {
  if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
    return new Error('Wallet access rejected');
  }

  if (error?.info?.error?.code === 4001) {
    return new Error('Wallet access rejected');
  }

  return new Error(error?.message || fallbackMessage);
}

export function getProvider() {
  console.log('INITIALIZING PROVIDER');

  try {
    return new BrowserProvider(getEthereumProvider());
  } catch (error) {
    throw normalizeProviderError(error, 'Unable to initialize wallet provider');
  }
}

export async function getSigner() {
  console.log('GETTING SIGNER');

  try {
    const provider = getProvider();
    return await provider.getSigner();
  } catch (error) {
    throw normalizeProviderError(error, 'Unable to get wallet signer');
  }
}

export async function getReferralManagerContract() {
  console.log('CREATING REFERRAL MANAGER CONTRACT');

  try {
    const signer = await getSigner();
    return new Contract(
      REFERRAL_MANAGER_ADDRESS,
      REFERRAL_MANAGER_ABI,
      signer
    );
  } catch (error) {
    throw normalizeProviderError(error, 'Unable to create referral manager contract');
  }
}

export async function createReferralCommitment(commitmentHash, options = {}) {
  console.log('CREATE REFERRAL COMMITMENT', commitmentHash);

  try {
    const contract = await getReferralManagerContract();
    const tx = await contract.createReferralCommitment(commitmentHash);
    console.log('TX SUBMITTED', tx.hash);
    options.onSubmitted?.(tx);

    const receipt = await tx.wait();
    console.log('TX CONFIRMED', receipt);

    return receipt;
  } catch (error) {
    throw normalizeProviderError(error, 'Unable to create referral commitment');
  }
}
