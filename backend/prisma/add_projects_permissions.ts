import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const roles = await prisma.role.findMany();
  for (const role of roles) {
    const actions = role.name === 'MEMBER' 
      ? ['read'] 
      : role.name === 'INVENTORY_MANAGER'
      ? ['create', 'read', 'update', 'upload']
      : ['create', 'read', 'update', 'delete', 'upload'];
      
    for (const action of actions) {
      await prisma.rolePermission.upsert({
        where: { roleId_domain_action: { roleId: role.id, domain: 'projects', action } },
        update: {},
        create: { roleId: role.id, domain: 'projects', action }
      });
    }
  }
  console.log("Added project permissions!");
}
main().catch(console.error).finally(() => prisma.$disconnect());
