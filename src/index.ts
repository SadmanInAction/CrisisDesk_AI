import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import reportsRouter from './routes/reports.routes';
import http from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for Render load balancers
app.set('trust proxy', 1);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Attach io to the app so controllers can access it
app.set('io', io);

// Security Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit to 5 requests per 15 minutes for abuse prevention
  message: { success: false, message: 'Too many reports from this IP, please try again later.' }
});
app.use('/api/reports', limiter);

// Swagger Setup
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'ResQ AI API',
      version: '1.0.0',
      description: 'Emergency & Service Request Triage API',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'API_KEY',
          description: 'Enter the Admin API Key here',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.use('/api/reports', reportsRouter);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
  });
}

export default app;
