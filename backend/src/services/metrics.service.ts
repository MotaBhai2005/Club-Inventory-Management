import prisma from '../config/prisma';

export class MetricsService {
  static async getMetrics() {
    const items = await prisma.item.findMany();
    const lendings = await prisma.lending.findMany({
      where: { status: { in: ['PENDING', 'APPROVED'] } }
    });
    
    const uniqueItems = items.length;
    const totalUnits = items.reduce((sum, item) => sum + item.qty, 0);
    const activeLendings = lendings.length;
    
    let overdue = 0;
    const today = new Date(); 
    today.setHours(0, 0, 0, 0);
    
    for (const l of lendings) {
      const retDate = new Date(l.lentOn + 'T00:00:00');
      retDate.setDate(retDate.getDate() + l.duration);
      if (retDate < today) overdue++;
    }
    
    return { uniqueItems, totalUnits, activeLendings, overdue };
  }
}
