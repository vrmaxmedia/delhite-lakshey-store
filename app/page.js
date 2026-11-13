"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const CLIENT_CONFIG = {
  clientId: "delhite_lakshay_01",
  businessName: "Delhite Lakshay Store",
  subHeading: "Trusted Refurbished & Unused Apple iPhone Specialist",
  tagline: "REFURBISHED & UNUSED IPHONE 12 TO 18 • BEST DEALS IN DELHI",
  description:
    "Trusted refurbished and unused iPhone specialist in GTB Nagar, Delhi offering premium imported and second-hand Apple iPhones (iPhone 12 to iPhone 18 series including Pro & Pro Max) at fair market pricing with verified 100% battery health.",
  city: "GTB Nagar, Delhi 110009",
  fullAddress: "1594, Outram Ln, Outram Lines, GTB Nagar, Delhi, 110009",
  phone: "+919999652654",
  cleanPhone: "919999652654",
  logoUrl: "/logo.png",
  googleReviewUrl: "https://search.google.com/local/writereview?placeid=ChIJ8wcMhq_9DDkR-t8xR7HlUg0",
  mapsDirectionUrl: "https://maps.app.goo.gl/z2ifo3oyCo242aS4A?g_st=ac",
  instagramUrl: "https://www.instagram.com/delhitelakshaymobiles?vrfl=MXNyeDR3MnFjZnB4cQ==",
  facebookUrl: "https://www.facebook.com/share/1Er7t9KgYH/",
  youtubeUrl: "https://youtube.com/@delhitelakshay9670?si=EhvBiMvHNuvuoYtD",
  whatsappChannelUrl: "https://whatsapp.com/channel/0029Va5ABfF4IBhEZhHx2N3w",
  agencyName: "VR Max AI",
  agencyWhatsapp: "918700660097",
  agencyPhoneDisplay: "+91 87006 60097",
  customInstruction:
    "You are an authentic local customer writing an unscripted Google Maps review for Delhite Lakshay Store in GTB Nagar, Delhi. Write like a real human speaking straight from the heart. NEVER use wholesale in a bulk-selling way; instead talk about getting unbeatable market-best retail prices after checking 10 places. Mention random specific iPhone models organically (e.g. iPhone 15 Pro, iPhone 14, iPhone 16, 13, etc.). Strictly DO NOT use full stops (.) at the end of sentences. Vary lengths completely randomly (some 1-line quick reviews, some 2-line, some 3-4 lines detailed). Never use robotic or repetitive openings.",
  chips: [
    { label: "All", context: "overall store experience" },
    { label: "Refurbished", context: "refurbished iPhone that looks and works like new" },
    { label: "Unused", context: "unused fresh piece iPhone" },
    { label: "iPhone 12 to 18", context: "any iPhone model from 12 to 18, latest models more" },
    { label: "100% Battery", context: "100% battery health shown and checked" },
    { label: "Mint Condition", context: "clean body, no scratches, mint condition" },
    { label: "Best Price", context: "fair best price without hidden charges" },
    { label: "Bill & Box", context: "genuine bill and box, trust" },
    { label: "Camera & Screen", context: "camera, screen and every function tested before buying" },
    { label: "Honest Advice", context: "honest guidance and polite staff, no pressure" },
    { label: "GTB Nagar", context: "easy to find store near GTB Nagar metro, Outram Lines" },
  ],
};

