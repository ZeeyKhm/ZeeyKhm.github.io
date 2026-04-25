if ("serviceWorker" in navigator) {
	window.addEventListener("load", () => {
		navigator.serviceWorker.register("/sw.js").catch(() => {
			// Service worker registration can fail on local file preview; ignore quietly.
		});
	});
}

const firebaseConfig = {
	apiKey: "AIzaSyBKGs0joDyb3IPkysZW4308JO65PRhcAgY",
	authDomain: "linkinbio-6f2b1.firebaseapp.com",
	projectId: "linkinbio-6f2b1",
	appId: "1:948879547982:web:9ab953074d6b9abe27ad1f"
};

const ANALYTICS_STORAGE_KEY = "minazaki_site_analytics_v1";
const CONTENT_COLLECTION = "siteContent";
const CONTENT_DOC_ID = "main";

const dashboardTrigger = document.getElementById("dashboard-trigger");
const authModal = document.getElementById("auth-modal");
const authClose = document.getElementById("auth-close");
const authMessage = document.getElementById("auth-message");
const dashboardWelcome = document.getElementById("dashboard-welcome");
const metricVisits30d = document.getElementById("metric-visits-30d");
const metricActiveDays = document.getElementById("metric-active-days");
const metricAvgSession = document.getElementById("metric-avg-session");
const metricTopReferrer = document.getElementById("metric-top-referrer");
const metricTopDevice = document.getElementById("metric-top-device");
const metricLast7Days = document.getElementById("metric-last-7-days");

const profileImageEl = document.getElementById("profile-image");
const userNameEl = document.getElementById("user-name");
const descriptionEl = document.getElementById("description");
const linksContainerEl = document.getElementById("links-container");
const reachOutBtnEl = document.getElementById("reach-out-btn");
const socialLinksEl = document.getElementById("social-links");

const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const forgotForm = document.getElementById("forgot-form");
const logoutBtn = document.getElementById("logout-btn");
const contentEditorForm = document.getElementById("content-editor-form");
const addLinkBtn = document.getElementById("add-link-btn");
const addSocialBtn = document.getElementById("add-social-btn");
const editorLinksList = document.getElementById("editor-links-list");
const editorSocialList = document.getElementById("editor-social-list");

const views = {
	login: document.getElementById("auth-login-view"),
	register: document.getElementById("auth-register-view"),
	forgot: document.getElementById("auth-forgot-view"),
	dashboard: document.getElementById("auth-dashboard-view")
};

let auth = null;
let db = null;
let currentUser = null;
let sessionStartedAt = Date.now();
let sessionFinalized = false;
let currentSiteContent = null;

const editorState = {
	links: [],
	socials: []
};

function getDefaultSiteContent() {
	const links = Array.from(linksContainerEl?.querySelectorAll("a") || []).map((item) => ({
		label: item.textContent?.trim() || "Link",
		url: item.getAttribute("href") || "#",
		shake: item.classList.contains("shake")
	}));

	const socials = Array.from(socialLinksEl?.querySelectorAll("a") || []).map((item) => ({
		iconClass: item.className || "fa-brands fa-link",
		url: item.getAttribute("href") || "#"
	}));

	return {
		profileImage: profileImageEl?.getAttribute("src") || "",
		userName: userNameEl?.textContent?.trim() || "",
		description: descriptionEl?.textContent?.trim() || "",
		reachOutText: reachOutBtnEl?.textContent?.trim() || "Feel free to reach out!",
		reachOutUrl: reachOutBtnEl?.getAttribute("href") || "#",
		links,
		socials
	};
}

function sanitizeSiteContent(rawContent, fallback) {
	const fallbackValue = fallback || getDefaultSiteContent();
	const safeLinks = Array.isArray(rawContent?.links)
		? rawContent.links
				.filter((link) => link && link.label && link.url)
				.map((link) => ({
					label: String(link.label).slice(0, 80),
					url: String(link.url),
					shake: Boolean(link.shake)
				}))
		: fallbackValue.links;

	const safeSocials = Array.isArray(rawContent?.socials)
		? rawContent.socials
				.filter((social) => social && social.iconClass && social.url)
				.map((social) => ({
					iconClass: String(social.iconClass).slice(0, 120),
					url: String(social.url)
				}))
		: fallbackValue.socials;

	return {
		profileImage: rawContent?.profileImage ? String(rawContent.profileImage) : fallbackValue.profileImage,
		userName: rawContent?.userName ? String(rawContent.userName) : fallbackValue.userName,
		description: rawContent?.description ? String(rawContent.description) : fallbackValue.description,
		reachOutText: rawContent?.reachOutText ? String(rawContent.reachOutText) : fallbackValue.reachOutText,
		reachOutUrl: rawContent?.reachOutUrl ? String(rawContent.reachOutUrl) : fallbackValue.reachOutUrl,
		links: safeLinks.length ? safeLinks : fallbackValue.links,
		socials: safeSocials.length ? safeSocials : fallbackValue.socials
	};
}

