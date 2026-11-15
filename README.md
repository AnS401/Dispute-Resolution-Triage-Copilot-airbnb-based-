# Airbnb Dispute Resolution Triage Copilot

> An AI-powered internal tool concept that helps Airbnb Trust & Safety agents triage guest and host disputes faster, with more consistent outcomes — built as a portfolio project targeting Airbnb's AI/ML engineering roles.

**Live demo:** _[add your deployed URL here]_  
**Built by:** Anohita · [anohitasportfolio.lovable.app](https://anohitasportfolio.lovable.app) · [GitHub: AnS401](https://github.com/AnS401)

---

## The problem this addresses

Airbnb's dispute resolution process has a documented and recurring failure pattern:

- Agents give **contradictory decisions** across the same case — each contact forces the user to restart from scratch
- Guest-submitted evidence (photos, timestamps) is **acknowledged but not actually reviewed** before decisions are made
- Damage claims use **shifting amounts** without calculation transparency
- Review manipulation (burst of same-phrasing reviews in a 48-hour window) goes **undetected at the case level**
- Platform outcomes are **highly dependent on which agent handles the case**, not on policy

This isn't a hypothesis — it's the dominant pattern across Airbnb's Trustpilot reviews (1.6 stars), BBB complaints, and community forums as of 2025. Airbnb has ~7,300 employees and is not scaling support headcount. Their 2025–2026 hiring signal is clearly toward AI-augmented workflows.

This tool is a direct answer to that gap.

---

## What it does

The Dispute Resolution Triage Copilot is an internal agent-facing tool — not a customer chatbot. It sits behind the support interface and gives agents:

| Capability | Detail |
|---|---|
| **Case summary** | Ingests the full complaint and surfaces the core issue in one sentence |
| **Policy violation detection** | Maps the complaint against Airbnb's documented policies and flags specific breaches |
| **Evidence assessment** | Identifies what evidence exists, what's missing, and who bears the burden of proof |
| **Platform risk scoring** | Rates the case HIGH / MEDIUM / LOW for Airbnb's reputational, financial, or legal exposure |
| **Resolution path** | Numbered, specific action steps for the agent — not generic guidance |
| **Escalation flag** | YES/NO with reasoning, so front-line agents know when to hand off |

The system prompt is built around Airbnb's actual documented failure modes, not generic dispute categories. This means the model flags the specific things Airbnb keeps getting wrong — not the things support tools usually track.

---

## Architecture

```
┌─────────────────────────────────────────┐
│              React Frontend              │
│  Sidebar · Case view · Streaming output  │
└────────────────────┬────────────────────┘
                     │ POST /api/analyze
                     │ (SSE streaming response)
┌────────────────────▼────────────────────┐
│           Express Proxy Server           │
│  Validates input · Holds API key securely│
└────────────────────┬────────────────────┘
                     │ Gemini GenerateContent API
                     │ (gemini-1.5-flash, streaming)
┌────────────────────▼────────────────────┐
│             Google Gemini             │
│  System prompt: Airbnb failure mode KB   │
└─────────────────────────────────────────┘
```

**Why a proxy server?** The Gemini API key must never be exposed in the browser. The Express server holds the key in a `.env` file, validates requests, and streams the response back to the client via Server-Sent Events (SSE). This is production-correct architecture.

**Why streaming?** Dispute analyses run 400–700 tokens. Waiting for the full response before rendering makes the tool feel slow. Streaming starts displaying the analysis token-by-token, which is both faster in practice and shows the reasoning as it builds — useful for agents who want to act before the full report completes.

**Why `gemini-1.5-flash`?** Gemini 1.5 Flash balances speed and reasoning quality for structured analysis tasks. Gemini 1.5 Pro would give marginally better reasoning but at higher cost and latency — not appropriate for a high-volume support tool.

---

## System prompt design rationale

The system prompt is the core intellectual work of this project. Three design decisions are worth noting:

**1. Failure mode knowledge base**  
Instead of giving the model generic dispute resolution instructions, the system prompt injects Airbnb's specific documented failure patterns — evidence dismissal, collection pressure before verification, review burst signals, identity loop exits. This grounds the analysis in Airbnb's actual operational problems rather than textbook dispute handling.

**2. Structured output with named sections**  
The model is instructed to use exact markdown section headers (`**Core issue:**`, `**Policy violations detected:**`, etc.). This lets the frontend parse risk level, escalation flag, and violation count from the text without a second API call — keeping latency low and cost minimal.

**3. Specificity requirement**  
The prompt explicitly prohibits generic advice and requires the model to reference actual details from the complaint. This is the single biggest quality lever — without it, LLMs produce plausible-sounding but useless guidance.

---

## Connection to prior work

This project shares architectural DNA with [LexAssist](https://github.com/AnS401), my full-stack AI legal platform:

| | LexAssist | Dispute Copilot |
|---|---|---|
| **Domain** | Indian legal RAG | Airbnb T&S operations |
| **Core pattern** | Retrieve policy docs → generate grounded response | Inject policy KB → generate structured analysis |
| **Output** | 88% query accuracy across 5 metros | Policy-grounded triage with risk scoring |
| **User** | Legal professionals | Support agents |

The shift from RAG retrieval to prompt-embedded knowledge is deliberate — Airbnb's policy set is small enough to fit in a system prompt, avoiding the latency and infrastructure cost of a vector store for a demo context.

---

## Setup

### Prerequisites
- Node.js 18+
- An [Gemini API key](https://aistudio.google.com/apikey/)

### 1. Clone and install
```bash
git clone https://github.com/AnS401/airbnb-dispute-copilot.git
cd airbnb-dispute-copilot
npm install
npm run install:all
```

### 2. Configure the server
```bash
cd server
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### 3. Run both servers
```bash
# From the root directory
npm run dev
```

The React client runs on `http://localhost:3000`.  
The Express server runs on `http://localhost:3001`.

---

## Deployment

**Frontend:** Deploy the `client/` folder to Vercel or Netlify after running `npm run build` in the `client/` directory. Set the API base URL to your server's deployed URL.

**Backend:** Deploy the `server/` folder to Railway, Render, or any Node-compatible host. Set `GEMINI_API_KEY` and `CLIENT_ORIGIN` as environment variables on the host.

---

## What this would look like in production

In a real Airbnb deployment, the system prompt's embedded policy knowledge would be replaced by a RAG pipeline over Airbnb's internal policy database — enabling the model to cite exact policy versions, track policy updates automatically, and handle edge cases not covered by the current embedded KB.

The case data would come from Airbnb's Salesforce Service Cloud integration rather than the static seed file. The escalation and resolution buttons would trigger real workflow actions.

The core value — giving every agent the same structured analytical starting point for every case — holds regardless of data source.

---

## File structure

```
airbnb-dispute-copilot/
├── client/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── AnalysisBlock.js   # Streaming output + risk cards
│   │   │   ├── CaseHeader.js      # Case metadata display
│   │   │   ├── ComplaintCard.js   # Complaint text + policy pills
│   │   │   ├── EmptyState.js      # No case selected state
│   │   │   ├── FooterBar.js       # Action buttons
│   │   │   └── Sidebar.js         # Case queue navigation
│   │   ├── App.css                # Full design system
│   │   ├── App.js                 # Root component + API logic
│   │   ├── cases.js               # Seed cases (real complaint patterns)
│   │   └── index.js               # React entry point
│   └── package.json
├── server/
│   ├── index.js                   # Express proxy + SSE streaming
│   ├── .env.example
│   └── package.json
├── .gitignore
├── package.json                   # Root scripts with concurrently
└── README.md
```

---

_This is a portfolio project. It is not affiliated with or endorsed by Airbnb, Inc._
