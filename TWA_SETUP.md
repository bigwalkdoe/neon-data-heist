# TWA / Play Store Setup (Bubblewrap)

1. Host the app (we pushed to gh-pages). Get the URL, e.g. `https://bigwalkdoe.github.io/neon-data-heist/`
2. Install Bubblewrap: `npm i -g @bubblewrap/cli` (or use npx)
3. Init: `bubblewrap init --manifest https://bigwalkdoe.github.io/neon-data-heist/manifest.webmanifest` (or create twa-manifest.json)
4. Build: `bubblewrap build` to generate AAB/APK
5. Set up Digital Asset Links for your domain/app
6. Upload AAB to Google Play Console

Note: You'll need Android SDK/JDK. See [Bubblewrap docs](https://github.com/GoogleChromeLabs/bubblewrap).

## Quick twa-manifest.json template
```json
{
  "packageId": "com.bigwalkdoe.neondataheist",
  "host": "bigwalkdoe.github.io",
  "name": "Neon Data Heist",
  "startUrl": "/neon-data-heist/",
  "displayMode": "fullscreen",
  "orientation": "landscape",
  "themeColor": "#00e5ff",
  "backgroundColor": "#000000"
}
```
Adjust host/startUrl for your deployment.
