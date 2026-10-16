# BugSentinel AI
## Autonomous Web Application Testing & Evidence-Based Bug Detection Engine

> **Core Philosophy:** *"Find the bug. Prove the failure. Run real browser tests, verify unexpected behavior, and collect evidence developers can trust."*

---

## 1. Executive Summary & System Overview

BugSentinel AI is an autonomous quality assurance and regression verification platform. Rather than merely flagging that a test failed, BugSentinel AI executes deterministic browser automation scenarios, performs bounded retry verification to eliminate flakiness, collects screenshot and console evidence, and provides an integrated, developer-focused operational workspace.

### The 6-Stage Autonomous Workflow

```
┌─────────┐      ┌───────────┐      ┌───────────┐
│  PLAN   │ ───> │  EXPLORE  │ ───> │  EXECUTE  │
└─────────┘      └───────────┘      └───────────┘
     │                                    │
     ▼                                    ▼
┌─────────┐      ┌───────────┐      ┌───────────┐
│ REGRESS │ <─── │  REPORT   │ <─── │  VERIFY   │
└─────────┘      └───────────┘      └───────────┘
```

1. **PLAN (`backend/app/services/planner.py`)**: Validates scenario registry contracts and prevents arbitrary or untrusted command injection.
2. **EXPLORE (`backend/app/services/browser_engine.py`)**: Locates UI target elements and stable selectors (`#customer-name`, `#email`, `#address`, `#place-order`, `#status`).
3. **EXECUTE (`backend/app/services/browser_engine.py`)**: Real headless Playwright Chromium automation executes synthetic user workflows.
4. **VERIFY (`backend/app/services/verifier.py`)**: Evaluates expected vs. actual behavior. Performs bounded verification reruns (up to 2 attempts) to classify reproducibility (`PASS`, `REPRODUCIBLE_FAILURE`, `POTENTIALLY_FLAKY`, or `ERROR`).
5. **REPORT (`backend/app/services/report_service.py`)**: Packages structured findings with high-resolution screenshot evidence, browser console logs, severity ratings, and execution timelines.
6. **REGRESS (`backend/app/services/regression_service.py`)**: Executes targeted regression retests on specific findings after a bug fix to confirm defect resolution.

---

## 2. Full-Stack Directory Structure

```
Code Apex/
├── backend/                            # Python 3.11+ / FastAPI Automation Engine
│   ├── __init__.py
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                     # FastAPI entrypoint, static mounts, CORS
│   │   ├── config.py                   # Path and environment settings
│   │   ├── schemas.py                  # Pydantic v2 request & response contracts
│   │   ├── database.py                 # SQLite persistence layer (runs & findings)
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── routes_health.py        # GET /api/health
│   │   │   ├── routes_scenarios.py     # GET /api/v1/scenarios, GET /api/v1/demo
│   │   │   ├── routes_runs.py          # POST /api/v1/runs, GET /api/v1/runs
│   │   │   └── routes_findings.py      # GET /api/v1/findings, POST .../regression
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── planner.py              # Scenario definitions and validation
│   │       ├── browser_engine.py       # Playwright Chromium engine & screenshots
│   │       ├── verifier.py             # Bounded retries and failure classification
│   │       ├── orchestrator.py         # End-to-end run workflow coordination
│   │       ├── report_service.py       # Finding extraction & execution.log creation
│   │       └── regression_service.py   # Targeted finding retest execution
│   └── demo_site/                      # Local ShopDemo testing target
│       ├── index.html                  # Accessible e-commerce UI
│       ├── styles.css                  # Modern responsive styling
│       └── app.js                      # Form logic with deliberate demo defect
├── frontend/                           # React 19 + TypeScript + Vite Application
│   ├── package.json                    # Scripts and dependencies (Lucide React)
│   ├── vite.config.ts                  # Vite build and proxy configuration
│   ├── tsconfig.json                   # Strict TypeScript compiler options
│   ├── .oxlintrc.json                  # High-performance linter configuration
│   ├── index.html                      # HTML entrypoint with viewport & fonts
│   └── src/
│       ├── App.tsx                     # Master router & view coordinator
│       ├── index.css                   # Global font & styling imports
│       ├── types/
│       │   └── api.ts                  # TypeScript interfaces matching Pydantic
│       ├── lib/
│       │   └── api.ts                  # Typed central API client with error handling
│       ├── styles/
│       │   ├── tokens.css              # Centralized CSS design-token system
│       │   ├── global.css              # Typography, grid background, badges
│       │   ├── landing.css             # Hero illustration, scanline, bento grid
│       │   └── dashboard.css           # Workspace, metrics, drawer, evidence modal
│       ├── components/
│       │   ├── layout/
│       │   │   ├── SiteHeader.tsx      # Navigation, status glyph, CTA
│       │   │   └── SiteFooter.tsx      # Telemetry footer
│       │   ├── landing/
│       │   │   ├── HeroSection.tsx     # Editorial typography & capability strip
│       │   │   ├── BrowserTestingVisual.tsx # Custom multi-layer hero artwork
│       │   │   ├── CapabilityStrip.tsx # Core feature badges
│       │   │   ├── WorkflowSection.tsx # 5-stage visual pipeline
│       │   │   ├── FeatureShowcase.tsx # Asymmetric bento grid
│       │   │   └── FinalCallToAction.tsx # Bottom conversion panel
│       │   └── testing/
│       │       ├── FindingDetailDrawer.tsx # Deep inspection drawer
│       │       ├── ScreenshotModal.tsx # Fullscreen evidence zoom modal
│       │       └── RunHistoryView.tsx  # Historical test run table
│       └── features/
│           ├── landing/
│           │   └── LandingPage.tsx     # Marketing landing page
│           └── dashboard/
│               └── DashboardPage.tsx   # Operational testing lab
├── data/                               # Local persistent storage
│   ├── bugsentinel.sqlite3             # SQLite runs & findings database
│   └── artifacts/                      # Screenshots and execution logs per run
├── tests/                              # Automated pytest suite (25 tests)
│   ├── test_health.py                  # Health and root endpoint verification
│   ├── test_scenarios.py               # Scenario registry and validation tests
│   ├── test_database.py                # SQLite CRUD & serialization tests
│   ├── test_api.py                     # API contracts and 400/404 handling
│   ├── test_verifier_classification.py # Reproducibility & flakiness unit tests
│   └── test_browser_engine.py          # Real Playwright browser end-to-end tests
├── requirements.txt                    # Python dependencies
├── .env.example                        # Backend environment template
└── README.md                           # Documentation
```

