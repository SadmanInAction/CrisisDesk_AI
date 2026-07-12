import { Request, Response } from 'express';
import { prisma } from '../services/db.service';
import { classifyReport, generateEmbedding, cosineSimilarity } from '../services/ai.service';
import { createReportSchema, updateReportStatusSchema } from '../schemas/report.schema';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export const submitReport = async (req: Request, res: Response) => {
  try {
    const validatedData = createReportSchema.safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: Description and location are required.',
        errors: validatedData.error.issues,
      });
    }

    const { name, contact, location, description, language, photoBase64 } = validatedData.data;

    // AI Classification
    const aiResult = await classifyReport(description, location, language, photoBase64);

    let photoUrl = null;
    if (photoBase64) {
      try {
        const base64Data = photoBase64.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        
        const { data, error } = await supabase.storage
          .from('crisis-photos')
          .upload(fileName, buffer, {
            contentType: 'image/jpeg',
          });
          
        if (error) {
          console.error("Supabase Upload Error:", error);
        } else {
          const { data: publicUrlData } = supabase.storage.from('crisis-photos').getPublicUrl(fileName);
          photoUrl = publicUrlData.publicUrl;
        }
      } catch (err) {
        console.error("Image processing/upload failed:", err);
      }
    }

    // AI Embedding for Duplicate Detection
    const embedding = await generateEmbedding(description);
    
    // Duplicate Detection Logic
    let possibleDuplicate = false;
    let matchedReportId: string | null = null;
    
    if (embedding.length > 0) {
      // Fetch recent reports (e.g. last 100 to compare)
      const recentReports = await prisma.report.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
        where: { embedding: { not: null } }
      });
      
      for (const report of recentReports) {
        if (!report.embedding) continue;
        const reportEmbedding = JSON.parse(report.embedding);
        const similarity = cosineSimilarity(embedding, reportEmbedding);
        if (similarity > 0.85) {
          possibleDuplicate = true;
          matchedReportId = report.id;
          break;
        }
      }
    }

    const newReport = await prisma.report.create({
      data: {
        name,
        contact,
        location,
        description,
        language,
        category: aiResult.category,
        urgency: aiResult.urgency,
        summary: aiResult.summary,
        suggestedAction: aiResult.suggestedAction,
        confidence: aiResult.confidence,
        possibleDuplicate,
        matchedReportId,
        photoUrl: photoUrl || null,
        embedding: embedding.length > 0 ? JSON.stringify(embedding) : null,
      },
    });

    // Exclude embedding from response
    const { embedding: _, ...responseReport } = newReport;

    return res.status(201).json(responseReport);
  } catch (error) {
    console.error('Submit Report Error:', error);
    return res.status(500).json({ success: false, message: 'AI classification failed. Please try again.' });
  }
};

export const listReports = async (req: Request, res: Response) => {
  try {
    const { category, urgency, status, search, startDate, endDate } = req.query;
    
    const filter: any = {};
    if (category) filter.category = category as string;
    if (urgency) filter.urgency = urgency as string;
    if (status) filter.status = status as string;
    
    if (search) {
      filter.OR = [
        { description: { contains: search as string } },
        { location: { contains: search as string } },
      ];
    }
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.gte = new Date(startDate as string);
      if (endDate) filter.createdAt.lte = new Date(endDate as string);
    }

    const reports = await prisma.report.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' },
    });

    const sanitizedReports = reports.map(r => {
      const { embedding, ...rest } = r;
      return rest;
    });

    return res.status(200).json(sanitizedReports);
  } catch (error) {
    console.error('List Reports Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const getReport = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }
    const { embedding, ...rest } = report;
    return res.status(200).json(rest);
  } catch (error) {
    console.error('Get Report Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const updateReportStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const validatedData = updateReportStatusSchema.safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const report = await prisma.report.update({
      where: { id },
      data: { status: validatedData.data.status },
    });

    const { embedding, ...rest } = report;
    return res.status(200).json(rest);
  } catch (error) {
    console.error('Update Status Error:', error);
    return res.status(404).json({ success: false, message: 'Report not found.' });
  }
};

export const deleteReport = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.report.delete({ where: { id } });
    return res.status(200).json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Delete Report Error:', error);
    return res.status(404).json({ success: false, message: 'Report not found.' });
  }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    const totalReports = await prisma.report.count();
    const criticalReports = await prisma.report.count({ where: { urgency: 'critical' } });
    const pendingReports = await prisma.report.count({ where: { status: 'pending' } });
    const resolvedReports = await prisma.report.count({ where: { status: 'resolved' } });
    
    const categoryGroups = await prisma.report.groupBy({
      by: ['category'],
      _count: { category: true }
    });
    
    const urgencyGroups = await prisma.report.groupBy({
      by: ['urgency'],
      _count: { urgency: true }
    });

    const categoryBreakdown = categoryGroups.reduce((acc, curr) => {
      acc[curr.category] = curr._count.category;
      return acc;
    }, {} as Record<string, number>);

    const urgencyBreakdown = urgencyGroups.reduce((acc, curr) => {
      acc[curr.urgency] = curr._count.urgency;
      return acc;
    }, {} as Record<string, number>);

    return res.status(200).json({
      totalReports,
      criticalReports,
      pendingReports,
      resolvedReports,
      categoryBreakdown,
      urgencyBreakdown
    });
  } catch (error) {
    console.error('Get Stats Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
