# User CRUD API Documentation

## Base URL
`https://backend.rani-jay.com/api/user`

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
    "phone": "+1-555-123-4567",
    "cartData": {},
    "addresses": [
      {
        "_id": "507f1f77bcf86cd799439101",
        "label": "Home",
        "street": "123 Main Street",
        "city": "New York",
        "zipCode": "10001",
        "phone": "+1-555-123-4567",
        "isDefault": true,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ]
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
    "phone": "+1-555-123-4567",
    "cartData": {},
    "addresses": []
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
      "phone": "+1-555-123-4567",
      "cartData": {},
      "addresses": []
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Admin User",
      "email": "admin@gmail.com",
      "role": "admin",
      "phone": "+1-555-234-5678",
      "cartData": {},
      "addresses": []
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
    "phone": "+1-555-123-4567",
    "isActive": true,
    "cartData": {},
    "addresses": []
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
    "phone": "+1-555-123-4567",
    "isActive": false,
    "cartData": {},
    "addresses": []
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

### Get User by ID (Public)
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
    "cartData": {},
    "addresses": []
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

## Address Management Endpoints (Protected)

### Add Delivery Address
**Endpoint:** `POST /address/add`

**Description:** Add a new delivery address for the user

**Headers:**
```
token: YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "label": "Home",
  "street": "123 Main Street",
  "city": "New York",
  "zipCode": "10001",
  "phone": "+1-555-123-4567"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Address added successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@gmail.com",
    "addresses": [
      {
        "_id": "507f1f77bcf86cd799439101",
        "label": "Home",
        "street": "123 Main Street",
        "city": "New York",
        "zipCode": "10001",
        "phone": "+1-555-123-4567",
        "isDefault": true,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "All address fields are required"
}
```

**Validation:**
- `label`: Required, string
- `street`: Required, string
- `city`: Required, string
- `zipCode`: Required, string
- `phone`: Required, string
- First address is automatically set as default

---

### Update Delivery Address
**Endpoint:** `PUT /address/:addressId`

**Description:** Update an existing delivery address

**Headers:**
```
token: YOUR_JWT_TOKEN
Content-Type: application/json
```

**Parameters:**
- `addressId` (string): Address ID

**Request Body:**
```json
{
  "label": "Work",
  "street": "456 Office Avenue",
  "city": "New York",
  "zipCode": "10002",
  "phone": "+1-555-987-6543",
  "isDefault": true
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Address updated successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "addresses": [
      {
        "_id": "507f1f77bcf86cd799439101",
        "label": "Work",
        "street": "456 Office Avenue",
        "city": "New York",
        "zipCode": "10002",
        "phone": "+1-555-987-6543",
        "isDefault": true,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

**Response (Error - Address Not Found):**
```json
{
  "success": false,
  "message": "Address not found"
}
```

**Notes:**
- All fields are optional; only provided fields are updated
- Setting `isDefault: true` will unset other addresses as default
- Cannot unset default if it's the only address

---

### Delete Delivery Address
**Endpoint:** `DELETE /address/:addressId`

**Description:** Delete a delivery address

**Headers:**
```
token: YOUR_JWT_TOKEN
```

**Parameters:**
- `addressId` (string): Address ID

**Example:**
```
DELETE /address/507f1f77bcf86cd799439101
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Address deleted successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "addresses": []
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Address not found"
}
```

**Notes:**
- If the deleted address was default and other addresses exist, the first address becomes default
- If it's the only address, no default is set

---

## cURL Examples

### Register
```bash
curl -X POST https://backend.rani-jay.com/api/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@gmail.com",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST https://backend.rani-jay.com/api/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@gmail.com",
    "password": "password123"
  }'
```

### Get Profile (Protected)
```bash
curl -X GET https://backend.rani-jay.com/api/user/profile \
  -H "token: YOUR_JWT_TOKEN"
```

### Update Profile (Protected)
```bash
curl -X PUT https://backend.rani-jay.com/api/user/profile \
  -H "token: YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Updated",
    "email": "john.new@gmail.com"
  }'