---

## 3. Visual Design System & Custom Hero Artwork

The visual identity of BugSentinel AI is built on a custom design-token system in [frontend/src/styles/tokens.css](file:///c:/Hackathon/Code%20Apex/frontend/src/styles/tokens.css), pairing deep space navy with electric cyan accents and strict semantic status colors:

### Palette
* **Deep Navy Base:** `--background: #070B14`, `--background-secondary: #0C1220`
* **Surfaces:** `--surface: #111B2B`, `--surface-raised: #162237`, `--surface-hover: #1A2941`
* **Brand Accents:** `--accent-blue: #5B8CFF`, `--accent-cyan: #35DDF2`
* **Semantic Status Indicators:**
  * **PASS:** `--status-pass: #39D98A` (Green)
  * **FAIL / REPRODUCIBLE_FAILURE:** `--status-fail: #FF657A` (Red)
  * **POTENTIALLY_FLAKY:** `--status-warning: #F5BD50` (Amber)
  * **ENGINE ERROR:** `--status-error: #FF4757` (Crimson)
* **Borders & Dividers:** `--border: #253449`, `--border-strong: #33465F`

### Custom Multi-Layer Hero Artwork
The hero visualization ([frontend/src/components/landing/BrowserTestingVisual.tsx](file:///c:/Hackathon/Code%20Apex/frontend/src/components/landing/BrowserTestingVisual.tsx)) is an original, layered CSS/SVG composition:
1. **Atmosphere:** Dark navy radial light aura with technical background grid.
2. **Perspective Browser Frame:** Floating window tilted in 3D perspective with realistic macOS-style chrome controls and simulated address bar.
3. **Live ShopDemo Simulation:** Split viewport rendering the controlled e-commerce interface on the left and an autonomous test runner on the right.
4. **Step-by-Step Assertion Progress:** 4 distinct operations showing sequential test steps (`01 Open application`, `02 Execute checkout`, `03 Verify expected behavior [FAIL]`, `04 Capture evidence`).
5. **Traversing Scan Line:** High-tech cyan scanning beam actively scanning across the interface (`@keyframes scanLine`).
6. **Diagnostic Satellite Nodes:** Connected SVG telemetry badges floating at the perimeter displaying active execution metrics and assertion nodes.

---

## 4. The Deliberate Demo Defect & Verification Workflow

To demonstrate genuine browser automation and evidence-backed defect capture rather than static or mocked data, BugSentinel AI includes an intentional, documented defect in `backend/demo_site/app.js`:

### The Defect
* **Scenario:** `invalid_email_is_rejected`
* **Defect Behavior:** When a customer inputs an invalid email string like `not-an-email`, the form skips email regex validation and displays an order confirmation:
  `Order placed successfully! Order #ORD-XXXXXX confirmed for BugHunter QA (not-an-email).`
* **BugSentinel Autonomous Detection:**
  1. The test engine asserts that an invalid email must NOT generate an order confirmation.
  2. Initial execution fails: Playwright captures `invalid_email_is_rejected_attempt_1.png`.
  3. Bounded verifier immediately launches Attempt 2 to rule out transient timing/network flakiness.
  4. Attempt 2 fails identically: Playwright captures `invalid_email_is_rejected_attempt_2.png`.
  5. The verifier classifies the issue as `REPRODUCIBLE_FAILURE` and files a structured finding with `MEDIUM` severity.
  6. The Finding Drawer displays a side-by-side comparison of **Expected Behavior** vs. **Actual Behavior**, console logs, and visual screenshots.

### How to Fix the Defect for Live Regression Demo
1. Open [backend/demo_site/app.js](file:///c:/Hackathon/Code%20Apex/backend/demo_site/app.js).
2. Change line 11:
   ```javascript
   // Toggle from true to false:
   window.ENABLE_EMAIL_VALIDATION_DEFECT = false;
   ```
3. In the BugSentinel AI Dashboard, open the finding in the Findings drawer.
4. Click **"Run Regression Retest"**.
5. BugSentinel AI automatically re-executes the scenario against the updated code, confirms all assertions pass, marks `defect_resolved: true`, and logs the regression success.

---

## 5. Setup & Running the Application

### The Two-Click Windows Workflow (Recommended)

No manual terminal commands, environment variables, or separate shells required.

```
RECEIVE PROJECT FOLDER OR ZIP
             │
             ▼
DOUBLE-CLICK Install_BugSentinelAI.bat
             │  (Detects Python 3.11+, Node 18+, sets up .venv, installs backend & frontend
             │   dependencies, installs Playwright Chromium, builds frontend, verifies tests)
             ▼
INSTALLATION COMPLETE
             │
             ▼
DOUBLE-CLICK Start_BugSentinelAI.bat
             │  (Launches FastAPI backend & Vite frontend, performs HTTP health checks,
             │   and opens http://127.0.0.1:5173/#dashboard in your default browser)
             ▼
USE BUGSENTINEL AI IN YOUR BROWSER
             │
             ▼
DOUBLE-CLICK Stop_BugSentinelAI.bat (or press Ctrl+C in launcher window)
```

#### Step-by-Step Instructions:

1. **Extract Archive (if received as ZIP):**
   Extract the project folder to any Windows drive (e.g. `C:\BugSentinelAI` or on Desktop). Spaces in path names are fully supported.
2. **Double-click [Install_BugSentinelAI.bat](file:///c:/Hackathon/Code%20Apex/Install_BugSentinelAI.bat):**
   The installer runs 7 automated verification and provisioning steps:
   * `[1/7]` System requirements & runtime check (Python 3.11+, Node.js 18+, npm, disk space). Bootstraps via `winget` if runtimes are missing.
   * `[2/7]` Creates or verifies project-local `.venv` virtual environment.
   * `[3/7]` Installs backend dependencies from `requirements.txt` and verifies FastAPI import.
   * `[4/7]` Installs frontend packages via `npm ci` / `npm install`.
   * `[5/7]` Downloads and provisions headless Playwright Chromium.
   * `[6/7]` Compiles the frontend production bundle (`npm run build`).
   * `[7/7]` Verifies the 25-test backend pytest suite and records `data/installation-state.json`.
3. **Double-click [Start_BugSentinelAI.bat](file:///c:/Hackathon/Code%20Apex/Start_BugSentinelAI.bat):**
   * Verifies installation prerequisites and checks port availability (8000 & 5173).
   * Spawns FastAPI backend and Vite frontend with diagnostic log redirection.
   * Polls `http://127.0.0.1:8000/api/health` and `http://127.0.0.1:5173/` until both services are 200 OK.
   * Automatically opens `http://127.0.0.1:5173/#dashboard` in your default browser.
   * Includes duplicate-launch detection (navigates to running instance if already up).
4. **Shutdown Services:**
   * Press `Ctrl+C` in the launcher console window, OR
   * Double-click [Stop_BugSentinelAI.bat](file:///c:/Hackathon/Code%20Apex/Stop_BugSentinelAI.bat) to stop only the tracked BugSentinel AI processes without affecting unrelated software.

---

### Packaging for Distribution to a New Computer

To generate a clean, transferable ZIP package of BugSentinel AI without transient build caches or bloated `node_modules`/`.venv` folders:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\Package-BugSentinelAI.ps1
```

This generates `BugSentinelAI-Release.zip` (~0.2 MB), ready to be extracted onto any Windows 10/11 machine. The recipient simply extracts the ZIP and double-clicks `Install_BugSentinelAI.bat`.

---

### Advanced / Manual Setup (For Developers)

If you prefer to operate backend and frontend in separate manual terminals:

#### Manual Backend Setup:
```powershell
# Create & activate virtual environment
python -m venv .venv
.\.venv\Scripts\activate

# Install dependencies & Playwright Chromium
python -m pip install -r requirements.txt
python -m playwright install chromium

# Run test suite
python -m pytest -v

# Start FastAPI backend
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

#### Manual Frontend Setup:
```powershell
cd frontend

# Install Node dependencies
npm install

# Run linter & production build
npm run lint
npm run build

# Start Vite development server
npm run dev -- --host 127.0.0.1 --port 5173
```

---

## 6. Live Interactive URLs

| Interface | URL | Purpose |
| :--- | :--- | :--- |
| **BugSentinel AI Landing Page** | `http://localhost:5173/` | Cinematic marketing landing page with custom hero artwork |
| **Operational Testing Lab** | `http://localhost:5173/#dashboard` | Full testing workspace, run trigger, results table & findings |
| **ShopDemo Target Application** | `http://127.0.0.1:8000/demo/` | E-commerce application under test with intentional bug |
| **Interactive OpenAPI Docs** | `http://127.0.0.1:8000/docs` | Swagger UI documentation of all backend REST endpoints |
| **Health Check Endpoint** | `http://127.0.0.1:8000/api/health` | Live backend connectivity and status check |
| **Static Artifacts Storage** | `http://127.0.0.1:8000/artifacts/{run_id}/{file}` | High-res screenshots and execution logs |

---

## 7. Verified Acceptance Matrix

| Requirement | Status | Evidence |
| :--- | :---: | :--- |
| **Custom Hero Artwork** | **VERIFIED** | Multi-layer SVG/CSS floating browser preview with traversing scan line and live telemetry |
| **Design Token System** | **VERIFIED** | Centralized in `tokens.css`; dark navy, electric cyan, semantic status colors |
| **Landing Page Experience** | **VERIFIED** | Editorial typography, capability strip, 5-stage workflow pipeline, bento feature grid |
| **Dashboard Operational Flow** | **VERIFIED** | Live backend health check, dynamic scenario loader, run trigger, metrics ribbon |
| **Playwright Automation** | **VERIFIED** | Headless Chromium execution executing real DOM interactions against ShopDemo |
| **Failure Classification** | **VERIFIED** | Bounded 2-attempt retry verifies `REPRODUCIBLE_FAILURE` on deliberate email defect |
| **Finding Detail Drawer** | **VERIFIED** | Expected vs actual behavior comparison, attempt history, console logs, screenshot artifact |
| **Evidence Zoom Modal** | **VERIFIED** | Fullscreen high-res screenshot viewer with direct raw download action |
| **One-Click Regression Retest** | **VERIFIED** | Retest button invokes `POST /api/v1/findings/{id}/regression` and updates history |
| **Run History Persistence** | **VERIFIED** | SQLite database `data/bugsentinel.sqlite3` tracks all runs, durations, and findings |
| **Production Build Cleanliness** | **VERIFIED** | `npm run build` succeeds in 212ms; `oxlint` passes with 0 warnings, 0 errors |
| **Backend Unit & Integration Tests** | **VERIFIED** | 25/25 pytest tests passing in `tests/` |

---

## 8. Security Boundaries

1. **Target Allowlisting:** Test execution is restricted to internal registered targets (`shopdemo`), rejecting arbitrary external URLs or SSRF attempts.
2. **Deterministic Planner:** Scenarios are validated strictly against an internal scenario registry; arbitrary code injection is blocked.
3. **Safe Artifact Storage:** File access is sanitized against path traversal (`../`) and scoped strictly to unique `run_id` subdirectories.
4. **Offline Capability:** Operates 100% locally with zero paid third-party dependencies or external API keys required.
