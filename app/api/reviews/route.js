import { NextResponse } from 'next/server';

const MODEL = 'gemini-3.5-flash';

async function callGemini(apiKey, payload) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );
  const data = await res.json();
  return { res, data };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      businessName,
      category,
      description,
      city,
      selectedService,
      customInstruction,
      language,
    } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API Key not configured." }, { status: 500 });
    }

    const languageRule =
      language === 'HINGLISH'
        ? 'Write in Hinglish (Hindi words written in English/Roman script, casual Delhi style). Do not use Devanagari.'
        : 'Write in simple, natural English.';

    const systemPrompt = `${customInstruction || `You are a real customer writing a Google Maps review for ${businessName}.`}

Business: ${businessName}
Location: ${city}
Category: ${category}
About: ${description || ''}
Focus of this review: ${selectedService}
Language: ${languageRule}

Write one complete, natural review. Always finish the last sentence fully, never cut off in the middle. Output only the review text, nothing else.`;

    const payload = {
      contents: [
        { role: 'user', parts: [{ text: `Write a complete review for ${businessName}.` }] },
      ],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        temperature: 0.9,
        topP: 0.95,
        maxOutputTokens: 1024,
        thinkingConfig: { thinkingBudget: 0 },
      },
    };

    let { res: apiRes, data } = await callGemini(apiKey, payload);

    // Agar model thinkingConfig support na kare to bina uske dobara try karo
    if (!apiRes.ok && /thinking/i.test(data.error?.message || '')) {
      delete payload.generationConfig.thinkingConfig;
      ({ res: apiRes, data } = await callGemini(apiKey, payload));
    }

    if (!apiRes.ok) {
      throw new Error(data.error?.message || "Gemini API request failed.");
    }

    const parts = data.candidates?.[0]?.content?.parts || [];
    const reviewText = parts
      .filter((p) => !p.thought)
      .map((p) => p.text || '')
      .join('')
      .trim();

    if (!reviewText) {
      throw new Error("Empty response from Gemini.");
    }

    return NextResponse.json({ review: reviewText });
  } catch (error) {
    console.error("API Review Generation Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate review draft." },
      { status: 500 }
    );
  }
}
