import { useState, useRef, useCallback, useEffect } from 'react'
import { STYLES, LOADING_STEPS, EMPTY_TAGS } from './constants.js'
import { analyzePhoto } from './api.js'
import { parseSections, parseScores, parseVariations, parseHashtags } from './parser.js'

// ── TOAST ──────────────────────────────────────────────────────────────────
function Toast({ message, show }) {
  return <div className={`toast ${show ? 'show' : ''}`}>{message}</div>
}

// ── SECURE ACCESS BANNER ───────────────────────────────────────────────────
function AccessBanner({ authenticated, checking, onLogin, onLogout }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onLogin(password);
      setPassword("");
    } catch (err) {
      setError(err.message || "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="api-banner access-banner">
      <span className="api-banner__label">SECURE ACCESS</span>
      {checking ? (
        <span className="api-banner__status">Checking session…</span>
      ) : authenticated ? (
        <div className="access-banner__active">
          <span className="api-banner__status ok">✓ Private session active · API key stays on server</span>
          <button type="button" className="access-banner__button" onClick={onLogout}>Lock</button>
        </div>
      ) : (
        <form className="access-banner__form" onSubmit={submit}>
          <input
            className="api-banner__input"
            type="password"
            autoComplete="current-password"
            placeholder="Private access password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            maxLength={256}
            required
          />
          <button className="access-banner__button" type="submit" disabled={busy || !password}>
            {busy ? "Unlocking…" : "Unlock Photo Master"}
          </button>
        </form>
      )}
      {error && <span className="access-banner__error" role="alert">{error}</span>}
    </div>
  );
}

// ── UPLOAD ZONE ─────────────────────────────────────────────────────────────
function UploadZone({ image, onFile }) {
  const inputRef = useRef()
  const [drag, setDrag] = useState(false)

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return
    onFile(file)
  }, [onFile])

  return (
    <div
      className={`upload-zone ${drag ? 'upload-zone--drag' : ''}`}
      onClick={() => inputRef.current.click()}
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]) }}
    >
      {image ? (
        <>
          <img src={image} alt="Preview" className="upload-preview" />
          <div className="upload-overlay">✦ Change Photo</div>
        </>
      ) : (
        <div className="upload-placeholder">
          <span className="upload-placeholder__icon">◻</span>
          <div className="upload-placeholder__title">Drop your portrait here</div>
          <div className="upload-placeholder__hint">
            or click to select<br />
            <mark>JPG · PNG · WEBP · max 20 MB</mark>
          </div>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files[0])}
      />
    </div>
  )
}

// ── STYLE SELECTOR ──────────────────────────────────────────────────────────
function StyleSelector({ value, onChange }) {
  return (
    <div className="style-grid">
      {STYLES.map(s => (
        <button
          key={s.id}
          className={`style-btn ${value === s.id ? 'active' : ''}`}
          onClick={() => onChange(s.id)}
        >
          <span className="style-btn__emoji">{s.emoji}</span>
          <span className="style-btn__name">{s.name}</span>
          <span className="style-btn__desc">{s.desc}</span>
        </button>
      ))}
    </div>
  )
}

// ── OPTIONS ─────────────────────────────────────────────────────────────────
function Options({ value, onChange }) {
  const opts = [
    { key: 'prompt',     label: 'Midjourney / DALL-E Prompt' },
    { key: 'variations', label: '3 Creative Variations' },
    { key: 'viral',      label: 'Viral & Social Media Optimization' },
    { key: 'scores',     label: 'Quality Scores (1–10)' },
  ]
  return (
    <div className="options-list">
      {opts.map(o => (
        <label key={o.key} className="option-row">
          <input
            type="checkbox"
            checked={value[o.key]}
            onChange={e => onChange({ ...value, [o.key]: e.target.checked })}
          />
          <span className="option-row__label">{o.label}</span>
        </label>
      ))}
    </div>
  )
}

