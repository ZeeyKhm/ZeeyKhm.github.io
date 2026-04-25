const firebaseConfig = {
  apiKey: "AIzaSyBKGs0joDyb3IPkysZW4308JO65PRhcAgY",
  authDomain: "linkinbio-6f2b1.firebaseapp.com",
  projectId: "linkinbio-6f2b1",
  appId: "1:948879547982:web:9ab953074d6b9abe27ad1f"
};

const CONTENT_COLLECTION = "siteContent";
const CONTENT_DOC_ID = "main";

const dashboardWelcome = document.getElementById("dashboard-welcome");
const logoutBtn = document.getElementById("logout-btn");
const dashboardMessage = document.getElementById("dashboard-message");
const authPanel = document.getElementById("auth-panel");
const dashboardShell = document.getElementById("dashboard-shell");
const authMessage = document.getElementById("dashboard-auth-message");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const forgotForm = document.getElementById("forgot-form");

const metricVisits30d = document.getElementById("metric-visits-30d");
const metricActiveDays = document.getElementById("metric-active-days");
const metricAvgSession = document.getElementById("metric-avg-session");
const metricTopReferrer = document.getElementById("metric-top-referrer");
const metricTopDevice = document.getElementById("metric-top-device");
const metricLast7Days = document.getElementById("metric-last-7-days");

const contentEditorForm = document.getElementById("content-editor-form");
const profileImageInput = document.getElementById("editor-profile-image");
const profileImagePreview = document.getElementById("editor-profile-image-preview");
const addLinkBtn = document.getElementById("add-link-btn");
const addSocialBtn = document.getElementById("add-social-btn");
const editorLinksList = document.getElementById("editor-links-list");
const editorSocialList = document.getElementById("editor-social-list");

let auth = null;
let db = null;
let currentUser = null;
let selectedProfileImage = "";

const editorState = {
  links: [],
  socials: []
};

const SOCIAL_ICON_OPTIONS = [
  { label: "WhatsApp", value: "fa-brands fa-whatsapp" },
  { label: "Facebook", value: "fa-brands fa-facebook" },
  { label: "Instagram", value: "fa-brands fa-instagram" },
  { label: "Discord", value: "fa-brands fa-discord" },
  { label: "TikTok", value: "fa-brands fa-tiktok" },
  { label: "Telegram", value: "fa-brands fa-telegram" },
  { label: "LinkedIn", value: "fa-brands fa-linkedin" },
  { label: "Reddit", value: "fa-brands fa-reddit" },
  { label: "X (Twitter)", value: "fa-brands fa-x-twitter" },
  { label: "Threads", value: "fa-brands fa-threads" },
  { label: "YouTube", value: "fa-brands fa-youtube" },
  { label: "GitHub", value: "fa-brands fa-github" },
  { label: "Website", value: "fa-solid fa-globe" }
];

function goToHomePage() {
  window.location.href = "index.html";
}

const defaultContent = {
  profileImage: "asset/images/pp.jpg",
  userName: "Muhammad Azizi Keffli",
  description: "A way to share your social links!",
  reachOutText: "Feel free to reach out!",
  reachOutUrl: "https://mail.google.com/mail/?view=cm&fs=1&to=Azizi702@hotmail.com",
  links: [
    {
      label: "Website",
      url: "https://feline-oyster-22f.notion.site/Zeey-Khm-Workfolio-46811d52f44f4199ab156b7bc7182a7e?source=copy_link",
      shake: true
    },
    { label: "Publication", url: "#", shake: false }
  ],
  socials: [
    { iconClass: "fa-brands fa-whatsapp", url: "https://wa.me/6738125702" },
    { iconClass: "fa-brands fa-facebook", url: "https://www.facebook.com/ZeeyKhm/" },
    { iconClass: "fa-brands fa-instagram", url: "https://www.instagram.com/zeeykhm/" }
  ]
};

function showMessage(message, isError = false) {
  dashboardMessage.textContent = message;
  dashboardMessage.style.color = isError ? "#ffb6b6" : "#f7e09b";
}

function showAuthMessage(message, isError = false) {
  if (!authMessage) {
    return;
  }
  authMessage.textContent = message;
  authMessage.style.color = isError ? "#ffb6b6" : "#f7e09b";
}

