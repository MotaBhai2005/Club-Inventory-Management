import prisma from '../config/prisma';

export class InventoryService {
  static async getInventory() {
    const [items, lentByItem] = await Promise.all([
      prisma.item.findMany(),
      prisma.lending.groupBy({
        by: ['itemId'],
        where: { status: { in: ['PENDING', 'APPROVED'] } },
        _sum: { qty: true }
      })
    ]);

    const lentMap = new Map<number, number>(
      lentByItem.map((entry) => [entry.itemId, entry._sum.qty ?? 0])
    );

    return items.map((item) => {
      const lentQty = lentMap.get(item.id) ?? 0;
      return {
        ...item,
        lentQty,
        availQty: Math.max(0, item.qty - lentQty)
      };
    });
  }

  static async addItem(data: any) {
    return await prisma.item.create({ data });
  }

  static async updateItem(id: number, data: any) {
    return await prisma.item.update({ where: { id }, data });
  }

  static async deleteItem(id: number) {
    const lent = await prisma.lending.aggregate({ where: { itemId: id }, _sum: { qty: true } });
    if ((lent._sum.qty || 0) > 0) {
      throw new Error('Cannot delete item currently lent out');
    }
    return await prisma.item.delete({ where: { id } });
  }
}
