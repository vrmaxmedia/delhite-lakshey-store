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

// ~8 words = 1 line on phone
const LENGTHS = [
  { w: 8,  lines: 1, min: 7,  max: 11, rule: 'ONE short line, 7 to 10 words' },
  { w: 8,  lines: 2, min: 13, max: 21, rule: 'TWO lines, 14 to 20 words' },
  { w: 34, lines: 3, min: 21, max: 31, rule: 'THREE lines, 22 to 30 words' },
  { w: 34, lines: 4, min: 30, max: 42, rule: 'FOUR lines, 32 to 40 words' },
  { w: 16, lines: 5, min: 40, max: 52, rule: 'FIVE lines, 42 to 50 words' },
];

function chooseLength(recent) {
  const lens = recent.map((r) => r.lines).filter(Boolean);
  const l1 = lens[lens.length - 1];
  const l2 = lens[lens.length - 2];
  const l3 = lens[lens.length - 3];
  let pool = LENGTHS;

  const mid = (n) => n === 3 || n === 4;
  if (lens.length >= 3 && mid(l1) && mid(l2) && mid(l3)) {
    pool = LENGTHS.filter((x) => !mid(x.lines)); // 1, 2 ya 5
  } else if (l1 && !mid(l1)) {
    pool = LENGTHS.filter((x) => mid(x.lines)); // off-pattern ke baad wapas 3-4
  }
  if (l1 && l1 === l2) {
    const f = pool.filter((x) => x.lines !== l1);
    if (f.length) pool = f;
  }
  return pickWeighted(pool);
}

const VOICES = [
  {
    id: 'desi',
    text: 'a simple desi Delhi person, speaks plain and rough, short sentences, no fancy words, a little loose grammar is fine',
  },
  {
    id: 'family',
    text: 'a middle class family person, practical and careful with money, talks about family or parents, honest and simple',
  },
  {
    id: 'professional',
    text: 'an educated working professional, polished and clear, well-structured sentences, calm and respectful tone',
  },
  {
    id: 'young',
    text: 'a college-age youngster, casual and slangy, quick typing style, energetic',
  },
  {
    id: 'uncle',
    text: 'an older respectful person (uncle ji), polite, simple words, blesses or thanks the shopkeeper',
  },
  {
    id: 'blunt',
    text: 'a straightforward no-nonsense person, few words, says only what mattered to him',
  },
];

function chooseVoice(recent) {
  const last = recent.map((r) => r.voice).filter(Boolean).slice(-2);
  const pool = VOICES.filter((v) => !last.includes(v.id));
  return pick(pool.length ? pool : VOICES);
}

// Topics: "All" me random, baaki tags me chip ka apna topic
const TOPICS = {
  location: {
    id: 'location',
    text: 'the location: easy to find in GTB Nagar near the metro, Outram Lines, safe and convenient to reach',
    must: /gtb|outram|metro|location|jagah|rasta|nazdik|paas|easy to find|aasani|market/i,
  },
  politeness: {
    id: 'politeness',
    text: 'the behaviour of the staff: polite, patient, no pressure, explained everything properly',
    must: /staff|behav|polite|patient|samjhaya|dikhaya|baat|nature|pressure|lakshay|respect|attend/i,
  },
  pricing: {
    id: 'pricing',
    text: 'the price: fair and the best deal he found, no hidden charges, bargaining was not a headache',
    must: /price|rate|daam|paise|deal|budget|cheap|sasta|saste|pocket|bargain|kimat|value/i,
  },
  quality: {
    id: 'quality',
    text: 'the phone quality: clean mint condition, no scratches, genuine, tested before buying',
    must: /condition|quality|scratch|mint|genuine|original|tested|check|body|new|fresh|piece|clean/i,
  },
  trust: {
    id: 'trust',
    text: 'trust: honest dealing, genuine bill and box, felt safe buying here',
    must: /trust|honest|bharosa|bill|genuine|original|safe|vishwas|fraud|dhokha|box|reliable/i,
  },
  battery: {
    id: 'battery',
    text: 'the battery: 100% battery health shown and checked, great backup',
    must: /battery|backup|100/i,
  },
  models: {
    id: 'models',
    text: 'the iPhone models available (iPhone 13 to 17 series) and finding the exact model he wanted',
    must: /iphone|13|14|15|16|17|model|pro/i,
  },
};

