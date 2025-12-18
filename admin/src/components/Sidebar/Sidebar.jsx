import React, { useContext } from 'react'
import './Sidebar.css'
import { assets } from '../../assets/assets'
import { NavLink } from 'react-router-dom'
import { StoreContext } from '../../context/StoreContext'

const Sidebar = () => {
  const { admin, userRole } = useContext(StoreContext)
  const isDelivery = userRole === 'delivery' || userRole === 'livreur'

  return (
    <div className='sidebar'>
      <div className="sidebar-menu">
        {admin && (
          <>
            <NavLink to='/add' className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <div className="sidebar-icon-wrapper">
                <img src={assets.add_icon} alt="Add Items" className="sidebar-icon" />
              </div>
              <span className="sidebar-label">Add Items</span>
              <div className="sidebar-indicator"></div>
            </NavLink>

            <NavLink to='/list' className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <div className="sidebar-icon-wrapper">
                <img src={assets.order_icon} alt="List Items" className="sidebar-icon" />
              </div>
              <span className="sidebar-label">List Items</span>
              <div className="sidebar-indicator"></div>
            </NavLink>

            <NavLink to='/category' className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <div className="sidebar-icon-wrapper">
                <img src={assets.order_icon} alt="Categories" className="sidebar-icon" />
              </div>
              <span className="sidebar-label">Categories</span>
              <div className="sidebar-indicator"></div>
            </NavLink>

            <NavLink to='/shop' className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <div className="sidebar-icon-wrapper">
                <img src={assets.order_icon} alt="Shops" className="sidebar-icon" />
              </div>
              <span className="sidebar-label">Shops</span>
              <div className="sidebar-indicator"></div>
            </NavLink>

            <NavLink to='/orders' className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <div className="sidebar-icon-wrapper">
                <img src={assets.order_icon} alt="Orders" className="sidebar-icon" />
              </div>
              <span className="sidebar-label">Orders</span>
              <div className="sidebar-indicator"></div>
            </NavLink>

            <NavLink to='/pricing' className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <div className="sidebar-icon-wrapper">
                <img src={assets.order_icon} alt="Pricing" className="sidebar-icon" />
              </div>
              <span className="sidebar-label">Delivery Pricing</span>
              <div className="sidebar-indicator"></div>
            </NavLink>

            <NavLink to='/delivery-tracking' className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <div className="sidebar-icon-wrapper">
                <img src={assets.order_icon} alt="Delivery Tracking" className="sidebar-icon" />
              </div>
              <span className="sidebar-label">Delivery Tracking</span>
              <div className="sidebar-indicator"></div>
            </NavLink>

            <NavLink to='/users' className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <div className="sidebar-icon-wrapper">
                <img src={assets.order_icon} alt="Users" className="sidebar-icon" />
              </div>
              <span className="sidebar-label">Users</span>
              <div className="sidebar-indicator"></div>
            </NavLink>
          </>
        )}

        {isDelivery && (
          <NavLink to='/order-tracking' className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
            <div className="sidebar-icon-wrapper">
              <img src={assets.order_icon} alt="My Orders" className="sidebar-icon" />
            </div>
            <span className="sidebar-label">My Deliveries</span>
            <div className="sidebar-indicator"></div>
          </NavLink>
        )}
      </div>
    </div>
  )
}

export default Sidebar