function renderSiteContent(content) {
	if (profileImageEl) {
		profileImageEl.src = content.profileImage;
	}
	if (userNameEl) {
		userNameEl.textContent = content.userName;
	}
	if (descriptionEl) {
		descriptionEl.textContent = content.description;
	}
	if (reachOutBtnEl) {
		reachOutBtnEl.textContent = content.reachOutText;
		reachOutBtnEl.href = content.reachOutUrl;
	}

	if (linksContainerEl) {
		linksContainerEl.innerHTML = "";
		content.links.forEach((link) => {
			const anchor = document.createElement("a");
			anchor.className = link.shake ? "link shake" : "link";
			anchor.href = link.url;
			anchor.textContent = link.label;
			linksContainerEl.appendChild(anchor);
		});
	}

	if (socialLinksEl) {
		socialLinksEl.innerHTML = "";
		content.socials.forEach((social) => {
			const anchor = document.createElement("a");
			anchor.href = social.url;
			anchor.className = social.iconClass;
			socialLinksEl.appendChild(anchor);
		});
	}
}

function setContentState(content) {
	currentSiteContent = sanitizeSiteContent(content, getDefaultSiteContent());
	renderSiteContent(currentSiteContent);
}

function renderEditorList() {
	if (!editorLinksList || !editorSocialList) {
		return;
	}

	editorLinksList.innerHTML = "";
	editorState.links.forEach((link, index) => {
		const item = document.createElement("div");
		item.className = "editor-item";

		const labelInput = document.createElement("input");
		labelInput.type = "text";
		labelInput.placeholder = "Label";
		labelInput.value = link.label;
		labelInput.addEventListener("input", () => {
			editorState.links[index].label = labelInput.value;
		});

		const urlInput = document.createElement("input");
		urlInput.type = "url";
		urlInput.placeholder = "https://...";
		urlInput.value = link.url;
		urlInput.addEventListener("input", () => {
			editorState.links[index].url = urlInput.value;
		});

		const shakeWrap = document.createElement("label");
		shakeWrap.textContent = "Highlight with shake";
		const shakeInput = document.createElement("input");
		shakeInput.type = "checkbox";
		shakeInput.checked = link.shake;
		shakeInput.addEventListener("change", () => {
			editorState.links[index].shake = shakeInput.checked;
		});
		shakeWrap.prepend(shakeInput);

		const actions = document.createElement("div");
		actions.className = "editor-item-actions";
		const removeBtn = document.createElement("button");
		removeBtn.type = "button";
		removeBtn.textContent = "Remove";
		removeBtn.addEventListener("click", () => {
			editorState.links.splice(index, 1);
			renderEditorList();
		});
		actions.appendChild(removeBtn);

		item.appendChild(labelInput);
		item.appendChild(urlInput);
		item.appendChild(shakeWrap);
		item.appendChild(actions);
		editorLinksList.appendChild(item);
	});

	editorSocialList.innerHTML = "";
	editorState.socials.forEach((social, index) => {
		const item = document.createElement("div");
		item.className = "editor-item";

		const iconInput = document.createElement("input");
		iconInput.type = "text";
		iconInput.placeholder = "fa-brands fa-instagram";
		iconInput.value = social.iconClass;
		iconInput.addEventListener("input", () => {
			editorState.socials[index].iconClass = iconInput.value;
		});

		const urlInput = document.createElement("input");
		urlInput.type = "url";
		urlInput.placeholder = "https://...";
		urlInput.value = social.url;
		urlInput.addEventListener("input", () => {
			editorState.socials[index].url = urlInput.value;
		});

		const actions = document.createElement("div");
		actions.className = "editor-item-actions";
		const removeBtn = document.createElement("button");
		removeBtn.type = "button";
		removeBtn.textContent = "Remove";
		removeBtn.addEventListener("click", () => {
			editorState.socials.splice(index, 1);
			renderEditorList();
		});
		actions.appendChild(removeBtn);

		item.appendChild(iconInput);
		item.appendChild(urlInput);
		item.appendChild(actions);
		editorSocialList.appendChild(item);
	});
}

function populateEditorForm(content) {
	if (!contentEditorForm) {
		return;
	}

	contentEditorForm.profileImage.value = content.profileImage;
	contentEditorForm.userName.value = content.userName;
	contentEditorForm.description.value = content.description;
	contentEditorForm.reachOutText.value = content.reachOutText;
	contentEditorForm.reachOutUrl.value = content.reachOutUrl;
	editorState.links = content.links.map((link) => ({ ...link }));
	editorState.socials = content.socials.map((social) => ({ ...social }));
	renderEditorList();
}

