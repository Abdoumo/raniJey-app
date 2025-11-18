# User CRUD API Documentation

## Base URL
`http://localhost:4000/api/user`

---

## Authentication Endpoints

### Register User
**Endpoint:** `POST /register`

**Description:** Create a new user account

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@gmail.com",
  "password": "password123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "user"
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "User already exists"
}
```

**Validation Rules:**
- `name`: Required, string
- `email`: Required, valid email format, unique
- `password`: Required, minimum 8 characters

---

### Login User
**Endpoint:** `POST /login`

**Description:** Authenticate user and get JWT token

**Request Body:**
```json
{
  "email": "john@gmail.com",
  "password": "password123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "user"
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Invalid Credentials"
}
```

---

## Protected Endpoints (Requires JWT Token)

### Get User Profile
**Endpoint:** `GET /profile`

**Description:** Get current logged-in user's profile

**Headers:**
```
token: YOUR_JWT_TOKEN
```

**Response (Success):**
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@gmail.com",
    "role": "user",
    "cartData": {}
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Not Authorized Login Again"
}
```

---

### Update User Profile
**Endpoint:** `PUT /profile`

**Description:** Update current user's name and/or email

**Headers:**
```
token: YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Updated",
  "email": "john.new@gmail.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Updated",
    "email": "john.new@gmail.com",
    "role": "user",
    "cartData": {}
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Email already in use"
}
```

**Validation:**
- At least one field (`name` or `email`) required
- Email must be valid format and unique

---

### Delete User Account
**Endpoint:** `DELETE /profile`

**Description:** Delete current user's account

**Headers:**
```
token: YOUR_JWT_TOKEN
```

**Response (Success):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Not Authorized Login Again"
}
```

---

### Get All Users (Admin Only)
**Endpoint:** `GET /list/all`

**Description:** Get list of all registered users (Admin only)

**Headers:**
```
token: YOUR_JWT_TOKEN
```

**Response (Success):**
```json
{
  "success": true,
  "totalUsers": 5,
  "users": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@gmail.com",
      "role": "user",
      "cartData": {}
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Admin User",
      "email": "admin@gmail.com",
      "role": "admin",
      "cartData": {}
    }
  ]
}
```

**Response (Error - Not Admin):**
```json
{
  "success": false,
  "message": "Unauthorized: Admin access required"
}
```

**Response (Error - Not Authenticated):**
```json
{
  "success": false,
  "message": "Not Authorized Login Again"
}
```

**Notes:**
- Only users with `role: "admin"` can access this endpoint
- Passwords are excluded from response for security
- Returns total count of users and full user list

---

### Toggle User Account Status (Admin Only)
**Endpoint:** `PATCH /toggle-status/:userId`

**Description:** Activate or deactivate a user account (Admin only)

**Headers:**
```
token: YOUR_JWT_TOKEN
```

**Parameters:**
- `userId` (string): MongoDB user ID to toggle

**Example:**
```
PATCH /toggle-status/507f1f77bcf86cd799439011
```

**Response (Success - Activated):**
```json
{
  "success": true,
  "message": "User account activated successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@gmail.com",
    "role": "user",
    "isActive": true,
    "cartData": {}
  }
}
```

**Response (Success - Deactivated):**
```json
{
  "success": true,
  "message": "User account deactivated successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@gmail.com",
    "role": "user",
    "isActive": false,
    "cartData": {}
  }
}
```

**Response (Error - Not Admin):**
```json
{
  "success": false,
  "message": "Unauthorized: Admin access required"
}
```

**Response (Error - Cannot deactivate admin):**
```json
{
  "success": false,
  "message": "Cannot deactivate admin accounts"
}
```

**Notes:**
- Only users with `role: "admin"` can access this endpoint
- Toggling deactivates if active, activates if inactive
- Admin accounts cannot be deactivated
- New accounts are created with `isActive: true` by default

---

---

# Shop Management API

## Base URL
`http://localhost:4000/api/shop`

---

## Admin Only Endpoints (Requires JWT Token with Admin Role)

### Create Shop
**Endpoint:** `POST /create`

**Description:** Create a new shop (restaurant or butchers)

**Headers:**
```
token: YOUR_JWT_TOKEN
Content-Type: multipart/form-data
```

