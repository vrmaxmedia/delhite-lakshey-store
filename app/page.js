"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const CLIENT_CONFIG = {
  clientId: "delhite_lakshay_01",
  businessName: "Delhite Lakshay Store",
  subHeading: "Trusted Apple iPhone Wholesaler & Retailer",
  tagline: "REFURBISHED IPHONES • UNUSED STOCK • BEST DEALS IN DELHI",
  description:
    "Top-rated mobile store in GTB Nagar, Delhi specializing in best-quality second-hand and refurbished iPhones (iPhone 13 to latest models) with verified battery health and pan-India delivery.",
  city: "GTB Nagar, Delhi 110009",
  fullAddress: "Ground floor, 1594, Outram Ln, Outram Lines, GTB Nagar, Delhi, 110009",
  phone: "+919999652654",
  cleanPhone: "919999652654",
  whatsappNumber: "919999652654",
  logoUrl: "/store-logo.png",
  googleReviewUrl: "https://g.page/r/review",
  mapsDirectionUrl: "https://maps.google.com/?q=Delhite+Lakshay+Store+GTB+Nagar+Delhi",
  instagramUrl: "https://instagram.com/delhitelakshaymobiles",
  facebookUrl: "https://facebook.com",
  websiteUrl: "https://vrmaxai.in",
  
  customInstruction: "You are an authentic customer writing an unscripted Google Maps review for Delhite Lakshay Store in GTB Nagar. Focus purely on buying a second-hand or refurbished iPhone (like iPhone 13, 14, 15 series), mentioning battery health, scratch-less condition, genuine pricing, and trustworthy dealing. Write naturally like a real buyer from Delhi without any robotic templates.",

  chips: [
    { label: "All", context: "overall store experience, buying refurbished iPhone, and trust" },
    { label: "iPhone Quality", context: "scratch-less body, high battery health, genuine parts, and mint condition iPhone" },
    { label: "Pricing & Deals", context: "best wholesale rates, pocket-friendly second-hand prices, and complete value for money" },
    { label: "Battery Health", context: "original battery health above 85-90%, long backup, and authentic checking" },
    { label: "Unused / Refurbished", context: "open box unplayed stock, clean refurbished models, and flawless performance" },
    { label: "Staff & Service", context: "polite dealing, transparent communication, and helpful staff behavior" },
    { label: "GTB Nagar Store", context: "easy location in Outram Lines GTB Nagar, safe shopping, and great crowd" },
    { label: "Pan-India Delivery", context: "safe prepaid delivery, fast shipping, and trusted packaging" }
  ],
};

