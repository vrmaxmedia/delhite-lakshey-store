import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/* =====================================================================
   SETTINGS (speed)
   ===================================================================== */
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const PARALLEL_CALLS = 2;      // ek saath 2 calls, jo pehle sahi aaye wahi use hoga
const MAX_ROUNDS = 2;          // sab fail hone par sirf ek aur round
const CALL_TIMEOUT_MS = 12000; // Gemini 12 sec me na de to cancel
const MAX_OUTPUT_TOKENS = 300;
const HISTORY_SIZE = 60;       // server par yaad rakhe gaye pichhle reviews

/* =====================================================================
   BUSINESS PACK  (naye business/category ke liye sirf yahi hissa badlega)
   ===================================================================== */
const OWNER_NAME = process.env.OWNER_NAME || 'Lakshay';
const PRODUCT_WORD = 'phone';

// iPhone 12 se 18: naye models (15 se upar) zyada aate hain, purane (12, 13) kam
// w = us series ka weight, variants = us series ke models (Pro, Pro Max waghera)
const MODEL_SERIES = [
  { n: '12', w: 1,  variants: [['iPhone 12', 3], ['iPhone 12 Pro', 2], ['iPhone 12 Pro Max', 1]] },
  { n: '13', w: 2,  variants: [['iPhone 13', 3], ['iPhone 13 Pro', 2], ['iPhone 13 Pro Max', 2]] },
  { n: '14', w: 4,  variants: [['iPhone 14', 3], ['iPhone 14 Plus', 1], ['iPhone 14 Pro', 2], ['iPhone 14 Pro Max', 2]] },
  { n: '15', w: 8,  variants: [['iPhone 15', 3], ['iPhone 15 Plus', 1], ['iPhone 15 Pro', 3], ['iPhone 15 Pro Max', 3]] },
  { n: '16', w: 10, variants: [['iPhone 16', 3], ['iPhone 16 Plus', 1], ['iPhone 16 Pro', 3], ['iPhone 16 Pro Max', 3]] },
  { n: '17', w: 10, variants: [['iPhone 17', 3], ['iPhone 17 Pro', 3], ['iPhone 17 Pro Max', 3]] },
  { n: '18', w: 5,  variants: [['iPhone 18', 3], ['iPhone 18 Pro', 3], ['iPhone 18 Pro Max', 3]] },
];


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
  'iPhone 14 price in GTB Nagar',
  'iPhone 15 Pro in Delhi',
  'used iPhone Delhi',
  'iPhone shop near GTB Nagar',
  'Apple iPhone dealer in Delhi',
  'iPhone 13 in GTB Nagar',
  'trusted iPhone store in Delhi',
  'iPhone 16 in Delhi',
  'imported iPhone in Delhi',
  'second hand iPhone near GTB Nagar',
];

// Topics: id, prompt text, aur check regex (review me in me se koi shabd hona chahiye)
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
    text: 'the iPhone models available (iPhone 12 to 18 series) and finding the exact model he wanted',
    must: /iphone|12|13|14|15|16|17|18|model|pro/i,
  },
  refurb: {
    id: 'refurb',
    text: 'the phone is a refurbished iPhone that looks and works like new, he knew it was refurbished and was still very satisfied',
    must: /refurb|renew|second hand|second-hand|used|pre[- ]?owned|like new|naya jaisa|naye jaisa/i,
  },
  unused: {
    id: 'unused',
    text: 'an unused, fresh-piece iPhone, never used before, felt like a new phone',
    must: /unused|new|fresh|sealed|never used|naya|ekdum|piece/i,
  },
  camera: {
    id: 'camera',
    text: 'the camera: photos and videos looked clear and sharp, he checked the camera before buying',
    must: /camera|photo|video|pic|selfie|clear|sharp/i,
  },
  screen: {
    id: 'screen',
    text: 'the screen: clean bright display, smooth touch, no marks or scratches on it',
    must: /screen|display|touch|scratch|bright|clean|mark/i,
  },
  speed: {
    id: 'speed',
    text: 'the performance: phone runs smooth and fast, no lag or hanging',
    must: /smooth|fast|lag|hang|speed|perform|chal|tez|fatafat/i,
  },
  advice: {
    id: 'advice',
    text: 'honest guidance: the shopkeeper suggested the model that suits the need and budget, did not push the costly one',
    must: /advice|suggest|guide|salah|budget|model|samjhaya|batay|sahi|bataya|zaroorat|need/i,
  },
  testing: {
    id: 'testing',
    text: 'testing: every function of the phone was checked in front of him before paying',
    must: /test|check|dikhaya|front|saamne|samne|function|sab kuch|jaanch/i,
  },
};

