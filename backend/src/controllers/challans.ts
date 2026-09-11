import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';

const challanItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

const createChallanSchema = z.object({
  customerId: z.string().uuid(),
  items: z.array(challanItemSchema).min(1),
});

export const getChallans = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;

    const skip = (page - 1) * limit;

    const where = search ? {
      customer: {
        name: { contains: search, mode: 'insensitive' as const }
      }
    } : {};

    const [data, total] = await Promise.all([
      prisma.challan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          customer: { select: { name: true, businessName: true } },
          _count: { select: { items: true } }
        }
      }),
      prisma.challan.count({ where }),
    ]);

    res.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getChallanById = async (req: Request, res: Response) => {
  try {
    const challan = await prisma.challan.findUnique({
      where: { id: req.params.id as string },
      include: {
        customer: true,
        items: true,
      },
    });

    if (!challan) {
      return res.status(404).json({ success: false, message: 'Challan not found' });
    }

    res.json({ success: true, data: challan });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createChallan = async (req: Request, res: Response) => {
  try {
    const data = createChallanSchema.parse(req.body);

    // Fetch product details to snapshot them
    const productIds = data.items.map(i => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      return res.status(400).json({ success: false, message: 'One or more products not found' });
    }

    const productMap = new Map(products.map(p => [p.id, p]));

    const challanItems = data.items.map(item => {
      const p = productMap.get(item.productId)!;
      return {
        productId: p.id,
        productNameSnapshot: p.name,
        skuSnapshot: p.sku,
        unitPriceSnapshot: p.price,
        quantity: item.quantity,
      };
    });

    const challan = await prisma.challan.create({
      data: {
        customerId: data.customerId,
        status: 'DRAFT',
        items: {
          create: challanItems,
        },
      },
      include: {
        items: true,
      },
    });

    res.status(201).json({ success: true, data: challan });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Invalid input', errors: error.issues });
    }
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const cancelChallan = async (req: Request, res: Response) => {
  try {
    const challan = await prisma.challan.findUnique({
      where: { id: req.params.id as string },
    });

    if (!challan) {
      return res.status(404).json({ success: false, message: 'Challan not found' });
    }

    if (challan.status !== 'DRAFT') {
      return res.status(400).json({ success: false, message: 'Only DRAFT challans can be cancelled' });
    }

    const updated = await prisma.challan.update({
      where: { id: req.params.id as string },
      data: { status: 'CANCELLED' },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const confirmChallan = async (req: AuthRequest, res: Response) => {
  try {
    const challanId = req.params.id as string;
    const userId = req.user!.id;

    const result = await prisma.$transaction(async (tx) => {
      const challan = await tx.challan.findUnique({
        where: { id: challanId },
        include: { items: true },
      });

      if (!challan) {
        throw new Error('Challan not found');
      }

      if (challan.status !== 'DRAFT') {
        throw new Error('Only DRAFT challans can be confirmed');
      }

      // Read stock for all items
      const productIds = challan.items.map(item => item.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
      });
      const productMap = new Map(products.map(p => [p.id, p]));

      // Validate all quantities
      for (const item of challan.items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }
        if (product.stock < item.quantity) {
          const err: any = new Error('Insufficient stock for the requested product');
          err.code = 'INSUFFICIENT_STOCK';
          err.available = product.stock;
          err.requested = item.quantity;
          err.productName = product.name;
          throw err;
        }
      }

      // Deduct stock and create OUT movements
      for (const item of challan.items) {
        const product = productMap.get(item.productId)!;
        
        await tx.product.update({
          where: { id: product.id },
          data: { stock: product.stock - item.quantity },
        });

        await tx.stockMovement.create({
          data: {
            productId: product.id,
            quantity: item.quantity,
            type: 'OUT',
            reason: `Sales Challan Confirmation: ${challan.id}`,
            createdBy: userId,
          }
        });
      }

      // Update status
      return await tx.challan.update({
        where: { id: challanId as string },
        data: { status: 'CONFIRMED' },
        include: { items: true },
      });
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    if (error.code === 'INSUFFICIENT_STOCK') {
      return res.status(409).json({
        success: false,
        code: error.code,
        message: error.message,
        available: error.available,
        requested: error.requested,
        productName: error.productName,
      });
    }
    if (error.message === 'Challan not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message === 'Only DRAFT challans can be confirmed') {
      return res.status(400).json({ success: false, message: error.message });
    }
    
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
