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

// ── App Lifecycle ────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    // Lucide Icons Initialization
    lucide.createIcons();

    // Tab Management
    setupTabNavigation();

    // Form Event Listeners
    setupFormHandlers();

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
            document.getElementById(`${tabId}-tab`).classList.add("active");

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

                // Also update localStorage override in case they changed Project ID
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

        // Calculate KPI values
        calculateSystemKPIs();

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
