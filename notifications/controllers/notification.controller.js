import { Notification } from '../models/notification.model.js';

export const createNotification = async (recipientId, message, link) => {
    try {
        await Notification.create({ recipient: recipientId, message, link });
    } catch (error) {
        console.error("Error creating notification:", error);
    }
};

export const getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json(notifications);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

export const markAsRead = async (req, res) => {
    try {
        await Notification.updateMany({ recipient: req.user.id, read: false }, { read: true });
        res.status(200).json({ success: true, message: "All notifications marked as read." });
    } catch (error) { res.status(500).json({ message: error.message }); }
};