```

### Delete Account (Protected)
```bash
curl -X DELETE https://backend.rani-jay.com/api/user/profile \
  -H "token: YOUR_JWT_TOKEN"
```

### Get User by ID (Public)
```bash
curl https://backend.rani-jay.com/api/user/507f1f77bcf86cd799439011
```

### Get All Users (Admin Only)
```bash
curl -X GET https://backend.rani-jay.com/api/user/list/all \
  -H "token: ADMIN_JWT_TOKEN"
```

### Toggle User Account Status (Admin Only)
```bash
curl -X PATCH https://backend.rani-jay.com/api/user/toggle-status/507f1f77bcf86cd799439011 \
  -H "token: ADMIN_JWT_TOKEN"
```

### Add Delivery Address
```bash
curl -X POST https://backend.rani-jay.com/api/user/address/add \
  -H "token: YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Home",
    "street": "123 Main Street",
    "city": "New York",
    "zipCode": "10001",
    "phone": "+1-555-123-4567"
  }'
```

### Update Delivery Address
```bash
curl -X PUT https://backend.rani-jay.com/api/user/address/507f1f77bcf86cd799439101 \
  -H "token: YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Work",
    "street": "456 Office Avenue",
    "isDefault": true
  }'
```

### Delete Delivery Address
```bash
curl -X DELETE https://backend.rani-jay.com/api/user/address/507f1f77bcf86cd799439101 \
  -H "token: YOUR_JWT_TOKEN"
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

# Shop Management API

## Base URL
`https://backend.rani-jay.com/api/shop`

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

**Description:** Get all active shops with optional filters (Public)

**Query Parameters:**
- `type` (optional): "restaurant" or "butchers"
- `search` (optional): Search keyword to filter by name, description, or address (case-insensitive)

**Examples:**
```
GET /list                              (get all active shops)
GET /list?type=restaurant              (get all active restaurants)
GET /list?type=butchers                (get all active butchers shops)
GET /list?search=italian               (get shops matching "italian")
GET /list?type=restaurant&search=pizza (get restaurants matching "pizza")
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
curl -X POST https://backend.rani-jay.com/api/shop/create \
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
curl -X PUT https://backend.rani-jay.com/api/shop/507f1f77bcf86cd799439011 \
  -H "token: ADMIN_JWT_TOKEN" \
  -F "name=John's Italian Restaurant" \
  -F "description=Updated description"
```

### Delete Shop (Admin)
```bash
curl -X DELETE https://backend.rani-jay.com/api/shop/507f1f77bcf86cd799439011 \
  -H "token: ADMIN_JWT_TOKEN"
```

### Toggle Shop Status (Admin)
```bash
curl -X PATCH https://backend.rani-jay.com/api/shop/toggle-status/507f1f77bcf86cd799439011 \
  -H "token: ADMIN_JWT_TOKEN"
```

### List All Shops (Public)
```bash
curl https://backend.rani-jay.com/api/shop/list
```

### List Restaurants Only (Public)
```bash
curl https://backend.rani-jay.com/api/shop/list?type=restaurant
```

### Search Shops (Public)
```bash
curl https://backend.rani-jay.com/api/shop/list?search=italian
```

### Search Restaurants with Keyword (Public)
```bash
curl "https://backend.rani-jay.com/api/shop/list?type=restaurant&search=pizza"
```

### Get Shop by ID (Public)
```bash
curl https://backend.rani-jay.com/api/shop/507f1f77bcf86cd799439011
```

---

---

# Food Management API

## Base URL
`https://backend.rani-jay.com/api/food`

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

**Description:** Get all food items from all shops with optional search (Public)

**Query Parameters:**
- `search` (optional): Search keyword to filter by name, description, or category (case-insensitive)

**Examples:**
```
GET /list                  (get all foods)
GET /list?search=pasta     (get all foods matching "pasta")
GET /list?search=chicken   (get all foods matching "chicken")
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
      "shopId": "507f1f77bcf86cd799439011"
    }
  ]
}
```

---

### Get Food by ID
**Endpoint:** `GET /:id`

