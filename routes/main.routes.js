
import express from "express";
import { joinRoom, getRoom } from "../controllers/room.controllers.js";
import { register, login, logout } from "../controllers/user.controllers.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// User authentication routes
// @route   POST /api/v1/auth/register
router.post("/auth/register", register);

// @route   POST /api/v1/auth/login
router.post("/auth/login", login);

// @route   POST /api/v1/auth/logout
router.post("/auth/logout", authenticateToken, logout);

// @route   GET /api/v1/auth/me
router.get("/auth/me", authenticateToken, (req, res) => {
    res.status(200).json({
        success: true,
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            username: req.user.username
        }
    });
});

// Room routes
// @route   POST /api/v1/rooms/join
router.post("/rooms/join", authenticateToken, joinRoom);

// @route   GET /api/v1/rooms/:roomId
router.get("/rooms/:roomId", authenticateToken, getRoom);

export default router;