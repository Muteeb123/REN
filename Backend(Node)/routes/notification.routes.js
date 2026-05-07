import express from 'express';
import {
    saveFcmToken,
    disableNotifications,
    enableNotifications,
    sendTestNotification,
} from '../services/pushNotification.service.js';

const router = express.Router();

/**
 * POST /api/notifications/token
 * Save or update FCM token for current user
 * Body: { fcmToken: string }
 */
router.post('/token', async (req, res) => {
    try {
        const { fcmToken } = req.body;
        const userId = req.user?.id || req.body.userId;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        if (!fcmToken) {
            return res.status(400).json({ error: 'FCM token is required' });
        }

        const updatedUser = await saveFcmToken(userId, fcmToken);
        res.status(200).json({
            success: true,
            message: 'FCM token saved successfully',
            user: updatedUser,
        });
    } catch (error) {
        console.error('Error saving FCM token:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/notifications/disable
 * Disable notifications for current user
 */
router.post('/disable', async (req, res) => {
    try {
        const userId = req.user?.id || req.body.userId;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const updatedUser = await disableNotifications(userId);
        res.status(200).json({
            success: true,
            message: 'Notifications disabled successfully',
            user: updatedUser,
        });
    } catch (error) {
        console.error('Error disabling notifications:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/notifications/enable
 * Enable notifications for current user
 * Body: { fcmToken: string }
 */
router.post('/enable', async (req, res) => {
    try {
        const { fcmToken } = req.body;
        const userId = req.user?.id || req.body.userId;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        if (!fcmToken) {
            return res.status(400).json({ error: 'FCM token is required' });
        }

        const updatedUser = await enableNotifications(userId, fcmToken);
        res.status(200).json({
            success: true,
            message: 'Notifications enabled successfully',
            user: updatedUser,
        });
    } catch (error) {
        console.error('Error enabling notifications:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/notifications/test
 * Send test notification to current user
 */
router.post('/test', async (req, res) => {
    try {
        const userId = req.user?.id || req.body.userId;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const result = await sendTestNotification(userId);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error sending test notification:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/notifications/status
 * Get notification status for current user
 */
router.get('/status', async (req, res) => {
    try {
        const userId = req.user?.id || req.query.userId;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Import User model here to avoid circular dependency
        const User = (await import('../Models/User.model.js')).default;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            success: true,
            notificationsEnabled: user.notificationsEnabled,
            hasToken: !!user.fcmToken,
        });
    } catch (error) {
        console.error('Error getting notification status:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
