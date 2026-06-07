const COLORS = [
  { id: "purple", label: "보라", power: 6 },
  { id: "rock", label: "바위", power: 5 },
  { id: "red", label: "빨강", power: 4 },
  { id: "blue", label: "파랑", power: 3 },
  { id: "yellow", label: "노랑", power: 3 },
  { id: "white", label: "하양", power: 2 },
  { id: "winged", label: "핑크/날개", power: 2 },
  { id: "ice", label: "얼음", power: 2 }
];

const DECORS = [
  { id: "current", label: "현재시즌 데코", hint: "이번 이벤트 주력 데코" },
  { id: "revival", label: "시즌서브/복각 데코", hint: "작년 또는 복각 이벤트 데코" },
  { id: "normal", label: "일반 데코", hint: "이벤트 보너스 없는 일반 데코" },
  { id: "none", label: "비데코", hint: "데코를 아직 얻지 못한 피크민" }
];

const FRIENDSHIPS = [
  { id: "red0", label: "빨강하트 0", short: "빨0", power: 0 },
  { id: "red1", label: "빨강하트 1", short: "빨1", power: 1 },
  { id: "red2", label: "빨강하트 2", short: "빨2", power: 2 },
  { id: "red3", label: "빨강하트 3", short: "빨3", power: 3 },
  { id: "red4", label: "빨강하트 4", short: "빨4", power: 4 },
  { id: "yellow1", label: "노랑하트 1", short: "노1", power: 8 },
  { id: "yellow2", label: "노랑하트 2", short: "노2", power: 12 },
  { id: "yellow3", label: "노랑하트 3", short: "노3", power: 16 },
  { id: "yellow4", label: "노랑하트 4", short: "노4", power: 20 }
];

const FLOWER_POWER = {
  leaf: 1,
  bud: 2,
  regular: 3,
  seasonal: 4,
  monthly: 5
};

const SCENARIOS = [
  { id: "season", label: "시즌꽃" },
  { id: "regular", label: "일반꽃", flowerPower: 3 },
  { id: "unfed", label: "안줌" },
  { id: "bare", label: "탈모", flowerPower: 0 }
];

const COLOR_BY_ID = Object.fromEntries(COLORS.map((item) => [item.id, item]));
const DECOR_BY_ID = Object.fromEntries(DECORS.map((item) => [item.id, item]));
const FRIENDSHIP_BY_ID = Object.fromEntries(FRIENDSHIPS.map((item) => [item.id, item]));
const STORAGE_KEY = "pikminMushroomCalculatorV5";

const decorSectionsEl = document.querySelector("#decorSections");
const groupTemplate = document.querySelector("#groupTemplate");
const rowTemplate = document.querySelector("#rowTemplate");
const teamLimitEl = document.querySelector("#teamLimit");
const seasonFlowerPowerEl = document.querySelector("#seasonFlowerPower");
const unfedFlowerEl = document.querySelector("#unfedFlower");
const decorBaseEl = document.querySelector("#decorBase");

const bonusInputs = {
  current: document.querySelector("#bonusCurrent"),
  revival: document.querySelector("#bonusRevival"),
  normal: document.querySelector("#bonusNormal")
};

const output = {
  totalPower: document.querySelector("#totalPower"),
  powerComment: document.querySelector("#powerComment"),
  showComment: document.querySelector("#showComment"),
  seasonTotal: document.querySelector("#seasonTotal"),
  regularTotal: document.querySelector("#regularTotal"),
  unfedTotal: document.querySelector("#unfedTotal"),
  bareTotal: document.querySelector("#bareTotal"),
  categorySummary: document.querySelector("#categorySummary"),
  colorSummary: document.querySelector("#colorSummary"),
  topList: document.querySelector("#topList")
};

const SAMPLE_ROWS = [
  { decor: "current", color: "purple", counts: { yellow4: 8 } },
  { decor: "current", color: "rock", counts: { yellow3: 10 } },
  { decor: "current", color: "ice", counts: { yellow2: 4 } },
  { decor: "revival", color: "red", counts: { yellow2: 7 } },
  { decor: "normal", color: "blue", counts: { red4: 9 } },
  { decor: "none", color: "yellow", counts: { red4: 6 } }
];

