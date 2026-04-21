import jwt from "jsonwebtoken";
import User from "../models/user.models.js";

export const authenticateToken = async (req, res, next) => {
    try {
        // Get token from cookies
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided."
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");

        // Get user from database
        const user = await User.findById(decoded.userId).select("-password");
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Token is not valid. User not found."
            });
        }

        // Add user to request object
        req.user = user;
        next();

    } catch (error) {
        console.error("Auth middleware error:", error);

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Token has expired. Please login again."
            });
        }

        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                message: "Invalid token."
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error during authentication"
        });
    }
};