**Description:** Get details of a specific food item (Public)

**Parameters:**
- `id` (string): Food ID

**Example:**
```
GET /507f1f77bcf86cd799439021
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
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
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Food not found"
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
curl -X POST https://backend.rani-jay.com/api/food/add \
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
curl https://backend.rani-jay.com/api/food/list
```

### Search Foods
```bash
curl "https://backend.rani-jay.com/api/food/list?search=pasta"
```

### Get Food by ID
```bash
curl https://backend.rani-jay.com/api/food/507f1f77bcf86cd799439021
```

### Get Foods by Shop
```bash
curl https://backend.rani-jay.com/api/food/shop/507f1f77bcf86cd799439011
```

### Remove Food (Admin)
```bash
curl -X POST https://backend.rani-jay.com/api/food/remove \
  -H "token: ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id": "507f1f77bcf86cd799439021"}'
```

---

---

# Product Category API

## Base URL
`https://backend.rani-jay.com/api/category`

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
curl -X POST https://backend.rani-jay.com/api/category/create \
  -H "token: ADMIN_JWT_TOKEN" \
  -F "name=Pasta" \
  -F "description=All types of pasta dishes" \
  -F "image=@/path/to/image.jpg"
```

### Update Category (Admin)
```bash
curl -X PUT https://backend.rani-jay.com/api/category/507f1f77bcf86cd799439031 \
  -H "token: ADMIN_JWT_TOKEN" \
  -F "name=Italian Pasta" \
  -F "description=Updated description"
```

### Delete Category (Admin)
```bash
curl -X DELETE https://backend.rani-jay.com/api/category/507f1f77bcf86cd799439031 \
  -H "token: ADMIN_JWT_TOKEN"
```

### Toggle Category Status (Admin)
```bash
curl -X PATCH https://backend.rani-jay.com/api/category/toggle-status/507f1f77bcf86cd799439031 \
  -H "token: ADMIN_JWT_TOKEN"
```

### List All Categories (Public)
```bash
curl https://backend.rani-jay.com/api/category/list
```

### Get Category by ID (Public)
```bash
curl https://backend.rani-jay.com/api/category/507f1f77bcf86cd799439031
```

---

---

# Shopping Cart API

## Base URL
`https://backend.rani-jay.com/api/cart`

---

## Protected Endpoints (Requires JWT Token)

### Add Item to Cart
**Endpoint:** `POST /add`

**Description:** Add a food item to user's cart with optional notes

**Headers:**
```
token: YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "itemId": "507f1f77bcf86cd799439021",
  "notes": "Extra cheese, no onions"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Added to Cart"
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "User not found"
}
```

**Notes:**
- If item already exists in cart, quantity is incremented
- Notes are optional and can be used for special instructions
- Cart data is normalized to new format automatically

---

### Remove Item from Cart
**Endpoint:** `POST /remove`

**Description:** Remove or decrement an item from user's cart

**Headers:**
```
token: YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "itemId": "507f1f77bcf86cd799439021"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Removed from Cart"
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "User not found"
}
```

**Notes:**
- If quantity is greater than 1, quantity is decremented by 1
- If quantity is 1, item is completely removed from cart
- Returns success even if item doesn't exist in cart

---

### Get User Cart
**Endpoint:** `POST /get`

**Description:** Retrieve current user's shopping cart

**Headers:**
```
token: YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011"
}
```

**Response (Success):**
```json
{
  "success": true,
  "cartData": {
    "507f1f77bcf86cd799439021": {
      "quantity": 2,
      "notes": "Extra cheese, no onions"
    },
    "507f1f77bcf86cd799439022": {
      "quantity": 1,
      "notes": ""
    }
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

**Notes:**
- Cart data is automatically normalized to new format
- Each item contains quantity and notes
- Empty cart returns empty object

---

## cURL Examples

### Add Item to Cart
```bash
curl -X POST https://backend.rani-jay.com/api/cart/add \
  -H "token: YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439011",
    "itemId": "507f1f77bcf86cd799439021",
    "notes": "Extra cheese, no onions"
  }'
