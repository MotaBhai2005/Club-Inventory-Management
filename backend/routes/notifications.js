const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');

// Get all notifications for the logged-in user
router.get('/', async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to latest 50
    });
    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Mark a specific notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    if (notification.userId !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

// Mark all notifications as read for the logged-in user
router.put('/read-all', async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to mark all as read" });
  }
});

module.exports = router;
