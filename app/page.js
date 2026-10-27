"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const CLIENT_CONFIG = {
  clientId: "delhite_lakshay_01",
  businessName: "Delhite Lakshay Store",
  subHeading: "Trusted Apple iPhone Wholesaler & Retailer",
  tagline: "IPHONE 13 TO 17 • UNUSED & REFURBISHED STOCK • BEST DEALS IN DELHI",
  description:
    "Top-rated wholesale & retail mobile store in GTB Nagar, Delhi specializing in premium second-hand and imported iPhones (iPhone 13, 14, 15, 16, 17 series) with verified 100% battery health, all variants, and transparent dealing.",
  city: "GTB Nagar, Delhi 110009",
  fullAddress: "Ground Floor, 1594, Outram Ln, Outram Lines, GTB Nagar, Delhi, 110009",
  phone: "+919999652654",
  cleanPhone: "919999652654",
  whatsappNumber: "919999652654",
  logoUrl: "/logo.png",
  googleReviewUrl: "https://g.page/r/review",
  mapsDirectionUrl: "https://maps.google.com/?q=Ground+floor+1594+Outram+Ln+Outram+Lines+GTB+Nagar+Delhi+110009",
  instagramUrl: "https://instagram.com/delhitelakshaymobiles",
  facebookUrl: "https://facebook.com",
  websiteUrl: "https://vrmaxai.in",
  
  customInstruction: "You are an authentic customer writing an unscripted, natural Google Maps review for Delhite Lakshay Store in GTB Nagar, Delhi. Write like a real buyer (ranging from college students to working professionals) who just bought an iPhone. Focus on incredible wholesale pricing, mint scratch-less condition, verified 100% battery health, smooth performance, and polite trustworthy dealing by Lakshay bhai's team. Vary the sentence length, tone, and vocabulary organically so it never looks like a template.",

  chips: [
    { label: "All", context: "overall store experience, trust, and premium iPhone purchase" },
    { label: "iPhone 13 to 17", context: "availability of latest models like iPhone 13, 14, 15, 16, 17 in all colors and storage capacities" },
    { label: "100% Battery Health", context: "getting original 100% battery health, massive backup, and genuine device testing" },
    { label: "Mint Condition", context: "flawless scratch-less body, unplayed pristine condition, feels completely brand new" },
    { label: "Wholesale Pricing", context: "unbeatable wholesale rates in Delhi market, total value for money deals" },
    { label: "GTB Nagar Store", context: "easy location in Outram Lines GTB Nagar, safe physical store visit, and friendly staff" }
  ],
};

