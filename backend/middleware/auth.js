import jwt from "jsonwebtoken";

const authMiddleware = async (req, res, next) => {
  const { token } = req.headers;
  if (!token) {
    console.log("❌ No token provided");
    return res.json({ success: false, message: "Not Authorized Login Again" });
  }
  try {
    console.log("🔐 Verifying token with JWT_SECRET:", process.env.JWT_SECRET ? "✓ Set" : "❌ Not Set");
    const token_decode = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token verified, userId:", token_decode.id);
    // Store on req object directly, not on req.body (multer will overwrite req.body)
    req.userId = token_decode.id;
    req.body.userId = token_decode.id; // Also set on body for backward compatibility
    next();
  } catch (error) {
    console.log("❌ Token verification failed:", error.message);
    res.json({success:false,message:"Error: " + error.message});
  }
};
export default authMiddleware;
