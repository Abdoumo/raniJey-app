import React, { useContext } from "react";
import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/Sidebar/Sidebar";
import { Route, Routes } from "react-router-dom";
import Add from "./pages/Add/Add";
import List from "./pages/List/List";
import Orders from "./pages/Orders/Orders";
import Users from "./pages/Users/Users";
import Shop from "./pages/Shop/Shop";
import Category from "./pages/Category/Category";
import Pricing from "./pages/Pricing/Pricing";
import DeliveryTracking from "./pages/DeliveryTracking/DeliveryTracking";
import OrderTrackingMap from "./pages/OrderTrackingMap/OrderTrackingMap";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Login from "./components/Login/Login";
import { StoreContext } from "./context/StoreContext";

const App = () => {
  const url = "https://backend.rani-jay.com";
  const { admin, token, userRole } = useContext(StoreContext);
  const isDelivery = userRole === "delivery" || userRole === "livreur";
  const isAuthenticated = token && (admin || isDelivery);

  return (
    <div className="app-container">
      <ToastContainer />
      {isAuthenticated ? (
        <>
          <Navbar />
          <div className="app-content">
            <Sidebar />
            <Routes>
              {admin && (
                <>
                  <Route path="/add" element={<Add url={url}/>} />
                  <Route path="/list" element={<List url={url}/>} />
                  <Route path="/orders" element={<Orders url={url}/>} />
                  <Route path="/users" element={<Users url={url}/>} />
                  <Route path="/shop" element={<Shop url={url}/>} />
                  <Route path="/category" element={<Category url={url}/>} />
                  <Route path="/pricing" element={<Pricing url={url}/>} />
                  <Route path="/delivery-tracking" element={<DeliveryTracking url={url}/>} />
                </>
              )}
              <Route path="/order-tracking/:orderId" element={<OrderTrackingMap/>} />
              <Route path="/" element={admin ? <Add url={url}/> : <OrderTrackingMap/>} />
            </Routes>
          </div>
        </>
      ) : (
        <Routes>
          <Route path="/" element={<Login url={url}/>} />
          <Route path="*" element={<Login url={url}/>} />
        </Routes>
      )}
    </div>
  );
};

export default App;
