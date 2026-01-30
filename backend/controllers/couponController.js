import couponModel from "../models/couponModel.js";
import couponUsageModel from "../models/couponUsageModel.js";
import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";

// Admin: Create coupon
const createCoupon = async (req, res) => {
  try {
    const userId = req.body.userId;
    const user = await userModel.findById(userId);

    if (!user || user.role !== "admin") {
      return res.json({ success: false, message: "Unauthorized: Admin access required" });
    }

    const {
      code,
      description,
      discountType,
      discountValue,
      scope,
      scopeId,
      minOrderAmount,
      maxDiscountAmount,
      maxUsagePerUser,
      maxTotalUsage,
      validFrom,
      validUntil,
      applicableUserRoles,
    } = req.body;

    // Validation
    if (!code || !discountType || discountValue === undefined || !validFrom || !validUntil) {
      return res.json({ success: false, message: "Missing required fields" });
    }

    // Check coupon code doesn't exist
    const existingCoupon = await couponModel.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.json({ success: false, message: "Coupon code already exists" });
    }

    // Validate dates
    if (new Date(validFrom) >= new Date(validUntil)) {
      return res.json({ success: false, message: "Valid from date must be before valid until date" });
    }

    const coupon = new couponModel({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      scope: scope || "order",
      scopeId: scopeId || null,
      minOrderAmount: minOrderAmount || 0,
      maxDiscountAmount: maxDiscountAmount || null,
      maxUsagePerUser: maxUsagePerUser || 1,
      maxTotalUsage: maxTotalUsage || null,
      validFrom,
      validUntil,
      applicableUserRoles: applicableUserRoles || ["user", "customer"],
      createdBy: userId,
    });

    await coupon.save();
    res.json({ success: true, message: "Coupon created successfully", coupon });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error creating coupon" });
  }
};

// Admin: List all coupons
const listCoupons = async (req, res) => {
  try {
    const userId = req.body.userId;
    const user = await userModel.findById(userId);

    if (!user || user.role !== "admin") {
      return res.json({ success: false, message: "Unauthorized: Admin access required" });
    }

    const coupons = await couponModel.find().sort({ createdAt: -1 });
    res.json({ success: true, totalCoupons: coupons.length, coupons });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error fetching coupons" });
  }
};

// Public: List active coupons
const listActiveCoupons = async (req, res) => {
  try {
    const now = new Date();
    const coupons = await couponModel.find({
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
    }).sort({ createdAt: -1 });

    res.json({ success: true, totalCoupons: coupons.length, coupons });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error fetching coupons" });
  }
};

// Public: Get coupon details
const getCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await couponModel.findById(id);

    if (!coupon) {
      return res.json({ success: false, message: "Coupon not found" });
    }

    res.json({ success: true, coupon });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Admin: Update coupon
const updateCoupon = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { id } = req.params;

    const user = await userModel.findById(userId);
    if (!user || user.role !== "admin") {
      return res.json({ success: false, message: "Unauthorized: Admin access required" });
    }

    const coupon = await couponModel.findById(id);
    if (!coupon) {
      return res.json({ success: false, message: "Coupon not found" });
    }

    // Update fields
    const updateFields = [
      "description",
      "discountType",
      "discountValue",
      "scope",
      "scopeId",
      "minOrderAmount",
      "maxDiscountAmount",
      "maxUsagePerUser",
      "maxTotalUsage",
      "validFrom",
      "validUntil",
      "applicableUserRoles",
    ];

    updateFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        coupon[field] = req.body[field];
      }
    });

    // Validate dates
    if (new Date(coupon.validFrom) >= new Date(coupon.validUntil)) {
      return res.json({ success: false, message: "Valid from date must be before valid until date" });
    }

    await coupon.save();
    const updatedCoupon = await couponModel.findById(id);
    res.json({ success: true, message: "Coupon updated successfully", coupon: updatedCoupon });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error updating coupon" });
  }
};

// Admin: Delete coupon
const deleteCoupon = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { id } = req.params;

    const user = await userModel.findById(userId);
    if (!user || user.role !== "admin") {
      return res.json({ success: false, message: "Unauthorized: Admin access required" });
    }

    const coupon = await couponModel.findById(id);
    if (!coupon) {
      return res.json({ success: false, message: "Coupon not found" });
    }

    await couponModel.findByIdAndDelete(id);
    res.json({ success: true, message: "Coupon deleted successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error deleting coupon" });
  }
};

