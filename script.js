const COLOR_POWER = {
  red: 4,
  yellow: 3,
  blue: 3,
  purple: 6,
  white: 2,
  winged: 2,
  rock: 5
};

const COLOR_LABEL = {
  red: "빨강",
  yellow: "노랑",
  blue: "파랑",
  purple: "보라",
  white: "하양",
  winged: "날개",
  rock: "바위"
};

const FRIENDSHIP_POWER = {
  red0: 0,
  red1: 1,
  red2: 2,
  red3: 3,
  red4: 4,
  gold1: 8,
  gold2: 12,
  gold3: 16,
  gold4: 20
};

const FRIENDSHIP_LABEL = {
  red0: "빨강하트 0",
  red1: "빨강하트 1",
  red2: "빨강하트 2",
  red3: "빨강하트 3",
  red4: "빨강하트 4",
  gold1: "골드하트 1",
  gold2: "골드하트 2",
  gold3: "골드하트 3",
  gold4: "골드하트 4"
};

const FLOWER_POWER = {
  bare: 0,
  leaf: 1,
  bud: 2,
  regular: 3,
  seasonal: 4,
  monthly: 5
};

const FLOWER_LABEL = {
  bare: "대머리",
  leaf: "잎사귀",
  bud: "봉우리",
  regular: "일반 꽃",
  seasonal: "계절 꽃",
  monthly: "이달의 꽃"
};

const DECOR_LABEL = {
  current: "현재시즌 데코",
  revival: "복각/작년 데코",
  normal: "일반 데코",
  none: "데코 없음"
};

const rowsEl = document.querySelector("#rows");
const rowTemplate = document.querySelector("#rowTemplate");
const targetFlowerEl = document.querySelector("#targetFlower");
const teamLimitEl = document.querySelector("#teamLimit");
const sortModeEl = document.querySelector("#sortMode");

const bonusInputs = {
  current: document.querySelector("#bonusCurrent"),
  revival: document.querySelector("#bonusRevival"),
  normal: document.querySelector("#bonusNormal")
};

const decorBaseEl = document.querySelector("#decorBase");

const output = {
  totalPower: document.querySelector("#totalPower"),
  totalCount: document.querySelector("#totalCount"),
  avgPower: document.querySelector("#avgPower"),
  currentPower: document.querySelector("#currentPower"),
  powerDiff: document.querySelector("#powerDiff"),
  categorySummary: document.querySelector("#categorySummary"),
  colorSummary: document.querySelector("#colorSummary"),
  topList: document.querySelector("#topList")
};

const SAMPLE_ROWS = [
  { count: 8, color: "purple", friendship: "gold4", flower: "seasonal", decor: "current" },
  { count: 10, color: "rock", friendship: "gold3", flower: "seasonal", decor: "current" },
  { count: 7, color: "red", friendship: "gold2", flower: "regular", decor: "revival" },
  { count: 9, color: "blue", friendship: "red4", flower: "bud", decor: "normal" },
  { count: 6, color: "yellow", friendship: "red4", flower: "leaf", decor: "none" }
];

function numberValue(el, fallback = 0) {
  const value = Number(el.value);
  return Number.isFinite(value) ? value : fallback;
}

function getDecorPower(decor) {
  if (decor === "none") return 0;
  const base = numberValue(decorBaseEl);
  const eventBonus = numberValue(bonusInputs[decor] || bonusInputs.normal);
  return base + eventBonus;
}

function getRowData(row) {
  const count = Math.max(0, Math.floor(numberValue(row.querySelector(".count"))));
  const color = row.querySelector(".color").value;
  const friendship = row.querySelector(".friendship").value;
  const currentFlower = row.querySelector(".flower").value;
  const decor = row.querySelector(".decor").value;
  const targetFlower = targetFlowerEl.value === "keep" ? currentFlower : targetFlowerEl.value;

  const eachCurrent = COLOR_POWER[color]
    + FRIENDSHIP_POWER[friendship]
    + FLOWER_POWER[currentFlower]
    + getDecorPower(decor);

  const eachTarget = COLOR_POWER[color]
    + FRIENDSHIP_POWER[friendship]
    + FLOWER_POWER[targetFlower]
    + getDecorPower(decor);

  return {
    count,
    color,
    friendship,
    currentFlower,
    targetFlower,
    decor,
    eachCurrent,
    eachTarget,
    totalCurrent: eachCurrent * count,
    totalTarget: eachTarget * count
  };
}

