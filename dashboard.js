// ===== Dashboard Navigation & Theme Management =====
function initializeDashboardNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  const contentSections = document.querySelectorAll(".content-section");

  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      if (hasUnsavedChanges) {
        pendingSectionSwitch = item.getAttribute("data-section");
        showUnsavedChangesModal();
        return;
      }

      switchToSection(item, navItems, contentSections);
    });
  });
}

function switchToSection(item, navItems, contentSections) {
  const section = item.getAttribute("data-section");

  // Update active nav item
  navItems.forEach((nav) => nav.classList.remove("active"));
  item.classList.add("active");

  // Update active content section
  contentSections.forEach((sec) => sec.classList.remove("active"));
  const activeSection = document.getElementById(section);
  if (activeSection) {
    activeSection.classList.add("active");
  }
}

function saveThemeToFirebase(isDarkMode) {
  if (!db) {
    return;
  }

  db.collection("siteContent")
    .doc("main")
    .set({ theme: isDarkMode ? "dark-mode" : "light-mode" }, { merge: true })
    .catch((error) => console.error("Failed to save theme preference:", error));
}

function loadThemeFromFirebase() {
  if (!db) {
    const savedTheme = localStorage.getItem("dashboard-theme") || "light-mode";
    applyTheme(savedTheme);
    return;
  }

  db.collection("siteContent")
    .doc("main")
    .get()
    .then((doc) => {
      const theme = doc.data()?.theme || localStorage.getItem("dashboard-theme") || "light-mode";
      applyTheme(theme);
      // Show dashboard content after theme is loaded
      showDashboardContent();
    })
    .catch((error) => {
      console.error("Failed to load theme preference:", error);
      const savedTheme = localStorage.getItem("dashboard-theme") || "light-mode";
      applyTheme(savedTheme);
      // Show dashboard content even if theme load fails
      showDashboardContent();
    });
}

function applyTheme(theme) {
  const themeToggle = document.getElementById("theme-toggle");
  const themeLabel = document.getElementById("theme-label");

  if (theme === "dark-mode") {
    document.body.classList.add("dark-mode");
    themeToggle?.classList.remove("light-mode");
    themeToggle?.classList.add("dark-mode");
    if (themeLabel) {
      themeLabel.textContent = "Dark Mode";
    }
  } else {
    document.body.classList.remove("dark-mode");
    themeToggle?.classList.add("light-mode");
    themeToggle?.classList.remove("dark-mode");
    if (themeLabel) {
      themeLabel.textContent = "Light Mode";
    }
  }
  localStorage.setItem("dashboard-theme", theme);
}

function initializeThemeToggle() {
  const themeToggle = document.getElementById("theme-toggle");

  themeToggle?.addEventListener("click", () => {
    const isDarkMode = document.body.classList.toggle("dark-mode");
    themeToggle.classList.toggle("light-mode");
    themeToggle.classList.toggle("dark-mode");

    const themeLabel = document.getElementById("theme-label");
    if (themeLabel) {
      themeLabel.textContent = isDarkMode ? "Dark Mode" : "Light Mode";
    }

    const newTheme = isDarkMode ? "dark-mode" : "light-mode";
    localStorage.setItem("dashboard-theme", newTheme);
    saveThemeToFirebase(isDarkMode);
  });
}

function showUnsavedChangesModal() {
  if (unsavedChangesModal) {
    unsavedChangesModal.classList.add("active");
  }
}

function hideUnsavedChangesModal() {
  if (unsavedChangesModal) {
    unsavedChangesModal.classList.remove("active");
  }
}

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

const unsavedChangesModal = document.getElementById("unsaved-changes-modal");
const btnUnsavedSave = document.getElementById("btn-unsaved-save");
const btnUnsavedDiscard = document.getElementById("btn-unsaved-discard");
const btnUnsavedCancel = document.getElementById("btn-unsaved-cancel");

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
const saveLinksBtnElement = document.getElementById("save-links-btn");
const saveSocialBtnElement = document.getElementById("save-social-btn");
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

