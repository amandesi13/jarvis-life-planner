const storageKey = "jarvis-life-planner:v2";
const oldStorageKey = "jarvis-life-planner:v1";

const dresden = {
  latitude: 51.0504,
  longitude: 13.7373,
  timezone: "Europe/Berlin"
};

const studyModes = [
  {
    id: "deep",
    name: "Deep Work",
    minutes: 50,
    breakMinutes: 10,
    energy: "deep",
    impact: 5,
    prompt: "One demanding concept, no context switching.",
    task: "Deep study block"
  },
  {
    id: "exam",
    name: "Exam Sprint",
    minutes: 35,
    breakMinutes: 7,
    energy: "deep",
    impact: 5,
    prompt: "Past-paper style practice with quick correction.",
    task: "Exam sprint practice"
  },
  {
    id: "review",
    name: "Review Loop",
    minutes: 25,
    breakMinutes: 5,
    energy: "medium",
    impact: 4,
    prompt: "Recall, check, fix gaps, repeat.",
    task: "Active recall review"
  },
  {
    id: "reading",
    name: "Reading Lab",
    minutes: 30,
    breakMinutes: 5,
    energy: "light",
    impact: 3,
    prompt: "Read with notes and extract three takeaways.",
    task: "Reading notes"
  },
  {
    id: "flash",
    name: "Flashcards",
    minutes: 18,
    breakMinutes: 4,
    energy: "light",
    impact: 3,
    prompt: "Fast spaced repetition for memory maintenance.",
    task: "Flashcard review"
  }
];

const updateSources = [
  {
    name: "DNN Dresden",
    type: "news",
    url: "https://www.dnn.de/arc/outboundfeeds/rss/tags_slug/dresden/",
    home: "https://www.dnn.de/lokales/dresden/"
  },
  {
    name: "Studentenwerk Dresden",
    type: "student",
    url: "https://www.studentenwerk-dresden.de/feeds/news.rss",
    home: "https://www.studentenwerk-dresden.de/feeds/"
  },
  {
    name: "Mensa Dresden",
    type: "mensa",
    url: "https://www.studentenwerk-dresden.de/feeds/speiseplan.rss",
    home: "https://www.studentenwerk-dresden.de/mensen/speiseplan/"
  }
];

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

const seedGroceries = [
  { id: crypto.randomUUID(), name: "Oats", category: "Pantry", checked: false },
  { id: crypto.randomUUID(), name: "Eggs", category: "Protein", checked: false },
  { id: crypto.randomUUID(), name: "Apples", category: "Produce", checked: false },
  { id: crypto.randomUUID(), name: "Milk", category: "Dairy", checked: false }
];

let state = loadState();
let activeFilter = "open";
let weatherState = null;
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
  refreshUpdatesBtn: document.querySelector("#refreshUpdatesBtn"),
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
  resetBtn: document.querySelector("#resetBtn"),
  weatherTemp: document.querySelector("#weatherTemp"),
  weatherSummary: document.querySelector("#weatherSummary"),
  weatherIcon: document.querySelector("#weatherIcon"),
  studyReadiness: document.querySelector("#studyReadiness"),
  studyReadinessText: document.querySelector("#studyReadinessText"),
  lifeQueue: document.querySelector("#lifeQueue"),
  lifeQueueText: document.querySelector("#lifeQueueText"),
  studyModes: document.querySelector("#studyModes"),
  quickStudyBtn: document.querySelector("#quickStudyBtn"),
  activeStudyMode: document.querySelector("#activeStudyMode"),
  activeStudyText: document.querySelector("#activeStudyText"),
  studyBlockMinutes: document.querySelector("#studyBlockMinutes"),
  studyBreakMinutes: document.querySelector("#studyBreakMinutes"),
  groceryForm: document.querySelector("#groceryForm"),
  groceryName: document.querySelector("#groceryName"),
  groceryCategory: document.querySelector("#groceryCategory"),
  grocerySuggestions: document.querySelector("#grocerySuggestions"),
  groceryList: document.querySelector("#groceryList"),
  seedGroceriesBtn: document.querySelector("#seedGroceriesBtn"),
  updatesList: document.querySelector("#updatesList"),
  openSourcesBtn: document.querySelector("#openSourcesBtn")
};

function todayOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function defaultState() {
  return {
    tasks: seedTasks.map((task) => ({ ...task, id: crypto.randomUUID() })),
    groceries: seedGroceries.map((item) => ({ ...item, id: crypto.randomUUID() })),
    plan: [],
    updates: [],
    weather: null,
    settings: {
      dayStart: "09:00",
      dayEnd: "18:00",
      focusMinutes: 45,
      activeStudyMode: "deep"
    }
  };
}

function loadState() {
  const fallback = defaultState();
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || localStorage.getItem(oldStorageKey));
    if (!saved) return fallback;
    return {
      ...fallback,
      ...saved,
      groceries: saved.groceries || fallback.groceries,
      updates: saved.updates || [],
      weather: saved.weather || null,
      settings: { ...fallback.settings, ...saved.settings }
    };
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
  const title = task.title.trim();
  if (!title) return;
  state.tasks.unshift({
    id: crypto.randomUUID(),
    title,
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
  if (lower.startsWith("buy ") || lower.startsWith("grocery ")) {
    const name = clean.replace(/^(buy|grocery)\s+/i, "").trim();
    addGrocery(name, guessGroceryCategory(name));
    return null;
  }

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

  const areaMatch = ["study", "career", "health", "creative", "grocery"].find((item) => lower.includes(item));
  const title = clean
    .replace(/^add\s+/i, "")
    .replace(/\b(today|tomorrow|next week)\b/gi, "")
    .replace(/\d+(?:\.\d+)?\s*(h|hr|hrs|hour|hours)/gi, "")
    .replace(/\b(high impact|low impact|important|deep|light|hard|easy)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return {
    title: title || clean,
    area: areaMatch ? titleCase(areaMatch) : "Life Admin",
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

function selectStudyMode(modeId) {
  const mode = studyModes.find((item) => item.id === modeId) || studyModes[0];
  state.settings.activeStudyMode = mode.id;
  state.settings.focusMinutes = mode.minutes;
  focusRemaining = mode.minutes * 60;
  focusTotal = focusRemaining;
  saveState();
  render();
}

function createStudyTask(modeId = state.settings.activeStudyMode) {
  const mode = studyModes.find((item) => item.id === modeId) || studyModes[0];
  addTask({
    title: mode.task,
    area: "Study",
    due: todayOffset(0),
    energy: mode.energy,
    impact: mode.impact,
    effort: mode.minutes / 60
  });
}

function renderStudyModes() {
  const active = state.settings.activeStudyMode;
  const selected = studyModes.find((mode) => mode.id === active) || studyModes[0];
  els.studyModes.innerHTML = "";

  for (const mode of studyModes) {
    const button = document.createElement("button");
    button.className = `study-mode ${mode.id === active ? "active" : ""}`;
    button.type = "button";
    button.innerHTML = `
      <strong>${escapeHtml(mode.name)}</strong>
      <span>${mode.minutes}/${mode.breakMinutes} min</span>
      <small>${escapeHtml(mode.prompt)}</small>
    `;
    button.addEventListener("click", () => selectStudyMode(mode.id));
    els.studyModes.append(button);
  }

  els.activeStudyMode.textContent = selected.name;
  els.activeStudyText.textContent = selected.prompt;
  els.studyBlockMinutes.textContent = selected.minutes;
  els.studyBreakMinutes.textContent = selected.breakMinutes;
}

function addGrocery(name, category = "Pantry") {
  const clean = name.trim();
  if (!clean) return;
  state.groceries.unshift({
    id: crypto.randomUUID(),
    name: clean,
    category,
    checked: false
  });
  saveState();
  render();
}

function guessGroceryCategory(name) {
  const lower = name.toLowerCase();
  if (/(apple|banana|tomato|salad|onion|potato|berries|fruit|veg)/.test(lower)) return "Produce";
  if (/(egg|chicken|tofu|fish|beans|lentils|protein)/.test(lower)) return "Protein";
  if (/(milk|yogurt|cheese|butter)/.test(lower)) return "Dairy";
  if (/(soap|paper|detergent|trash|clean)/.test(lower)) return "Household";
  if (/(chips|chocolate|nuts|snack)/.test(lower)) return "Snacks";
  return "Pantry";
}

function renderGroceries() {
  const pending = state.groceries.filter((item) => !item.checked);
  els.groceryList.innerHTML = "";

  if (!state.groceries.length) {
    els.groceryList.innerHTML = `<div class="empty-state">No groceries yet</div>`;
  } else {
    const grouped = groupBy(state.groceries, "category");
    for (const [category, items] of Object.entries(grouped)) {
      const section = document.createElement("section");
      section.className = "grocery-group";
      section.innerHTML = `<h4>${escapeHtml(category)}</h4>`;
      for (const item of items) {
        const row = document.createElement("div");
        row.className = `grocery-item ${item.checked ? "checked" : ""}`;
        row.innerHTML = `
          <button class="check-button" type="button" aria-label="Toggle ${escapeHtml(item.name)}"></button>
          <span>${escapeHtml(item.name)}</span>
          <button class="mini-button" type="button">Delete</button>
        `;
        row.querySelector(".check-button").addEventListener("click", () => {
          item.checked = !item.checked;
          saveState();
          render();
        });
        row.querySelector(".mini-button").addEventListener("click", () => {
          state.groceries = state.groceries.filter((grocery) => grocery.id !== item.id);
          saveState();
          render();
        });
        section.append(row);
      }
      els.groceryList.append(section);
    }
  }

  const suggestions = grocerySuggestions();
  els.grocerySuggestions.innerHTML = suggestions
    .map((item) => `<button class="suggestion" type="button" data-name="${escapeHtml(item)}">${escapeHtml(item)}</button>`)
    .join("");
  els.grocerySuggestions.querySelectorAll(".suggestion").forEach((button) => {
    button.addEventListener("click", () => addGrocery(button.dataset.name, guessGroceryCategory(button.dataset.name)));
  });

  els.lifeQueue.textContent = `${pending.length} item${pending.length === 1 ? "" : "s"}`;
  els.lifeQueueText.textContent = pending.length
    ? `${pending.slice(0, 3).map((item) => item.name).join(", ")}${pending.length > 3 ? "..." : ""}`
    : "Grocery list is clear.";
}

function grocerySuggestions() {
  const suggestions = ["Rice", "Spinach", "Bananas", "Yogurt"];
  const temp = weatherState?.current?.temperature_2m;
  const rain = weatherState?.daily?.precipitation_sum?.[0] || 0;
  if (typeof temp === "number" && temp >= 25) suggestions.unshift("Mineral water", "Fruit");
  if (typeof temp === "number" && temp <= 8) suggestions.unshift("Soup vegetables", "Tea");
  if (rain > 2) suggestions.unshift("Umbrella check");
  const existing = new Set(state.groceries.map((item) => item.name.toLowerCase()));
  return suggestions.filter((item) => !existing.has(item.toLowerCase())).slice(0, 5);
}

async function loadWeather() {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: dresden.latitude,
    longitude: dresden.longitude,
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum",
    timezone: dresden.timezone
  });

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Weather unavailable");
    weatherState = await response.json();
    state.weather = { data: weatherState, fetchedAt: new Date().toISOString() };
    saveState();
  } catch {
    weatherState = state.weather?.data || null;
  }
  renderWeather();
  renderGroceries();
  renderInsights();
}

function renderWeather() {
  if (!weatherState?.current) {
    els.weatherTemp.textContent = "Offline";
    els.weatherSummary.textContent = "Weather will appear when the connection is available.";
    els.weatherIcon.textContent = "--";
    return;
  }

  const current = weatherState.current;
  const daily = weatherState.daily || {};
  const code = current.weather_code;
  const rain = daily.precipitation_sum?.[0] || 0;
  const high = Math.round(daily.temperature_2m_max?.[0] ?? current.temperature_2m);
  const low = Math.round(daily.temperature_2m_min?.[0] ?? current.temperature_2m);
  els.weatherTemp.textContent = `${Math.round(current.temperature_2m)} C`;
  els.weatherIcon.textContent = weatherSymbol(code);
  els.weatherSummary.textContent = `${weatherLabel(code)}. Feels ${Math.round(current.apparent_temperature)} C, high ${high} C, low ${low} C, rain ${rain} mm.`;
}

async function loadUpdates() {
  els.updatesList.innerHTML = `<div class="empty-state">Refreshing Dresden updates</div>`;
  const feedResults = await Promise.all(updateSources.map((source) => fetchRss(source)));
  const results = feedResults.flat();

  const merged = results
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 8);

  state.updates = merged.length ? merged : fallbackUpdates();
  saveState();
  renderUpdates();
}

