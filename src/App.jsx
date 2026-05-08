import { useEffect, useState } from 'react';
import './App.css';

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useWallet } from './context/WalletContext.jsx';
import ConnectPage from './pages/ConnectPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import MarketplacePage from './pages/MarketplacePage.jsx';
import ReferralDetailsPage from './pages/ReferralDetailsPage.jsx';
import { healthCheck } from './services/referralService.js';

function RoleGateLoading({ message = 'Checking account type...' }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#181c20', color: '#9aa79f' }}>
      <div style={{ background: '#23272b', padding: 24, borderRadius: 8, border: '1px solid #2b3137', boxShadow: '0 2px 16px #0004' }}>
        {message}
      </div>
    </div>
  );
}

function ProtectedSupernodeRoute({ children }) {
  const { walletAddress, isSupernode, walletInitializing, roleChecking, roleError } = useWallet();
  const location = useLocation();

  console.log('ROUTE ACCESS', location.pathname);

  if (walletInitializing || roleChecking || (walletAddress && isSupernode === null && !roleError)) {
    return <RoleGateLoading />;
  }

  if (!walletAddress || roleError) {
    return <Navigate to="/" replace />;
  }

  if (isSupernode !== true) {
    return <Navigate to="/marketplace" replace />;
  }

  return children;
}

function ProtectedMarketplaceRoute({ children }) {
  const { walletAddress, isSupernode, walletInitializing, roleChecking, roleError } = useWallet();
  const location = useLocation();

  console.log('ROUTE ACCESS', location.pathname);

  if (walletInitializing || roleChecking || (walletAddress && isSupernode === null && !roleError)) {
    return <RoleGateLoading />;
  }

  if (!walletAddress || roleError) {
    return <Navigate to="/" replace />;
  }

  if (isSupernode === true) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  const [reservedReferrals, setReservedReferrals] = useState([]);
  const [backendStatus, setBackendStatus] = useState('loading');

  useEffect(() => {
    let isMounted = true;

    healthCheck()
      .then((response) => {
        if (!isMounted) return;

        if (response?.success) {
          setBackendStatus('online');
          console.info('[STKON API] Health check passed:', response.message);
        } else {
          setBackendStatus('offline');
          console.warn('[STKON API] Health check returned an unexpected response.');
        }
      })
      .catch((error) => {
        if (!isMounted) return;

        setBackendStatus('offline');
        console.warn('[STKON API] Health check failed:', error.message);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const storeReservedReferral = (referral) => {
    if (!referral) {
      return null;
    }

    const reservedReferral = {
      ...referral,
      reservedAt: referral.reservedAt || new Date().toISOString(),
      expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      validatorPubkey: '0xb7f9c2a641e981f3d4c290b9a27e5f44c61702d8a13c9e5d6b21c442ab81f930',
    };

    setReservedReferrals((items) => [
      reservedReferral,
      ...items.filter((item) => item.id !== reservedReferral.id),
    ]);

    return reservedReferral;
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<ConnectPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedSupernodeRoute>
              <DashboardPage reservedReferrals={reservedReferrals} backendStatus={backendStatus} />
            </ProtectedSupernodeRoute>
          }
        />
        <Route
          path="/marketplace"
          element={
            <ProtectedMarketplaceRoute>
              <MarketplacePage
                onReserveReferral={storeReservedReferral}
                backendStatus={backendStatus}
              />
            </ProtectedMarketplaceRoute>
          }
        />
        <Route
          path="/marketplace/:id"
          element={
            <ProtectedMarketplaceRoute>
              <ReferralDetailsPage reservedReferrals={reservedReferrals} backendStatus={backendStatus} />
            </ProtectedMarketplaceRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
