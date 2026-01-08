import React, { useContext, useState, useEffect, useRef, useCallback } from "react";
import "./PlaceOrder.css";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from 'react-router-dom'
import { useAutoTracking } from "../../hooks/useAutoTracking";

const PlaceOrder = () => {
  const navigate= useNavigate();
  const locationState = useLocation();

  const { getTotalCartAmount, token, food_list, cartItems, url, setCartItems, shopLocation } =
    useContext(StoreContext);
  const { location: userLocation, requestLocationPermission, hasPermission } = useAutoTracking();
  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
    phone: "",
  });
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [loadingDeliveryFee, setLoadingDeliveryFee] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [deliveryType, setDeliveryType] = useState(locationState?.state?.deliveryType || "standard");
  const lastFetchedDistanceRef = useRef(null);
  const permissionRequestedRef = useRef(false);
  const debounceTimerRef = useRef(null);

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((data) => ({ ...data, [name]: value }));
  };

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth's radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  const placeOrder = async (event) => {
    event.preventDefault();

    let orderItems = [];
    let shopId = null;

    food_list.forEach((item) => {
      const cartItem = cartItems[item._id];
      if (cartItem && cartItem.quantity > 0) {
        if (!shopId && item.shopId) {
          shopId = item.shopId;
        }
        orderItems.push({
          _id: item._id,
          name: item.name,
          price: item.price,
          quantity: cartItem.quantity,
          notes: cartItem.notes || "",
          image: item.image,
          shopId: item.shopId,
        });
      }
    });

    if (orderItems.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    try {
      let deliveryLocation = null;

      if (navigator.geolocation) {
        deliveryLocation = await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
            },
            (error) => {
              console.warn("GPS not available:", error.message);
              resolve(null);
            },
            { timeout: 15000, maximumAge: 0, enableHighAccuracy: true }
          );
        });
      }

      let orderData = {
        address: data,
        items: orderItems,
        amount: getTotalCartAmount() + deliveryFee + (deliveryType === "door-to-door" ? 50 : 0),
        deliveryType: deliveryType,
      };

      if (shopId) {
        orderData.shopId = shopId;
      }

      if (deliveryLocation) {
        orderData.deliveryLocation = deliveryLocation;
      }

      console.log("Sending order data:", JSON.stringify(orderData, null, 2));
      console.log("Token present:", !!token);
      console.log("Token value:", token ? `${token.substring(0, 20)}...` : "NO TOKEN");

      console.log("Request headers:", { token });
      console.log("API endpoint:", url + "/api/order/place");

      let response = await axios.post(url + "/api/order/place", orderData, { headers: { token } });
      console.log("Order response status:", response.status);
      console.log("Order response data:", response.data);

      if (response.data.success) {
        setCartItems({});
        toast.success("Order placed successfully!");

        setTimeout(() => {
          navigate("/");
        }, 1500);
      } else {
        const errorMsg = response.data.message || "Failed to place order";
        console.error("Order error:", errorMsg);
        console.error("Full response data:", JSON.stringify(response.data, null, 2));
        toast.error(`Order Error: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Axios error caught:", error.message);
      console.error("Error status:", error.response?.status);
      console.error("Error response data:", error.response?.data);
      console.error("Error headers:", error.response?.headers);

      const errorMessage = error.response?.data?.message || error.message || "Error placing order";
      console.error("Error message being shown:", errorMessage);
      toast.error(`Error: ${errorMessage}`);
    }
  };

  // Calculate delivery fee when location is available (with debouncing)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (userLocation && shopLocation && shopLocation.latitude && shopLocation.longitude) {
      setPermissionError(null);

      debounceTimerRef.current = setTimeout(async () => {
        const distanceInMeters = calculateDistance(
          shopLocation.latitude,
          shopLocation.longitude,
          userLocation.latitude,
          userLocation.longitude
        );
        const distanceInKm = distanceInMeters / 1000;

        // Skip if distance hasn't changed
        if (lastFetchedDistanceRef.current === Math.round(distanceInKm * 100)) {
          return;
        }
        lastFetchedDistanceRef.current = Math.round(distanceInKm * 100);

        try {
          setLoadingDeliveryFee(true);
          const response = await axios.post(
            url + "/api/pricing/calculate",
            {
              distance: distanceInKm,
              unit: "km"
            }
          );
          if (response.data.success) {
            setDeliveryFee(response.data.price);
            console.log('Delivery fee calculated successfully:', {
              distance: distanceInKm,
              unit: 'km',
              price: response.data.price
            });
          } else {
            setDeliveryFee(0);
            console.error("Error calculating delivery fee:", response.data.message);
          }
        } catch (error) {
          console.error("Error fetching delivery fee:", error);
          setDeliveryFee(0);
        } finally {
          setLoadingDeliveryFee(false);
        }
      }, 300);
    } else if (!shopLocation || !shopLocation.latitude) {
      setDeliveryFee(0);
    } else if (!userLocation && shopLocation && shopLocation.latitude) {
      setPermissionError('Location permission needed to calculate delivery fee');
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [userLocation, shopLocation, calculateDistance, url]);

  // Handle location permission button click
  const handleEnableLocation = async () => {
    await requestLocationPermission(true);
  };

  useEffect(()=>{
    if(!token){
      toast.error("Please Login first")
      navigate("/cart")
    }
    else if(getTotalCartAmount()===0){
      toast.error("Please Add Items to Cart");
      navigate("/cart")
    }
  },[token])
  return (
    <form className="place-order" onSubmit={placeOrder}>
      <div className="place-order-left">
        <p className="title">Delivery Information</p>
        <div className="multi-fields">
          <input
            required
            name="firstName"
            value={data.firstName}
            onChange={onChangeHandler}
            type="text"
            placeholder="First name"
          />
          <input
            required
            name="lastName"
            value={data.lastName}
            onChange={onChangeHandler}
            type="text"
            placeholder="Last name"
          />
        </div>
        <input
          required
          name="email"
          value={data.email}
          onChange={onChangeHandler}
          type="text"
          placeholder="Email Address"
        />
        <input
          required
          name="street"
          value={data.street}
          onChange={onChangeHandler}
          type="text"
          placeholder="Street"
        />
        <div className="multi-fields">
          <input
            required
            name="city"
            value={data.city}
            onChange={onChangeHandler}
            type="text"
            placeholder="City"
          />
          <input
            required
            name="state"
            value={data.state}
            onChange={onChangeHandler}
            type="text"
            placeholder="State"
          />
        </div>
        <div className="multi-fields">
          <input
            required
            name="zipcode"
            value={data.zipcode}
            onChange={onChangeHandler}
            type="text"
            placeholder="Zip Code"
          />
          <input
            required
            name="country"
            value={data.country}
            onChange={onChangeHandler}
            type="text"
            placeholder="Country"
          />
        </div>
        <input
          required
          name="phone"
          value={data.phone}
          onChange={onChangeHandler}
          type="text"
          placeholder="Phone"
        />
        <p className="title" style={{ marginTop: "20px" }}>Delivery Option</p>
        <div className="delivery-options">
          <label className="delivery-option">
            <input
              type="radio"
              value="standard"
              checked={deliveryType === "standard"}
              onChange={(e) => setDeliveryType(e.target.value)}
            />
            <span className="delivery-label">Standard Delivery</span>
          </label>
          <label className="delivery-option">
            <input
              type="radio"
              value="door-to-door"
              checked={deliveryType === "door-to-door"}
              onChange={(e) => setDeliveryType(e.target.value)}
            />
            <span className="delivery-label">Door-to-Door Delivery <span className="delivery-fee">+50DA</span></span>
          </label>
        </div>
      </div>
      <div className="place-order-right">
        <div className="cart-total">
          <h2>Cart Totals</h2>
          <div>
            <div className="cart-total-details">
              <p>Subtotals</p>
              <p>Da{getTotalCartAmount()}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <p>Delivery Fee</p>
              <div>
                {getTotalCartAmount() === 0 ? (
                  <p>Da0</p>
                ) : !hasPermission ? (
                  <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                    <p style={{fontSize: '12px', color: '#666', margin: 0}}>Location needed to calculate</p>
                    <button
                      onClick={handleEnableLocation}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#ff6b35',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}
                    >
                      📍 Enable Location
                    </button>
                  </div>
                ) : (
                  <p>Da{loadingDeliveryFee ? "..." : deliveryFee}</p>
                )}
              </div>
            </div>
            <hr />
            <hr />
            {deliveryType === "door-to-door" && (
              <div className="cart-total-details">
                <p>Door-to-Door Premium</p>
                <p>Da50</p>
              </div>
            )}
            <div className="cart-total-details">
              <b>Total</b>
              <b>
                Da{getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + deliveryFee + (deliveryType === "door-to-door" ? 50 : 0)}
              </b>
            </div>
          </div>
          <button type="submit">PROCEED TO PAYMENT</button>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;