```

### Remove Item from Cart
```bash
curl -X POST https://backend.rani-jay.com/api/cart/remove \
  -H "token: YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439011",
    "itemId": "507f1f77bcf86cd799439021"
  }'
```

### Get Cart
```bash
curl -X POST https://backend.rani-jay.com/api/cart/get \
  -H "token: YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": "507f1f77bcf86cd799439011"}'
```

---

---

# Order Management API

## Base URL
`https://backend.rani-jay.com/api/order`

---

## Customer Endpoints (Requires JWT Token)

### Place Order
**Endpoint:** `POST /place`

**Description:** Create a new order from cart items

**Headers:**
```
token: YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "items": [
    {
      "itemId": "507f1f77bcf86cd799439021",
      "name": "Pasta Carbonara",
      "price": 12.99,
      "quantity": 2,
      "notes": "Extra cheese"
    }
  ],
  "amount": 25.98,
  "address": "123 Main St, City",
  "deliveryLocation": {
    "latitude": 40.7128,
    "longitude": -74.0060
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Order placed successfully. Please pay on delivery.",
  "orderId": "507f1f77bcf86cd799439050"
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Cart is empty"
}
```

**Validation:**
- `userId`: Required
- `items`: Required, must not be empty
- `address`: Required
- `amount`: Required, numeric
- `deliveryLocation`: Optional (latitude and longitude)

---

### Get User Orders
**Endpoint:** `POST /userorders`

**Description:** Get all orders for current user

**Headers:**
```
token: YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439050",
      "userId": "507f1f77bcf86cd799439011",
      "items": [
        {
          "itemId": "507f1f77bcf86cd799439021",
          "name": "Pasta Carbonara",
          "price": 12.99,
          "quantity": 2,
          "notes": "Extra cheese"
        }
      ],
      "amount": 25.98,
      "address": "123 Main St, City",
      "status": "Pending",
      "payment": true,
      "assignedDeliveryPerson": "507f1f77bcf86cd799439020",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### Get Order Details
**Endpoint:** `GET /:orderId`

**Description:** Get details of a specific order (Customer, Delivery Person, or Admin can access)

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
  "order": {
    "_id": "507f1f77bcf86cd799439050",
    "userId": "507f1f77bcf86cd799439011",
    "items": [...],
    "amount": 25.98,
    "address": "123 Main St, City",
    "status": "Accepted",
    "payment": true,
    "assignedDeliveryPerson": "507f1f77bcf86cd799439020",
    "customerName": "John Doe",
    "customerEmail": "john@gmail.com",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Unauthorized access to order"
}
```

---

## Admin Endpoints (Requires JWT Token with Admin Role)

### List All Orders
**Endpoint:** `GET /list`

**Description:** Get all orders in the system (Admin only)

**Headers:**
```
token: ADMIN_JWT_TOKEN
```

**Response (Success):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439050",
      "userId": "507f1f77bcf86cd799439011",
      "items": [...],
      "amount": 25.98,
      "address": "123 Main St, City",
      "status": "Pending",
      "payment": true,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### Update Order Status
**Endpoint:** `POST /status`

**Description:** Update the status of an order (Admin only)

**Headers:**
```
token: ADMIN_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439012",
  "orderId": "507f1f77bcf86cd799439050",
  "status": "Pending"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Status Updated Successfully"
}
```

**Valid Status Values:**
- `Pending` - Order placed, awaiting assignment
- `Accepted` - Assigned to delivery person
- `Delivered` - Order delivered to customer
- `Cancelled` - Order cancelled

---

## Delivery Person Endpoints (Requires JWT Token with Delivery Role)

### Get Available Orders
**Endpoint:** `GET /available`

**Description:** Get all available orders not yet assigned to any delivery person

**Headers:**
```
token: YOUR_JWT_TOKEN
```

**Response (Success):**
```json
{
  "success": true,
  "totalOrders": 5,
  "orders": [
    {
      "_id": "507f1f77bcf86cd799439050",
      "userId": "507f1f77bcf86cd799439011",
      "items": [...],
      "amount": 25.98,
      "address": "123 Main St, City",
      "status": "Pending",
      "payment": true
    }
  ]
}
```

