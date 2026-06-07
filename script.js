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
const EVENT_BONUS_DEFAULTS = {
  current: 300,
  revival: 100,
  normal: 0,
  decorBase: 4
};

const decorSectionsEl = document.querySelector("#decorSections");
const groupTemplate = document.querySelector("#groupTemplate");
const rowTemplate = document.querySelector("#rowTemplate");
const teamLimitEl = document.querySelector("#teamLimit");
const seasonFlowerPowerEl = document.querySelector("#seasonFlowerPower");
const unfedFlowerEl = document.querySelector("#unfedFlower");
const decorBaseEl = document.querySelector("#decorBase");
const aiPromptEl = document.querySelector("#aiPrompt");
const aiTextEl = document.querySelector("#aiText");
const importResetEl = document.querySelector("#importReset");
const importStatusEl = document.querySelector("#importStatus");

const bonusInputs = {
  current: document.querySelector("#bonusCurrent"),
  revival: document.querySelector("#bonusRevival"),
  normal: document.querySelector("#bonusNormal")
};

const output = {
  totalPower: document.querySelector("#totalPower"),
  powerComment: document.querySelector("#powerComment"),
  showComment: document.querySelector("#showComment"),
  shareResult: document.querySelector("#shareResult"),
  shareStatus: document.querySelector("#shareStatus"),
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
let lastTotals = emptyScenarioTotals();

const AI_PROMPT = `이 피크민 블룸 스크린샷을 보고 아래 형식으로만 정리해줘.
설명은 쓰지 말고 코드블록 안에 줄 단위 CSV로 출력해.

형식:
데코분류,색상,하트단계,마릿수

데코분류는 현재시즌/시즌서브/일반/비데코 중 하나만 사용해.
색상은 보라/바위/빨강/파랑/노랑/하양/핑크/얼음 중 하나만 사용해.
하트단계는 빨0/빨1/빨2/빨3/빨4/노1/노2/노3/노4 중 하나만 사용해.

데코분류 기준:
- 현재시즌: 2026년 6월 현재 이벤트 데코인 Flower Crown/꽃관/화관/플라워 크라운 데코.
- 시즌서브: 이번 시즌버섯에서 보너스를 받는 복각/작년 데코. Surfboard Keychain/서프보드 키체인, Puzzle 2022 Summer Memories, Puzzle 2023 Summer Memories가 여기에 해당.
- 일반: 데코는 있지만 이번 시즌버섯 보너스 대상이 아닌 피크민.
- 비데코: 데코 아이콘이나 장식이 없는 피크민.
- 분류가 애매하면 현재시즌으로 추정하지 말고 일반으로 출력해.

같은 데코분류+색상+하트단계는 합쳐서 한 줄로 출력해.
화면에서 확실히 보이는 피크민만 세고, 잘 안 보이거나 확실하지 않은 항목은 제외해.
출력 예시는 아래처럼 해.

현재시즌,보라,노4,8
현재시즌,바위,노3,10
시즌서브,빨강,노2,7
일반,파랑,빨4,9
비데코,노랑,빨4,6`;

const DECOR_ALIASES = {
  "현재시즌": "current",
  "현재시즌데코": "current",
  "시즌": "current",
  "시즌데코": "current",
  "현재": "current",
  "꽃관": "current",
  "화관": "current",
  "플라워크라운": "current",
  "flowercrown": "current",
  "current": "current",
  "시즌서브": "revival",
  "시즌서브데코": "revival",
  "서브시즌": "revival",
  "서브시즌데코": "revival",
  "시즌복각": "revival",
  "시즌복각데코": "revival",
  "복각": "revival",
  "복각데코": "revival",
  "서브": "revival",
  "서프보드": "revival",
  "서프보드키체인": "revival",
  "surfboardkeychain": "revival",
  "퍼즐": "revival",
  "퍼즐2022": "revival",
  "퍼즐2023": "revival",
  "puzzle2022summermemories": "revival",
  "puzzle2023summermemories": "revival",
  "revival": "revival",
  "일반": "normal",
  "일반데코": "normal",
  "normal": "normal",
  "비데코": "none",
  "데코없음": "none",
  "없음": "none",
  "노데코": "none",
  "none": "none"
};

const COLOR_ALIASES = {
  "보라": "purple",
  "보": "purple",
  "purple": "purple",
  "바위": "rock",
  "바": "rock",
  "rock": "rock",
  "빨강": "red",
  "빨": "red",
  "red": "red",
  "파랑": "blue",
  "파": "blue",
  "blue": "blue",
  "노랑": "yellow",
  "노": "yellow",
  "yellow": "yellow",
  "하양": "white",
  "흰": "white",
  "흰색": "white",
  "white": "white",
  "핑크": "winged",
  "날개": "winged",
  "분홍": "winged",
  "winged": "winged",
  "얼음": "ice",
  "얼": "ice",
  "ice": "ice"
};

const HEART_ALIASES = {
  "빨0": "red0",
  "빨강0": "red0",
  "빨강하트0": "red0",
  "red0": "red0",
  "빨1": "red1",
  "빨강1": "red1",
  "빨강하트1": "red1",
  "red1": "red1",
  "빨2": "red2",
  "빨강2": "red2",
  "빨강하트2": "red2",
  "red2": "red2",
  "빨3": "red3",
  "빨강3": "red3",
  "빨강하트3": "red3",
  "red3": "red3",
  "빨4": "red4",
  "빨강4": "red4",
  "빨강하트4": "red4",
  "red4": "red4",
  "노1": "yellow1",
  "노랑1": "yellow1",
  "노랑하트1": "yellow1",
  "yellow1": "yellow1",
  "노2": "yellow2",
  "노랑2": "yellow2",
  "노랑하트2": "yellow2",
  "yellow2": "yellow2",
  "노3": "yellow3",
  "노랑3": "yellow3",
  "노랑하트3": "yellow3",
  "yellow3": "yellow3",
  "노4": "yellow4",
  "노랑4": "yellow4",
  "노랑하트4": "yellow4",
  "yellow4": "yellow4"
};

function numberValue(el, fallback = 0) {
  const value = Number(el.value);
  return Number.isFinite(value) ? value : fallback;
}

function formatNumber(value) {
  return Math.round(value).toLocaleString("ko-KR");
}

function normalizeToken(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[(){}\[\]·ㆍ._-]/g, "");
}

