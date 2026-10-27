import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { businessName, category, description, city, selectedService, customInstruction, language } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API Key not configured." }, { status: 500 });
    }

    const systemPrompt = `You are a genuine local customer writing a complete, natural Google Maps review for ${businessName} in ${city}.
Category: ${category}
Focus: ${selectedService}
Instructions: ${customInstruction}
Language: ${language}

CRITICAL REQUIREMENTS:
1. Write a complete, full review (at least 3 to 4 natural sentences long) covering the store experience, pricing, and product quality. Never cut off mid-sentence.
2. Output ONLY the raw review text. No headings, no draft labels, no markdown formatting.
3. ABSOLUTE ZERO FULL STOPS: Strictly do not use full stops (.) anywhere in the text.`;

    const apiRes = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `Write a complete and detailed review for ${businessName} focusing on ${selectedService}.` }] }
        ],
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          maxOutputTokens: 400, // Increased tokens so reviews never get cut off
        }
      })
    });

    const data = await apiRes.json();
    if (!apiRes.ok) {
      throw new Error(data.error?.message || "Gemini API request failed.");
    }

    let reviewText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    // Clean up any accidental prefixes
    reviewText = reviewText.replace(/^.*?(?:Draft\s*\d*[:*]*|Hook[:*]*|Review[:*]*|\*\*.*?\*\*)\s*/gi, '').trim();

    if (reviewText.endsWith('.')) {
      reviewText = reviewText.slice(0, -1).trim();
    }

    return NextResponse.json({ review: reviewText });
  } catch (error) {
    console.error("API Review Generation Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate review draft." }, { status: 500 });
  }
}
