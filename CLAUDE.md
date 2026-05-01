# CLAUDE.md — inscope.app

> This file is the source of truth for Claude Code when building, committing, and maintaining this project.
> Read it fully before writing any code, creating any file, or making any commit.

---

## What is inscope.app

A privacy-first Gmail inbox manager. Users sign in with Google, see their unread emails grouped by sender with counts, and can unsubscribe or bulk delete per sender — all without any data ever leaving their browser.

**Core value proposition:** No backend. No data collection. No subscriptions. Open source.

**Tone:** Calm, in-control, intentional. Not "your inbox is a disaster" — more "here's what's in scope, here's what isn't."

---

## Architecture overview

### The fundamental constraint

This is a **100% frontend application**. There is no server, no database, no backend API. The app is a static bundle of HTML/CSS/JS deployed on Vercel.

All Gmail operations happen via direct browser-to-Google API calls using an OAuth 2.0 PKCE flow. The OAuth client ID is public (this is normal and safe for PKCE). Tokens live in the browser session only and are never transmitted to any server you own.

### Tech stack

```
inscope.app/
├── Vite           — build tool and dev server
├── React          — UI framework
├── TypeScript     — mandatory, no plain JS
├── Gmail API      — via fetch() directly from the browser
├── OAuth 2.0 PKCE — via Google Identity Services (GIS) library
└── Vercel         — static hosting, auto-deploy from main
```

No backend. No Express. No Next.js. No database. No environment secrets (client ID is public).

### Folder structure

```
inscope.app/
├── public/
│   └── favicon.ico
├── src/
│   ├── api/
│   │   ├── gmail.ts          — all Gmail API calls (search, get thread, trash, headers)
│   │   └── auth.ts           — OAuth PKCE flow, token management
│   ├── components/
│   │   ├── SenderList.tsx    — main grouped sender view
│   │   ├── SenderDetail.tsx  — per-sender thread list + actions
│   │   ├── ThreadRow.tsx     — individual thread display
│   │   └── AuthScreen.tsx    — sign-in screen
│   ├── hooks/
│   │   ├── useGmail.ts       — data fetching logic
│   │   └── useAuth.ts        — auth state
│   ├── utils/
│   │   ├── unsubscribe.ts    — List-Unsubscribe header parsing
│   │   ├── senderLabel.ts    — domain → friendly name mapping
│   │   └── batch.ts          — Gmail API batch request helper
│   ├── types/
│   │   └── gmail.ts          — TypeScript types for Gmail API responses
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.example               — documents VITE_GOOGLE_CLIENT_ID (no secrets, just documents)
├── .gitignore
├── .eslintrc.json
├── .prettierrc
├── CLAUDE.md                  — this file
├── CONTRIBUTING.md
├── CHANGELOG.md
├── LICENSE                    — MIT
├── README.md
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## V1 — what to build first

V1 is a focused, shippable product. Do not add V2 features to V1. Ship small, ship clean.

### V1 features

**Auth**
- Google OAuth 2.0 PKCE flow via the Google Identity Services JS library
- Token stored in `sessionStorage` only (cleared on tab close — intentional, privacy-first)
- Silent token refresh within the session
- Sign out clears token and resets all state

**Sender list view**
- Fetch all unread threads via Gmail API (`is:unread`, paginated, up to 200 threads)
- Group by sender email address
- Display: sender avatar (initials + deterministic color), friendly name, email address, unread count
- Sort by count descending
- Filter/search input (client-side, instant)
- Summary line: total unread count + number of distinct senders
- Loading state while fetching
- Error state with retry

**Sender detail view**
- Click a sender row → slide into detail view
- List their unread threads: subject, snippet, date
- Three actions:
  1. **Find unsubscribe link** — reads `List-Unsubscribe` header from one of their emails, shows as button if found
  2. **Unsubscribe** — if `mailto:`, fires automatically; if `https://`, opens in new tab
  3. **Delete all** — moves all threads from this sender to Gmail trash (via `threads.trash` API call, batched)
