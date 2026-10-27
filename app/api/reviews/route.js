import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { businessName, category, description, city, selectedService, customInstruction, language } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API Key not configured." }, { status: 500 });
    }

    const systemPrompt = `You are a real local customer writing an unscripted, casual Google Maps review for ${businessName} in ${city}.
Category/Focus: ${category}
Service Focus: ${selectedService}
Guidelines: ${customInstruction}
Language: ${language}

CRITICAL RULES:
1. Output ONLY the raw review text directly. NEVER include any markdown titles, labels like "Draft 1:", "Opening Hook:", bold headers, or prefix text.
2. Write naturally like a real human chat or WhatsApp message.
3. ABSOLUTE ZERO FULL STOPS: Strictly do not use full stops (.) anywhere in the text.
4. Keep the length concise (2 to 3 natural lines) and complete the sentence fully without cutting off.`;

    const apiRes = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `Write 1 organic, fully finished, unique review for ${businessName} focusing on ${selectedService}.` }] }
        ],
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        generationConfig: {
          temperature: 0.65, // Lower temperature to prevent hallucination, drafting titles, and cutting off
          topP: 0.9,
          maxOutputTokens: 250,
        }
      })
    });

    const data = await apiRes.json();
    if (!apiRes.ok) {
      throw new Error(data.error?.message || "Gemini API request failed.");
    }

    let reviewText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    // AGGRESSIVE CLEANING LAYER: Strip out any accidental prefix headers or markdown labels from the AI
    reviewText = reviewText
      .replace(/^.*?(?:Draft\s*\d*[:*]*|Hook[:*]*|Review[:*]*|\*\*.*?\*\*)\s*/gi, '')
      .replace(/^[#*_-\s]+/g, '')
      .trim();

    if (reviewText.endsWith('.')) {
      reviewText = reviewText.slice(0, -1).trim();
    }

    return NextResponse.json({ review: reviewText });
  } catch (error) {
    console.error("API Review Generation Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate review draft." }, { status: 500 });
  }
}
