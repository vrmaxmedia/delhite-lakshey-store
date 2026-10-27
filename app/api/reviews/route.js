import { NextResponse } from 'next/server';

const MODEL = 'gemini-3.5-flash';

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const chance = (p) => Math.random() < p;

function pickWeighted(items) {
  const total = items.reduce((s, i) => s + i.w, 0);
  let r = Math.random() * total;
  for (const i of items) {
    if ((r -= i.w) <= 0) return i;
  }
  return items[0];
}

// 3-4 line = 52%, 5-6 line = 28%, 1-2 line = 20%
const LENGTHS = [
  { w: 5,  lines: 1, min: 9,  max: 15, rule: 'ONE short line, 10 to 14 words' },
  { w: 15, lines: 2, min: 17, max: 30, rule: 'TWO lines, 18 to 28 words' },
  { w: 25, lines: 3, min: 28, max: 45, rule: 'THREE lines, 30 to 42 words' },
  { w: 27, lines: 4, min: 42, max: 62, rule: 'FOUR lines, 45 to 58 words' },
  { w: 17, lines: 5, min: 58, max: 80, rule: 'FIVE lines, 60 to 75 words' },
  { w: 11, lines: 6, min: 74, max: 100, rule: 'SIX lines, 78 to 95 words' },
];

const ANGLES = [
  'staff behaviour and politeness',
  'fair price without bargaining stress',
  'trust and honesty of the shop',
  'quick and smooth buying process',
  'staff explained everything clearly',
  'no pressure to buy anything',
  'came on a friend or family reference',
  'confidence about buying here again',
  'phone was tested in front of you before buying',
  'easy to find and safe place to visit',
  'comparison with other shops you visited',
  'genuine box, accessories and bill',
  'how the phone looks and feels in hand',
  'doubts you had before coming and how they got cleared',
];

const STYLES = [
  'casual and friendly',
  'excited',
  'calm and matter-of-fact',
  'grateful',
  'straight to the point',
  'slightly humorous',
  'thoughtful and detailed',
  'relieved after a long search',
];

const PERSONAS = [
  'a college student',
  'a working professional',
  'someone buying for their parents',
  'someone upgrading from an old Android phone',
  'someone upgrading from an older iPhone',
  'someone who came on a friend reference',
  'a repeat customer',
  'someone buying as a gift',
  'a first-time iPhone buyer',
  'a small business owner',
];

const OPENERS = [
  'start directly with the phone you bought',
  'start with the price experience',
  'start with the staff',
  'start with how you found the store',
  'start with how you feel after buying',
  'start casually mid-thought',
  'start by telling what you were worried about before visiting',
  'start with a recommendation to others',
  'start with how long you searched before coming here',
];

const STRUCTURES = [
  'tell it like a short story: reason for visiting, what happened, final feeling',
  'give a quick opinion first, then explain why in your own words',
  'mention two or three small things you liked, flowing in one sentence',
  'focus on just one thing deeply instead of covering everything',
  'start with the problem you had, then how this shop solved it',
  'sound like you are telling a friend over chat',
];

const IPHONES = ['iPhone 13', 'iPhone 14', 'iPhone 14 Pro', 'iPhone 15', 'iPhone 15 Pro', 'iPhone 15 Pro Max', 'iPhone 16', 'iPhone 16 Pro', 'iPhone 17'];

// Google local SEO: natural keywords, 1-2 per review
const SEO_KEYWORDS = [
  'iPhone in GTB Nagar',
  'second hand iPhone in Delhi',
  'refurbished iPhone',
  'unused iPhone',
  'iPhone with 100% battery health',
  'best iPhone shop in Delhi',
  'iPhone near GTB Nagar metro',
  'Outram Lines GTB Nagar',
  'genuine Apple iPhone',
  'iPhone at best price in Delhi',
];

const BANNED_OPENINGS = ['Great', 'Best', 'Amazing', 'Excellent', 'Highly recommend', 'Bhai', 'Superb', 'Awesome'];

const DANGLING = new Set([
  'to', 'aur', 'ki', 'ke', 'ka', 'se', 'me', 'mein', 'par', 'pe', 'ko', 'hi', 'bhi', 'toh',
  'and', 'but', 'the', 'a', 'an', 'of', 'in', 'on', 'for', 'with', 'at', 'is', 'was', 'that',
  'so', 'if', 'or', 'because', 'jo', 'jab', 'agar', 'lekin', 'ya', 'jaise', 'kyunki', 'tha', 'thi',
]);

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