function readContentFromEditor() {
	if (!contentEditorForm) {
		return currentSiteContent;
	}

	return sanitizeSiteContent(
		{
			profileImage: contentEditorForm.profileImage.value.trim(),
			userName: contentEditorForm.userName.value.trim(),
			description: contentEditorForm.description.value.trim(),
			reachOutText: contentEditorForm.reachOutText.value.trim(),
			reachOutUrl: contentEditorForm.reachOutUrl.value.trim(),
			links: editorState.links.map((link) => ({
				label: link.label.trim(),
				url: link.url.trim(),
				shake: Boolean(link.shake)
			})),
			socials: editorState.socials.map((social) => ({
				iconClass: social.iconClass.trim(),
				url: social.url.trim()
			}))
		},
		currentSiteContent || getDefaultSiteContent()
	);
}

function getTodayKey(date = new Date()) {
	return date.toISOString().slice(0, 10);
}

function readAnalytics() {
	try {
		const raw = localStorage.getItem(ANALYTICS_STORAGE_KEY);
		if (!raw) {
			return {
				totalVisits: 0,
				visitDates: {},
				referrers: {},
				devices: {},
				sessions: []
			};
		}
		const parsed = JSON.parse(raw);
		return {
			totalVisits: parsed.totalVisits || 0,
			visitDates: parsed.visitDates || {},
			referrers: parsed.referrers || {},
			devices: parsed.devices || {},
			sessions: Array.isArray(parsed.sessions) ? parsed.sessions : []
		};
	} catch {
		return {
			totalVisits: 0,
			visitDates: {},
			referrers: {},
			devices: {},
			sessions: []
		};
	}
}

function writeAnalytics(analytics) {
	localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(analytics));
}

function detectDeviceType() {
	const ua = navigator.userAgent.toLowerCase();
	if (/tablet|ipad/.test(ua)) {
		return "Tablet";
	}
	if (/mobi|android|iphone/.test(ua)) {
		return "Mobile";
	}
	return "Desktop";
}

function parseReferrer() {
	if (!document.referrer) {
		return "Direct";
	}

	try {
		return new URL(document.referrer).hostname || "Direct";
	} catch {
		return "Direct";
	}
}

function incrementMapCounter(map, key) {
	map[key] = (map[key] || 0) + 1;
}

function trackLocalVisitStart() {
	const analytics = readAnalytics();
	const today = getTodayKey();
	const referrer = parseReferrer();
	const device = detectDeviceType();

	analytics.totalVisits += 1;
	incrementMapCounter(analytics.visitDates, today);
	incrementMapCounter(analytics.referrers, referrer);
	incrementMapCounter(analytics.devices, device);
	analytics.sessions.push({ startAt: Date.now(), durationSec: 0 });
	analytics.sessions = analytics.sessions.slice(-300);

	writeAnalytics(analytics);
}

function finalizeLocalSession() {
	if (sessionFinalized) {
		return;
	}
	sessionFinalized = true;

	const analytics = readAnalytics();
	if (!analytics.sessions.length) {
		return;
	}

	const durationSec = Math.max(1, Math.round((Date.now() - sessionStartedAt) / 1000));
	analytics.sessions[analytics.sessions.length - 1].durationSec = durationSec;
	writeAnalytics(analytics);
}

async function trackRemoteVisitStart() {
	if (!db) {
		return;
	}

	const FieldValue = firebase.firestore.FieldValue;
	const referrer = parseReferrer();
	const device = detectDeviceType();
	const today = getTodayKey();

	const batch = db.batch();
	batch.set(
		db.collection("publicMetrics").doc("totals"),
		{
			totalVisits: FieldValue.increment(1),
			updatedAt: FieldValue.serverTimestamp()
		},
		{ merge: true }
	);

	batch.set(
		db.collection("publicMetrics").doc("daily").collection("days").doc(today),
		{
			date: today,
			visits: FieldValue.increment(1),
			updatedAt: FieldValue.serverTimestamp()
		},
		{ merge: true }
	);

	batch.set(
		db.collection("publicMetrics").doc("referrers").collection("items").doc(encodeURIComponent(referrer)),
		{
			name: referrer,
			count: FieldValue.increment(1),
			updatedAt: FieldValue.serverTimestamp()
		},
		{ merge: true }
	);

	batch.set(
		db.collection("publicMetrics").doc("devices").collection("items").doc(encodeURIComponent(device)),
		{
			name: device,
			count: FieldValue.increment(1),
			updatedAt: FieldValue.serverTimestamp()
		},
		{ merge: true }
	);

	try {
		await batch.commit();
	} catch {
		// Keep dashboard usable even if Firestore rules are not ready yet.
	}
}

async function finalizeRemoteSession() {
	if (!db) {
		return;
	}

	const durationSec = Math.max(1, Math.round((Date.now() - sessionStartedAt) / 1000));
	const FieldValue = firebase.firestore.FieldValue;

	try {
		await db.collection("publicMetrics").doc("totals").set(
			{
				totalSessionDurationSec: FieldValue.increment(durationSec),
				sessionCount: FieldValue.increment(1),
				updatedAt: FieldValue.serverTimestamp()
			},
			{ merge: true }
		);
	} catch {
		// No-op if network or rule check fails.
	}
}

