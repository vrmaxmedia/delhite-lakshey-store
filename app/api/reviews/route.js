import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request) {
  try {
    const body = await request.json();
    const { businessName, category, description, city, selectedService, customInstruction, language } = body;

    // Mega Anti-Pattern Dynamic Persona & Phrasing Arrays for Infinite Combinations
    const openingStyles = [
      "bhai kasam se", "yaar sach bolu toh", "socha nahi tha ki", "dus jagah check karne ke baad",
      "pehli baar yaha aaya tha aur", "bhai ekdum maza aa gaya", "agar sach mein badiya deal chahiye toh",
      "outram lines wale store ka scene", "kasam se aisi dukaan", "market mein sabse hatke",
      "ghar wale bhi bol rahe the itna saaf phone kaise", "bhai mera experience sach mein ek number raha",
      "pehle thoda doubt tha par yaha aane ke baad", "kasam se yahan ke alawa ab kahin aur nahi jana"
    ];

    const bodyTopics = [
      "battery health 100 percent mili jo ki socha nahi tha",
      "iphone 15 pro aur 14 dono ki condition bilkul scratchless thi",
      "lakshay bhai ka nature aur staff ka behavior bohot polite hai",
      "market mein 10 jagah ghumne ke baad sabse sasta aur best price yahin mila",
      "phone bilkul unplayed aur brand-new jaisa lag raha hai",
      "gtb nagar mein isse badiya shop mobile ke liye koi nahi hai",
      "pura paisa wasool ho gaya ek bhi fault nahi nikla phone mein"
    ];

    const randomOpening = openingStyles[Math.floor(Math.random() * openingStyles.length)];
    const randomTopic = bodyTopics[Math.floor(Math.random() * bodyTopics.length)];
    const entropySalt = Math.random().toString(36).substring(2, 15);

    const systemPrompt = `You are an authentic local customer writing an unscripted, highly emotional and organic Google Maps review for ${businessName} located in ${city}.
Category/Focus: ${category}
Core Chip Focus: ${selectedService}
Client Guidelines: ${customInstruction}

MEGA ANTI-PATTERN & RANDOMIZATION RULES (Entropy ID: ${entropySalt}):
1. UNIQUE OPENING STYLE: Never use a repetitive opening. You can start using a conversational style like "${randomOpening}" or jump directly into the experience organically.
2. DYNAMIC LENGTH MANAGEMENT: Randomly alter the sentence length and structure on every call. Make some reviews short and punchy (1-2 lines), some medium (3 lines), and some slightly detailed storytelling (4-5 lines).
3. NATURAL TOPIC BLENDING: Naturally weave in topics like checking multiple shops across Delhi, getting unbeatable retail pricing, 100% original battery health, pristine mint condition, or friendly store staff without following any fixed formula.
4. ABSOLUTE ZERO FULL STOPS: Strictly DO NOT use full stops (.) at the end of sentences or anywhere in the review. Keep the text flowing continuously like a real WhatsApp message or casual chat.
5. LANGUAGE STYLE: Write strictly in ${language}. If Hinglish, use natural Roman Hindi mixed with casual conversational English words, avoiding any formal or robotic phrasing.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: `Incorporate random angle hint: "${randomOpening} ... ${randomTopic}". Generate 1 completely unique, unscripted review adhering strictly to all anti-pattern rules. Salt: ${Math.random()}` }] }
      ],
      config: {
        systemInstruction: systemPrompt,
        temperature: 1.25, // Maximum temperature for ultimate creativity and zero repetition
        topP: 0.98,
        maxOutputTokens: 250,
      }
    });

    let reviewText = response.text ? response.text.trim() : '';

    // Clean up any trailing full stop to preserve the natural chat flow
    if (reviewText.endsWith('.')) {
      reviewText = reviewText.slice(0, -1).trim();
    }

    return NextResponse.json({ review: reviewText });
  } catch (error) {
    console.error("API Review Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate review draft." }, { status: 500 });
  }
}