function mapFirestoreError(error) {
  const code = error?.code || "unknown";
  const messages = {
    "permission-denied": "Permission denied. Update Firestore rules for this collection.",
    "unauthenticated": "You are not authenticated. Please log in again.",
    "failed-precondition": "Firestore is not ready. Ensure Firestore Database is created.",
    "unavailable": "Firestore service is unavailable right now. Try again.",
    "not-found": "Requested Firestore document was not found.",
    "invalid-argument": "Image is too large to store. Use a smaller image or stronger compression.",
    "resource-exhausted": "Firestore quota exceeded or payload too large."
  };

  return `${messages[code] || "Firestore request failed."} (${code})`;
}

function hasFirebaseConfig() {
  return (
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );
}

function sanitizeSiteContent(rawContent) {
  return {
    profileImage: rawContent?.profileImage ? String(rawContent.profileImage) : defaultContent.profileImage,
    userName: rawContent?.userName ? String(rawContent.userName) : defaultContent.userName,
    description: rawContent?.description ? String(rawContent.description) : defaultContent.description,
    reachOutText: rawContent?.reachOutText ? String(rawContent.reachOutText) : defaultContent.reachOutText,
    reachOutUrl: rawContent?.reachOutUrl ? String(rawContent.reachOutUrl) : defaultContent.reachOutUrl,
    links: Array.isArray(rawContent?.links)
      ? rawContent.links
          .filter((link) => link && link.label && link.url)
          .map((link) => ({
            label: String(link.label).slice(0, 80),
            url: String(link.url),
            shake: Boolean(link.shake)
          }))
      : defaultContent.links,
    socials: Array.isArray(rawContent?.socials)
      ? rawContent.socials
          .filter((social) => social && social.iconClass && social.url)
          .map((social) => ({
            iconClass: String(social.iconClass).slice(0, 120),
            url: String(social.url)
          }))
      : defaultContent.socials
  };
}

function getIconOptionLabel(iconClass) {
  const found = SOCIAL_ICON_OPTIONS.find((option) => option.value === iconClass);
  return found ? found.label : "Custom Icon";
}

function loadImageFromObjectUrl(objectUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image-load-failed"));
    img.src = objectUrl;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }
      reject(new Error("canvas-blob-failed"));
    }, type, quality);
  });
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("blob-read-failed"));
    reader.readAsDataURL(blob);
  });
}

async function compressImageFileToDataUrl(file) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImageFromObjectUrl(objectUrl);
    const maxSide = 512;
    const scale = Math.min(maxSide / image.width, maxSide / image.height, 1);
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("canvas-context-failed");
    }

    context.drawImage(image, 0, 0, width, height);

    let quality = 0.82;
    let blob = await canvasToBlob(canvas, "image/jpeg", quality);
    const targetBytes = 250 * 1024;

    while (blob.size > targetBytes && quality > 0.45) {
      quality -= 0.08;
      blob = await canvasToBlob(canvas, "image/jpeg", quality);
    }

    return blobToDataUrl(blob);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function renderEditorList() {
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

    const toggle = document.createElement("label");
    toggle.className = "editor-item-toggle";
    const toggleInput = document.createElement("input");
    toggleInput.type = "checkbox";
    toggleInput.checked = link.shake;

    const preview = document.createElement("span");
    preview.className = link.shake ? "editor-link-preview shake" : "editor-link-preview";
    preview.textContent = link.label || "Preview Link";

    labelInput.addEventListener("input", () => {
      preview.textContent = labelInput.value || "Preview Link";
    });

    toggleInput.addEventListener("change", () => {
      editorState.links[index].shake = toggleInput.checked;
      preview.className = toggleInput.checked ? "editor-link-preview shake" : "editor-link-preview";
    });
    toggle.appendChild(toggleInput);
    toggle.appendChild(document.createTextNode("Highlight with shake"));

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
    item.appendChild(toggle);
    item.appendChild(preview);
    item.appendChild(actions);
    editorLinksList.appendChild(item);
  });

  editorSocialList.innerHTML = "";
  editorState.socials.forEach((social, index) => {
    const item = document.createElement("div");
    item.className = "editor-item";

    const iconRow = document.createElement("div");
    iconRow.className = "editor-icon-row";

    const iconPreview = document.createElement("i");
    iconPreview.className = social.iconClass;

    const iconSelect = document.createElement("select");
    iconSelect.setAttribute("aria-label", "Select social icon");

    SOCIAL_ICON_OPTIONS.forEach((optionData) => {
      const option = document.createElement("option");
      option.value = optionData.value;
      option.textContent = optionData.label;
      iconSelect.appendChild(option);
    });

    const currentIconExists = SOCIAL_ICON_OPTIONS.some((optionData) => optionData.value === social.iconClass);
    if (!currentIconExists && social.iconClass) {
      const customOption = document.createElement("option");
      customOption.value = social.iconClass;
      customOption.textContent = `${getIconOptionLabel(social.iconClass)} (${social.iconClass})`;
      iconSelect.appendChild(customOption);
    }

    iconSelect.value = social.iconClass;
    iconSelect.addEventListener("change", () => {
      editorState.socials[index].iconClass = iconSelect.value;
      iconPreview.className = iconSelect.value;
    });

    iconRow.appendChild(iconPreview);
    iconRow.appendChild(iconSelect);

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

    item.appendChild(iconRow);
    item.appendChild(urlInput);
    item.appendChild(actions);
    editorSocialList.appendChild(item);
  });
}