function formatDuration(seconds) {
	if (seconds < 60) {
		return `${seconds}s`;
	}
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	return `${minutes}m ${remainingSeconds}s`;
}

function pickTopKey(counterMap, fallback) {
	const entries = Object.entries(counterMap);
	if (!entries.length) {
		return fallback;
	}
	entries.sort((a, b) => b[1] - a[1]);
	return entries[0][0];
}

function getLastNDays(n) {
	const days = [];
	for (let i = n - 1; i >= 0; i -= 1) {
		const date = new Date();
		date.setDate(date.getDate() - i);
		days.push(getTodayKey(date));
	}
	return days;
}

function computeLocalDashboardMetrics(analytics) {
	const days30 = getLastNDays(30);
	let visits30d = 0;
	let activeDays30d = 0;

	days30.forEach((dayKey) => {
		const dayVisits = analytics.visitDates[dayKey] || 0;
		visits30d += dayVisits;
		if (dayVisits > 0) {
			activeDays30d += 1;
		}
	});

	const durations = analytics.sessions
		.map((session) => session.durationSec || 0)
		.filter((duration) => duration > 0);

	const avgSessionSec = durations.length
		? Math.round(durations.reduce((sum, current) => sum + current, 0) / durations.length)
		: 0;

	const last7days = getLastNDays(7).map((dayKey) => ({
		dayLabel: dayKey.slice(5),
		visits: analytics.visitDates[dayKey] || 0
	}));

	return {
		visits30d,
		activeDays30d,
		avgSessionSec,
		topReferrer: pickTopKey(analytics.referrers, "Direct"),
		topDevice: pickTopKey(analytics.devices, "Desktop"),
		last7days
	};
}

function applyMetricsToDashboard(metrics) {
	if (!metricVisits30d || !metricActiveDays || !metricAvgSession || !metricTopReferrer || !metricTopDevice || !metricLast7Days) {
		return;
	}

	metricVisits30d.textContent = String(metrics.visits30d);
	metricActiveDays.textContent = String(metrics.activeDays30d);
	metricAvgSession.textContent = formatDuration(metrics.avgSessionSec);
	metricTopReferrer.textContent = metrics.topReferrer;
	metricTopDevice.textContent = metrics.topDevice;

	metricLast7Days.innerHTML = "";
	metrics.last7days.forEach((item) => {
		const li = document.createElement("li");
		const day = document.createElement("span");
		const count = document.createElement("span");
		day.textContent = item.dayLabel;
		count.textContent = `${item.visits} visits`;
		li.appendChild(day);
		li.appendChild(count);
		metricLast7Days.appendChild(li);
	});
}

async function fetchRemoteDashboardMetrics() {
	if (!db) {
		return null;
	}

	try {
		const oldestDay = getLastNDays(30)[0];
		const last7 = getLastNDays(7);

		const [totalsSnap, dailySnap, refSnap, deviceSnap] = await Promise.all([
			db.collection("publicMetrics").doc("totals").get(),
			db
				.collection("publicMetrics")
				.doc("daily")
				.collection("days")
				.where(firebase.firestore.FieldPath.documentId(), ">=", oldestDay)
				.get(),
			db.collection("publicMetrics").doc("referrers").collection("items").get(),
			db.collection("publicMetrics").doc("devices").collection("items").get()
		]);

		const totals = totalsSnap.exists ? totalsSnap.data() : {};
		let visits30d = 0;
		let activeDays30d = 0;

		const dayCountMap = {};
		dailySnap.forEach((doc) => {
			const dayKey = doc.id;
			const visits = Number(doc.data().visits || 0);
			dayCountMap[dayKey] = visits;
			visits30d += visits;
			if (visits > 0) {
				activeDays30d += 1;
			}
		});

		const referrers = {};
		refSnap.forEach((doc) => {
			referrers[doc.data().name || decodeURIComponent(doc.id)] = Number(doc.data().count || 0);
		});

		const devices = {};
		deviceSnap.forEach((doc) => {
			devices[doc.data().name || decodeURIComponent(doc.id)] = Number(doc.data().count || 0);
		});

		const last7days = last7.map((dayKey) => ({
			dayLabel: dayKey.slice(5),
			visits: dayCountMap[dayKey] || 0
		}));

		const sessionCount = Number(totals.sessionCount || 0);
		const totalSessionDurationSec = Number(totals.totalSessionDurationSec || 0);
		const avgSessionSec = sessionCount > 0 ? Math.round(totalSessionDurationSec / sessionCount) : 0;

		return {
			visits30d,
			activeDays30d,
			avgSessionSec,
			topReferrer: pickTopKey(referrers, "Direct"),
			topDevice: pickTopKey(devices, "Desktop"),
			last7days
		};
	} catch {
		return null;
	}
}

