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
    return <div className="offers-carousel-loading">Loading offers...</div>;
  }

  if (!offers || offers.length === 0) {
    return null; // Don't show carousel if no offers
  }

  return (
    <div className="offers-carousel-wrapper">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={16}
        slidesPerView={1}
        navigation={true}
        pagination={{ clickable: true }}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        loop={offers.length > 1}
        breakpoints={{
          640: {
            slidesPerView: 1,
            spaceBetween: 16,
          },
          768: {
            slidesPerView: 2,
            spaceBetween: 16,
          },
          1024: {
            slidesPerView: 3,
            spaceBetween: 16,
          },
          1440: {
            slidesPerView: 4,
            spaceBetween: 20,
          },
        }}
        className="offers-carousel"
      >
        {offers.map((offer) => (
          <SwiperSlide key={offer._id}>
            <div className="offer-slide">
              <div className="offer-image">
                {offer.image ? (
                  <img src={`${url}/images/${offer.image}`} alt={offer.title} />
                ) : (
                  <div className="offer-image-placeholder">
                    <span>No Image</span>
                  </div>
                )}
              </div>
              <div className="offer-info">
                <h3 className="offer-title">{offer.title}</h3>
                <p className="offer-description">{offer.description}</p>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default OffersCarousel;
