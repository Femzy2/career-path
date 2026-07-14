# Memory — Unified Assessment Flow and Recommendation Syncing

Last updated: July 13, 2026, 01:56

## What was built
- **Onboarding Carousel (`app/welcome.tsx`)**: Created the welcome onboarding flow with a horizontal scrolling presentation of the 6 screenshots, page indicators, skip button, and registration redirect.
- **Route Guard Integration (`app/_layout.tsx`)**: Integrated centralized `RouteGuard` checking for `@has_seen_walkthrough` and user authenticated sessions dynamically to handle routing logic between `/welcome`, `/auth`, `/onboarding`, and `/(tabs)`.
- **Registration Parameter Routing (`app/auth.tsx`)**: Added query parameter checks to auto-activate the **Register** tab and translate the tab animation when routing via `mode=signup` or `mode=register`.
- **Custom Logo Branding**: Replaced text placeholders with the custom logo (`logo.png`) in `/welcome` header, `/auth` header, and progress career profiles, and set it as the app icon (`icon.png` and `splash-icon.png`).
- **Unified Assessment Questionnaire (`app/onboarding.tsx` & `services/gemini.ts`)**: Migrated legacy split assessment paths into a single, conversational 9-step onboarding flow. Collects educational details (including optional Age and Country), 15 expanded interest fields, 11 rated transferable skills, a 10-question RIASEC personality model, goals/time/budget priorities, optional text reflections, and custom text insights.
- **Aggregated Personality Index Compilation (`app/onboarding.tsx`)**: Programmed the step completion logic to average responses of the 10 detailed RIASEC questions into category keys (`technical`, `investigative`, `creative`, `social`, `structured`) before submission to Gemini and storage, preserving backward compatibility with dashboard charts.
- **Cloud State Sync & Recovery (`context/AuthContext.tsx` & `app/onboarding.tsx`)**: Extended cloud and local storage synchronization to save and recover the full `@onboarding_state` answers block on logins, enabling users to switch devices without losing their questionnaire history.
- **RIASEC Personality Breakdown Widget (`app/(tabs)/progress.tsx`)**: Added a progress-bar dashboard breakdown of the 5 personality codes, highlighting the user's dominant RIASEC category in a colorful banner.
- **Recommendation Evaluation Card (`app/(tabs)/index.tsx`)**: Created an interactive feedback card at the bottom of the home recommendations view using star ratings and comments synced to `@recommendation_feedback`.
- **Adaptive Mobile Layout Adjustments**: Fixed timeline indicators to size dynamically and wrapped long course skill labels with `flex: 1` to resolve badge overlaps.

## Decisions made
- Chose to implement a horizontal paging `ScrollView` for screen showcase, providing a native React Native feel without third-party library bloat.
- Configured the RouteGuard check to re-run on segment changes so that storage checks update dynamically upon transitioning between pages.
- Opted for non-blocking Firestore writes (removing `await` and catching errors) to prevent lack of network connection or permission errors from halting local onboarding.
- Managed user state restoration within the centralized Firebase auth subscriber so that AsyncStorage keys hydrate before the RouteGuard releases the loading block, eliminating race conditions.
- Consolidated structured data with rich, open-ended insights to allow the Gemini recommendation engine to perform deep semantic mapping of qualitative desires alongside numeric metrics.
- Averaged the two RIASEC question responses per category during step submission to preserve compatibility with existing database collections and front-end graphs while offering a more exhaustive 10-question psychometric check.

## Problems solved
- **Firebase Web Initializer Crash**: Fixed crash on Web builds (`getReactNativePersistence is not a function`) in `lib/firebase.ts` by checking `Platform.OS !== 'web'` and evaluating `getReactNativePersistence` type before calling it.
- **Register Tab Redirection Params**: Supported both `signup` and `register` parameters as tab-toggle triggers and fixed initial state setup in `app/auth.tsx` to handle parameter hydration delays.
- **Text wrapping & Badge overlap**: Handled narrow-screen text styling by adding `flex: 1` to course title blocks, preventing layout breaks.

## Current state
- The unified 9-step onboarding, centralized route guards, full Firebase auth/sync flow, evaluation features, and RIASEC profile display are fully implemented, type-checked, and verified via end-to-end browser check.
- All code compiles successfully under `npx tsc --noEmit`.

## Next session starts with
- **Native Layout Testing**: Test on iOS and Android simulators to verify safes area padding and notch constraints look native.
- **Multi-Recommendation Comparative View**: Explore extending recommendations to support secondary matched career options.

## Open questions
- None.
