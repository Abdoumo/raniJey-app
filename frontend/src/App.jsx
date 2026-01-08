import React, { useState, useContext, useEffect } from "react";
import Navbar from "./components/Navbar/Navbar";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home/Home";
import Cart from "./pages/Cart/Cart";
import PlaceOrder from "./pages/PlaceOrder/PlaceOrder";
import Footer from "./components/Footer/Footer";
import LoginPopup from "./components/LoginPopup/LoginPopup";
import AddNoteModal from "./components/AddNoteModal/AddNoteModal";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Verify from "./pages/Verify/Verify";
import MyOrders from "./pages/MyOrders/MyOrders";
import NearestOrders from "./pages/NearestOrders/NearestOrders";
import DeliveryAccount from "./pages/DeliveryAccount/DeliveryAccount";
import OrderTrackingMap from "./pages/OrderTrackingMap/OrderTrackingMap";
import { StoreContext } from "./context/StoreContext";
import { useAutoTracking } from "./hooks/useAutoTracking";

const App = () => {
  const [showLogin, setShowLogin] = useState(false);
  const { showNoteModal, setShowNoteModal, pendingItemId, confirmAddToCart, food_list, token } = useContext(StoreContext);
  const { requestLocationPermission, error: locationError } = useAutoTracking();

  const getPendingItemName = () => {
    if (pendingItemId) {
      const item = food_list.find((food) => food._id === pendingItemId);
      return item?.name || "Item";
    }
    return "Item";
  };

  // Auto-request location permission for logged-in users
  useEffect(() => {
    if (token) {
      requestLocationPermission();
    }
  }, [token, requestLocationPermission]);

  return (
    <>
      {showLogin ? <LoginPopup setShowLogin={setShowLogin} /> : <></>}
      {showNoteModal && (
        <AddNoteModal
          itemName={getPendingItemName()}
          onConfirm={confirmAddToCart}
          onCancel={() => setShowNoteModal(false)}
        />
      )}
      <div className="app">
        <ToastContainer />
        <Navbar setShowLogin={setShowLogin} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/order" element={<PlaceOrder />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/myorders" element={<MyOrders />} />
          <Route path="/nearest-orders" element={<NearestOrders />} />
          <Route path="/delivery/account/*" element={<DeliveryAccount />} />
          <Route path="/order-tracking/:orderId" element={<OrderTrackingMap />} />
        </Routes>
      </div>
      <Footer />
    </>
  );
};

export default App;
