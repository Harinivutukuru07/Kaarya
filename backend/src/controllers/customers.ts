import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';

const customerSchema = z.object({
  name: z.string().min(1),
  mobile: z.string().min(10),
  email: z.string().email().optional().nullable(),
  businessName: z.string().optional().nullable(),
  gstNumber: z.string().optional().nullable(),
  type: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']).optional(),
  address: z.string().optional().nullable(),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).optional(),
  notes: z.string().optional().nullable(),
  followUpDate: z.string().datetime().optional().nullable(),
});

export const getCustomers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;

    const skip = (page - 1) * limit;

    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { businessName: { contains: search, mode: 'insensitive' as const } },
        { mobile: { contains: search } },
      ],
    } : {};

    const [data, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.customer.count({ where }),
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

export const getCustomerById = async (req: Request, res: Response) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id as string },
      include: {
        customerFollowUps: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const data = customerSchema.parse(req.body);
    const customer = await prisma.customer.create({ data });
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Invalid input', errors: error.issues });
    }
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const data = customerSchema.partial().parse(req.body);
    const customer = await prisma.customer.update({
      where: { id: req.params.id as string },
      data,
    });
    res.json({ success: true, data: customer });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Invalid input', errors: error.issues });
    }
    // Handle Prisma not found error if needed
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    await prisma.customer.delete({
      where: { id: req.params.id as string },
    });
    res.json({ success: true, message: 'Customer deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
