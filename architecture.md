1 — High-level architecture (components)

1. Mobile Client (React Native or Flutter)

Screens: Onboarding, Profile & Assessments, Recommendations (courses/careers), Course/Job detail, Saved/Apply list, Feedback & Ratings, Settings, Notifications.

Local cache, progressive profiling, offline read for saved items, analytics + crash reporting.



2. Backend API Layer (REST / GraphQL)

Auth, user profile, assessments, interactions, recommendation endpoints, content management, analytics ingestion.



3. Recommendation Engine (ML Microservice)

Feature store, model server (TF/PyTorch/ONNX), ANN index (FAISS / Annoy), ranking service.



4. Data Platform & ETL

Ingest course metadata, job market feeds, skills taxonomy, user interaction logs. Batch + streaming ETL to feature store.



5. Database & Search

Primary DB: PostgreSQL (relational data)

Search/analytics: Elasticsearch for full-text course/job search and faceted filters.

Cache: Redis (session, short-term recommendations).



6. Admin Portal / CMS

Manage course/job records, skill mappings, rule-sets, content moderation, A/B test configs.



7. Monitoring & MLOps

Model registry, CI/CD for models, data drift monitoring, usage analytics, error logging, privacy audits.



8. Third-party integrations

Job portals (pull market demand), O*NET or skills taxonomy, SMS/Push provider, payment (if premium features).




2 — Tech stack recommendations (minimal, pragmatic)

Mobile: React Native (re-uses your web dev skills) or Flutter

Backend: Node.js + Express or Python FastAPI (prefer FastAPI for ML friendliness)

ML: Python, PyTorch/TensorFlow, scikit-learn, FAISS for ANN

DB: PostgreSQL, Redis, Elasticsearch

Cloud: AWS (EC2/ECS, RDS, S3, SageMaker or EKS) or GCP equivalent

CI/CD: GitHub Actions / GitLab CI

Analytics: Amplitude or Mixpanel (or self-hosted Matomo)


3 — Data model (core tables / collections)

Keep this normalized but add a feature store for ML features.

users (id, name, email, dob, location, education, consent_flags, created_at)

user_profile (user_id, interests[], skills[], preferred_industries[], psychometric_scores[])

assessments (id, user_id, type, raw_responses, score_vector, created_at)

courses (id, title, description, metadata:tags, prerequisites[], competencies[])

course_skills (course_id, skill_id, weight)

skills (id, name, ontology_path)

careers (id, title, description, typical_courses[], skills_required[], demand_index)

job_market (source, occupation_id, openings, avg_salary, date)

interactions (user_id, item_id, type:click/enroll/save/rate, timestamp)

recommendations (user_id, model_version, ranked_list[], created_at)

feedback (user_id, rec_id, helpful:boolean, comment)


4 — Core design & product rules (principles)

Progressive profiling: collect minimal info first (education, interests) then ask more as user engages.

Explainability: every recommendation must show 1–2 short reasons (e.g., “Matches your interest in Data Science; builds SQL skill”).

Privacy-by-design: store minimum PII, encrypt PII at rest, allow user to export / delete their data.

Consent & transparency: clear onboarding consent for data collection and market data use.

Human-in-loop: allow manual overrides and admin-curated suggestions for sensitive users.

Fallback to knowledge-based rules for safety/high-stakes (e.g., medical/psychology careers) — add “seek professional counselor” CTA.

Evaluation & metrics: track precision@k, NDCG, CTR on recommended items, long-term outcome metrics (e.g., enrollments), and fairness metrics by demographic slices.


5 — Recommendation system architecture (algorithmic design)

Use a hybrid recommender combining: Content-based + Collaborative Filtering + Knowledge/Rule-based + Market-signal ranking.

5.1 Feature engineering

User features: education level, GPA (if provided), interests (one-hot), skill vector (normalized), assessment embeddings, behaviour embeddings (last 30 days).

Item features (course/career): TF-IDF on description, skill vector, difficulty level, prerequisites, job market demand features (openings, salary trend).

Context features: time of day, device, location (country-level demand).


5.2 Models & components

1. Content Similarity (fast, interpretable)

Course vector = TF-IDF + course description embedding (e.g., SBERT).

Recommend top-N nearest by cosine similarity for a user's profile embedding.



2. Collaborative Filtering / Embeddings

Use matrix factorization (ALS) for structured datasets OR Neural Collaborative Filtering (NeuMF) for richer signals.

Learn user & item embeddings from interactions. Use implicit feedback (click/enroll/save) and weighting.



3. Knowledge-based Matching / Rules

Explicit mapping between user skills and course competencies. If user lacks required prereqs, recommend remedial courses.

Rules for career suitability: education threshold, mandatory skill presence, legal/ethical constraints.



4. Market-signal scorer

Combine job_market demand features to boost recommendations for in-demand careers.



5. Ranker (final scoring)

Train a learning-to-rank model (LambdaMART or neural ranker) that takes candidate features and outputs final score.

Features include similarity scores, CF score, skill match percent, market_demand_score, recency, popularity, and diversity penalty.



6. ANN index for low-latency retrieval

Build FAISS index on item embeddings for candidate generation.




5.3 Cold-start strategy

New user: onboarding questionnaire (education, top 3 interests, basic skills) → use content/rule-based mapping + demographic default profiles.

New item/course: rely on metadata and content embeddings; show to users whose profiles match metadata; collect interactions to bootstrap CF.


6 — Recommendation pipeline (end-to-end flow)

1. Candidate generation (fast)

Query ANN for top-500 nearest courses to user embedding.