**Request Body:**
```json
{
  "name": "John's Restaurant",
  "type": "restaurant",
  "description": "Delicious Italian food",
  "address": "123 Main St, City",
  "phone": "+1-555-123-4567",
  "image": <file>
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Shop created successfully",
  "shop": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John's Restaurant",
    "type": "restaurant",
    "description": "Delicious Italian food",
    "address": "123 Main St, City",
    "phone": "+1-555-123-4567",
    "image": "1234567890filename.jpg",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Validation:**
- `name`: Required, string
- `type`: Required, must be "restaurant" or "butchers"
- `description`: Required, string
- `address`: Required, string
- `phone`: Required, string
- `image`: Optional, file upload

---

### Update Shop
**Endpoint:** `PUT /:id`

**Description:** Update shop details (Admin only)

**Headers:**
```
token: YOUR_JWT_TOKEN
Content-Type: multipart/form-data
```

**Parameters:**
- `id` (string): Shop ID

**Request Body:**
```json
{
  "name": "John's Italian Restaurant",
  "description": "Updated description",
  "address": "456 New St, City",
  "phone": "+1-555-987-6543",
  "image": <file>
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Shop updated successfully",
  "shop": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John's Italian Restaurant",
    "type": "restaurant",
    "description": "Updated description",
    "address": "456 New St, City",
    "phone": "+1-555-987-6543",
    "image": "1234567890newfilename.jpg",
    "isActive": true
  }
}
```

---

### Delete Shop
**Endpoint:** `DELETE /:id`

**Description:** Delete a shop (Admin only)

**Headers:**
```
token: YOUR_JWT_TOKEN
```

**Parameters:**
- `id` (string): Shop ID

**Response (Success):**
```json
{
  "success": true,
  "message": "Shop deleted successfully"
}
```

---

### Toggle Shop Status
**Endpoint:** `PATCH /toggle-status/:id`

**Description:** Activate or deactivate a shop (Admin only)

**Headers:**
```
token: YOUR_JWT_TOKEN
```

**Parameters:**
- `id` (string): Shop ID

**Response (Success):**
```json
{
  "success": true,
  "message": "Shop activated successfully",
  "shop": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John's Restaurant",
    "isActive": true
  }
}
```

---

## Public Endpoints

### List All Shops
**Endpoint:** `GET /list`

**Description:** Get all active shops (optional filter by type)

**Query Parameters:**
- `type` (optional): "restaurant" or "butchers"

**Examples:**
```
GET /list                    (get all active shops)
GET /list?type=restaurant    (get all active restaurants)
GET /list?type=butchers      (get all active butchers shops)
```

**Response (Success):**
```json
{
  "success": true,
  "totalShops": 2,
  "shops": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John's Restaurant",
      "type": "restaurant",
      "description": "Delicious Italian food",
      "address": "123 Main St, City",
      "phone": "+1-555-123-4567",
      "image": "1234567890filename.jpg",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Smith's Butchers",
      "type": "butchers",
      "description": "Fresh meat and cuts",
      "address": "456 Oak St, City",
      "phone": "+1-555-234-5678",
      "image": "1234567891filename.jpg",
      "isActive": true,
      "createdAt": "2024-01-15T11:00:00Z"
    }
  ]
}
```

---

### Get Shop by ID
**Endpoint:** `GET /:id`

**Description:** Get details of a specific shop

**Parameters:**
- `id` (string): Shop ID

**Example:**
```
GET /507f1f77bcf86cd799439011
```

**Response (Success):**
```json
{
  "success": true,
  "shop": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John's Restaurant",
    "type": "restaurant",
    "description": "Delicious Italian food",
    "address": "123 Main St, City",
    "phone": "+1-555-123-4567",
    "image": "1234567890filename.jpg",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## cURL Examples

### Create Shop (Admin)
```bash
curl -X POST http://localhost:4000/api/shop/create \
  -H "token: ADMIN_JWT_TOKEN" \
  -F "name=John's Restaurant" \
  -F "type=restaurant" \
  -F "description=Delicious Italian food" \
  -F "address=123 Main St, City" \
  -F "phone=+1-555-123-4567" \
  -F "image=@/path/to/image.jpg"
```

### Update Shop (Admin)
```bash
curl -X PUT http://localhost:4000/api/shop/507f1f77bcf86cd799439011 \
  -H "token: ADMIN_JWT_TOKEN" \
  -F "name=John's Italian Restaurant" \
  -F "description=Updated description"
```

### Delete Shop (Admin)
```bash
curl -X DELETE http://localhost:4000/api/shop/507f1f77bcf86cd799439011 \
  -H "token: ADMIN_JWT_TOKEN"
```

### Toggle Shop Status (Admin)
```bash
curl -X PATCH http://localhost:4000/api/shop/toggle-status/507f1f77bcf86cd799439011 \
  -H "token: ADMIN_JWT_TOKEN"
```

### List All Shops (Public)
```bash
curl http://localhost:4000/api/shop/list
```

### List Restaurants Only (Public)
```bash
curl http://localhost:4000/api/shop/list?type=restaurant
```

### Get Shop by ID (Public)
```bash
curl http://localhost:4000/api/shop/507f1f77bcf86cd799439011
```

---

## Public Endpoints

### Get User by ID
**Endpoint:** `GET /:id`

**Description:** Get user profile by user ID (public access)

**Parameters:**
- `id` (string): MongoDB user ID

**Example:**
```
GET /507f1f77bcf86cd799439011
```

**Response (Success):**
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@gmail.com",
    "role": "user",
    "cartData": {}
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "User not found"
}
```

---

## cURL Examples

### Register
```bash
curl -X POST http://localhost:4000/api/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@gmail.com",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:4000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@gmail.com",
    "password": "password123"
  }'
