# Users Management Backend API Guide

This document outlines all the backend API endpoints required to support the Users management frontend page.

## Base URL
`http://localhost:4000`

## Authentication
All user-related endpoints require a token passed in the request headers:
```
Header: token
```

---

## API Endpoints

### 1. Get All Users
**Endpoint:** `GET /api/user/list`

**Headers:**
```
token: <admin_token>
```

**Response (Success):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "user_id_1",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "admin"
    },
    {
      "_id": "user_id_2",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "user"
    }
  ]
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Failed to fetch users"
}
```

---

### 2. Add New User
**Endpoint:** `POST /api/user/add`

**Headers:**
```
token: <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "securePassword123",
  "role": "user"
}
```

**Validation Rules:**
- `name`: Required, string, minimum 2 characters
- `email`: Required, valid email format, must be unique in database
- `password`: Required, string, minimum 6 characters
- `role`: Required, must be one of: "user", "admin", "moderator"

**Response (Success):**
```json
{
  "success": true,
  "message": "User added successfully",
  "data": {
    "_id": "new_user_id",
    "name": "New User",
    "email": "newuser@example.com",
    "role": "user"
  }
}
```

**Response (Error - Email exists):**
```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

**Response (Error - Validation):**
```json
{
  "success": false,
  "message": "Invalid input data"
}
```

---

### 3. Update User
**Endpoint:** `POST /api/user/edit`

**Headers:**
```
token: <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "id": "user_id_to_update",
  "name": "Updated Name",
  "email": "updated@example.com",
  "password": "newPassword123",
  "role": "admin"
}
```

**Notes:**
- `id`: Required, the user ID to update
- `name`: Optional, string
- `email`: Optional, valid email format, must be unique (excluding the current user)
- `password`: Optional, if provided it should be updated. If empty/undefined, keep the existing password
- `role`: Optional, must be one of: "user", "admin", "moderator"

**Response (Success):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "_id": "user_id",
    "name": "Updated Name",
    "email": "updated@example.com",
    "role": "admin"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Failed to update user"
}
```

---

### 4. Update User Role
**Endpoint:** `POST /api/user/role`

**Headers:**
```
token: <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "id": "user_id",
  "role": "moderator"
}
```

**Validation Rules:**
- `id`: Required, valid user ID
- `role`: Required, must be one of: "user", "admin", "moderator"

**Response (Success):**
```json
{
  "success": true,
  "message": "Role updated successfully",
  "data": {
    "_id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "role": "moderator"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Failed to update role"
}
```

---

### 5. Delete User
**Endpoint:** `POST /api/user/remove`

**Headers:**
```
token: <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "id": "user_id_to_delete"
}
```

**Validation Rules:**
- `id`: Required, valid user ID
- Prevent deletion of the currently logged-in user

**Response (Success):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Response (Error - Cannot delete self):**
```json
{
  "success": false,
  "message": "You cannot delete your own account"
}
```

**Response (Error - User not found):**
```json
{
  "success": false,
  "message": "User not found"
}
```

---

## Important Notes for Backend Developer

1. **Authentication**: All endpoints require admin authentication via token. Verify that the token belongs to an admin user.

2. **Validation**:
   - Always validate email uniqueness before adding or updating
   - Validate password strength (minimum 6 characters)
   - Validate role values against allowed roles: ["user", "admin", "moderator"]

3. **Data Models**: Ensure your User model has these fields:
   - `_id` (MongoDB ObjectId or similar)
   - `name` (String)
   - `email` (String, unique)
   - `password` (String, hashed)
   - `role` (String, enum: ["user", "admin", "moderator"])
   - `createdAt` (Timestamp, optional)
   - `updatedAt` (Timestamp, optional)

4. **Error Handling**:
   - Return appropriate HTTP status codes:
     - 200: Success
     - 400: Bad request (validation error)
     - 401: Unauthorized (invalid token)
     - 403: Forbidden (not admin)
     - 404: Not found
     - 500: Server error

5. **Security**:
   - Hash passwords using bcrypt or similar before storing
   - Never return passwords in response data
   - Implement rate limiting for security endpoints
   - Validate all user inputs on the backend

6. **Password Handling**:
   - When updating a user, if the password field is empty/undefined, keep the existing password
   - Always hash passwords before storing in the database
   - Never return plaintext passwords in any response

7. **Available Roles**: Support these three roles in your system:
   - `"user"` - Regular user with basic permissions
   - `"admin"` - Administrator with full permissions
   - `"moderator"` - Moderator with limited permissions

---

## Frontend Integration Summary

The frontend sends requests to these endpoints. Make sure your backend is set up to handle them:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/user/list` | Fetch all users |
| POST | `/api/user/add` | Create a new user |
| POST | `/api/user/edit` | Update user details |
| POST | `/api/user/role` | Update user role |
| POST | `/api/user/remove` | Delete a user |

All POST requests expect JSON content-type and the `token` header for authentication.

---

## Example Usage in Backend (Node.js/Express)

```javascript
// Example route handler
app.post('/api/user/add', authenticateAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Validate inputs
    if (!name || !email || !password || !role) {
      return res.json({ success: false, message: "Missing required fields" });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: "User with this email already exists" });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role
    });
    
    await user.save();
    
    return res.json({ 
      success: true, 
      message: "User added successfully",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
});
```

This guide provides all the necessary information to implement the Users management API endpoints on the backend.
