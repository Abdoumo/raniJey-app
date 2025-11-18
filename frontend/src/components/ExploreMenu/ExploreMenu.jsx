import React, { useContext } from "react";
import "./ExploreMenu.css";
import { StoreContext } from "../../context/StoreContext";

const ExploreMenu = ({ category, setCategory }) => {
  const { shops, selectedShop, setSelectedShop } = useContext(StoreContext);

  const handleShopChange = (shopId) => {
    setSelectedShop(shopId);
    setCategory("All");
  };

  return (
    <div className="explore-menu" id="explore-menu">
      <h1>Explore our shops</h1>
      <p className="explore-menu-text">
        Choose from a diverse selection of restaurants and food stores. Our
        mission is to satisfy your cravings and elevate your dining experience,
        one delicious meal at a time.
      </p>
      <div className="explore-menu-list">
        {shops && shops.length > 0 ? (
          shops.map((shop) => {
            return (
              <div
                onClick={() => handleShopChange(shop._id)}
                key={shop._id}
                className={`explore-menu-list-item ${
                  selectedShop === shop._id ? "active-shop" : ""
                }`}
              >
                {shop.image && (
                  <img
                    className={selectedShop === shop._id ? "active" : ""}
                    src={`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/images/${shop.image}`}
                    alt={shop.name}
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/150";
                    }}
                  />
                )}
                <p>{shop.name}</p>
              </div>
            );
          })
        ) : (
          <p className="no-shops">No shops available</p>
        )}
      </div>
      <hr />
    </div>
  );
};

export default ExploreMenu;