const CHIP_TOPIC = {
  'iPhone 13 to 17': 'models',
  '100% Battery Health': 'battery',
  'Mint Condition': 'quality',
  'Best Market Price': 'pricing',
  'GTB Nagar Store': 'location',
};

const ALL_TOPICS = ['location', 'politeness', 'pricing', 'quality', 'trust'];

function chooseTopic(selectedService, recent) {
  const label = String(selectedService || '').split(' (Context')[0].trim();
  if (CHIP_TOPIC[label]) return TOPICS[CHIP_TOPIC[label]];
  const last = recent.map((r) => r.topic).filter(Boolean).slice(-2);
  const pool = ALL_TOPICS.filter((t) => !last.includes(t));
  return TOPICS[pick(pool.length ? pool : ALL_TOPICS)];
}

const OPENERS = [
  'start with the phone or what you bought',
  'start with the shop or the area',
  'start with the shopkeeper or staff',
  'start with how you feel now',
  'start with why you came here',
  'start in the middle of a thought, casually',
];

const IPHONES = ['iPhone 13', 'iPhone 14', 'iPhone 14 Pro', 'iPhone 15', 'iPhone 15 Pro', 'iPhone 15 Pro Max', 'iPhone 16', 'iPhone 16 Pro', 'iPhone 17'];

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

const BANNED_OPENINGS = ['Great', 'Best', 'Amazing', 'Excellent', 'Highly recommend', 'Bhai', 'Superb', 'Awesome', 'The staff here'];

const DANGLING = new Set([
  'to', 'aur', 'ki', 'ke', 'ka', 'se', 'me', 'mein', 'par', 'pe', 'ko', 'toh',
  'and', 'but', 'the', 'a', 'an', 'of', 'in', 'on', 'for', 'with', 'at', 'that',
  'so', 'if', 'or', 'because', 'jo', 'jab', 'agar', 'lekin', 'ya', 'jaise', 'kyunki',
]);