// ── LOADING ─────────────────────────────────────────────────────────────────
function LoadingState({ stepIndex }) {
  return (
    <div className="loading-wrap">
      <div className="loading-ring" />
      <div className="loading-title">Analyzing your portrait…</div>
      <div className="loading-sub">Full AI workflow in progress</div>
      <div className="loading-steps">
        {LOADING_STEPS.map((step, i) => (
          <div
            key={i}
            className={`loading-step ${i === stepIndex ? 'active' : i < stepIndex ? 'done' : ''}`}
          >
            <span>{i < stepIndex ? '✓' : i === stepIndex ? '◼' : '◻'}</span>
            <span>{step}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── PROMPT BLOCK ─────────────────────────────────────────────────────────────
function PromptBlock({ text, onCopy }) {
  return (
    <div className="prompt-block" onClick={() => onCopy(text)} title="Click to copy">
      <span className="prompt-block__copy">click to copy</span>
      {text}
    </div>
  )
}

// ── SCORE CARDS ──────────────────────────────────────────────────────────────
function ScoreCards({ scores }) {
  if (!scores.length) return null
  return (
    <div className="scores-grid">
      {scores.map(s => (
        <div key={s.label} className="score-card">
          <div className="score-card__label">{s.label}</div>
          <div className="score-card__change">
            {s.orig}/10 → <span>{s.enhanced}/10</span>
          </div>
          <div className="score-bar-track">
            <div className="score-bar-fill" style={{ width: `${s.enhanced * 10}%` }} />
          </div>
          <div className="score-card__value">{s.enhanced}<span className="score-card__max">/10</span></div>
        </div>
      ))}
    </div>
  )
}

// ── VARIATION CARDS ──────────────────────────────────────────────────────────
function VariationCards({ variations, onCopy }) {
  if (!variations.length) return null
  return (
    <div className="variation-cards">
      {variations.map(v => (
        <div key={v.num} className="variation-card">
          <div className="variation-card__header">
            <span className="variation-card__num">Var {v.num}</span>
            <span className="variation-card__name">{v.name}</span>
          </div>
          <div className="variation-card__body">
            {v.body.split('\n').filter(Boolean).map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
          {v.prompt && (
            <div
              className="variation-card__prompt"
              onClick={() => onCopy(v.prompt)}
              title="Click to copy prompt"
            >
              📋 {v.prompt}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── HASHTAG LIST ─────────────────────────────────────────────────────────────
function HashtagList({ tags, onCopy }) {
  if (!tags.length) return null
  return (
    <div className="hashtag-list">
      {tags.map(tag => (
        <span key={tag} className="hashtag" onClick={() => onCopy(tag)}>{tag}</span>
      ))}
    </div>
  )
}

// ── REPORT BODY ──────────────────────────────────────────────────────────────
function ReportBody({ text, onCopy }) {
  if (!text) return null
  const sections = parseSections(text)

  return (
    <div>
      {sections.map((sec, i) => {
        const isScores    = sec.title.includes('QUALITY SCORES') || sec.title.includes('⭐')
        const isPrompt    = sec.title.includes('MIDJOURNEY') || sec.title.includes('DALL-E') || sec.title.includes('🖼')
        const isVariation = sec.title.includes('VARIATION') || sec.title.includes('🔁')
        const isViral     = sec.title.includes('VIRAL') || sec.title.includes('📱')

        return (
          <div key={i} className="report-section" style={{ animationDelay: `${i * 0.07}s` }}>
            <div className="report-heading">{sec.title}</div>

            {isScores ? (
              <ScoreCards scores={parseScores(sec.body)} />
            ) : isPrompt ? (
              <PromptBlock text={sec.body} onCopy={onCopy} />
            ) : isVariation ? (
              <VariationCards variations={parseVariations(sec.body)} onCopy={onCopy} />
            ) : isViral ? (
              <>
                <BodyText text={sec.body} onCopy={onCopy} />
                <HashtagList tags={parseHashtags(sec.body)} onCopy={onCopy} />
              </>
            ) : (
              <BodyText text={sec.body} onCopy={onCopy} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function renderInlineText(value) {
  const tokens = value.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return tokens.map((token, index) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      return <strong key={index}>{token.slice(2, -2)}</strong>
    }
    if (token.startsWith('*') && token.endsWith('*')) {
      return <em key={index}>{token.slice(1, -1)}</em>
    }
    return token
  })
}

function BodyText({ text }) {
  if (!text) return null
  const lines = text.split('\n')
  return (
    <div className="report-text">
      {lines.map((line, i) => {
        if (!line.trim()) return <br key={i} />
        if (line.match(/^[-*]\s/)) {
          return (
            <div key={i} className="report-bullet">
              <span className="report-bullet__dot">◆</span>
              <span>{renderInlineText(line.replace(/^[-*]\s/, ''))}</span>
            </div>
          )
        }
        if (line.match(/^\d+\.\s/)) {
          const num = line.match(/^\d+/)[0]
          return (
            <div key={i} className="report-num">
              <span className="report-num__n">{num}.</span>
              <span>{renderInlineText(line.replace(/^\d+\.\s/, ''))}</span>
            </div>
          )
        }
        return <p key={i}>{renderInlineText(line)}</p>
      })}
    </div>
  )
}

// ── EMPTY STATE ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-state__title">Your Enhancement Report</div>
      <div className="empty-state__sub">
        Upload a portrait · Select a style<br />
        Receive a full cinematic AI analysis
      </div>
      <div className="empty-tags">
        {EMPTY_TAGS.map(tag => <span key={tag} className="empty-tag">{tag}</span>)}
      </div>
    </div>
  )
}

async function compressImageToBase64(file) {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Please upload a JPG, PNG or WEBP image.");
  }
  if (file.size > 20 * 1024 * 1024) {
    throw new Error("The original image is too large. Choose a file under 20 MB.");
  }

  let source = null;
  let temporaryUrl = null;

  try {
    if (typeof createImageBitmap === "function") {
      source = await createImageBitmap(file);
    } else {
      temporaryUrl = URL.createObjectURL(file);
      source = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("The selected image could not be opened."));
        img.src = temporaryUrl;
      });
    }

    const sourceWidth = source.width || source.naturalWidth;
    const sourceHeight = source.height || source.naturalHeight;
    if (!sourceWidth || !sourceHeight) throw new Error("The selected image has invalid dimensions.");

    const renderJpeg = async (maxDimension, quality) => {
      const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(sourceWidth * scale));
      canvas.height = Math.max(1, Math.round(sourceHeight * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Image compression is unavailable in this browser.");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(source, 0, 0, canvas.width, canvas.height);
      return await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    };

    let blob = await renderJpeg(2048, 0.82);
    if (!blob) throw new Error("The image could not be prepared for analysis.");
    if (blob.size > 3 * 1024 * 1024) {
      blob = await renderJpeg(1600, 0.68);
    }
    if (!blob || blob.size > 3 * 1024 * 1024) {
      throw new Error("The compressed image is still too large. Choose a smaller image.");
    }

    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const value = String(reader.result || "");
        const separator = value.indexOf(",");
        if (separator < 0) reject(new Error("Could not read the compressed image."));
        else resolve(value.slice(separator + 1));
      };
      reader.onerror = () => reject(new Error("Could not read the compressed image."));
      reader.readAsDataURL(blob);
    });
  } finally {
    if (source && typeof source.close === "function") source.close();
    if (temporaryUrl) URL.revokeObjectURL(temporaryUrl);
  }
}

// ── ROOT APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [authState, setAuthState]     = useState('checking')
  const [image, setImage]             = useState(null)
  const [imageBase64, setImageBase64] = useState(null)
  const [imageType, setImageType]     = useState('image/jpeg')
  const [style, setStyle]             = useState('auto')
  const [opts, setOpts]               = useState({ prompt: true, variations: true, viral: true, scores: true })
  const [status, setStatus]           = useState('idle') // idle | loading | done | error
  const [result, setResult]           = useState(null)
  const [error, setError]             = useState(null)
  const [stepIndex, setStepIndex]     = useState(0)
  const [toast, setToast]             = useState({ show: false, msg: '' })
  const stepTimerRef                  = useRef(null)
  const uploadSequenceRef              = useRef(0)

  // Remove the old browser-stored key and restore the server session.
  useEffect(() => {
    try { localStorage.removeItem("pmai_key"); } catch {}
    let active = true;
    fetch("/api/auth", { credentials: "same-origin", cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Session check failed.");
        return data;
      })
      .then((data) => {
        if (active) setAuthState(data.authenticated ? "authenticated" : "anonymous");
      })
      .catch(() => {
        if (active) setAuthState("anonymous");
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    return () => {
      if (image) URL.revokeObjectURL(image);
    };
  }, [image]);

  const handleLogin = async (password) => {
    const response = await fetch("/api/auth", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", password })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Sign-in failed.");
    setAuthState("authenticated");
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" })
      });
    } finally {
      setAuthState("anonymous");
      setResult(null);
      setStatus("idle");
    }
  };

  const showToast = (msg) => {
    setToast({ show: true, msg })
    setTimeout(() => setToast(t => ({ ...t, show: false })), 2500)
  }

  const copyText = useCallback((text) => {
    navigator.clipboard.writeText(text).then(() => showToast('✦ Copied to clipboard'))
  }, [])

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Please upload a JPG, PNG or WEBP image.");
      setStatus("error");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("The original image is too large. Choose a file under 20 MB.");
      setStatus("error");
      return;
    }

    const requestId = ++uploadSequenceRef.current;
    setImage(URL.createObjectURL(file));
    setImageBase64(null);
    setImageType("image/jpeg");
    setResult(null);
    setError(null);
    setStatus("idle");

    try {
      const encoded = await compressImageToBase64(file);
      if (requestId === uploadSequenceRef.current) setImageBase64(encoded);
    } catch (err) {
      if (requestId === uploadSequenceRef.current) {
        setError(err.message || "Could not prepare this image.");
        setStatus("error");
      }
    }
  }, []);

  const handleClear = () => {
    uploadSequenceRef.current += 1;
    setImage(null);
    setImageBase64(null);
    setResult(null);
    setError(null);
    setStatus("idle");
  };

  const startStepAnimation = () => {
    setStepIndex(0)
    let i = 0
    stepTimerRef.current = setInterval(() => {
      i++
      if (i < LOADING_STEPS.length) setStepIndex(i)
      else clearInterval(stepTimerRef.current)
    }, 1400)
  }

  const stopStepAnimation = () => {
    if (stepTimerRef.current) clearInterval(stepTimerRef.current)
  }

  const handleEnhance = async () => {
    if (!imageBase64) return
    if (authState !== 'authenticated') {
      setError('Unlock Photo Master AI before starting an analysis.')
      return
    }

    setStatus('loading')
    setError(null)
    setResult(null)
    startStepAnimation()

    try {
      const text = await analyzePhoto({ imageBase64, imageType, style, opts })
      stopStepAnimation()
      setResult(text)
      setStatus('done')
    } catch (err) {
      stopStepAnimation()
      if (err.status === 401) setAuthState('anonymous')
      setError(err.message)
      setStatus('error')
    }
  }

  const styleLabel = STYLES.find(s => s.id === style)?.name || 'Auto AI'

  return (
    <>
      {/* HEADER */}
      <header className="header">
        <div className="header__scan" />
        <div className="header__eyebrow">✦ Professional AI Portrait Enhancement ✦</div>
        <h1 className="header__title">Photo Master <em>AI</em></h1>
        <p className="header__sub">Cinematic · Ultra-Realistic · 8K Quality · Multi-Style</p>
        <div className="header__ornament">
          <div className="header__ornament-line" />
          <span className="header__ornament-text">Powered by Claude</span>
          <div className="header__ornament-line" />
        </div>
      </header>

      {/* API KEY BANNER */}
      <AccessBanner authenticated={authState === 'authenticated'} checking={authState === 'checking'} onLogin={handleLogin} onLogout={handleLogout} />

      {/* MAIN LAYOUT */}
      {authState === 'authenticated' ? (
        <div className="layout">

        {/* LEFT */}
        <div className="left-panel">

          <div>
            <span className="u-label">01 — Upload Portrait</span>
            <UploadZone image={image} onFile={handleFile} />
          </div>

          <div>
            <span className="u-label">02 — Enhancement Preset</span>
            <StyleSelector value={style} onChange={setStyle} />
          </div>

          <div>
            <span className="u-label">03 — Options</span>
            <Options value={opts} onChange={setOpts} />
          </div>

          <button
            className="btn-enhance"
            onClick={handleEnhance}
            disabled={!imageBase64 || authState !== 'authenticated' || status === 'loading'}
          >
            {status === 'loading' ? '⟳   Processing Portrait…' : '✦   Enhance & Analyze'}
          </button>

          {image && (
            <button className="btn-clear" onClick={handleClear}>
              ✕ &nbsp; Clear & Upload New Photo
            </button>
          )}

          {(status === 'error' || error) && (
            <div className="error-msg">
              ⚠ &nbsp;{error}
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="right-panel">
          {status === 'idle' && !result && <EmptyState />}

          {status === 'loading' && (
            <div className="results-card">
              <div className="results-topbar">
                <div className="results-dot" />
                <div className="results-title">Processing…</div>
                <div className="results-badge">{styleLabel}</div>
              </div>
              <LoadingState stepIndex={stepIndex} />
            </div>
          )}

          {status === 'done' && result && (
            <div className="results-card">
              <div className="results-topbar">
                <div className="results-dot" />
                <div className="results-title">Enhancement Report — Complete</div>
                <div className="results-actions">
                  <button className="results-action-btn" onClick={() => copyText(result)}>Copy All</button>
                  <button
                    className="results-action-btn"
                    onClick={() => {
                      const blob = new Blob([result], { type: 'text/plain' })
                      const a = document.createElement('a')
                      a.href = URL.createObjectURL(blob)
                      a.download = 'photo-master-report.txt'
                      a.click()
                    }}
                  >
                    Export
                  </button>
                </div>
                <div className="results-badge">{styleLabel}</div>
              </div>
              <div className="results-body">
                <ReportBody text={result} onCopy={copyText} />
              </div>
            </div>
          )}
        </div>
      </div>
      ) : (
        <section className="access-gate">
          <div className="access-gate__card">
            <div className="access-gate__eyebrow">PRIVATE WORKSPACE</div>
            <h2>Unlock Photo Master AI</h2>
            <p>Enter your private access password above. Your Anthropic API key stays on the server and is never sent to this browser.</p>
            <div className="access-gate__note">
              {authState === 'checking' ? 'Checking your secure session…' : 'Protected by a signed, eight-hour session.'}
            </div>
          </div>
        </section>
      )}


      {/* FOOTER */}
      <footer className="footer">
        Photo Master <mark>AI</mark> &nbsp;·&nbsp; Cinematic Portrait Enhancement &nbsp;·&nbsp; Powered by <mark>Claude</mark>
      </footer>

      {/* TOAST */}
      <Toast message={toast.msg} show={toast.show} />
    </>
  )
}
