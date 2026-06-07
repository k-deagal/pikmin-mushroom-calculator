const COLORS = [
  { id: "red", label: "빨강", power: 4 },
  { id: "yellow", label: "노랑", power: 3 },
  { id: "blue", label: "파랑", power: 3 },
  { id: "purple", label: "보라", power: 6 },
  { id: "white", label: "하양", power: 2 },
  { id: "winged", label: "날개", power: 2 },
  { id: "rock", label: "바위", power: 5 },
  { id: "ice", label: "얼음", power: 2 }
];

const DECORS = [
  { id: "current", label: "현재시즌 데코", hint: "이번 이벤트 주력 데코" },
  { id: "revival", label: "시즌서브/복각 데코", hint: "작년 또는 복각 이벤트 데코" },
  { id: "normal", label: "일반 데코", hint: "이벤트 보너스 없는 일반 데코" },
  { id: "none", label: "데코 없음", hint: "데코를 아직 얻지 못한 피크민" }
];

const FRIENDSHIPS = [
  { id: "red0", label: "빨강하트 0", power: 0 },
  { id: "red1", label: "빨강하트 1", power: 1 },
  { id: "red2", label: "빨강하트 2", power: 2 },
  { id: "red3", label: "빨강하트 3", power: 3 },
  { id: "red4", label: "빨강하트 4", power: 4 },
  { id: "yellow1", label: "노랑하트 1", power: 8 },
  { id: "yellow2", label: "노랑하트 2", power: 12 },
  { id: "yellow3", label: "노랑하트 3", power: 16 },
  { id: "yellow4", label: "노랑하트 4", power: 20 }
];

const FLOWER_POWER = {
  bare: 0,
  leaf: 1,
  bud: 2,
  regular: 3,
  seasonal: 4,
  monthly: 5
};

const FLOWER_LABEL = {
  bare: "탈모",
  leaf: "잎사귀",
  bud: "봉우리",
  regular: "일반 꽃",
  seasonal: "계절 꽃",
  monthly: "이달의 꽃"
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
  seasonTotal: document.querySelector("#seasonTotal"),
  regularTotal: document.querySelector("#regularTotal"),
  unfedTotal: document.querySelector("#unfedTotal"),
  bareTotal: document.querySelector("#bareTotal"),
  categorySummary: document.querySelector("#categorySummary"),
  colorSummary: document.querySelector("#colorSummary"),
  topList: document.querySelector("#topList")
};

const SAMPLE_ROWS = [
  { decor: "current", count: 8, color: "purple", friendship: "yellow4" },
  { decor: "current", count: 10, color: "rock", friendship: "yellow3" },
  { decor: "current", count: 4, color: "ice", friendship: "yellow2" },
  { decor: "revival", count: 7, color: "red", friendship: "yellow2" },
  { decor: "normal", count: 9, color: "blue", friendship: "red4" },
  { decor: "none", count: 6, color: "yellow", friendship: "red4" }
];

function numberValue(el, fallback = 0) {
  const value = Number(el.value);
  return Number.isFinite(value) ? value : fallback;
}

