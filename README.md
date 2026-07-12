# ResQ AI

ResQ AI is an intelligent backend API for emergency and service request triage. It acts as an automated backend operator that receives citizen reports, uses advanced Artificial Intelligence to classify issues, assigns urgency, detects duplicates via text embeddings, and provides a full suite of admin APIs for management and analytics.

---

## 🚀 Features

- **Automated AI Triage**: Uses Gemini 3.5 Flash to automatically assign categories (medical, fire, flood, etc.), calculate urgency (low, medium, high, critical), and generate short actionable summaries.
- **Advanced Duplicate Detection**: Uses Gemini text embeddings (`gemini-embedding-2`) and Cosine Similarity to automatically flag if a new report is highly similar to recently submitted incidents.
- **Multilingual Support**: Natively processes reports in English and Bangla via AI context evaluation.
- **Admin Authentication**: Privileged endpoints for updating status and analyzing stats are secured via an Admin API key.
- **Robust Validation**: Strictly enforces API inputs using Zod.
- **Rate Limiting**: Integrated `express-rate-limit` to prevent API abuse.
- **Swagger Documentation**: Self-documenting interactive API interface.

---

## 🛠 Tech Stack

- **Node.js & Express**: Core API server.
- **TypeScript**: Static typing and robust developer experience.
- **Prisma & SQLite**: Zero-configuration, portable relational database (easily swappable to PostgreSQL if needed).
- **Zod**: Input validation.
- **Jest & Supertest**: Unit and integration testing.
- **Docker**: Ready for containerized deployment.
- **Google Generative AI**: LLM inference and embeddings.

---

## 🔧 Installation & Setup

### Environment Variables
Create a `.env` file in the root of the project with the following:
```env
PORT=3000
DATABASE_URL="file:./dev.db"
GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere..."
ADMIN_API_KEY="supersecretadmin"
```

### Option 1: Native Node.js Setup
1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Setup Database**:
   ```bash
   npx prisma db push
   npx prisma generate
   ```
3. **Run the Server**:
   ```bash
   # Development mode (auto-restarts on changes)
   npm start
   
   # Production build
   npm run build
   node dist/index.js
   ```

### Option 2: Docker Setup (Recommended)
You can launch the entire application with zero setup using Docker Compose.
```bash
docker-compose up --build
```

---

## 📖 API Guide & Documentation

Once the server is running, the **Swagger API UI** is hosted automatically. 
Open your browser and navigate to:
👉 **[http://localhost:3000/api-docs](http://localhost:3000/api-docs)**

### Core Endpoints

#### Public
- `POST /api/reports` : Submit a new emergency report. (Validates location and description).
- `GET /api/reports` : List reports with advanced filtering (`category`, `urgency`, `status`, `search`, `startDate`, `endDate`).
- `GET /api/reports/:id` : Fetch a single report by ID.

#### Admin (Requires `Authorization: Bearer <ADMIN_API_KEY>`)
- `PATCH /api/reports/:id/status` : Update the status of a report (`pending`, `in_review`, `assigned`, `resolved`, `rejected`).
- `DELETE /api/reports/:id` : Delete a report permanently.
- `GET /api/reports/stats/summary` : Get an analytical breakdown of report counts by category, status, and urgency.

---

## 🧪 Testing Notes

This project comes with a full suite of automated tests verifying the API structure, database integration, and security routing. The AI service is accurately mocked within the testing suite to ensure tests run fast and don't consume real API quota.

To run the unit tests:
```bash
npm test
```

**What is tested?**
1. E2E Creation of a report (`POST /api/reports`).
2. Correct schema validation rejections.
3. Fetching and filtering of reports (`GET /api/reports`).
4. Admin authorization block (`401 Unauthorized` responses without valid bearer tokens).
5. State mutations (`PATCH /api/reports/:id/status`).

---

## 🚢 Deployment Steps

This application is containerized and ready to be deployed to platforms like Railway, Render, or Heroku. 

**For Railway / Render:**
1. Fork or push this repository to GitHub.
2. Link the repository to your hosting provider.
3. The platform will automatically detect the `Dockerfile` and build the application.
4. Set the following environment variables in the provider's dashboard:
   - `GEMINI_API_KEY`
   - `ADMIN_API_KEY`
   - `PORT` (usually handled automatically by the provider).
5. (Optional) Swap SQLite to a managed PostgreSQL database by modifying the provider in `prisma/schema.prisma` and supplying a valid `DATABASE_URL`!