async function renderTrafficMetrics() {
	const localMetrics = computeLocalDashboardMetrics(readAnalytics());
	applyMetricsToDashboard(localMetrics);

	const remoteMetrics = await fetchRemoteDashboardMetrics();
	if (remoteMetrics) {
		applyMetricsToDashboard(remoteMetrics);
	}
}

function hasFirebaseConfig() {
	return (
		firebaseConfig.apiKey &&
		!firebaseConfig.apiKey.startsWith("YOUR_") &&
		firebaseConfig.authDomain &&
		!firebaseConfig.authDomain.startsWith("YOUR_") &&
		firebaseConfig.projectId &&
		!firebaseConfig.projectId.startsWith("YOUR_") &&
		firebaseConfig.appId &&
		!firebaseConfig.appId.startsWith("YOUR_")
	);
}

function getRuntimeIssue() {
	if (window.location.protocol === "file:") {
		return "Open the site via localhost or HTTPS. Firebase Auth will fail on file:// URLs.";
	}

	if (!navigator.onLine) {
		return "You appear to be offline. Check your internet connection and try again.";
	}

	return "";
}

async function loadSiteContentFromFirestore() {
	if (!db) {
		return;
	}

	try {
		const doc = await db.collection(CONTENT_COLLECTION).doc(CONTENT_DOC_ID).get();
		if (doc.exists) {
			setContentState(doc.data());
		}
	} catch {
		// Keep default DOM content if Firestore is unavailable.
	}
}

async function saveSiteContentToFirestore(content) {
	if (!db || !currentUser) {
		throw new Error("Not authenticated");
	}

	await db.collection(CONTENT_COLLECTION).doc(CONTENT_DOC_ID).set(
		{
			...content,
			updatedBy: currentUser.email || currentUser.uid,
			updatedAt: firebase.firestore.FieldValue.serverTimestamp()
		},
		{ merge: true }
	);
}

function initFirebase() {
	if (!window.firebase || !hasFirebaseConfig()) {
		return;
	}

	if (!firebase.apps.length) {
		firebase.initializeApp(firebaseConfig);
	}

	auth = firebase.auth();
	db = firebase.firestore();

	auth.onAuthStateChanged((user) => {
		currentUser = user;
		if (user) {
			renderDashboard(user);
			if (authModal.classList.contains("open")) {
				switchView("dashboard");
			}
		}
	});

	loadSiteContentFromFirestore();
	trackRemoteVisitStart();
}

function showMessage(message, isError = false) {
	authMessage.textContent = message;
	authMessage.style.color = isError ? "#ffb0b0" : "#f6dda6";
}

function switchView(viewName) {
	Object.entries(views).forEach(([name, section]) => {
		section.hidden = name !== viewName;
	});
}

function openAuthModal() {
	authModal.classList.add("open");
	authModal.setAttribute("aria-hidden", "false");
	showMessage("");

	const runtimeIssue = getRuntimeIssue();
	if (runtimeIssue) {
		switchView("login");
		showMessage(runtimeIssue, true);
		return;
	}

	if (!auth) {
		switchView("login");
		showMessage("Firebase is not configured yet. Add your Firebase keys in script.js.", true);
		return;
	}

	if (currentUser?.email) {
		renderDashboard(currentUser);
		switchView("dashboard");
	} else {
		switchView("login");
	}
}

function closeAuthModal() {
	authModal.classList.remove("open");
	authModal.setAttribute("aria-hidden", "true");
}

function renderDashboard(user) {
	dashboardWelcome.textContent = `Welcome, ${user.displayName || user.email}.`;
	populateEditorForm(currentSiteContent || getDefaultSiteContent());
	renderTrafficMetrics();
}

function mapAuthError(errorCode) {
	const messages = {
		"auth/email-already-in-use": "That email is already registered.",
		"auth/invalid-email": "That email format is invalid.",
		"auth/invalid-credential": "Incorrect email or password.",
		"auth/user-disabled": "This account is disabled.",
		"auth/missing-password": "Password is required.",
		"auth/operation-not-allowed": "Email/Password login is disabled in Firebase Console.",
		"auth/network-request-failed": "Network request failed. Check internet connection.",
		"auth/unauthorized-domain": "This domain is not authorized. Add it in Firebase Auth > Settings > Authorized domains.",
		"auth/requests-from-referer-file-are-blocked": "Firebase Auth does not work on file:// URLs. Use localhost or deploy to HTTPS.",
		"auth/too-many-requests": "Too many attempts. Try again later.",
		"auth/weak-password": "Password must be at least 6 characters.",
		"auth/user-not-found": "No account found for that email.",
		"auth/configuration-not-found": "Authentication provider config is missing. Enable Email/Password in Firebase Console."
	};

	return messages[errorCode] || "Something went wrong. Please try again.";
}

dashboardTrigger?.addEventListener("click", openAuthModal);
authClose?.addEventListener("click", closeAuthModal);

authModal?.addEventListener("click", (event) => {
	if (event.target === authModal) {
		closeAuthModal();
	}
});

