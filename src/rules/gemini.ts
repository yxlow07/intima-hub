import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function getSystemPrompt(rule: 'sap' | 'asf'): Promise<string> {
  const filePath = `./src/rules/${rule}.md`;
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error(`Error reading system prompt file for ${rule}:`, error);
    throw new Error(`Could not read system prompt for ${rule}`);
  }
}

export async function validateDocumentWithGemini(
  rule: 'sap' | 'asf',
  filePath: string
): Promise<any> {
  try {
    const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const model = genAI.getGenerativeModel({ model: geminiModel });
    const systemPrompt = await getSystemPrompt(rule);

    const fileData = fs.readFileSync(filePath);
    const base64Data = fileData.toString('base64');

    const result = await model.generateContent([
      systemPrompt,
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: base64Data,
        },
      },
    ]);

    const response = await result.response;
    const text = await response.text();

    // Clean the response to ensure it's a valid JSON
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Error validating document with Gemini:', error);
    // Return a structured error object that can be stored in the comments field
    return {
      status: 'error',
      comments: [
        {
          field: 'gemini-validation',
          message: 'Failed to validate document with Gemini.',
          severity: 'critical',
          suggested_fix: 'Check the server logs for more details.',
        },
      ],
    };
  }
}

