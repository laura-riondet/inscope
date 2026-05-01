# inscope.app

> Your Gmail, in focus. Unread by sender. Unsubscribe and delete in one click.

## How it works

- Signs in with Google — no account needed
- Groups your unread emails by sender with counts
- One click to find unsubscribe links or delete everything from a sender
- Your emails never leave your browser — no backend, ever

## Privacy

This app has no server. All Gmail API calls happen directly from your browser via Google's official API. We never see, store, or transmit your email data. Tokens live in `sessionStorage` only and are cleared when you close the tab.

## Development

```bash
# 1. Clone the repo
git clone <repo-url>
cd inscope

# 2. Set up environment
cp .env.example .env
# Edit .env and add your Google OAuth Client ID (see CONTRIBUTING.md for setup steps)

# 3. Install dependencies
npm install

# 4. Start dev server
npm run dev
```

The app runs at `http://localhost:5173`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT
