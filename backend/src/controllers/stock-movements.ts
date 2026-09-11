import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';

const stockMovementSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  type: z.enum(['IN', 'OUT']),
  reason: z.string().min(1),
});

export const getStockMovements = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    
    // Optional filter by productId
    const productId = req.query.productId as string;
    const where = productId ? { productId } : {};

    const [data, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          product: { select: { name: true, sku: true } },
          user: { select: { name: true } }
        }
      }),
      prisma.stockMovement.count({ where }),
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

export const createStockMovement = async (req: AuthRequest, res: Response) => {
  try {
    const data = stockMovementSchema.parse(req.body);
    const userId = req.user!.id;

    // Use a transaction to ensure atomic stock update
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: data.productId },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      if (data.type === 'OUT' && product.stock < data.quantity) {
        throw new Error('Insufficient stock for OUT movement');
      }

      const newStock = data.type === 'IN' 
        ? product.stock + data.quantity 
        : product.stock - data.quantity;

      const movement = await tx.stockMovement.create({
        data: {
          productId: data.productId,
          quantity: data.quantity,
          type: data.type,
          reason: data.reason,
          createdBy: userId,
        }
      });

      await tx.product.update({
        where: { id: data.productId },
        data: { stock: newStock },
      });

      return movement;
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Invalid input', errors: error.issues });
    }
    
    if (error instanceof Error) {
      if (error.message === 'Product not found') {
        return res.status(404).json({ success: false, message: error.message });
      }
      if (error.message === 'Insufficient stock for OUT movement') {
        return res.status(409).json({ success: false, code: 'INSUFFICIENT_STOCK', message: error.message });
      }
    }
    
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