function useTypewriter(fullText, speed = 12) {
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
  const { displayText, isTyping } = useTypewriter(reviewDraft, 12);

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
          nonce: Math.random().toString(36).substring(2, 9),
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

  function handleSaveContact() {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${CLIENT_CONFIG.businessName}
TEL:${CLIENT_CONFIG.phone}
ADR:;;${CLIENT_CONFIG.city};;;;
NOTE:Trusted Apple iPhone Wholesaler & Retailer
END:VCARD`;

    const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${CLIENT_CONFIG.businessName.replace(/\s+/g, "_")}.vcf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  if (!mounted) return <div style={{ minHeight: "100vh", backgroundColor: "#fbf9f4" }} />;

  return (
    <main className="soft-luxury-viewport">
      <div className="main-content-flow">
        
        {/* 3D Animated Luxury Logo */}
        <div className="brand-medallion-badge">
          <div 
            className="logo-circle-container" 
            style={{ backgroundImage: `url(${CLIENT_CONFIG.logoUrl})` }}
          ></div>
          <h1 className="brand-main-title">{CLIENT_CONFIG.businessName}</h1>
        </div>

        <p className="brand-serif-subtitle">{CLIENT_CONFIG.subHeading}</p>

        <div className="royal-shahi-divider">
          <span className="divider-line"></span>
          <span className="divider-gem">◆</span>
          <span className="divider-line"></span>
        </div>

        <div className="stars-cluster">
          <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
        </div>

        <p className="experience-tracker-title">SHARE YOUR EXPERIENCE</p>

        {/* Filter Chips */}
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

        {/* Language Selector */}
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

        {/* Review Box */}
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
                <span className="shimmer-text">Crafting authentic review...</span>
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
            className="full-luxury-copy-btn"
          >
            <span>{copied ? "Copied! Opening Google..." : "Copy & Paste on Google"}</span>
          </button>
          <p className="card-disclaimer-note">Please review the wording before posting.</p>
        </div>

        {/* Quick Actions 3D Card with Soft Shadow */}
        <div className="quick-actions-card">
          <div className="soft-action-grid">
            <div className="action-row-upper">
              <a href={`https://wa.me/${CLIENT_CONFIG.cleanPhone}`} target="_blank" rel="noreferrer" className="soft-circle-action">
                <div className="icon-disc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                </div>
                <span className="icon-tag">WhatsApp</span>
              </a>
              <a href={`tel:${CLIENT_CONFIG.phone}`} className="soft-circle-action">
                <div className="icon-disc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </div>
                <span className="icon-tag">Call Us</span>
              </a>
              <button type="button" onClick={handleSaveContact} className="soft-circle-action">
                <div className="icon-disc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                </div>
                <span className="icon-tag">Save Contact</span>
              </button>
              <a href={CLIENT_CONFIG.mapsDirectionUrl} target="_blank" rel="noreferrer" className="soft-circle-action">
                <div className="icon-disc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <span className="icon-tag">Directions</span>
              </a>
            </div>

            <div className="action-row-lower">
              <a href={CLIENT_CONFIG.websiteUrl} target="_blank" rel="noreferrer" className="soft-circle-action">
                <div className="icon-disc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                </div>
                <span className="icon-tag">Website</span>
              </a>
              <a href={CLIENT_CONFIG.instagramUrl} target="_blank" rel="noreferrer" className="soft-circle-action">
                <div className="icon-disc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                </div>
                <span className="icon-tag">Instagram</span>
              </a>
              <a href={CLIENT_CONFIG.facebookUrl} target="_blank" rel="noreferrer" className="soft-circle-action">
                <div className="icon-disc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </div>
                <span className="icon-tag">Facebook</span>
              </a>
            </div>
          </div>
        </div>

        {/* Embedded Map Card with Prominent Full Address */}
        <div className="embedded-map-card">
          <a href={CLIENT_CONFIG.mapsDirectionUrl} target="_blank" rel="noreferrer" className="map-card-header-link">
            <div className="map-card-header">
              <span className="map-pin-icon">📍</span>
              <span>Visit Store • GTB Nagar, Delhi</span>
            </div>
          </a>
          <div className="map-iframe-container">
            <iframe
              title="Delhite Lakshay Store Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13998.8!2d77.206!3d28.706!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zRFTCmiBOYWdhciwgRGVsaGk!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
              width="100%"
              height="150"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <a
            href={CLIENT_CONFIG.mapsDirectionUrl}
            target="_blank"
            rel="noreferrer"
            className="map-directions-link"
          >
            Get Directions on Google Maps &rarr;
          </a>
          <div className="address-highlight-box">
            <p className="agency-clean-address"><strong>Address:</strong> {CLIENT_CONFIG.fullAddress}</p>
            <p className="agency-clean-phone"><strong>Phone:</strong> {CLIENT_CONFIG.phone}</p>
          </div>
        </div>

        {/* Footer with QR Branding */}
        <footer className="page-tail-block">
          <p className="tail-hint-note">Review the draft before copying it to Google.</p>
          <div className="agency-bottom-badge">
            Powered by <strong>VR Max AI</strong> •
            <a
              href={`https://wa.me/${CLIENT_CONFIG.whatsappNumber}?text=Hi%20VR%20Max%20AI,%20I%20want%20to%20get%20my%20QR%20review%20system%20for%20my%20business.`}
              target="_blank"
              rel="noreferrer"
              className="footer-qr-whatsapp-link"
            >
              Get your QR WhatsApp
            </a>
          </div>
        </footer>
      </div>

      <style jsx global>{`
        .soft-luxury-viewport {
          min-height: 100vh;
          background: #fbf9f4;
          padding: 14px 16px 40px;
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #2b2016;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .main-content-flow {
          width: 100%;
          max-width: 410px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .brand-medallion-badge {
          margin-top: 12px;
          margin-bottom: 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .logo-circle-container {
          width: 135px;
          height: 135px;
          border-radius: 50%;
          background-color: transparent;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          box-shadow: 0 14px 34px rgba(110, 21, 29, 0.25), 0 6px 14px rgba(0,0,0,0.12);
          margin-bottom: 12px;
          animation: floatLogo 3.5s ease-in-out infinite;
          border: 3px solid #d1b183;
          transition: transform 0.2s ease;
        }
        .logo-circle-container:active {
          transform: scale(0.96);
        }
        @keyframes floatLogo {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .brand-main-title {
          font-family: Georgia, serif;
          font-size: 26px;
          font-weight: 800;
          color: #591016;
          margin: 0 0 4px;
          letter-spacing: 0.3px;
        }
        .brand-serif-subtitle {
          font-family: Georgia, serif;
          font-style: italic;
          font-size: 13.5px;
          color: #b78a48;
          margin: 0 0 10px;
        }
        .royal-shahi-divider {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 85%;
          margin: 8px auto 12px;
          gap: 10px;
        }
        .divider-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, #d1b183, transparent);
        }
        .divider-gem {
          color: #b78a48;
          font-size: 8px;
        }
        .stars-cluster {
          display: flex;
          gap: 4px;
          color: #d19a3b;
          font-size: 16px;
          margin-bottom: 4px;
        }
        .experience-tracker-title {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 2px;
          color: #635345;
          text-transform: uppercase;
          margin: 0 0 12px;
        }
        .floating-pills-cloud {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 6px;
          margin-bottom: 14px;
          width: 100%;
        }
        .embossed-pill {
          border-radius: 999px;
          padding: 6px 14px;
          font-size: 11px;
          background: #ffffff;
          color: #591016;
          border: 1px solid #ebd9c3;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(180, 155, 130, 0.08);
          transition: all 0.16s ease;
        }
        .embossed-pill:active {
          transform: scale(0.95);
        }
        .embossed-pill.active {
          background: radial-gradient(circle at 30% 30%, #831d27 0%, #591016 100%);
          color: #ffffff;
          border-color: #591016;
          box-shadow: 0 4px 14px rgba(110, 20, 30, 0.25);
        }
        .capsule-lang-dock {
          display: inline-flex;
          background: #ffffff;
          border-radius: 999px;
          padding: 3px;
          gap: 2px;
          margin-bottom: 16px;
          box-shadow: 0 3px 10px rgba(180, 155, 130, 0.12);
          border: 1px solid #ebd9c3;
        }
        .capsule-lang-btn {
          padding: 5px 18px;
          border-radius: 999px;
          border: none;
          background: transparent;
          font-size: 10px;
          font-weight: 700;
          color: #7b6b5d;
          cursor: pointer;
        }
        .capsule-lang-btn.active {
          background: #6e151d;
          color: #ffffff;
          box-shadow: 0 3px 8px rgba(110, 21, 29, 0.28);
        }
        .signature-review-box {
          width: 100%;
          background: #ffffff;
          border-radius: 24px;
          padding: 18px;
          box-sizing: border-box;
          box-shadow: 0 14px 34px rgba(160, 130, 100, 0.13);
          margin-bottom: 16px;
          text-align: left;
          border-top: 4px solid #6e151d;
          color: #2b2016;
        }
        .box-top-ribbon {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .label-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 8.5px;
          font-weight: 800;
          letter-spacing: 1.8px;
          color: #9c8e80;
          text-transform: uppercase;
        }
        .dot-ping {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #6e151d;
        }
        .top-rewrite-btn {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 999px;
          background: #fbf7f1;
          border: 1px solid #ebd9c3;
          color: #6e151d;
          font-size: 10.5px;
          font-weight: 650;
          cursor: pointer;
          transition: transform 0.15s ease;
        }
        .top-rewrite-btn:active {
          transform: scale(0.95);
        }
        .review-display-zone {
          min-height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px 2px 8px;
        }
        .loader-shimmer-wrap {
          color: #b78a48;
          font-size: 12px;
          font-style: italic;
        }
        .review-body-text {
          font-family: Georgia, serif;
          font-size: 14.5px;
          line-height: 1.6;
          color: #2b2016;
          margin: 0;
          width: 100%;
          white-space: pre-wrap;
        }
        .review-placeholder {
          font-family: Georgia, serif;
          font-size: 13px;
          font-style: italic;
          color: #a49688;
          margin: 0;
        }
        .review-error {
          font-size: 12px;
          color: #a3212d;
          margin: 0;
        }
        .typewriter-cursor {
          display: inline-block;
          width: 2px;
          height: 13px;
          background: #6e151d;
          margin-left: 3px;
          vertical-align: middle;
          animation: blink 0.7s infinite;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .card-ornament-center {
          text-align: center;
          color: #d1b183;
          font-size: 7px;
          margin: 6px 0 10px;
        }
        .full-luxury-copy-btn {
          width: 100%;
          height: 50px;
          border-radius: 999px;
          background: linear-gradient(180deg, #781a23 0%, #5c1218 100%);
          border: none;
          color: #ffffff;
          font-size: 12px;
          font-weight: 750;
          cursor: pointer;
          box-shadow: 0 8px 22px rgba(110, 20, 30, 0.32);
          transition: transform 0.15s ease;
        }
        .full-luxury-copy-btn:active:not(:disabled) {
          transform: scale(0.98);
        }
        .card-disclaimer-note {
          font-size: 9.5px;
          color: #9c8e80;
          text-align: center;
          margin: 8px 0 0;
          font-style: italic;
        }
        .quick-actions-card {
          width: 100%;
          background: #ffffff;
          border-radius: 22px;
          padding: 18px 12px;
          box-sizing: border-box;
          border: 1px solid #ebd9c3;
          box-shadow: 0 10px 28px rgba(160, 130, 100, 0.14);
          margin-bottom: 16px;
        }
        .soft-action-grid {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          width: 100%;
        }
        .action-row-upper {
          display: flex;
          justify-content: center;
          gap: 16px;
          width: 100%;
        }
        .action-row-lower {
          display: flex;
          justify-content: center;
          gap: 20px;
          width: 100%;
        }
        .soft-circle-action {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          text-decoration: none !important;
          color: #4a3c30;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
          transition: transform 0.15s ease;
        }
        .soft-circle-action:active {
          transform: scale(0.92);
        }
        .icon-disc {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: #fbf7f1;
          display: grid;
          place-items: center;
          box-shadow: 0 6px 16px rgba(180, 150, 120, 0.15);
          border: 1px solid #ebd9c3;
          transition: all 0.2s ease;
        }
        .soft-circle-action:hover .icon-disc {
          background: #6e151d;
          border-color: #6e151d;
        }
        .soft-circle-action:hover .icon-disc svg {
          stroke: #ffffff;
        }
        .icon-disc svg {
          width: 20px;
          height: 20px;
          stroke: #591016;
          transition: stroke 0.2s ease;
        }
        .icon-tag {
          font-size: 9.5px;
          font-weight: 700;
          color: #4a3c30;
        }
        .embedded-map-card {
          width: 100%;
          background: #ffffff;
          border-radius: 22px;
          padding: 14px 16px;
          box-sizing: border-box;
          border: 1px solid #ebd9c3;
          box-shadow: 0 8px 24px rgba(160, 130, 100, 0.1);
          margin-bottom: 16px;
          text-align: left;
        }
        .map-card-header-link {
          text-decoration: none;
        }
        .map-card-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 800;
          color: #591016;
          margin-bottom: 8px;
        }
        .map-iframe-container {
          width: 100%;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid #ebd9c3;
          margin-bottom: 8px;
        }
        .map-directions-link {
          font-size: 11px;
          font-weight: 750;
          color: #b78a48;
          text-decoration: none;
          display: block;
          text-align: center;
          margin-bottom: 8px;
        }
        .address-highlight-box {
          background: #fbf7f1;
          border-radius: 12px;
          padding: 10px 12px;
          border: 1px solid #ebd9c3;
        }
        .agency-clean-address, .agency-clean-phone {
          font-size: 10.5px;
          color: #554435;
          margin: 0 0 3px;
          line-height: 1.4;
        }
        .agency-clean-phone {
          margin: 0;
        }
        .page-tail-block {
          width: 100%;
          text-align: center;
        }
        .tail-hint-note {
          font-size: 9.5px;
          color: #9c8e80;
          margin: 0 0 6px;
        }
        .agency-bottom-badge {
          font-size: 8.5px;
          color: #9c8e80;
          letter-spacing: 0.4px;
          text-transform: uppercase;
          border-top: 1px solid #ebd9c3;
          padding-top: 8px;
        }
        .agency-bottom-badge strong {
          color: #7b1c24;
        }
        .footer-qr-whatsapp-link {
          color: #7b1c24;
          text-decoration: underline;
          font-weight: 700;
          margin-left: 4px;
        }
      `}</style>
    </main>
  );
}