---

### Get Nearest Orders
**Endpoint:** `GET /nearest?latitude=40.7128&longitude=-74.0060`

**Description:** Get available orders sorted by distance from delivery person's location

**Headers:**
```
token: YOUR_JWT_TOKEN
```

**Query Parameters:**
- `latitude` (required): Current latitude
- `longitude` (required): Current longitude

**Response (Success):**
```json
{
  "success": true,
  "totalOrders": 5,
  "orders": [
    {
      "_id": "507f1f77bcf86cd799439050",
      "userId": "507f1f77bcf86cd799439011",
      "items": [...],
      "amount": 25.98,
      "address": "123 Main St, City",
      "status": "Pending",
      "distance": 2.5,
      "deliveryLocation": {
        "latitude": 40.7150,
        "longitude": -74.0050
      }
    }
  ]
}
```

**Notes:**
- Orders are filtered to 50km radius
- Returns up to 20 closest orders
- Orders without delivery location are shown after distance-sorted orders
- Distance is null for orders without location data

---

### Get Pending Orders
**Endpoint:** `GET /pending`

**Description:** Get all pending orders (not yet delivered or cancelled)

**Headers:**
```
token: YOUR_JWT_TOKEN
```

**Response (Success):**
```json
{
  "success": true,
  "totalOrders": 3,
  "orders": [
    {
      "_id": "507f1f77bcf86cd799439050",
      "userId": "507f1f77bcf86cd799439011",
      "items": [...],
      "amount": 25.98,
      "status": "Pending"
    }
  ]
}
```

---

### Accept Order
**Endpoint:** `POST /accept`

**Description:** Accept an order for delivery

**Headers:**
```
token: YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439020",
  "orderId": "507f1f77bcf86cd799439050"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Order accepted successfully",
  "order": {
    "_id": "507f1f77bcf86cd799439050",
    "userId": "507f1f77bcf86cd799439011",
    "items": [...],
    "amount": 25.98,
    "status": "Accepted",
    "assignedDeliveryPerson": "507f1f77bcf86cd799439020",
    "assignedAt": "2024-01-15T10:35:00Z"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Order has already been assigned to another delivery person"
}
```

---

### Mark Order as Delivered
**Endpoint:** `POST /delivered`

**Description:** Mark an accepted order as delivered

**Headers:**
```
token: YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439020",
  "orderId": "507f1f77bcf86cd799439050"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Order marked as delivered",
  "order": {
    "_id": "507f1f77bcf86cd799439050",
    "userId": "507f1f77bcf86cd799439011",
    "items": [...],
    "status": "Delivered",
    "deliveredAt": "2024-01-15T10:50:00Z"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "You are not assigned to this order"
}
```

---

## Payment Endpoints

### Verify Order Payment
**Endpoint:** `POST /verify`

**Description:** Verify payment for an order (typically called by payment gateway)

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "orderId": "507f1f77bcf86cd799439050",
  "success": "true"
}
```

**Response (Success - Payment Confirmed):**
```json
{
  "success": true,
  "message": "Paid"
}
```

**Response (Failed Payment):**
```json
{
  "success": false,
  "message": "Not Paid"
}
```

**Notes:**
- When success is "true", order is marked as paid
- When success is not "true", order is deleted
- This endpoint is used for payment gateway integration

---

## cURL Examples

### Place Order
```bash
curl -X POST https://backend.rani-jay.com/api/order/place \
  -H "token: YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439011",
    "items": [
      {
        "itemId": "507f1f77bcf86cd799439021",
        "name": "Pasta Carbonara",
        "price": 12.99,
        "quantity": 2,
        "notes": "Extra cheese"
      }
    ],
    "amount": 25.98,
    "address": "123 Main St, City",
    "deliveryLocation": {
      "latitude": 40.7128,
      "longitude": -74.0060
    }
  }'
