import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { BuyerPortal } from './pages/BuyerPortal';
import { SellerPortal } from './pages/SellerPortal';
import { DispatchPortal } from './pages/DispatchPortal';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/buyer" element={<BuyerPortal />} />
        <Route path="/seller" element={<SellerPortal />} />
        <Route path="/dispatch" element={<DispatchPortal />} />
        {/* Redirect legacy stage route to Dispatch */}
        <Route path="/stage" element={<Navigate to="/dispatch" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
