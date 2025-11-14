import React, { useContext, useState, useMemo } from "react";
import "./FoodDisplay.css";
import { StoreContext } from "../../context/StoreContext";
import FoodItem from "../FoodItem/FoodItem";

const FoodDisplay = ({ category, setCategory }) => {
  const { food_list, selectedShop } = useContext(StoreContext);
  const [localCategory, setLocalCategory] = useState("All");

  const activeCategory = setCategory ? category : localCategory;
  const handleCategoryChange = setCategory ? setCategory : setLocalCategory;

  const shopFoods = useMemo(() => {
    return food_list.filter((item) => item.shopId === selectedShop);
  }, [food_list, selectedShop]);

  const categories = useMemo(() => {
    const uniqueCategories = new Set(shopFoods.map((item) => item.category));
    return Array.from(uniqueCategories).sort();
  }, [shopFoods]);

  const filteredFoods = useMemo(() => {
    if (activeCategory === "All") {
      return shopFoods;
    }
    return shopFoods.filter((item) => item.category === activeCategory);
  }, [shopFoods, activeCategory]);

  return (
    <div className="food-display" id="food-display">
      <h2>Top dishes near you</h2>

      {categories.length > 0 && (
        <div className="food-categories">
          <button
            className={`category-btn ${activeCategory === "All" ? "active" : ""}`}
            onClick={() => handleCategoryChange("All")}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-btn ${activeCategory === cat ? "active" : ""}`}
              onClick={() => handleCategoryChange(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="food-display-list">
        {filteredFoods && filteredFoods.length > 0 ? (
          filteredFoods.map((item, index) => (
            <FoodItem
              key={index}
              id={item._id}
              name={item.name}
              description={item.description}
              price={item.price}
              image={item.image}
            />
          ))
        ) : (
          <p className="no-items">No items available in this category</p>
        )}
      </div>
    </div>
  );
};

export default FoodDisplay;