```

### Get User Orders
```bash
curl -X POST https://backend.rani-jay.com/api/order/userorders \
  -H "token: YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": "507f1f77bcf86cd799439011"}'
```

### Get Order Details
```bash
curl -X GET https://backend.rani-jay.com/api/order/507f1f77bcf86cd799439050 \
  -H "token: YOUR_JWT_TOKEN"
```

### List All Orders (Admin)
```bash
curl -X GET https://backend.rani-jay.com/api/order/list \
  -H "token: ADMIN_JWT_TOKEN"
```

### Update Order Status (Admin)
```bash
curl -X POST https://backend.rani-jay.com/api/order/status \
  -H "token: ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439012",
    "orderId": "507f1f77bcf86cd799439050",
    "status": "Pending"
  }'
```

### Get Available Orders (Delivery Person)
```bash
curl -X GET https://backend.rani-jay.com/api/order/available \
  -H "token: YOUR_JWT_TOKEN"
```

### Get Nearest Orders (Delivery Person)
```bash
curl -X GET "https://backend.rani-jay.com/api/order/nearest?latitude=40.7128&longitude=-74.0060" \
  -H "token: YOUR_JWT_TOKEN"
```

### Accept Order (Delivery Person)
```bash
curl -X POST https://backend.rani-jay.com/api/order/accept \
  -H "token: YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439020",
    "orderId": "507f1f77bcf86cd799439050"
  }'
```

### Mark as Delivered (Delivery Person)
```bash
curl -X POST https://backend.rani-jay.com/api/order/delivered \
  -H "token: YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439020",
    "orderId": "507f1f77bcf86cd799439050"
  }'
```

---

---

# Delivery Pricing API

## Base URL
`https://backend.rani-jay.com/api/pricing`

---

## Admin Endpoints (Requires JWT Token with Admin Role)

### Create Pricing Tier
**Endpoint:** `POST /create`

**Description:** Create a new delivery pricing tier based on distance

**Headers:**
```
token: ADMIN_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439012",
  "name": "Short Distance",
  "minDistance": 0,
  "maxDistance": 5,
  "unit": "km",
  "price": 2.99
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Pricing tier created successfully",
  "pricingTier": {
    "_id": "507f1f77bcf86cd799439041",
    "name": "Short Distance",
    "minDistance": 0,
    "maxDistance": 5,
    "unit": "km",
    "price": 2.99,
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Validation:**
- `name`: Required, string
- `minDistance`: Required, non-negative number
- `maxDistance`: Optional, must be greater than minDistance (null for unlimited)
- `unit`: Required, must be "km" or "m"
- `price`: Required, non-negative number

---

### Update Pricing Tier
**Endpoint:** `PUT /:id`

**Description:** Update an existing pricing tier (Admin only)

**Headers:**
```
token: ADMIN_JWT_TOKEN
Content-Type: application/json
```

**Parameters:**
- `id` (string): Pricing Tier ID

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439012",
  "name": "Short Distance Updated",
  "price": 3.49,
  "maxDistance": 6
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Pricing tier updated successfully",
  "pricingTier": {
    "_id": "507f1f77bcf86cd799439041",
    "name": "Short Distance Updated",
    "minDistance": 0,
    "maxDistance": 6,
    "unit": "km",
    "price": 3.49,
    "isActive": true
  }
}
```

---

### Delete Pricing Tier
**Endpoint:** `DELETE /:id`

**Description:** Delete a pricing tier (Admin only)

**Headers:**
```
token: ADMIN_JWT_TOKEN
Content-Type: application/json
```

**Parameters:**
- `id` (string): Pricing Tier ID

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439012"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Pricing tier deleted successfully"
}
```

---

### Toggle Pricing Status
**Endpoint:** `PATCH /toggle-status/:id`

**Description:** Activate or deactivate a pricing tier (Admin only)

**Headers:**
```
token: ADMIN_JWT_TOKEN
Content-Type: application/json
```

**Parameters:**
- `id` (string): Pricing Tier ID

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439012"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Pricing tier status updated successfully",
  "pricingTier": {
    "_id": "507f1f77bcf86cd799439041",
    "name": "Short Distance",
    "minDistance": 0,
    "maxDistance": 5,
    "unit": "km",
    "price": 2.99,
    "isActive": false
  }
}
```

