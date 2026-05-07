import { useEffect, useState } from 'react';
import './App.css';

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ConnectPage from './pages/ConnectPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import MarketplacePage from './pages/MarketplacePage.jsx';
import ReferralDetailsPage from './pages/ReferralDetailsPage.jsx';
import { healthCheck } from './services/referralService.js';

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
          element={<DashboardPage reservedReferrals={reservedReferrals} backendStatus={backendStatus} />}
        />
        <Route
          path="/marketplace"
          element={
            <MarketplacePage
              onReserveReferral={storeReservedReferral}
              backendStatus={backendStatus}
            />
          }
        />
        <Route
          path="/marketplace/:id"
          element={<ReferralDetailsPage reservedReferrals={reservedReferrals} backendStatus={backendStatus} />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
