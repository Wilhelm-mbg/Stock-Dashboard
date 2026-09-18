---
name: performance-optimization
description: Optimizes application performance across frontend, backend, queries, and databases. Use when performance requirements exist, when you suspect performance regressions, when Core Web Vitals or load times need improvement, when N+1 query patterns need fixing, or when profiling reveals bottlenecks.
---

> **Regeln dieses Repos (gehen vor):** Kein Push, keine Versionsnummer, kein Release — das macht die Release-Wache. Sperrklinken in `test-v6.js` werden nie gelockert; wird eine rot, wird die Ursache benannt. Studien und Handelsregeln nur mit Vorregistrierung (`studien/vorregistrierung-<datum>/`) und durch die Messmaschine. Übergabe als Datei unter `C:/Users/Wilhe/Downloads/Markt-Dashboard-Daten/uebergabe/` mit Tokenverbrauch als Pflichtzeile. Nur eigene Dateien committen (`git add <pfad> && git commit -m "…" -- <pfad>`), nie `git add -A`. Keine neuen Abhängigkeiten, nichts in `package.json`, keine Schlüssel in Dateien. **Alle Ausgaben dieses Skills sind Deutsch** (Fragen, Tabellen, Berichte, Kommentare im Code) — die Anweisung darunter bleibt Englisch.
> **Angepasst für dieses Repo:** Web-Abschnitte (Core Web Vitals, Bilder, React, Bundle, SQL-Indizes, Pools, Caches, Lighthouse-CI) gestrichen. Hiesige Engpässe: synchrone Datei-Ein-/Ausgabe im Hauptprozess friert die Oberfläche ein (eine Dauer im Log ist eine Blockade, wenn der Pfad der Hauptprozess ist; Abnahme mit der Responding-Sonde), quadratische Präfix-Aufrufe (Fensterung statt `bars[0..i]`), die 4-GB-Heap-Grenze der Messmaschine, E: ist eine HDD (Anhang an Ort und Stelle statt Kopie). Die IPC-Sonde mit Takt T sieht eine Sperre B als B−T..B; Kontrolle ≥ 3×T. Wächter gegen Rückfall = Klinke oder Sonde in `test-v6.js`, kein CI-Budget-Werkzeug. Schritt 4 (behalten oder zurücknehmen, Versuchsregister) gilt unverändert.
> Quelle: addyosmani/agent-skills, `skills/performance-optimization/SKILL.md`, Stand c004a74 (17.09.2026), MIT-Lizenz (Copyright (c) 2025 Addy Osmani); übernommen am 18.09.2026.

# Performance Optimization

## Overview

Measure before optimizing. Performance work without measurement is guessing — and guessing leads to premature optimization that adds complexity without improving what matters. Profile first, identify the actual bottleneck, fix it, measure again. Optimize only what measurements prove matters.

## When to Use

- Performance requirements exist in the spec (load time budgets, response time SLAs)
- Users or monitoring report slow behavior
- Core Web Vitals scores are below thresholds
- You suspect a change introduced a regression
- Building features that handle large datasets or high traffic

**When NOT to use:** Don't optimize before you have evidence of a problem. Premature optimization adds complexity that costs more than the performance it gains.

## The Optimization Workflow

```
1. MEASURE  → Establish baseline with real data
2. IDENTIFY → Find the actual bottleneck (not assumed)
3. FIX      → Address the specific bottleneck
4. VERIFY   → Measure again; keep or revert
5. GUARD    → Add monitoring or tests to prevent regression
```

### Step 1: Measure

Two complementary approaches — use both:

- **Synthetic (Lighthouse, DevTools Performance tab):** Controlled conditions, reproducible. Best for CI regression detection and isolating specific issues.
- **RUM (web-vitals library, CrUX):** Real user data in real conditions. Required to validate that a fix actually improved user experience.

**Frontend:**
```bash
# Synthetic: Lighthouse in Chrome DevTools (or CI)
# Chrome DevTools → Performance tab → Record
# Chrome DevTools MCP → Performance trace

# RUM: Web Vitals library in code
import { onLCP, onINP, onCLS } from 'web-vitals';

onLCP(console.log);
onINP(console.log);
onCLS(console.log);
```

**Backend:**
```bash
# Response time logging
# Application Performance Monitoring (APM)
# Database query logging with timing

# Simple timing
console.time('db-query');
const result = await db.query(...);
console.timeEnd('db-query');
```

### Step 2: Identify the Bottleneck

Common bottlenecks by category:

**Frontend:**

| Symptom | Likely Cause | Investigation |
|---------|-------------|---------------|
| Slow LCP | Large images, render-blocking resources, slow server | Check network waterfall, image sizes |
| High CLS | Images without dimensions, late-loading content, font shifts | Check layout shift attribution |
| Poor INP | Heavy JavaScript on main thread, large DOM updates | Check long tasks in Performance trace |
| Slow initial load | Large bundle, many network requests | Check bundle size, code splitting |

**Backend:**

| Symptom | Likely Cause | Investigation |
|---------|-------------|---------------|
| Slow API responses | N+1 queries, missing indexes, unoptimized queries | Check database query log |
| Memory growth | Leaked references, unbounded caches, large payloads | Heap snapshot analysis |
| CPU spikes | Synchronous heavy computation, regex backtracking | CPU profiling |
| High latency | Missing caching, redundant computation, network hops | Trace requests through the stack |

