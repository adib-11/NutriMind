import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { QuestionRequest, QuestionResponse } from '@/types/index';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('🟢 API Route: POST /api/chatbot/ask-question called');
  
  try {
    // Parse request body
    const requestBody: QuestionRequest = await request.json();
    console.log('🟢 Received question:', {
      message: requestBody.message,
      hasContext: !!requestBody.context,
      hasHistory: !!requestBody.conversationHistory
    });
    
    // Validate required fields
    if (!requestBody.message || requestBody.message.trim() === '') {
      return NextResponse.json(
        { error: 'Missing required field: message' },
        { status: 400 }
      );
    }

    const { message, context, conversationHistory } = requestBody;

    // Extract user context
    const mealPlan = context?.mealPlan || [];
    const healthConditions = context?.healthConditions || [];
    
    const mealPlanText = mealPlan.length > 0 
      ? mealPlan.map(m => m.name_en).join(', ')
      : 'Not generated yet';
    
    const healthConditionsText = healthConditions.length > 0
      ? healthConditions.join(', ')
      : 'None';

    // Construct base Gemini prompt (AC4 format)
    let qaPrompt = `You are a nutrition expert assistant for NutriMind, a meal planning app for Bangladesh.

USER QUESTION: "${message}"

CONTEXT:
- User's current meal plan: ${mealPlanText}
- User's health conditions: ${healthConditionsText}

TASK: 
Provide a helpful, accurate, brief answer (2-4 sentences) about:
- Nutritional benefits of ingredients
- Health implications for user's specific conditions
- Cultural/local context for Bangladeshi cuisine
- Practical cooking or dietary advice

IMPORTANT FORMATTING RULES:
- Write in plain conversational text - NO markdown formatting
- Do NOT use asterisks (*), underscores (_), or other markdown symbols
- Do NOT use bold, italics, or special formatting
- Just write naturally as if speaking to the user
- Use quotation marks for emphasis if needed (e.g., "nashta" instead of *nashta*)

Keep your answer under 150 words. Be friendly, conversational, and culturally relevant to Bangladesh.`;

    // Add conversation history if provided (AC6)
    if (conversationHistory && conversationHistory.length > 0) {
      const historyText = conversationHistory
        .slice(-5) // Last 5 messages for context
        .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
        .join('\n');
      
      qaPrompt += `\n\nCONVERSATION HISTORY:\n${historyText}`;
      console.log('🟢 Including conversation history:', conversationHistory.length, 'messages');
    }

    console.log(`🟢 Prompt length: ${qaPrompt.length} characters`);

    // Call Gemini API
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      throw new Error('Gemini API key is not configured');
    }

    console.log('🟢 Calling Gemini API...');
    const aiStartTime = Date.now();
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp'
    });
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: qaPrompt }] }],
      generationConfig: {
        temperature: 0.7, // More conversational than meal swap (0.5)
        maxOutputTokens: 300, // Allow longer responses for explanations
      }
    });
    
    const responseText = result.response.text();
    
    const aiTime = Date.now() - aiStartTime;
    console.log(`🟢 Gemini API responded in: ${aiTime}ms`);
    console.log('🟢 Response:', responseText.substring(0, 100) + '...');

    const totalTime = Date.now() - startTime;
    console.log(`⏱️ Total API execution time: ${totalTime}ms`);

    return NextResponse.json({
      answer: responseText.trim()
    } as QuestionResponse, { status: 200 });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`🟢 Ask question API failed after ${totalTime}ms:`, error);
    return NextResponse.json(
      { error: 'Failed to answer question' },
      { status: 500 }
    );
  }
}