- Back button returns to sender list
- After delete: sender disappears from list, count updates

**Privacy**
- No analytics, no tracking, no cookies beyond the session token
- `Content-Security-Policy` header via `vercel.json` — no external scripts except Google's
- README clearly states the no-backend architecture

### V1 explicitly excludes

- Scheduled or automated runs
- Outlook / Yahoo / other providers
- "Deploy your own" button (V2)
- Stats over time
- CSV export
- Custom rules or filters
- Any form of user accounts or persistence beyond the session

---

## V2 — planned but not now

Document these as GitHub Issues with the `v2` label when V1 ships. Do not build them yet.

**Self-host / deploy your own**
- `vercel.json` one-click deploy button in README
- User brings their own Google Cloud client ID
- `SELF_HOSTING.md` guide walking through Google Cloud Console setup step by step

**Scheduled auto-clean**
- Requires a lightweight backend (token storage server-side)
- Evaluate: Vercel serverless functions + encrypted token storage
- Only viable once Google verification is complete

**Stats dashboard**
- Emails deleted over time, top senders historically
- All computable client-side from localStorage with timestamps

**Multi-account support**
- Switch between multiple signed-in Gmail accounts

**Bulk actions across senders**
- Select multiple senders, delete all or unsubscribe all in one pass

**Outlook / IMAP support**
- Different OAuth provider, different API — separate tracked issue

---

## OAuth and Gmail API implementation notes

### PKCE flow

Use the Google Identity Services library (`accounts.google.com/gsi/client`). Do NOT use the deprecated `gapi.auth2`.

```typescript
// The client ID is public — safe to expose in frontend code
// It lives in .env as VITE_GOOGLE_CLIENT_ID for configurability
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify', // needed for trash
].join(' ');
```

Request only the scopes you actually use. `gmail.modify` is needed for trash. Do not request `gmail.compose` or broader scopes.

### Gmail API calls

All calls are plain `fetch()` to `https://gmail.googleapis.com`. No SDK needed.

**Fetching unread threads:**
```
GET /gmail/v1/users/me/threads?q=is:unread&maxResults=50
```
Paginate using `nextPageToken`. Fetch up to 4 pages (200 threads) for V1.

**Getting thread headers (for List-Unsubscribe):**
```
GET /gmail/v1/users/me/threads/{threadId}?format=metadata&metadataHeaders=List-Unsubscribe&metadataHeaders=From
```
Use `format=metadata` — never fetch full message bodies unless explicitly needed. Cheaper quota-wise and better for privacy optics.

**Trashing a thread:**
```
POST /gmail/v1/users/me/threads/{threadId}/trash
```

**Batching:**
Gmail API supports batch requests (`https://www.googleapis.com/batch/gmail/v1`). Use batching when trashing multiple threads — max 100 per batch request. The `src/utils/batch.ts` helper should handle this.

### List-Unsubscribe header parsing

```typescript
// Header value examples:
// <mailto:unsubscribe@sender.com>, <https://sender.com/unsub?id=123>
// <https://sender.com/unsub>
// mailto:unsubscribe@sender.com

function parseUnsubscribeHeader(header: string): {
  mailto: string | null;
  https: string | null;
} {
  const mailto = header.match(/<mailto:([^>]+)>/)?.[1] ?? null;
  const https = header.match(/<(https:\/\/[^>]+)>/)?.[1] ?? null;
  return { mailto, https };
}
```

Prefer `mailto:` for silent unsubscribe (send a blank email via `gmail.send`). Fall back to opening `https://` URL in a new tab.

### Rate limits

Gmail API quota: 250 units/second per user. Each thread fetch = 1 unit, each trash = 5 units. For bulk delete of 50+ threads, add a 100ms delay between batches. Never fire unbatched parallel requests.

---

## GitHub best practices — follow these exactly

### Branch strategy

