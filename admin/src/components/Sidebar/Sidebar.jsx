import React from 'react'
import './Sidebar.css'
import { assets } from '../../assets/assets'
import { NavLink } from 'react-router-dom'

const Sidebar = () => {
  return (
    <div className='sidebar'>
      <div className="sidebar-menu">
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

        <NavLink to='/orders' className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
          <div className="sidebar-icon-wrapper">
            <img src={assets.order_icon} alt="Orders" className="sidebar-icon" />
          </div>
          <span className="sidebar-label">Orders</span>
          <div className="sidebar-indicator"></div>
        </NavLink>
      </div>
    </div>
  )
}

export default Sidebar
