import prisma from '../config/prisma';

export class LendingsService {
  static async getLendings(
    userId: number,
    role: string,
    options?: { page?: number; limit?: number }
  ) {
    const page = Math.max(1, options?.page ?? 1);
    const limit = Math.min(200, Math.max(1, options?.limit ?? 100));
    const skip = (page - 1) * limit;

    let whereClause: any = {
      status: { in: ['PENDING', 'APPROVED'] }
    };
    // Members only see their own. Admins/InvManagers see all.
    if (role === 'MEMBER') {
      whereClause = { ...whereClause, userId };
    }
    
    const lendings = await prisma.lending.findMany({ 
      where: whereClause,
      include: { item: { select: { name: true } } },
      orderBy: { id: 'desc' },
      skip,
      take: limit
    });
    return lendings.map(l => ({ ...l, itemName: l.item.name }));
  }

  static async requestBorrow(userId: number, data: any) {
    const item = await prisma.item.findUnique({ where: { id: data.itemId }, include: { lendings: true } });
    if (!item) throw new Error('Item not found');
    
    // Calculate currently active/approved or pending lendings to ensure we don't over-commit
    const activeLent = item.lendings.filter(l => l.status !== 'REJECTED' && l.status !== 'RETURNED').reduce((sum, l) => sum + l.qty, 0);
    
    if (item.qty - activeLent < data.qty!) {
      throw new Error('Not enough availability');
    }
    
    return await prisma.lending.create({ 
      data: {
        itemId: data.itemId,
        userId: userId,
        qty: data.qty,
        status: "PENDING",
        club: data.club,
        theirMember: data.theirMember,
        ourMember: data.ourMember,
        borrowerEmail: data.borrowerEmail,
        lentOn: data.lentOn,
        duration: data.duration,
        notes: data.notes
      }
    });
  }

  static async approveBorrow(id: number) {
    const lending = await prisma.lending.findUnique({ where: { id } });
    if (!lending) throw new Error('Lending record not found');
    if (lending.status !== 'PENDING') throw new Error('Lending is not PENDING');
    
    return await prisma.lending.update({
      where: { id },
      data: { status: 'APPROVED' } // we can call it ACTIVE or APPROVED. Using APPROVED.
    });
  }

  static async rejectBorrow(id: number) {
    const lending = await prisma.lending.findUnique({ where: { id } });
    if (!lending) throw new Error('Lending record not found');
    if (lending.status !== 'PENDING') throw new Error('Lending is not PENDING');
    
    return await prisma.lending.update({
      where: { id },
      data: { status: 'REJECTED' }
    });
  }

  static async createOnBehalf(userId: number, data: any) {
    const item = await prisma.item.findUnique({ where: { id: data.itemId }, include: { lendings: true } });
    if (!item) throw new Error('Item not found');
    
    const activeLent = item.lendings.filter(l => l.status !== 'REJECTED' && l.status !== 'RETURNED').reduce((sum, l) => sum + l.qty, 0);
    if (item.qty - activeLent < data.qty!) throw new Error('Not enough availability');
    
    return await prisma.lending.create({ 
      data: {
        itemId: data.itemId,
        userId: userId,
        qty: data.qty,
        status: "APPROVED",
        club: data.club,
        theirMember: data.theirMember,
        ourMember: data.ourMember,
        borrowerEmail: data.borrowerEmail,
        lentOn: data.lentOn,
        duration: data.duration,
        notes: data.notes
      }
    });
  }

  static async createBulkOnBehalf(userId: number, data: any) {
    return await prisma.$transaction(async (tx) => {
      const results = [];
      for (const iData of data.items) {
        const item = await tx.item.findUnique({ where: { id: iData.itemId }, include: { lendings: true } });
        if (!item) throw new Error(`Item ID ${iData.itemId} not found`);
        
        const activeLent = item.lendings.filter(l => l.status !== 'REJECTED' && l.status !== 'RETURNED').reduce((sum, l) => sum + l.qty, 0);
        if (item.qty - activeLent < iData.qty) throw new Error(`Not enough availability for ${item.name}`);
        
        const lending = await tx.lending.create({
          data: {
            itemId: iData.itemId,
            userId: userId,
            qty: iData.qty,
            status: "APPROVED",
            club: data.club,
            theirMember: data.theirMember,
            ourMember: data.ourMember,
            borrowerEmail: data.borrowerEmail,
            lentOn: data.lentOn,
            duration: data.duration,
            notes: data.notes
          }
        });
        results.push(lending);
      }
      return results;
    });
  }

  static async returnLending(id: number) {
    const lending = await prisma.lending.findUnique({ where: { id } });
    if (!lending) throw new Error('Lending record not found');
    if (lending.status !== 'APPROVED') {
       // if they manually return a PENDING, we could just reject. 
       // We'll proceed if it's not already returned.
       if (lending.status === 'RETURNED') throw new Error('Already returned');
    }
    
    const returnedOn = new Date().toISOString().split('T')[0];
    
    // Instead of deleting, we update status to RETURNED and create history.
    await prisma.$transaction([
      prisma.history.create({
        data: {
          itemId: lending.itemId, 
          userId: lending.userId,
          qty: lending.qty, 
          club: lending.club,
          theirMember: lending.theirMember, 
          ourMember: lending.ourMember,
          borrowerEmail: lending.borrowerEmail,
          lentOn: lending.lentOn, 
          returnedOn: returnedOn, 
          duration: lending.duration
        }
      }),
      prisma.lending.update({ 
        where: { id },
        data: { status: 'RETURNED' }
      })
    ]);
  }

  static async getHistory(options?: { page?: number; limit?: number }) {
    const page = Math.max(1, options?.page ?? 1);
    const limit = Math.min(500, Math.max(1, options?.limit ?? 200));
    const skip = (page - 1) * limit;

    const history = await prisma.history.findMany({
      include: { item: { select: { name: true } } },
      orderBy: { id: 'desc' },
      skip,
      take: limit
    });
    return history.map(h => ({ ...h, itemName: h.item.name }));
  }
}