// Chips = keywords. Customer jo chip dabaye, review me wahi baat aani chahiye.
// text = Gemini ko kya batana hai, must = review me kaun se shabd hone chahiye (check)
const CHIPS = {
  'Refurbished': { id: 'chip_refurb', text: 'the iPhone is a refurbished one that looks and works like new', must: /refurb|renew|second hand|second-hand|pre[- ]?owned|like new|naya jaisa|naye jaisa|used/i },
  'Unused': { id: 'chip_unused', text: 'the iPhone is unused, a fresh piece', must: /unused|fresh|sealed|never used|naya|ekdum new|new piece|piece/i },
  'iPhone 12 to 18': { id: 'chip_models', text: 'he found the iPhone model he wanted', must: /iphone|model|pro/i }, // model/must buildPrompt me set hota hai
  '100% Battery': { id: 'chip_battery', text: 'the battery health was shown as 100% and checked, good backup', must: /battery|backup|100/i },
  'Mint Condition': { id: 'chip_mint', text: 'the phone is in mint condition, clean body, no scratches', must: /mint|condition|scratch|clean|body|perfect/i },
  'Best Price': { id: 'chip_price', text: 'the price was fair and the best he found, no hidden charges', must: /price|rate|daam|paise|deal|budget|sasta|saste|pocket|kimat|value/i },
  'Bill & Box': { id: 'chip_bill', text: 'he got a genuine bill and box, felt safe and trusted the shop', must: /bill|box|genuine|original|trust|bharosa|safe|vishwas/i },
  'Camera & Screen': { id: 'chip_tested', text: 'camera, screen and every function were tested in front of him before paying', must: /camera|screen|display|test|check|dikhaya|function/i },
  'Honest Advice': { id: 'chip_advice', text: 'the shopkeeper gave honest guidance, was polite and did not push the costly phone', must: /advice|suggest|guide|honest|salah|samjhaya|bataya|polite|patient|pressure|behav/i },
  'GTB Nagar': { id: 'chip_location', text: 'the store is easy to find in GTB Nagar near the metro, Outram Lines', must: /gtb|outram|metro|location|jagah|rasta|nazdik|paas|easy to find|aasani/i },
};

const ALL_TOPICS = ['location', 'politeness', 'pricing', 'quality', 'trust', 'battery', 'models', 'refurb', 'unused', 'camera', 'screen', 'speed', 'advice', 'testing'];

// Likhne wale 13 type ke customers (class, umar, andaaz)
const PERSONAS = [
  { id: 'desi', text: 'a simple desi Delhi person, speaks plain and rough, short sentences, no fancy words, a little loose grammar is fine' },
  { id: 'family', text: 'a middle class family person, practical and careful with money, talks about family or parents, honest and simple' },
  { id: 'professional', text: 'an educated working professional, polished and clear, well-structured sentences, calm and respectful tone' },
  { id: 'young', text: 'a college-age youngster, casual and slangy, quick typing style, energetic' },
  { id: 'uncle', text: 'an older respectful person (uncle ji), polite, simple words, blesses or thanks the shopkeeper' },
  { id: 'blunt', text: 'a straightforward no-nonsense person, few words, says only what mattered to him' },
  { id: 'lowerclass', text: 'a daily-earning working person on a tight budget, very simple words, short plain sentences, cares about saving money and not being cheated' },
  { id: 'business', text: 'a small business owner who needed a phone for work, practical, talks about value for money and not wasting time' },
  { id: 'officer', text: 'a well-off senior person or officer, formal and precise, values genuine product and proper service' },
  { id: 'mother', text: 'a housewife or mother choosing a phone for the family, careful, talks about what the family needed, warm tone' },
  { id: 'firsttimer', text: 'someone buying their first iPhone, a little excited, was a bit worried about fake or old stock before coming' },
  { id: 'giftbuyer', text: 'someone buying a phone as a gift for a family member, wanted something safe and genuine' },
  { id: 'techie', text: 'a tech-aware person who compares options, notices small details, writes in a clear matter-of-fact way' },
];