```

### Get Profile (Protected)
```bash
curl -X GET http://localhost:4000/api/user/profile \
  -H "token: YOUR_JWT_TOKEN"
```

### Update Profile (Protected)
```bash
curl -X PUT http://localhost:4000/api/user/profile \
  -H "token: YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Updated",
    "email": "john.new@gmail.com"
  }'
```

### Delete Account (Protected)
```bash
curl -X DELETE http://localhost:4000/api/user/profile \
  -H "token: YOUR_JWT_TOKEN"
```

### Get User by ID (Public)
```bash
curl http://localhost:4000/api/user/507f1f77bcf86cd799439011
```

### Get All Users (Admin Only)
```bash
curl -X GET http://localhost:4000/api/user/list/all \
  -H "token: ADMIN_JWT_TOKEN"
```

### Toggle User Account Status (Admin Only)
```bash
curl -X PATCH http://localhost:4000/api/user/toggle-status/507f1f77bcf86cd799439011 \
  -H "token: ADMIN_JWT_TOKEN"
```

---

## Error Codes

| Message | Cause |
|---------|-------|
| `User already exists` | Email already registered |
| `Please enter valid email` | Invalid email format |
| `Please enter strong password` | Password less than 8 characters |
| `Invalid Credentials` | Wrong email or password |
| `User not found` | User ID doesn't exist |
| `Email already in use` | Email taken by another user |
| `Not Authorized Login Again` | Missing or invalid token |
| `Error` | Server error |

---

## Notes

- All protected endpoints require a valid JWT token in the `token` header
- Passwords are hashed using bcrypt before storage
- User passwords are never returned in responses
- Cart data is stored with each user for shopping functionality

---

---

# Food Management API

## Base URL
`http://localhost:4000/api/food`

---

## Food Endpoints

### Add Food (Admin only)
**Endpoint:** `POST /add`

**Description:** Add a new food item to a shop (Admin only)

**Headers:**
```
token: YOUR_JWT_TOKEN
Content-Type: multipart/form-data
```

**Request Body:**
```json
{
  "name": "Pasta Carbonara",
  "description": "Creamy Italian pasta",
  "price": 12.99,
  "category": "Pasta",
  "shopId": "507f1f77bcf86cd799439011",
  "image": <file>
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Food Added"
}
```

---

### List All Foods
**Endpoint:** `GET /list`

**Description:** Get all food items from all shops (Public)

