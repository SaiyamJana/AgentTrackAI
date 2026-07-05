import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

/*
 * socketAuth — Socket.IO connection middleware.
 *
 * Mirrors the logic of verifyJWT (auth.middleware.js) but adapted for
 * the Socket.IO handshake instead of an Express request.
 *
 * The client must pass the JWT in the socket handshake auth object:
 *   const socket = io(SERVER_URL, { auth: { token: localStorage.getItem("token") } });
 *
 * On success:  socket.user is populated with the full User document
 *              (minus password and refreshToken) — exactly like req.user
 *              in REST handlers.
 *
 * On failure:  next(new Error(...)) causes Socket.IO to reject the
 *              connection and emit a "connect_error" event on the client.
 *
 * This runs ONCE per connection — not on every event — so the DB hit is
 * minimal.  Individual event handlers re-check authorization using the
 * already-populated socket.user (no extra DB round-trip for auth itself).
 */
export const socketAuth = async (socket, next) => {
    try {
        // Token can arrive as auth.token (preferred) or as a query param
        // fallback for environments that can't set auth headers.
        const token =
            socket.handshake.auth?.token ||
            socket.handshake.query?.token;

        if (!token) {
            return next(new Error("Unauthorized: No token provided"));
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decoded._id)
            .select("-password -refreshToken")
            .lean();

        if (!user) {
            return next(new Error("Unauthorized: User not found"));
        }
        if (!user.isActive) {
            return next(new Error("Unauthorized: Account is deactivated"));
        }

        // Attach to socket — available in all subsequent event handlers
        socket.user = user;
        next();
    } catch (err) {
        // jwt.verify throws for expired / malformed tokens
        return next(new Error("Unauthorized: Invalid token"));
    }
};
