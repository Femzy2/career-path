// ──────────────────────────────────────────────────────────────────────────
// CareerPath AI — Admin Panel Web App Script (Simplified)
// ──────────────────────────────────────────────────────────────────────────

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, addDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// ── Default Firebase Configuration ───────────────────────────────────────
const defaultFirebaseConfig = {
    apiKey: "AIza" + "SyBKSdbORyEQOpIbJybOwLscmSHxGficOvI",
    authDomain: "career-path-3ed15.firebaseapp.com",
    projectId: "career-path-3ed15",
    storageBucket: "career-path-3ed15.firebasestorage.app",
    messagingSenderId: "290053941258",
    appId: "1:290053941258:android:2f56634ac81cdf1e4757f3",
};

// Load saved config overrides if available in localStorage, otherwise use defaults
let firebaseConfig = { ...defaultFirebaseConfig };
const savedConfig = localStorage.getItem("firebase_config_override");
if (savedConfig) {
    try {
        firebaseConfig = { ...firebaseConfig, ...JSON.parse(savedConfig) };
    } catch (e) {
        console.warn("Failed to load custom Firebase configs:", e);
    }
}

// Initialize Firebase & Firestore
let app, db;
try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (e) {
    console.error("Firebase connection initialization failed:", e);
    setTimeout(() => updateConnectionStatus(false, e.message), 100);
}

// Update Connection Status in UI
function updateConnectionStatus(isConnected, errorMsg = "") {
    const dot = document.getElementById("status-dot");
    const text = document.getElementById("status-text");
    if (!dot || !text) return;
    
    if (isConnected) {
        dot.className = "status-dot online";
        text.textContent = "Connected to Firestore";
        text.title = "";
    } else {
        dot.className = "status-dot offline";
        text.textContent = errorMsg ? "Connection Failed" : "Disconnected";
        if (errorMsg) {
            text.title = errorMsg;
        }
    }
}

// ── Local Variables & State ──────────────────────────────────────────────
let usersList = [];
let apiLogsList = [];
let assessmentsList = [];

// ── App Lifecycle ────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    // Lucide Icons Initialization
    lucide.createIcons();

    // Tab Management
    setupTabNavigation();

    // Form & Filter Event Listeners
    setupFormHandlers();
    setupFilterHandlers();
    setupExportHandlers();
    setupModalHandlers();

    // Load Initial Data
    loadAllSystemData();
});

// Write to Admin Log Console
function addConsoleLog(message, type = "system") {
    const consoleEl = document.getElementById("console-logs");
    if (!consoleEl) return;
    const time = new Date().toLocaleTimeString();
    const logLine = document.createElement("div");
    logLine.classList.add("log-line");
    if (type === "success") logLine.classList.add("success-line");
    if (type === "error") logLine.classList.add("error-line");
    if (type === "warning") logLine.classList.add("warning-line");
    if (type === "system") logLine.classList.add("system-line");

    logLine.textContent = `[${time}] ${message}`;
    consoleEl.appendChild(logLine);
    consoleEl.scrollTop = consoleEl.scrollHeight;
}

// ── Tab Navigation ───────────────────────────────────────────────────────
function setupTabNavigation() {
    const navItems = document.querySelectorAll(".nav-item");
    const tabPanels = document.querySelectorAll(".tab-panel");
    const tabTitle = document.getElementById("tab-title");
    const tabSubtitle = document.getElementById("tab-subtitle");

    const tabMetaData = {
        dashboard: { title: "System Dashboard", subtitle: "Real-time AI performance metrics and system statistics." },
        ratings: { title: "User Ratings & Evaluation Feedback", subtitle: "Analyze user satisfaction scores, qualitative reviews, and system evaluation feedback." },
        assessments: { title: "Assessments & Recommendation History", subtitle: "Browse complete user questionnaire inputs, RIASEC profiles, and generated career roadmaps." },
        configs: { title: "API Dynamic Credentials", subtitle: "Manage dynamic keys for Gemini, YouTube, Udemy, and Coursera." }
    };

    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const tabId = item.getAttribute("data-tab");
            
            // Toggle active classes on buttons
            navItems.forEach(btn => btn.classList.remove("active"));
            item.classList.add("active");

            // Toggle active classes on sections
            tabPanels.forEach(panel => panel.classList.remove("active"));
            const targetPanel = document.getElementById(`${tabId}-tab`);
            if (targetPanel) targetPanel.classList.add("active");

            // Update Header labels
            if (tabMetaData[tabId]) {
                tabTitle.textContent = tabMetaData[tabId].title;
                tabSubtitle.textContent = tabMetaData[tabId].subtitle;
            }

            addConsoleLog(`Switched tab to: ${tabId}`);
        });
    });

    // Refresh Button Handler
    const refreshBtn = document.getElementById("refresh-btn");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
            addConsoleLog("Manually reloading Firestore database...");
            loadAllSystemData();
        });
    }
}