### Step 4: Verify (Keep or Revert)

A fix is a hypothesis until you re-measure. This step decides whether it survives.

**Re-measure the way you measured the baseline:** same command, same conditions, same fixed budget (wall-clock, sample count, or request count). A baseline taken on a cold cache against a result taken on a warm one measures the cache, not your change.

**Change one thing at a time.** Three optimizations landed together produce one number, and you cannot attribute it. If they must ship together, measure each in isolation first.

**Beat the noise, not just the mean.** Repeat the measurement and compare the delta against run-to-run variance. A 3% gain inside ±5% variance is not a gain; it is a different sample.

Then decide, strictly:

| Result vs. baseline | Action |
|---|---|
| Past the threshold, tests green | **Keep.** Commit with the before/after numbers in the message. |
| Within noise (no measurable change) | **Revert.** |
| Worse | **Revert.** |
| Improved, but a test went red | **Revert.** A regression wearing a win's clothing. |

**"Neutral" is a revert, not a keep.** This is the step teams skip: the change is already written, throwing it away feels wasteful, so it lands unmeasured, and the codebase accretes complexity that never bought anything. Code you keep, you maintain forever. Make it pay for itself.

**Correctness gates the metric.** The suite stays green *and* the number moves. An "optimization" that wins by dropping work the product needed (skipping a validation, caching something that must be fresh, removing an `await` that was load-bearing) is a regression, not a win.

#### Log every attempt, including the reverted ones

Reverted work leaves no trace in git history, which is exactly why the same dead idea gets tried again next quarter. Keep a short ledger so a discarded idea stays discarded:

| Idea | Baseline → Result | Verdict | Why |
|---|---|---|---|
| Memoize the row component | INP 240ms → 235ms | reverted | Inside noise (±15ms). Rows weren't the bottleneck. |
| Virtualize the list | INP 240ms → 90ms | kept | Long tasks gone from the trace. |
| Preconnect to the API origin | LCP 2.8s → 2.8s | reverted | Already same-origin. |

A section in the PR description or a `PERF.md` in the repo both work. What matters is that the next person (or the next agent) reads it before proposing an experiment, and doesn't re-run one that already failed.

## See Also

For detailed performance checklists, optimization commands, and anti-pattern reference, see `references/performance-checklist.md` (Quell-Repo addyosmani/agent-skills, nicht übernommen).


## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "We'll optimize later" | Performance debt compounds. Fix obvious anti-patterns now, defer micro-optimizations. |
| "It's fast on my machine" | Your machine isn't the user's. Profile on representative hardware and networks. |
| "This optimization is obvious" | If you didn't measure, you don't know. Profile first. |
| "Users won't notice 100ms" | Research shows 100ms delays impact conversion rates. Users notice more than you think. |
| "The framework handles performance" | Frameworks prevent some issues but can't fix N+1 queries or oversized bundles. |
| "The query is slow, add an index" | Read the plan first. The index may already exist and be unusable, and every index taxes writes forever. |
| "Just cache it" | Caching an already-cheap call buys nothing and adds a staleness bug. Cache what is expensive *and* re-read far more than written. |
| "Raise the pool size, we're running out of connections" | A pool bigger than the database can serve moves the queue somewhere less visible. Find what holds connections. |
| "It didn't help much, but it doesn't hurt" | Neutral changes are a revert. You pay maintenance on them forever and got nothing back. |
| "We already wrote it, may as well keep it" | Sunk cost. The measurement doesn't care how long the change took to write. |
| "The improvement is obvious, no need to re-measure" | Then re-measuring is cheap and proves it. Unmeasured wins are how neutral complexity lands. |

## Red Flags

- Optimization without profiling data to justify it
- N+1 query patterns in data fetching
- An index added without a query plan before and after to justify it
- A cache key that omits an input the response depends on (tenant, locale, viewer)
- A cache with no stated staleness window and no invalidation strategy
- Connection pool size raised in response to exhaustion, without finding what holds connections
- List endpoints without pagination
- Images without dimensions, lazy loading, or responsive sizes
- Bundle size growing without review
- No performance monitoring in production
- `React.memo` and `useMemo` everywhere (overusing is as bad as underusing)
- Optimizations kept without a re-measurement that justifies them
- Several optimizations bundled into one measurement, so no single change can be attributed
- A "win" that required a test to be changed, skipped, or deleted
- The same failed optimization attempted more than once because nobody recorded the first attempt

## Verification

After any performance-related change:

- [ ] Before and after measurements exist (specific numbers)
- [ ] The result was re-measured the same way as the baseline (same command, same conditions)
- [ ] The improvement exceeds run-to-run variance, not just the mean
- [ ] Changes that didn't beat the baseline were reverted, not kept as neutral
- [ ] Attempts are logged, kept and reverted alike, so a dead idea isn't re-run
- [ ] The specific bottleneck is identified and addressed
- [ ] Core Web Vitals are within "Good" thresholds
- [ ] Bundle size hasn't increased significantly
- [ ] No N+1 queries in new data fetching code
- [ ] Any new index is justified by a query plan before and after, and its write cost was considered
- [ ] Any new cache states what it keys on and how it goes stale
- [ ] The measured user-facing metric has a synthetic budget or field monitor that can detect regression
- [ ] Existing tests still pass (optimization didn't break behavior)
