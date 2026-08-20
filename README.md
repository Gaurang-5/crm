# 🌿 Wellness & Nutrition Coaching Platform + Cash Profit Sheet

Complete digital coaching platform and automated WhatsApp sales CRM built for wellness & nutrition coaches.

---

## 🚀 Core Features

### 1. WhatsApp-First Conversational Intake & Gemini AI Health Analysis (PDF Page 5)
- Customer texts `START` or `नमस्ते` over WhatsApp.
- Guided conversational flow collects: Gender, Age, Height, Current Weight, and Health Challenges.
- **Google Gemini AI** generates an instant personalized health report in natural **Hindi** with summary, actionable suggestions, and targets.
- Auto-generates a branded, high-resolution **Health & Body Composition Analysis PDF** and shares the download link directly on WhatsApp.
- Sends instant notification to Coach.

### 2. Gated Pricing & Zoom Community Funnel
- Customer is invited to the live Morning Wellness Club on Zoom.
- **Strict Price Protection Guardrail**: Prices (Basic: ₹8,400, Elite: ₹12,070) are **never** revealed to customers until they attend the live Zoom session and are marked as `ATTENDED_ZOOM`.
- If asked for prices before attending, the bot politely guides them to attend the session first.

### 3. Post-Zoom Membership & Flavor Customizer
- Once marked `ATTENDED_ZOOM` (via Coach command `/ATTENDED <phone>` or Web Portal):
- Customer selects their plan:
  - **Basic Membership** (₹8,400 | 1 Meal Shake/day | Pick 2 F1 Flavors + 1 Afresh Flavor)
  - **Elite / Pro Membership** (₹12,070 | 2 Meal Shakes/day | Pick 3 F1 Flavors + 2 Afresh Flavors)
- **Formula 1 Shake Flavors**: Chocolate 🍫, Strawberry 🍓, Vanilla 🍦, Kulfi 🍨, Rose Kheer 🌹, Banana Caramel 🍌🍯, Mango 🥭, Orange Cream 🍊, Paan 🌿
- **Afresh Energy Drink Flavors**: Ginger 🫚, Lemon 🍋, Kashmiri Kahwa 🌸, Cinnamon 🌰, Tulsi 🌿, Elaichi 🌱, Peach 🍑

### 4. 1st Home Visit Digital Intake & Routine (PDF Pages 1, 2, 3, 4)
- Digital intake form filled during the first online meeting upon product delivery.
- Built-in **Medical Weight Chart** (auto-computes Ideal Weight based on height and gender).
- Captures health challenges, digestion issues, sleep quality, meal timing, and water intake.
- Automatically delivers the customized **Basic/Elite Daily Routine** and **18 Golden Rules** to the member on WhatsApp.
- Automated milestone tracking (Saturday Gift Meeting, Day 5, Day 15, Day 25 calls).

### 5. Integrated Senior Coach Monthly Cash Profit Sheet
- Directly integrated profit sheet manager (replaces standalone Firebase project).
- Auto-records profit entries when an order is placed:
  - **Basic**: Amount Received = ₹8,400 | Coach Amount = ₹5,320 | Kit Cost = ₹3,006 (New) / ₹3,497 (Renewal) | **Cash Profit = ₹2,314**
  - **Elite**: Amount Received = ₹12,070 | Coach Amount = ₹8,990 | Kit Cost = ₹5,660 (New) / ₹6,157 (Renewal) | **Cash Profit = ₹3,330**
- **1-Click PDF Export**: Generates a landscape Monthly Cash Profit PDF ready for submission to Senior Coaches.

---

## 📱 Coach WhatsApp Admin Commands
Coaches can send these commands directly to the bot:
- `/ATTENDED <phone>` - Mark lead as attended Zoom and trigger membership choices
- `/DISPATCH <phone>` - Mark kit as dispatched & notify customer
- `/DELIVERED <phone>` - Mark kit as delivered & schedule 1st Home Visit
- `/SETZOOM <link>` - Update Zoom session link
- `/LEADS` - View active leads summary
- `/STATS` - View current month member count, total revenue & cash profit

---

## 💻 Web Portal Dashboard
Start the server to access the responsive web portal at `http://localhost:3000`:
- **Leads Pipeline**: Track leads at every funnel stage with 1-click actions
- **Body Analysis Form**: Enter client metrics & generate Gemini AI Hindi reports + PDFs
- **1st Home Visit Form**: Complete intake with live Medical Weight Chart lookup
- **Monthly Cash Profit Sheet**: View lifetime and monthly revenue/profit, add/edit entries, and download PDFs for Senior Coaches
- **Test Simulator**: Test full WhatsApp flows directly in your browser without external webhooks

---

## 🛠️ Setup & Running
1. `npm install`
2. Copy `.env.example` to `.env` and configure credentials:
   - `DATABASE_URL` (Postgres connection)
   - `REDIS_URL` (Redis connection)
   - `GEMINI_API_KEY` (Google Gemini API)
   - `META_ACCESS_TOKEN`, `META_PHONE_NUMBER_ID`, `META_VERIFY_TOKEN`
   - `ADMIN_PHONE_NUMBERS`
3. `npm run build`
4. Start the application:
   - `npm run start:web` (Web Server & REST APIs)
   - `npm run start:worker` (WhatsApp Outbound Queue Worker)