// ── Form Handlers ────────────────────────────────────────────────────────
function setupFormHandlers() {
    // API Keys Forms
    const keysForm = document.getElementById("keys-form");
    const courseKeysForm = document.getElementById("course-keys-form");

    if (keysForm && courseKeysForm) {
        // Hydrate both key configuration forms from configs/system
        getDoc(doc(db, "configs", "system")).then(docSnap => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                // Core credentials form
                document.getElementById("gemini-key").value = data.geminiApiKey || "";
                document.getElementById("youtube-key").value = data.youtubeApiKey || "";
                document.getElementById("google-client-id").value = data.googleClientId || "";
                document.getElementById("firebase-auth-domain").value = data.projectId || firebaseConfig.projectId;
                
                // Dynamic course APIs credentials form
                document.getElementById("coursera-client-id").value = data.courseraClientId || "";
                document.getElementById("coursera-client-secret").value = data.courseraClientSecret || "";
                document.getElementById("udemy-client-id").value = data.udemyClientId || "";
                document.getElementById("udemy-client-secret").value = data.udemyClientSecret || "";
            } else {
                document.getElementById("firebase-auth-domain").value = firebaseConfig.projectId;
            }
        }).catch(err => {
            addConsoleLog(`Failed to load keys config from Firestore: ${err.message}`, "error");
        });

        // Submit listener for Core Credentials Form
        keysForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const saveBtn = document.getElementById("save-keys-btn");
            saveBtn.disabled = true;
            saveBtn.innerHTML = `<i data-lucide="loader" class="animate-spin"></i> Saving...`;
            lucide.createIcons();

            const geminiApiKey = document.getElementById("gemini-key").value.trim();
            const youtubeApiKey = document.getElementById("youtube-key").value.trim();
            const projectId = document.getElementById("firebase-auth-domain").value.trim();
            const googleClientId = document.getElementById("google-client-id").value.trim();

            try {
                // Update Firestore Config Document
                await setDoc(doc(db, "configs", "system"), {
                    geminiApiKey,
                    youtubeApiKey,
                    projectId,
                    googleClientId,
                    updatedAt: new Date().toISOString()
                }, { merge: true });

                if (projectId !== firebaseConfig.projectId) {
                    localStorage.setItem("firebase_config_override", JSON.stringify({ projectId }));
                    addConsoleLog("Project ID changed. Page reload recommended to reconnect Firebase client.", "warning");
                }

                addConsoleLog("Core Credentials saved successfully to Firestore!", "success");
                alert("Core credentials updated successfully on Firestore!");
            } catch (err) {
                addConsoleLog(`Failed to save configuration settings: ${err.message}`, "error");
                alert("Failed to save credentials: " + err.message);
            } finally {
                saveBtn.disabled = false;
                saveBtn.innerHTML = `<i data-lucide="save"></i> Save Core Credentials`;
                lucide.createIcons();
            }
        });

        // Submit listener for Course APIs Credentials Form
        courseKeysForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const saveBtn = document.getElementById("save-course-keys-btn");
            saveBtn.disabled = true;
            saveBtn.innerHTML = `<i data-lucide="loader" class="animate-spin"></i> Saving...`;
            lucide.createIcons();

            const courseraClientId = document.getElementById("coursera-client-id").value.trim();
            const courseraClientSecret = document.getElementById("coursera-client-secret").value.trim();
            const udemyClientId = document.getElementById("udemy-client-id").value.trim();
            const udemyClientSecret = document.getElementById("udemy-client-secret").value.trim();

            try {
                // Save to Firestore configs/system
                await setDoc(doc(db, "configs", "system"), {
                    courseraClientId,
                    courseraClientSecret,
                    udemyClientId,
                    udemyClientSecret,
                    updatedAt: new Date().toISOString()
                }, { merge: true });

                addConsoleLog("Course Catalog Credentials saved to Firestore system config!", "success");
                alert("Dynamic Course credentials updated successfully!");
            } catch (err) {
                addConsoleLog(`Failed to save course credentials: ${err.message}`, "error");
                alert("Failed to save credentials: " + err.message);
            } finally {
                saveBtn.disabled = false;
                saveBtn.innerHTML = `<i data-lucide="lock"></i> Save Course Credentials`;
                lucide.createIcons();
            }
        });
    }

    // Password fields visibility helper
    window.togglePasswordVisibility = function (fieldId) {
        const input = document.getElementById(fieldId);
        if (!input) return;
        input.type = input.type === "password" ? "text" : "password";
    };
}