// Unsaved changes tracking
let hasUnsavedChanges = false;
let pendingSectionSwitch = null;

const trackChangesFor = (elementIds) => {
  elementIds.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener("input", () => {
        hasUnsavedChanges = true;
        updateSaveButtonsState();
      });
      element.addEventListener("change", () => {
        hasUnsavedChanges = true;
        updateSaveButtonsState();
      });
    }
  });
};

function updateSaveButtonsState() {
  const saveLinksBtn = document.getElementById("save-links-btn");
  const saveSocialBtn = document.getElementById("save-social-btn");
  const saveContentBtn = document.getElementById("save-content-btn");
  
  if (hasUnsavedChanges) {
    saveLinksBtn?.removeAttribute("disabled");
    saveSocialBtn?.removeAttribute("disabled");
    saveContentBtn?.removeAttribute("disabled");
  } else {
    saveLinksBtn?.setAttribute("disabled", "disabled");
    saveSocialBtn?.setAttribute("disabled", "disabled");
    saveContentBtn?.setAttribute("disabled", "disabled");
  }
}

function resetUnsavedChanges() {
  hasUnsavedChanges = false;
  updateSaveButtonsState();
}

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

const SOCIAL_MEDIA_URLS = {
  "fa-brands fa-whatsapp": "https://wa.me/",
  "fa-brands fa-facebook": "https://www.facebook.com/",
  "fa-brands fa-instagram": "https://www.instagram.com/",
  "fa-brands fa-discord": "https://discord.gg/",
  "fa-brands fa-tiktok": "https://www.tiktok.com/@",
  "fa-brands fa-telegram": "https://t.me/",
  "fa-brands fa-linkedin": "https://www.linkedin.com/in/",
  "fa-brands fa-reddit": "https://reddit.com/u/",
  "fa-brands fa-x-twitter": "https://x.com/",
  "fa-brands fa-threads": "https://www.threads.net/@",
  "fa-brands fa-youtube": "https://www.youtube.com/@",
  "fa-brands fa-github": "https://github.com/",
  "fa-solid fa-globe": "https://"
};

const SOCIAL_MEDIA_PLACEHOLDERS = {
  "fa-brands fa-whatsapp": "phone number",
  "fa-brands fa-facebook": "username",
  "fa-brands fa-instagram": "username",
  "fa-brands fa-discord": "server id",
  "fa-brands fa-tiktok": "username",
  "fa-brands fa-telegram": "username",
  "fa-brands fa-linkedin": "profile name",
  "fa-brands fa-reddit": "username",
  "fa-brands fa-x-twitter": "@handle",
  "fa-brands fa-threads": "username",
  "fa-brands fa-youtube": "channel",
  "fa-brands fa-github": "username",
  "fa-solid fa-globe": "domain.com"
};

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

let chartsInstances = {};

