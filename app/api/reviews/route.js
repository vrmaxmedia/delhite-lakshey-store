import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { businessName, category, description, city, selectedService, customInstruction, language } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API Key not configured." }, { status: 500 });
    }

    const systemPrompt = `You are a real local customer writing a casual, unscripted Google Maps review for ${businessName} located in ${city}.
Category/Focus: ${category}
Service Focus: ${selectedService}
Guidelines: ${customInstruction}
Language: ${language}

CRITICAL RULES:
1. Output ONLY the raw review text directly. Do not include any titles, labels like "Opening Hook:", or formatting headers.
2. Keep it natural, conversational, like a real WhatsApp message or casual chat.
3. ABSOLUTE ZERO FULL STOPS: Strictly do not use full stops (.) anywhere in the text.
4. Keep the length concise (2 to 3 lines) and complete it fully without cutting off.`;

    const apiRes = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `Write 1 organic and unique review for ${businessName}.` }] }
        ],
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          maxOutputTokens: 250,
        }
      })
    });

    const data = await apiRes.json();
    if (!apiRes.ok) {
      throw new Error(data.error?.message || "Gemini API request failed.");
    }

    let reviewText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    // Clean up any accidental markdown headers if model generates them
    reviewText = reviewText.replace(/^.*?(?:Review:|Hook:|\*\*).*?\n/i, '').trim();

    if (reviewText.endsWith('.')) {
      reviewText = reviewText.slice(0, -1).trim();
    }

    return NextResponse.json({ review: reviewText });
  } catch (error) {
    console.error("API Review Generation Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate review draft." }, { status: 500 });
  }
}