**Response (Success):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439021",
      "name": "Pasta Carbonara",
      "description": "Creamy Italian pasta",
      "price": 12.99,
      "category": "Pasta",
      "image": "1234567890image.jpg",
      "shopId": "507f1f77bcf86cd799439011"
    }
  ]
}
```

---

### Get Foods by Shop
**Endpoint:** `GET /shop/:shopId`

**Description:** Get all foods from a specific shop (Public)

**Parameters:**
- `shopId` (string): Shop ID

**Example:**
```
GET /shop/507f1f77bcf86cd799439011
```

**Response (Success):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439021",
      "name": "Pasta Carbonara",
      "description": "Creamy Italian pasta",
      "price": 12.99,
      "category": "Pasta",
      "image": "1234567890image.jpg",
      "shopId": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John's Restaurant",
        "type": "restaurant",
        "address": "123 Main St, City"
      }
    }
  ]
}
```

---

### Remove Food (Admin only)
**Endpoint:** `POST /remove`

**Description:** Delete a food item (Admin only)

**Headers:**
```
token: YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "id": "507f1f77bcf86cd799439021"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Food Removed"
}
```

---

## cURL Examples

### Add Food (Admin)
```bash
curl -X POST http://localhost:4000/api/food/add \
  -H "token: ADMIN_JWT_TOKEN" \
  -F "name=Pasta Carbonara" \
  -F "description=Creamy Italian pasta" \
  -F "price=12.99" \
  -F "category=Pasta" \
  -F "shopId=507f1f77bcf86cd799439011" \
  -F "image=@/path/to/image.jpg"
```

### List All Foods
```bash
curl http://localhost:4000/api/food/list
```

### Get Foods by Shop
```bash
curl http://localhost:4000/api/food/shop/507f1f77bcf86cd799439011
```

### Remove Food (Admin)
```bash
curl -X POST http://localhost:4000/api/food/remove \
  -H "token: ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id": "507f1f77bcf86cd799439021"}'
```

---

---

# Product Category API

## Base URL
`http://localhost:4000/api/category`

---

## Admin Only Endpoints (Requires JWT Token with Admin Role)

### Create Category
**Endpoint:** `POST /create`

**Description:** Create a new product category (Admin only)

**Headers:**
```
token: YOUR_JWT_TOKEN
Content-Type: multipart/form-data
```