function renderAnalyticsCharts(metrics) {
  // Destroy existing charts
  Object.values(chartsInstances).forEach((chart) => {
    if (chart) chart.destroy();
  });
  chartsInstances = {};

  const textColor = getComputedStyle(document.documentElement).getPropertyValue("--text-primary");
  const gridColor = getComputedStyle(document.documentElement).getPropertyValue("--border-color");

  // Visits Chart (Last 7 Days)
  const visitsCanvas = document.getElementById("visits-chart");
  if (visitsCanvas) {
    chartsInstances.visits = new Chart(visitsCanvas, {
      type: "line",
      data: {
        labels: metrics.last7days.map((day) => day.dayLabel),
        datasets: [
          {
            label: "Visits",
            data: metrics.last7days.map((day) => day.visits),
            borderColor: "rgb(107, 182, 255)",
            backgroundColor: "rgba(107, 182, 255, 0.1)",
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            labels: { color: textColor, font: { family: "'Space Mono', monospace" } }
          }
        },
        scales: {
          y: {
            ticks: { color: textColor },
            grid: { color: gridColor }
          },
          x: {
            ticks: { color: textColor },
            grid: { color: gridColor }
          }
        }
      }
    });
  }

  // Referrers Chart - Use real data from metrics
  const referrersCanvas = document.getElementById("referrers-chart");
  if (referrersCanvas) {
    const referrerLabels = Object.keys(metrics.referrersMap || {}).slice(0, 5);
    const referrerData = referrerLabels.map((label) => metrics.referrersMap[label] || 0);
    
    // If no referrer data, show default
    if (referrerLabels.length === 0) {
      referrerLabels.push("No Data");
      referrerData.push(0);
    }
    
    chartsInstances.referrers = new Chart(referrersCanvas, {
      type: "doughnut",
      data: {
        labels: referrerLabels,
        datasets: [
          {
            data: referrerData,
            backgroundColor: [
              "rgba(107, 182, 255, 0.8)",
              "rgba(74, 222, 128, 0.8)",
              "rgba(251, 191, 36, 0.8)",
              "rgba(244, 114, 182, 0.8)",
              "rgba(168, 85, 247, 0.8)"
            ]
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            labels: { color: textColor, font: { family: "'Space Mono', monospace" } }
          }
        }
      }
    });
  }

  // Devices Chart - Use real data from metrics
  const devicesCanvas = document.getElementById("devices-chart");
  if (devicesCanvas) {
    const deviceLabels = Object.keys(metrics.devicesMap || {}).slice(0, 3);
    const deviceData = deviceLabels.map((label) => metrics.devicesMap[label] || 0);
    
    // If no device data, show default
    if (deviceLabels.length === 0) {
      deviceLabels.push("No Data");
      deviceData.push(0);
    }
    
    chartsInstances.devices = new Chart(devicesCanvas, {
      type: "pie",
      data: {
        labels: deviceLabels,
        datasets: [
          {
            data: deviceData,
            backgroundColor: [
              "rgba(107, 182, 255, 0.8)",
              "rgba(74, 222, 128, 0.8)",
              "rgba(251, 191, 36, 0.8)"
            ]
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            labels: { color: textColor, font: { family: "'Space Mono', monospace" } }
          }
        }
      }
    });
  }

  // Session Duration Chart
  const sessionCanvas = document.getElementById("session-chart");
  if (sessionCanvas) {
    chartsInstances.session = new Chart(sessionCanvas, {
      type: "bar",
      data: {
        labels: metrics.last7days.map((day) => day.dayLabel),
        datasets: [
          {
            label: "Avg Session (s)",
            data: metrics.last7days.map(() => metrics.avgSessionSec),
            backgroundColor: "rgba(107, 182, 255, 0.6)",
            borderColor: "rgba(107, 182, 255, 1)",
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            labels: { color: textColor, font: { family: "'Space Mono', monospace" } }
          }
        },
        scales: {
          y: {
            ticks: { color: textColor },
            grid: { color: gridColor }
          },
          x: {
            ticks: { color: textColor },
            grid: { color: gridColor }
          }
        }
      }
    });
  }
}

function initializeAnalyticsViewToggle() {
  const toggleButtons = document.querySelectorAll(".toggle-view-btn");

  toggleButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const viewType = btn.getAttribute("data-view");

      // Update active button
      toggleButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // Update active view
      const graphicalView = document.getElementById("analytics-graphical");
      const analyticalView = document.getElementById("analytics-analytical");

      if (viewType === "graphical") {
        graphicalView?.classList.add("active");
        analyticalView?.classList.remove("active");
        // Resize charts when shown
        setTimeout(() => {
          Object.values(chartsInstances).forEach((chart) => {
            if (chart) chart.resize();
          });
        }, 100);
      } else {
        graphicalView?.classList.remove("active");
        analyticalView?.classList.add("active");
      }
    });
  });
}

