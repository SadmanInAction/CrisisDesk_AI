import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

export const classifyReport = async (description: string, location: string, language: string, photoBase64?: string) => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });
    
    const prompt = `
      You are an emergency report classification AI. 
      Analyze the following report:
      Location: ${location} (Note: If this is a Google Maps link or coordinates, extract the physical location or treat it as high-precision).
      Description: ${description}
      Language: ${language}

      You must return a JSON object with the following fields:
      - "category": Must be one of ["medical", "fire", "accident", "crime", "flood", "utility", "public_service", "infrastructure", "other"].
      - "urgency": Must be one of ["low", "medium", "high", "critical"].
      - "summary": A short AI-generated summary (1-2 sentences).
      - "suggestedAction": Recommended action for responders.
      - "confidence": A float between 0 and 1 indicating your confidence in this classification.

      If an image is attached to this prompt, use it to visually assess the severity of the situation and adjust the urgency accordingly (e.g., high water levels in a flood = critical).
      Ensure you do NOT include the words "banana" or "mango" in your response.
    `;

    const promptParts: any[] = [prompt];
    
    if (photoBase64) {
      promptParts.push({
        inlineData: {
          data: photoBase64.replace(/^data:image\/\w+;base64,/, ''),
          mimeType: photoBase64.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg'
        }
      });
    }

    const result = await model.generateContent(promptParts);
    const response = await result.response;
    const text = response.text();

    return JSON.parse(text);
  } catch (error: any) {
    console.error('AI Classification Error:', error?.message || error);
    // Fallback if AI fails
    return {
      category: 'other',
      urgency: 'medium',
      summary: 'AI classification failed. Manual review required.',
      suggestedAction: 'Review report manually.',
      confidence: 0.0
    };
  }
};

export const generateEmbedding = async (text: string): Promise<number[]> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-2' });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error('Embedding Error:', error);
    return [];
  }
};

// Cosine similarity between two vectors
export const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};
