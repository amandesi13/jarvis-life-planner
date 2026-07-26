const storageKey = "jarvis-life-planner:v4";
const previousStorageKeys = ["jarvis-life-planner:v3", "jarvis-life-planner:v2", "jarvis-life-planner:v1"];
const fireTargetMinutes = 120;

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
    prompt: "Master one hard topic and leave proof.",
    rule: "Phone away. One subject. Notes closed for the final 10 minutes.",
    output: "Write a 5-line summary, 3 weak points, and 1 next question.",
    task: "Deep study block"
  },
  {
    id: "exam",
    name: "Exam Sprint",
    minutes: 35,
    breakMinutes: 7,
    energy: "deep",
    impact: 5,
    prompt: "Practice under exam pressure.",
    rule: "Attempt first, check later. Mark every mistake by reason.",
    output: "Finish one problem set and list corrections to revise tomorrow.",
    task: "Exam sprint practice"
  },
  {
    id: "review",
    name: "Review Loop",
    minutes: 25,
    breakMinutes: 5,
    energy: "medium",
    impact: 4,
    prompt: "Close gaps with active recall.",
    rule: "Recall before reading. Check only after committing an answer.",
    output: "Create or update flashcards for every missed point.",
    task: "Active recall review"
  },
  {
    id: "reading",
    name: "Reading Lab",
    minutes: 30,
    breakMinutes: 5,
    energy: "light",
    impact: 3,
    prompt: "Read slowly, extract useful notes.",
    rule: "No highlighting-only studying. Convert paragraphs into questions.",
    output: "Capture 3 takeaways and 2 questions for the next session.",
    task: "Reading notes"
  },
  {
    id: "flash",
    name: "Flashcards",
    minutes: 18,
    breakMinutes: 4,
    energy: "light",
    impact: 3,
    prompt: "Fast memory maintenance.",
    rule: "Answer out loud before revealing. Repeat wrong cards once.",
    output: "Tag every weak deck and schedule the next review.",
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
  { id: crypto.randomUUID(), name: "Coffee", category: "Pantry", checked: false },
  { id: crypto.randomUUID(), name: "Eggs", category: "Protein", checked: false },
  { id: crypto.randomUUID(), name: "Pasta", category: "Pantry", checked: false },
  { id: crypto.randomUUID(), name: "Laundry detergent", category: "Home", checked: false }
];

const seedSubjects = [
  {
    id: crypto.randomUUID(),
    name: "Subject 1",
    coverage: "Add chapters, labs, or lecture topics",
    minutesPlanned: 60,
    minutesDone: 0,
    status: "open"
  },
  {
    id: crypto.randomUUID(),
    name: "Subject 2",
    coverage: "Add what must be revised this week",
    minutesPlanned: 60,
    minutesDone: 0,
    status: "open"
  },
  {
    id: crypto.randomUUID(),
    name: "Subject 3",
    coverage: "Add problem sets or reading targets",
    minutesPlanned: 60,
    minutesDone: 0,
    status: "open"
  },
  {
    id: crypto.randomUUID(),
    name: "Subject 4",
    coverage: "Add exam prep or assignment work",
    minutesPlanned: 60,
    minutesDone: 0,
    status: "open"
  }
];

const seedLifeItems = [
  {
    id: crypto.randomUUID(),
    title: "Buy flight tickets home",
    due: todayOffset(7),
    status: "open",
    createdAt: new Date().toISOString()
  },
  {
    id: crypto.randomUUID(),
    title: "Renew Deutschlandticket",
    due: todayOffset(3),
    status: "open",
    createdAt: new Date().toISOString()
  }
];

const dailyQuotes = [
  { text: "Tera Kiya Mittha Laage", author: "Daily Edge" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "Do the hard jobs first. The easy jobs will take care of themselves.", author: "Dale Carnegie" },
  { text: "It always seems impossible until it is done.", author: "Nelson Mandela" },
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "A little progress each day adds up to big results.", author: "Satya Nani" },
  { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "What gets measured gets improved.", author: "Peter Drucker" }
];

