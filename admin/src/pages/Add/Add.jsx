import React, { useState } from "react";
import "./Add.css";
import { assets } from "../../assets/assets";
import axios from "axios";
import { toast } from "react-toastify";
import { useContext } from "react";
import { StoreContext } from "../../context/StoreContext";
import { useEffect } from "react";
import {useNavigate } from "react-router-dom";

const Add = ({url}) => {
  const navigate=useNavigate();
  const {token,admin} = useContext(StoreContext);
  const [image, setImage] = useState(false);
  const [shops, setShops] = useState([]);
  const [categories, setCategories] = useState([]);
  const [data, setData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    shopId: "",
  });

  const fetchShops = async () => {
    try {
      const response = await axios.get(`${url}/api/shop/list`);
      if (response.data.success) {
        const shopsList = response.data.data || response.data.shops || [];
        const activeShops = shopsList.filter(shop => shop.isActive);
        setShops(activeShops);
        if (activeShops.length > 0 && !data.shopId) {
          setData(prev => ({ ...prev, shopId: activeShops[0]._id }));
        }
      }
    } catch (error) {
      console.error("Error fetching shops:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${url}/api/category/list`);
      if (response.data.success) {
        const categoriesList = response.data.data || response.data.categories || [];
        const activeCategories = categoriesList.filter(cat => cat.isActive);
        setCategories(activeCategories);
        if (activeCategories.length > 0 && !data.category) {
          setData(prev => ({ ...prev, category: activeCategories[0]._id }));
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((data) => ({ ...data, [name]: value }));
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("description", data.description);
    formData.append("price", Number(data.price));
    formData.append("category", data.category);
    formData.append("shopId", data.shopId);
    formData.append("image", image);

    const response = await axios.post(`${url}/api/food/add`, formData,{headers:{token}});
    if (response.data.success) {
      setData({
        name: "",
        description: "",
        price: "",
        category: categories.length > 0 ? categories[0]._id : "",
        shopId: shops.length > 0 ? shops[0]._id : "",
      });
      setImage(false);
      toast.success(response.data.message);
    } else {
      toast.error(response.data.message);
    }
  };
  useEffect(()=>{
    if(!admin && !token){
      toast.error("Please Login First");
       navigate("/");
    }
    fetchShops();
    fetchCategories();
  },[])
  return (
    <div className="add">
      <h1 className="page-title">Add New Item</h1>
      <form onSubmit={onSubmitHandler} className="flex-col">
        <div className="add-img-upload flex-col">
          <p>Upload image</p>
          <label htmlFor="image">
            <img
              src={image ? URL.createObjectURL(image) : assets.upload_area}
              alt=""
            />
          </label>
          <input
            onChange={(e) => setImage(e.target.files[0])}
            type="file"
            id="image"
            hidden
            required
          />
        </div>
        <div className="add-product-name flex-col">
          <p>Product name</p>
          <input
            onChange={onChangeHandler}
            value={data.name}
            type="text"
            name="name"
            placeholder="Type here"
            required
          />
        </div>
        <div className="add-product-description flex-col">
          <p>Product description</p>
          <textarea
            onChange={onChangeHandler}
            value={data.description}
            name="description"
            rows="6"
            placeholder="Write content here"
            required
          ></textarea>
        </div>
        <div className="add-category-price">
          <div className="add-category flex-col">
            <p>Product category *</p>
            <select
              name="category"
              required
              onChange={onChangeHandler}
              value={data.category}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="add-price flex-col">
            <p>Product price</p>
            <input
              onChange={onChangeHandler}
              value={data.price}
              type="Number"
              name="price"
              placeholder="Da20"
              required
            />
          </div>
        </div>
        <div className="add-shop flex-col">
          <p>Shop *</p>
          <select
            name="shopId"
            required
            onChange={onChangeHandler}
            value={data.shopId}
          >
            <option value="">Select a shop</option>
            {shops.map((shop) => (
              <option key={shop._id} value={shop._id}>
                {shop.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="add-btn">
          ADD
        </button>
      </form>
    </div>
  );
};

export default Add;