document.querySelectorAll("[data-auth-view]").forEach((button) => {
	button.addEventListener("click", () => {
		const targetView = button.getAttribute("data-auth-view");
		switchView(targetView);
		showMessage("");
	});
});

loginForm?.addEventListener("submit", (event) => {
	event.preventDefault();
	const runtimeIssue = getRuntimeIssue();
	if (runtimeIssue) {
		showMessage(runtimeIssue, true);
		return;
	}

	if (!auth) {
		showMessage("Firebase is not configured yet.", true);
		return;
	}

	const email = (new FormData(loginForm).get("email") || "").toString().trim().toLowerCase();
	const password = (new FormData(loginForm).get("password") || "").toString();

	auth
		.signInWithEmailAndPassword(email, password)
		.then(({ user }) => {
			renderDashboard(user);
			switchView("dashboard");
			showMessage("Login successful.");
			loginForm.reset();
		})
		.catch((error) => {
			console.error("Login failed:", error);
			showMessage(`${mapAuthError(error.code)}${error.code ? ` (${error.code})` : ""}`, true);
		});
});

registerForm?.addEventListener("submit", (event) => {
	event.preventDefault();
	const runtimeIssue = getRuntimeIssue();
	if (runtimeIssue) {
		showMessage(runtimeIssue, true);
		return;
	}

	if (!auth) {
		showMessage("Firebase is not configured yet.", true);
		return;
	}

	const formData = new FormData(registerForm);
	const name = (formData.get("name") || "").toString().trim();
	const email = (formData.get("email") || "").toString().trim().toLowerCase();
	const password = (formData.get("password") || "").toString();

	if (password.length < 6) {
		showMessage("Password must be at least 6 characters.", true);
		return;
	}

	auth
		.createUserWithEmailAndPassword(email, password)
		.then(async ({ user }) => {
			if (name) {
				await user.updateProfile({ displayName: name });
			}
			renderDashboard(auth.currentUser || user);
			switchView("dashboard");
			showMessage("Registration successful.");
			registerForm.reset();
		})
		.catch((error) => {
			console.error("Registration failed:", error);
			showMessage(`${mapAuthError(error.code)}${error.code ? ` (${error.code})` : ""}`, true);
		});
});

forgotForm?.addEventListener("submit", (event) => {
	event.preventDefault();
	if (!auth) {
		showMessage("Firebase is not configured yet.", true);
		return;
	}

	const formData = new FormData(forgotForm);
	const email = (formData.get("email") || "").toString().trim().toLowerCase();

	auth
		.sendPasswordResetEmail(email)
		.then(() => {
			forgotForm.reset();
			switchView("login");
			showMessage("Password reset email sent.");
		})
		.catch((error) => {
			showMessage(mapAuthError(error.code), true);
		});
});

logoutBtn?.addEventListener("click", () => {
	if (!auth) {
		switchView("login");
		return;
	}

	auth
		.signOut()
		.then(() => {
			switchView("login");
			showMessage("Logged out.");
		})
		.catch(() => {
			showMessage("Could not log out. Please try again.", true);
		});
});

addLinkBtn?.addEventListener("click", () => {
	editorState.links.push({ label: "New Link", url: "https://", shake: false });
	renderEditorList();
});

addSocialBtn?.addEventListener("click", () => {
	editorState.socials.push({ iconClass: "fa-brands fa-linkedin", url: "https://" });
	renderEditorList();
});

contentEditorForm?.addEventListener("submit", async (event) => {
	event.preventDefault();

	if (!currentUser) {
		showMessage("Please login first.", true);
		return;
	}

	const updatedContent = readContentFromEditor();
	setContentState(updatedContent);

	try {
		await saveSiteContentToFirestore(updatedContent);
		showMessage("Content saved. Your front end is updated.");
	} catch {
		showMessage("Could not save content. Check Firestore rules.", true);
	}
});

setContentState(getDefaultSiteContent());
trackLocalVisitStart();

window.addEventListener("pagehide", () => {
	finalizeLocalSession();
	finalizeRemoteSession();
});

window.addEventListener("beforeunload", () => {
	finalizeLocalSession();
	finalizeRemoteSession();
});

initFirebase();

function getTodayKey(date = new Date()) {
	return date.toISOString().slice(0, 10);
}

function readAnalytics() {
	try {
		const raw = localStorage.getItem(ANALYTICS_STORAGE_KEY);
		if (!raw) {
			return {
				totalVisits: 0,
				visitDates: {},
				referrers: {},
				devices: {},
				sessions: []
			};
		}
		const parsed = JSON.parse(raw);
		return {
			totalVisits: parsed.totalVisits || 0,
			visitDates: parsed.visitDates || {},
			referrers: parsed.referrers || {},
			devices: parsed.devices || {},
			sessions: Array.isArray(parsed.sessions) ? parsed.sessions : []
		};
	} catch {
		return {
			totalVisits: 0,
			visitDates: {},
			referrers: {},
			devices: {},
			sessions: []
		};
	}
}

