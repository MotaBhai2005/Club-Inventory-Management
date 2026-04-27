import { Router, Request, Response } from 'express';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Setup Multer for image uploads
const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// GET all bulk orders (and projects)
router.get('/', authenticateToken, requirePermission('projects', 'read'), async (req: Request, res: Response) => {
  try {
    const orders = await prisma.bulkOrder.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bulk orders' });
  }
});

// POST a new bulk order
router.post('/', authenticateToken, requirePermission('projects', 'create'), async (req: Request, res: Response) => {
  try {
    const { name, description, isProject, status, startDate, endDate } = req.body;
    const order = await prisma.bulkOrder.create({
      data: { name, description, isProject, status, startDate, endDate }
    });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create bulk order' });
  }
});

// PUT update bulk order
router.put('/:id', authenticateToken, requirePermission('projects', 'update'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, startDate, endDate } = req.body;
    const order = await prisma.bulkOrder.update({
      where: { id: parseInt(id as string) },
      data: { status, startDate, endDate }
    });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update bulk order' });
  }
});

// POST add item to bulk order
router.post('/:id/items', authenticateToken, requirePermission('projects', 'update'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { itemName, quantity, notes } = req.body;
    const item = await prisma.bulkOrderItem.create({
      data: {
        bulkOrderId: parseInt(id as string),
        itemName,
        quantity: parseInt(quantity),
        notes
      }
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add item to bulk order' });
  }
});

// POST upload image
router.post('/:id/upload', authenticateToken, requirePermission('projects', 'upload'), upload.single('image'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    const order = await prisma.bulkOrder.update({
      where: { id: parseInt(id as string) },
      data: { imageUrl }
    });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

export default router;