async function fetchRss(source) {
  const urls = [
    source.url,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(source.url)}`
  ];

  const jsonItems = await fetchRssJson(source);
  if (jsonItems.length) return jsonItems;

  for (const url of urls) {
    try {
      const response = await fetchWithTimeout(url, 2500);
      if (!response.ok) continue;
      const xml = await response.text();
      const doc = new DOMParser().parseFromString(xml, "application/xml");
      const parseError = doc.querySelector("parsererror");
      if (parseError) continue;
      return [...doc.querySelectorAll("item")].slice(0, 4).map((item) => ({
        source: source.name,
        type: source.type,
        title: textOf(item, "title"),
        link: textOf(item, "link") || source.home,
        date: textOf(item, "pubDate"),
        summary: stripHtml(textOf(item, "description")).slice(0, 160)
      })).filter((item) => item.title);
    } catch {
      continue;
    }
  }

  return [];
}

async function fetchRssJson(source) {
  const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(source.url)}`;
  try {
    const response = await fetchWithTimeout(url, 4500);
    if (!response.ok) return [];
    const data = await response.json();
    if (data.status !== "ok" || !Array.isArray(data.items)) return [];
    return data.items.slice(0, 4).map((item) => ({
      source: source.name,
      type: source.type,
      title: item.title || "",
      link: item.link || source.home,
      date: item.pubDate || item.pubdate || item.date,
      summary: stripHtml(item.description || item.content || "").slice(0, 160)
    })).filter((item) => item.title);
  } catch {
    return [];
  }
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function fallbackUpdates() {
  return updateSources.map((source) => ({
    source: source.name,
    type: source.type,
    title: `${source.name} updates`,
    link: source.home,
    date: new Date().toISOString(),
    summary: "Live feed could not be loaded from this browser. Open the source for the latest Dresden information."
  }));
}

function renderUpdates() {
  const updates = state.updates?.length ? state.updates : fallbackUpdates();
  els.updatesList.innerHTML = updates.map((item) => `
    <article class="update-item">
      <div>
        <span class="pill">${escapeHtml(item.source)}</span>
        <span class="update-date">${escapeHtml(formatUpdateDate(item.date))}</span>
      </div>
      <h4>${escapeHtml(item.title)}</h4>
      <p>${escapeHtml(item.summary || "Open source for details.")}</p>
      <a href="${escapeHtml(item.link)}" target="_blank" rel="noreferrer">Open</a>
    </article>
  `).join("");
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
  const study = open.filter((task) => task.area === "Study");
  const overdue = open.filter((task) => task.due && task.due < todayOffset(0));
  const top = sortedTasks(open)[0];
  const rain = weatherState?.daily?.precipitation_sum?.[0] || 0;
  const plannedHours = state.plan.reduce((sum, block) => {
    return sum + (minutesFromTime(block.end) - minutesFromTime(block.start)) / 60;
  }, 0);

  const insights = [
    {
      title: top ? "Next move" : "Next move",
      body: top ? `${top.title} has the strongest urgency and impact signal.` : "Add one task to begin."
    },
    {
      title: "Study rhythm",
      body: study.length ? `${study.length} study task${study.length === 1 ? "" : "s"} ready. Use ${activeStudyMode().name} for the next block.` : "Add a study target, then pick a mode."
    },
    {
      title: overdue.length ? "Attention" : rain > 2 ? "Dresden check" : "Load",
      body: overdue.length
        ? `${overdue.length} task${overdue.length > 1 ? "s are" : " is"} overdue.`
        : rain > 2
          ? "Rain is likely today. Keep outside errands grouped."
          : `${open.length} open tasks, ${plannedHours.toFixed(1)} hours scheduled.`
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

function renderReadiness() {
  const studyOpen = state.tasks.filter((task) => task.area === "Study" && task.status !== "done");
  const deepHours = studyOpen.filter((task) => task.energy === "deep").reduce((sum, task) => sum + Number(task.effort), 0);
  const mode = activeStudyMode();
  const label = studyOpen.length ? `${mode.name} ready` : "Add study target";
  els.studyReadiness.textContent = label;
  els.studyReadinessText.textContent = studyOpen.length
    ? `${studyOpen.length} study task${studyOpen.length === 1 ? "" : "s"}, ${deepHours.toFixed(1)}h deep work.`
    : "Use Quick Study to create a focused block.";
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
  renderStudyModes();
  renderTasks();
  renderTimeline();
  renderGroceries();
  renderUpdates();
  renderInsights();
  renderReadiness();
  renderMetrics();
  renderFocus();
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function activeStudyMode() {
  return studyModes.find((mode) => mode.id === state.settings.activeStudyMode) || studyModes[0];
}

function weatherLabel(code) {
  if ([0].includes(code)) return "Clear";
  if ([1, 2, 3].includes(code)) return "Cloud mix";
  if ([45, 48].includes(code)) return "Fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Variable";
}

function weatherSymbol(code) {
  if ([0].includes(code)) return "SUN";
  if ([1, 2, 3].includes(code)) return "CLD";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "RAIN";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "SNOW";
  if ([95, 96, 99].includes(code)) return "STRM";
  return "WX";
}

function textOf(node, selector) {
  return node.querySelector(selector)?.textContent?.trim() || "";
}

function stripHtml(value) {
  const doc = new DOMParser().parseFromString(value, "text/html");
  return doc.body.textContent?.replace(/\s+/g, " ").trim() || "";
}

function groupBy(items, key) {
  return items.reduce((groups, item) => {
    const value = item[key] || "Other";
    groups[value] = groups[value] || [];
    groups[value].push(item);
    return groups;
  }, {});
}

function titleCase(value) {
  return value.split(" ").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");
}

function formatUpdateDate(value) {
  if (!value) return "Today";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Today";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
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

els.groceryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addGrocery(els.groceryName.value, els.groceryCategory.value);
  els.groceryForm.reset();
});

els.commandBtn.addEventListener("click", () => {
  const parsed = parseCommand(els.assistantCommand.value);
  if (parsed) addTask(parsed);
  els.assistantCommand.value = "";
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
els.quickStudyBtn.addEventListener("click", () => createStudyTask());
els.refreshUpdatesBtn.addEventListener("click", () => {
  loadWeather();
  loadUpdates();
});
els.openSourcesBtn.addEventListener("click", () => {
  window.open("https://www.studentenwerk-dresden.de/feeds/", "_blank", "noreferrer");
});
els.seedGroceriesBtn.addEventListener("click", () => {
  ["Pasta", "Tomatoes", "Tofu", "Coffee", "Dish soap"].forEach((name) => addGrocery(name, guessGroceryCategory(name)));
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
  els.focusTitle.textContent = `In focus: ${activeStudyMode().name}`;
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
  state = defaultState();
  weatherState = null;
  saveState();
  render();
  loadWeather();
  loadUpdates();
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

weatherState = state.weather?.data || null;
setInterval(drawFocus, 1000 / 24);
render();
loadWeather();
loadUpdates();