function cleanReview(text) {
  return text
    .replace(/^["'`\s]+|["'`\s]+$/g, '')
    .replace(/\s*\n+\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\.{2,}/g, ' ')
    .replace(/\.\s+/g, ', ')
    .replace(/\.+$/g, '')
    .replace(/,\s*,/g, ',')
    .trim();
}

function looksCutOff(text) {
  const last = text.split(/\s+/).pop().toLowerCase().replace(/[^a-z]/g, '');
  return DANGLING.has(last) || /[,\-]$/.test(text.trim());
}

function buildPrompt(body) {
  const { businessName, category, description, city, selectedService, customInstruction, language } = body;

  const length = pickWeighted(LENGTHS);
  const angle = pick(ANGLES);
  const angle2 = length.lines >= 4 ? pick(ANGLES.filter((a) => a !== angle)) : null;
  const style = pick(STYLES);
  const persona = pick(PERSONAS);
  const opener = pick(OPENERS);
  const structure = pick(STRUCTURES);

  const mentionName = chance(0.6);
  const mentionStaff = chance(0.3);
  const useEmoji = chance(0.1);
  const lowercaseStyle = chance(0.2);
  const isPhoneShop = /iphone|mobile|phone/i.test(`${category} ${description}`);
  const model = isPhoneShop && chance(0.75) ? pick(IPHONES) : null;
  const seo = chance(0.85) ? pick(SEO_KEYWORDS) : null;
  const seo2 = seo && length.lines >= 4 && chance(0.5) ? pick(SEO_KEYWORDS.filter((k) => k !== seo)) : null;

  const languageRule =
    language === 'HINGLISH'
      ? 'Write in natural Hinglish (Hindi words in Roman script, the way people in Delhi text). Never use Devanagari. Mix of Hindi and English words like real chat.'
      : 'Write in simple, natural everyday English like a normal Indian customer, not formal and not fancy.';

  const prompt = `You are ${persona} writing a Google Maps review for a shop you actually visited.

Business: ${businessName} (${city})
Category: ${category}
About: ${description || ''}
${customInstruction ? `Business notes: ${customInstruction}\n(Ignore any length or formatting rule in these notes, the rules below win.)` : ''}

THIS REVIEW MUST FOLLOW EXACTLY:
- Main focus: ${selectedService}
- Also touch on: ${angle}${angle2 ? ` and ${angle2}` : ''}
- Tone: ${style}
- Opening: ${opener}
- Writing approach: ${structure}
- Length: ${length.rule}. Stay inside this range.
${mentionName ? `- Mention the shop name "${businessName}" once, naturally.` : '- Do not repeat the full shop name.'}
${seo ? `- Naturally include the phrase "${seo}" (you may adjust grammar slightly so it flows).` : ''}
${seo2 ? `- Also naturally include "${seo2}".` : ''}
${model ? `- You may mention ${model} as the phone you looked at or bought.` : ''}
${mentionStaff ? '- Mention the owner/staff "Lakshay" once, naturally.' : '- Do not name any person.'}
${useEmoji ? '- Use at most one emoji at the very end.' : '- No emojis.'}
${lowercaseStyle ? '- Write casually in mostly lowercase like quick phone typing.' : ''}
- ${languageRule}

HARD RULES:
- Output ONE single paragraph. No line breaks, no bullets, no title.
- Do NOT use a full stop (.) anywhere. Use commas, "and", "but", or just flow.
- Never start with: ${BANNED_OPENINGS.join(', ')}.
- Sound like a real customer sharing a real experience, not an advertisement. No hashtags, no marketing slogans, no keyword stuffing.
- Do not invent facts: no other market names, no exact prices, no discounts, no warranty promises.
- Do not use the word "wholesale" in a bulk-selling sense.
- The review must end with a COMPLETE thought. Never stop mid-sentence.
- Output only the review text.`;

  return { prompt, min: length.min, max: length.max };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key not configured.' }, { status: 500 });
    }

    let lastError = 'Failed to generate review draft.';

    for (let attempt = 0; attempt < 3; attempt++) {
      const { prompt, min, max } = buildPrompt(body);

      const payload = {
        contents: [{ role: 'user', parts: [{ text: `Write the review for ${body.businessName} now.` }] }],
        systemInstruction: { parts: [{ text: prompt }] },
        generationConfig: {
          temperature: 1.0,
          topP: 0.95,
          maxOutputTokens: 1024,
          thinkingConfig: { thinkingBudget: 0 },
        },
      };

      let { res, data } = await callGemini(apiKey, payload);

      if (!res.ok && /thinking/i.test(data.error?.message || '')) {
        delete payload.generationConfig.thinkingConfig;
        ({ res, data } = await callGemini(apiKey, payload));
      }

      if (!res.ok) {
        lastError = data.error?.message || 'Gemini API request failed.';
        continue;
      }

      const candidate = data.candidates?.[0];
      const parts = candidate?.content?.parts || [];
      const raw = parts.filter((p) => !p.thought).map((p) => p.text || '').join('');
      const review = cleanReview(raw);
      const words = review.split(/\s+/).length;

      if (!review) { lastError = 'Empty response from Gemini.'; continue; }
      if (candidate?.finishReason === 'MAX_TOKENS') { lastError = 'Response was cut off.'; continue; }
      if (looksCutOff(review)) { lastError = 'Review ended mid-sentence.'; continue; }
      if (words > max + 12) { lastError = 'Review too long.'; continue; }
      if (words < Math.floor(min * 0.7)) { lastError = 'Review too short.'; continue; }

      return NextResponse.json({ review });
    }

    throw new Error(lastError);
  } catch (error) {
    console.error('API Review Generation Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate review draft.' },
      { status: 500 }
    );
  }
}