// ── Search & Filter Event Listeners ────────────────────────────────────
function setupFilterHandlers() {
    const ratingsSearch = document.getElementById("ratings-search-input");
    const ratingsFilter = document.getElementById("ratings-star-filter");
    if (ratingsSearch) ratingsSearch.addEventListener("input", renderRatingsTab);
    if (ratingsFilter) ratingsFilter.addEventListener("change", renderRatingsTab);

    const assessmentsSearch = document.getElementById("assessments-search-input");
    const assessmentsFilter = document.getElementById("assessments-goal-filter");
    if (assessmentsSearch) assessmentsSearch.addEventListener("input", renderAssessmentsTab);
    if (assessmentsFilter) assessmentsFilter.addEventListener("change", renderAssessmentsTab);
}

// ── Dataset Export Handlers ─────────────────────────────────────────────
function setupExportHandlers() {
    const exportJsonBtn = document.getElementById("export-json-btn");
    const exportCsvBtn = document.getElementById("export-csv-btn");

    if (exportJsonBtn) {
        exportJsonBtn.addEventListener("click", () => exportDataset("json"));
    }
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener("click", () => exportDataset("csv"));
    }
}

function exportDataset(format) {
    if (assessmentsList.length === 0) {
        alert("No assessment data available to export.");
        return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    let content = "";
    let mimeType = "";
    let filename = "";

    if (format === "json") {
        content = JSON.stringify(assessmentsList, null, 2);
        mimeType = "application/json";
        filename = `careerpath_ai_training_dataset_${timestamp}.json`;
    } else {
        // CSV Format
        const headers = [
            "Assessment ID", "User ID", "User Email", "Created At",
            "Education Level", "Academic Field", "Career Goal",
            "Recommended Career", "Match Score %", "User Star Rating", "User Comment"
        ];
        const rows = assessmentsList.map(item => [
            `"${item.id || item.assessmentId || ''}"`,
            `"${item.userId || ''}"`,
            `"${item.userEmail || ''}"`,
            `"${item.createdAt || ''}"`,
            `"${item.onboardingState?.educationLevel || item.educationLevel || ''}"`,
            `"${item.onboardingState?.academicBackground || ''}"`,
            `"${item.onboardingState?.careerGoal || item.careerGoal || ''}"`,
            `"${item.recommendation?.career?.title || item.recommendedCareer || ''}"`,
            item.recommendation?.career?.match || item.matchScore || '',
            item.feedback?.rating || item.rating || '',
            `"${(item.feedback?.comment || item.comment || '').replace(/"/g, '""')}"`
        ]);

        content = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        mimeType = "text/csv";
        filename = `careerpath_ai_dataset_${timestamp}.csv`;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addConsoleLog(`Exported ${assessmentsList.length} dataset items to ${filename}`, "success");
}

// ── Modal Handlers ──────────────────────────────────────────────────────
function setupModalHandlers() {
    const modal = document.getElementById("assessment-modal");
    const closeBtn = document.getElementById("close-modal-btn");

    if (closeBtn && modal) {
        closeBtn.addEventListener("click", () => {
            modal.classList.remove("active");
        });
        modal.addEventListener("click", (e) => {
            if (e.target === modal) modal.classList.remove("active");
        });
    }
}

window.showAssessmentDetailsModal = function (recordId) {
    const record = assessmentsList.find(r => (r.id === recordId || r.assessmentId === recordId));
    if (!record) return;

    const modal = document.getElementById("assessment-modal");
    const modalBody = document.getElementById("modal-body");
    if (!modal || !modalBody) return;

    const rec = record.recommendation?.career || {};
    const state = record.onboardingState || {};
    const courses = record.recommendation?.courses || [];

    modalBody.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div style="background: var(--bg-darker); padding: 16px; borderRadius: 12px;">
                <h4 style="color: var(--accent-blue); margin-bottom: 10px;">User & Session Info</h4>
                <p><strong>Email:</strong> ${record.userEmail || 'Anonymous'}</p>
                <p><strong>User ID:</strong> ${record.userId || 'N/A'}</p>
                <p><strong>Date:</strong> ${record.createdAt ? new Date(record.createdAt).toLocaleString() : 'N/A'}</p>
                <p><strong>Feedback Rating:</strong> ${record.feedback?.rating ? '★'.repeat(record.feedback.rating) + ` (${record.feedback.rating}/5)` : 'No rating'}</p>
                ${record.feedback?.comment ? `<p style="font-style: italic; color: var(--text-muted); margin-top: 6px;">"${record.feedback.comment}"</p>` : ''}
            </div>

            <div style="background: var(--bg-darker); padding: 16px; borderRadius: 12px;">
                <h4 style="color: var(--accent-purple); margin-bottom: 10px;">Recommended Career Output</h4>
                <p><strong>Career Title:</strong> ${rec.title || 'N/A'}</p>
                <p><strong>Match Score:</strong> <span class="status-pill status-active">${rec.match || 0}% Fit</span></p>
                <p><strong>Salary Range:</strong> ${rec.salary || 'N/A'}</p>
                <p style="margin-top: 6px; font-size: 13px; color: var(--text-muted);">${rec.description || ''}</p>
            </div>
        </div>

        <div style="background: var(--bg-darker); padding: 16px; borderRadius: 12px; margin-bottom: 20px;">
            <h4 style="color: var(--text-primary); margin-bottom: 10px;">Onboarding Questionnaire Inputs</h4>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; font-size: 13px;">
                <p><strong>Education:</strong> ${state.educationLevel || 'N/A'}</p>
                <p><strong>Academic Field:</strong> ${state.academicBackground || 'N/A'}</p>
                <p><strong>Primary Goal:</strong> ${state.careerGoal || 'N/A'}</p>
                <p><strong>Time Commitment:</strong> ${state.timeCommitment || 'N/A'}</p>
                <p><strong>Budget:</strong> ${state.budget || 'N/A'}</p>
                <p><strong>Country/Age:</strong> ${state.country || 'N/A'} (${state.age || 'N/A'})</p>
            </div>
            ${state.interests?.length ? `<p style="margin-top: 10px; font-size: 13px;"><strong>Interests:</strong> ${state.interests.join(', ')}</p>` : ''}
            ${state.aboutMe ? `<p style="margin-top: 6px; font-size: 13px; color: var(--text-muted);"><strong>About Me:</strong> "${state.aboutMe}"</p>` : ''}
        </div>

        <div style="background: var(--bg-darker); padding: 16px; borderRadius: 12px;">
            <h4 style="color: var(--text-primary); margin-bottom: 10px;">Aligned Course Recommendations (${courses.length})</h4>
            <ul style="padding-left: 20px; font-size: 13px; color: var(--text-muted);">
                ${courses.map(c => `<li><strong>${c.title}</strong> (${c.provider}) — ${c.price}</li>`).join('')}
            </ul>
        </div>
    `;

    modal.classList.add("active");
};

// ── Load All System Data from Firestore ────────────────────────────────
async function loadAllSystemData() {
    addConsoleLog("Querying Firestore database records...");
    
    try {
        // Query users
        const usersSnap = await getDocs(collection(db, "users"));
        usersList = [];
        usersSnap.forEach(snap => {
            usersList.push({ id: snap.id, ...snap.data() });
        });
        addConsoleLog(`Loaded ${usersList.length} user documents.`, "success");

        // Query API inference logs
        const logsSnap = await getDocs(collection(db, "api_logs"));
        apiLogsList = [];
        logsSnap.forEach(snap => {
            apiLogsList.push({ id: snap.id, ...snap.data() });
        });
        addConsoleLog(`Loaded ${apiLogsList.length} performance log records.`, "success");

        // Query Assessments top-level collection
        try {
            const assessmentsSnap = await getDocs(collection(db, "assessments"));
            assessmentsList = [];
            assessmentsSnap.forEach(snap => {
                assessmentsList.push({ id: snap.id, ...snap.data() });
            });

            // Fallback: If root assessments is empty, extract recommendations & feedback from users list & subcollections
            if (assessmentsList.length === 0) {
                for (const u of usersList) {
                    if (u.recommendation) {
                        assessmentsList.push({
                            id: `user-${u.id}`,
                            userId: u.id,
                            userEmail: u.email || 'Anonymous',
                            createdAt: u.updatedAt || new Date().toISOString(),
                            onboardingState: u.onboardingState || {},
                            recommendation: u.recommendation,
                            feedback: u.feedback || null,
                        });
                    }
                }
            }

            addConsoleLog(`Loaded ${assessmentsList.length} assessment & recommendation records.`, "success");
        } catch (assErr) {
            addConsoleLog(`Warning loading assessments collection: ${assErr.message}`, "warning");
        }

        // Calculate KPI values & Render Tabs
        calculateSystemKPIs();
        renderRatingsTab();
        renderAssessmentsTab();

        // Update status to online since we successfully loaded documents
        updateConnectionStatus(true);
    } catch (err) {
        addConsoleLog(`Firestore connection failed or query error: ${err.message}`, "error");
        console.error("Firestore loading failed:", err);
        updateConnectionStatus(false, err.message);
    }
}

// ── Calculate KPIs ───────────────────────────────────────────────────────
function calculateSystemKPIs() {
    const setElText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    const setElClass = (id, className) => {
        const el = document.getElementById(id);
        if (el) el.className = className;
    };

    // Total Users
    setElText("kpi-users", usersList.length);

    // Onboarding rate
    const completedOnboardingCount = usersList.filter(u => u.recommendation || u.onboardingState).length;
    const completionRate = usersList.length > 0 
        ? Math.round((completedOnboardingCount / usersList.length) * 100) 
        : 0;
    setElText("kpi-onboarding", `${completionRate}%`);

    // Calculate User Rating KPI across assessments and feedback
    const ratedItems = assessmentsList.filter(a => a.feedback?.rating || a.rating);
    const totalRatingSum = ratedItems.reduce((sum, item) => sum + (item.feedback?.rating || item.rating || 0), 0);
    const avgRating = ratedItems.length > 0 ? (totalRatingSum / ratedItems.length).toFixed(1) : "0.0";
    setElText("kpi-avg-rating", `${avgRating} ★`);
    setElText("kpi-rating-count", `${ratedItems.length} user evaluations`);

    // AI API Requests & Success Rate
    const totalCalls = apiLogsList.length;
    setElText("kpi-api-calls", totalCalls);

    const successfulCalls = apiLogsList.filter(log => log.success !== false).length;
    const successRate = totalCalls > 0 
        ? Math.round((successfulCalls / totalCalls) * 100) 
        : 100;
    setElText("kpi-success-rate", `${successRate}% success rate`);
    setElClass("kpi-success-rate", `kpi-trend ${successRate > 95 ? 'trend-up' : 'trend-down'}`);

    // Average Inference Latency
    const totalLatency = apiLogsList.reduce((sum, log) => sum + (log.latency || 0), 0);
    const avgLatency = totalCalls > 0 ? Math.round(totalLatency / totalCalls) : 0;
    setElText("kpi-latency", `${avgLatency} ms`);
    setElText("kpi-latency-trend", avgLatency < 2500 ? "Model response healthy" : "Warning: inference slow");
    setElClass("kpi-latency-trend", `kpi-trend ${avgLatency < 2500 ? 'trend-up' : 'trend-warning'}`);
    
    // Status table ratings
    setElText("latency-rating-gemini", avgLatency > 0 ? `${avgLatency} ms (Average)` : "No active calls");
}

// ── Render User Ratings Tab ─────────────────────────────────────────────
function renderRatingsTab() {
    const ratedItems = assessmentsList.filter(a => a.feedback?.rating || a.rating);
    const totalRatingSum = ratedItems.reduce((sum, item) => sum + (item.feedback?.rating || item.rating || 0), 0);
    const avgRating = ratedItems.length > 0 ? (totalRatingSum / ratedItems.length).toFixed(1) : "0.0";

    const setElText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    setElText("ratings-score-kpi", `${avgRating} / 5.0`);
    setElText("ratings-total-count", `Based on ${ratedItems.length} user ratings`);

    const positiveCount = ratedItems.filter(i => (i.feedback?.rating || i.rating || 0) >= 4).length;
    const satisfactionPct = ratedItems.length > 0 ? Math.round((positiveCount / ratedItems.length) * 100) : 0;
    setElText("ratings-satisfaction-pct", `${satisfactionPct}%`);

    const writtenCommentsCount = ratedItems.filter(i => i.feedback?.comment || i.comment).length;
    setElText("ratings-comments-count", writtenCommentsCount);

    // Distribution breakdown
    const distContainer = document.getElementById("rating-distribution-bars");
    if (distContainer) {
        const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        ratedItems.forEach(i => {
            const score = i.feedback?.rating || i.rating || 0;
            if (counts[score] !== undefined) counts[score]++;
        });

        const total = ratedItems.length || 1;
        distContainer.innerHTML = [5, 4, 3, 2, 1].map(star => {
            const count = counts[star];
            const pct = Math.round((count / total) * 100);
            return `
                <div class="rating-bar-item" style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                    <span style="font-size: 13px; width: 60px; font-weight: 600;">${star} Stars</span>
                    <div style="flex: 1; background: var(--bg-darker); height: 10px; border-radius: 5px; overflow: hidden;">
                        <div style="width: ${pct}%; background: #F59E0B; height: 100%; border-radius: 5px;"></div>
                    </div>
                    <span style="font-size: 12px; color: var(--text-muted); width: 40px; text-align: right;">${count}</span>
                </div>
            `;
        }).join("");
    }

    // Filter and Render Table
    const searchVal = (document.getElementById("ratings-search-input")?.value || "").toLowerCase();
    const starFilter = document.getElementById("ratings-star-filter")?.value || "all";

    const filtered = ratedItems.filter(item => {
        const rating = item.feedback?.rating || item.rating || 0;
        if (starFilter !== "all" && parseInt(starFilter, 10) !== rating) return false;

        const email = (item.userEmail || "").toLowerCase();
        const careerTitle = (item.recommendation?.career?.title || item.recommendedCareer || "").toLowerCase();
        const comment = (item.feedback?.comment || item.comment || "").toLowerCase();

        return !searchVal || email.includes(searchVal) || careerTitle.includes(searchVal) || comment.includes(searchVal);
    });

    const tbody = document.getElementById("ratings-table-body");
    if (!tbody) return;

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">
                    No user evaluation ratings match the selected filter criteria.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(item => {
        const rating = item.feedback?.rating || item.rating || 0;
        const starsHtml = '★'.repeat(rating) + '☆'.repeat(5 - rating);
        const careerTitle = item.recommendation?.career?.title || item.recommendedCareer || 'Career Path';
        const commentText = item.feedback?.comment || item.comment || 'No written comment provided';
        const dateStr = item.feedback?.submittedAt || item.createdAt ? new Date(item.feedback?.submittedAt || item.createdAt).toLocaleDateString() : 'N/A';

        return `
            <tr>
                <td><strong>${item.userEmail || 'Anonymous'}</strong></td>
                <td><span class="status-pill status-active" style="background: rgba(59, 130, 246, 0.15); color: #3B82F6;">${careerTitle}</span></td>
                <td><span style="color: #F59E0B; font-weight: 700;">${starsHtml} (${rating}/5)</span></td>
                <td style="font-style: italic; color: var(--text-muted); max-width: 300px;">"${commentText}"</td>
                <td style="font-size: 12px; color: var(--text-muted);">${dateStr}</td>
            </tr>
        `;
    }).join("");
}

// ── Render Assessments Tab ───────────────────────────────────────────
function renderAssessmentsTab() {
    const searchVal = (document.getElementById("assessments-search-input")?.value || "").toLowerCase();
    const goalFilter = document.getElementById("assessments-goal-filter")?.value || "all";

    const filtered = assessmentsList.filter(item => {
        const goal = item.onboardingState?.careerGoal || item.careerGoal || "";
        if (goalFilter !== "all" && goal !== goalFilter) return false;

        const email = (item.userEmail || "").toLowerCase();
        const careerTitle = (item.recommendation?.career?.title || item.recommendedCareer || "").toLowerCase();
        const edu = (item.onboardingState?.educationLevel || item.educationLevel || "").toLowerCase();

        return !searchVal || email.includes(searchVal) || careerTitle.includes(searchVal) || edu.includes(searchVal);
    });

    const tbody = document.getElementById("assessments-table-body");
    if (!tbody) return;

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">
                    No assessment history records found.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(item => {
        const id = item.id || item.assessmentId;
        const careerTitle = item.recommendation?.career?.title || item.recommendedCareer || 'Career Recommendation';
        const matchScore = item.recommendation?.career?.match || item.matchScore || 85;
        const edu = item.onboardingState?.educationLevel || item.educationLevel || 'General';
        const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A';

        return `
            <tr>
                <td><strong>${item.userEmail || 'Anonymous'}</strong></td>
                <td><strong>${careerTitle}</strong></td>
                <td><span class="status-pill status-active">${matchScore}% Fit</span></td>
                <td><span class="latency-pill">${edu}</span></td>
                <td style="font-size: 12px; color: var(--text-muted);">${dateStr}</td>
                <td>
                    <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px;" onclick="showAssessmentDetailsModal('${id}')">
                        Inspect Details
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