function populateEditorForm(content) {
  selectedProfileImage = content.profileImage;
  if (profileImagePreview) {
    profileImagePreview.src = content.profileImage;
  }
  if (profileImageInput) {
    profileImageInput.value = "";
  }
  contentEditorForm.userName.value = content.userName;
  contentEditorForm.description.value = content.description;
  contentEditorForm.reachOutText.value = content.reachOutText;
  contentEditorForm.reachOutUrl.value = content.reachOutUrl;

  editorState.links = content.links.map((link) => ({ ...link }));
  editorState.socials = content.socials.map((social) => ({ ...social }));
  renderEditorList();
}

function readContentFromEditor() {
  return sanitizeSiteContent({
    profileImage: selectedProfileImage,
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
  });
}

function getTodayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
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

function pickTopKey(counterMap, fallback) {
  const entries = Object.entries(counterMap);
  if (!entries.length) {
    return fallback;
  }
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

function formatDuration(seconds) {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function applyMetrics(metrics) {
  if (!metrics) {
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
    const visits = Number(doc.data().visits || 0);
    dayCountMap[doc.id] = visits;
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

  const sessionCount = Number(totals.sessionCount || 0);
  const totalSessionDurationSec = Number(totals.totalSessionDurationSec || 0);

  return {
    visits30d,
    activeDays30d,
    avgSessionSec: sessionCount > 0 ? Math.round(totalSessionDurationSec / sessionCount) : 0,
    topReferrer: pickTopKey(referrers, "Direct"),
    topDevice: pickTopKey(devices, "Desktop"),
    last7days: last7.map((dayKey) => ({ dayLabel: dayKey.slice(5), visits: dayCountMap[dayKey] || 0 }))
  };
}

async function loadDashboardData() {
  let hasAnyError = false;

  try {
    const contentSnap = await db.collection(CONTENT_COLLECTION).doc(CONTENT_DOC_ID).get();
    const content = contentSnap.exists ? sanitizeSiteContent(contentSnap.data()) : defaultContent;
    populateEditorForm(content);
  } catch (error) {
    hasAnyError = true;
    console.error("Content load failed:", error);
    populateEditorForm(defaultContent);
    showMessage(`Content load failed: ${mapFirestoreError(error)}`, true);
  }

  try {
    const metrics = await fetchRemoteDashboardMetrics();
    applyMetrics(metrics);
    if (!hasAnyError) {
      showMessage("Dashboard loaded.");
    }
  } catch (error) {
    hasAnyError = true;
    console.error("Analytics load failed:", error);
    showMessage(`Analytics load failed: ${mapFirestoreError(error)}`, true);
  }
}

function showDashboard() {
  if (authPanel) {
    authPanel.hidden = true;
  }
  if (dashboardShell) {
    dashboardShell.hidden = false;
  }
}

function showAuth() {
  if (authPanel) {
    authPanel.hidden = false;
  }
  if (dashboardShell) {
    dashboardShell.hidden = true;
  }
}

function switchAuthView(viewName) {
  const views = {
    login: document.getElementById("auth-login-view"),
    register: document.getElementById("auth-register-view"),
    forgot: document.getElementById("auth-forgot-view")
  };

  Object.entries(views).forEach(([name, section]) => {
    if (section) {
      section.hidden = name !== viewName;
    }
  });
}

async function saveContent() {
  const content = readContentFromEditor();
  await db.collection(CONTENT_COLLECTION).doc(CONTENT_DOC_ID).set(
    {
      ...content,
      updatedBy: currentUser.email || currentUser.uid,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    },
    { merge: true }
  );
}

if (!window.firebase || !hasFirebaseConfig()) {
  showAuthMessage("Firebase config is missing.", true);
} else {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  auth = firebase.auth();
  db = firebase.firestore();

  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      currentUser = null;
      goToHomePage();
      return;
    }

    currentUser = user;
    dashboardWelcome.textContent = `Welcome, ${user.displayName || user.email}.`;
    showDashboard();
    await loadDashboardData();
  });
}

