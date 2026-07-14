# Memory — Unified Assessment Flow and Recommendation Syncing

Last updated: July 14, 2026, 09:30

## What was built
- **Onboarding Carousel (`app/welcome.tsx`)**: Created the welcome onboarding flow with a horizontal scrolling presentation of the 6 screenshots, page indicators, skip button, and registration redirect.
- **Route Guard Integration (`app/_layout.tsx`)**: Integrated centralized `RouteGuard` checking for `@has_seen_walkthrough` and user authenticated sessions dynamically to handle routing logic between `/welcome`, `/auth`, `/onboarding`, and `/(tabs)`.
- **Registration Parameter Routing (`app/auth.tsx`)**: Added query parameter checks to auto-activate the **Register** tab and translate the tab animation when routing via `mode=signup` or `mode=register`.
- **Custom Logo Branding**: Replaced text placeholders with the custom logo (`logo.png`) in `/welcome` header, `/auth` header, and progress career profiles, and set it as the app icon (`icon.png` and `splash-icon.png`).
- **Unified Assessment Questionnaire (`app/onboarding.tsx` & `services/gemini.ts`)**: Migrated legacy split assessment paths into a single, conversational 9-step onboarding flow.
- **Cloud State Sync & Recovery (`context/AuthContext.tsx` & `app/onboarding.tsx`)**: Extended cloud and local storage synchronization to save and recover the full `@onboarding_state` answers block on logins.
- **RIASEC Personality Breakdown Widget (`app/(tabs)/progress.tsx`)**: Added a progress-bar dashboard breakdown of the 5 personality codes, highlighting the user's dominant RIASEC category in a colorful banner.
- **Recommendation Evaluation Card (`app/(tabs)/index.tsx`)**: Created an interactive feedback card at the bottom of the home recommendations view using star ratings and comments synced to `@recommendation_feedback`.
- **Simplified Admin Portal (`/admin`)**: Created a hostable admin web portal utilizing a dark glassmorphism styling theme:
  - **Dashboard View**: Tracks metrics (Total Users, Onboarding Completion, API requests count, and Avg latency) and displays live API integrations statuses next to a real-time **System Operations Console** log console.
  - **API Credentials View**: Dynamically manages dynamic credentials configuration (Gemini API, YouTube API, Google client, Coursera, Udemy) fetched and written directly to the central `configs/system` Firestore collection.
- **Mobile Client Dynamic Credentials (`services/gemini.ts`)**: Programmed dynamic retrieval of client credentials keys (Gemini AI and YouTube Data API v3) straight from Firestore configs at query time.
- **Resilient API Request Retries (`services/gemini.ts`)**: Integrated automatic retries with exponential backoff on transient Gemini API status codes `503` (Server demand spikes) and `429` (Rate limits).
- **Dynamic Text Scaling & Overflow Prevention (`app/(tabs)/index.tsx`, `app/(tabs)/progress.tsx`)**: Integrated font auto-scaling on dynamic recommended career titles and salary potential fields using `adjustsFontSizeToFit` and `numberOfLines={1}`, protecting the dashboard and progress screens from overflow issues.
- **Config & TS Schema Resolutions (`tsconfig.json`, `.vscode/settings.json`, `app.json`)**: Configured local workspace compiler properties (esModuleInterop) and migrated `$schema` match rules to resolve IDE schema linting warnings cleanly without triggering Expo CLI warnings.

## Decisions made
- Chose to implement a horizontal paging `ScrollView` for screen showcase, providing a native React Native feel without third-party library bloat.
- Configured the RouteGuard check to re-run on segment changes so that storage checks update dynamically upon transitioning between pages.
- Opted for non-blocking Firestore writes (removing `await` and catching errors) to prevent lack of network connection or permission errors from halting local onboarding.
- Consolidated structured data with rich, open-ended insights to allow the Gemini recommendation engine to perform deep semantic mapping of qualitative desires alongside numeric metrics.
- Simplified the admin web portal to a clean, focused 2-tab view and moved the seeder/wiper diagnostics triggers out of standard controls to keep it production-safe.
- Removed redundant `newArchEnabled` and `edgeToEdgeEnabled` config keys from `app.json` since they are active by default in Expo SDK 54, resolving editor warnings.

## Problems solved
- **Firebase Web Initializer Crash**: Fixed crash on Web builds (`getReactNativePersistence is not a function`) in `lib/firebase.ts` by checking `Platform.OS !== 'web'` and evaluating `getReactNativePersistence` type before calling it.
- **Register Tab Redirection Params**: Supported both `signup` and `register` parameters as tab-toggle triggers and fixed initial state setup in `app/auth.tsx` to handle parameter hydration delays.
- **Text wrapping & Badge overlap**: Handled narrow-screen text styling by adding `flex: 1` to course title blocks, preventing layout breaks.
- **Invalid Icon Name Warn**: Fixed invalid Feather icon mapping `"bulb"` inside onboarding page to `"lightbulb"`.
- **API Mismatches**: Patched out-of-sync patch versions in package configuration packages via `npx expo install --check`.

## Current state
- The unified 9-step onboarding, dynamic credentials sync, admin web portal page, and dynamic auto-scaling elements are fully implemented, type-checked, and committed to Git.
- All code compiles successfully under `npx tsc --noEmit`.

## Next session starts with
- **Staging / Vercel deployment**: Deploy the static `/admin` portal folder directly to Vercel and confirm successful dynamic configuration loading.

## Open questions
- None.
