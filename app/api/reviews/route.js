import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { businessName, category, description, city, selectedService, customInstruction, language } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API Key not configured." }, { status: 500 });
    }

    const openingStyles = [
      "bhai kasam se", "yaar sach bolu toh", "socha nahi tha ki", "dus jagah check karne ke baad",
      "pehli baar yaha aaya tha aur", "bhai ekdum maza aa gaya", "agar sach mein badiya deal chahiye toh",
      "outram lines wale store ka scene", "kasam se aisi dukaan", "market mein sabse hatke",
      "ghar wale bhi bol rahe the itna saaf phone kaise", "bhai mera experience sach mein ek number raha",
      "pehle thoda doubt tha par yaha aane ke baad", "kasam se yahan ke alawa ab kahin aur nahi jana"
    ];

    const lengthDirectives = [
      "Keep this review very short, crisp and punchy (strictly 1 to 2 short lines only, like a quick casual text)",
      "Keep this review medium-sized (around 3 lines covering the experience and price naturally)",
      "Make this review slightly detailed and descriptive with natural storytelling (4 to 5 lines covering checking multiple shops and store trust)"
    ];

    const randomOpening = openingStyles[Math.floor(Math.random() * openingStyles.length)];
    const randomLengthStyle = lengthDirectives[Math.floor(Math.random() * lengthDirectives.length)];
    const entropySalt = Math.random().toString(36).substring(2, 16);

    const systemPrompt = `You are an authentic local customer writing an unscripted, highly emotional and organic Google Maps review for ${businessName} located in ${city}.
Category/Focus: ${category}
Core Chip Focus: ${selectedService}
Client Guidelines: ${customInstruction}

CRITICAL FORMAT RULE: Do not output any internal drafting, mental outline, or thinking steps. Output ONLY the final review text directly and immediately.

ULTRA ANTI-PATTERN & LENGTH MANAGEMENT RULES (Entropy ID: ${entropySalt}):
1. LENGTH INSTRUCTION FOR THIS GENERATION: ${randomLengthStyle}. You must strictly follow this length constraint so that consecutive reviews never have the same line count.
2. UNIQUE OPENING STYLE: Never use a repetitive opening. You can start using a conversational hook like "${randomOpening}" or jump directly into the experience organically.
3. NATURAL TOPIC BLENDING: Naturally weave in topics like checking multiple shops across Delhi, getting unbeatable retail pricing, 100% original battery health, pristine mint condition, or friendly store staff without following any fixed formula.
4. ABSOLUTE ZERO FULL STOPS: Strictly DO NOT use full stops (.) at the end of sentences or anywhere in the review. Keep the text flowing continuously like a real WhatsApp message or casual chat.
5. LANGUAGE STYLE: Write strictly in ${language}. If Hinglish, use natural Roman Hindi mixed with casual conversational English words, avoiding any formal or robotic phrasing.`;

    const apiRes = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `Generate 1 completely unique, unscripted review adhering strictly to all anti-pattern and length rules. Salt: ${Math.random()}` }] }
        ],
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        generationConfig: {
          temperature: 1.3,
          topP: 0.99,
          maxOutputTokens: 250,
        }
      })
    });

    const data = await apiRes.json();
    if (!apiRes.ok) {
      throw new Error(data.error?.message || "Gemini API request failed.");
    }

    let reviewText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    if (reviewText.endsWith('.')) {
      reviewText = reviewText.slice(0, -1).trim();
    }

    return NextResponse.json({ review: reviewText });
  } catch (error) {
    console.error("API Review Generation Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate review draft." }, { status: 500 });
  }
}