const WRITING_STYLES = [
  'neat spelling and proper grammar',
  'casual WhatsApp-style typing, relaxed',
  'all small letters, casual typing, no capital letters',
  'simple and slightly rough, one tiny spelling slip is fine',
];

const HINGLISH_LEVELS = [
  'mostly Hindi words, only a few English words like phone, price, battery',
  'half Hindi, half English words',
  'Hindi grammar but many common English words mixed in',
];

const OPENERS = [
  'start with the phone or what you bought',
  'start with the shop or the area',
  'start with the shopkeeper or staff',
  'start with how you feel now',
  'start with why you came here',
  'start in the middle of a thought, casually',
  'start with what you were worried about before coming',
  'start with the exact phone model you took',
  'start by saying how you found this shop (maps, friend or passing by)',
  'start with your plain verdict in your own words',
  'start with your budget or price',
  'start with a simple statement about the whole experience',
];

const ENDINGS = [
  'end with a small thanks or blessing',
  'end by saying you would tell friends and family',
  'end by saying you will come here again',
  'end with a short plain remark about the deal',
  'end with one line about how you feel about the phone',
  'just stop naturally after your last point, no wrap-up line',
];

const BUYER_LINES = [
  'You bought it for yourself.',
  'You bought it for your parents.',
  'You bought it for your child.',
  'You bought it as a gift.',
  'You bought it for work.',
];

// Sirf tone samjhane ke liye (copy nahi karna). Koi full stop nahi.
const EXAMPLES = {
  ENGLISH: [
    'Went in with a fixed budget and the owner showed me two options without pushing anything, took the one I liked and it was done in minutes',
    'Phone looks brand new, they checked everything in front of me before I paid, happy with the deal',
    'Easy to find near the metro, quick and honest dealing, no time wasted',
    'My son wanted an iPhone for months, finally got one here at a price that did not hurt, he is very happy',
  ],
  HINGLISH: [
    'budget ke hisaab se phone dikhaya, koi pressure nahi diya, sab kuch check karke diya, abhi tak koi dikkat nahi aayi',
    'dusri dukaano se rate pucha tha yahan sabse sahi laga, bill aur box dono mile, bharosa ho gaya',
    'phone ekdum naya jaisa hai, battery bhi sahi dikha rahi hai, ghar walon ko bhi pasand aaya',
    'metro ke paas hai dhoondhne me dikkat nahi hui, seedhi baat karte hain, time kharab nahi hua',
  ],
};

/* =====================================================================
   ENGINE  (sab categories me same rahega)
   ===================================================================== */
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const chance = (p) => Math.random() < p;
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

function pickWeighted(items) {
  const total = items.reduce((s, i) => s + i.w, 0);
  let r = Math.random() * total;
  for (const i of items) {
    if ((r -= i.w) <= 0) return i;
  }
  return items[0];
}

// Model chunna: pichhle 3 me aaya hua model dobara nahi, naye models zyada
function pickModel(recentModels) {
  const flat = [];
  for (const sr of MODEL_SERIES) {
    const total = sr.variants.reduce((a, v) => a + v[1], 0);
    for (const [name, vw] of sr.variants) {
      if (recentModels.includes(name)) continue;
      flat.push({ name, series: sr.n, w: sr.w * (vw / total) });
    }
  }
  return pickWeighted(flat);
}

