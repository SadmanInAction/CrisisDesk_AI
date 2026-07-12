import { z } from 'zod';

export const createReportSchema = z.object({
  name: z.string().optional(),
  contact: z.string().optional(),
  location: z.string().min(1, 'Location is required'),
  description: z.string().min(1, 'Description is required'),
  language: z.enum(['bn', 'en', 'unknown']).default('unknown'),
});

export const updateReportStatusSchema = z.object({
  status: z.enum(['pending', 'in_review', 'assigned', 'resolved', 'rejected'])
});

export const reportQuerySchema = z.object({
  category: z.string().optional(),
  urgency: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
