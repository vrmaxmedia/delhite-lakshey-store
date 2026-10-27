import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MODEL = "gemini-3.5-flash-lite";

function clean(value, max = 2000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured." },
        { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400, headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }

    const businessName = clean(body.businessName, 200);
    const category = clean(body.category, 200);
    const description = clean(body.description, 500);
    const city = clean(body.city, 200);
    const customInstruction = clean(body.customInstruction, 1000);
    const language = clean(body.language, 50) || "ENGLISH"; 
    const selectedService = clean(body.selectedService, 100) || "General Service";

    if (!businessName) {
      return NextResponse.json(
        { error: "Business name is required." },
        { status: 400, headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }

    const humanHooks = [
      "Style: Start directly with the core experience, product quality, or service satisfaction without any formal intro.",
      "Style: Start with a personal thought, moment, or visit realization.",
      "Style: Start with a casual, conversational expression about the utility, pricing, or staff behavior.",
      "Style: Start by highlighting a specific feature or aspect of the business directly."
    ];
    const chosenHook = humanHooks[Math.floor(Math.random() * humanHooks.length)];

    const lengthRule = "STRICT LENGTH: Write EXACTLY 3 to 4 short sentences maximum (Around 20 to 30 words). Keep it crisp, highly conversational, and unscripted like a real mobile typing session.";

    let languageRule = "";
    if (language.toUpperCase() === "HINGLISH") {
      languageRule = "LANGUAGE RULE: Write strictly in natural conversational Hinglish (Hindi-English mix in Latin script) matching the exact casual vibe of local customers (use words like 'ek number', 'paisa wasool', 'mast', 'badiya', 'yaar', 'sach mein').";
    } else {
      languageRule = "LANGUAGE RULE: Write strictly in clean, natural, middle-class English. Avoid corporate jargon or robotic templates completely.";
    }

    const uniqueNonce = Math.random().toString(36).substring(2, 10);

    const prompt = `
[Nonce: ${uniqueNonce}]
You are an authentic local customer writing an unscripted Google Maps review for a business based strictly on the provided profile details and quality guidelines.

Business Name: "${businessName}"
Category / Tagline: "${category}"
Business Description: "${description}"
Selected Focus / Chip Details: "${selectedService}"
Location / City: "${city}"

PAGE CUSTOM INSTRUCTION (Strictly follow this specific context):
"${customInstruction || "Write a genuine customer review based on the business category."}"

${chosenHook}
${lengthRule}
${languageRule}

CRITICAL EXECUTION RULES:
1. NO LOCATION FORCE START: Never start the review sentence forcefully with the city or area name. Let it flow naturally based on the user's experience.
2. 100% UNIQUE & HUMAN: Ensure zero pattern matching. Every generation must feel like a different real person typing casually from their phone.
3. RAW OUTPUT ONLY: Return ONLY the raw review text as a plain string. Do NOT use JSON, do NOT use quotes, and do NOT include any headings. Just write the review paragraph directly.
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 1.95,
            maxOutputTokens: 95,
          },
        }),
        signal: AbortSignal.timeout(25000),
      }
    );

    const responseJson = await response.json().catch(() => ({}));
    let rawReview = responseJson?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim() || "";

    rawReview = rawReview.replace(/^["']|["']$/g, "").trim();

    if (!rawReview) {
      return NextResponse.json(
        { error: "No usable draft was returned. Please try again." },
        { status: 502, headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }

    return NextResponse.json(
      {
        review: rawReview,
        reviews: [rawReview],
        selectedService,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong while generating the draft." },
      { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }
}
