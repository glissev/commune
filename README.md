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

## Deploying to Firebase Hosting

The repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically builds and deploys the app to Firebase Hosting whenever you push to `main`.

### One-time setup

#### 1. Generate a Firebase service account key

1. Open the [Firebase console](https://console.firebase.google.com/) and select your project.
2. Go to **Project settings** (gear icon) → **Service accounts**.
3. Click **Generate new private key** and confirm. A JSON file will be downloaded to your machine.
4. **Keep this file private** — do not commit it to the repository.

#### 2. Add secrets to GitHub

Go to your repository on GitHub → **Settings → Secrets and variables → Actions → New repository secret** and add each of the following secrets:

| Secret name | Where to find the value |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | Paste the **entire contents** of the downloaded service account JSON file |
| `VITE_FIREBASE_API_KEY` | Firebase console → Project settings → General → Your apps → Web API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `<project-id>.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase console → Project settings → General → Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | `<project-id>.firebasestorage.app` (or `<project-id>.appspot.com` for older projects — check the Firebase console) |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase console → Project settings → General → Sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase console → Project settings → General → App ID |

#### 3. Local development

Copy `.env.example` to `.env.local` and fill in the values from your Firebase project settings:

```bash
cp .env.example .env.local
```

### Triggering a deployment

Push any commit to the `main` branch:

```bash
git push origin main
```

The workflow will:
1. Install dependencies with `npm ci`.
2. Build the production bundle with `npm run build` (injecting the `VITE_*` secrets as environment variables).
3. Deploy the `dist/` folder to Firebase Hosting.

Once the **Deploy to Firebase Hosting** workflow completes, your site will be live at:

```
https://<your-project-id>.web.app
```

You can monitor the workflow progress under the **Actions** tab of your repository.

## License

[MIT](LICENSE)
