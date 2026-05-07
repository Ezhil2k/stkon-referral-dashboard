import { useState } from 'react';
import './App.css';

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ConnectPage from './pages/ConnectPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import MarketplacePage from './pages/MarketplacePage.jsx';
import ReferralDetailsPage from './pages/ReferralDetailsPage.jsx';
import { marketplaceData } from './mock/marketplaceData.js';

function App() {
  const [marketplaceItems, setMarketplaceItems] = useState(marketplaceData);
  const [reservedReferrals, setReservedReferrals] = useState([]);

  const reserveReferral = (id) => {
    const referral = marketplaceItems.find((item) => item.id === id);

    if (!referral) {
      return null;
    }

    const reservedReferral = {
      ...referral,
      reservedAt: new Date().toISOString(),
      expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      secret: '0x91af7c82ab12ff98d44107cb21e83aa9c76f40b122d0e66a81d432a5c9f0b7e4',
      validatorPubkey: '0xb7f9c2a641e981f3d4c290b9a27e5f44c61702d8a13c9e5d6b21c442ab81f930',
    };

    setMarketplaceItems((items) => items.filter((item) => item.id !== id));
    setReservedReferrals((items) => [reservedReferral, ...items]);

    return reservedReferral;
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<ConnectPage />} />
        <Route path="/dashboard" element={<DashboardPage reservedReferrals={reservedReferrals} />} />
        <Route
          path="/marketplace"
          element={<MarketplacePage marketplaceItems={marketplaceItems} onReserveReferral={reserveReferral} />}
        />
        <Route
          path="/marketplace/:id"
          element={<ReferralDetailsPage reservedReferrals={reservedReferrals} />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
