# Self-Hosted Fonts

This directory contains the woff2 font files for the Patyka landing page:

- **Instrument Serif** (headings: h1-h3)
  - `InstrumentSerif-Regular.woff2` — weight 400
  - `InstrumentSerif-Italic.woff2` — weight 400 italic

- **DM Sans** (body text)
  - `DMSans-Regular.woff2` — weight 400
  - `DMSans-Medium.woff2` — weight 500
  - `DMSans-Bold.woff2` — weight 700

## How to Download

Run these commands from the project root:

```bash
# Instrument Serif 400 (Regular)
curl -L "https://fonts.gstatic.com/s/instrumentserif/v4/jiz2RFNsm2sKkBTkbkDhD8aL8z0P.woff2" \
  -o public/fonts/InstrumentSerif-Regular.woff2

# Instrument Serif 400 Italic
curl -L "https://fonts.gstatic.com/s/instrumentserif/v4/jizHRFNsm2sKkBTkbkDhD8aL8z0PLR1T.woff2" \
  -o public/fonts/InstrumentSerif-Italic.woff2

# DM Sans 400 (Regular)
curl -L "https://fonts.gstatic.com/s/dmsans/v15/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcZG40Yq6A.woff2" \
  -o public/fonts/DMSans-Regular.woff2

# DM Sans 500 (Medium)
curl -L "https://fonts.gstatic.com/s/dmsans/v15/rP2tp2ywxg089UriI5-g4vlH9VoD8Cmc0m40Yq6A.woff2" \
  -o public/fonts/DMSans-Medium.woff2

# DM Sans 700 (Bold)
curl -L "https://fonts.gstatic.com/s/dmsans/v15/rP2tp2ywxg089UriI5-g4vlH9VoD8Cmc8G40Yq6A.woff2" \
  -o public/fonts/DMSans-Bold.woff2
```

> **Note**: These Google Fonts CDN URLs may change. If a download fails, visit
> https://fonts.google.com/specimen/Instrument+Serif and https://fonts.google.com/specimen/DM+Sans
> and download the latest woff2 files manually.
>
> Once downloaded, uncomment the `localFont` configuration in `app/layout.tsx` to switch
> from Google Fonts CDN to self-hosted fonts.
