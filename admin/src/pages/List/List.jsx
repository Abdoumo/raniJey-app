import React, { useEffect, useState } from "react";
import "./List.css";
import axios from "axios";
import { toast } from "react-toastify";
import { useContext } from "react";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";

const List = ({ url }) => {
  const navigate = useNavigate();
  const { token,admin } = useContext(StoreContext);
  const [list, setList] = useState([]);
  const [categories, setCategories] = useState({});
  const [shops, setShops] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${url}/api/category/list`);
      if (response.data.success) {
        const cats = response.data.data || response.data.categories || [];
        const catMap = {};
        cats.forEach(cat => {
          catMap[cat._id] = cat.name;
        });
        setCategories(catMap);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchShops = async () => {
    try {
      const response = await axios.get(`${url}/api/shop/list`);
      if (response.data.success) {
        const shopsList = response.data.data || response.data.shops || [];
        const shopMap = {};
        shopsList.forEach(shop => {
          shopMap[shop._id] = shop.name;
        });
        setShops(shopMap);
      }
    } catch (err) {
      console.error("Error fetching shops:", err);
    }
  };

  const fetchList = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${url}/api/food/list`);
      if (response.data.success) {
        setList(response.data.data);
      } else {
        setError(response.data.message || "Failed to fetch foods");
        toast.error(response.data.message || "Error fetching foods");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Error fetching foods";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const removeFood = async (foodId) => {
    const response = await axios.post(
      `${url}/api/food/remove`,
      { id: foodId },
      { headers: { token } }
    );
    await fetchList();
    if (response.data.success) {
      toast.success(response.data.message);
    } else {
      toast.error("Error");
    }
  };
  useEffect(() => {
    if (!admin && !token) {
      toast.error("Please Login First");
      navigate("/");
    }
    fetchCategories();
    fetchShops();
    fetchList();
  }, []);

  return (
    <div className="list add flex-col">
      <h1 className="page-title">All Food Items</h1>
      {loading ? (
        <div className="list-loading">
          <p>Loading foods...</p>
        </div>
      ) : error ? (
        <div className="list-error">
          <p>❌ Error: {error}</p>
          <button onClick={fetchList} className="retry-button">Retry</button>
        </div>
      ) : list.length === 0 ? (
        <div className="list-empty">
          <p>📦 No food items found</p>
          <p className="empty-subtext">Add your first item to get started</p>
        </div>
      ) : (
        <div className="list-table">
          <div className="list-table-format title">
            <b>Image</b>
            <b>Name</b>
            <b>Category</b>
            <b>Price</b>
            <b>Shop</b>
            <b>Action</b>
          </div>
          {list.map((item, index) => {
            const categoryName = typeof item.category === 'object' ? item.category.name : categories[item.category] || item.category || 'N/A';
            const shopName = typeof item.shopId === 'object' ? item.shopId.name : shops[item.shopId] || item.shopId || 'N/A';

            return (
              <div key={index} className="list-table-format">
                <img src={`${url}/images/` + item.image} alt={item.name} />
                <p>{item.name}</p>
                <p className="category-name">{categoryName}</p>
                <p>Da{item.price}</p>
                <p className="shop-name">{shopName}</p>
                <p onClick={() => removeFood(item._id)} className="cursor">
                  X
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default List;
