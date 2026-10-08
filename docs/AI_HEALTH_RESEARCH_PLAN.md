# PetHealth AI Health Intelligence — Deep Research & Implementation Plan

**Date:** 2026-10-08 | **Scope:** AI layer for PetHealth (TK's dog Luca is user #1)
**Question:** Can AI track & update dog health from activity, logs, info, memos — everything in the profile?

---

## 1. What the evidence says (2025–2026 landscape)

### What "AI health tracking" actually means in production apps

| Pattern | What it does | Evidence strength |
|---------|--------------|-------------------|
| **Context-aware AI chat** (Petio, MaunaPet) | LLM reads the pet's full profile (breed, age, weight, logs) before answering; barcode/photo food scanning vs allergies | Proven, cheap to build |
| **Baseline + anomaly detection** (Fi Intelligence, Whistle, PetPace, Maven) | Learns individual dog's normal activity/sleep/HR, flags deviations | Validated for multi-metric trends; weak for single-metric alerts |
| **Symptom-pattern correlation** (PETKIT Kitbo, PetPulse) | Combines signals (thirst ↑ + urine ↑ → kidney screen) | 85–94% claimed accuracy; vendor-funded studies |
| **Computer vision screening** (AIforPet/TTcare, LIMPID) | Phone camera → eyes/skin/teeth/gait analysis | 95% claimed; 1.4M scans; real early catches (tartar, fungal) |
| **Vet-visit synthesis** (Fi, MaunaPet) | Auto-generate vet-visit summaries from logs, expenses, records | Trivially buildable, high perceived value |

### Critical evidence: what actually correlates with real illness

From a 2023 *Frontiers in Veterinary Science* systematic review (14 studies, 2,176 dogs/cats, cited by progradelist.com):

- **Single-metric alerts are mostly noise**: only 38% of high-confidence anomaly alerts were vet-confirmed conditions
  - Respiratory rate alerts: **67% false positive** rate
  - Heart-rate variability: 59% FP
  - Activity decline: 41% FP
- **Clustered alerts are strong**: simultaneous anomalies in **≥3 metrics** correlated with vet-diagnosed illness in **81% of cases**
- **Sleep fragmentation alerts**: strongest single correlation (72%) with later-diagnosed osteoarthritis/cognitive dysfunction in seniors
- Sustained activity decline >48h + no obvious cause → real signal (OA, renal disease, dental pain)

**Design law for PetHealth:** never alert on one metric. Require multi-signal clusters before surfacing anything. Alert fatigue kills the product in a week.

### The 5 data types worth tracking (petiogo.com synthesis)

1. **Weight, monthly, same scale** — single most useful number (joints, diabetes, condition)
2. **Vaccination + preventative dates** — flea/tick/heartworm are the forgotten ones
3. **Every symptom WITH a date** — "reduced appetite 9 of last 14 days" is a finding, not a vibe
4. **Activity tolerance** — "managed 1hr, now tires at 20min" = data an annual exam misses
5. **Food changes** — sensitivity timelines matter

### What AI can NOT do (be honest in product copy)

- Diagnose. AI trackers detect **deviation, not disease** (Dr. Sarah Lin, UC Davis: "correlation with true pathology remains probabilistic, not deterministic")
- Replace emergency care — bloat, toxins, collapse, pale gums = ER now, not app
- Replace bloodwork — AI *triages* it ("sleep efficiency dropped 19% → suggest renal panel")

---

## 2. PetHealth gap analysis (what we have vs what this needs)

**Already in schema (no migration needed):**
- `pets` (breed, birthDate, gender), `weight_records`, `health_records` (symptoms/diagnosis/cost/vet), `vaccinations`, `medications`, `feeding_schedules`, `daily_activities` (type/duration/location), `behavior_logs`, `sick_care_logs`, `expenses`

**Missing for the AI layer:**
- A `memos`/`notes` free-text capture (the "memo everything" ask) — 1 table
- An `ai_insights` table to persist generated insights with status (new/acknowledged/dismissed) — 1 table
- A daily/weekly aggregation job (Workers Cron trigger) — config, no schema

**Infra already available at zero marginal cost:**
- **ZAI glm-4.5-flash / glm-5.3-flash** (GLM_API_KEY in ~/.hermes/.env) — fleet's day-window NLP, proven on Thai mixed-sentiment, JSON-schema compliant (fleet-ratified 2026-10-08: glm primary, llama3.2:3b failover)
- **llama3.2:3b local via Ollama** — 0ms-cost failover (night window + ZAI 429 bursts)
- **CF Workers Cron Triggers** — free, native to our existing deployment

---

## 3. Implementation plan (4 phases, each ships standalone value)

### Phase 1 — Memo Everything + AI Daily Digest (week 1)
*The foundation: capture everything, summarize daily.*

- **Schema:** `memos` table (petId, content, source[manual/voice/photo], createdAt) + `ai_insights` table (petId, type, severity, title, body, evidenceJson, status, createdAt)
- **AI job (cron 21:00 ICT daily):** gather last-24h weight/food/activities/behavior/memos/meds → single ZAI flash call → 3-5 bullet Thai digest ("Luca today: 2 walks 45min, ate all meals, mild scratching noted 2x — normal pattern") stored as insight
- **Voice capture:** existing Web Speech API on mobile → memo, no typing
- **Cost:** ~200 tokens/day/dog on flash tier ≈ ฿0.02/day

### Phase 2 — Multi-Signal Health Scoring (week 2-3)
*The evidence-backed core: only alert on clusters.*

- **Baseline engine (pure SQL, no AI):** 7/30-day rolling averages per metric (activity min, sleep-relevant activity, meals, weight slope)
- **Rule layer first:** implement the validated patterns as deterministic rules
  - activity ↓ ≥25% for ≥3 days AND appetite ↓ AND ≥1 behavior log → amber "possible lethargy cluster"
  - weight slope > ±3%/month → flag (gain: joints/diet; loss: dental/kidney screens)
  - vaccine/med due within 7d → reminder (already exists — keep)
- **AI layer on top:** when a rule fires, ZAI reads the cluster evidence + full profile → writes the insight in natural Thai with a vet-visit recommendation + what-to-tell-the-vet summary
- **Alert discipline:** max 1 amber/red insight per 72h; all-clear days get a single green line in the digest
- **Health Score 0–100:** weighted composite (weight stability 30, activity vs baseline 25, log regularity 20, preventive compliance 25) — display trend, never absolute verdict

### Phase 3 — Ask-Luca AI Chat + Photo Screening (week 4-5)
*The interactive layer.*

- **Chat endpoint:** `/api/trpc/ai.chat` → profile + last 30 days records as context → ZAI flash (llama3.2:3b failover) → Thai answers with breed/age/weight awareness ("สำหรับน้องลูก้าวัยนี้...")
- **Guardrails (from evidence):** every answer carries a "this is guidance, not diagnosis" frame; hard-coded ER triage list (bloat signs, toxin, pale gums, collapse) always routes to emergency vet, never AI
- **Photo screening v0:** client-side photo → optional later integration with TTcare-style API; MVP = photo attached to memo/health-record only (no diagnosis claim)
- **Vet-visit pack:** one-click PDF export: baseline charts, cluster alerts, med/vaccine history, expense totals — exactly what Fi/MaunaPet ship

### Phase 4 — Optimization & Scale (week 6+)
- **Cron scheduling:** Workers Cron Triggers free tier, 21:00 ICT
- **Cost control:** cache digests (1 write/day/dog), batch all dogs of a user in one ZAI call, llama failover for ZAI 429 (fleet-proven pattern)
- **Feedback loop:** insight status (acknowledged/dismissed-with-reason) → tune rule thresholds monthly with real data
- **Later:** wearable ingestion (Fi/Tractive export CSV) maps onto `daily_activities` — no new schema

---

## 4. Cost model (cheapest-lane-first, per TK law)

| Component | Lane | Cost/month (1 dog) |
|-----------|------|--------------------|
| Daily digest | ZAI glm-flash | ~6k tokens ≈ ฿0.6 |
| Health cluster analysis | ZAI (only when rule fires) | ~฿0.2 |
| Chat | ZAI flash, cached profile | ~฿2-3 typical usage |
| Failover | llama3.2:3b local | ฿0 |
| Cron + storage | CF Workers free tier | ฿0 |
| **Total** | | **< ฿5/month/dog** — vs Petio Plus $5.99 (฿210) |

Premium-tier justification writes itself: free = manual logs only; premium = AI digest + clusters + chat.

---

## 5. What NOT to build (anti-scope)

- ❌ Hardware/wearables — refer users to Fi/Tractive, ingest their CSVs later
- ❌ Real-time sensor streams — CF Workers + our data volume doesn't need it; daily batch wins
- ❌ Diagnosis claims — legal + ethical line; we do triage framing only
- ❌ Custom CV models — use photo attachments + later third-party API
- ❌ vet telemedicine integration — Thailand vet clinic systems are fragmented; PDF export covers the need

---

## 6. Recommended play (numbered)

1. **This week:** Add `memos` + `ai_insights` tables to d1_schema.sql → test → commit
2. **Week 1:** Phase 1 daily digest cron (ZAI flash + llama failover) — visible daily value for Luca immediately
3. **Week 2-3:** Phase 2 rule engine (SQL baselines + cluster rules) — the evidence-backed differentiator
4. **Week 4:** Phase 3 chat with hard ER-triage guardrails + vet-visit PDF pack
5. **Defer** photo-diagnosis APIs until Phase 1-3 prove usage

**Punchline:** For under ฿5/month in AI costs, PetHealth gets the same core intelligence loop the ฿210/month apps charge for — daily digest, cluster-based early-warning (the 81%-correlation pattern), and profile-aware chat — and Luca's 18:00 dinner log becomes the first data point in his own health baseline tonight.