let state = loadState();
let activeFilter = "open";
let weatherState = null;
let focusTimer = null;
let focusRemaining = Number(state.settings.focusMinutes) * 60;
let focusTotal = focusRemaining;
let focusSessionStarted = false;
let editingSubjectId = null;
let editingLifeId = null;

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
  metricFire: document.querySelector("#metricFire"),
  dayStart: document.querySelector("#dayStart"),
  dayEnd: document.querySelector("#dayEnd"),
  focusMinutes: document.querySelector("#focusMinutes"),
  focusTitle: document.querySelector("#focusTitle"),
  focusTime: document.querySelector("#focusTime"),
  focusCanvas: document.querySelector("#focusCanvas"),
  startFocusBtn: document.querySelector("#startFocusBtn"),
  pauseFocusBtn: document.querySelector("#pauseFocusBtn"),
  finishFocusBtn: document.querySelector("#finishFocusBtn"),
  logThirtyBtn: document.querySelector("#logThirtyBtn"),
  logTwoHoursBtn: document.querySelector("#logTwoHoursBtn"),
  exportBtn: document.querySelector("#exportBtn"),
  importBtn: document.querySelector("#importBtn"),
  importFile: document.querySelector("#importFile"),
  resetBtn: document.querySelector("#resetBtn"),
  weatherTemp: document.querySelector("#weatherTemp"),
  weatherSummary: document.querySelector("#weatherSummary"),
  weatherAdvice: document.querySelector("#weatherAdvice"),
  weatherIcon: document.querySelector("#weatherIcon"),
  studyReadiness: document.querySelector("#studyReadiness"),
  studyReadinessText: document.querySelector("#studyReadinessText"),
  studyModes: document.querySelector("#studyModes"),
  quickStudyBtn: document.querySelector("#quickStudyBtn"),
  activeStudyMode: document.querySelector("#activeStudyMode"),
  activeStudyText: document.querySelector("#activeStudyText"),
  focusProtocol: document.querySelector("#focusProtocol"),
  studyBlockMinutes: document.querySelector("#studyBlockMinutes"),
  studyBreakMinutes: document.querySelector("#studyBreakMinutes"),
  studyGoalInput: document.querySelector("#studyGoalInput"),
  subjectForm: document.querySelector("#subjectForm"),
  subjectName: document.querySelector("#subjectName"),
  subjectCoverage: document.querySelector("#subjectCoverage"),
  subjectMinutes: document.querySelector("#subjectMinutes"),
  subjectList: document.querySelector("#subjectList"),
  subjectSummary: document.querySelector("#subjectSummary"),
  activeSubjectSelect: document.querySelector("#activeSubjectSelect"),
  groceryForm: document.querySelector("#groceryForm"),
  groceryName: document.querySelector("#groceryName"),
  groceryCategory: document.querySelector("#groceryCategory"),
  grocerySuggestions: document.querySelector("#grocerySuggestions"),
  groceryList: document.querySelector("#groceryList"),
  seedLifeBtn: document.querySelector("#seedLifeBtn"),
  lifeForm: document.querySelector("#lifeForm"),
  lifeTitle: document.querySelector("#lifeTitle"),
  lifeDue: document.querySelector("#lifeDue"),
  lifeList: document.querySelector("#lifeList"),
  updatesList: document.querySelector("#updatesList"),
  openSourcesBtn: document.querySelector("#openSourcesBtn"),
  streakCount: document.querySelector("#streakCount"),
  streakSummary: document.querySelector("#streakSummary"),
  flameBadge: document.querySelector("#flameBadge"),
  todayFocusMinutes: document.querySelector("#todayFocusMinutes"),
  dailyTargetStatus: document.querySelector("#dailyTargetStatus"),
  bestFocusDay: document.querySelector("#bestFocusDay"),
  focusCalendar: document.querySelector("#focusCalendar"),
  streakRing: document.querySelector("#streakRing"),
  dailyQuote: document.querySelector("#dailyQuote")
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
    subjects: seedSubjects.map((item) => ({ ...item, id: crypto.randomUUID() })),
    lifeItems: seedLifeItems.map((item) => ({ ...item, id: crypto.randomUUID() })),
    plan: [],
    focusLog: {},
    updates: [],
    weather: null,
    settings: {
      dayStart: "09:00",
      dayEnd: "18:00",
      focusMinutes: 45,
      activeStudyMode: "deep",
      studyGoal: ""
    }
  };
}