const HINDI_WORDS = new Set([
  'hai', 'hain', 'nahi', 'nahin', 'bahut', 'bohot', 'bhot', 'mera', 'meri', 'mere', 'mujhe', 'hume',
  'aur', 'ki', 'ke', 'ka', 'ko', 'se', 'par', 'pe', 'tha', 'thi', 'the', 'kiya', 'mila', 'mil', 'gaya', 'gayi',
  'liya', 'wala', 'wale', 'jo', 'kaafi', 'accha', 'acha', 'achha', 'sach', 'yahan', 'yaha', 'kar', 'karke', 'raha',
  'rahe', 'rahi', 'laga', 'lagi', 'bilkul', 'ekdum', 'sab', 'kuch', 'koi', 'phir', 'fir', 'bhi', 'toh', 'lekin',
  'isliye', 'abhi', 'dekh', 'dekha', 'diya', 'dikhaya', 'samjhaya', 'sahi', 'dukaan', 'dukan', 'aap', 'aapne',
  'paise', 'kam', 'jyada', 'zyada', 'badhiya', 'mast', 'yaar',
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

function hindiCount(text) {
  return text.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter((w) => HINDI_WORDS.has(w)).length;
}

function languageOk(text, language, words) {
  const h = hindiCount(text);
  if (language === 'HINGLISH') return h >= Math.max(3, Math.floor(words * 0.2));
  return h <= 2;
}

function buildPrompt(body, recent) {
  const { businessName, category, description, city, selectedService, language } = body;

  const length = chooseLength(recent);
  const voice = chooseVoice(recent);
  const topic = chooseTopic(selectedService, recent);
  const opener = pick(OPENERS);

  const mentionName = chance(0.5);
  const mentionStaff = topic.id === 'politeness' ? chance(0.5) : chance(0.15);
  const useEmoji = chance(0.08);
  const model = chance(0.55) ? pick(IPHONES) : null;
  const seo = chance(0.8) ? pick(SEO_KEYWORDS) : null;
  const secondPoint = length.lines >= 4 && chance(0.5);

  const languageBlock =
    language === 'HINGLISH'
      ? `LANGUAGE (MOST IMPORTANT): Write in HINGLISH = Hindi sentences typed in English/Roman letters, like a Delhi person on WhatsApp. Grammar must be Hindi (hai, tha, kiya, mila, nahi, bahut, aur, ke liye, wala etc.) with common English words like phone, battery, price, staff mixed in. Product names and keywords can stay in English. Never write a full English sentence. Never use Devanagari.`
      : `LANGUAGE (MOST IMPORTANT): Write in simple natural English like an Indian customer. Do not use Hindi words.`;

  const prompt = `${languageBlock}

You are ${voice.text}. You bought a phone from this shop and are writing a Google Maps review.

Business: ${businessName} (${city})
Category: ${category}
About: ${description || ''}

REVIEW RULES:
- Main topic of the review: ${topic.text}. The review must clearly be about this.
${secondPoint ? '- You may add one small extra point at the end, from any other area.' : '- Stick to the main topic only.'}
- Voice: write exactly like the person described above, so this review sounds different from other customers.
- Opening: ${opener}
- Length: ${length.rule}. Stay inside this range.
${mentionName ? `- Mention the shop name "${businessName}" once, naturally.` : '- Do not repeat the full shop name.'}
${seo ? `- If it fits naturally, include the phrase "${seo}".` : ''}
${model ? `- You may mention ${model}.` : ''}
${mentionStaff ? '- Mention the owner/staff "Lakshay" once, naturally.' : '- Do not name any person.'}
${useEmoji ? '- One emoji at the very end is allowed.' : '- No emojis.'}

HARD RULES:
- ONE single paragraph. No line breaks, bullets or title.
- Do NOT use a full stop (.) anywhere. Use commas, "aur"/"and", or just flow.
- Never start with: ${BANNED_OPENINGS.join(', ')}.
- Sound like a real customer, not an advertisement. No hashtags, slogans or keyword stuffing.
- Do not invent facts: no other market names, no exact prices, no discounts, no warranty promises.
- Do not use the word "wholesale".
- End with a COMPLETE thought. Never stop mid-sentence.
- Output only the review text.`;

  return { prompt, length, voice, topic };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key not configured.' }, { status: 500 });
    }

    const recent = (Array.isArray(body.recentLengths) ? body.recentLengths : [])
      .filter((r) => r && typeof r === 'object')
      .slice(-6);

    let lastError = 'Failed to generate review draft.';

    for (let attempt = 0; attempt < 4; attempt++) {
      const { prompt, length, voice, topic } = buildPrompt(body, recent);

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
      const words = review.split(/\s+/).filter(Boolean).length;

      if (!review) { lastError = 'Empty response from Gemini.'; continue; }
      if (candidate?.finishReason === 'MAX_TOKENS') { lastError = 'Response was cut off.'; continue; }
      if (looksCutOff(review)) { lastError = 'Review ended mid-sentence.'; continue; }
      if (words > length.max + 8) { lastError = 'Review too long.'; continue; }
      if (words < Math.floor(length.min * 0.75)) { lastError = 'Review too short.'; continue; }
      if (!languageOk(review, body.language, words)) { lastError = 'Wrong language style.'; continue; }
      if (!topic.must.test(review)) { lastError = 'Review missed the selected topic.'; continue; }

      return NextResponse.json({
        review,
        meta: { lines: length.lines, voice: voice.id, topic: topic.id },
      });
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
