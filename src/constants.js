export const STYLES = [
  { id: 'auto',      emoji: '⚡', name: 'Auto AI',   desc: 'AI decides'      },
  { id: 'cinematic', emoji: '🎬', name: 'Cinematic', desc: 'Hollywood drama'  },
  { id: 'fitness',   emoji: '💪', name: 'Fitness',   desc: 'Athletic power'   },
  { id: 'fashion',   emoji: '👗', name: 'Fashion',   desc: 'Luxury editorial' },
  { id: 'viral',     emoji: '🌐', name: 'Viral',     desc: 'Social media'     },
  { id: 'fantasy',   emoji: '🧙', name: 'Fantasy',   desc: 'Concept art'      },
]

export const LOADING_STEPS = [
  'Detecting facial features & composition',
  'Analyzing lighting & color temperature',
  'Planning enhancement workflow',
  'Executing cinematic style',
  'Generating Midjourney prompts',
  'Rendering creative variations',
  'Viral & social optimization',
  'Quality scoring & final output',
]

export const EMPTY_TAGS = [
  'Ultra-Realistic', 'HDR Grading', 'Iris Detail', 'Skin Realism',
  'Cinematic Lighting', 'Creative Variations', 'Viral Optimization', 'MJ Prompts',
]

export const SYSTEM_PROMPT = `You are Photo Master AI — a world-class cinematic portrait photographer, AI retoucher, and creative director. You have 20 years of experience at Vogue, Netflix, and global fashion houses.

You produce hyper-detailed, specific, professional enhancement reports. Never be generic. Always be cinematic, specific, and inspiring.

RULES:
- Analyze the actual photo content with precision
- Be specific about what you see and what to enhance
- Sound like a world-class creative director reviewing work
- Use vivid, cinematic, technical language
- For prompts: be hyper-specific (exact lens mm, f-stop, lighting technique names, color grade names)
- Maintain the subject's identity — no drastic facial changes
- Output exactly the sections requested, using ## headers exactly as given
- For scores: use exact format: CATEGORY: X/10 → Y/10
- Each section should be substantial and detailed`

export function buildPrompt(styleName, opts) {
  const sections = []

  sections.push(`## 📸 PHOTO ANALYSIS
Precisely analyze: lighting quality & direction, color temperature, composition & framing, background, depth of field, emotional mood & impact, skin texture, facial features, symmetry, shadows & highlights. What makes this photo compelling or what holds it back?`)

  sections.push(`## ✨ ENHANCEMENT PLAN
Detail every specific enhancement step for this photo:
- Face: symmetry refinement, eye enhancement (iris detail, catchlights, lash sharpness), skin (pores, healthy glow, targeted blemish work), jawline definition, hair texture
- Lighting: key light + rim light + fill simulation, shadow sculpting
- Color: temperature, contrast, saturation, skin tone optimization
- Composition: depth-of-field, foreground/background separation, crop adjustment`)

  sections.push(`## 🎨 ${styleName.toUpperCase()} STYLE EXECUTION
Describe in extreme detail the final ${styleName} look for this specific photo:
- Exact lighting setup name and position
- Color grade recipe (temperature K, contrast curves, highlight/shadow toning, LUT style)
- Mood, atmosphere, emotional feeling
- Specific skin treatment and texture approach
- Final aesthetic vision in one powerful sentence`)

  if (opts.prompt) {
    sections.push(`## 🖼️ MIDJOURNEY / DALL-E PROMPT
Generate one complete, ready-to-use image generation prompt. Write it as a single flowing paragraph. Include: detailed subject description matching this photo, exact lighting setup, 85mm f/1.8 lens, specific camera (Phase One IQ4 or Hasselblad), color grade style, mood keywords, technical quality suffix. End with: --ar 4:5 --style raw --v 6.1`)
  }

  if (opts.variations) {
    sections.push(`## 🔁 3 CREATIVE VARIATIONS
Describe 3 distinct stylistic alternative versions:

VARIATION 1 — [Name]: [Concept]. Lighting: [specific]. Color: [specific]. Twist: [specific]. Prompt: [ready-to-use MJ prompt]

VARIATION 2 — [Name]: [Concept]. Lighting: [specific]. Color: [specific]. Twist: [specific]. Prompt: [ready-to-use MJ prompt]

VARIATION 3 — [Name]: [Concept]. Lighting: [specific]. Color: [specific]. Twist: [specific]. Prompt: [ready-to-use MJ prompt]`)
  }

  if (opts.viral) {
    sections.push(`## 📱 VIRAL OPTIMIZATION
- Emotional hook: what makes this image stop-the-scroll
- Composition improvements for feed/reel format
- Suggested caption (ready to post, max 150 chars)
- 10 strategic hashtags (mix of niche + broad)
- Platform strategy: Instagram / TikTok / LinkedIn / Pinterest recommendations`)
  }

  if (opts.scores) {
    sections.push(`## ⭐ QUALITY SCORES
Rate original and predicted enhanced version on each axis using EXACTLY this format:
Lighting: X/10 → Y/10
Composition: X/10 → Y/10
Emotional Impact: X/10 → Y/10
Technical Quality: X/10 → Y/10
Viral Potential: X/10 → Y/10`)
  }

  return `Analyze and enhance this portrait photo using the **${styleName}** style preset. Execute the full Photo Master AI workflow as a world-class creative director. Be extremely detailed and specific about what you see in THIS exact photo.

${sections.join('\n\n')}

Be cinematic, inspiring, and precise. This is for a professional portfolio.`
}
