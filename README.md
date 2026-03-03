# Commune

A modern community web application built with React and Vite. Features threaded discussions, emoji reactions, private messaging, and user profiles — all wrapped in a sleek dark UI.

![Commune Screenshot](docs/screenshot.png)

## Features

- **Authentication** — Sign up and sign in with username/password. Auto-generated letter avatars and online/away/offline status indicators.
- **Threaded Discussions** — Create categorized threads (General, Resources, Showcase, Help, Off-topic), post replies with inline reply context, and pin important threads.
- **Emoji Reactions** — React to any post with 8 built-in emojis. Toggle reactions on/off with aggregated counts per emoji.
- **Private Messaging** — Direct message any user with real-time conversation view, unread badges, and read tracking.
- **User Profiles** — Editable display name, bio, and visible status with join date.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm (comes with Node.js)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/commune.git
cd commune

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app will open at [http://localhost:3000](http://localhost:3000).

### Demo Credentials

The app ships with seeded demo data. Sign in with any of these accounts (all passwords are `pass123`):

| Username        | Display Name   |
| --------------- | -------------- |
| `alex_dev`      | Alex Chen      |
| `maria_design`  | Maria Santos   |
| `jt_writes`     | Jordan Taylor  |
| `sam_ops`       | Sam Kim        |

### Build for Production

```bash
npm run build
npm run preview   # preview the production build locally
```

The optimized output is written to the `dist/` directory.

## Project Structure

```
commune/
├── public/
│   └── favicon.svg
├── src/
│   ├── App.jsx          # Main application component (all views)
│   └── main.jsx         # React entry point
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Tech Stack

- **React 18** — UI framework with hooks-based state management
- **Vite 6** — Lightning-fast dev server and build tool
- **Inline styles** — Zero-dependency styling, no build step for CSS

## Notes

- All data is stored in-memory (React state). Refreshing the page resets to the seed data.
- To add persistence, swap the in-memory stores with a backend API or localStorage.
- The app is fully self-contained in a single component file for simplicity. For a production app you'd split it into separate component files.

## Deploying to GitHub Pages

The repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically builds and deploys the app to GitHub Pages whenever you push to `main`.

### One-time setup

1. Go to your repository on GitHub.
2. Navigate to **Settings → Pages**.
3. Under **Build and deployment → Source**, select **GitHub Actions**.
4. Save the settings.

### Triggering a deployment

Push any commit to the `main` branch:

```bash
git push origin main
```

The workflow will:
1. Install dependencies with `npm ci`.
2. Build the production bundle with `npm run build`.
3. Upload the `dist/` folder as a Pages artifact.
4. Deploy the artifact to GitHub Pages.

Once the **Deploy to GitHub Pages** workflow completes, your site will be live at:

```
https://<your-github-username>.github.io/commune/
```

You can monitor the workflow progress under the **Actions** tab of your repository.

## License

[MIT](LICENSE)
