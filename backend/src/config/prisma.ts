import { PrismaClient } from '@prisma/client';

// Singleton instance for PrismaClient
const prisma = new PrismaClient();

export default prisma;
