import admin from 'firebase-admin';
import User from '../Models/User.model.js';

// Initialize Firebase Admin SDK
let firebaseInitialized = false;

export const initializeFirebase = (serviceAccountKey) => {
    try {
        if (!firebaseInitialized && serviceAccountKey) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccountKey),
            });
            firebaseInitialized = true;
            console.log('Firebase Admin SDK initialized');
        }
    } catch (error) {
        console.error('Firebase initialization error:', error);
    }
};

/**
 * Send push notification to user
 * @param {string} fcmToken - FCM token of the device
 * @param {Object} notification - Notification object with title, body
 * @param {Object} data - Additional data to send with notification
 */
export const sendPushNotification = async (fcmToken, notification, data = {}) => {
    try {
        if (!fcmToken) {
            throw new Error('FCM token is required');
        }

        const message = {
            notification: {
                title: notification.title || 'REN Notification',
                body: notification.body || 'You have a new message',

            },
            data: {
                timestamp: new Date().toISOString(),
                ...data,
            },
            token: fcmToken,
            android: {
                priority: 'high',
                notification: {
                    sound: 'default',
                    channelId: 'default',
                },
            },
            apns: {
                headers: {
                    'apns-priority': '10',
                },
                payload: {
                    aps: {
                        alert: {
                            title: notification.title || 'REN Notification',
                            body: notification.body || 'You have a new message',
                        },
                        sound: 'default',
                        badge: 1,
                    },
                },
            },
        };

        const response = await admin.messaging().send(message);
        console.log('Push notification sent successfully:', response);
        return { success: true, messageId: response };
    } catch (error) {
        console.error('Error sending push notification:', error);
        throw error;
    }
};

/**
 * Send multicast push notification to multiple devices
 * @param {Array<string>} fcmTokens - Array of FCM tokens
 * @param {Object} notification - Notification object
 * @param {Object} data - Additional data
 */
export const sendMulticastPushNotification = async (fcmTokens, notification, data = {}) => {
    try {
        if (!fcmTokens || fcmTokens.length === 0) {
            throw new Error('At least one FCM token is required');
        }

        const message = {
            notification: {
                title: notification.title || 'REN Notification',
                body: notification.body || 'You have a new message',
            },
            data: {
                timestamp: new Date().toISOString(),
                ...data,
            },
            android: {
                priority: 'high',
                notification: {
                    sound: 'default',
                    channelId: 'default',
                },
            },
            apns: {
                headers: {
                    'apns-priority': '10',
                },
            },
        };

        const response = await admin.messaging().sendMulticast({
            ...message,
            tokens: fcmTokens,
        });

        console.log('Multicast notification sent:', response);
        return response;
    } catch (error) {
        console.error('Error sending multicast notification:', error);
        throw error;
    }
};

/**
 * Save or update FCM token for user
 * @param {string} userId - User ID from MongoDB
 * @param {string} fcmToken - FCM token from device
 */
export const saveFcmToken = async (userId, fcmToken) => {
    try {
        if (!userId || !fcmToken) {
            throw new Error('User ID and FCM token are required');
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                fcmToken: fcmToken,
                notificationsEnabled: true,
            },
            { new: true }
        );

        console.log('FCM token saved for user:', userId);
        return updatedUser;
    } catch (error) {
        console.error('Error saving FCM token:', error);
        throw error;
    }
};

/**
 * Disable notifications for user (delete token)
 * @param {string} userId - User ID from MongoDB
 */
export const disableNotifications = async (userId) => {
    try {
        if (!userId) {
            throw new Error('User ID is required');
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                fcmToken: null,
                notificationsEnabled: false,
            },
            { new: true }
        );

        console.log('Notifications disabled for user:', userId);
        return updatedUser;
    } catch (error) {
        console.error('Error disabling notifications:', error);
        throw error;
    }
};

/**
 * Enable notifications for user
 * @param {string} userId - User ID from MongoDB
 * @param {string} fcmToken - FCM token to enable notifications with
 */
export const enableNotifications = async (userId, fcmToken) => {
    try {
        if (!userId || !fcmToken) {
            throw new Error('User ID and FCM token are required');
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                fcmToken: fcmToken,
                notificationsEnabled: true,
            },
            { new: true }
        );

        console.log('Notifications enabled for user:', userId);
        return updatedUser;
    } catch (error) {
        console.error('Error enabling notifications:', error);
        throw error;
    }
};

/**
 * Get user FCM token
 * @param {string} userId - User ID from MongoDB
 */
export const getFcmToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        return user?.fcmToken || null;
    } catch (error) {
        console.error('Error getting FCM token:', error);
        throw error;
    }
};

/**
 * Send test notification to user
 * @param {string} userId - User ID from MongoDB
 */
export const sendTestNotification = async (userId) => {
    try {
        const user = await User.findById(userId);

        if (!user || !user.fcmToken || !user.notificationsEnabled) {
            throw new Error('User not found or notifications disabled');
        }

        const notification = {
            title: 'Test Notification',
            body: `Hello ${user.preferredName || user.name || 'User'}! HEheuubuabddiad.`,
        };

        const data = {
            notificationType: 'test',
            userId: userId,
            timestamp: new Date().toISOString(),
        };

        await sendPushNotification(user.fcmToken, notification, data);
        return { success: true, message: 'Test notification sent' };
    } catch (error) {
        console.error('Error sending test notification:', error);
        throw error;
    }
};