function writeAnalytics(analytics) {
	localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(analytics));
}

function detectDeviceType() {
	const ua = navigator.userAgent.toLowerCase();
	if (/tablet|ipad/.test(ua)) {
		return "Tablet";
	}
	if (/mobi|android|iphone/.test(ua)) {
		return "Mobile";
	}
	return "Desktop";
}

function parseReferrer() {
	if (!document.referrer) {
		return "Direct";
	}

	try {
		return new URL(document.referrer).hostname || "Direct";
	} catch {
		return "Direct";
	}
}

function incrementMapCounter(map, key) {
	map[key] = (map[key] || 0) + 1;
}

function trackVisitStart() {
	const analytics = readAnalytics();
	const today = getTodayKey();
	const referrer = parseReferrer();
	const device = detectDeviceType();

	analytics.totalVisits += 1;
	incrementMapCounter(analytics.visitDates, today);
	incrementMapCounter(analytics.referrers, referrer);
	incrementMapCounter(analytics.devices, device);
	analytics.sessions.push({ startAt: Date.now(), durationSec: 0 });
	analytics.sessions = analytics.sessions.slice(-300);

	writeAnalytics(analytics);
}

function finalizeSession() {
	if (sessionFinalized) {
		return;
	}
	sessionFinalized = true;

	const analytics = readAnalytics();
	if (!analytics.sessions.length) {
		return;
	}

	const durationSec = Math.max(1, Math.round((Date.now() - sessionStartedAt) / 1000));
	analytics.sessions[analytics.sessions.length - 1].durationSec = durationSec;
	writeAnalytics(analytics);
}

function formatDuration(seconds) {
	if (seconds < 60) {
		return `${seconds}s`;
	}
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	return `${minutes}m ${remainingSeconds}s`;
}

function pickTopKey(counterMap, fallback) {
	const entries = Object.entries(counterMap);
	if (!entries.length) {
		return fallback;
	}
	entries.sort((a, b) => b[1] - a[1]);
	return entries[0][0];
}

function getLastNDays(n) {
	const days = [];
	for (let i = n - 1; i >= 0; i -= 1) {
		const date = new Date();
		date.setDate(date.getDate() - i);
		days.push(getTodayKey(date));
	}
	return days;
}

function computeDashboardMetrics(analytics) {
	const days30 = getLastNDays(30);
	let visits30d = 0;
	let activeDays30d = 0;

	days30.forEach((dayKey) => {
		const dayVisits = analytics.visitDates[dayKey] || 0;
		visits30d += dayVisits;
		if (dayVisits > 0) {
			activeDays30d += 1;
		}
	});

	const durations = analytics.sessions
		.map((session) => session.durationSec || 0)
		.filter((duration) => duration > 0);

	const avgSessionSec = durations.length
		? Math.round(durations.reduce((sum, current) => sum + current, 0) / durations.length)
		: 0;

	const last7days = getLastNDays(7).map((dayKey) => ({
		dayLabel: dayKey.slice(5),
		visits: analytics.visitDates[dayKey] || 0
	}));

	return {
		visits30d,
		activeDays30d,
		avgSessionSec,
		topReferrer: pickTopKey(analytics.referrers, "Direct"),
		topDevice: pickTopKey(analytics.devices, "Desktop"),
		last7days
	};
}

function renderTrafficMetrics() {
	if (!metricVisits30d || !metricActiveDays || !metricAvgSession || !metricTopReferrer || !metricTopDevice || !metricLast7Days) {
		return;
	}

	const metrics = computeDashboardMetrics(readAnalytics());
	metricVisits30d.textContent = String(metrics.visits30d);
	metricActiveDays.textContent = String(metrics.activeDays30d);
	metricAvgSession.textContent = formatDuration(metrics.avgSessionSec);
	metricTopReferrer.textContent = metrics.topReferrer;
	metricTopDevice.textContent = metrics.topDevice;

	metricLast7Days.innerHTML = "";
	metrics.last7days.forEach((item) => {
		const li = document.createElement("li");
		const day = document.createElement("span");
		const count = document.createElement("span");
		day.textContent = item.dayLabel;
		count.textContent = `${item.visits} visits`;
		li.appendChild(day);
		li.appendChild(count);
		metricLast7Days.appendChild(li);
	});
}

function hasFirebaseConfig() {
	return (
		firebaseConfig.apiKey &&
		!firebaseConfig.apiKey.startsWith("YOUR_") &&
		firebaseConfig.authDomain &&
		!firebaseConfig.authDomain.startsWith("YOUR_") &&
		firebaseConfig.projectId &&
		!firebaseConfig.projectId.startsWith("YOUR_") &&
		firebaseConfig.appId &&
		!firebaseConfig.appId.startsWith("YOUR_")
	);
}