Add top items from CF (top-N from ALS), and rule-based candidates (skills-matching, prerequisites).

Add trending and editorial-curated items.



2. Feature retrieval

Pull features for each candidate (skill_match, similarity, CF_score, demand_score, popularity).



3. Ranker

Score candidates with the ranker model → sort.



4. Diversity & business rules

Apply filters: no duplicate skills, limit same-skill concentration, enforce fairness rules if needed.

Add explainability tokens (why this was recommended).



5. Deliver & log

Return top-K to mobile, log served recommendation and subsequent interactions for training.




7 — Ranking function (example formula + pseudocode)

A simple linearized scoring baseline (pre-training) and a production LTR model (for production) — show both.

Baseline score:

score = w1 * content_sim + w2 * cf_score + w3 * skill_match_pct + w4 * demand_score - w5 * novelty_penalty

Start with weights: w1=0.35, w2=0.30, w3=0.25, w4=0.10 (tune via validation).

Pseudocode (candidate → score):

def score_candidate(user, item, model=None):
    content_sim = cosine(user.embedding, item.embedding)
    cf_score = get_cf_score(user.id, item.id)            # 0..1
    skill_match = compute_skill_overlap(user.skills, item.skills) # 0..1
    demand = normalize(item.demand_index)                # 0..1
    novelty = compute_novelty(user, item)                # 0..1

    if model is None:  # baseline
        score = 0.35*content_sim + 0.30*cf_score + 0.25*skill_match + 0.10*demand - 0.10*novelty
    else:
        features = [content_sim, cf_score, skill_match, demand, novelty, ...]
        score = model.predict(features)

    return score

8 — Learning, evaluation & metrics

Offline metrics: precision@k, recall@k, NDCG@k, MAP, AUC (for binary tasks), calibration error.

Online metrics: CTR on recommendations, enrollments from recommendations, retention, downstream ROI (job placements if trackable).

Fairness checks: performance by demographic groups to avoid bias.

A/B testing: model versions served via API flag; measure lift on primary metric (enrollments) and safety signals.


9 — ML lifecycle & operations (MLOps)

Feature store: store user/item features; version them.

Model registry: save trained model versions with metadata, validation metrics, and approval status.

CI/CD: tests for data schema, training job reproducibility, unit tests for scoring code.

Monitoring: input data distributions, prediction distributions, latency, and feedback signals. Trigger retrain on drift thresholds.

Retraining cadence: weekly/batch depending on data volume; continuous learning for high-traffic systems.


10 — APIs (essential endpoints)

POST /auth/login

GET /user/{id}/profile

POST /user/{id}/profile (update)

POST /assessments/submit → returns assessment vector

GET /recommendations?user_id={id}&k=10 → returns ranked list + explanations + model_version

POST /interactions (logs clicks/enrolls)

GET /courses/{id}, GET /careers/{id}

GET /search?q=... (Elasticsearch powered)

POST /feedback (rating helpfulness)


11 — Mobile app UX & rules

Onboarding: quick 3-question start (education level, top interest, one skill). Ask deeper psychometric in short modules (5–10 Qs) later.

Explainability on each card: one-line reason + skill highlights.

Progressive tips: recommend next action (take short course → gain skill → apply).

Save & track: allow user to save courses/careers, and show progress + suggested next steps.

Notifications: restrict frequency; allow user control.


12 — Security & privacy rules (non-negotiable)

Encrypt PII at rest and in transit (TLS everywhere).

Hash sensitive identifiers. Use role-based access control for admin endpoints.

Data minimization: keep only needed fields, support data deletion/export per user.

Consent logging: store user consents and changes.

Regular security audits and pen tests.


13 — Implementation roadmap (milestones)

1. M0 — Discovery & data collection: collect course DB, skills taxonomy, job market sources; create initial data schema and mappings.


2. M1 — MVP backend + mobile skeleton: user auth, profile, onboarding, course list, simple content-based recs (TF-IDF).


3. M2 — Logging & analytics: events pipeline, store interactions.


4. M3 — CF + embeddings: train CF model, build embedding pipeline + FAISS index, add candidate generation.


5. M4 — Ranker & explainability: LTR model, explanations, admin CMS.


6. M5 — MLOps & monitoring: model registry, drift alerts, scheduled retrain.


7. M6 — Production hardening: security, privacy, A/B testing, scalability.



14 — Example simple algorithm (onboarding → recommend)

1. User completes onboarding (interest tags: [data science], skills: [python, statistics])
2. Build user_embedding = weighted_avg(interest_embeddings, skill_embeddings, assessment_embedding)
3. Query ANN index for top-500 course vectors
4. For each candidate compute features: content_sim, skill_match, cf_score, demand
5. Score with ranker and pick top-10
6. Annotate each with "Why" tokens: e.g. "Builds SQL skill you rated 'intermediate' — required for Data Engineering roles"
7. Return to mobile and log the served recs

15 — Practical rules-of-thumb & engineering constraints

Latency target: API recommend endpoint ≤ 300 ms for good UX (use cache + precomputed candidates).

Candidate pool size: 200–1000 before ranking.

Storage: keep raw interactions at least 6–12 months for training; aggregate longer if needed.

Model explainability: always surface top 2 features used in the decision to the user.

A/B test size: power your test to detect at least a 5% uplift on the primary metric.


16 — Deliverables you should create next (recommended immediate tasks)

Finalize skills ontology and map course → skills (CSV).

Provide sample dataset (10k users or synthetic) for initial offline experiments.

Build minimal API + mobile prototype using content-based recommender to validate flows & UI.

Create evaluation harness (offline script to compute precision@10 and NDCG) and logging for online trials.