---

## Public Endpoints

### List All Pricing Tiers
**Endpoint:** `GET /list`

**Description:** Get all pricing tiers (Public)

**Response (Success):**
```json
{
  "success": true,
  "pricingTiers": [
    {
      "_id": "507f1f77bcf86cd799439041",
      "name": "Short Distance",
      "minDistance": 0,
      "maxDistance": 5,
      "unit": "km",
      "price": 2.99,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z"
    },
    {
      "_id": "507f1f77bcf86cd799439042",
      "name": "Medium Distance",
      "minDistance": 5,
      "maxDistance": 15,
      "unit": "km",
      "price": 5.99,
      "isActive": true,
      "createdAt": "2024-01-15T11:00:00Z"
    },
    {
      "_id": "507f1f77bcf86cd799439043",
      "name": "Long Distance",
      "minDistance": 15,
      "maxDistance": null,
      "unit": "km",
      "price": 9.99,
      "isActive": true,
      "createdAt": "2024-01-15T11:30:00Z"
    }
  ]
}
```

---

### Get Pricing Tier by ID
**Endpoint:** `GET /:id`

**Description:** Get details of a specific pricing tier (Public)

**Parameters:**
- `id` (string): Pricing Tier ID

**Response (Success):**
```json
{
  "success": true,
  "pricingTier": {
    "_id": "507f1f77bcf86cd799439041",
    "name": "Short Distance",
    "minDistance": 0,
    "maxDistance": 5,
    "unit": "km",
    "price": 2.99,
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### Calculate Delivery Price
**Endpoint:** `POST /calculate`

**Description:** Calculate delivery price based on distance (Public)

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "distance": 3.5,
  "unit": "km"
}
```

**Response (Success):**
```json
{
  "success": true,
  "price": 2.99,
  "pricingTier": {
    "_id": "507f1f77bcf86cd799439041",
    "name": "Short Distance",
    "minDistance": 0,
    "maxDistance": 5,
    "unit": "km",
    "price": 2.99
  }
}
```

**Response (Error - No Applicable Pricing):**
```json
{
  "success": false,
  "message": "No applicable pricing found for this distance"
}
```

**Parameters:**
- `distance`: Required, numeric
- `unit`: Required, must be "km" or "m"

---

## cURL Examples

### Create Pricing Tier (Admin)
```bash
curl -X POST https://backend.rani-jay.com/api/pricing/create \
  -H "token: ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439012",
    "name": "Short Distance",
    "minDistance": 0,
    "maxDistance": 5,
    "unit": "km",
    "price": 2.99
  }'
```

### Update Pricing Tier (Admin)
```bash
curl -X PUT https://backend.rani-jay.com/api/pricing/507f1f77bcf86cd799439041 \
  -H "token: ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439012",
    "price": 3.49
  }'
```

### Delete Pricing Tier (Admin)
```bash
curl -X DELETE https://backend.rani-jay.com/api/pricing/507f1f77bcf86cd799439041 \
  -H "token: ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": "507f1f77bcf86cd799439012"}'
```

### Toggle Pricing Status (Admin)
```bash
curl -X PATCH https://backend.rani-jay.com/api/pricing/toggle-status/507f1f77bcf86cd799439041 \
  -H "token: ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": "507f1f77bcf86cd799439012"}'
```

### List All Pricing Tiers (Public)
```bash
curl https://backend.rani-jay.com/api/pricing/list
```

### Get Pricing Tier by ID (Public)
```bash
curl https://backend.rani-jay.com/api/pricing/507f1f77bcf86cd799439041
```

### Calculate Delivery Price (Public)
```bash
curl -X POST https://backend.rani-jay.com/api/pricing/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "distance": 3.5,
    "unit": "km"
  }'
```

---

---

# Real-Time Location Tracking API

## Base URL
`https://backend.rani-jay.com/api/location`

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
