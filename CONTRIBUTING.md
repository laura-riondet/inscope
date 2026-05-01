# Contributing to inscope.app

## Local setup

1. Clone the repo and `cd` into it
2. Copy `.env.example` to `.env`
3. Add your Google OAuth Client ID (see below)
4. `npm install`
5. `npm run dev`

## Creating a Google OAuth Client ID

The Client ID is a public identifier — it's safe to include in frontend code. This is normal and by design for OAuth PKCE flows.

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project named "inscope" (or any name)
3. **APIs & Services → Enable APIs** → search for and enable **Gmail API**
4. **OAuth consent screen** → External → fill in app name, support email, homepage URL
5. **Scopes** → add `gmail.readonly` and `gmail.modify`
6. **Test users** → add your Gmail address (required while the app is in test mode)
7. **Credentials → Create credentials → OAuth 2.0 Client ID → Web application**
8. Authorized JavaScript origins: `http://localhost:5173`
9. Authorized redirect URIs: `http://localhost:5173`
10. Copy the Client ID → paste into `.env` as `VITE_GOOGLE_CLIENT_ID`

## Branch and commit conventions

See [CLAUDE.md](CLAUDE.md) for the full branch strategy and conventional commit format.

Quick reference:
- Branch: `feat/*`, `fix/*`, `chore/*`, `docs/*`
- Commits: `feat(scope): description` — lowercase, no period

## Opening a PR

Follow the PR template: What / Why / How / Testing. Keep PRs under ~300 lines. Every PR needs a linked Issue.

## Good first issues

Check GitHub Issues filtered by `good first issue`.
