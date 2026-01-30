import React, { useContext, useState, useEffect, useRef, useCallback } from "react";
import "./Cart.css";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";
import { useAutoTracking } from "../../hooks/useAutoTracking";
import axios from "axios";
import { toast } from "react-toastify";

const Cart = () => {
  const {
    food_list,
    cartItems,
    setCartItems,
    addToCart,
    removeFromCart,
    getTotalCartAmount,
    url,
    shopLocation,
    token
  } = useContext(StoreContext);

  const { location: userLocation, requestLocationPermission, hasPermission } = useAutoTracking();
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [loadingDeliveryFee, setLoadingDeliveryFee] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [deliveryType, setDeliveryType] = useState("standard");
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const lastFetchedDistanceRef = useRef(null);
  const permissionRequestedRef = useRef(false);
  const debounceTimerRef = useRef(null);

  const navigate = useNavigate();

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
    await requestLocationPermission();
  };

  // Validate and apply coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }

    try {
      setApplyingCoupon(true);
      const subtotal = getTotalCartAmount();

      const response = await axios.post(
        url + `/api/coupon/validate/${couponCode.toUpperCase()}`,
        { orderAmount: subtotal }
      );

      if (response.data.success && response.data.isValid) {
        setCoupon(response.data.coupon);
        setDiscount(response.data.discount);
        toast.success(`Coupon applied! You saved Da${response.data.discount}`);
      } else {
        toast.error(response.data.message || "Invalid coupon code");
        setCoupon(null);
        setDiscount(0);
      }
    } catch (error) {
      console.error("Error validating coupon:", error);
      toast.error("Error applying coupon");
      setCoupon(null);
      setDiscount(0);
    } finally {
      setApplyingCoupon(false);
    }
  };

  // Remove coupon
  const handleRemoveCoupon = () => {
    setCouponCode("");
    setCoupon(null);
    setDiscount(0);
    toast.success("Coupon removed");
  };

  return (
    <div className="cart">
      <div className="cart-items">
        <div className="cart-items-title">
          <p>Items</p>
          <p>Title</p>
          <p>Price</p>
          <p>Quantity</p>
          <p>Total</p>
          <p>Remove</p>
        </div>
        <br />
        <hr />
        {food_list.map((item) => {
          const cartItem = cartItems[item._id];
          if (cartItem && cartItem.quantity > 0) {
            return (
              <div key={item._id}>
                <div className="cart-items-title cart-items-item">
                  <img src={url+"/images/"+item.image} alt="" />
                  <p>{item.name}</p>
                  <p>Da{item.price}</p>
                  <p>{cartItem.quantity}</p>
                  <p>Da{item.price * cartItem.quantity}</p>
                  <p onClick={() => removeFromCart(item._id)} className="cross">
                    x
                  </p>
                </div>
                {cartItem.notes && (
                  <div className="cart-item-notes">
                    <p><strong>Special instructions:</strong> {cartItem.notes}</p>
                  </div>
                )}
                <hr />
              </div>
            );
          }
        })}
      </div>
      <div className="cart-bottom">
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
            <p style={{ fontSize: "14px", fontWeight: "600", color: "#1a1a1a", marginBottom: "12px" }}>Delivery Option</p>
            <div className="delivery-options-cart">
              <label className="delivery-option-cart">
                <input
                  type="radio"
                  value="standard"
                  checked={deliveryType === "standard"}
                  onChange={(e) => setDeliveryType(e.target.value)}
                />
                <span className="delivery-label-cart">Standard Delivery</span>
              </label>
              <label className="delivery-option-cart">
                <input
                  type="radio"
                  value="door-to-door"
                  checked={deliveryType === "door-to-door"}
                  onChange={(e) => setDeliveryType(e.target.value)}
                />
                <span className="delivery-label-cart">Door-to-Door Delivery <span className="delivery-fee-cart">+50DA</span></span>
              </label>
            </div>
            <hr />
            {deliveryType === "door-to-door" && (
              <div className="cart-total-details">
                <p>Door-to-Door Premium</p>
                <p>Da50</p>
              </div>
            )}
            {coupon && (
              <div className="cart-total-details discount-row">
                <p>Discount ({coupon.code})</p>
                <p style={{color: "#27ae60"}}>-Da{discount}</p>
              </div>
            )}
            <hr />
            <div className="cart-total-details">
              <b>Total</b>
              <b>Da{getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + deliveryFee + (deliveryType === "door-to-door" ? 50 : 0) - discount}</b>
            </div>
          </div>
          <button onClick={()=>navigate('/order', { state: { deliveryType } })}>PROCEED TO CHECKOUT</button>
        </div>
        <div className="cart-promocode">
          <div>
            <p>If you have a promocode, Enter it here</p>
            {coupon ? (
              <div className="cart-promocode-input">
                <input
                  type="text"
                  placeholder="promo code"
                  value={coupon.code}
                  disabled
                  style={{backgroundColor: "#f0f0f0", cursor: "not-allowed"}}
                />
                <button onClick={handleRemoveCoupon} style={{backgroundColor: "#ff6b6b"}}>Remove</button>
              </div>
            ) : (
              <div className="cart-promocode-input">
                <input
                  type="text"
                  placeholder="promo code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === "Enter" && handleApplyCoupon()}
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={applyingCoupon}
                  style={{opacity: applyingCoupon ? 0.6 : 1}}
                >
                  {applyingCoupon ? "..." : "Apply"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
