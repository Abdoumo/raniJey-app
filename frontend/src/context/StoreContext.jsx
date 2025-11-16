import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
  const [cartItems, setCartItems] = useState({});
  const url = "http://backend.rani-jay.com";
  const [token, setToken] = useState("");
  const [food_list, setFoodList] = useState([]);
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [categories, setCategories] = useState([]);

  const addToCart = async (itemId) => {
    if (!cartItems[itemId]) {
      setCartItems((prev) => ({ ...prev, [itemId]: 1 }));
    } else {
      setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] + 1 }));
    }
    if (token) {
      const response = await axios.post(
        url + "/api/cart/add",
        { itemId },
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success("item Added to Cart");
      } else {
        toast.error("Something went wrong");
      }
    }
  };

  const removeFromCart = async (itemId) => {
    setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] - 1 }));
    if (token) {
      const response = await axios.post(
        url + "/api/cart/remove",
        { itemId },
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success("item Removed from Cart");
      } else {
        toast.error("Something went wrong");
      }
    }
  };

  const getTotalCartAmount = () => {
    let totalAmount = 0;
    for (const item in cartItems) {
      if (cartItems[item] > 0) {
        let itemInfo = food_list.find((product) => product._id === item);
        if (itemInfo) {
          totalAmount += itemInfo.price * cartItems[item];
        }
      }
    }
    return totalAmount;
  };

  const fetchShops = async () => {
    try {
      const response = await axios.get(url + "/api/shop/list");
      if (response.data.success) {
        setShops(response.data.shops);
        if (response.data.shops.length > 0) {
          setSelectedShop(response.data.shops[0]._id);
        }
      }
    } catch (error) {
      console.error("Error fetching shops:", error);
    }
  };

  const fetchFoodList = async () => {
    try {
      const response = await axios.get(url + "/api/food/list");
      if (response.data.success) {
        setFoodList(response.data.data);
      } else {
        alert("Error! Products are not fetching..");
      }
    } catch (error) {
      console.error("Error fetching food list:", error);
    }
  };

  const loadCardData = async (token) => {
    try {
      const response = await axios.post(
        url + "/api/cart/get",
        {},
        { headers: { token } }
      );
      setCartItems(response.data.cartData);
    } catch (error) {
      console.error("Error loading cart data:", error);
    }
  };

  const fetchUserRole = async (token) => {
    try {
      const response = await axios.get(
        url + "/api/user/profile",
        { headers: { token } }
      );
      if (response.data.success) {
        setUserRole(response.data.user.role);
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(url + "/api/category/list");
      if (response.data.success) {
        setCategories(response.data.categories || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find((cat) => cat._id === categoryId);
    return category?.name || categoryId;
  };

  useEffect(() => {
    async function loadData() {
      await fetchShops();
      await fetchFoodList();
      await fetchCategories();
      if (localStorage.getItem("token")) {
        const savedToken = localStorage.getItem("token");
        setToken(savedToken);
        await loadCardData(savedToken);
        await fetchUserRole(savedToken);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (token && !userRole) {
      fetchUserRole(token);
    }
  }, [token]);

  const contextValue = {
    food_list,
    cartItems,
    setCartItems,
    addToCart,
    removeFromCart,
    getTotalCartAmount,
    url,
    token,
    setToken,
    shops,
    selectedShop,
    setSelectedShop,
    userRole,
    setUserRole,
    categories,
    getCategoryName,
  };
  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};
export default StoreContextProvider;
