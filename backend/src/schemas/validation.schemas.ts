import { z } from 'zod';

export const UserSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  email: z.string().email(),
  registrationNumber: z.string().optional(),
  role: z.enum(['ADMIN', 'INVENTORY_MANAGER', 'MEMBER']).default('MEMBER')
});

export const UserUpdateSchema = z.object({
  username: z.string().min(3).optional(),
  password: z.string().min(6).optional(),
  email: z.string().email().optional(),
  registrationNumber: z.string().optional(),
  role: z.enum(['ADMIN', 'INVENTORY_MANAGER', 'MEMBER']).optional()
});

export const ItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  cat: z.string().min(1, "Category is required"),
  qty: z.number().int().min(1, "Quantity must be at least 1").default(1),
  desc: z.string().optional(),
  cond: z.string().optional().default("Good")
});

export const LendingSchema = z.object({
  itemId: z.union([z.string(), z.number()]).transform(val => parseInt(val as string, 10)),
  qty: z.number().int().min(1, "Lending quantity must be at least 1").default(1),
  club: z.string().min(1, "Club name is required").max(100),
  theirMember: z.string().min(1, "Their member is required"),
  ourMember: z.string().min(1, "Our member is required"),
  borrowerEmail: z.string().email().or(z.literal("")).optional(),
  lentOn: z.string().min(1),
  duration: z.number().int().min(1, "Duration must be at least 1 day").default(7),
  notes: z.string().optional()
});

export const BulkLendingSchema = z.object({
  items: z.array(z.object({
    itemId: z.union([z.string(), z.number()]).transform(val => parseInt(val as string, 10)),
    qty: z.number().int().min(1, "Lending quantity must be at least 1").default(1),
  })).min(1, "At least one item is required"),
  club: z.string().min(1, "Club name is required").max(100),
  theirMember: z.string().min(1, "Their member is required"),
  ourMember: z.string().min(1, "Our member is required"),
  borrowerEmail: z.string().email().or(z.literal("")).optional(),
  lentOn: z.string().min(1),
  duration: z.number().int().min(1, "Duration must be at least 1 day").default(7),
  notes: z.string().optional()
});