// ~8 words = 1 line on phone
const LENGTHS = [
  { w: 12, lines: 1, min: 7,  max: 11, rule: 'ONE short line, 7 to 10 words' },
  { w: 16, lines: 2, min: 13, max: 21, rule: 'TWO lines, 14 to 20 words' },
  { w: 30, lines: 3, min: 21, max: 31, rule: 'THREE lines, 22 to 30 words' },
  { w: 28, lines: 4, min: 30, max: 42, rule: 'FOUR lines, 32 to 40 words' },
  { w: 14, lines: 5, min: 40, max: 52, rule: 'FIVE lines, 42 to 50 words' },
];

function chooseLength(recent, minLines = 1) {
  const lens = recent.map((r) => r.lines).filter(Boolean);
  const l1 = lens[lens.length - 1];
  const l2 = lens[lens.length - 2];
  const l3 = lens[lens.length - 3];
  let pool = LENGTHS.filter((x) => x.lines >= minLines);

  const mid = (n) => n === 3 || n === 4;
  if (lens.length >= 3 && mid(l1) && mid(l2) && mid(l3)) {
    const f = pool.filter((x) => !mid(x.lines));
    if (f.length) pool = f;
  } else if (l1 && !mid(l1)) {
    const f = pool.filter((x) => mid(x.lines));
    if (f.length) pool = f;
  }
  if (l1 && l1 === l2) {
    const f = pool.filter((x) => x.lines !== l1);
    if (f.length) pool = f;
  }
  return pickWeighted(pool);
}

function choosePersona(recent) {
  const last = recent.map((r) => r.voice).filter(Boolean).slice(-4);
  const pool = PERSONAS.filter((v) => !last.includes(v.id));
  return pick(pool.length ? pool : PERSONAS);
}

function chooseTopic(recent) {
  const last = recent.map((r) => r.topic).filter(Boolean).slice(-2);
  const pool = ALL_TOPICS.filter((t) => !last.includes(t));
  return TOPICS[pick(pool.length ? pool : ALL_TOPICS)];
}

// Customer ne jo chips chune (max 3) unhe nikalo
function chosenChips(body) {
  const labels = Array.isArray(body.selectedChips) ? body.selectedChips : [];
  return labels.filter((l) => typeof l === 'string' && CHIPS[l]).slice(0, 3).map((l) => ({ label: l, ...CHIPS[l] }));
}

function chooseFrom(list, key, recent, n = 3) {
  const last = recent.map((r) => r[key]).filter((v) => v !== undefined && v !== null).slice(-n);
  const pool = list.filter((x) => !last.includes(x));
  return pick(pool.length ? pool : list);
}

const BANNED_OPENINGS = [
  'Great', 'Best', 'Amazing', 'Excellent', 'Highly recommend', 'Bhai', 'Superb', 'Awesome', 'The staff here',
  'Outstanding', 'Fantastic', 'Wonderful', 'Perfect', 'Must visit', 'Trust me',
];

const AI_PHRASES = /seamless|hassle[- ]free|top[- ]notch|look no further|go-to|game[- ]changer|one[- ]stop|unparalleled|exceptional|impeccable|commendable|must[- ]visit|highly recommended|hands down|truly|delighted|kudos|—|–/i;

const DANGLING = new Set([
  'to', 'aur', 'ki', 'ke', 'ka', 'se', 'me', 'mein', 'par', 'pe', 'ko', 'toh',
  'and', 'but', 'the', 'a', 'an', 'of', 'in', 'on', 'for', 'with', 'at', 'that',
  'so', 'if', 'or', 'because', 'jo', 'jab', 'agar', 'lekin', 'ya', 'jaise', 'kyunki',
]);

// NOTE: 'the' yahan se hata diya (English me bahut aata hai, galat reject karta tha)
const HINDI_WORDS = new Set([
  'hai', 'hain', 'nahi', 'nahin', 'bahut', 'bohot', 'bhot', 'mera', 'meri', 'mere', 'mujhe', 'hume',
  'aur', 'ki', 'ke', 'ka', 'ko', 'se', 'par', 'pe', 'tha', 'thi', 'kiya', 'mila', 'mil', 'gaya', 'gayi',
  'liya', 'wala', 'wale', 'jo', 'kaafi', 'accha', 'acha', 'achha', 'sach', 'yahan', 'yaha', 'kar', 'karke', 'raha',
  'rahe', 'rahi', 'laga', 'lagi', 'bilkul', 'ekdum', 'sab', 'kuch', 'koi', 'phir', 'fir', 'bhi', 'toh', 'lekin',
  'isliye', 'abhi', 'dekh', 'dekha', 'diya', 'dikhaya', 'samjhaya', 'sahi', 'dukaan', 'dukan', 'aap', 'aapne',
  'paise', 'kam', 'jyada', 'zyada', 'badhiya', 'mast', 'yaar', 'mein', 'yeh', 'ye', 'woh', 'wo', 'ne', 'hu', 'hun', 'tak', 'wahan', 'sabse',
]);

