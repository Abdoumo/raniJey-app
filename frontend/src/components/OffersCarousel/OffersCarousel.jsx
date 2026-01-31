import React, { useEffect, useState, useContext } from "react";
import "./OffersCarousel.css";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";

const OffersCarousel = () => {
  const { url } = useContext(StoreContext);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveOffers = async () => {
      try {
        const response = await axios.get(url + "/api/offer/active");
        if (response.data.success) {
          setOffers(response.data.offers);
        }
      } catch (error) {
        console.error("Error fetching offers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveOffers();
  }, [url]);

  if (loading) {
    return <div className="offers-carousel-loading">Loading special offers...</div>;
  }

  if (!offers || offers.length === 0) {
    return null;
  }

  return (
    <div className="offers-carousel-container">
      <div className="offers-header">
        <h2 className="offers-section-title">✨ Special Offers & Deals</h2>
        <p className="offers-section-subtitle">Don't miss out on our exclusive promotions</p>
      </div>

      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={20}
        slidesPerView={1}
        navigation={true}
        pagination={{ clickable: true, dynamicBullets: true }}
        autoplay={{ delay: 6000, disableOnInteraction: true }}
        loop={offers.length > 1}
        breakpoints={{
          640: {
            slidesPerView: 1,
            spaceBetween: 20,
          },
          768: {
            slidesPerView: 2,
            spaceBetween: 20,
          },
          1024: {
            slidesPerView: 2,
            spaceBetween: 24,
          },
          1440: {
            slidesPerView: 3,
            spaceBetween: 28,
          },
        }}
        className="offers-carousel"
      >
        {offers.map((offer) => (
          <SwiperSlide key={offer._id}>
            <div className="offer-card-wrapper">
              <div className="offer-card">
                <div className="offer-badge">SPECIAL</div>
                <div className="offer-image-container">
                  {offer.image ? (
                    <img
                      src={`${url}/images/${offer.image}`}
                      alt={offer.title}
                      className="offer-image-content"
                    />
                  ) : (
                    <div className="offer-image-placeholder">
                      <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                      </svg>
                    </div>
                  )}
                  <div className="offer-overlay"></div>
                </div>
                <div className="offer-content">
                  <h3 className="offer-card-title">{offer.title}</h3>
                  <p className="offer-card-description">{offer.description}</p>
                  <button className="offer-cta-button">View Offer</button>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default OffersCarousel;
