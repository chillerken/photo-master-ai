import { SYSTEM_PROMPT, buildPrompt } from './constants.js'

export async function analyzePhoto({ imageBase64, imageType, style, styleLabel, opts, apiKey }) {
  const userPrompt = buildPrompt(styleLabel, opts)

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: imageType, data: imageBase64 }
          },
          { type: 'text', text: userPrompt }
        ]
      }]
    })
  })

  const data = await response.json()
  if (data.error) throw new Error(data.error.message)

  const text = data.content?.find(b => b.type === 'text')?.text
  if (!text) throw new Error('No response from AI. Please try again.')
  return text
}