```
main          — always deployable, protected, never commit directly
feat/*        — new features (e.g. feat/unsubscribe-header)
fix/*         — bug fixes (e.g. fix/token-refresh-loop)
chore/*       — maintenance, deps, config (e.g. chore/update-eslint)
docs/*        — documentation only (e.g. docs/update-readme)
```

Never push directly to `main`. Always open a PR, even when working solo.

### Commit message format — conventional commits, mandatory

```
<type>(<scope>): <short description>

[optional body]

[optional footer: Closes #issue]
```

**Types:**
- `feat` — new feature visible to users
- `fix` — bug fix
- `chore` — tooling, deps, config, no production code change
- `docs` — documentation only
- `refactor` — code change that neither fixes a bug nor adds a feature
- `test` — adding or updating tests
- `style` — formatting, whitespace (not CSS — use `feat` or `refactor` for that)
- `perf` — performance improvement

**Scope** (optional but preferred): `auth`, `api`, `ui`, `unsubscribe`, `delete`, `deps`

**Examples:**
```
feat(auth): add Google OAuth PKCE flow
fix(api): handle expired token on thread fetch
chore(deps): upgrade vite to 5.2.0
docs: add self-hosting guide to README
feat(unsubscribe): parse List-Unsubscribe mailto header
fix(ui): sender count not updating after bulk delete
refactor(api): extract batch helper to utils/batch.ts
perf(api): reduce thread fetches with metadata-only format
```

**Rules:**
- Description is lowercase, no period at end
- Max 72 characters for the subject line
- Body explains *why*, not *what* — the diff shows what
- Always reference the Issue number in the footer when one exists: `Closes #12`

### Pull request format

Title follows the same conventional commit format as the commits inside it.

Body template:
```markdown
## What
One paragraph describing what this PR does.

## Why
Why this change was needed. Link to the Issue.

## How
Any non-obvious implementation decisions worth explaining.

## Testing
How you verified it works.

Closes #<issue number>
```

Keep PRs small and focused. One feature or fix per PR. If a PR is touching more than ~300 lines, consider splitting it.

### Issues

Every piece of work gets an Issue before it gets code. Even solo.

**Labels to set up at repo creation:**
- `bug` — something is broken
- `enhancement` — new feature or improvement
- `good first issue` — simple, well-scoped, good for contributors
- `documentation` — docs only
- `v1` — in scope for initial release
- `v2` — planned but not now
- `question` — needs discussion before building
- `wontfix` — acknowledged but won't address

**Issue title format:** short, imperative, lowercase
```
add List-Unsubscribe header parsing
fix token refresh on session expiry
write self-hosting guide
```

**Issue body should include:**
- What problem this solves
- Proposed approach (if known)
- Acceptance criteria — how do you know it's done?

### Milestones

Create two milestones at repo setup:
- `v1.0.0` — everything needed to ship the hosted product
- `v2.0.0` — self-host, scheduled runs, multi-account

Assign every Issue to a milestone.

### Releases and versioning

Semantic versioning: `MAJOR.MINOR.PATCH`
- `PATCH` — bug fixes, no new features (0.1.1)
- `MINOR` — new features, backwards compatible (0.2.0)
- `MAJOR` — breaking changes or major product milestone (1.0.0)

Tag releases in GitHub with a GitHub Release. Write a short human changelog per release — what's new, what's fixed, what's changed. Not auto-generated noise, actual sentences.

`CHANGELOG.md` is maintained manually, newest at top:
```markdown
## [1.0.0] — 2026-06-01
### Added
- Bulk delete all emails from a sender
- List-Unsubscribe header parsing and one-click unsubscribe

### Fixed
- Token refresh loop on long sessions
```

---

## Code style and quality

### TypeScript

- Strict mode on (`"strict": true` in tsconfig)
- No `any` — use `unknown` and narrow, or define proper types
- All Gmail API response shapes typed in `src/types/gmail.ts`
- All functions have explicit return types

### ESLint + Prettier