function getDecorAlias(value) {
  const token = normalizeToken(value);
  if (DECOR_ALIASES[token]) return DECOR_ALIASES[token];
  if (/비데코|데코없|노데코|없음|none/.test(token)) return "none";
  if (/서브|복각|리바이벌|revival|서프|surf|퍼즐|puzzle|작년/.test(token)) return "revival";
  if (/꽃관|화관|플라워크라운|flowercrown|현재|current/.test(token)) return "current";
  if (/일반|normal/.test(token)) return "normal";
  return null;
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

function createHeartSlot(row, friendshipId, value = 0) {
  const existing = row.querySelector(`[data-heart="${friendshipId}"]`);
  if (existing) {
    existing.value = value;
    existing.focus();
    return existing;
  }

  const friendship = FRIENDSHIP_BY_ID[friendshipId];
  if (!friendship) return null;

  const slot = document.createElement("label");
  slot.className = "heart-slot";
  slot.innerHTML = `
    <span>${friendship.short}</span>
    <input class="heart-count" data-heart="${friendship.id}" type="number" min="0" max="100" step="1" value="${value}" aria-label="${friendship.label} 마리">
    <button class="remove-heart" type="button" aria-label="${friendship.label} 입력 제거">×</button>
  `;

  slot.querySelector(".remove-heart").addEventListener("click", () => {
    slot.remove();
    calculate();
  });

  row.querySelector(".heart-slots").appendChild(slot);
  const input = slot.querySelector(".heart-count");
  input.focus();
  return input;
}

function setHeartCount(row, friendshipId, value) {
  if (value <= 0) {
    row.querySelector(`[data-heart="${friendshipId}"]`)?.closest(".heart-slot")?.remove();
    return;
  }
  createHeartSlot(row, friendshipId, value);
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
  const row = fragment.querySelector(".color-row");
  const color = COLOR_BY_ID[colorId];

  row.dataset.color = colorId;
  row.querySelector(".color-label").textContent = `${color.label} (+${color.power})`;
  const heartSelect = row.querySelector(".heart-select");
  for (const friendship of FRIENDSHIPS) {
    const option = document.createElement("option");
    option.value = friendship.id;
    option.textContent = friendship.short;
    heartSelect.appendChild(option);
  }
  row.querySelector(".add-heart").addEventListener("click", () => {
    createHeartSlot(row, heartSelect.value, 0);
  });
  row.addEventListener("input", calculate);
  row.addEventListener("change", calculate);

  group.querySelector(".color-rows").appendChild(row);
}

function collectRows() {
  return Array.from(decorSectionsEl.querySelectorAll(".color-row")).map(getRowData);
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
  lastTotals = totals;

  for (const row of decorSectionsEl.querySelectorAll(".color-row")) {
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

function buildShareText() {
  const items = collectRows();
  const count = totalCount(items);
  const limit = Math.max(1, Math.floor(numberValue(teamLimitEl, 40)));
  const url = location.href.split("?")[0];
  return [
    "피크민 버섯 투력 계산 결과",
    `시즌꽃: ${formatNumber(lastTotals.season)}`,
    `일반꽃: ${formatNumber(lastTotals.regular)}`,
    `안줌: ${formatNumber(lastTotals.unfed)}`,
    `탈모: ${formatNumber(lastTotals.bare)}`,
    `기준: 상위 ${Math.min(count, limit)}마리 / 입력 ${count}마리`,
    `보너스: 현재시즌 +${numberValue(bonusInputs.current, 0)} / 복각 +${numberValue(bonusInputs.revival, 0)} / 일반 +${numberValue(bonusInputs.normal, 0)} / 데코기본 +${numberValue(decorBaseEl, 4)}`,
    getPowerComment(lastTotals.season),
    url
  ].join("\n");
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

async function shareResult() {
  const text = buildShareText();
  try {
    if (navigator.share) {
      await navigator.share({ title: "피크민 버섯 투력 계산 결과", text });
      output.shareStatus.textContent = "공유 화면을 열었습니다.";
    } else {
      await copyText(text);
      output.shareStatus.textContent = "결과를 복사했습니다.";
    }
    output.shareStatus.className = "share-status ok";
  } catch {
    output.shareStatus.textContent = "공유가 취소되었거나 복사하지 못했습니다.";
    output.shareStatus.className = "share-status warn";
  }
}

function getState() {
  return {
    version: 6,
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
    const savedBonuses = state.bonuses || {};
    const hasLegacyZeroBonuses = !state.version
      && Number(savedBonuses.current ?? 0) === 0
      && Number(savedBonuses.revival ?? 0) === 0
      && Number(savedBonuses.normal ?? 0) === 0;

    teamLimitEl.value = state.teamLimit ?? 40;
    seasonFlowerPowerEl.value = state.seasonFlowerPower ?? 5;
    unfedFlowerEl.value = state.unfedFlower ?? "leaf";
    decorBaseEl.value = state.decorBase ?? EVENT_BONUS_DEFAULTS.decorBase;
    bonusInputs.current.value = hasLegacyZeroBonuses ? EVENT_BONUS_DEFAULTS.current : savedBonuses.current ?? EVENT_BONUS_DEFAULTS.current;
    bonusInputs.revival.value = hasLegacyZeroBonuses ? EVENT_BONUS_DEFAULTS.revival : savedBonuses.revival ?? EVENT_BONUS_DEFAULTS.revival;
    bonusInputs.normal.value = savedBonuses.normal ?? EVENT_BONUS_DEFAULTS.normal;

    applyRows(state.rows || []);
    applyCollapsed(state.collapsed || {});
    return Boolean((state.rows || []).length);
  } catch {
    return false;
  }
}

function applyRows(rows) {
  for (const data of rows) {
    const row = decorSectionsEl.querySelector(`[data-decor="${data.decor || "normal"}"] .color-row[data-color="${data.color || "red"}"]`);
    if (!row) continue;
    for (const friendship of FRIENDSHIPS) {
      setHeartCount(row, friendship.id, data.counts?.[friendship.id] ?? 0);
    }
  }
}

function parseAiLine(line) {
  const cleaned = line
    .replace(/^[-*]\s*/, "")
    .replace(/^`+|`+$/g, "")
    .trim();
  if (!cleaned || cleaned.startsWith("#")) return null;
  if (/^데코분류|^decor/i.test(cleaned)) return null;

  const parts = cleaned.split(/[,\t|]+/).map((part) => part.trim()).filter(Boolean);
  if (parts.length !== 4) {
    throw new Error("형식은 데코분류,색상,하트단계,마릿수 입니다");
  }

  const decor = getDecorAlias(parts[0]);
  const color = COLOR_ALIASES[normalizeToken(parts[1])];
  const heart = HEART_ALIASES[normalizeToken(parts[2])];
  const count = Number(parts[3].replace(/[^\d.-]/g, ""));

  if (!decor) throw new Error(`알 수 없는 데코분류: ${parts[0]}`);
  if (!color) throw new Error(`알 수 없는 색상: ${parts[1]}`);
  if (!heart) throw new Error(`알 수 없는 하트단계: ${parts[2]}`);
  if (!Number.isFinite(count) || count < 0) throw new Error(`마릿수가 올바르지 않음: ${parts[3]}`);

  return { decor, color, heart, count: Math.floor(count) };
}

function applyAiText() {
  const lines = aiTextEl.value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("```"));
  const parsed = [];
  const errors = [];

  for (const [index, line] of lines.entries()) {
    try {
      const item = parseAiLine(line);
      if (item) parsed.push(item);
    } catch (error) {
      errors.push(`${index + 1}행: ${error.message}`);
    }
  }

  if (!parsed.length) {
    importStatusEl.textContent = errors.length ? errors.slice(0, 3).join(" / ") : "반영할 줄이 없습니다.";
    importStatusEl.className = "import-status error";
    return;
  }

  if (importResetEl.checked) resetRows();

  for (const item of parsed) {
    const row = decorSectionsEl.querySelector(`[data-decor="${item.decor}"] .color-row[data-color="${item.color}"]`);
    if (!row) continue;
    const input = row.querySelector(`[data-heart="${item.heart}"]`);
    setHeartCount(row, item.heart, numberValue(input, 0) + item.count);
  }

  calculate();
  const suffix = errors.length ? ` 오류 ${errors.length}개: ${errors.slice(0, 2).join(" / ")}` : "";
  importStatusEl.textContent = `${parsed.length}줄을 반영했습니다.${suffix}`;
  importStatusEl.className = errors.length ? "import-status warn" : "import-status ok";
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
  applyEventBonusDefaults();
  resetRows();
  applyCollapsed({});
  calculate();
}

function resetRows() {
  for (const row of decorSectionsEl.querySelectorAll(".color-row")) {
    row.querySelector(".heart-slots").innerHTML = "";
  }
}

function applyEventBonusDefaults() {
  bonusInputs.current.value = EVENT_BONUS_DEFAULTS.current;
  bonusInputs.revival.value = EVENT_BONUS_DEFAULTS.revival;
  bonusInputs.normal.value = EVENT_BONUS_DEFAULTS.normal;
  decorBaseEl.value = EVENT_BONUS_DEFAULTS.decorBase;
}

for (const decor of DECORS) createGroup(decor);

applyEventBonusDefaults();
aiPromptEl.value = AI_PROMPT;
document.querySelector("#sampleRows").addEventListener("click", setSampleRows);
document.querySelector("#clearRows").addEventListener("click", clearRows);
document.querySelector("#applyAiText").addEventListener("click", applyAiText);
document.querySelector("#clearAiText").addEventListener("click", () => {
  aiTextEl.value = "";
  importStatusEl.textContent = "";
  importStatusEl.className = "import-status";
});
document.querySelector("#copyPrompt").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(AI_PROMPT);
    importStatusEl.textContent = "프롬프트를 복사했습니다.";
    importStatusEl.className = "import-status ok";
  } catch {
    aiPromptEl.select();
    importStatusEl.textContent = "복사가 막혔습니다. 프롬프트 영역을 직접 복사해 주세요.";
    importStatusEl.className = "import-status warn";
  }
});
output.showComment.addEventListener("click", () => {
  output.powerComment.hidden = !output.powerComment.hidden;
  output.showComment.textContent = output.powerComment.hidden ? "결과 확인" : "결과 숨기기";
});
output.shareResult.addEventListener("click", shareResult);

for (const el of [teamLimitEl, seasonFlowerPowerEl, unfedFlowerEl, decorBaseEl, ...Object.values(bonusInputs)]) {
  el.addEventListener("input", calculate);
  el.addEventListener("change", calculate);
}

if (!loadState()) resetRows();
calculate();