/* ------------------ yaadasht (server par, best-effort) ------------------ */
const HISTORY = []; // { open, ws }
const HITS = new Map(); // ip -> [timestamps]

const openingOf = (text) => text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean).slice(0, 3).join(' ');
const wordSet = (t) => new Set(t.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2));

function tooSimilar(text, recentOpenings) {
  const open = openingOf(text);
  if (recentOpenings.includes(open)) return true;
  const ws = wordSet(text);
  for (const h of HISTORY) {
    if (h.open === open) return true;
    let inter = 0;
    for (const w of ws) if (h.ws.has(w)) inter++;
    const union = ws.size + h.ws.size - inter || 1;
    if (inter / union > 0.45) return true;
  }
  return false;
}

function remember(text) {
  HISTORY.push({ open: openingOf(text), ws: wordSet(text) });
  while (HISTORY.length > HISTORY_SIZE) HISTORY.shift();
}

function rateLimited(request) {
  const ip = (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
  const now = Date.now();
  const arr = (HITS.get(ip) || []).filter((t) => now - t < 5 * 60 * 1000);
  arr.push(now);
  HITS.set(ip, arr);
  if (HITS.size > 2000) {
    for (const [k, v] of HITS) if (!v.some((t) => now - t < 5 * 60 * 1000)) HITS.delete(k);
  }
  return arr.length > 25; // 5 minute me 25 se zyada nahi
}

/* ------------------ safai aur checks ------------------ */
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

// Adhoora ending ho to dobara Gemini ko bulane ke bajaye code se kaat do
function fixCutOff(text) {
  let parts = text.trim().replace(/[,\-\s]+$/g, '').split(/\s+/);
  while (parts.length > 6) {
    const last = parts[parts.length - 1].toLowerCase().replace(/[^a-z]/g, '');
    if (!DANGLING.has(last)) break;
    parts.pop();
    parts = parts.join(' ').replace(/[,\-\s]+$/g, '').split(/\s+/);
  }
  return parts.join(' ');
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

function startsBanned(text) {
  const t = text.trim().toLowerCase();
  return BANNED_OPENINGS.some((b) => t.startsWith(b.toLowerCase()));
}

/* ------------------ Gemini ko jaane wali command ------------------ */
function buildPrompt(body, recent) {
  const language = body.language === 'HINGLISH' ? 'HINGLISH' : 'ENGLISH';
  const businessName = String(body.businessName || '').slice(0, 120);
  const category = String(body.category || '').slice(0, 200);
  const description = String(body.description || '').slice(0, 600);
  const city = String(body.city || '').slice(0, 120);

  const recentModels = recent.map((r) => r.model).filter(Boolean).slice(-3);
  let chips = chosenChips(body);
  const hasModelChip = chips.some((c) => c.id === 'chip_models');
  const picked = hasModelChip || chance(0.45) ? pickModel(recentModels) : null;
  const model = picked ? picked.name : null;
  if (hasModelChip) {
    chips = chips.map((c) =>
      c.id === 'chip_models'
        ? { ...c, text: `he bought an ${picked.name}`, must: new RegExp(picked.series) }
        : c
    );
  }
  const minLines = chips.length >= 3 ? 4 : chips.length === 2 ? 3 : 1;
  const length = chooseLength(recent, minLines);
  const persona = choosePersona(recent);
  const topic = chips.length
    ? { id: chips[0].id, text: chips[0].text, must: chips[0].must }
    : chooseTopic(recent);
  const extraChips = chips.slice(1);
  const opener = chooseFrom(OPENERS, 'opener', recent, 3);
  const ending = chooseFrom(ENDINGS, 'ending', recent, 2);
  const style = pick(WRITING_STYLES);
  const hinglishLevel = pick(HINGLISH_LEVELS);
  const buyerLine = chance(0.5) ? pick(BUYER_LINES) + ' ' : '';

  const longEnough = length.lines >= 3;
  const secondPoint = !extraChips.length && length.lines >= 4 && chance(0.5);
  const mentionName = chance(0.4);
  const mentionStaff = topic.id === 'politeness' ? chance(0.5) : chance(0.15);
  const useEmoji = chance(0.08);

  const recentSeo = recent.map((r) => r.seo).filter(Boolean).slice(-8);
  const seoPool = SEO_KEYWORDS.filter((k) => !recentSeo.includes(k));
  const seo = chance(0.3) ? pick(seoPool.length ? seoPool : SEO_KEYWORDS) : null;


  const languageBlock =
    language === 'HINGLISH'
      ? `LANGUAGE (MOST IMPORTANT): Write in HINGLISH = Hindi sentences typed in English/Roman letters, like a Delhi person on WhatsApp. Level: ${hinglishLevel}. Grammar must be Hindi (hai, tha, kiya, mila, nahi, bahut, aur, ke liye, wala etc.). Product names and keywords can stay in English. Never write a full English sentence. Never use Devanagari.`
      : `LANGUAGE (MOST IMPORTANT): Write in simple natural English like an Indian customer. Do not use Hindi words.`;

  const examples = shuffle(EXAMPLES[language]).slice(0, 3).map((e) => `- ${e}`).join('\n');

  const prompt = `${languageBlock}

You are ${persona.text}. ${buyerLine}You bought a ${PRODUCT_WORD} from this shop and are writing a Google Maps review.
Business: ${businessName} (${city}) | ${category}
About: ${description}

Tone samples from other customers (only for feel, never copy words or structure):
${examples}

THIS REVIEW:
- Main topic: ${topic.text}. The review must clearly be about this.
${extraChips.length ? `- ALSO naturally cover these points (all of them): ${extraChips.map((c) => c.text).join('; ')}.` : secondPoint ? '- You may add one small extra point at the end, from any other area.' : '- Stick to the main topic only.'}
- Writing style: ${style}.
- Opening: ${opener}.
${longEnough ? `- Ending: ${ending}.` : ''}
- Length: ${length.rule}. Stay inside this range.
${mentionName ? `- Mention the shop name "${businessName}" once, naturally.` : '- Do not repeat the full shop name.'}
${seo ? `- If it fits naturally, include the phrase "${seo}".` : ''}
${model ? (hasModelChip ? `- Mention ${model} by name.` : `- You may mention ${model}.`) : ''}
${mentionStaff ? `- Mention the owner/staff "${OWNER_NAME}" once, naturally.` : '- Do not name any person.'}
${useEmoji ? '- One emoji at the very end is allowed.' : '- No emojis.'}

HARD RULES:
- ONE single paragraph. No line breaks, bullets or title.
- Do NOT use a full stop (.) anywhere. Use commas, "aur"/"and", or just flow.
- Never start with: ${BANNED_OPENINGS.join(', ')}.
- Sound like a real customer, not an advertisement. No hashtags, slogans, keyword stuffing, no dashes. Avoid polished marketing words (seamless, hassle-free, top-notch, exceptional).
- Do not invent facts: only talk about what the main topic says. No other market names, no exact prices, no discounts, no warranty promises.
- Do not use the word "wholesale".
- End with a COMPLETE thought. Never stop mid-sentence.
- Output only the review text.`.replace(/\n{3,}/g, '\n\n').replace(/\n\n(- )/g, '\n$1');

  return { prompt, length, persona, topic, extraChips, opener, ending, seo, model, language };
}

async function callGemini(apiKey, payload, signal) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    }
  );
  const data = await res.json();
  return { res, data };
}