**Request Body:**
```json
{
  "name": "Pasta",
  "description": "All types of pasta dishes",
  "image": <file>
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Category created successfully",
  "category": {
    "_id": "507f1f77bcf86cd799439031",
    "name": "Pasta",
    "description": "All types of pasta dishes",
    "image": "1234567890filename.jpg",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Validation:**
- `name`: Required, string, unique
- `description`: Required, string
- `image`: Optional, file upload

---

### Update Category
**Endpoint:** `PUT /:id`

**Description:** Update category details (Admin only)

**Headers:**
```
token: YOUR_JWT_TOKEN
Content-Type: multipart/form-data
```

**Parameters:**
- `id` (string): Category ID

**Request Body:**
```json
{
  "name": "Italian Pasta",
  "description": "Updated description",
  "image": <file>
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Category updated successfully",
  "category": {
    "_id": "507f1f77bcf86cd799439031",
    "name": "Italian Pasta",
    "description": "Updated description",
    "image": "1234567891filename.jpg",
    "isActive": true
  }
}
```

---

### Delete Category
**Endpoint:** `DELETE /:id`

**Description:** Delete a category (Admin only)

**Headers:**
```
token: YOUR_JWT_TOKEN
```

**Parameters:**
- `id` (string): Category ID

**Response (Success):**
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

---

### Toggle Category Status
**Endpoint:** `PATCH /toggle-status/:id`

**Description:** Activate or deactivate a category (Admin only)

**Headers:**
```
token: YOUR_JWT_TOKEN
```

**Parameters:**
- `id` (string): Category ID

**Response (Success):**
```json
{
  "success": true,
  "message": "Category activated successfully",
  "category": {
    "_id": "507f1f77bcf86cd799439031",
    "name": "Pasta",
    "isActive": true
  }
}
```

---

## Public Endpoints

### List All Categories
**Endpoint:** `GET /list`

**Description:** Get all active categories (Public)

**Response (Success):**
```json
{
  "success": true,
  "totalCategories": 3,
  "categories": [
    {
      "_id": "507f1f77bcf86cd799439031",
      "name": "Pasta",
      "description": "All types of pasta dishes",
      "image": "1234567890filename.jpg",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z"
    },
    {
      "_id": "507f1f77bcf86cd799439032",
      "name": "Burgers",
      "description": "Delicious burgers",
      "image": "1234567891filename.jpg",
      "isActive": true,
      "createdAt": "2024-01-15T11:00:00Z"
    }
  ]
}
```

---

### Get Category by ID
**Endpoint:** `GET /:id`

**Description:** Get details of a specific category (Public)

**Parameters:**
- `id` (string): Category ID

**Example:**
```
GET /507f1f77bcf86cd799439031
```

**Response (Success):**
```json
{
  "success": true,
  "category": {
    "_id": "507f1f77bcf86cd799439031",
    "name": "Pasta",
    "description": "All types of pasta dishes",
    "image": "1234567890filename.jpg",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## cURL Examples

### Create Category (Admin)
```bash
curl -X POST http://localhost:4000/api/category/create \
  -H "token: ADMIN_JWT_TOKEN" \
  -F "name=Pasta" \
  -F "description=All types of pasta dishes" \
  -F "image=@/path/to/image.jpg"
```

### Update Category (Admin)
```bash
curl -X PUT http://localhost:4000/api/category/507f1f77bcf86cd799439031 \
  -H "token: ADMIN_JWT_TOKEN" \
  -F "name=Italian Pasta" \
  -F "description=Updated description"
```

### Delete Category (Admin)
```bash
curl -X DELETE http://localhost:4000/api/category/507f1f77bcf86cd799439031 \
  -H "token: ADMIN_JWT_TOKEN"
```

### Toggle Category Status (Admin)
```bash
curl -X PATCH http://localhost:4000/api/category/toggle-status/507f1f77bcf86cd799439031 \
  -H "token: ADMIN_JWT_TOKEN"
```

### List All Categories (Public)
```bash
curl http://localhost:4000/api/category/list
```

### Get Category by ID (Public)
```bash
curl http://localhost:4000/api/category/507f1f77bcf86cd799439031
```

---

---

# Real-Time Location Tracking API

## Base URL
`http://localhost:4000/api/location`

## WebSocket Connection
`ws://backend.rani-jay.com` (Socket.io)

---

## Overview

The location tracking system provides real-time tracking of delivery personnel with:
- **WebSocket Support** for real-time location updates every 3 seconds
- **Auto-matching** to assign closest delivery person to orders
- **Persistent History** stored forever in database
- **Role-based Access Control** (Admin sees all, customers see assigned delivery person)

---

## REST Endpoints

### Update Location
**Endpoint:** `POST /update`

**Description:** Update user's current location (sends every 3 seconds)

**Headers:**
```
token: YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "accuracy": 10
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Location updated",
  "location": {
    "_id": "507f1f77bcf86cd799439041",
    "userId": "507f1f77bcf86cd799439011",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "accuracy": 10,
    "isActive": true,
    "lastUpdated": "2024-01-15T10:30:00Z"
  }
}
```

---

### Get User Location
**Endpoint:** `GET /user/:targetUserId`

**Description:** Get current location of a user (Admin can see all, users can see own)

**Headers:**
```
token: YOUR_JWT_TOKEN
```

**Parameters:**
- `targetUserId` (string): User ID

**Response (Success):**
```json
{
  "success": true,
  "location": {
    "_id": "507f1f77bcf86cd799439041",
    "userId": "507f1f77bcf86cd799439011",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "accuracy": 10,
    "isActive": true,
    "lastUpdated": "2024-01-15T10:30:00Z"
  }
}
```

---

### Get All Active Delivery Locations
**Endpoint:** `GET /delivery/active/list`

**Description:** Get all active delivery people locations (Admin only)

**Headers:**
```
token: ADMIN_JWT_TOKEN
```

**Response (Success):**
```json
{
  "success": true,
  "totalDelivery": 5,
  "locations": [
    {
      "_id": "507f1f77bcf86cd799439041",
      "userId": "507f1f77bcf86cd799439020",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "accuracy": 10,
      "isActive": true,
      "lastUpdated": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### Auto-Match Delivery Person to Order
**Endpoint:** `POST /match/:orderId`

**Description:** Automatically assign closest delivery person to order (Admin only)

**Headers:**
```
token: ADMIN_JWT_TOKEN
Content-Type: application/json
```

**Parameters:**
- `orderId` (string): Order ID

**Response (Success):**
```json
{
  "success": true,
  "message": "Order assigned to closest delivery person",
  "distance": "2.50 km",
  "order": {
    "_id": "507f1f77bcf86cd799439050",
    "userId": "507f1f77bcf86cd799439011",
    "assignedDeliveryPerson": "507f1f77bcf86cd799439020",
    "assignedAt": "2024-01-15T10:30:00Z",
    "deliveryLocation": {
      "latitude": 40.7128,
      "longitude": -74.0060
    }
  }
}
```

---

### Get Assigned Delivery Person Location (Customer)
**Endpoint:** `GET /order/:orderId`

**Description:** Get current location of delivery person assigned to order

**Headers:**
```
token: YOUR_JWT_TOKEN
```

**Parameters:**
- `orderId` (string): Order ID

**Response (Success):**
```json
{
  "success": true,
  "deliveryPerson": "507f1f77bcf86cd799439020",
  "location": {
    "_id": "507f1f77bcf86cd799439041",
    "userId": "507f1f77bcf86cd799439020",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "accuracy": 10,
    "lastUpdated": "2024-01-15T10:30:00Z"
  }
}
```

---

### Get Location History (Admin)
**Endpoint:** `GET /history/:targetUserId?days=30`

**Description:** Get location history for a user (Admin only)

**Headers:**
```
token: ADMIN_JWT_TOKEN
```

**Parameters:**
- `targetUserId` (string): User ID
- `days` (optional): Number of days to retrieve (default: 30)

**Response (Success):**
```json
{
  "success": true,
  "totalRecords": 500,
  "days": 30,
  "history": [
    {
      "_id": "507f1f77bcf86cd799439051",
      "userId": "507f1f77bcf86cd799439020",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "accuracy": 10,
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### Get Order Location History
**Endpoint:** `GET /order-history/:orderId`

**Description:** Get all location updates during delivery of an order

**Headers:**
```
token: YOUR_JWT_TOKEN
```

**Parameters:**
- `orderId` (string): Order ID

**Response (Success):**
```json
{
  "success": true,
  "totalRecords": 50,
  "history": [
    {
      "_id": "507f1f77bcf86cd799439051",
      "userId": "507f1f77bcf86cd799439020",
      "orderId": "507f1f77bcf86cd799439050",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "accuracy": 10,
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### Toggle Location Sharing
**Endpoint:** `PATCH /sharing/toggle`

**Description:** Enable/disable location sharing for current user

**Headers:**
```
token: YOUR_JWT_TOKEN
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Location sharing enabled",
  "location": {
    "_id": "507f1f77bcf86cd799439041",
    "userId": "507f1f77bcf86cd799439011",
    "isActive": true
  }
}
```

---

## WebSocket Events

### Client to Server

#### 1. Join Tracking
```javascript
socket.emit('join-tracking', userId);
```
User joins their own location tracking channel

#### 2. Join Order Tracking
```javascript
socket.emit('join-order-tracking', orderId);
```
User joins an order's delivery tracking

#### 3. Update Location (Every 3 seconds)
```javascript
socket.emit('update-location', {
  userId: '507f1f77bcf86cd799439011',
  latitude: 40.7128,
  longitude: -74.0060,
  accuracy: 10
});
```

#### 4. Get Active Deliveries
```javascript
socket.emit('get-active-deliveries', (response) => {
  console.log(response.deliveries);
});
```

#### 5. Subscribe to Order
```javascript
socket.emit('SUBSCRIBE_ORDER', {
  orderId: '507f1f77bcf86cd799439050',
  userId: '507f1f77bcf86cd799439011'
});
```
Customer subscribes to real-time updates for a delivery order

#### 6. Accept Order
```javascript
socket.emit('ACCEPT_ORDER', {
  orderId: '507f1f77bcf86cd799439050',
  userId: '507f1f77bcf86cd799439020'
});
```
Delivery person accepts an assigned order

#### 7. Start Delivery
```javascript
socket.emit('START_DELIVERY', {
  orderId: '507f1f77bcf86cd799439050',
  userId: '507f1f77bcf86cd799439020'
});
```
Delivery person starts delivering the order

#### 8. Complete Delivery
```javascript
socket.emit('COMPLETE_DELIVERY', {
  orderId: '507f1f77bcf86cd799439050',
  userId: '507f1f77bcf86cd799439020'
});
```
Delivery person completes the delivery

### Server to Client

#### 1. Current Location
```javascript
socket.on('current-location', (location) => {
  console.log('Current location:', location);
  // {
  //   "_id": "...",
  //   "userId": "507f1f77bcf86cd799439020",
  //   "latitude": 40.7128,
  //   "longitude": -74.0060,
  //   "accuracy": 10,
  //   "isActive": true,
  //   "lastUpdated": "2024-01-15T10:30:00Z"
  // }
});
```

#### 2. Location Updated
```javascript
socket.on('location-updated', (location) => {
  console.log('Location updated:', location);
});
```

#### 3. Delivery Location Updated
```javascript
socket.on('delivery-location-updated', (data) => {
  console.log('Delivery location:', data);
  // {
  //   "location": {...},
  //   "orderId": "507f1f77bcf86cd799439050",
  //   "deliveryPerson": "507f1f77bcf86cd799439020"
  // }
});
```

#### 4. Order Details
```javascript
socket.on('order-details', (data) => {
  console.log('Order details:', data);
  // {
  //   "orderId": "507f1f77bcf86cd799439050",
  //   "status": "Food Processing",
  //   "assignedDeliveryPerson": "507f1f77bcf86cd799439020",
  //   "estimatedDeliveryTime": 30
  // }
});
```

#### 5. Order Accepted
```javascript
socket.on('order-accepted', (data) => {
  console.log('Order accepted:', data);
  // {
  //   "orderId": "507f1f77bcf86cd799439050",
  //   "acceptedAt": "2024-01-15T10:35:00Z",
  //   "deliveryPerson": "507f1f77bcf86cd799439020"
  // }
});
```

#### 6. Delivery Started
```javascript
socket.on('delivery-started', (data) => {
  console.log('Delivery started:', data);
  // {
  //   "orderId": "507f1f77bcf86cd799439050",
  //   "startedAt": "2024-01-15T10:40:00Z",
  //   "deliveryPerson": "507f1f77bcf86cd799439020"
  // }
});
```

#### 7. Delivery Completed
```javascript
socket.on('delivery-completed', (data) => {
  console.log('Delivery completed:', data);
  // {
  //   "orderId": "507f1f77bcf86cd799439050",
  //   "deliveredAt": "2024-01-15T10:50:00Z",
  //   "deliveryPerson": "507f1f77bcf86cd799439020"
  // }
});
```

#### 8. Error Event
```javascript
socket.on('error', (error) => {
  console.log('WebSocket error:', error);
  // { "message": "Error description" }
});
```

---

## WebSocket Implementation Flow

### Customer Tracking Delivery
```
1. Customer places order (POST /api/order/place)
2. Admin assigns delivery person (POST /api/location/match/:orderId)
3. Delivery person connects WebSocket (socket.io connection)
4. Delivery person joins location tracking (emit 'join-tracking')
5. Delivery person accepts order (emit 'ACCEPT_ORDER')
6. Delivery person starts delivery (emit 'START_DELIVERY')
7. Delivery person sends location every 3 seconds (emit 'LOCATION_UPDATE')
8. Customer subscribes to order (emit 'SUBSCRIBE_ORDER')
9. Customer receives delivery location updates in real-time
10. Delivery person completes delivery (emit 'COMPLETE_DELIVERY')
11. Customer receives delivery completion notification
```

### Delivery Person Accepting Order
```
1. Admin or system assigns order to delivery person
2. Delivery person receives order push notification
3. Delivery person connects WebSocket
4. Delivery person emits 'ACCEPT_ORDER' with orderId
5. System updates order with acceptedAt timestamp
6. All subscribers of order receive 'order-accepted' event
7. Delivery person enables GPS and starts sending LOCATION_UPDATE
```

---

## Message Types Summary

| Message Type | Direction | Role | Purpose |
|---|---|---|---|
| LOCATION_UPDATE | Client → Server | Delivery Person | Send GPS coordinates every 3 seconds |
| SUBSCRIBE_ORDER | Client → Server | Customer/Admin | Subscribe to order delivery updates |
| ACCEPT_ORDER | Client → Server | Delivery Person | Accept assigned order |
| START_DELIVERY | Client → Server | Delivery Person | Begin delivery to customer |
| COMPLETE_DELIVERY | Client → Server | Delivery Person | Complete delivery |
| location-updated | Server → Client | All | Current location updated |
| delivery-location-updated | Server → Client | Subscribers | Delivery person location changed |
| order-details | Server → Client | Subscriber | Order information |
| order-accepted | Server → Client | Subscribers | Order accepted by delivery person |
| delivery-started | Server → Client | Subscribers | Delivery started |
| delivery-completed | Server → Client | Subscribers | Delivery completed |
| error | Server → Client | All | Error message |

#### 3. Delivery Location Updated (Order Tracking)
```javascript
socket.on('delivery-location-updated', (data) => {
  console.log('Delivery person moved to:', data.location);
});
```

#### 4. Error
```javascript
socket.on('error', (error) => {
  console.log('Error:', error.message);
});
```

---

## cURL Examples

### Update Location
```bash
curl -X POST http://localhost:4000/api/location/update \
  -H "token: YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 40.7128,
    "longitude": -74.0060,
    "accuracy": 10
  }'
```

### Get User Location
```bash
curl -X GET http://localhost:4000/api/location/user/507f1f77bcf86cd799439011 \
  -H "token: YOUR_JWT_TOKEN"
```

### Get All Active Delivery Locations (Admin)
```bash
curl -X GET http://localhost:4000/api/location/delivery/active/list \
  -H "token: ADMIN_JWT_TOKEN"
```

### Auto-Match Delivery (Admin)
```bash
curl -X POST http://localhost:4000/api/location/match/507f1f77bcf86cd799439050 \
  -H "token: ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Get Order Delivery Location (Customer)
```bash
curl -X GET http://localhost:4000/api/location/order/507f1f77bcf86cd799439050 \
  -H "token: YOUR_JWT_TOKEN"
```

### Get Location History (Admin)
```bash
curl -X GET "http://localhost:4000/api/location/history/507f1f77bcf86cd799439020?days=7" \
  -H "token: ADMIN_JWT_TOKEN"
```

### Get Order Location History (Customer/Admin)
```bash
curl -X GET http://localhost:4000/api/location/order-history/507f1f77bcf86cd799439050 \
  -H "token: YOUR_JWT_TOKEN"
```

### Toggle Location Sharing
```bash
curl -X PATCH http://localhost:4000/api/location/sharing/toggle \
  -H "token: YOUR_JWT_TOKEN"
```

---

## JavaScript WebSocket Client Example

```javascript
// Connect to WebSocket
const socket = io('http://localhost:4000');

// Join tracking
socket.emit('join-tracking', userId);

// Listen for current location
socket.on('current-location', (location) => {
  console.log('Your current location:', location);
});

// Send location update every 3 seconds
setInterval(() => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      socket.emit('update-location', {
        userId: userId,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      });
    });
  }
}, 3000);

// Listen for location updates
socket.on('location-updated', (location) => {
  console.log('Location updated:', location);
});

// For order tracking
socket.emit('join-order-tracking', orderId);

socket.on('delivery-location-updated', (data) => {
  console.log('Delivery person current location:', data.location);
  updateMapView(data.location);
});

// Handle disconnection
socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
```

---

## Order Model Updates

The Order model now includes:
- `assignedDeliveryPerson`: Reference to delivery person (auto-assigned)
- `pickupLocation`: { latitude, longitude } - Shop location
- `deliveryLocation`: { latitude, longitude } - Customer location
- `assignedAt`: Timestamp when delivery person was assigned

---

## Key Features

1. **WebSocket Real-time Updates** - Location updates broadcast every 3 seconds
2. **Auto-matching Algorithm** - Uses Haversine formula to find closest delivery person
3. **Persistent History** - All location data stored forever in locationHistory collection
4. **Role-based Access** - Admins see all locations, customers see assigned delivery person only
5. **Location Sharing Control** - Users can toggle their location sharing on/off
6. **In-memory Cache** - Active locations cached for fast access via Socket.io