function loadState() {
  const fallback = defaultState();
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || previousStorageKeys.map((key) => localStorage.getItem(key)).find(Boolean));
    if (!saved) return fallback;
    return {
      ...fallback,
      ...saved,
      groceries: saved.groceries || fallback.groceries,
      subjects: saved.subjects || fallback.subjects,
      lifeItems: saved.lifeItems || fallback.lifeItems,
      focusLog: saved.focusLog || fallback.focusLog,
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

function dateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function focusMinutesFor(key = dateKey()) {
  return Math.round(Number(state.focusLog?.[key]?.minutes || 0));
}

function logFocusMinutes(minutes, source = "manual") {
  const amount = Math.max(1, Math.round(minutes));
  const key = dateKey();
  state.focusLog[key] = state.focusLog[key] || { minutes: 0, sessions: [] };
  state.focusLog[key].minutes += amount;
  state.focusLog[key].sessions.push({
    minutes: amount,
    source,
    mode: activeStudyMode().name,
    subjectId: els.activeSubjectSelect?.value || "",
    loggedAt: new Date().toISOString()
  });
  applyMinutesToActiveSubject(amount);
  saveState();
  render();
}

function applyMinutesToActiveSubject(minutes) {
  const subjectId = els.activeSubjectSelect?.value;
  if (!subjectId) return;
  const subject = state.subjects.find((item) => item.id === subjectId);
  if (!subject) return;
  subject.minutesDone = Math.max(0, Number(subject.minutesDone || 0) + minutes);
  if (subject.minutesDone >= Number(subject.minutesPlanned || 0)) {
    subject.status = "done";
  }
}

function currentFireStreak() {
  let streak = 0;
  let cursor = new Date(`${dateKey()}T12:00:00`);
  while (focusMinutesFor(dateKey(cursor)) >= fireTargetMinutes) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function bestFocusDayEntry() {
  return Object.entries(state.focusLog || {})
    .map(([key, value]) => ({ key, minutes: Math.round(Number(value.minutes || 0)) }))
    .sort((a, b) => b.minutes - a.minutes)[0];
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

  if (lower.includes("log") && (lower.includes("focus") || lower.includes("study"))) {
    const minutesMatch = lower.match(/(\d+(?:\.\d+)?)\s*(m|min|minute|minutes)/);
    const hoursMatch = lower.match(/(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours)/);
    const minutes = minutesMatch
      ? Number(minutesMatch[1])
      : hoursMatch
        ? Number(hoursMatch[1]) * 60
        : fireTargetMinutes;
    logFocusMinutes(minutes, "assistant-command");
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

function addSubject({ name, coverage, minutesPlanned }) {
  const cleanName = name.trim();
  const cleanCoverage = coverage.trim();
  if (!cleanName || !cleanCoverage) return;
  if (editingSubjectId) {
    const subject = state.subjects.find((item) => item.id === editingSubjectId);
    if (subject) {
      subject.name = cleanName;
      subject.coverage = cleanCoverage;
      subject.minutesPlanned = Math.max(15, Number(minutesPlanned || 60));
      subject.status = Number(subject.minutesDone || 0) >= subject.minutesPlanned ? "done" : "open";
    }
    editingSubjectId = null;
    saveState();
    render();
    return;
  }
  state.subjects.unshift({
    id: crypto.randomUUID(),
    name: cleanName,
    coverage: cleanCoverage,
    minutesPlanned: Math.max(15, Number(minutesPlanned || 60)),
    minutesDone: 0,
    status: "open"
  });
  saveState();
  render();
}

function renderSubjects() {
  const subjects = state.subjects || [];
  const selectedId = els.activeSubjectSelect.value;
  const openSubjects = subjects.filter((item) => item.status !== "done");
  const planned = subjects.reduce((sum, item) => sum + Number(item.minutesPlanned || 0), 0);
  const done = subjects.reduce((sum, item) => sum + Number(item.minutesDone || 0), 0);

  els.subjectSummary.textContent = `${Math.round(done)}/${Math.round(planned)} min`;
  els.activeSubjectSelect.innerHTML = `<option value="">No subject selected</option>`;
  for (const subject of openSubjects) {
    const option = document.createElement("option");
    option.value = subject.id;
    option.textContent = subject.name;
    els.activeSubjectSelect.append(option);
  }
  if (subjects.some((item) => item.id === selectedId && item.status !== "done")) {
    els.activeSubjectSelect.value = selectedId;
  }

  els.subjectList.innerHTML = "";
  if (!subjects.length) {
    els.subjectList.innerHTML = `<div class="empty-state">Add your four semester subjects and the chapters to cover.</div>`;
    return;
  }

  for (const subject of subjects) {
    const progress = Math.min(100, Math.round((Number(subject.minutesDone || 0) / Math.max(1, Number(subject.minutesPlanned || 1))) * 100));
    const card = document.createElement("article");
    card.className = `subject-card ${subject.status === "done" ? "done" : ""}`;
    card.innerHTML = `
      <div class="subject-main">
        <div>
          <h4>${escapeHtml(subject.name)}</h4>
          <p>${escapeHtml(subject.coverage)}</p>
        </div>
        <strong>${progress}%</strong>
      </div>
      <div class="subject-progress" aria-label="${escapeHtml(subject.name)} progress">
        <span style="width: ${progress}%"></span>
      </div>
      <div class="subject-meta">
        <span>${Math.round(Number(subject.minutesDone || 0))} min done</span>
        <span>${Math.round(Number(subject.minutesPlanned || 0))} min planned</span>
      </div>
      <div class="subject-actions">
        <button class="mini-button use-subject" type="button">Use timer</button>
        <button class="mini-button edit-subject" type="button">Edit</button>
        <button class="mini-button delete-subject" type="button">Delete</button>
      </div>
    `;
    card.querySelector(".use-subject").addEventListener("click", () => {
      els.activeSubjectSelect.value = subject.id;
      state.settings.focusMinutes = Math.min(120, Math.max(15, Number(subject.minutesPlanned || activeStudyMode().minutes)));
      focusRemaining = state.settings.focusMinutes * 60;
      focusTotal = focusRemaining;
      saveState();
      render();
    });
    card.querySelector(".edit-subject").addEventListener("click", () => {
      editingSubjectId = subject.id;
      els.subjectName.value = subject.name;
      els.subjectCoverage.value = subject.coverage;
      els.subjectMinutes.value = subject.minutesPlanned;
      els.subjectName.focus();
    });
    card.querySelector(".delete-subject").addEventListener("click", () => {
      state.subjects = state.subjects.filter((item) => item.id !== subject.id);
      saveState();
      render();
    });
    els.subjectList.append(card);
  }
}

function renderStudyModes() {
  const active = state.settings.activeStudyMode;
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
}

function nextStudyTarget() {
  const selectedSubject = activeSubject();
  const openSubject = (state.subjects || []).find((item) => item.status !== "done");
  const goal = (state.settings.studyGoal || "").trim();

  if (selectedSubject) {
    return {
      title: selectedSubject.name,
      detail: selectedSubject.coverage
    };
  }

  if (goal) {
    return {
      title: "Today's study goal",
      detail: goal
    };
  }

  if (openSubject) {
    return {
      title: openSubject.name,
      detail: openSubject.coverage
    };
  }

  return {
    title: "Choose a subject",
    detail: "Add a subject and what needs to be covered, then start the timer."
  };
}

function renderStudyWorkbench() {
  const selected = activeStudyMode();
  const target = nextStudyTarget();

  els.activeStudyMode.textContent = `${selected.name} for ${target.title}`;
  els.activeStudyText.textContent = target.detail;
  els.focusProtocol.innerHTML = `
    <span><strong>Rule</strong>${escapeHtml(selected.rule)}</span>
    <span><strong>Output</strong>${escapeHtml(selected.output)}</span>
    <span><strong>Break</strong>${selected.breakMinutes} min: water, stretch, no phone loop.</span>
  `;
  els.studyBlockMinutes.textContent = selected.minutes;
  els.studyBreakMinutes.textContent = selected.breakMinutes;
}

function addGrocery(name, category = "Pantry") {
  const clean = name.trim();
  if (!clean) return;
  const openSlots = state.groceries.filter((item) => !item.checked);
  if (openSlots.length >= 6) return;
  state.groceries.unshift({
    id: crypto.randomUUID(),
    name: clean,
    category,
    checked: false
  });
  saveState();
  render();
}

function addLifeItem(title, due = "") {
  const clean = title.trim();
  if (!clean) return;
  if (editingLifeId) {
    const item = state.lifeItems.find((lifeItem) => lifeItem.id === editingLifeId);
    if (item) {
      item.title = clean;
      item.due = due;
    }
    editingLifeId = null;
    saveState();
    render();
    return;
  }
  state.lifeItems.unshift({
    id: crypto.randomUUID(),
    title: clean,
    due,
    status: "open",
    createdAt: new Date().toISOString()
  });
  saveState();
  render();
}

function renderLifeItems() {
  const items = state.lifeItems || [];
  els.lifeList.innerHTML = "";
  if (!items.length) {
    els.lifeList.innerHTML = `<div class="empty-state">Add practical life admin here: tickets, calls, documents, appointments.</div>`;
    return;
  }

  for (const item of items) {
    const row = document.createElement("article");
    row.className = `life-item ${item.status === "done" ? "done" : ""}`;
    row.innerHTML = `
      <button class="check-button" type="button" aria-label="Toggle ${escapeHtml(item.title)}"></button>
      <div>
        <h4>${escapeHtml(item.title)}</h4>
        <p>${escapeHtml(formatDate(item.due))}</p>
      </div>
      <button class="mini-button edit-life" type="button">Edit</button>
      <button class="mini-button delete-life" type="button">Delete</button>
    `;
    row.querySelector(".check-button").addEventListener("click", () => {
      item.status = item.status === "done" ? "open" : "done";
      saveState();
      render();
    });
    row.querySelector(".edit-life").addEventListener("click", () => {
      editingLifeId = item.id;
      els.lifeTitle.value = item.title;
      els.lifeDue.value = item.due || "";
      els.lifeTitle.focus();
    });
    row.querySelector(".delete-life").addEventListener("click", () => {
      state.lifeItems = state.lifeItems.filter((lifeItem) => lifeItem.id !== item.id);
      saveState();
      render();
    });
    els.lifeList.append(row);
  }
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

  for (let index = 0; index < 6; index += 1) {
    const item = pending[index];
    const row = document.createElement("div");
    row.className = `grocery-item grocery-slot ${item ? "" : "empty-slot"}`;
    if (item) {
      row.innerHTML = `
        <button class="check-button" type="button" aria-label="Done ${escapeHtml(item.name)}"></button>
        <span>${escapeHtml(item.name)}</span>
        <button class="mini-button" type="button">Delete</button>
      `;
      row.querySelector(".check-button").addEventListener("click", () => {
        item.checked = true;
        saveState();
        render();
      });
      row.querySelector(".mini-button").addEventListener("click", () => {
        state.groceries = state.groceries.filter((grocery) => grocery.id !== item.id);
        saveState();
        render();
      });
    } else {
      row.innerHTML = `<span>Empty slot ${index + 1}</span>`;
    }
    els.groceryList.append(row);
  }

  const suggestions = grocerySuggestions();
  els.grocerySuggestions.innerHTML = suggestions
    .map((item) => `<button class="suggestion" type="button" data-name="${escapeHtml(item)}">${escapeHtml(item)}</button>`)
    .join("");
  els.grocerySuggestions.querySelectorAll(".suggestion").forEach((button) => {
    button.addEventListener("click", () => addGrocery(button.dataset.name, guessGroceryCategory(button.dataset.name)));
  });

}

function grocerySuggestions() {
  const suggestions = ["Coffee", "Pasta", "Toilet paper", "Dish soap", "Laundry detergent", "Vegetables"];
  const temp = weatherState?.current?.temperature_2m;
  const rain = weatherState?.daily?.precipitation_sum?.[0] || 0;
  if (typeof temp === "number" && temp >= 25) suggestions.unshift("Mineral water", "Iced coffee");
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
    els.weatherAdvice.textContent = "Keep the day plan flexible until weather loads.";
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
  els.weatherAdvice.textContent = weatherAdvice(current, daily);
}

function weatherAdvice(current, daily = {}) {
  const temp = Number(current.apparent_temperature ?? current.temperature_2m);
  const rain = Number(daily.precipitation_sum?.[0] || 0);
  const wind = Number(current.wind_speed_10m || 0);
  if (rain > 2) return "Rain likely: carry an umbrella and group outside errands.";
  if (temp >= 25) return "Warm day: wear lighter clothes and keep water nearby.";
  if (temp <= 8) return "Cold outside: take a jacket before leaving.";
  if (wind >= 30) return "Windy: use a stronger layer for cycling or errands.";
  return "Good conditions: schedule errands between study blocks.";
}

async function loadUpdates() {
  if (!els.updatesList) return;
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
  if (!els.updatesList) return;
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
  const plannedHours = state.plan.reduce((sum, block) => {
    return sum + (minutesFromTime(block.end) - minutesFromTime(block.start)) / 60;
  }, 0);

  els.metricOpen.textContent = open;
  els.metricPlanned.textContent = `${plannedHours.toFixed(1)}h`;
  els.metricFire.textContent = currentFireStreak();
}

function renderStreak() {
  const todayMinutes = focusMinutesFor();
  const streak = currentFireStreak();
  const targetProgress = Math.min(1, todayMinutes / fireTargetMinutes);
  const remaining = Math.max(0, fireTargetMinutes - todayMinutes);
  const best = bestFocusDayEntry();

  els.streakCount.textContent = `${streak} day${streak === 1 ? "" : "s"}`;
  els.todayFocusMinutes.textContent = todayMinutes;
  els.dailyTargetStatus.textContent = remaining
    ? `${remaining} minutes to fire`
    : "Fire earned today";
  els.streakSummary.textContent = remaining
    ? `${Math.round(targetProgress * 100)}% of today's 2h dedicated work goal.`
    : "Today is lit. Keep the chain alive tomorrow.";
  els.flameBadge.classList.toggle("lit", todayMinutes >= fireTargetMinutes);
  els.streakRing.style.setProperty("--progress", `${Math.round(targetProgress * 100)}%`);
  els.bestFocusDay.textContent = best
    ? `Best day: ${formatDate(best.key)} with ${best.minutes} focused minutes.`
    : "Best focused day will appear after your first logged block.";

  els.focusCalendar.innerHTML = "";
  for (let offset = 34; offset >= 0; offset -= 1) {
    const day = addDays(new Date(`${dateKey()}T12:00:00`), -offset);
    const key = dateKey(day);
    const minutes = focusMinutesFor(key);
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "focus-day";
    cell.dataset.level = String(Math.min(4, Math.floor(minutes / 30)));
    cell.title = `${formatDate(key)}: ${minutes} focused minutes`;
    cell.innerHTML = `<span>${day.getDate()}</span>${minutes >= fireTargetMinutes ? "<strong>F</strong>" : ""}`;
    els.focusCalendar.append(cell);
  }
}

function renderQuote() {
  const quote = dailyQuotes[0];
  els.dailyQuote.textContent = quote.text;
}

function renderReadiness() {
  const studyOpen = state.tasks.filter((task) => task.area === "Study" && task.status !== "done");
  const subjectOpen = (state.subjects || []).filter((item) => item.status !== "done");
  const deepHours = studyOpen.filter((task) => task.energy === "deep").reduce((sum, task) => sum + Number(task.effort), 0);
  const mode = activeStudyMode();
  const label = subjectOpen.length ? `${subjectOpen.length} subject${subjectOpen.length === 1 ? "" : "s"} queued` : "Add study target";
  els.studyReadiness.textContent = label;
  els.studyReadinessText.textContent = subjectOpen.length
    ? `${mode.name} is active. ${studyOpen.length} study task${studyOpen.length === 1 ? "" : "s"}, ${deepHours.toFixed(1)}h task load.`
    : "Add your semester subjects, then choose one for the timer.";
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
  ctx.fillStyle = "#090a0d";
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 34; i += 1) {
    const x = (i * 47) % width;
    const y = 24 + Math.sin(i) * 24 + (i % 5) * 22;
    ctx.fillStyle = i % 2 ? "rgba(169,175,194,0.25)" : "rgba(118,122,132,0.18)";
    ctx.fillRect(x, y, 3, 3);
  }

  ctx.strokeStyle = "#a9afc2";
  ctx.lineWidth = 12;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, 48, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
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
  els.studyGoalInput.value = state.settings.studyGoal || "";
  renderStudyModes();
  renderSubjects();
  renderStudyWorkbench();
  renderTasks();
  renderTimeline();
  renderGroceries();
  renderLifeItems();
  renderUpdates();
  renderInsights();
  renderReadiness();
  renderStreak();
  renderQuote();
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

function activeSubject() {
  const id = els.activeSubjectSelect?.value;
  return (state.subjects || []).find((item) => item.id === id) || null;
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

els.subjectForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addSubject({
    name: els.subjectName.value,
    coverage: els.subjectCoverage.value,
    minutesPlanned: els.subjectMinutes.value
  });
  els.subjectForm.reset();
  els.subjectMinutes.value = 60;
});

els.lifeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addLifeItem(els.lifeTitle.value, els.lifeDue.value);
  els.lifeForm.reset();
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
els.studyGoalInput.addEventListener("input", () => {
  state.settings.studyGoal = els.studyGoalInput.value;
  saveState();
  renderStudyWorkbench();
});
els.activeSubjectSelect.addEventListener("change", () => renderStudyWorkbench());
els.seedLifeBtn.addEventListener("click", () => {
  ["Buy flight tickets home", "Renew Deutschlandticket", "Book haircut", "Clean desk and reset room"].forEach((title) => {
    if (!state.lifeItems.some((item) => item.title.toLowerCase() === title.toLowerCase())) {
      state.lifeItems.push({
        id: crypto.randomUUID(),
        title,
        due: todayOffset(3),
        status: "open",
        createdAt: new Date().toISOString()
      });
    }
  });
  saveState();
  render();
});

document.querySelectorAll(".life-tab").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".life-tab").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll(".life-tab-panel").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    document.querySelector(`[data-life-panel="${button.dataset.lifeTab}"]`)?.classList.add("active");
  });
});

