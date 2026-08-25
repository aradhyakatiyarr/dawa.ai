# DawaAI 💊

**DawaAI** is a production-grade, end-to-end web application built to reduce out-of-pocket healthcare expenses for Indian citizens. By scanning or uploading a brand-name medicine packaging photo, DawaAI automatically identifies the active chemical ingredients (salts), matches them against official government-subsidized generic equivalents (saving up to 90% of costs), provides patient safety instructions in multiple regional languages (English, Hindi, Tamil, Telugu), and displays an interactive map of nearby government-certified generic pharmacies (**Jan Aushadhi Kendras**).

## 🚀 Key Features

* **Medicine Packaging Scanner:** Upload any medicine strip or bottle image. The app automatically matches ingredients against the generic equivalents.
* **Instant Savings Calculator:** Compares estimated brand prices with capped generic rates, highlighting percentage savings (typically 80-90% reductions).
* **Multilingual AI Safety Explainer:** Explains medicine purpose, standard dosage, side effects, and warning alerts in four major languages: **English, Hindi (हिंदी), Tamil (தமிழ்), and Telugu (తెలుగు)**.
* **Audio Voice Guides:** Built-in Text-To-Speech (TTS) synthesizer that reads safety warnings aloud in regional Indian accents—assisting elderly or visually impaired users.
* **Jan Aushadhi Store Locator:** Interactive Leaflet maps centering on your city or current geolocated coordinates, pinning nearby pharmacies with directions and phone numbers.
* **Searchable Scan History:** Logged-in users have their scan results saved to a secure SQL database history. You can search, delete, or click scan cards to reload details instantly.
* **User Profile & Settings:** Allows users to modify details (names, emails) and change passwords securely.
* **Admin Dashboard Console:** System administration panel to monitor users, count total platform scans, calculate cumulative platform savings, update roles, and manage users.
* **Interactive Demo Mode:** Built-in sample buttons (Augmentin 625, Calpol 650, Glycomet GP 1) that bypass key requirements so judges can test all components immediately with 0 configurations.

---

## 🛠️ Tech Stack

* **Frontend:** Next.js (App Router), React, Tailwind CSS, Lucide React (Icons).
* **Database & ORM:** SQLite database connected via Prisma ORM (Version 6).
* **Authentication:** Secure stateless JSON Web Token (JWT) session cookies.
* **Geo-Mapping:** Leaflet & `react-leaflet`.

---

## 💻 Getting Started (Local Development)

Follow these steps to run the application locally on your machine:

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) (v18+ recommended) and `npm` installed.

### 2. Clone the Repository & Install Dependencies
```bash
# Go to the project root directory
cd dawa-ai

# Install packages
npm install
```

### 3. Setup the Database
DawaAI uses a zero-configuration SQLite database locally. Run the following command to create the schema and generate the Prisma Client:
```bash
npx prisma db push
```
This automatically creates a local database file `prisma/dev.db` and generates TypeScript bindings.

### 4. Run the Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚀 Deployment to Vercel

To deploy DawaAI to production in under a minute:

1. Push your code to a GitHub repository:
   ```bash
   git remote add origin <YOUR_GITHUB_REPO_URL>
   git branch -M main
   git push -u origin main
   ```
2. Log in to [Vercel](https://vercel.com/) and import your repository.
3. Vercel will automatically detect the **Next.js** framework and configure build presets.
4. Click **Deploy**. Vercel will build and launch your application!

---

## 🛡️ Medical Disclaimer
DawaAI is designed for consumer awareness, pricing comparison, and health literacy only. It **does not** provide medical advice, diagnosis, or treatment. Always consult a certified physician or pharmacist before substituting any medication. Do not stop prescribed treatment without explicit medical consent.