function initFirebaseAuth() {
	if (!window.firebase || !hasFirebaseConfig()) {
		return;
	}

	if (!firebase.apps.length) {
		firebase.initializeApp(firebaseConfig);
	}

	auth = firebase.auth();
	auth.onAuthStateChanged((user) => {
		currentUser = user;
		if (user) {
			renderDashboard(user);
			if (authModal.classList.contains("open")) {
				switchView("dashboard");
			}
		}
	});
}

function showMessage(message, isError = false) {
	authMessage.textContent = message;
	authMessage.style.color = isError ? "#ffb0b0" : "#f6dda6";
}

function switchView(viewName) {
	Object.entries(views).forEach(([name, section]) => {
		section.hidden = name !== viewName;
	});
}

function openAuthModal() {
	authModal.classList.add("open");
	authModal.setAttribute("aria-hidden", "false");
	showMessage("");

	if (!auth) {
		switchView("login");
		showMessage("Firebase is not configured yet. Add your Firebase keys in script.js.", true);
		return;
	}

	if (currentUser?.email) {
		renderDashboard(currentUser);
		switchView("dashboard");
	} else {
		switchView("login");
	}
}

function closeAuthModal() {
	authModal.classList.remove("open");
	authModal.setAttribute("aria-hidden", "true");
}

function renderDashboard(user) {
	dashboardWelcome.textContent = `Welcome, ${user.displayName || user.email}.`;
	dashboardLink.href = dashboardTarget;
	renderTrafficMetrics();
}

function mapAuthError(errorCode) {
	const messages = {
		"auth/email-already-in-use": "That email is already registered.",
		"auth/invalid-email": "That email format is invalid.",
		"auth/invalid-credential": "Incorrect email or password.",
		"auth/weak-password": "Password must be at least 6 characters.",
		"auth/user-not-found": "No account found for that email.",
		"auth/too-many-requests": "Too many attempts. Try again later."
	};

	return messages[errorCode] || "Something went wrong. Please try again.";
}

dashboardTrigger?.addEventListener("click", openAuthModal);
authClose?.addEventListener("click", closeAuthModal);

authModal?.addEventListener("click", (event) => {
	if (event.target === authModal) {
		closeAuthModal();
	}
});

document.querySelectorAll("[data-auth-view]").forEach((button) => {
	button.addEventListener("click", () => {
		const targetView = button.getAttribute("data-auth-view");
		switchView(targetView);
		showMessage("");
	});
});

loginForm?.addEventListener("submit", (event) => {
	event.preventDefault();
	if (!auth) {
		showMessage("Firebase is not configured yet.", true);
		return;
	}

	const email = (new FormData(loginForm).get("email") || "").toString().trim().toLowerCase();
	const password = (new FormData(loginForm).get("password") || "").toString();

	auth
		.signInWithEmailAndPassword(email, password)
		.then(({ user }) => {
			renderDashboard(user);
			switchView("dashboard");
			showMessage("Login successful.");
			loginForm.reset();
		})
		.catch((error) => {
			showMessage(mapAuthError(error.code), true);
		});
});

registerForm?.addEventListener("submit", (event) => {
	event.preventDefault();
	if (!auth) {
		showMessage("Firebase is not configured yet.", true);
		return;
	}

	const formData = new FormData(registerForm);
	const name = (formData.get("name") || "").toString().trim();
	const email = (formData.get("email") || "").toString().trim().toLowerCase();
	const password = (formData.get("password") || "").toString();

	if (password.length < 6) {
		showMessage("Password must be at least 6 characters.", true);
		return;
	}

	auth
		.createUserWithEmailAndPassword(email, password)
		.then(async ({ user }) => {
			if (name) {
				await user.updateProfile({ displayName: name });
			}
			renderDashboard(auth.currentUser || user);
			switchView("dashboard");
			showMessage("Registration successful.");
			registerForm.reset();
		})
		.catch((error) => {
			showMessage(mapAuthError(error.code), true);
		});
});

forgotForm?.addEventListener("submit", (event) => {
	event.preventDefault();
	if (!auth) {
		showMessage("Firebase is not configured yet.", true);
		return;
	}

	const formData = new FormData(forgotForm);
	const email = (formData.get("email") || "").toString().trim().toLowerCase();

	auth
		.sendPasswordResetEmail(email)
		.then(() => {
			forgotForm.reset();
			switchView("login");
			showMessage("Password reset email sent.");
		})
		.catch((error) => {
			showMessage(mapAuthError(error.code), true);
		});
});

logoutBtn?.addEventListener("click", () => {
	if (!auth) {
		switchView("login");
		return;
	}

	auth
		.signOut()
		.then(() => {
			switchView("login");
			showMessage("Logged out.");
		})
		.catch(() => {
			showMessage("Could not log out. Please try again.", true);
		});
});

trackVisitStart();

window.addEventListener("pagehide", finalizeSession);
window.addEventListener("beforeunload", finalizeSession);

initFirebaseAuth();

