import React, { useContext, useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import './DeliveryAccount.css';
import DeliveryDashboard from './components/DeliveryDashboard';
import TrackOrderPage from './components/TrackOrderPage';

const DeliveryAccount = () => {
  const { userRole } = useContext(StoreContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('dashboard');

  useEffect(() => {
    if (userRole === 'user') {
      navigate('/myorders');
    }
  }, [userRole, navigate]);

  useEffect(() => {
    if (location.pathname.includes('/track-order/')) {
      setActiveSection('tracking');
    } else {
      setActiveSection('dashboard');
    }
  }, [location.pathname]);

  if (userRole === 'user') {
    return null;
  }

  return (
    <div className="delivery-account">
      <Routes>
        <Route path="/" element={<DeliveryDashboard />} />
        <Route path="/track-order/:orderId" element={<TrackOrderPage />} />
      </Routes>
    </div>
  );
};

export default DeliveryAccount;