let lastCommentPower = null;

function numberValue(el, fallback = 0) {
  const value = Number(el.value);
  return Number.isFinite(value) ? value : fallback;
}

function formatNumber(value) {
  return Math.round(value).toLocaleString("ko-KR");
}

function getPowerComment(power) {
  if (power >= 12000) return "이제 더이상 안올려도 되겠는걸요";
  if (power >= 10000) return "이제 하산해도 될 경지";
  if (power >= 7000) return "일인분! 일까요?";
  if (power >= 5000) return "시즌 초반이면 나름 쓸만하네요";
  if (power <= 500) return "이건 알박기인가요?";
  if (power <= 1000) return "알박기 하실건 아니죠?";
  return "좀 치시는듯?";
}

function getScenarioFlowerPower(scenario) {
  if (scenario.id === "season") return numberValue(seasonFlowerPowerEl, 5);
  if (scenario.id === "unfed") return FLOWER_POWER[unfedFlowerEl.value] ?? 1;
  return scenario.flowerPower;
}

function getDecorPower(decorId) {
  if (decorId === "none") return 0;
  const base = numberValue(decorBaseEl, 4);
  const eventBonus = numberValue(bonusInputs[decorId] || bonusInputs.normal, 0);
  return base + eventBonus;
}

function emptyScenarioTotals() {
  return Object.fromEntries(SCENARIOS.map((scenario) => [scenario.id, 0]));
}

function getRowData(row) {
  const decor = row.closest(".decor-group").dataset.decor;
  const color = row.dataset.color;
  const colorPower = COLOR_BY_ID[color].power;
  const decorPower = getDecorPower(decor);
  const counts = Object.fromEntries(FRIENDSHIPS.map((friendship) => {
    const input = row.querySelector(`[data-heart="${friendship.id}"]`);
    return [friendship.id, Math.max(0, Math.floor(numberValue(input, 0)))];
  }));
  const count = Object.values(counts).reduce((sum, value) => sum + value, 0);
  const scenarios = Object.fromEntries(SCENARIOS.map((scenario) => {
    const flowerPower = getScenarioFlowerPower(scenario);
    const total = FRIENDSHIPS.reduce((sum, friendship) => {
      const each = colorPower + friendship.power + decorPower + flowerPower;
      return sum + each * counts[friendship.id];
    }, 0);
    return [scenario.id, { total }];
  }));

  return { decor, color, counts, count, scenarios };
}

function createGroup(decor) {
  const fragment = groupTemplate.content.cloneNode(true);
  const group = fragment.querySelector(".decor-group");
  const toggle = group.querySelector(".group-toggle");

  group.dataset.decor = decor.id;
  group.querySelector(".group-title").textContent = decor.label;
  group.querySelector("p").textContent = decor.hint;
  toggle.addEventListener("click", () => {
    const collapsed = group.classList.toggle("collapsed");
    toggle.setAttribute("aria-expanded", String(!collapsed));
    saveState();
  });

  decorSectionsEl.appendChild(group);
  for (const color of COLORS) createRow(decor.id, color.id);
}

function createRow(decorId, colorId) {
  const group = decorSectionsEl.querySelector(`[data-decor="${decorId}"]`);
  const fragment = rowTemplate.content.cloneNode(true);
  const row = fragment.querySelector("tr");
  const color = COLOR_BY_ID[colorId];

  row.dataset.color = colorId;
  row.querySelector(".color-label").textContent = `${color.label} (+${color.power})`;
  row.addEventListener("input", calculate);
  row.addEventListener("change", calculate);

  group.querySelector("tbody").appendChild(row);
}

function collectRows() {
  return Array.from(decorSectionsEl.querySelectorAll("tbody tr")).map(getRowData);
}

function expandScenario(items, scenarioId) {
  return items.flatMap((item) => (
    FRIENDSHIPS.flatMap((friendship) => {
      const count = item.counts[friendship.id] || 0;
      const each = COLOR_BY_ID[item.color].power
        + FRIENDSHIP_BY_ID[friendship.id].power
        + getDecorPower(item.decor)
        + getScenarioFlowerPower(SCENARIOS.find((scenario) => scenario.id === scenarioId));
      return Array.from({ length: count }, () => ({
        each,
        decor: item.decor,
        color: item.color,
        friendship: friendship.id
      }));
    })
  ));
}

