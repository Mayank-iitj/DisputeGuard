import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { StagePage } from './pages/StagePage';
import { BuyerPortal } from './pages/BuyerPortal';
import { SellerPortal } from './pages/SellerPortal';
import { DispatchPortal } from './pages/DispatchPortal';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/stage" element={<StagePage />} />
        <Route path="/buyer" element={<BuyerPortal />} />
        <Route path="/seller" element={<SellerPortal />} />
        <Route path="/dispatch" element={<DispatchPortal />} />
        <Route path="*" element={<Navigate to="/stage" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