function useTypewriter(fullText, speed = 16) {
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!fullText) {
      setDisplayText("");
      setIsTyping(false);
      return;
    }
    setDisplayText("");
    setIsTyping(true);
    let index = 0;
    const timer = setInterval(() => {
      index++;
      setDisplayText(fullText.slice(0, index));
      if (index >= fullText.length) {
        clearInterval(timer);
        setIsTyping(false);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [fullText, speed]);

  return { displayText, isTyping };
}

export default function UniversalReviewPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedChipObj, setSelectedChipObj] = useState(CLIENT_CONFIG.chips[0]);
  const [language, setLanguage] = useState("ENGLISH");
  const [reviewDraft, setReviewDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const abortControllerRef = useRef(null);
  const requestIdRef = useRef(0);
  const { displayText, isTyping } = useTypewriter(reviewDraft, 16);

  useEffect(() => {
    setMounted(true);
    return () => {
      requestIdRef.current++;
      abortControllerRef.current?.abort();
    };
  }, []);

  const generateAIReview = useCallback(async (chipObj, lang) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const requestId = ++requestIdRef.current;

    setLoading(true);
    setCopied(false);
    setError("");
    setReviewDraft("");

    try {
      const effectiveFocus = `${chipObj.label} (Context cues: ${chipObj.context})`;

      const res = await fetch("/api/reviews", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          businessName: CLIENT_CONFIG.businessName,
          category: CLIENT_CONFIG.tagline,
          description: CLIENT_CONFIG.description,
          city: CLIENT_CONFIG.city,
          selectedService: effectiveFocus,
          customInstruction: CLIENT_CONFIG.customInstruction,
          language: lang,
          nonce: Math.random().toString(36).substring(2, 8),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Draft generation failed (${res.status}).`);
      if (!data.review?.trim()) throw new Error("The API returned an empty draft.");
      if (requestId !== requestIdRef.current) return;

      setReviewDraft(data.review.trim());
    } catch (err) {
      if (err.name === "AbortError") return;
      if (requestId === requestIdRef.current) {
        setError(err.message || "Unable to generate a draft.");
      }
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    generateAIReview(selectedChipObj, language);
    return () => abortControllerRef.current?.abort();
  }, [mounted, selectedChipObj, language, generateAIReview]);

  function handleChipChange(chipObj) {
    if (chipObj.label === selectedChipObj.label) {
      generateAIReview(chipObj, language);
      return;
    }
    setSelectedChipObj(chipObj);
  }

  function handleLanguageChange(lang) {
    if (lang === language) {
      generateAIReview(selectedChipObj, lang);
      return;
    }
    setLanguage(lang);
  }

  async function handleCopyAndRedirect() {
    if (!reviewDraft || loading || isTyping) return;
    try {
      await navigator.clipboard.writeText(reviewDraft);
      setCopied(true);
      setTimeout(() => {
        window.location.href = CLIENT_CONFIG.googleReviewUrl;
      }, 550);
    } catch (err) {
      setError("Could not copy the draft.");
    }
  }

  if (!mounted) return <div style={{ minHeight: "100vh", backgroundColor: "#5a0f14" }} />;

  return (
    <main className="restaurant-viewport">
      <div className="main-content-flow">
        <div className="brand-header-area">
          <h1 className="brand-main-title">{CLIENT_CONFIG.businessName}</h1>
          <p className="brand-serif-subtitle">{CLIENT_CONFIG.subHeading}</p>
        </div>

        <div className="royal-shahi-divider">
          <span className="divider-line"></span>
          <span className="divider-gem">◆</span>
          <span className="divider-line"></span>
        </div>

        <div className="stars-cluster">
          <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
        </div>

        <p className="experience-tracker-title">SHARE YOUR EXPERIENCE</p>

        <div className="floating-pills-cloud">
          {CLIENT_CONFIG.chips.map((chip) => {
            const active = selectedChipObj.label === chip.label;
            return (
              <button
                key={chip.label}
                type="button"
                onClick={() => handleChipChange(chip)}
                className={`embossed-pill ${active ? "active" : ""}`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        <div className="capsule-lang-dock">
          {["ENGLISH", "HINGLISH"].map((lang) => {
            const active = language === lang;
            return (
              <button
                key={lang}
                type="button"
                onClick={() => handleLanguageChange(lang)}
                className={`capsule-lang-btn ${active ? "active" : ""}`}
              >
                {lang}
              </button>
            );
          })}
        </div>

        <div className="signature-review-box">
          <div className="box-top-ribbon">
            <div className="label-badge">
              <span className="dot-ping"></span>
              YOUR REVIEW
            </div>
            <button
              type="button"
              disabled={loading || isTyping}
              onClick={() => generateAIReview(selectedChipObj, language)}
              className="top-rewrite-btn"
            >
              <span>Rewrite</span>
            </button>
          </div>

          <div className="review-display-zone">
            {loading ? (
              <div className="loader-shimmer-wrap">
                <span className="sparkle-icon">✦</span>
                <span className="shimmer-text">Crafting review draft...</span>
              </div>
            ) : error ? (
              <p className="review-error">{error}</p>
            ) : reviewDraft ? (
              <p className="review-body-text">
                {displayText}
                {isTyping && <span className="typewriter-cursor"></span>}
              </p>
            ) : (
              <p className="review-placeholder">Your review draft will appear here.</p>
            )}
          </div>

          <div className="card-ornament-center"><span>◆</span></div>

          <button
            type="button"
            disabled={loading || isTyping || !reviewDraft}
            onClick={handleCopyAndRedirect}
            className="full-burgundy-copy-btn"
          >
            <span>{copied ? "Copied! Opening Google..." : "Copy & Paste on Google"}</span>
          </button>
          <p className="card-disclaimer-note">Please review the wording before posting.</p>
        </div>
      </div>

      <style jsx global>{`
        .restaurant-viewport { min-height: 100vh; background: #5a0f14; padding: 12px 16px 36px; box-sizing: border-box; font-family: sans-serif; color: #f7ede2; display: flex; flex-direction: column; align-items: center; }
        .main-content-flow { width: 100%; max-width: 410px; display: flex; flex-direction: column; align-items: center; text-align: center; }
        .brand-header-area { margin-top: 14px; margin-bottom: 6px; }
        .brand-main-title { font-family: Georgia, serif; font-size: 23px; font-weight: 750; color: #fcefee; margin: 0 0 4px; }
        .brand-serif-subtitle { font-family: Georgia, serif; font-style: italic; font-size: 13px; color: #e6b9ad; margin: 0; }
        .royal-shahi-divider { display: flex; align-items: center; justify-content: center; width: 85%; margin: 12px auto; gap: 10px; }
        .divider-line { flex: 1; height: 1px; background: linear-gradient(90deg, transparent, #c88478, transparent); }
        .divider-gem { color: #e6b9ad; font-size: 8px; }
        .stars-cluster { display: flex; gap: 4px; color: #f4b41a; font-size: 16px; margin-bottom: 4px; }
        .experience-tracker-title { font-size: 9px; font-weight: 800; letter-spacing: 2px; color: #e6b9ad; text-transform: uppercase; margin: 0 0 12px; }
        .floating-pills-cloud { display: flex; flex-wrap: wrap; justifyContent: center; gap: 6px; margin-bottom: 14px; width: 100%; }
        .embossed-pill { border-radius: 999px; padding: 6px 14px; font-size: 11px; background: #ffffff; color: #5a0f14; border: 1px solid #d49a90; cursor: pointer; }
        .embossed-pill.active { background: #3b070a; color: #ffffff; border-color: #3b070a; }
        .capsule-lang-dock { display: inline-flex; background: #ffffff; border-radius: 999px; padding: 3px; gap: 2px; margin-bottom: 16px; border: 1px solid #d49a90; }
        .capsule-lang-btn { padding: 5px 18px; border-radius: 999px; border: none; background: transparent; font-size: 10px; font-weight: 700; color: #5a0f14; cursor: pointer; }
        .capsule-lang-btn.active { background: #3b070a; color: #ffffff; }
        .signature-review-box { width: 100%; background: #ffffff; border-radius: 24px; padding: 18px; box-sizing: border-box; box-shadow: 0 14px 34px rgba(0,0,0,0.25); margin-bottom: 16px; text-align: left; border-top: 4px solid #3b070a; color: #2b2b2b; }
        .box-top-ribbon { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .label-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 8.5px; font-weight: 800; letter-spacing: 1.8px; color: #8c5562; text-transform: uppercase; }
        .dot-ping { width: 5px; height: 5px; border-radius: 50%; background: #5a0f14; }
        .top-rewrite-btn { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 999px; background: #f7ebe8; border: 1px solid #e3c4cc; color: #5a0f14; font-size: 10.5px; cursor: pointer; }
        .review-display-zone { min-height: 80px; display: flex; align-items: center; justify-content: center; padding: 4px 2px 8px; }
        .loader-shimmer-wrap { color: #8c5562; font-size: 12px; font-style: italic; }
        .review-body-text { font-family: Georgia, serif; font-size: 14.5px; line-height: 1.6; color: #2b2b2b; margin: 0; width: 100%; white-space: pre-wrap; }
        .review-placeholder { font-family: Georgia, serif; font-size: 13px; font-style: italic; color: #a08088; margin: 0; }
        .review-error { font-size: 12px; color: #a3212d; margin: 0; }
        .typewriter-cursor { display: inline-block; width: 2px; height: 13px; background: #5a0f14; margin-left: 3px; vertical-align: middle; }
        .card-ornament-center { text-align: center; color: #d4a3ae; font-size: 7px; margin: 6px 0 10px; }
        .full-burgundy-copy-btn { width: 100%; height: 50px; border-radius: 999px; background: linear-gradient(180deg, #3b070a 0%, #200305 100%); border: none; color: #ffffff; font-size: 12px; font-weight: 750; cursor: pointer; box-shadow: 0 6px 18px rgba(0,0,0,0.3); }
        .card-disclaimer-note { font-size: 9.5px; color: #8c5562; text-align: center; margin: 8px 0 0; font-style: italic; }
      `}</style>
    </main>
  );
}
