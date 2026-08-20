const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const sourcePath = path.join(root, "docs/archive/world-foundation-content-rules-spec.md");
const outputDir = path.join(root, "wiki/content");
const lines = fs.readFileSync(sourcePath, "utf8").split("\n");

const pages = [
  ["00-overview.md", "世界总览与核心循环", 0, 88],
  ["01-runtime-rules.md", "行动、精力与裁定边界", 88, 340],
  ["02-world-map-time.md", "世界地图、地点与时间", 340, 465],
  ["03-character-skills.md", "动物、性格与统一 Skill", 465, 811],
  ["04-professions-magic.md", "职业与魔法学习", 811, 1114],
  ["05-resources-items.md", "资源、物品、食物与药水", 1114, 1414],
  ["06-home-facilities.md", "小屋、设施与建设进度", 1414, 1721],
  ["07-events-mvp-decisions.md", "事件、MVP 与决策记录", 1721, lines.length],
];

const addenda = {
  "02-world-map-time.md": [
    "## 世界时间基准（已确认）",
    "",
    "- `1 TU = 10 分钟`世界时间，是 Activity、Travel、学习、制作、休息与事件推进的共同最小结算单位。",
    "- 世界采用全局同步时钟；同一时刻参与同一事件的魔法使共享相同的开始时间、经过 TU 与结束时间。",
    "- Calendar、地点开放、可用性、路程和预约都读取同一套世界时间，不允许各 Agent 分别拥有互相矛盾的“当前时间”。",
    "- Engine 负责计算和提交 TU；Agent 只从计划简报读取准确成本，不自行估算或改写时间。",
    "- 一段 Activity 可以跨多个 TU，但每个 TU 结束时都要提交位置、精力、状态、库存和 Calendar 变化，以便其他系统看到一致世界状态。",
    "",
  ].join("\n"),
};

fs.mkdirSync(outputDir, { recursive: true });

for (const [filename, title, start, end] of pages) {
  const excerpt = lines.slice(start, end).join("\n").replace(/^# 魔法使群岛[^\n]*\n+/, "");
  const notice = [
    `# ${title}`,
    "",
    "> 迁移状态：从讨论稿按主题拆分。保留原始措辞与确认状态，待逐页审计后再删除或合并内容。",
    "",
  ].join("\n");
  const addendum = addenda[filename] || "";
  fs.writeFileSync(path.join(outputDir, filename), `${notice}${addendum}${excerpt.trim()}\n`, "utf8");
}

console.log(`Migrated ${pages.length} pages to ${outputDir}`);
