# Photo Master AI

Cinematic portrait analysis and enhancement planning powered by Anthropic Claude.

## Features

- Six portrait style presets: Auto AI, Cinematic, Fitness, Fashion, Viral and Fantasy.
- Photo analysis, enhancement plans and creative direction.
- Midjourney / DALL-E prompts, creative variations, social optimization and quality scores.
- Copy and export analysis reports.
- Private password-protected access.
- Anthropic API calls run only on the server. The browser never receives the provider API key.
- Portraits are resized and compressed in the browser before upload.

## Architecture

- React 18 + Vite frontend.
- Vercel Node.js functions in \`/api\`.
- Signed, HttpOnly, SameSite=Strict session cookie.
- Server-side Anthropic API proxy.
- No third-party runtime dependencies beyond React and Vite.

This is a single shared-password workspace, not a multi-user account system.

## Local setup

Requirements: Node.js 20 or newer.

\`\`\`bash
npm install
\`\`\`

Create a local \`.env\` file using \`.env.example\` as a guide. Set:

- \`ANTHROPIC_API_KEY\`: your private Anthropic API key.
- \`APP_ACCESS_PASSWORD\`: a strong private access password, at least 12 characters.
- \`SESSION_SECRET\`: a random secret of at least 32 characters.
- \`ANTHROPIC_MODEL\`: optional; defaults to \`claude-opus-4-5\`.

Generate a session secret with:

\`\`\`bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
\`\`\`

Run the full app locally through the Vercel development server:

\`\`\`bash
npx vercel dev
\`\`\`

Do not use \`npm run dev\` alone for end-to-end testing: Vite serves the frontend, but it does not execute the \`/api\` serverless functions.

## Vercel deployment

1. Import this repository into Vercel.
2. Set the project framework to Vite if Vercel does not detect it automatically.
3. Add the environment variables below in Vercel Project Settings → Environment Variables for the required deployment environments.
4. Redeploy after saving the variables.

Required:

| Variable | Purpose |
| --- | --- |
| \`ANTHROPIC_API_KEY\` | Server-only Anthropic credential |
| \`APP_ACCESS_PASSWORD\` | Shared password for the private workspace |
| \`SESSION_SECRET\` | Random signing secret, 32+ characters |

Optional:

| Variable | Default |
| --- | --- |
| \`ANTHROPIC_MODEL\` | \`claude-opus-4-5\` |

The app requires Vercel Functions. Static-only hosting (for example, uploading just the \`dist\` folder to a static host) will not provide the authenticated API endpoints.

## Security controls

- Provider credentials are read from server environment variables only.
- No API key is accepted from the browser or saved to localStorage. The old \`pmai_key\` localStorage value is removed when the app starts.
- Login uses a signed, eight-hour HttpOnly cookie with Secure enabled in production.
- Login and analysis endpoints reject cross-origin requests.
- Login attempts are limited to five per IP per 15-minute window in each warm function instance.
- Analysis is limited to twenty requests per signed session per hour in each warm function instance.
- Image uploads accept JPEG, PNG or WEBP; the browser converts them to JPEG and caps the processed image at 3 MB.
- AI-generated report text is rendered as text/React nodes, never inserted as raw HTML.
- Baseline security headers are configured in \`vercel.json\`.

### Rate-limit limitation

The built-in rate limiter uses in-memory state. Serverless instances can scale or restart, so these limits are best-effort protections, not a durable global quota. Before sharing the app publicly, enable Vercel Firewall rate limiting and configure spending/usage limits in the Anthropic account. Do not treat the in-memory limit as a substitute for provider-side billing controls.

## Tests

\`\`\`bash
npm test
npm run build
\`\`\`

GitHub Actions runs the security tests and frontend build on pushes to the security branch and on pull requests to \`main\`.

## Environment and secret handling

- Never commit \`.env\`, real API keys, passwords or session secrets.
- If a provider key has ever been exposed in a public bundle or repository, revoke it in the provider console and create a replacement.
- Use a long, unique password. Do not reuse an email, banking or other account password.
- The shared-password login is intended for a private owner-operated tool. Add a proper identity provider before turning this into a public multi-user service.

## Project structure

\`\`\`text
api/
  analyze.js
  auth.js
lib/
  server-security.js
src/
  App.jsx
  api.js
  constants.js
  index.css
  main.jsx
  parser.js
tests/
  security.test.js
\`\`\`