const MAP_EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(
  `Delhite Lakshay Store, ${CLIENT_CONFIG.fullAddress}`
)}&output=embed`;

const AGENCY_WA_LINK = `https://wa.me/${CLIENT_CONFIG.agencyWhatsapp}?text=${encodeURIComponent(
  "Hi VR Max AI, I want to get a QR review system for my business."
)}`;

function useTypewriter(fullText, totalMs = 2300) {
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

    const COMMA_PAUSE = 90;
    const commas = (fullText.match(/,/g) || []).length;
    const base = Math.min(
      26,
      Math.max(10, (totalMs - commas * COMMA_PAUSE) / fullText.length)
    );

    const times = [];
    let t = 0;

    for (let i = 0; i < fullText.length; i++) {
      t += base;
      times.push(t);
      if (fullText[i] === ",") t += COMMA_PAUSE;
    }

    const start = performance.now();
    let raf;

    const tick = (now) => {
      const elapsed = now - start;
      let n = 0;

      while (n < times.length && times[n] <= elapsed) n++;

      setDisplayText(fullText.slice(0, n));

      if (n >= fullText.length) {
        setIsTyping(false);
      } else {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [fullText, totalMs]);

  return { displayText, isTyping };
}

async function copyToClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    // Fallback below
  }

  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch (e) {
    return false;
  }
}

export default function UniversalReviewPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedLabels, setSelectedLabels] = useState(["All"]);
  const firstRunRef = useRef(true);
  const [language, setLanguage] = useState("ENGLISH");
  const [reviewDraft, setReviewDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const abortControllerRef = useRef(null);
  const requestIdRef = useRef(0);
  const recentLengthsRef = useRef([]);
  const { displayText, isTyping } = useTypewriter(reviewDraft);

  useEffect(() => {
    setMounted(true);

    return () => {
      requestIdRef.current++;
      abortControllerRef.current?.abort();
    };
  }, []);

  const generateAIReview = useCallback(async (labels, lang) => {
    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const requestId = ++requestIdRef.current;

    setLoading(true);
    setCopied(false);
    setError("");
    setReviewDraft("");

    try {
      const effectiveFocus = labels.join(" + ");

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
          selectedChips: labels,
          customInstruction: CLIENT_CONFIG.customInstruction,
          language: lang,
          nonce: Math.random().toString(36).substring(2, 12),
          timestamp: Date.now(),
          randomSeed: Math.floor(Math.random() * 100000),
          recentLengths: recentLengthsRef.current,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || `Draft generation failed (${res.status}).`);
      }

      if (!data.review?.trim()) {
        throw new Error("The API returned an empty draft.");
      }

      if (requestId !== requestIdRef.current) return;

      if (data.meta) {
        recentLengthsRef.current = [
          ...recentLengthsRef.current,
          data.meta,
        ].slice(-6);
      }

      setReviewDraft(data.review.trim());
    } catch (err) {
      if (err.name === "AbortError") return;

      if (requestId === requestIdRef.current) {
        setError(err.message || "Unable to generate a draft.");
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const delay = firstRunRef.current ? 0 : 350;
    firstRunRef.current = false;

    const t = setTimeout(
      () => generateAIReview(selectedLabels, language),
      delay
    );

    return () => {
      clearTimeout(t);
      abortControllerRef.current?.abort();
    };
  }, [mounted, selectedLabels, language, generateAIReview]);

  function handleChipChange(chipObj) {
    if (chipObj.label === "All") {
      if (
        selectedLabels.length === 1 &&
        selectedLabels[0] === "All"
      ) {
        generateAIReview(["All"], language);
      } else {
        setSelectedLabels(["All"]);
      }
      return;
    }

    let next = selectedLabels.filter((l) => l !== "All");

    if (next.includes(chipObj.label)) {
      next = next.filter((l) => l !== chipObj.label);
    } else {
      next = [...next, chipObj.label];
      if (next.length > 3) next = next.slice(-3);
    }

    setSelectedLabels(next.length ? next : ["All"]);
  }

  function handleLanguageChange(lang) {
    if (lang === language) {
      generateAIReview(selectedLabels, lang);
      return;
    }

    setLanguage(lang);
  }

  async function handleCopyAndRedirect() {
    if (!reviewDraft || loading || isTyping) return;

    const ok = await copyToClipboard(reviewDraft);

    if (!ok) {
      setError("Could not copy the draft. Please select and copy it manually.");
      return;
    }

    setCopied(true);

    setTimeout(() => {
      window.location.href = CLIENT_CONFIG.googleReviewUrl;
    }, 550);
  }

  function handleSaveContact() {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${CLIENT_CONFIG.businessName}
ORG:${CLIENT_CONFIG.businessName}
TEL;TYPE=CELL:${CLIENT_CONFIG.phone}
ADR;TYPE=WORK:;;${CLIENT_CONFIG.fullAddress};;;;
NOTE:${CLIENT_CONFIG.subHeading}
END:VCARD`;

    const blob = new Blob([vcard], {
      type: "text/vcard;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${CLIENT_CONFIG.businessName.replace(/\s+/g, "_")}.vcf`;

    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  if (!mounted) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#faf8f3",
        }}
      />
    );
  }

  return (
    <main className="soft-luxury-viewport">
      <div className="main-content-flow">
        {/* Logo */}
        <div className="brand-medallion-badge">
          <div
            className="logo-circle-container"
            style={{
              backgroundImage: `url(${CLIENT_CONFIG.logoUrl})`,
            }}
            role="img"
            aria-label={`${CLIENT_CONFIG.businessName} logo`}
          ></div>

          <h1 className="brand-main-title">
            {CLIENT_CONFIG.businessName}
          </h1>
        </div>

        <p className="brand-serif-subtitle">
          {CLIENT_CONFIG.subHeading}
        </p>

        <div className="royal-shahi-divider">
          <span className="divider-line"></span>
          <span className="divider-gem">◆</span>
          <span className="divider-line"></span>
        </div>

        <div className="stars-cluster" aria-hidden="true">
          <span>★</span>
          <span>★</span>
          <span>★</span>
          <span>★</span>
          <span>★</span>
        </div>

        <p className="experience-tracker-title">
          SHARE YOUR EXPERIENCE
        </p>

        {/* Filter Chips */}
        <div className="floating-pills-cloud">
          {CLIENT_CONFIG.chips.map((chip) => {
            const active = selectedLabels.includes(chip.label);

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

        <p className="chip-hint">
          Tap up to 3 keywords for your review
        </p>

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
              onClick={() => generateAIReview(selectedLabels, language)}
              className="top-rewrite-btn"
            >
              <span>Rewrite</span>
            </button>
          </div>

          <div className="review-display-zone">
            {loading ? (
              <div className="loader-shimmer-wrap">
                <span className="sparkle-icon">✦</span>
                <span className="shimmer-text">
                  Crafting authentic review...
                </span>
              </div>
            ) : error ? (
              <p className="review-error">{error}</p>
            ) : reviewDraft ? (
              <p className="review-body-text">
                {displayText}
                {isTyping && (
                  <span className="typewriter-cursor"></span>
                )}
              </p>
            ) : (
              <p className="review-placeholder">
                Your review draft will appear here.
              </p>
            )}
          </div>

          <div className="card-ornament-center">
            <span>◆</span>
          </div>

          <button
            type="button"
            disabled={loading || isTyping || !reviewDraft}
            onClick={handleCopyAndRedirect}
            className={`full-luxury-copy-btn ${copied ? "copied" : ""}`}
          >
            <span>
              {copied
                ? "Copied! Opening Google..."
                : "Copy & Paste on Google"}
            </span>
          </button>

          <p className="card-disclaimer-note">
            Please review the wording before posting.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-card">
          <div className="soft-action-grid">
            <div className="action-row-upper">
              {/* WhatsApp */}
              <a
                href={`https://wa.me/${CLIENT_CONFIG.cleanPhone}`}
                target="_blank"
                rel="noreferrer"
                className="soft-circle-action"
              >
                <div className="icon-disc whatsapp-disc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                </div>
                <span className="icon-tag">WhatsApp</span>
              </a>

              {/* Call Us */}
              <a href={`tel:${CLIENT_CONFIG.phone}`} className="soft-circle-action">
                <div className="icon-disc call-disc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <span className="icon-tag">Call Us</span>
              </a>

              {/* Save Contact */}
              <button
                type="button"
                onClick={handleSaveContact}
                className="soft-circle-action"
              >
                <div className="icon-disc contact-disc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <line x1="20" y1="8" x2="20" y2="14" />
                    <line x1="23" y1="11" x2="17" y2="11" />
                  </svg>
                </div>
                <span className="icon-tag">Save Contact</span>
              </button>

              {/* Directions */}
              <a
                href={CLIENT_CONFIG.mapsDirectionUrl}
                target="_blank"
                rel="noreferrer"
                className="soft-circle-action"
              >
                <div className="icon-disc map-disc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <span className="icon-tag">Directions</span>
              </a>
            </div>

            <div className="action-row-lower">
              {/* Instagram */}
              <a
                href={CLIENT_CONFIG.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="soft-circle-action"
              >
                <div className="icon-disc insta-disc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </div>
                <span className="icon-tag">Instagram</span>
              </a>

              {/* WhatsApp Channel */}
              <a
                href={CLIENT_CONFIG.whatsappChannelUrl}
                target="_blank"
                rel="noreferrer"
                className="soft-circle-action"
              >
                <div className="icon-disc wa-channel-disc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
                <span className="icon-tag">WA Channel</span>
              </a>

              {/* Facebook */}
              <a
                href={CLIENT_CONFIG.facebookUrl}
                target="_blank"
                rel="noreferrer"
                className="soft-circle-action"
              >
                <div className="icon-disc fb-disc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </div>
                <span className="icon-tag">Facebook</span>
              </a>

              {/* YouTube */}
              <a
                href={CLIENT_CONFIG.youtubeUrl}
                target="_blank"
                rel="noreferrer"
                className="soft-circle-action"
              >
                <div className="icon-disc yt-disc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
                    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" />
                  </svg>
                </div>
                <span className="icon-tag">YouTube</span>
              </a>
            </div>
          </div>
        </div>

        {/* Map Card */}
        <div className="embedded-map-card">
          <a
            href={CLIENT_CONFIG.mapsDirectionUrl}
            target="_blank"
            rel="noreferrer"
            className="map-card-header-link"
          >
            <div className="address-highlight-box">
              <p className="agency-clean-address">
                <strong>📍 Address:</strong> {CLIENT_CONFIG.fullAddress}
              </p>
            </div>

            <div className="map-card-header">
              <span>Visit Store • GTB Nagar, Delhi</span>
            </div>
          </a>

          <div className="map-iframe-container">
            <iframe
              title="Delhite Lakshay Store Location"
              src={MAP_EMBED_URL}
              width="100%"
              height="170"
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
        </div>

        {/* Mini Footer */}
        <footer className="mini-footer">
          <span className="mini-footer-pill">
            Powered by <strong>{CLIENT_CONFIG.agencyName}</strong>
            <span className="mini-footer-dot">•</span>
            Get QR:
            <a href={AGENCY_WA_LINK} target="_blank" rel="noreferrer">
              {CLIENT_CONFIG.agencyPhoneDisplay}
            </a>
          </span>
        </footer>
      </div>

      <style jsx global>{`
        /* =========================================
           SOFT LUXURY COLOR SYSTEM + 3D EFFECTS
           Layout and dimensions preserved
           ========================================= */

        .soft-luxury-viewport {
          min-height: 100vh;
          background: #faf8f3;
          padding: 10px 16px 24px;
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #493d35;
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
          margin-top: 2px;
          margin-bottom: 2px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .logo-circle-container {
          width: 98px;
          height: 98px;
          border-radius: 50%;
          background-color: transparent;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          box-shadow:
            0 10px 25px rgba(91, 65, 50, 0.16),
            0 3px 9px rgba(91, 65, 50, 0.09);
          margin-bottom: 8px;
          animation: floatLogo 3.5s ease-in-out infinite;
          border: 3px solid #d8c4a2;
          transition: transform 0.2s ease;
        }

        .logo-circle-container:active {
          transform: scale(0.96);
        }

        @keyframes floatLogo {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        @media (prefers-reduced-motion: reduce) {
          .logo-circle-container { animation: none; }
        }

        .brand-main-title {
          font-family: Georgia, serif;
          font-size: 23px;
          font-weight: 800;
          color: #63343a;
          margin: 0 0 4px;
          letter-spacing: 0.3px;
        }

        .brand-serif-subtitle {
          font-family: Georgia, serif;
          font-style: italic;
          font-size: 12.5px;
          color: #a98b60;
          margin: 0 0 4px;
        }

        .royal-shahi-divider {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 85%;
          margin: 4px auto 8px;
          gap: 10px;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            #d9c9b1,
            transparent
          );
        }

        .divider-gem {
          color: #b69a70;
          font-size: 8px;
        }

        .stars-cluster {
          display: flex;
          gap: 4px;
          color: #c3a16b;
          font-size: 14px;
          margin-bottom: 2px;
        }

        .chip-hint {
          text-align: center;
          font-size: 11px;
          color: #a39789;
          margin: 0 0 8px;
          letter-spacing: 0.3px;
        }

        .experience-tracker-title {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 2px;
          color: #75675c;
          text-transform: uppercase;
          margin: 0 0 8px;
        }

        .floating-pills-cloud {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 5px;
          margin: 0 auto 8px;
          width: 100%;
        }

        /* =========================================
           3D FILTER CHIPS
           ========================================= */

        .embossed-pill {
          position: relative;
          border-radius: 999px;
          padding: 6px 12px;
          font-size: 11.5px;

          background: linear-gradient(
            145deg,
            #ffffff 0%,
            #f5eee3 100%
          );

          color: #725b56;
          border: 1px solid #e3d6c3;
          cursor: pointer;

          box-shadow:
            0 4px 7px rgba(91, 65, 50, 0.11),
            0 1px 2px rgba(91, 65, 50, 0.07),
            inset 0 1px 1px rgba(255, 255, 255, 0.95),
            inset 0 -1px 1px rgba(170, 140, 105, 0.14);

          transition:
            transform 0.16s ease,
            box-shadow 0.16s ease,
            background 0.18s ease,
            color 0.18s ease,
            border-color 0.18s ease;
        }

        .embossed-pill:hover {
          transform: translateY(-2px);
          box-shadow:
            0 6px 10px rgba(91, 65, 50, 0.14),
            inset 0 1px 1px rgba(255, 255, 255, 0.95);
        }

        .embossed-pill:active {
          transform: translateY(2px) scale(0.98);
          box-shadow:
            0 1px 3px rgba(91, 65, 50, 0.13),
            inset 0 2px 4px rgba(91, 65, 50, 0.11);
        }

        /* Dark maroon selected chip */
        .embossed-pill.active {
          background: linear-gradient(
            145deg,
            #8f1e2e 0%,
            #651320 100%
          );

          color: #ffffff;
          border: 1px solid #580f1b;

          box-shadow:
            0 5px 10px rgba(117, 21, 34, 0.27),
            0 2px 3px rgba(117, 21, 34, 0.16),
            inset 0 1px 1px rgba(255, 255, 255, 0.22),
            inset 0 -2px 2px rgba(50, 5, 12, 0.20);
        }

        .embossed-pill.active:active {
          transform: translateY(2px);
          box-shadow:
            0 1px 3px rgba(117, 21, 34, 0.22),
            inset 0 2px 4px rgba(50, 5, 12, 0.20);
        }

        /* =========================================
           3D LANGUAGE SELECTOR
           ========================================= */

        .capsule-lang-dock {
          display: inline-flex;
          background: linear-gradient(
            145deg,
            #ffffff,
            #f3eadc
          );
          border-radius: 999px;
          padding: 4px;
          gap: 3px;
          margin: 0 auto 12px;
          box-shadow:
            0 5px 12px rgba(91, 65, 50, 0.12),
            inset 0 1px 2px rgba(255, 255, 255, 0.95),
            inset 0 -1px 2px rgba(170, 140, 105, 0.10);
          border: 1px solid #e3d6c3;
        }

        .capsule-lang-btn {
          position: relative;
          padding: 6px 19px;
          border-radius: 999px;
          border: 1px solid transparent;
          background: transparent;
          font-size: 10px;
          font-weight: 700;
          color: #85766a;
          cursor: pointer;
          transition:
            transform 0.16s ease,
            background 0.18s ease,
            box-shadow 0.18s ease;
        }

        /* Dark maroon selected language */
        .capsule-lang-btn.active {
          background: linear-gradient(
            145deg,
            #8f1e2e,
            #651320
          );
          color: #ffffff;
          border-color: #580f1b;
          box-shadow:
            0 4px 8px rgba(117, 21, 34, 0.25),
            inset 0 1px 1px rgba(255, 255, 255, 0.20),
            inset 0 -2px 2px rgba(50, 5, 12, 0.16);
        }

        .capsule-lang-btn:active {
          transform: translateY(2px);
        }

        /* =========================================
           3D REVIEW CARD
           ========================================= */

        .signature-review-box {
          width: 100%;
          background: linear-gradient(
            180deg,
            #fffefb 0%,
            #fbf7ef 100%
          );
          border-radius: 24px;
          padding: 18px;
          box-sizing: border-box;
          box-shadow:
            0 14px 30px rgba(91, 65, 50, 0.13),
            0 4px 10px rgba(91, 65, 50, 0.07),
            inset 0 1px 2px rgba(255, 255, 255, 0.95),
            inset 0 -2px 4px rgba(170, 140, 105, 0.08);
          margin-bottom: 16px;
          text-align: left;
          border: 1px solid #eae1d6;
          border-top: 4px solid #89535a;
          color: #493d35;
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
          color: #a19689;
          text-transform: uppercase;
        }

        .dot-ping {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #98656b;
        }

        /* =========================================
           3D REWRITE BUTTON
           ========================================= */

        .top-rewrite-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          padding: 6px 13px;
          border-radius: 999px;

          background: linear-gradient(
            145deg,
            #ffffff 0%,
            #f1e7d8 100%
          );

          border: 1px solid #e0d2bc;
          color: #80535a;
          font-size: 10.5px;
          font-weight: 700;
          cursor: pointer;

          box-shadow:
            0 3px 6px rgba(91, 65, 50, 0.11),
            inset 0 1px 1px rgba(255, 255, 255, 0.95),
            inset 0 -1px 2px rgba(170, 140, 105, 0.13);

          transition:
            transform 0.16s ease,
            box-shadow 0.16s ease,
            background 0.18s ease;
        }

        .top-rewrite-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow:
            0 5px 9px rgba(91, 65, 50, 0.15),
            inset 0 1px 1px rgba(255, 255, 255, 0.95);
        }

        .top-rewrite-btn:active:not(:disabled) {
          transform: translateY(2px);
          box-shadow:
            0 1px 2px rgba(91, 65, 50, 0.13),
            inset 0 2px 3px rgba(170, 140, 105, 0.16);
        }

        .top-rewrite-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .review-display-zone {
          min-height: 132px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px 2px 8px;
        }

        .loader-shimmer-wrap {
          color: #aa8e66;
          font-size: 12px;
          font-style: italic;
        }

        .review-body-text {
          font-family: Georgia, serif;
          font-size: 14.5px;
          line-height: 1.6;
          color: #403630;
          margin: 0;
          width: 100%;
          white-space: pre-wrap;
        }

        .review-placeholder {
          font-family: Georgia, serif;
          font-size: 13px;
          font-style: italic;
          color: #aaa094;
          margin: 0;
        }

        .review-error {
          font-size: 12px;
          color: #a45c62;
          margin: 0;
        }

        .typewriter-cursor {
          display: inline-block;
          width: 2px;
          height: 13px;
          background: #89535a;
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
          color: #c9b28e;
          font-size: 7px;
          margin: 6px 0 10px;
        }

        /* =========================================
           3D MAIN COPY BUTTON
           ========================================= */

        .full-luxury-copy-btn {
          position: relative;
          overflow: hidden;
          width: 100%;
          height: 50px;
          border-radius: 999px;

          background: linear-gradient(
            145deg,
            #8f1e2e 0%,
            #751522 48%,
            #5d0f1b 100%
          );

          border: 1px solid #5d0f1b;
          color: #ffffff;
          font-size: 12px;
          font-weight: 750;
          cursor: pointer;

          box-shadow:
            0 7px 13px rgba(117, 21, 34, 0.26),
            0 3px 5px rgba(80, 12, 22, 0.17),
            inset 0 1px 1px rgba(255, 255, 255, 0.23),
            inset 0 -2px 3px rgba(45, 5, 12, 0.22);

          transition:
            transform 0.16s ease,
            background 0.18s ease,
            box-shadow 0.16s ease,
            opacity 0.18s ease;
        }

        .full-luxury-copy-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow:
            0 10px 17px rgba(117, 21, 34, 0.29),
            0 4px 7px rgba(80, 12, 22, 0.17),
            inset 0 1px 1px rgba(255, 255, 255, 0.25);
        }

        .full-luxury-copy-btn:active:not(:disabled) {
          transform: translateY(2px);
          box-shadow:
            0 2px 4px rgba(117, 21, 34, 0.22),
            inset 0 3px 5px rgba(45, 5, 12, 0.22);
        }

        /* Dark maroon only after successful copy */
        .full-luxury-copy-btn.copied {
          background: linear-gradient(
            145deg,
            #7c1a29,
            #5d0f1b
          );
        }

        .full-luxury-copy-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          box-shadow: none;
        }

        .card-disclaimer-note {
          font-size: 9.5px;
          color: #a49a8f;
          text-align: center;
          margin: 8px 0 0;
          font-style: italic;
        }

        /* =========================================
           3D QUICK ACTIONS CARD
           ========================================= */

        .quick-actions-card {
          width: 100%;
          background: linear-gradient(
            180deg,
            #fffefb 0%,
            #fbf7ef 100%
          );
          border-radius: 22px;
          padding: 18px 12px;
          box-sizing: border-box;
          border: 1px solid #eae1d6;
          box-shadow:
            0 10px 24px rgba(91, 65, 50, 0.11),
            0 3px 8px rgba(91, 65, 50, 0.06),
            inset 0 1px 2px rgba(255, 255, 255, 0.95),
            inset 0 -2px 4px rgba(170, 140, 105, 0.07);
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
          gap: 14px;
          width: 100%;
        }

        .action-row-lower {
          display: flex;
          justify-content: center;
          gap: 14px;
          width: 100%;
        }

        .soft-circle-action {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          text-decoration: none !important;
          color: #66564b;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
          -webkit-tap-highlight-color: transparent;
          transition: transform 0.18s ease;
        }

        .soft-circle-action:hover {
          transform: translateY(-3px);
        }

        .soft-circle-action:active {
          transform: translateY(2px) scale(0.96);
        }

        /* =========================================
           3D ACTION ICON DISCS
           ========================================= */

        .icon-disc {
          position: relative;
          width: 50px;
          height: 50px;
          border-radius: 50%;

          background: linear-gradient(
            145deg,
            #ffffff 0%,
            #f3e8d8 100%
          );

          display: grid;
          place-items: center;
          border: 1px solid #ddcdb5;

          box-shadow:
            0 7px 12px rgba(91, 65, 50, 0.14),
            0 2px 4px rgba(91, 65, 50, 0.09),
            inset 0 2px 3px rgba(255, 255, 255, 0.95),
            inset 0 -2px 3px rgba(170, 140, 105, 0.14);

          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease,
            background 0.18s ease,
            border-color 0.18s ease;
        }

        /* Glossy top highlight */
        .icon-disc::before {
          content: "";
          position: absolute;
          top: 3px;
          left: 7px;
          right: 7px;
          height: 35%;
          border-radius: 50%;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.5),
            rgba(255, 255, 255, 0)
          );
          pointer-events: none;
        }

        .icon-disc svg {
          position: relative;
          z-index: 1;
          width: 20px;
          height: 20px;
          stroke: #80535a;
          filter: drop-shadow(0 1px 0 rgba(255, 255, 255, 0.7));
          transition: stroke 0.2s ease;
        }

        .soft-circle-action:hover .icon-disc {
          box-shadow:
            0 10px 16px rgba(91, 65, 50, 0.17),
            0 3px 5px rgba(91, 65, 50, 0.10),
            inset 0 2px 3px rgba(255, 255, 255, 0.95);
        }

        .soft-circle-action:active .icon-disc {
          box-shadow:
            0 2px 4px rgba(91, 65, 50, 0.14),
            inset 0 3px 5px rgba(170, 140, 105, 0.16);
        }

        .whatsapp-disc:hover {
          background: linear-gradient(145deg, #42e486, #1aaf58);
          border-color: #169c4d;
        }
        .whatsapp-disc:hover svg { stroke: #ffffff; }

        .call-disc:hover {
          background: linear-gradient(145deg, #45a4ff, #0874d1);
          border-color: #0868bd;
        }
        .call-disc:hover svg { stroke: #ffffff; }

        .contact-disc:hover {
          background: linear-gradient(145deg, #9b4250, #751522);
          border-color: #641622;
        }
        .contact-disc:hover svg { stroke: #ffffff; }

        .map-disc:hover {
          background: linear-gradient(145deg, #ff776b, #e34539);
          border-color: #cf382e;
        }
        .map-disc:hover svg { stroke: #ffffff; }

        .insta-disc:hover {
          background: radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%);
          border-color: transparent;
        }
        .insta-disc:hover svg { stroke: #ffffff; }

        .wa-channel-disc:hover {
          background: linear-gradient(145deg, #42e486, #1aaf58);
          border-color: #169c4d;
        }
        .wa-channel-disc:hover svg { stroke: #ffffff; }

        .fb-disc:hover {
          background: linear-gradient(145deg, #4095ff, #1877f2);
          border-color: #1266cf;
        }
        .fb-disc:hover svg { stroke: #ffffff; }

        .yt-disc:hover {
          background: linear-gradient(145deg, #ff4848, #cc0000);
          border-color: #b00000;
        }
        .yt-disc:hover svg { stroke: #ffffff; color: #ffffff; }

        .icon-tag {
          font-size: 9.5px;
          font-weight: 700;
          color: #66564b;
        }

        /* =========================================
           3D MAP CARD
           ========================================= */

        .embedded-map-card {
          width: 100%;
          background: linear-gradient(
            180deg,
            #fffefb 0%,
            #fbf7ef 100%
          );
          border-radius: 22px;
          padding: 14px 16px;
          box-sizing: border-box;
          border: 1px solid #eae1d6;
          box-shadow:
            0 9px 22px rgba(91, 65, 50, 0.10),
            0 3px 7px rgba(91, 65, 50, 0.05),
            inset 0 1px 2px rgba(255, 255, 255, 0.95),
            inset 0 -2px 4px rgba(170, 140, 105, 0.06);
          margin-bottom: 12px;
          text-align: left;
        }

        .map-card-header-link {
          text-decoration: none;
        }

        .map-card-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 800;
          color: #80535a;
          margin-bottom: 8px;
        }

        .map-iframe-container {
          width: 100%;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid #e3d6c3;
          box-shadow:
            0 3px 8px rgba(91, 65, 50, 0.08),
            inset 0 1px 2px rgba(91, 65, 50, 0.06);
          margin-bottom: 8px;
        }

        .map-directions-link {
          font-size: 11px;
          font-weight: 750;
          color: #a88a61;
          text-decoration: none;
          display: block;
          text-align: center;
          margin-bottom: 8px;
        }

        .address-highlight-box {
          background: linear-gradient(
            145deg,
            #fdf9f2,
            #f5ede0
          );
          border-radius: 12px;
          padding: 10px 12px;
          border: 1px solid #e3d6c3;
          box-shadow:
            0 3px 6px rgba(91, 65, 50, 0.07),
            inset 0 1px 1px rgba(255, 255, 255, 0.95),
            inset 0 -1px 2px rgba(170, 140, 105, 0.10);
          margin-bottom: 8px;
        }

        .agency-clean-address {
          font-size: 10.5px;
          color: #65564a;
          margin: 0;
          line-height: 1.4;
          text-align: center;
        }

        /* =========================================
           3D MINI FOOTER
           ========================================= */

        .mini-footer {
          width: 100%;
          display: flex;
          justify-content: center;
          margin-top: 2px;
        }

        .mini-footer-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 4px;
          padding: 5px 12px;
          border: 1px solid #e3d6c3;
          border-radius: 999px;
          background: linear-gradient(
            145deg,
            #ffffff,
            #f7f0e4
          );
          box-shadow:
            0 3px 7px rgba(91, 65, 50, 0.09),
            inset 0 1px 1px rgba(255, 255, 255, 0.95),
            inset 0 -1px 2px rgba(170, 140, 105, 0.10);
          font-size: 8.5px;
          letter-spacing: 0.3px;
          color: #a19689;
          line-height: 1.4;
        }

        .mini-footer-pill strong {
          color: #80535a;
          font-weight: 700;
        }

        .mini-footer-dot {
          color: #c9b28e;
        }

        .mini-footer-pill a {
          color: #80535a;
          font-weight: 700;
          text-decoration: none;
        }

        /* =========================================
           MOBILE TOUCH
           ========================================= */

        button,
        a {
          -webkit-tap-highlight-color: transparent;
        }

        @media (prefers-reduced-motion: reduce) {
          .embossed-pill,
          .capsule-lang-btn,
          .top-rewrite-btn,
          .full-luxury-copy-btn,
          .soft-circle-action,
          .icon-disc {
            transition: none;
          }
        }
      `}</style>
    </main>
  );
}