function setSelectValue(row, selector, value) {
  row.querySelector(selector).value = value;
}

function createRow(data = {}) {
  const fragment = rowTemplate.content.cloneNode(true);
  const row = fragment.querySelector("tr");

  row.querySelector(".count").value = data.count ?? 1;
  setSelectValue(row, ".color", data.color ?? "red");
  setSelectValue(row, ".friendship", data.friendship ?? "red4");
  setSelectValue(row, ".flower", data.flower ?? "monthly");
  setSelectValue(row, ".decor", data.decor ?? "normal");

  row.addEventListener("input", calculate);
  row.addEventListener("change", calculate);
  row.querySelector(".remove-row").addEventListener("click", () => {
    row.remove();
    if (!rowsEl.children.length) createRow();
    calculate();
  });

  rowsEl.appendChild(row);
  calculate();
}

function formatNumber(value) {
  return Math.round(value).toLocaleString("ko-KR");
}

function collectRows() {
  return Array.from(rowsEl.querySelectorAll("tr")).map(getRowData);
}

function summarize(items, key, labels) {
  return items.reduce((acc, item) => {
    const label = labels[item[key]];
    if (!acc[label]) acc[label] = { count: 0, power: 0 };
    acc[label].count += item.count;
    acc[label].power += item.totalTarget;
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
  const sorted = [...items].sort((a, b) => b.eachTarget - a.eachTarget);
  const limited = sorted.slice(0, 6);
  output.topList.innerHTML = "";

  if (!limited.length) {
    output.topList.innerHTML = "<li>입력 없음</li>";
    return;
  }

  for (const item of limited) {
    const li = document.createElement("li");
    li.innerHTML = `${COLOR_LABEL[item.color]} ${DECOR_LABEL[item.decor]} · ${item.count}마리 <strong>${item.eachTarget}</strong><span>${FRIENDSHIP_LABEL[item.friendship]}, ${FLOWER_LABEL[item.targetFlower]} 기준</span>`;
    output.topList.appendChild(li);
  }
}

function sortRows() {
  const mode = sortModeEl.value;
  if (mode === "input") return;

  const rows = Array.from(rowsEl.querySelectorAll("tr"));
  rows.sort((a, b) => {
    const aData = getRowData(a);
    const bData = getRowData(b);
    if (mode === "power") return bData.eachTarget - aData.eachTarget;
    if (mode === "category") return DECOR_LABEL[aData.decor].localeCompare(DECOR_LABEL[bData.decor], "ko");
    if (mode === "color") return COLOR_LABEL[aData.color].localeCompare(COLOR_LABEL[bData.color], "ko");
    return 0;
  });
  for (const row of rows) rowsEl.appendChild(row);
}

function calculate() {
  const items = collectRows();
  const totalCount = items.reduce((sum, item) => sum + item.count, 0);
  const totalTarget = items.reduce((sum, item) => sum + item.totalTarget, 0);
  const limit = Math.max(1, Math.floor(numberValue(teamLimitEl, 40)));
  const selectedCount = Math.min(totalCount, limit);
  const expanded = items.flatMap((item) => (
    Array.from({ length: item.count }, () => ({
      current: item.eachCurrent,
      target: item.eachTarget
    }))
  ));
  const bestLimitedTarget = expanded
    .map((item) => item.target)
    .sort((a, b) => b - a)
    .slice(0, limit)
    .reduce((sum, value) => sum + value, 0);
  const bestLimitedCurrent = expanded
    .map((item) => item.current)
    .sort((a, b) => b - a)
    .slice(0, limit)
    .reduce((sum, value) => sum + value, 0);
  const average = selectedCount ? bestLimitedTarget / selectedCount : 0;

  for (const row of rowsEl.querySelectorAll("tr")) {
    const data = getRowData(row);
    row.querySelector(".each-power").textContent = formatNumber(data.eachTarget);
    row.querySelector(".row-total").textContent = formatNumber(data.totalTarget);
  }

  output.totalPower.textContent = formatNumber(bestLimitedTarget);
  output.totalCount.textContent = formatNumber(totalCount);
  output.avgPower.textContent = average.toFixed(1);
  output.currentPower.textContent = formatNumber(bestLimitedCurrent);
  output.powerDiff.textContent = `${bestLimitedTarget - bestLimitedCurrent >= 0 ? "+" : ""}${formatNumber(bestLimitedTarget - bestLimitedCurrent)}`;

  const allLabel = bestLimitedTarget === totalTarget ? "" : ` · 전체 입력 합계 ${formatNumber(totalTarget)}`;
  output.totalPower.setAttribute("title", `상위 ${selectedCount}마리 ${formatNumber(bestLimitedTarget)}${allLabel}`);

  renderSummary(output.categorySummary, summarize(items, "decor", DECOR_LABEL));
  renderSummary(output.colorSummary, summarize(items, "color", COLOR_LABEL));
  renderTopList(items);
  saveState();
}

function getState() {
  return {
    targetFlower: targetFlowerEl.value,
    teamLimit: teamLimitEl.value,
    sortMode: sortModeEl.value,
    decorBase: decorBaseEl.value,
    bonuses: {
      current: bonusInputs.current.value,
      revival: bonusInputs.revival.value,
      normal: bonusInputs.normal.value
    },
    rows: Array.from(rowsEl.querySelectorAll("tr")).map((row) => ({
      count: row.querySelector(".count").value,
      color: row.querySelector(".color").value,
      friendship: row.querySelector(".friendship").value,
      flower: row.querySelector(".flower").value,
      decor: row.querySelector(".decor").value
    }))
  };
}

function saveState() {
  localStorage.setItem("pikminMushroomCalculator", JSON.stringify(getState()));
}

function loadState() {
  try {
    const state = JSON.parse(localStorage.getItem("pikminMushroomCalculator"));
    if (!state) return false;

    targetFlowerEl.value = state.targetFlower ?? "monthly";
    teamLimitEl.value = state.teamLimit ?? 40;
    sortModeEl.value = state.sortMode ?? "input";
    decorBaseEl.value = state.decorBase ?? 4;
    bonusInputs.current.value = state.bonuses?.current ?? 0;
    bonusInputs.revival.value = state.bonuses?.revival ?? 0;
    bonusInputs.normal.value = state.bonuses?.normal ?? 0;

    rowsEl.innerHTML = "";
    for (const row of state.rows || []) createRow(row);
    return Boolean(rowsEl.children.length);
  } catch {
    return false;
  }
}

function setSampleRows() {
  rowsEl.innerHTML = "";
  for (const row of SAMPLE_ROWS) createRow(row);
  calculate();
}

document.querySelector("#addRow").addEventListener("click", () => createRow());
document.querySelector("#sampleRows").addEventListener("click", setSampleRows);
document.querySelector("#clearRows").addEventListener("click", () => {
  rowsEl.innerHTML = "";
  localStorage.removeItem("pikminMushroomCalculator");
  createRow();
});

for (const el of [targetFlowerEl, teamLimitEl, sortModeEl, decorBaseEl, ...Object.values(bonusInputs)]) {
  el.addEventListener("input", () => {
    if (el === sortModeEl) sortRows();
    calculate();
  });
  el.addEventListener("change", () => {
    if (el === sortModeEl) sortRows();
    calculate();
  });
}

if (!loadState()) {
  setSampleRows();
}

calculate();
