# Pocketwise 📱💸

A premium, mobile-first personal expense tracker built as a Progressive Web App (PWA) with React, Vite, Tailwind CSS, and local-first data storage (IndexedDB).

## Features
- **Local-First Privacy**: Your financial data stays in your browser via Dexie.js (IndexedDB). No backend servers.
- **Progressive Accrual**: Daily and weekly recurring expenses calculate dynamically up to the current date for an accurate real-time balance.
- **Forecast vs. Auto-Record**: Choose whether scheduled expenses just impact your forecast balance or automatically generate real transaction logs on the due date.
- **Cloud Sync**: Securely back up your encrypted local database to your personal Google Drive.
- **PWA Ready**: Installable on iOS (Safari -> Add to Home Screen) and Android.

## Setup & Development (Windows)

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Local Development Server**
   ```bash
   npm run dev
   ```

3. **Run Unit Tests**
   ```bash
   npm run test
   ```

## Configuring Google Drive Backup

Since this is a client-side application, it uses Google Identity Services (GIS) to securely upload/download backup files directly to your Drive without any intermediate servers.

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new Project (e.g., "Pocketwise Personal").
3. Go to **APIs & Services > Credentials**.
4. Click **Create Credentials > OAuth client ID**.
5. Choose **Web application**.
6. Set the **Authorized JavaScript origins** to your deployed GitHub Pages URL (e.g., `https://yourusername.github.io`) and `http://localhost:5173` for local testing.
7. Copy the generated **Client ID**.
8. Open the Pocketwise app, go to **Settings > Data & Backup**, paste the Client ID, and hit Save. You can now backup/restore!

## Deploying to GitHub Pages

1. Build the app:
   ```bash
   npm run build
   ```
2. The `dist` folder will be generated. You can use `gh-pages` or GitHub Actions to deploy the contents of the `dist` folder to your `gh-pages` branch.
   *Ensure you have configured `base: '/repository-name/'` in `vite.config.ts` if it's not hosted at the root of a domain.*

## Installing on iPhone

1. Open your deployed Pocketwise URL in **Safari**.
2. Tap the **Share** button at the bottom of the screen.
3. Scroll down and tap **Add to Home Screen**.
4. You now have a native-feeling Pocketwise app icon on your device with offline support!
