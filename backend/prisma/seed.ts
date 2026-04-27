import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { env } from '../src/config/env';

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning database and seeding initial data...");

  // Clean all existing data to start completely fresh
  await prisma.auditLog.deleteMany({});
  await prisma.history.deleteMany({});
  await prisma.lending.deleteMany({});
  await prisma.item.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.rolePermission.deleteMany({});
  await prisma.role.deleteMany({});

  const rbacMatrix = {
    ADMIN: {
      users: ["create", "read", "update", "delete", "assign_roles"],
      inventory: ["create", "read", "update", "delete"],
      borrows: ["approve", "reject", "read_all", "clear_overdue", "create_on_behalf"],
      reports: ["full"],
      system: ["settings", "audit_logs"]
    },
    INVENTORY_MANAGER: {
      users: ["none"],
      inventory: ["create", "read", "update"],
      borrows: ["approve", "reject", "process_checkin_checkout", "clear_overdue", "request_review", "create_on_behalf", "read_all"],
      reports: ["basic"]
    },
    MEMBER: {
      users: ["none"],
      inventory: ["read"],
      borrows: ["request_self", "read_own"],
      reports: ["none"]
    }
  };

  for (const [roleName, domains] of Object.entries(rbacMatrix)) {
    const roleRecord = await prisma.role.create({
      data: { name: roleName }
    });
    
    for (const [domain, actions] of Object.entries(domains)) {
      for (const action of actions) {
        await prisma.rolePermission.create({
          data: {
            roleId: roleRecord.id,
            domain,
            action
          }
        });
      }
    }
  }

  console.log("Seeded roles and permissions.");

  // Seed default items
  await prisma.item.create({ data: { name: 'Arduino Uno R3', cat: 'Electronics', qty: 5, desc: 'Microcontroller boards', cond: 'Good' }});
  await prisma.item.create({ data: { name: 'Raspberry Pi 4 (4GB)', cat: 'Electronics', qty: 3, desc: 'SBCs for projects', cond: 'Good' }});
  await prisma.item.create({ data: { name: 'Servo Motor SG90', cat: 'Electronics', qty: 12, desc: 'Mini servo motors', cond: 'Good' }});
  await prisma.item.create({ data: { name: 'Soldering Iron Station', cat: 'Tools', qty: 2, desc: 'Hakko FX-888D', cond: 'Good' }});

  // Seed default master admin
  console.log(`Seeding master admin: ${env.ROOT_ADMIN_USERNAME}`);
  const passwordHash = await bcrypt.hash(env.ROOT_ADMIN_PASSWORD, 10);
  await prisma.user.create({
    data: {
      username: env.ROOT_ADMIN_USERNAME,
      email: `${env.ROOT_ADMIN_USERNAME}@club.local`,
      passwordHash,
      role: 'ADMIN'
    }
  });

  console.log("Seeding complete! Database freshly wiped and seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
