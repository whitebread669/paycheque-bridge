# The Paycheque Bridge — Build Spec

**A calgarymoney.com demo for the Cursor Hackathon.**
One-liner: *Your paycheque is already paying your future self — you've just never been shown.*

Hackathon prompt fit: goes beyond "money in / money out" by treating a pay stub not as a transaction record but as a bridge to a future income stream. Built on the editorial thesis of Jordan Defazio's retirement writing (morethanmoneyradio.com, Popowich Karmali Advisory Group blog): retirement is an **income-replacement problem**, and the scarce resource is **good years**, not dollars.

---

## How to use this file with Cursor

1. Put this file at the root of a new repo as `SPEC.md`.
2. First prompt to Cursor:
   > Read SPEC.md in full. Build exactly what it describes — same screens, same formulas, same defaults, same canned data. Vite + React + TypeScript + Tailwind, single-page app, no backend, no external APIs. Start by scaffolding the project and the state model from §4, then build the five acts in order (§3). Ask me nothing you can answer from the spec.
3. Build in vertical slices in this order: Act 1 (bleak stub) → Act 2 (bridge decode) → Act 3 (buckets) → Act 4 (time feedback is woven into Act 3) → Act 5 (rebuilt stub). Each act should be demoable on its own.

---

## 1. Product summary

A single-page interactive experience. The user "receives" a $5,000 paycheque and follows it through five acts:

1. **The Bleak Open** — see the retirement paycheque you get if nothing changes (CPP + OAS only).
2. **The Bridge** — today's pay stub decodes itself: deductions are revealed as purchases of future income.
3. **The Four Buckets** — distribute your discretionary money across Income / Growth / Health / Legacy. The buckets visibly compete for one pool.
4. **Time feedback** (woven through Act 3) — every allocation is answered in *retirement days* and *good years funded*, not just dollars.
5. **The Payoff** — fast-forward: your rebuilt retirement pay stub, same format as the bleak one, side by side.

Constraints:
- 100% client-side. No backend, no auth, no persistence needed (in-memory state only; a "Reset demo" button reloads defaults).
- Static build (`vite build` → `dist/`) so it can be uploaded to GoDaddy hosting at calgarymoney.com.
- All figures clearly labeled as estimates; assumptions panel is user-editable (§5.8). Footer disclaimer (§8).
- Canadian throughout: CPP, OAS, RRSP, TFSA vocabulary. Never 401(k), never IRA.

## 2. Tech stack

- Vite + React 18 + TypeScript + Tailwind CSS.
- Charts: tiny inline SVG sparklines, hand-rolled (no chart library needed — see §6.1 canned data). If a library is wanted, use `recharts`, nothing heavier.
- Animation: CSS transitions + `framer-motion` only if trivial to add; number "count-up" animations matter more than anything else. Use a `useCountUp` hook for every headline number.
- Fonts: a clean sans (Inter) for UI; tabular/monospace numerals (`font-variant-numeric: tabular-nums` or JetBrains Mono) for all money figures on stubs.
- One route. Acts are full-viewport sections the user advances through with a "Next" button and can scroll back through. A slim progress rail on the left shows the five acts.

## 3. The five acts (screens)

### Act 1 — The Bleak Open
Full-screen retirement pay stub, dated the user's 65th birthday (default: 30 years from today). Styled exactly like a real pay stub (§7).

- Header: `CALGARYMONEY.COM — RETIREMENT PAY STATEMENT` and "Employee: You, age 65".
- Line items: `CPP retirement pension … $900.00` (average, §5.1), `Old Age Security … $742.31`, `Your savings … $0.00`.
- **Net monthly income: $1,642.31** — huge, count-up animation, then it just sits there.
- Subline, small and quiet: *"When the paycheque stops, this is what replaces it — unless today changes something."*
- CTA button: **"Rewind to today"** → Act 2 with a rewind animation (dates spin backward).

### Act 2 — The Bridge (today's paycheque decodes itself)
Today's pay stub for a $5,000 semi-monthly gross paycheque appears looking totally normal. Then, one line at a time (staggered animation), each deduction flips over and reveals what it actually did:

| Stub line | Amount (default) | Flip-side reveal |
|---|---|---|
| Gross pay | $5,000.00 | — |
| Income tax | −$1,050.00 | stays boring, greyed: "the one that's really gone" |
| CPP contribution | −$288.80 | **"You just bought ≈ $1.60/month of guaranteed, inflation-indexed income for life."** (§5.2) |
| EI premium | −$81.50 | greyed |
| Employer RRSP match | +$150.00 (shown as a bonus line) | **"Free money: +4.1 retirement days."** (§5.5) |
| RRSP contribution | −$150.00 | **"+4.1 retirement days"** |
| **Net deposit** | **$3,579.70** | — |

- Running counter appears top-right and persists for the rest of the app: **"Retirement days earned this paycheque: 8.2"** (ticks up as reveals happen).
- Fixed costs strip: "$2,380 of this is spoken for (rent, food, transport…)" → leaves **$1,200 to allocate**.
- CTA: **"You have $1,200. Put it to work."** → Act 3.

### Act 3 — The Four Buckets
The heart of the demo. Top: a horizontal pool bar showing the $1,200 with a draggable/slidable split across four buckets below (sliders + direct-entry; drag-between-buckets if cheap to build). "Every dollar has one job" as the section motto. Buttons: "Even split", "All in one", "Reset".

**The competition mechanic (critical):** all four bucket meters and the global counters re-compute live on every reallocation. Moving $300 from Growth to Health must visibly move Growth's nest-egg number DOWN as Health's funded-years number goes UP, simultaneously. This is the lesson of the whole product; do not debounce it away — it should feel instant (<100ms).

Each bucket is a card with its own mini-experience:

**3a. Income bucket** 🟦
- Headline: projected monthly retirement income, as a stacked bar: CPP (editable tier: average / above average / maximum — §5.1) + OAS + **"Yours"** (this bucket's contribution, converted via payout rate §5.4).
- **Retirement age slider: 60 ←→ 70** (default 65). Sliding it re-computes CPP (−36% at 60, +42% at 70) and OAS (no OAS before 65; +36% at 70) and the years-of-compounding for every bucket. This slider is a demo star — make it prominent, with the monthly income number swinging as it moves.
- Microcopy at 70: "Waiting pays: CPP grows 8.4%/yr after 65, guaranteed."

**3b. Growth bucket** 🟩
- This bucket's dollars buy fake tickers (§6.1). Four holdings listed with 1-year sparkline; **hover any sparkline → expanded chart tooltip** with the full curve and total return. "Buy" button moves the bucket's unallocated cash into that holding.
- Headline: **nest egg at retirement** (FV of this bucket repeated every paycheque, at the blended return of chosen holdings — §5.3).
- The volatile ticker's sparkline should look scary. That's the risk lesson, wordlessly.

**3c. Health bucket** 🟨 — *the Good Years meter*
- Not free-text medical input. Five toggle chips: `Smoker` · `Diabetes in family` · `Parents lived past 85` · `Active lifestyle` · `Chronic condition`. Each shifts the health-span model (§5.6).
- Visual: a horizontal life-bar from retirement age to life expectancy, split into **Go-go / Slow-go / No-go** phases (green / amber / grey). Chips stretch or shrink the green zone.
- Headline: **"Your profile suggests ~10 go-go years. You've funded 6.5 of them."** Funding = FV of this bucket ÷ extra annual go-go spend (§5.6).
- Motto: *"You might not have 30 good years. Fund the ones you'll get."*

**3d. Legacy bucket** 🟪
- Input: child's name + current age (default: "Maya", 4). Allocation per paycheque → **"By the time Maya is 25, this is $31,400."** (§5.7)
- Toggle: show value at age 25 / 40.
- Microcopy: *"Help them every payday — without raiding the other three buckets."*

Persistent footer across Act 3: the retirement-days counter, go-go years funded, and projected monthly income — all live.

CTA once ≥ $1 is allocated: **"Repeat this every payday →"**

### Act 4 — is not a screen
Time-feedback is the connective tissue: every allocation change anywhere fires a small toast/tick on the persistent counters ("+3.2 retirement days", "go-go years funded → 7.1"). No standalone screen.

### Act 5 — The Payoff
Fast-forward animation (dates spin forward, the counters spool up), then the **rebuilt retirement pay stub** renders in the identical format as Act 1, side-by-side with the bleak one:

- Left (greyed): the $1,642.31 stub. Right: CPP + OAS + `Registered savings drawdown` + `Annuity income (Income bucket)` — **new net monthly: ~$4,000–4,500** with defaults (§5 formulas produce this; do not hardcode).
- Deductions section on the rebuilt stub (this is the sophisticated touch): `Withholding tax on RRIF withdrawal`, and an `OAS clawback` line that appears **only if** retirement income exceeds the recovery threshold (default $95,000/yr — editable in assumptions).
- Below: nest egg total, total retirement days earned, go-go years funded — final counts.
- Closing line: *"When the paycheque stops, this is what replaces it. You built it one payday at a time."*
- Buttons: "Adjust my buckets" (back to Act 3, state preserved) · "Reset demo" · "Assumptions" (§5.8 panel).

## 4. State model (TypeScript)

```ts
type CppTier = 'average' | 'aboveAverage' | 'maximum';

interface HealthChips {
  smoker: boolean;
  diabetesFamily: boolean;
  parentsPast85: boolean;
  activeLifestyle: boolean;
  chronicCondition: boolean;
}

interface Holding { tickerId: string; amountPerPaycheque: number }

interface AppState {
  act: 1 | 2 | 3 | 5;
  // paycheque
  grossPerPaycheque: number;        // default 5000
  paychequesPerYear: number;        // default 24 (semi-monthly)
  fixedCostsPerPaycheque: number;   // default 2380
  employerMatchPerPaycheque: number;// default 150
  // person
  currentAge: number;               // default 35
  retirementAge: number;            // slider 60–70, default 65
  cppTier: CppTier;                 // default 'average'
  // buckets (per-paycheque allocations; sum <= discretionary pool)
  buckets: { income: number; growth: number; health: number; legacy: number };
  holdings: Holding[];              // growth bucket composition
  healthChips: HealthChips;
  child: { name: string; age: number };  // default { name: 'Maya', age: 4 }
  assumptions: Assumptions;         // §5.8, all editable
}
```

Everything downstream (counters, meters, stubs) is **derived** via pure selector functions in one file, `src/lib/engine.ts`, so all math is testable and lives in one place. No derived values stored in state.

## 5. Formulas & defaults (engine.ts)

All rates are **real** (inflation-adjusted) so every figure is in today's dollars — say so in the assumptions panel.

### 5.1 Government benefits (2026 figures, editable)
- CPP max at 65: **$1,507.65/mo**. Tiers: average = **$900**, aboveAverage = **$1,200**, maximum = $1,507.65.
- CPP timing: −0.6%/mo before 65 (−36% at 60); +0.7%/mo after 65 (+42% at 70).
- OAS at 65: **$742.31/mo** (65–74). No OAS before 65. Deferral +0.6%/mo (+36% at 70). (Ignore the 75+ bump of $816.54 for simplicity; note it in assumptions.)
- OAS clawback: 15% of net retirement income above **$95,000/yr** (approx; editable), capped at full OAS.

### 5.2 What a CPP contribution "buys" (Act 2 reveal)
- Employee CPP per paycheque ≈ `0.0595 × (gross − 3500/paychequesPerYear)`, capped so the annual total ≤ **$4,230.45** (2026 max; YMPE $74,600). At $5,000 semi-monthly this is ≈ $288.80 (cap bites late in the year — ignore that for the demo).
- Lifetime income purchased this period ≈ `(periodContribution / 4230.45) × (1507.65 / 39)` → ≈ **$1.60/mo, indexed, for life**. (Rationale: ~39 max-contribution years earn the max pension. Simplification — fine for a demo, listed in assumptions.)

### 5.3 Future value of recurring contributions
- Periodic real rate `i = annualRealReturn / paychequesPerYear`; periods `n = (retirementAge − currentAge) × paychequesPerYear`.
- `FV(P) = P × ((1+i)^n − 1) / i`.
- Default `annualRealReturn`: Growth bucket = blended from holdings (§6.1), all other buckets = **4%** real (balanced).

### 5.4 Income bucket → monthly income
- `extraMonthly = FV(incomeAllocation) × payoutRate / 12`; `payoutRate` default **5%** (rough single-life annuity at 65; editable).

### 5.5 Retirement days
- `dailySpend` default **$120** (≈ $3,600/mo comfortable retirement, today's dollars).
- Days earned by any contribution: `FV(contribution) / dailySpend`. The Act 2 counter uses this on RRSP + match lines; Act 3 counters use it on all bucket allocations.

### 5.6 Good Years model (Health bucket)
- Base: go-go ends **75**, slow-go ends **82**, life expectancy **87**.
- Chip modifiers to go-go end (also shift life expectancy by the same amount): smoker −4, diabetesFamily −2, parentsPast85 +3, activeLifestyle +2, chronicCondition −3. Clamp go-go end to [retirementAge, 90].
- `goGoYears = goGoEnd − retirementAge` (min 0).
- Extra go-go spend: **$15,000/yr** above baseline (travel, activity — today's dollars).
- `fundedGoGoYears = min(goGoYears, FV(healthAllocation) / 15000)`. Meter shows funded vs total.

### 5.7 Legacy bucket
- FV of per-paycheque allocation from now until child reaches target age (25 or 40), at 4% real. Same FV formula, `n = (targetAge − child.age) × paychequesPerYear`.

### 5.8 Assumptions panel (gear icon, always reachable)
Editable: real return(s), payout rate, dailySpend, go-go extra spend, CPP tier & figures, OAS figure, clawback threshold, fixed costs, gross pay, paycheques/year, current age. Every figure above appears here with a one-line justification. This panel is the answer to any judge's "but what did you assume?" — open it on stage if asked.

## 6. Canned data

### 6.1 Growth tickers (all fake, all client-side)
Generate each curve once with a **seeded** PRNG (e.g. mulberry32, fixed seed per ticker) so every demo run looks identical: 252 points, geometric random walk, `price[t] = price[t-1] × (1 + drift/252 + vol × noise)`.

| tickerId | Name | drift (real) | vol | personality |
|---|---|---|---|---|
| BANKS | Canadian Banks Index | 6.5% | low (0.10) | steady stair-step |
| ENERGY | Alberta Energy Fund | 8% | high (0.28) | boom-bust sawtooth |
| BONDS | Maple Bond Fund | 3% | very low (0.04) | nearly flat |
| TECH | Cowtown Growth Tech | 11% | very high (0.38) | hockey stick with a crash in the middle |

Blended growth-bucket return = allocation-weighted drift; unallocated growth cash earns 2%.

### 6.2 Defaults that make the demo sing
$5,000 gross semi-monthly, age 35, retire at 65, average CPP, $1,200 discretionary, even split $300/bucket → rebuilt stub lands ≈ **$4,000–4,300/mo vs the bleak $1,642**, nest egg ≈ **$400–500k** from buckets alone (plus the RRSP lines from Act 2 if you count them — keep them in the totals). Sanity-check the engine against these ranges with a couple of unit tests on engine.ts.

## 7. Design language

- **The pay stub is the design system.** Both stubs (Act 1, 2, 5) share one `<PayStub>` component: paper-white card, hairline rules, ALL-CAPS 10px labels, tabular numerals, dot-leaders between label and amount, a perforated top edge. Everything else is a quiet dark backdrop (deep navy `#0F1B2D`) that makes the stubs glow.
- Accent colours: bucket identity only — Income `#2563EB`, Growth `#059669`, Health `#D97706`, Legacy `#7C3AED`. Bleak stub uses no accents; rebuilt stub gets subtle bucket-coloured line items.
- Gold `#C9A227` reserved for the retirement-days counter.
- Numbers animate (count-up ~600ms) on every change; nothing else needs animation polish.
- Mobile-fine but optimize for a 16:9 projector at 1080p: big type, high contrast, no hover-only information *except* the ticker sparklines (acceptable — presenter has a mouse).

## 8. Disclaimer (footer, every act)
"Educational demo for the Cursor Hackathon. Estimates in today's dollars using simplified assumptions (see Assumptions). Not financial advice. CPP/OAS figures: Government of Canada, 2026."

## 9. 2-minute demo script
1. (Act 1) "This is a pay stub from 2056. $1,642 a month. That's what replaces your paycheque if nothing changes. I've written about retirement for years — the question is always *when the paycheque stops, what replaces it?* This tool answers it on every payday instead."
2. (Act 2) "Rewind to today. Watch the stub decode itself — that CPP line isn't a tax, it just bought $1.60 a month for life. Your paycheque is already paying your future self."
3. (Act 3) "You've got $1,200 left. Four buckets — income, growth, health, legacy — and they compete." *Drag growth→health, point at both meters moving opposite ways.* "Every dollar has one job." *Toggle a health chip; slide retirement age to 70; hover the scary ticker.*
4. (Act 5) "Repeat every payday—" *fast-forward* "—and the same stub now says $4,200. Built one paycheque at a time." *Beat.* "That's the bridge."
