const storageKey = "jarvis-life-planner:v1";

const seedTasks = [
  {
    id: crypto.randomUUID(),
    title: "Review distributed systems notes",
    area: "Study",
    due: todayOffset(1),
    energy: "deep",
    impact: 5,
    effort: 1.5,
    status: "open",
    createdAt: new Date().toISOString()
  },
  {
    id: crypto.randomUUID(),
    title: "Update GitHub portfolio README",
    area: "Career",
    due: todayOffset(3),
    energy: "medium",
    impact: 4,
    effort: 1,
    status: "open",
    createdAt: new Date().toISOString()
  },
  {
    id: crypto.randomUUID(),
    title: "Plan weekly groceries and meals",
    area: "Life Admin",
    due: todayOffset(0),
    energy: "light",
    impact: 3,
    effort: 0.75,
    status: "open",
    createdAt: new Date().toISOString()
  }
];

let state = loadState();
let activeFilter = "open";
let focusTimer = null;
let focusRemaining = Number(state.settings.focusMinutes) * 60;
let focusTotal = focusRemaining;

const els = {
  greeting: document.querySelector("#greeting"),
  todayLabel: document.querySelector("#todayLabel"),
  assistantCommand: document.querySelector("#assistantCommand"),
  commandBtn: document.querySelector("#commandBtn"),
  voiceBtn: document.querySelector("#voiceBtn"),
  planBtn: document.querySelector("#planBtn"),
  clearPlanBtn: document.querySelector("#clearPlanBtn"),
  taskForm: document.querySelector("#taskForm"),
  taskTitle: document.querySelector("#taskTitle"),
  taskArea: document.querySelector("#taskArea"),
  taskDue: document.querySelector("#taskDue"),
  taskEnergy: document.querySelector("#taskEnergy"),
  taskImpact: document.querySelector("#taskImpact"),
  taskEffort: document.querySelector("#taskEffort"),
  taskList: document.querySelector("#taskList"),
  taskTemplate: document.querySelector("#taskTemplate"),
  timeline: document.querySelector("#timeline"),
  insights: document.querySelector("#insights"),
  sortMode: document.querySelector("#sortMode"),
  metricOpen: document.querySelector("#metricOpen"),
  metricPlanned: document.querySelector("#metricPlanned"),
  metricDone: document.querySelector("#metricDone"),
  dayStart: document.querySelector("#dayStart"),
  dayEnd: document.querySelector("#dayEnd"),
  focusMinutes: document.querySelector("#focusMinutes"),
  focusTitle: document.querySelector("#focusTitle"),
  focusTime: document.querySelector("#focusTime"),
  focusCanvas: document.querySelector("#focusCanvas"),
  startFocusBtn: document.querySelector("#startFocusBtn"),
  pauseFocusBtn: document.querySelector("#pauseFocusBtn"),
  finishFocusBtn: document.querySelector("#finishFocusBtn"),
  exportBtn: document.querySelector("#exportBtn"),
  importBtn: document.querySelector("#importBtn"),
  importFile: document.querySelector("#importFile"),
  resetBtn: document.querySelector("#resetBtn")
};

function todayOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function loadState() {
  const fallback = {
    tasks: seedTasks,
    plan: [],
    settings: {
      dayStart: "09:00",
      dayEnd: "18:00",
      focusMinutes: 45
    }
  };

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    return saved ? { ...fallback, ...saved, settings: { ...fallback.settings, ...saved.settings } } : fallback;
  } catch {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function minutesFromTime(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function timeFromMinutes(total) {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatDate(value) {
  if (!value) return "No due date";
  const date = new Date(`${value}T12:00:00`);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function scoreTask(task) {
  const today = new Date(`${todayOffset(0)}T12:00:00`);
  const dueDate = task.due ? new Date(`${task.due}T12:00:00`) : null;
  const daysUntilDue = dueDate ? Math.ceil((dueDate - today) / 86400000) : 14;
  const urgency = Math.max(0, 12 - daysUntilDue) * 2;
  const impact = Number(task.impact) * 7;
  const effortFit = Math.max(0, 8 - Number(task.effort)) * 1.4;
  const energyFit = task.energy === "deep" ? 4 : task.energy === "medium" ? 3 : 2;
  return Math.round(urgency + impact + effortFit + energyFit);
}

function sortedTasks(tasks = state.tasks) {
  const mode = els.sortMode.value;
  return [...tasks].sort((a, b) => {
    if (mode === "due") return String(a.due || "9999").localeCompare(String(b.due || "9999"));
    if (mode === "impact") return Number(b.impact) - Number(a.impact);
    if (mode === "effort") return Number(a.effort) - Number(b.effort);
    return scoreTask(b) - scoreTask(a);
  });
}

function addTask(task) {
  state.tasks.unshift({
    id: crypto.randomUUID(),
    title: task.title.trim(),
    area: task.area || "Life Admin",
    due: task.due || "",
    energy: task.energy || "medium",
    impact: Number(task.impact || 3),
    effort: Number(task.effort || 1),
    status: "open",
    createdAt: new Date().toISOString()
  });
  saveState();
  render();
}

function parseCommand(text) {
  const clean = text.trim();
  if (!clean) return null;

  const lower = clean.toLowerCase();
  const effortMatch = lower.match(/(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours)/);
  const due = lower.includes("tomorrow")
    ? todayOffset(1)
    : lower.includes("today")
      ? todayOffset(0)
      : lower.includes("next week")
        ? todayOffset(7)
        : "";
  const energy = lower.includes("deep") || lower.includes("hard")
    ? "deep"
    : lower.includes("light") || lower.includes("easy")
      ? "light"
      : "medium";
  const impact = lower.includes("high impact") || lower.includes("important")
    ? 5
    : lower.includes("low impact")
      ? 2
      : 3;

  const area = ["study", "career", "health", "creative"].find((item) => lower.includes(item));
  const title = clean
    .replace(/^add\s+/i, "")
    .replace(/\b(today|tomorrow|next week)\b/gi, "")
    .replace(/\d+(?:\.\d+)?\s*(h|hr|hrs|hour|hours)/gi, "")
    .replace(/\b(high impact|low impact|important|deep|light|hard|easy)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return {
    title: title || clean,
    area: area ? area[0].toUpperCase() + area.slice(1) : "Life Admin",
    due,
    energy,
    impact,
    effort: effortMatch ? Number(effortMatch[1]) : 1
  };
}

function generatePlan(singleTaskId = null) {
  const start = minutesFromTime(state.settings.dayStart);
  const end = minutesFromTime(state.settings.dayEnd);
  let cursor = start;
  const candidates = sortedTasks(
    state.tasks.filter((task) => task.status !== "done" && (!singleTaskId || task.id === singleTaskId))
  );
  const newBlocks = [];

  for (const task of candidates) {
    const duration = Math.max(15, Math.round(Number(task.effort) * 60));
    if (cursor + duration > end) break;
    newBlocks.push({
      id: crypto.randomUUID(),
      taskId: task.id,
      title: task.title,
      area: task.area,
      energy: task.energy,
      start: timeFromMinutes(cursor),
      end: timeFromMinutes(cursor + duration)
    });
    cursor += duration + 10;
  }

  state.plan = singleTaskId ? [...state.plan, ...newBlocks] : newBlocks;
  saveState();
  render();
}

function renderTasks() {
  const filtered = sortedTasks().filter((task) => {
    if (activeFilter === "planned") return state.plan.some((block) => block.taskId === task.id) && task.status !== "done";
    return task.status === activeFilter;
  });

  els.taskList.innerHTML = "";
  if (!filtered.length) {
    els.taskList.innerHTML = `<div class="empty-state">No ${activeFilter} tasks</div>`;
    return;
  }

  for (const task of filtered) {
    const node = els.taskTemplate.content.firstElementChild.cloneNode(true);
    node.classList.toggle("done", task.status === "done");
    node.querySelector("h4").textContent = task.title;
    node.querySelector("p").textContent = `${task.area} | ${formatDate(task.due)} | Score ${scoreTask(task)}`;
    node.querySelector(".task-meta").innerHTML = [
      `<span class="pill">${task.energy}</span>`,
      `<span class="pill">${task.effort}h</span>`,
      `<span class="pill">Impact ${task.impact}</span>`
    ].join("");
    node.querySelector(".check-button").addEventListener("click", () => {
      task.status = task.status === "done" ? "open" : "done";
      saveState();
      render();
    });
    node.querySelector(".plan-one").addEventListener("click", () => generatePlan(task.id));
    node.querySelector(".delete-one").addEventListener("click", () => {
      state.tasks = state.tasks.filter((item) => item.id !== task.id);
      state.plan = state.plan.filter((block) => block.taskId !== task.id);
      saveState();
      render();
    });
    els.taskList.append(node);
  }
}

function renderTimeline() {
  els.timeline.innerHTML = "";
  if (!state.plan.length) {
    els.timeline.innerHTML = `<div class="empty-state">Your plan is clear</div>`;
    return;
  }

  for (const block of state.plan) {
    const item = document.createElement("article");
    item.className = "time-block";
    item.innerHTML = `
      <time>${block.start}<br>${block.end}</time>
      <div class="time-card ${block.energy}">
        <h4>${escapeHtml(block.title)}</h4>
        <p>${escapeHtml(block.area)} | ${escapeHtml(block.energy)} work</p>
      </div>
    `;
    els.timeline.append(item);
  }
}

function renderInsights() {
  const open = state.tasks.filter((task) => task.status !== "done");
  const overdue = open.filter((task) => task.due && task.due < todayOffset(0));
  const deepHours = open.filter((task) => task.energy === "deep").reduce((sum, task) => sum + Number(task.effort), 0);
  const top = sortedTasks(open)[0];
  const plannedHours = state.plan.reduce((sum, block) => {
    return sum + (minutesFromTime(block.end) - minutesFromTime(block.start)) / 60;
  }, 0);

  const insights = [
    {
      title: top ? "Next move" : "Next move",
      body: top ? `${top.title} has the strongest urgency and impact signal.` : "Add one task to begin."
    },
    {
      title: "Load",
      body: `${open.length} open tasks, ${plannedHours.toFixed(1)} hours scheduled today.`
    },
    {
      title: overdue.length ? "Attention" : "Balance",
      body: overdue.length ? `${overdue.length} task${overdue.length > 1 ? "s are" : " is"} overdue.` : `${deepHours.toFixed(1)} hours of deep work in the backlog.`
    }
  ];

  els.insights.innerHTML = insights
    .map((item) => `<div class="insight"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.body)}</span></div>`)
    .join("");
}

function renderMetrics() {
  const open = state.tasks.filter((task) => task.status !== "done").length;
  const done = state.tasks.filter((task) => task.status === "done").length;
  const total = state.tasks.length || 1;
  const plannedHours = state.plan.reduce((sum, block) => {
    return sum + (minutesFromTime(block.end) - minutesFromTime(block.start)) / 60;
  }, 0);

  els.metricOpen.textContent = open;
  els.metricPlanned.textContent = `${plannedHours.toFixed(1)}h`;
  els.metricDone.textContent = `${Math.round((done / total) * 100)}%`;
}

function renderFocus() {
  const minutes = Math.floor(focusRemaining / 60);
  const seconds = focusRemaining % 60;
  els.focusTime.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  drawFocus();
}

function drawFocus() {
  const canvas = els.focusCanvas;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const progress = focusTotal ? 1 - focusRemaining / focusTotal : 0;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#152c2e";
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 42; i += 1) {
    const x = (i * 47 + Date.now() / 90) % width;
    const y = 24 + Math.sin(i + Date.now() / 700) * 24 + (i % 5) * 22;
    ctx.fillStyle = i % 2 ? "rgba(212,155,42,0.35)" : "rgba(217,93,57,0.28)";
    ctx.fillRect(x, y, 3, 3);
  }

  ctx.strokeStyle = "#d49b2a";
  ctx.lineWidth = 12;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, 48, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#f8f2e7";
  ctx.font = "800 26px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(`${Math.round(progress * 100)}%`, width / 2, height / 2 + 9);
}

function render() {
  const now = new Date();
  els.todayLabel.textContent = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  els.greeting.textContent = `${getGreeting()}, Amandeep`;
  els.dayStart.value = state.settings.dayStart;
  els.dayEnd.value = state.settings.dayEnd;
  els.focusMinutes.value = state.settings.focusMinutes;
  renderTasks();
  renderTimeline();
  renderInsights();
  renderMetrics();
  renderFocus();
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return map[char];
  });
}

els.taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addTask({
    title: els.taskTitle.value,
    area: els.taskArea.value,
    due: els.taskDue.value,
    energy: els.taskEnergy.value,
    impact: els.taskImpact.value,
    effort: els.taskEffort.value
  });
  els.taskForm.reset();
  els.taskImpact.value = 3;
  els.taskEffort.value = 1;
});

