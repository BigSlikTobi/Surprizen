# Product Requirement Documents – Surprizen Platform (Updated)

## PRD #1 – **Giver’s Journey (MVP v0.1)**

*Updated 2 Jul 2025 to reflect dual‑chatbot flow (Vision → Strategy → Storyboard).* 

### 1 Vision Creation

| Item | Description |
|------|-------------|
| **Problem** | Gift‑givers struggle to choose meaningful presents and to create memorable reveal moments. |
| **North‑Star Metric** | Recipient Net Delight Score (NDS) ≥ 75 / 100 within 24 h of reveal. |
| **Why now?** | On‑device LLMs such as **Gemma 3n** deliver private, low‑latency personalisation without cloud round‑trips. |
| **Target users** | Tech‑savvy millennials. |
| **MVP success criteria** | • ≥ 5 paid journeys with NDS ≥ 75 • 90 % puzzles solved without human support • Checkout‑to‑launch ≤ 15 min |

### 2 Strategy Creation (high‑level user flow)

1. **Vision Chatbot (Gemma)** – A friendly concierge gathers intent and key details (occasion, budget, recipient interests, desired tone, gift type preferences, schedule) via conversational slot‑filling. It maintains a live “profile card” in a side panel and offers free‑text answers, clarifications, and quick‑reply chips.
2. **Strategy Chatbot (Gemma)** – A second conversational agent takes the completed vision profile and collaborates with the giver to transform it into a high‑level surprise strategy: number & type of puzzle steps, distribution channels (email, SMS, physical), desired difficulty, and an initial gift shortlist. The giver can iterate until satisfied.
3. **AI Storyboard Creator** – Using the agreed strategy, Gemma generates a 3‑ to 5‑step puzzle arc plus two gift options locally (WebGPU / WASM). The plan is shown as an editable storyboard with drag‑and‑drop re‑ordering.
4. **Review & Pay** – Giver tweaks copy if desired, approves budget, and pays (Stripe). A tracking dashboard is spawned.
5. **Launch** – Firebase Hosting triggers Cloud Run Rails API; first clue sent via email/SMS at the scheduled time.
6. **Adaptive Loop** – As each clue is solved, progress is stored in Supabase; Gemma re‑ranks subsequent hints client‑side.
7. **Grand Reveal & Thank‑You** – Final screen reveals the gift, launches confetti, and prompts the recipient to send a video thank‑you.

### 3 Surprizen Execution

#### 3.1 Functional requirements (core MVP)

| Epic | Feature | Acceptance criteria |
|------|---------|---------------------|
| **Auth & Accounts** | Firebase‑UI email/social login | OAuth providers log in ≤ 3 s; session persists 30 d |
| **Gemma Chatbot UI** | Web‑based conversational interface with typing & speech‑to‑text; quick‑reply chips; live profile card | ≥ 85 CSAT for onboarding experience |
| **Local LLM Engine** | Download & cache Gemma 3n (~1.3 GB 4‑bit) in browser; fallback to server if WebGPU unsupported | 95 % devices complete load ≤ 15 s |
| **Journey Builder** | Generate JSON schema: steps[], each with type, clue, answer, media | > 99 % JSON valid |
| **Payment & Checkout** | Stripe checkout embedded; split service fee vs gift cost | Payment success → journey status = “paid” |
| **Delivery Orchestration** | Cloud Run job books physical gift or issues digital voucher | Proof‑of‑shipment URI stored in Supabase |
| **Progress Tracking** | WebSocket updates to giver dashboard | Lag ≤ 2 s |
| **Analytics** | Log NDS survey, completion time, gift rating | Weekly CSV export |

#### 3.2 Non‑functional requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | End‑to‑end TTFHW (time‑to‑first‑happy‑wow) ≤ 5 min for digital‑only gifts. |
| **Privacy** | All preference data stays on device; only redacted embeddings sent server‑side. |
| **Scalability** | Cloud Run autoscales 0→N; Firebase Hosting global CDN for static assets. |
| **Accessibility** | WCAG 2.2 AA compliance; chatbot supports keyboard navigation and screen readers. |
| **Compliance** | GDPR DPA; Supabase EU region. |

#### 3.3 Technical architecture decisions

- **Frontend:** Ruby on Rails 8 with Hotwire (Turbo + Stimulus) and Tailwind CSS, served via Firebase Hosting / Cloud Run.
- **Chatbot layer:** Gemma 3n running in a WebLLM wrapper (WASM/WebGPU). Dialogue state and slot‑filling handled locally; Rails API only stores final structured journey profile.
- **Backend:** Rails API (Cloud Run) for payments, inventory, and webhook processing.
- **Data:** Supabase Postgres for transactional data; Firebase Firestore for real‑time dashboards.

#### 3.4 Roadmap (2025)

| Date | Milestone | Notes |
|------|-----------|-------|
| **Jul 31** | Alpha CLI script + basic chatbot POC (text only) | Manual fulfilment |
| **Aug 30** | Chatbot UX polish, speech‑to‑text, live profile card | Internal beta |
| **Oct 15** | Beta with 10 premium users | NDS survey begins |
| **Dec 01** | MVP GA (public wait‑list) | Holiday‑season stress test |

#### 3.5 Risks & mitigations

| Risk | Mitigation |
|------|-----------|
| Gemma model size | Quantise to 3‑bit if needed; server fallback |
| Conversation derailment | Guardrails prompt templates; content‑safety filters locally |
| Payment disputes | Transparent split invoices |

---

## PRD #2 – **Surprizy’s Journey** (Placeholder)

*To be developed after MVP data is collected.*

### Scope preview

1. **Engagement Layer** – Gamified UI to maximise delight.
2. **Adaptive Preference Capture** – Micro‑survey widgets.
3. **Social Follow‑up** – Thank‑you video, shareable card, NDS survey.

### Known unknowns

- Optimal step count vs retention.
- Accessibility tweaks.
- Internationalisation workflow.

