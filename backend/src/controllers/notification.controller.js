import { Notification } from "../models/Notification.js";
import { ApiError }     from "../utils/ApiError.js";
import { ApiResponse }  from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/*
 * GET /api/v1/notifications?read=false
 * Any authenticated user — their own notifications.
 */
export const getMyNotifications = asyncHandler(async (req, res) => {
    const { read } = req.query;

    const filter = { userId: req.user._id };
    if (read === "true" || read === "false") filter.read = read === "true";

    const notifications = await Notification.find(filter)
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

    const unreadCount = await Notification.countDocuments({ userId: req.user._id, read: false });

    return res.status(200).json(
        new ApiResponse(200, { notifications, unreadCount }, "Notifications fetched successfully")
    );
});

/*
 * PATCH /api/v1/notifications/:id/read
 * Mark a single notification as read.
 */
export const markAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findOne({ _id: req.params.id, userId: req.user._id });
    if (!notification) throw new ApiError(404, "Notification not found");

    notification.read = true;
    await notification.save();

    return res.status(200).json(
        new ApiResponse(200, notification, "Notification marked as read")
    );
});

/*
 * PATCH /api/v1/notifications/read-all
 * Mark all of the user's notifications as read.
 */
export const markAllAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        { userId: req.user._id, read: false },
        { $set: { read: true } }
    );

    return res.status(200).json(
        new ApiResponse(200, null, "All notifications marked as read")
    );
});