els.commandBtn.addEventListener("click", () => {
  const parsed = parseCommand(els.assistantCommand.value);
  if (parsed) {
    addTask(parsed);
    els.assistantCommand.value = "";
  }
});

els.assistantCommand.addEventListener("keydown", (event) => {
  if (event.key === "Enter") els.commandBtn.click();
});

els.planBtn.addEventListener("click", () => generatePlan());
els.clearPlanBtn.addEventListener("click", () => {
  state.plan = [];
  saveState();
  render();
});

document.querySelectorAll(".segment").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".segment").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    activeFilter = button.dataset.filter;
    renderTasks();
  });
});

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    document.querySelector(`[data-panel="${button.dataset.view}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

els.sortMode.addEventListener("change", renderTasks);

[els.dayStart, els.dayEnd, els.focusMinutes].forEach((input) => {
  input.addEventListener("change", () => {
    state.settings.dayStart = els.dayStart.value;
    state.settings.dayEnd = els.dayEnd.value;
    state.settings.focusMinutes = Number(els.focusMinutes.value);
    focusRemaining = state.settings.focusMinutes * 60;
    focusTotal = focusRemaining;
    saveState();
    render();
  });
});

els.startFocusBtn.addEventListener("click", () => {
  if (focusTimer) return;
  els.focusTitle.textContent = "In focus";
  focusTimer = setInterval(() => {
    focusRemaining = Math.max(0, focusRemaining - 1);
    renderFocus();
    if (focusRemaining === 0) {
      clearInterval(focusTimer);
      focusTimer = null;
      els.focusTitle.textContent = "Complete";
    }
  }, 1000);
});

els.pauseFocusBtn.addEventListener("click", () => {
  clearInterval(focusTimer);
  focusTimer = null;
  els.focusTitle.textContent = "Paused";
});

els.finishFocusBtn.addEventListener("click", () => {
  clearInterval(focusTimer);
  focusTimer = null;
  focusRemaining = Number(state.settings.focusMinutes) * 60;
  focusTotal = focusRemaining;
  els.focusTitle.textContent = "Ready";
  renderFocus();
});

els.exportBtn.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `jarvis-planner-${todayOffset(0)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
});

els.importBtn.addEventListener("click", () => els.importFile.click());
els.importFile.addEventListener("change", async () => {
  const file = els.importFile.files[0];
  if (!file) return;
  const imported = JSON.parse(await file.text());
  state = { ...state, ...imported, settings: { ...state.settings, ...imported.settings } };
  saveState();
  render();
});

els.resetBtn.addEventListener("click", () => {
  state = {
    tasks: seedTasks.map((task) => ({ ...task, id: crypto.randomUUID() })),
    plan: [],
    settings: {
      dayStart: "09:00",
      dayEnd: "18:00",
      focusMinutes: 45
    }
  };
  saveState();
  render();
});

els.voiceBtn.addEventListener("click", () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    els.assistantCommand.value = "Voice input is not supported in this browser";
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.onresult = (event) => {
    els.assistantCommand.value = event.results[0][0].transcript;
  };
  recognition.start();
});

setInterval(drawFocus, 1000 / 24);
render();
