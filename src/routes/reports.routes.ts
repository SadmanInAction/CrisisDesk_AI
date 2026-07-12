import { Router } from 'express';
import { submitReport, listReports, getReport, updateReportStatus, deleteReport, getStats } from '../controllers/reports.controller';
import { adminMiddleware } from '../middlewares/admin.middleware';

const router = Router();

/**
 * @swagger
 * /api/reports:
 *   post:
 *     summary: Submit a new report
 *     tags: [Reports]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - location
 *               - description
 *             properties:
 *               name:
 *                 type: string
 *               contact:
 *                 type: string
 *               location:
 *                 type: string
 *               description:
 *                 type: string
 *               language:
 *                 type: string
 *     responses:
 *       201:
 *         description: Report submitted successfully
 *       400:
 *         description: Validation error
 */
router.post('/', submitReport);

/**
 * @swagger
 * /api/reports/stats/summary:
 *   get:
 *     summary: Get analytics summary (Admin only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stats returned successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/stats/summary', adminMiddleware, getStats);

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: List reports with filters
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: urgency
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of reports
 */
router.get('/', listReports);

/**
 * @swagger
 * /api/reports/{id}:
 *   get:
 *     summary: Get report details
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Report details
 *       404:
 *         description: Report not found
 */
router.get('/:id', getReport);

/**
 * @swagger
 * /api/reports/{id}/status:
 *   patch:
 *     summary: Update report status (Admin only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, in_review, assigned, resolved, rejected]
 *     responses:
 *       200:
 *         description: Status updated
 *       401:
 *         description: Unauthorized
 */
router.patch('/:id/status', adminMiddleware, updateReportStatus);

/**
 * @swagger
 * /api/reports/{id}:
 *   delete:
 *     summary: Delete a report (Admin only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Report deleted
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', adminMiddleware, deleteReport);

export default router;