function formatNumber(value) {
  return Math.round(value).toLocaleString("ko-KR");
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

function getRowData(row) {
  const decor = row.closest(".decor-group").dataset.decor;
  const count = Math.max(0, Math.floor(numberValue(row.querySelector(".count"), 0)));
  const color = row.querySelector(".color").value;
  const friendship = row.querySelector(".friendship").value;
  const base = COLOR_BY_ID[color].power + FRIENDSHIP_BY_ID[friendship].power + getDecorPower(decor);
  const scenarios = Object.fromEntries(SCENARIOS.map((scenario) => {
    const each = base + getScenarioFlowerPower(scenario);
    return [scenario.id, { each, total: each * count }];
  }));

  return { decor, count, color, friendship, base, scenarios };
}

function createGroup(decor) {
  const fragment = groupTemplate.content.cloneNode(true);
  const group = fragment.querySelector(".decor-group");
  group.dataset.decor = decor.id;
  group.querySelector("h3").textContent = decor.label;
  group.querySelector("p").textContent = decor.hint;
  group.querySelector(".add-row").addEventListener("click", () => createRow(decor.id));
  decorSectionsEl.appendChild(group);
}

function createRow(decorId, data = {}) {
  const group = decorSectionsEl.querySelector(`[data-decor="${decorId}"]`);
  const fragment = rowTemplate.content.cloneNode(true);
  const row = fragment.querySelector("tr");

  row.querySelector(".count").value = data.count ?? 1;
  row.querySelector(".color").value = data.color ?? "red";
  row.querySelector(".friendship").value = data.friendship ?? "red4";
  row.addEventListener("input", calculate);
  row.addEventListener("change", calculate);
  row.querySelector(".remove-row").addEventListener("click", () => {
    row.remove();
    calculate();
  });

  group.querySelector("tbody").appendChild(row);
  calculate();
}

function collectRows() {
  return Array.from(decorSectionsEl.querySelectorAll("tbody tr")).map(getRowData);
}

function expandScenario(items, scenarioId) {
  return items.flatMap((item) => (
    Array.from({ length: item.count }, () => ({
      each: item.scenarios[scenarioId].each,
      decor: item.decor,
      color: item.color,
      friendship: item.friendship
    }))
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
  const sortedRows = [...items].sort((a, b) => b.scenarios.season.each - a.scenarios.season.each);
  const top = [];
  let remaining = limit;

  for (const item of sortedRows) {
    if (remaining <= 0) break;
    const count = Math.min(item.count, remaining);
    if (count > 0) {
      top.push({ ...item, count });
      remaining -= count;
    }
  }

  output.topList.innerHTML = "";
  if (!top.length) {
    output.topList.innerHTML = "<li>입력 없음</li>";
    return;
  }

  for (const item of top) {
    const li = document.createElement("li");
    li.innerHTML = `${COLOR_BY_ID[item.color].label} ${DECOR_BY_ID[item.decor].label} · ${item.count}마리 <strong>${item.scenarios.season.each}</strong><span>${FRIENDSHIP_BY_ID[item.friendship].label}, 시즌꽃 기준</span>`;
    output.topList.appendChild(li);
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
    row.querySelector(".season").textContent = formatNumber(data.scenarios.season.each);
    row.querySelector(".regular").textContent = formatNumber(data.scenarios.regular.each);
    row.querySelector(".unfed").textContent = formatNumber(data.scenarios.unfed.each);
    row.querySelector(".bare").textContent = formatNumber(data.scenarios.bare.each);
  }

  output.totalPower.textContent = formatNumber(totals.season);
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
    rows: collectRows().map((item) => ({
      decor: item.decor,
      count: item.count,
      color: item.color,
      friendship: item.friendship
    }))
  };
}

function saveState() {
  localStorage.setItem("pikminMushroomCalculatorV2", JSON.stringify(getState()));
}

function loadState() {
  try {
    const state = JSON.parse(localStorage.getItem("pikminMushroomCalculatorV2"));
    if (!state) return false;

    teamLimitEl.value = state.teamLimit ?? 40;
    seasonFlowerPowerEl.value = state.seasonFlowerPower ?? 5;
    unfedFlowerEl.value = state.unfedFlower ?? "leaf";
    decorBaseEl.value = state.decorBase ?? 4;
    bonusInputs.current.value = state.bonuses?.current ?? 0;
    bonusInputs.revival.value = state.bonuses?.revival ?? 0;
    bonusInputs.normal.value = state.bonuses?.normal ?? 0;

    for (const row of state.rows || []) createRow(row.decor || "normal", row);
    return Boolean((state.rows || []).length);
  } catch {
    return false;
  }
}

function setSampleRows() {
  for (const tbody of decorSectionsEl.querySelectorAll("tbody")) tbody.innerHTML = "";
  for (const row of SAMPLE_ROWS) createRow(row.decor, row);
  calculate();
}

function clearRows() {
  for (const tbody of decorSectionsEl.querySelectorAll("tbody")) tbody.innerHTML = "";
  localStorage.removeItem("pikminMushroomCalculatorV2");
  createRow("current", { count: 1, color: "ice", friendship: "red4" });
  calculate();
}

for (const decor of DECORS) createGroup(decor);

document.querySelector("#sampleRows").addEventListener("click", setSampleRows);
document.querySelector("#clearRows").addEventListener("click", clearRows);

for (const el of [teamLimitEl, seasonFlowerPowerEl, unfedFlowerEl, decorBaseEl, ...Object.values(bonusInputs)]) {
  el.addEventListener("input", calculate);
  el.addEventListener("change", calculate);
}

if (!loadState()) setSampleRows();
calculate();