function applyMetrics(metrics) {
  metricVisits30d.textContent = metrics.visits30d;
  metricActiveDays.textContent = metrics.activeDays30d;
  metricAvgSession.textContent = `${metrics.avgSessionSec}s`;
  metricTopReferrer.textContent = metrics.topReferrer;
  metricTopDevice.textContent = metrics.topDevice;

  metricLast7Days.innerHTML = "";
  metrics.last7days.forEach((day) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${day.dayLabel}</span><span>${day.visits}</span>`;
    metricLast7Days.appendChild(li);
  });

  // Render charts
  renderAnalyticsCharts(metrics);
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
    reachOutEnabled: rawContent?.reachOutEnabled !== false ? true : false,
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

function createIconPickerButton(currentIconClass, onIconSelect, usernameInput) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "social-icon-select";
  button.setAttribute("aria-label", "Select social icon");
  button.title = getIconOptionLabel(currentIconClass);

  const icon = document.createElement("i");
  icon.className = currentIconClass;
  button.appendChild(icon);

  button.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if popup already exists
    let popup = document.getElementById("icon-picker-popup");
    if (popup) {
      popup.remove();
      return;
    }

    popup = document.createElement("div");
    popup.id = "icon-picker-popup";
    popup.className = "icon-picker-popup";
    // Ensure solid background with inline styles
    try {
      const bgColor = getComputedStyle(document.documentElement).getPropertyValue("--panel-bg")?.trim();
      if (bgColor) {
        popup.style.backgroundColor = bgColor;
      } else {
        popup.style.backgroundColor = document.body.classList.contains("dark-mode") ? "rgba(255, 255, 255, 0.06)" : "#ffffff";
      }
    } catch (e) {
      popup.style.backgroundColor = document.body.classList.contains("dark-mode") ? "rgba(255, 255, 255, 0.06)" : "#ffffff";
    }
    popup.style.backdropFilter = "none";
    popup.style.WebkitBackdropFilter = "none";

    const grid = document.createElement("div");
    grid.className = "icon-picker-grid";

    SOCIAL_ICON_OPTIONS.forEach((optionData) => {
      const iconBtn = document.createElement("button");
      iconBtn.type = "button";
      iconBtn.className = "icon-picker-option";
      if (optionData.value === currentIconClass) {
        iconBtn.classList.add("active");
      }
      iconBtn.title = optionData.label;

      const iconEl = document.createElement("i");
      iconEl.className = optionData.value;
      iconBtn.appendChild(iconEl);

      iconBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        icon.className = optionData.value;
        button.title = optionData.label;
        
        // Clear username when icon changes (user will add their username)
        if (usernameInput) {
          usernameInput.value = "";
          usernameInput.focus();
        }
        
        onIconSelect(optionData.value);
        popup.remove();
      });

      grid.appendChild(iconBtn);
    });

    // Set background color for grid with safe fallback
    try {
      const gridBgColor = getComputedStyle(document.documentElement).getPropertyValue("--panel-bg")?.trim();
      if (gridBgColor) {
        grid.style.backgroundColor = gridBgColor;
      } else {
        grid.style.backgroundColor = document.body.classList.contains("dark-mode") ? "rgba(255, 255, 255, 0.06)" : "#ffffff";
      }
    } catch (e) {
      grid.style.backgroundColor = document.body.classList.contains("dark-mode") ? "rgba(255, 255, 255, 0.06)" : "#ffffff";
    }
    grid.style.backdropFilter = "none";
    grid.style.WebkitBackdropFilter = "none";
    
    popup.appendChild(grid);
    document.body.appendChild(popup);

    // Position popup near the button
    const rect = button.getBoundingClientRect();
    popup.style.left = rect.left + "px";
    popup.style.top = rect.bottom + 8 + "px";

    // Close popup when clicking outside
    setTimeout(() => {
      document.addEventListener("click", function closePopup() {
        if (popup) {
          popup.remove();
        }
        document.removeEventListener("click", closePopup);
      });
    }, 0);
  });

  return button;
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
      hasUnsavedChanges = true;
      updateSaveButtonsState();
    });

    const urlInput = document.createElement("input");
    urlInput.type = "url";
    urlInput.placeholder = "https://...";
    urlInput.value = link.url;
    urlInput.addEventListener("input", () => {
      editorState.links[index].url = urlInput.value;
      hasUnsavedChanges = true;
      updateSaveButtonsState();
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
      hasUnsavedChanges = true;
      updateSaveButtonsState();
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
      hasUnsavedChanges = true;
      updateSaveButtonsState();
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

    // Extract base URL and username from the full URL
    const baseUrl = SOCIAL_MEDIA_URLS[social.iconClass] || "https://";
    let username = social.url.replace(baseUrl, "");

    // Create wrapper for split input
    const urlWrapper = document.createElement("div");
    urlWrapper.className = "url-input-wrapper";

    // Create read-only base URL display
    const baseUrlDisplay = document.createElement("span");
    baseUrlDisplay.className = "url-base";
    baseUrlDisplay.textContent = baseUrl;
    baseUrlDisplay.title = "Platform URL (locked)";

    // Create editable username input
    const usernameInput = document.createElement("input");
    usernameInput.type = "text";
    usernameInput.className = "url-username";
    const placeholder = SOCIAL_MEDIA_PLACEHOLDERS[social.iconClass] || "username";
    usernameInput.placeholder = placeholder;
    usernameInput.value = username;
    usernameInput.addEventListener("input", () => {
      editorState.socials[index].url = baseUrl + usernameInput.value;
      hasUnsavedChanges = true;
      updateSaveButtonsState();
    });

    urlWrapper.appendChild(baseUrlDisplay);
    urlWrapper.appendChild(usernameInput);

    const iconButton = createIconPickerButton(social.iconClass, (selectedIcon) => {
      editorState.socials[index].iconClass = selectedIcon;
      // Update base URL display and reset username when icon changes
      const newBaseUrl = SOCIAL_MEDIA_URLS[selectedIcon] || "https://";
      const newPlaceholder = SOCIAL_MEDIA_PLACEHOLDERS[selectedIcon] || "username";
      baseUrlDisplay.textContent = newBaseUrl;
      usernameInput.placeholder = newPlaceholder;
      usernameInput.value = "";
      editorState.socials[index].url = newBaseUrl;
      hasUnsavedChanges = true;
      updateSaveButtonsState();
    }, usernameInput);

    const actions = document.createElement("div");
    actions.className = "editor-item-actions";
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", () => {
      editorState.socials.splice(index, 1);
      hasUnsavedChanges = true;
      updateSaveButtonsState();
      renderEditorList();
    });
    actions.appendChild(removeBtn);

    item.appendChild(iconButton);
    item.appendChild(urlWrapper);
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
  
  // Parse reach-out URL to extract email
  const mailToBase = "https://mail.google.com/mail/?view=cm&fs=1&to=";
  let email = "";
  if (content.reachOutUrl && content.reachOutUrl.startsWith(mailToBase)) {
    email = content.reachOutUrl.replace(mailToBase, "");
  }
  contentEditorForm.reachOutEmail.value = email;
  contentEditorForm.reachOutEnabled.checked = content.reachOutEnabled !== false;

  editorState.links = content.links.map((link) => ({ ...link }));
  editorState.socials = content.socials.map((social) => ({ ...social }));
  renderEditorList();
}

function readContentFromEditor() {
  const mailToBase = "https://mail.google.com/mail/?view=cm&fs=1&to=";
  const email = contentEditorForm.reachOutEmail.value.trim();
  const reachOutUrl = email ? mailToBase + email : "";
  
  return sanitizeSiteContent({
    profileImage: selectedProfileImage,
    userName: contentEditorForm.userName.value.trim(),
    description: contentEditorForm.description.value.trim(),
    reachOutText: contentEditorForm.reachOutText.value.trim(),
    reachOutUrl: reachOutUrl,
    reachOutEnabled: contentEditorForm.reachOutEnabled.checked,
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

  // Render charts with real data
  renderAnalyticsCharts(metrics);
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
    last7days: last7.map((dayKey) => ({ dayLabel: dayKey.slice(5), visits: dayCountMap[dayKey] || 0 })),
    referrersMap: referrers,
    devicesMap: devices
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
    setupRealtimeAnalyticsListener();
  } catch (error) {
    hasAnyError = true;
    console.error("Analytics load failed:", error);
    showMessage(`Analytics load failed: ${mapFirestoreError(error)}`, true);
  }

  // Show dashboard content after data is loaded
  showDashboardContent();
}

function setupRealtimeAnalyticsListener() {
  if (!db) return;

  // Listen to totals updates
  db.collection("publicMetrics")
    .doc("totals")
    .onSnapshot(
      () => {
        fetchRemoteDashboardMetrics()
          .then((metrics) => applyMetrics(metrics))
          .catch((error) => console.error("Real-time update failed:", error));
      },
      (error) => console.error("Listener error:", error)
    );

  // Listen to daily updates
  db.collection("publicMetrics")
    .doc("daily")
    .collection("days")
    .onSnapshot(
      () => {
        fetchRemoteDashboardMetrics()
          .then((metrics) => applyMetrics(metrics))
          .catch((error) => console.error("Real-time update failed:", error));
      },
      (error) => console.error("Listener error:", error)
    );
}

function showDashboard() {
  if (authPanel) {
    authPanel.hidden = true;
  }
  if (dashboardShell) {
    dashboardShell.hidden = true; // Hide initially while theme loads
  }
  // Show dashboard loading screen
  const dashboardLoadingScreen = document.getElementById("dashboard-loading-screen");
  if (dashboardLoadingScreen) {
    dashboardLoadingScreen.style.display = "flex";
  }
  loadThemeFromFirebase();
  initializeAnalyticsViewToggle();
}

function showDashboardContent() {
  if (dashboardShell) {
    dashboardShell.hidden = false;
  }
  // Hide dashboard loading screen
  const dashboardLoadingScreen = document.getElementById("dashboard-loading-screen");
  if (dashboardLoadingScreen) {
    dashboardLoadingScreen.style.opacity = "0";
    dashboardLoadingScreen.style.transition = "opacity 0.3s ease-out";
    setTimeout(() => {
      dashboardLoadingScreen.style.display = "none";
    }, 300);
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

// Track changes for reach-out email and enabled checkbox
document.getElementById("editor-reach-out-email")?.addEventListener("input", () => {
  hasUnsavedChanges = true;
  updateSaveButtonsState();
});

document.getElementById("editor-reach-out-enabled")?.addEventListener("change", () => {
  hasUnsavedChanges = true;
  updateSaveButtonsState();
});

// Track changes for main form fields
document.getElementById("editor-user-name")?.addEventListener("input", () => {
  hasUnsavedChanges = true;
  updateSaveButtonsState();
});

document.getElementById("editor-description")?.addEventListener("input", () => {
  hasUnsavedChanges = true;
  updateSaveButtonsState();
});

document.getElementById("editor-reach-out-text")?.addEventListener("input", () => {
  hasUnsavedChanges = true;
  updateSaveButtonsState();
});

document.getElementById("editor-profile-image")?.addEventListener("change", () => {
  hasUnsavedChanges = true;
  updateSaveButtonsState();
});

addLinkBtn.addEventListener("click", () => {
  editorState.links.push({ label: "New Link", url: "https://", shake: false });
  hasUnsavedChanges = true;
  updateSaveButtonsState();
  renderEditorList();
});

addSocialBtn.addEventListener("click", () => {
  const defaultIcon = "fa-brands fa-linkedin";
  const defaultUrl = SOCIAL_MEDIA_URLS[defaultIcon] || "https://";
  editorState.socials.push({ iconClass: defaultIcon, url: defaultUrl });
  hasUnsavedChanges = true;
  updateSaveButtonsState();
  renderEditorList();
});

contentEditorForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentUser) {
    const dashboardMsg = document.getElementById("dashboard-message");
    if (dashboardMsg) dashboardMsg.textContent = "Please login first.";
    if (dashboardMsg) dashboardMsg.style.color = "#ffb6b6";
    return;
  }

  try {
    await saveContent();
    const dashboardMsg = document.getElementById("dashboard-message");
    if (dashboardMsg) dashboardMsg.textContent = "Saved. Content updated.";
    if (dashboardMsg) dashboardMsg.style.color = "#f7e09b";
    resetUnsavedChanges();
  } catch (error) {
    console.error(error);
    const dashboardMsg = document.getElementById("dashboard-message");
    if (dashboardMsg) {
      dashboardMsg.textContent = `Save failed: ${mapFirestoreError(error)}`;
      dashboardMsg.style.color = "#ffb6b6";
    }
  }
});

saveLinksBtnElement?.addEventListener("click", async (event) => {
  event.preventDefault();
  if (!currentUser) {
    const mainLinksMsg = document.getElementById("main-links-message");
    if (mainLinksMsg) mainLinksMsg.textContent = "Please login first.";
    if (mainLinksMsg) mainLinksMsg.style.color = "#ffb6b6";
    return;
  }

  try {
    await saveContent();
    const mainLinksMsg = document.getElementById("main-links-message");
    if (mainLinksMsg) mainLinksMsg.textContent = "Saved. Links updated.";
    if (mainLinksMsg) mainLinksMsg.style.color = "#f7e09b";
    resetUnsavedChanges();
  } catch (error) {
    console.error(error);
    const mainLinksMsg = document.getElementById("main-links-message");
    if (mainLinksMsg) {
      mainLinksMsg.textContent = `Save failed: ${mapFirestoreError(error)}`;
      mainLinksMsg.style.color = "#ffb6b6";
    }
  }
});

saveSocialBtnElement?.addEventListener("click", async (event) => {
  event.preventDefault();
  if (!currentUser) {
    const socialLinksMsg = document.getElementById("social-links-message");
    if (socialLinksMsg) socialLinksMsg.textContent = "Please login first.";
    if (socialLinksMsg) socialLinksMsg.style.color = "#ffb6b6";
    return;
  }

  try {
    await saveContent();
    const socialLinksMsg = document.getElementById("social-links-message");
    if (socialLinksMsg) socialLinksMsg.textContent = "Saved. Social links updated.";
    if (socialLinksMsg) socialLinksMsg.style.color = "#f7e09b";
    resetUnsavedChanges();
  } catch (error) {
    console.error(error);
    const socialLinksMsg = document.getElementById("social-links-message");
    if (socialLinksMsg) {
      socialLinksMsg.textContent = `Save failed: ${mapFirestoreError(error)}`;
      socialLinksMsg.style.color = "#ffb6b6";
    }
  }
});

// Modal button listeners
btnUnsavedSave?.addEventListener("click", async () => {
  if (!currentUser) {
    hideUnsavedChangesModal();
    return;
  }

  try {
    await saveContent();
    resetUnsavedChanges();
    hideUnsavedChangesModal();

    // Now switch to the pending section
    if (pendingSectionSwitch) {
      const navItems = document.querySelectorAll(".nav-item");
      const contentSections = document.querySelectorAll(".content-section");
      const targetItem = Array.from(navItems).find(
        (item) => item.getAttribute("data-section") === pendingSectionSwitch
      );
      if (targetItem) {
        switchToSection(targetItem, navItems, contentSections);
      }
      pendingSectionSwitch = null;
    }
  } catch (error) {
    console.error(error);
  }
});

btnUnsavedDiscard?.addEventListener("click", () => {
  hasUnsavedChanges = false;
  updateSaveButtonsState();
  hideUnsavedChangesModal();

  // Now switch to the pending section
  if (pendingSectionSwitch) {
    const navItems = document.querySelectorAll(".nav-item");
    const contentSections = document.querySelectorAll(".content-section");
    const targetItem = Array.from(navItems).find(
      (item) => item.getAttribute("data-section") === pendingSectionSwitch
    );
    if (targetItem) {
      switchToSection(targetItem, navItems, contentSections);
    }
    pendingSectionSwitch = null;
  }
});

btnUnsavedCancel?.addEventListener("click", () => {
  hideUnsavedChangesModal();
  pendingSectionSwitch = null;
});

// Initialize save buttons as disabled
updateSaveButtonsState();

// Initialize dashboard features
try {
  initializeDashboardNavigation();
  initializeThemeToggle();
} catch (error) {
  console.error("Dashboard initialization error:", error);
}
