import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();
const prisma = new PrismaClient();

// Get all requests (members see their own, admins/managers see all)
router.get("/", authenticateToken, async (req: any, res: any) => {
  try {
    const { role, id } = req.user;
    let requests;
    if (role === "MEMBER") {
      requests = await prisma.request.findMany({
        where: { userId: id },
        include: { items: true, user: { select: { username: true, email: true } } },
        orderBy: { createdAt: "desc" },
      });
    } else {
      requests = await prisma.request.findMany({
        include: { items: true, user: { select: { username: true, email: true } } },
        orderBy: { createdAt: "desc" },
      });
    }
    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Create a new request
router.post("/", authenticateToken, async (req: any, res: any) => {
  try {
    const { title, type, priority, description, deadline, inspirationLinks, items } = req.body;
    
    const request = await prisma.request.create({
      data: {
        userId: req.user.id,
        title,
        type,
        priority: priority || "MEDIUM",
        description,
        deadline,
        inspirationLinks: inspirationLinks || [],
        items: {
          create: items || [],
        },
      },
      include: { items: true },
    });
    
    res.status(201).json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update a request (Admin/Manager)
router.put("/:id", authenticateToken, async (req: any, res: any) => {
  try {
    const { role } = req.user;
    if (role === "MEMBER") return res.status(403).json({ error: "Forbidden" });
    
    const { id } = req.params;
    const { deadline, items } = req.body; 

    const updatedRequest = await prisma.request.update({
      where: { id: parseInt(id) },
      data: { deadline },
    });

    if (items) {
      await prisma.requestItem.deleteMany({
        where: { requestId: parseInt(id) },
      });
      await prisma.requestItem.createMany({
        data: items.map((item: any) => ({
          itemName: item.itemName,
          quantity: item.quantity,
          notes: item.notes,
          requestId: parseInt(id),
        })),
      });
    }

    res.json(updatedRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update request status (Admin/Manager)
router.put("/:id/status", authenticateToken, async (req: any, res: any) => {
  try {
    const { role } = req.user;
    if (role === "MEMBER") return res.status(403).json({ error: "Forbidden" });

    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const request = await prisma.request.update({
      where: { id: parseInt(id) },
      data: { status, adminNotes },
    });

    res.json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