function topLimitedTotal(items, scenarioId) {
  const limit = Math.max(1, Math.floor(numberValue(teamLimitEl, 40)));
  return expandScenario(items, scenarioId)
    .sort((a, b) => b.each - a.each)
    .slice(0, limit)
    .reduce((sum, item) => sum + item.each, 0);
}

function summarize(items, key, scenarioId) {
  return items.reduce((acc, item) => {
    if (item.count <= 0) return acc;
    const label = key === "decor" ? DECOR_BY_ID[item.decor].label : COLOR_BY_ID[item.color].label;
    if (!acc[label]) acc[label] = { count: 0, power: 0 };
    acc[label].count += item.count;
    acc[label].power += item.scenarios[scenarioId].total;
    return acc;
  }, {});
}

function renderSummary(container, summary) {
  container.innerHTML = "";
  const entries = Object.entries(summary).sort((a, b) => b[1].power - a[1].power);

  if (!entries.length) {
    container.innerHTML = '<div class="summary-item"><span>입력 없음</span><strong>0</strong></div>';
    return;
  }

  for (const [label, data] of entries) {
    const item = document.createElement("div");
    item.className = "summary-item";
    item.innerHTML = `<span>${label} · ${data.count}마리</span><strong>${formatNumber(data.power)}</strong>`;
    container.appendChild(item);
  }
}

function renderTopList(items) {
  const limit = Math.max(1, Math.floor(numberValue(teamLimitEl, 40)));
  const top = expandScenario(items, "season")
    .sort((a, b) => b.each - a.each)
    .slice(0, limit);
  const grouped = [];

  for (const item of top) {
    const key = `${item.decor}|${item.color}|${item.friendship}|${item.each}`;
    const existing = grouped.find((entry) => entry.key === key);
    if (existing) {
      existing.count += 1;
    } else {
      grouped.push({ key, ...item, count: 1 });
    }
  }

  output.topList.innerHTML = "";
  if (!grouped.length) {
    output.topList.innerHTML = "<li>입력 없음</li>";
    return;
  }

  for (const item of grouped) {
    const li = document.createElement("li");
    li.innerHTML = `${COLOR_BY_ID[item.color].label} ${DECOR_BY_ID[item.decor].label} · ${item.count}마리 <strong>${item.each}</strong><span>${FRIENDSHIP_BY_ID[item.friendship].label}, 시즌꽃 기준</span>`;
    output.topList.appendChild(li);
  }
}

function updateGroupTotals(items) {
  for (const decor of DECORS) {
    const group = decorSectionsEl.querySelector(`[data-decor="${decor.id}"]`);
    const rows = items.filter((item) => item.decor === decor.id);
    const totals = rows.reduce((acc, item) => {
      for (const scenario of SCENARIOS) acc[scenario.id] += item.scenarios[scenario.id].total;
      return acc;
    }, emptyScenarioTotals());

    group.querySelector(".group-season").textContent = formatNumber(totals.season);
    group.querySelector(".group-regular").textContent = formatNumber(totals.regular);
    group.querySelector(".group-unfed").textContent = formatNumber(totals.unfed);
    group.querySelector(".group-bare").textContent = formatNumber(totals.bare);
  }
}

function calculate() {
  const items = collectRows();
  const totals = Object.fromEntries(SCENARIOS.map((scenario) => [
    scenario.id,
    topLimitedTotal(items, scenario.id)
  ]));

  for (const row of decorSectionsEl.querySelectorAll("tbody tr")) {
    const data = getRowData(row);
    row.querySelector(".season").textContent = formatNumber(data.scenarios.season.total);
    row.querySelector(".regular").textContent = formatNumber(data.scenarios.regular.total);
    row.querySelector(".unfed").textContent = formatNumber(data.scenarios.unfed.total);
    row.querySelector(".bare").textContent = formatNumber(data.scenarios.bare.total);
  }

  updateGroupTotals(items);
  output.totalPower.textContent = formatNumber(totals.season);
  output.powerComment.textContent = getPowerComment(totals.season);
  if (lastCommentPower !== totals.season) {
    output.powerComment.hidden = true;
    output.showComment.textContent = "결과 확인";
    lastCommentPower = totals.season;
  }
  output.seasonTotal.textContent = formatNumber(totals.season);
  output.regularTotal.textContent = formatNumber(totals.regular);
  output.unfedTotal.textContent = formatNumber(totals.unfed);
  output.bareTotal.textContent = formatNumber(totals.bare);
  output.totalPower.setAttribute("title", `상위 ${Math.min(totalCount(items), numberValue(teamLimitEl, 40))}마리 기준`);

  renderSummary(output.categorySummary, summarize(items, "decor", "season"));
  renderSummary(output.colorSummary, summarize(items, "color", "season"));
  renderTopList(items);
  saveState();
}