/* ------------------ ek koshish: likhwao + check karo ------------------ */
async function attempt(apiKey, body, recent, signal) {
  const built = buildPrompt(body, recent);
  const { prompt, length, persona, topic, extraChips, opener, ending, seo, model, language } = built;

  const payload = {
    contents: [{ role: 'user', parts: [{ text: `Write the review for ${body.businessName} now.` }] }],
    systemInstruction: { parts: [{ text: prompt }] },
    generationConfig: {
      temperature: 1.0,
      topP: 0.95,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  try {
    let { res, data } = await callGemini(apiKey, payload, signal);

    if (!res.ok && /thinking/i.test(data?.error?.message || '')) {
      delete payload.generationConfig.thinkingConfig;
      ({ res, data } = await callGemini(apiKey, payload, signal));
    }
    if (!res.ok) return { ok: false, error: data?.error?.message || 'Gemini API request failed.' };

    const candidate = data.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    const raw = parts.filter((p) => !p.thought).map((p) => p.text || '').join('');
    const review = fixCutOff(cleanReview(raw));
    const words = review.split(/\s+/).filter(Boolean).length;

    if (!review) return { ok: false, error: 'Empty response from Gemini.' };
    if (candidate?.finishReason === 'MAX_TOKENS') return { ok: false, error: 'Response was cut off.' };
    if (looksCutOff(review)) return { ok: false, error: 'Review ended mid-sentence.' };
    if (words > length.max + 8) return { ok: false, error: 'Review too long.' };
    if (words < Math.floor(length.min * 0.75)) return { ok: false, error: 'Review too short.' };
    if (/[ऀ-ॿ]/.test(review)) return { ok: false, error: 'Devanagari used.' };
    if (/wholesale/i.test(review)) return { ok: false, error: 'Banned word used.' };
    if (AI_PHRASES.test(review)) return { ok: false, error: 'Robotic phrase used.' };
    if (startsBanned(review)) return { ok: false, error: 'Banned opening used.' };
    if (!languageOk(review, language, words)) return { ok: false, error: 'Wrong language style.' };
    if (!topic.must.test(review)) return { ok: false, error: 'Review missed the selected topic.' };
    if (extraChips.some((c) => !c.must.test(review))) return { ok: false, error: 'Review missed a selected keyword.' };
    const recentOpenings = recent.map((r) => r.open).filter(Boolean);
    if (tooSimilar(review, recentOpenings)) return { ok: false, error: 'Too similar to an earlier review.' };

    return {
      ok: true,
      review,
      meta: {
        lines: length.lines,
        voice: persona.id,
        topic: topic.id,
        opener,
        ending,
        seo: seo || null,
        model: model || null,
        open: openingOf(review),
      },
    };
  } catch (e) {
    return { ok: false, error: e?.name === 'AbortError' ? 'aborted' : e?.message || 'Request failed.', aborted: e?.name === 'AbortError' };
  }
}

// Jo pehle sahi result de, wahi lo
function firstValid(tasks) {
  return new Promise((resolve) => {
    let pending = tasks.length;
    let firstError = null;
    for (const t of tasks) {
      t.then((r) => {
        if (r.ok) return resolve(r);
        if (!r.aborted && !firstError) firstError = r.error;
        if (--pending === 0) resolve({ ok: false, error: firstError || 'Failed to generate review draft.' });
      });
    }
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key not configured.' }, { status: 500 });
    }
    if (rateLimited(request)) {
      return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 });
    }

    const recent = (Array.isArray(body.recentLengths) ? body.recentLengths : [])
      .filter((r) => r && typeof r === 'object')
      .slice(-6);

    let lastError = 'Failed to generate review draft.';

    for (let round = 0; round < MAX_ROUNDS; round++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), CALL_TIMEOUT_MS);

      const winner = await firstValid(
        Array.from({ length: PARALLEL_CALLS }, () => attempt(apiKey, body, recent, controller.signal))
      );

      clearTimeout(timer);
      controller.abort(); // bacha hua dusra call band

      if (winner.ok) {
        remember(winner.review);
        return NextResponse.json({ review: winner.review, meta: winner.meta });
      }
      lastError = winner.error;
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