document.querySelectorAll("[data-auth-view]").forEach((button) => {
  button.addEventListener("click", () => {
    switchAuthView(button.getAttribute("data-auth-view"));
    showAuthMessage("");
  });
});

loginForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = (new FormData(loginForm).get("email") || "").toString().trim().toLowerCase();
  const password = (new FormData(loginForm).get("password") || "").toString();

  auth
    .signInWithEmailAndPassword(email, password)
    .then(() => {
      showAuthMessage("Login successful.");
      loginForm.reset();
    })
    .catch((error) => {
      console.error(error);
      showAuthMessage(`Login failed: ${mapFirestoreError(error)}`, true);
    });
});

registerForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(registerForm);
  const name = (formData.get("name") || "").toString().trim();
  const email = (formData.get("email") || "").toString().trim().toLowerCase();
  const password = (formData.get("password") || "").toString();

  auth
    .createUserWithEmailAndPassword(email, password)
    .then(async ({ user }) => {
      if (name) {
        await user.updateProfile({ displayName: name });
      }
      registerForm.reset();
      showAuthMessage("Registration successful.");
    })
    .catch((error) => {
      console.error(error);
      showAuthMessage(`Register failed: ${mapFirestoreError(error)}`, true);
    });
});

forgotForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = (new FormData(forgotForm).get("email") || "").toString().trim().toLowerCase();

  auth
    .sendPasswordResetEmail(email)
    .then(() => {
      forgotForm.reset();
      showAuthMessage("Password reset email sent.");
    })
    .catch((error) => {
      console.error(error);
      showAuthMessage(`Reset failed: ${mapFirestoreError(error)}`, true);
    });
});

logoutBtn.addEventListener("click", async () => {
  try {
    await auth.signOut();
    goToHomePage();
  } catch (error) {
    console.error(error);
    showMessage("Logout failed.", true);
  }
});

profileImageInput?.addEventListener("change", async () => {
  const selectedFile = profileImageInput.files && profileImageInput.files[0];
  if (!selectedFile) {
    return;
  }

  if (!selectedFile.type.startsWith("image/")) {
    showMessage("Please choose an image file.", true);
    profileImageInput.value = "";
    return;
  }

  if (selectedFile.size > 2 * 1024 * 1024) {
    showMessage("Image is too large. Use a file smaller than 2MB.", true);
    profileImageInput.value = "";
    return;
  }

  try {
    const compressedDataUrl = await compressImageFileToDataUrl(selectedFile);
    selectedProfileImage = compressedDataUrl;
    if (profileImagePreview) {
      profileImagePreview.src = compressedDataUrl;
    }
    showMessage("Profile image selected. Save changes to store it in Firestore.");
  } catch {
    showMessage("Could not process the selected image. Please try another file.", true);
  }
});

addLinkBtn.addEventListener("click", () => {
  editorState.links.push({ label: "New Link", url: "https://", shake: false });
  renderEditorList();
});

addSocialBtn.addEventListener("click", () => {
  editorState.socials.push({ iconClass: "fa-brands fa-linkedin", url: "https://" });
  renderEditorList();
});

contentEditorForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentUser) {
    showMessage("Please login first.", true);
    return;
  }

  try {
    await saveContent();
    showMessage("Saved. Homepage content updated.");
  } catch (error) {
    console.error(error);
    showMessage(`Save failed: ${mapFirestoreError(error)}`, true);
  }
});