// Admin: Toggle coupon status
const toggleCouponStatus = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { id } = req.params;

    const user = await userModel.findById(userId);
    if (!user || user.role !== "admin") {
      return res.json({ success: false, message: "Unauthorized: Admin access required" });
    }

    const coupon = await couponModel.findById(id);
    if (!coupon) {
      return res.json({ success: false, message: "Coupon not found" });
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    const action = coupon.isActive ? "activated" : "deactivated";
    res.json({ success: true, message: `Coupon ${action} successfully`, coupon });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Public: Validate coupon code
const validateCoupon = async (req, res) => {
  try {
    const { code } = req.params;
    const { orderAmount, userId, scope, scopeId } = req.body;

    if (!code || !orderAmount) {
      return res.json({
        success: false,
        message: "Code and order amount are required",
        isValid: false,
      });
    }

    const coupon = await couponModel.findOne({ code: code.toUpperCase() });

    // Coupon doesn't exist
    if (!coupon) {
      return res.json({
        success: false,
        message: "Coupon code not found",
        isValid: false,
      });
    }

    // Validate coupon
    const validation = validateCouponRules(coupon, orderAmount, userId, scope, scopeId);
    if (!validation.isValid) {
      return res.json({
        success: false,
        message: validation.message,
        isValid: false,
      });
    }

    // Calculate discount
    const discount = calculateDiscount(orderAmount, coupon);

    res.json({
      success: true,
      message: "Coupon is valid",
      isValid: true,
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        scope: coupon.scope,
      },
      discount,
      finalAmount: orderAmount - discount,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error validating coupon", isValid: false });
  }
};

// Public: Apply coupon to order
const applyCoupon = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { code, orderId, orderAmount } = req.body;

    if (!code || !orderId || !orderAmount) {
      return res.json({ success: false, message: "Missing required fields" });
    }

    // Get coupon
    const coupon = await couponModel.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      return res.json({ success: false, message: "Coupon code not found" });
    }

    // Validate coupon
    const validation = validateCouponRules(coupon, orderAmount, userId);
    if (!validation.isValid) {
      return res.json({ success: false, message: validation.message });
    }

    // Check if user already used this coupon
    if (coupon.maxUsagePerUser > 0) {
      const usageCount = await couponUsageModel.countDocuments({
        couponCode: coupon.code,
        userId,
        status: "redeemed",
      });

      if (usageCount >= coupon.maxUsagePerUser) {
        return res.json({
          success: false,
          message: `You have reached the maximum usage limit for this coupon (${coupon.maxUsagePerUser} time${coupon.maxUsagePerUser > 1 ? "s" : ""})`,
        });
      }
    }

    // Calculate discount
    const discount = calculateDiscount(orderAmount, coupon);

    // Record usage
    const couponUsage = new couponUsageModel({
      couponId: coupon._id,
      couponCode: coupon.code,
      userId,
      orderId,
      discountApplied: discount,
      originalAmount: orderAmount,
      finalAmount: orderAmount - discount,
      status: "applied",
    });

    await couponUsage.save();

    // Increment coupon usage
    coupon.currentUsageCount += 1;
    await coupon.save();

    res.json({
      success: true,
      message: "Coupon applied successfully",
      discount,
      finalAmount: orderAmount - discount,
      usageId: couponUsage._id,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error applying coupon" });
  }
};

// Get coupon usage history
const getCouponUsageHistory = async (req, res) => {
  try {
    const userId = req.body.userId;
    const user = await userModel.findById(userId);

    // Admin can see all usage history
    if (user && user.role === "admin") {
      const history = await couponUsageModel
        .find()
        .populate("couponId", "code description discountValue")
        .sort({ usedAt: -1 });

      return res.json({ success: true, history });
    }

    // Users can see their own usage history
    const history = await couponUsageModel
      .find({ userId })
      .populate("couponId", "code description discountValue")
      .sort({ usedAt: -1 });

    res.json({ success: true, history });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error fetching usage history" });
  }
};

// Helper: Validate coupon rules
const validateCouponRules = (coupon, orderAmount, userId, scope, scopeId) => {
  const now = new Date();

  // Check if active
  if (!coupon.isActive) {
    return { isValid: false, message: "This coupon is not currently active" };
  }

  // Check dates
  if (now < new Date(coupon.validFrom)) {
    return { isValid: false, message: "This coupon is not yet valid" };
  }

  if (now > new Date(coupon.validUntil)) {
    return { isValid: false, message: "This coupon has expired" };
  }

  // Check min order amount
  if (orderAmount < coupon.minOrderAmount) {
    return {
      isValid: false,
      message: `Minimum order amount is ${coupon.minOrderAmount}. Current amount: ${orderAmount}`,
    };
  }

  // Check total usage
  if (coupon.maxTotalUsage && coupon.currentUsageCount >= coupon.maxTotalUsage) {
    return { isValid: false, message: "This coupon has reached its usage limit" };
  }

  // Check scope if provided
  if (scope && coupon.scope !== "order" && coupon.scope !== scope) {
    return { isValid: false, message: `This coupon is not applicable for ${scope}` };
  }

  if (scopeId && coupon.scopeId && coupon.scopeId !== scopeId) {
    return { isValid: false, message: "This coupon is not applicable for this item" };
  }

  return { isValid: true };
};

// Helper: Calculate discount
const calculateDiscount = (orderAmount, coupon) => {
  let discount = 0;

  if (coupon.discountType === "percentage") {
    discount = (orderAmount * coupon.discountValue) / 100;
  } else if (coupon.discountType === "fixed") {
    discount = coupon.discountValue;
  }

  // Apply max discount if set
  if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
    discount = coupon.maxDiscountAmount;
  }

  // Don't allow discount to exceed order amount
  if (discount > orderAmount) {
    discount = orderAmount;
  }

  return Math.round(discount * 100) / 100;
};

export {
  createCoupon,
  listCoupons,
  listActiveCoupons,
  getCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  validateCoupon,
  applyCoupon,
  getCouponUsageHistory,
};