function totalCount(items) {
  return items.reduce((sum, item) => sum + item.count, 0);
}

function getState() {
  return {
    teamLimit: teamLimitEl.value,
    seasonFlowerPower: seasonFlowerPowerEl.value,
    unfedFlower: unfedFlowerEl.value,
    decorBase: decorBaseEl.value,
    bonuses: {
      current: bonusInputs.current.value,
      revival: bonusInputs.revival.value,
      normal: bonusInputs.normal.value
    },
    collapsed: Object.fromEntries(DECORS.map((decor) => [
      decor.id,
      decorSectionsEl.querySelector(`[data-decor="${decor.id}"]`)?.classList.contains("collapsed") || false
    ])),
    rows: collectRows().map((item) => ({
      decor: item.decor,
      color: item.color,
      counts: item.counts
    }))
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(getState()));
}

function loadState() {
  try {
    const state = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!state) return false;

    teamLimitEl.value = state.teamLimit ?? 40;
    seasonFlowerPowerEl.value = state.seasonFlowerPower ?? 5;
    unfedFlowerEl.value = state.unfedFlower ?? "leaf";
    decorBaseEl.value = state.decorBase ?? 4;
    bonusInputs.current.value = state.bonuses?.current ?? 0;
    bonusInputs.revival.value = state.bonuses?.revival ?? 0;
    bonusInputs.normal.value = state.bonuses?.normal ?? 0;

    applyRows(state.rows || []);
    applyCollapsed(state.collapsed || {});
    return Boolean((state.rows || []).length);
  } catch {
    return false;
  }
}

function applyRows(rows) {
  for (const data of rows) {
    const row = decorSectionsEl.querySelector(`[data-decor="${data.decor || "normal"}"] tr[data-color="${data.color || "red"}"]`);
    if (!row) continue;
    for (const friendship of FRIENDSHIPS) {
      row.querySelector(`[data-heart="${friendship.id}"]`).value = data.counts?.[friendship.id] ?? 0;
    }
  }
}

function applyCollapsed(collapsed) {
  for (const decor of DECORS) {
    const group = decorSectionsEl.querySelector(`[data-decor="${decor.id}"]`);
    const isCollapsed = Boolean(collapsed[decor.id]);
    group.classList.toggle("collapsed", isCollapsed);
    group.querySelector(".group-toggle").setAttribute("aria-expanded", String(!isCollapsed));
  }
}

function setSampleRows() {
  resetRows();
  applyRows(SAMPLE_ROWS);
  calculate();
}

function clearRows() {
  localStorage.removeItem(STORAGE_KEY);
  resetRows();
  applyCollapsed({});
  calculate();
}

function resetRows() {
  for (const row of decorSectionsEl.querySelectorAll("tbody tr")) {
    for (const input of row.querySelectorAll(".heart-count")) input.value = 0;
  }
}

for (const decor of DECORS) createGroup(decor);

document.querySelector("#sampleRows").addEventListener("click", setSampleRows);
document.querySelector("#clearRows").addEventListener("click", clearRows);
output.showComment.addEventListener("click", () => {
  output.powerComment.hidden = !output.powerComment.hidden;
  output.showComment.textContent = output.powerComment.hidden ? "결과 확인" : "결과 숨기기";
});

for (const el of [teamLimitEl, seasonFlowerPowerEl, unfedFlowerEl, decorBaseEl, ...Object.values(bonusInputs)]) {
  el.addEventListener("input", calculate);
  el.addEventListener("change", calculate);
}

if (!loadState()) resetRows();
calculate();