Configured at repo setup, never disabled inline except with explicit justification comment.

`.prettierrc`:
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### Component rules

- One component per file
- Props interfaces defined above the component, named `[ComponentName]Props`
- No inline styles — use CSS modules or a consistent className approach
- Loading and error states handled in every data-fetching component

### Error handling

Every Gmail API call wrapped in try/catch. Errors surface to the UI — never swallowed silently. User always knows if something failed and can retry.

---

## Environment variables

Only one env var in V1:

```bash
# .env.example — commit this, it documents what's needed
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id_here
```

`.env` is in `.gitignore`. `.env.example` is committed. Never commit actual credentials.

The client ID is not a secret — it's a public identifier for the OAuth app. It's safe in frontend code. Document this clearly in CONTRIBUTING.md so contributors aren't confused.

---

## Vercel deployment

`vercel.json` at root:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' https://accounts.google.com https://apis.google.com; connect-src 'self' https://gmail.googleapis.com https://www.googleapis.com https://oauth2.googleapis.com; frame-src https://accounts.google.com;"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

Vercel auto-deploys on every push to `main`. Preview deployments on every PR — share the preview URL in the PR body for review.

---

## README structure

The README is the product's front door. Write it like a landing page, not a technical doc.

```markdown
# inscope.app

> Your Gmail, in focus. Unread by sender. Unsubscribe and delete in one click.

[Screenshot or GIF here]

## How it works
- Signs in with Google — no account needed
- Groups your unread emails by sender
- One click to unsubscribe or delete everything from a sender
- Your emails never leave your browser — no backend, ever

## Privacy
This app has no server. All Gmail API calls happen directly from your browser.
We never see, store, or transmit your email data. [Read more →](PRIVACY.md)

## Development
[local setup instructions]

## Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md)

## License
MIT
```

---

## CONTRIBUTING.md structure

```markdown
# Contributing to inscope.app

## Local setup
1. Clone the repo
2. Copy `.env.example` to `.env` and fill in your Google OAuth client ID
3. `npm install`
4. `npm run dev`

## Creating a Google OAuth client ID
[step-by-step instructions — this is the main friction point for contributors]

## Branch and commit conventions
[link to the relevant section of CLAUDE.md or repeat the key rules]

## Opening a PR
[link to PR template or describe the format]

## Good first issues
[link to GitHub Issues filtered by good first issue label]
```

---

## Google OAuth app setup (one-time, do at project start)

1. Go to console.cloud.google.com → New Project → name it "inscope"
2. APIs & Services → Enable APIs → enable Gmail API
3. OAuth consent screen → External → fill in app name, support email, homepage URL
4. Scopes → add `gmail.readonly` and `gmail.modify`
5. Test users → add your own email + any beta testers (up to 100 in test mode)
6. Credentials → Create credentials → OAuth 2.0 Client ID → Web application
7. Authorized JavaScript origins: `http://localhost:5173`, `https://inscope.app`
8. Authorized redirect URIs: `http://localhost:5173`, `https://inscope.app`
9. Copy the client ID → add to `.env`

Submit for Google verification only when ready for public launch. Until then, test users work fine.

---

## What done looks like for V1

V1 is shippable when:

- [ ] User can sign in with Google and sign out
- [ ] Unread emails load and group by sender correctly
- [ ] Sender list is filterable
- [ ] Clicking a sender shows their threads
- [ ] "Find unsubscribe link" works for senders with `List-Unsubscribe` header
- [ ] Unsubscribe fires for `mailto:` / opens URL for `https://`
- [ ] "Delete all" moves threads to Gmail trash
- [ ] Sender disappears from list after delete
- [ ] Loading and error states exist everywhere
- [ ] Works on mobile (responsive)
- [ ] Deployed to inscope.app on Vercel
- [ ] README is complete
- [ ] CHANGELOG has a v1.0.0 entry
- [ ] No console errors in production build
- [ ] CSP headers set in vercel.json
