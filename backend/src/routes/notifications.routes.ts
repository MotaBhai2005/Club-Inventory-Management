import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';

const router = Router();

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

router.put('/:id/read', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const notificationId = parseInt(req.params.id as string);
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    if (notification.userId !== req.user!.id) {
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

router.put('/read-all', authenticateToken, async (req: AuthRequest, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to mark all as read" });
  }
});

export default router;