document.querySelectorAll(".life-action").forEach((button) => {
  button.addEventListener("click", () => addLifeItem(button.dataset.lifeTask, todayOffset(3)));
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
  focusSessionStarted = true;
  const subject = activeSubject();
  els.focusTitle.textContent = subject ? `In focus: ${subject.name}` : `In focus: ${activeStudyMode().name}`;
  focusTimer = setInterval(() => {
    focusRemaining = Math.max(0, focusRemaining - 1);
    renderFocus();
    if (focusRemaining === 0) {
      clearInterval(focusTimer);
      focusTimer = null;
      logFocusMinutes(focusTotal / 60, "timer-complete");
      focusSessionStarted = false;
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
  const elapsed = Math.round((focusTotal - focusRemaining) / 60);
  clearInterval(focusTimer);
  focusTimer = null;
  if (focusSessionStarted && elapsed > 0) {
    logFocusMinutes(elapsed, "timer-finish");
  }
  focusSessionStarted = false;
  focusRemaining = Number(state.settings.focusMinutes) * 60;
  focusTotal = focusRemaining;
  els.focusTitle.textContent = "Ready";
  renderFocus();
});

els.logThirtyBtn.addEventListener("click", () => logFocusMinutes(30, "quick-log"));
els.logTwoHoursBtn.addEventListener("click", () => logFocusMinutes(fireTargetMinutes, "fire-log"));

els.exportBtn?.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `jarvis-planner-${todayOffset(0)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
});

els.importBtn?.addEventListener("click", () => els.importFile?.click());
els.importFile?.addEventListener("change", async () => {
  const file = els.importFile.files[0];
  if (!file) return;
  const imported = JSON.parse(await file.text());
  state = {
    ...state,
    ...imported,
    settings: { ...state.settings, ...imported.settings },
    subjects: imported.subjects || state.subjects,
    lifeItems: imported.lifeItems || state.lifeItems,
    focusLog: { ...state.focusLog, ...imported.focusLog }
  };
  saveState();
  render();
});

els.resetBtn?.addEventListener("click", () => {
  state = defaultState();
  weatherState = null;
  saveState();
  render();
  loadWeather();
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
render();
loadWeather();
