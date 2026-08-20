const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");

const bundledModules = path.join(os.homedir(), ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules");
process.env.NODE_PATH = [process.env.NODE_PATH, bundledModules].filter(Boolean).join(path.delimiter);
Module._initPaths();

const { marked } = require("marked");
const root = path.resolve(__dirname, "..");
const contentDir = path.join(__dirname, "content");
const legacyMode = process.argv.includes("--legacy");

const pageMeta = [
  ["00-overview.md", "overview", "总览与核心循环", "产品原则、体验支柱与每日宏观指令"],
  ["11-mvp-a2a-vertical-slice.md", "mvp-a2a", "A2A 纵切 MVP", "四时段、交换、委托、拜访、邀约与共享记忆"],
  ["01-runtime-rules.md", "runtime-rules", "行动与裁定", "非战斗规则、精力、Skill 与 LLM Judge 边界"],
  ["02-world-map-time.md", "world-map-time", "地图与时间", "中心城镇、传送门广场、区域与 Travel TU"],
  ["03-character-skills.md", "character-skills", "动物、性格与 Skill", "六种动物、16 种性格与 57 个统一 Skill"],
  ["04-professions-magic.md", "professions-magic", "职业与魔法", "六种职业、认证与基础魔法学习"],
  ["05-resources-items.md", "resources-items", "资源与物品", "材料、植物、魔物素材、食物与药水"],
  ["06-home-facilities.md", "home-facilities", "小屋与设施", "家园构件、功能设施与建造进度"],
  ["07-events-mvp-decisions.md", "events-decisions", "事件与决策", "事件模板、MVP 边界和完整决策记录"],
  ["08-agent-planning-memory.md", "agent-planning", "Agent 计划与记忆", "单一目标、每日计划、最小简报与记忆分层"],
  ["09-backpack.md", "backpack", "背包装备", "容量、堆叠、地点缓存与升级配方"],
  ["10-skill-audit.md", "skill-audit", "Skill 精简审计", "先完整保留，再逐项讨论合并、延期或删除"],
];

const activePageMeta = legacyMode
  ? pageMeta.filter(([filename]) => filename !== "11-mvp-a2a-vertical-slice.md")
  : pageMeta;

const currentMvpSummary = `执行基线已经收敛到《A2A 纵切 MVP》：第一版采用四时段制，完整验证偶遇、交换、委托、拜访、邀约、合作事件与共享记忆。本文下方的完整决策记录继续作为长期世界候选，不再全部构成 MVP 前置。

第一版明确只实现六种动物外形、四种性格倾向、三种社会专长、四类地点、三种普通材料、三种固定成品、三档关系状态和一个双 Pet 合作事件。57 个 Skill、正式职业认证、连续 TU、三级物品/设施目录和货币市场均延期。`;
const originalMvpSummary = "待讨论：第一版精确数量、明确不做内容、后续扩展接口。";

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const slugify = (text) => text
  .trim()
  .toLocaleLowerCase("zh-CN")
  .replace(/[\s/]+/g, "-")
  .replace(/[^\p{Letter}\p{Number}-]+/gu, "")
  .replace(/-+/g, "-")
  .replace(/^-|-$/g, "") || "section";

const plainTextFromHtml = (value) => value
  .replace(/<[^>]+>/g, "")
  .replaceAll("&amp;", "&")
  .replaceAll("&lt;", "<")
  .replaceAll("&gt;", ">")
  .replaceAll("&quot;", '"')
  .trim();

const addResponsiveTableLabels = (html) => html.replace(/<table>[\s\S]*?<\/table>/g, (tableHtml) => {
  const headers = [...tableHtml.matchAll(/<th(?:\s[^>]*)?>([\s\S]*?)<\/th>/g)]
    .map((match) => plainTextFromHtml(match[1]));

  if (!headers.length) return tableHtml;

  return tableHtml.replace(/<tr>([\s\S]*?)<\/tr>/g, (rowHtml) => {
    if (!rowHtml.includes("<td")) return rowHtml;

    let columnIndex = 0;
    return rowHtml.replace(/<td([^>]*)>/g, (_cell, attributes) => {
      const label = headers[columnIndex] || `第 ${columnIndex + 1} 列`;
      columnIndex += 1;
      return `<td${attributes} data-label="${escapeHtml(label)}">`;
    });
  });
});

const searchEntries = [];

const pages = activePageMeta.map(([filename, slug, label, summary]) => {
  const currentSource = fs.readFileSync(path.join(contentDir, filename), "utf8");
  const source = legacyMode && filename === "07-events-mvp-decisions.md"
    ? currentSource.replace(currentMvpSummary, originalMvpSummary)
    : currentSource;
  const renderer = new marked.Renderer();
  const used = new Map();

  renderer.heading = ({ tokens, depth }) => {
    const text = renderer.parser.parseInline(tokens);
    const plain = tokens.map((token) => token.text || token.raw || "").join("").trim();
    const base = `${slug}-${slugify(plain)}`;
    const count = used.get(base) || 0;
    used.set(base, count + 1);
    const id = count ? `${base}-${count + 1}` : base;
    const level = Math.min(depth + 1, 4);
    searchEntries.push({ title: plain, meta: label, target: id, text: `${plain} ${label} ${summary}` });
    return `<h${level} id="${id}">${text}</h${level}>`;
  };

  searchEntries.push({ title: label, meta: summary, target: slug, text: `${label} ${summary} ${source}` });
  const html = marked.parse(source, { gfm: true, renderer });
  return { slug, label, summary, html: addResponsiveTableLabels(html) };
});

const auditRows = [
  ["热量操控 / 冷却凝霜", "merge", "建议合并", "温度方向能否由来源限制表达"],
  ["远距观察 / 细节观察", "review", "建议复核", "距离边界是否产生足够玩法"],
  ["平衡移动 / 复杂地形行进", "review", "建议复核", "路线事件中是否经常重复"],
  ["追踪 / 搜寻", "review", "建议复核", "连续痕迹与区域搜索是否需要分开"],
  ["急救 / 治愈", "review", "建议复核", "现场稳定与正式恢复边界"],
  ["生命感知", "defer", "延期候选", "MVP 暂无必须场景"],
  ["记忆读取", "defer", "延期候选", "隐私和内容边界仍需设计"],
  ["梦境行走", "defer", "延期候选", "尚无确认的梦境内容"],
  ["占察", "defer", "延期候选", "提示生成尚未接入确定性世界状态"],
  ["短距转移", "defer", "延期候选", "可能绕过路线和机关"],
  ["附魔", "defer", "延期候选", "尚无成品和符文目录"],
  ["挖掘", "defer", "延期候选", "当前地图事件密度不足"],
];

const nav = pages.map((page) => `<li><a class="nav-link" href="#${page.slug}">${escapeHtml(page.label)}</a></li>`).join("\n");
const toc = pages.map((page, index) => `<li><a class="toc-link" href="#${page.slug}"${index === 0 ? ' aria-current="location"' : ""}>${escapeHtml(page.label)}</a></li>`).join("\n");
const content = pages.map((page) => `<section class="wiki-page" id="${page.slug}" data-wiki-page>
  <p class="page-kicker">${escapeHtml(page.summary)}</p>
  ${page.html}
</section>`).join("\n");
const searchResults = searchEntries.map((entry, index) => `<li><a class="search-result" id="search-option-${index + 1}" role="option" data-search-item data-search-text="${escapeHtml(entry.text)}" href="#${entry.target}"><span class="search-result__title">${escapeHtml(entry.title)}</span><span class="search-result__meta">${escapeHtml(entry.meta)}</span></a></li>`).join("\n");
const auditTableRows = auditRows.map(([name, status, label, question]) => `<tr data-audit-status="${status}"><td data-label="Skill">${escapeHtml(name)}</td><td data-label="状态"><span class="status-badge status-badge--${status === "merge" ? "merge" : status === "defer" ? "defer" : "keep"}">${escapeHtml(label)}</span></td><td data-label="复核问题" class="table-note">${escapeHtml(question)}</td><td data-label="本轮处理">完整保留</td></tr>`).join("\n");

const documentHtml = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="魔法使群岛世界基础内容与规则 Wiki。">
  <title>世界基础内容与规则 · 魔法使群岛 Wiki</title>
  <link rel="stylesheet" href="src/styles.css">
</head>
<body>
  <a class="skip-link" href="#main-content">跳到主要内容</a>
  <div class="app-shell">
    <aside class="sidebar" data-sidebar data-open="false" aria-label="Wiki 导航">
      <div class="brand"><p class="brand__title">魔法使群岛</p><span class="brand__meta">规则与内容 Wiki</span></div>
      <nav aria-label="主要页面"><ul class="nav-list">${nav}</ul></nav>
      <div class="sidebar__footer"><p>基础世界规格 · v0.1</p><button class="button" type="button" data-menu-close>关闭导航</button></div>
    </aside>
    <button class="mobile-scrim" type="button" data-nav-scrim hidden aria-label="关闭导航"></button>
    <div class="main-shell">
      <header class="topbar">
        <button class="menu-button" type="button" data-menu-open aria-expanded="false" aria-label="打开导航"><svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5h14M3 10h14M3 15h14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg></button>
        <button class="search-trigger" type="button" data-search-open><svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m13 13 4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg><span class="search-trigger__label">搜索规则、物品或决策</span><kbd class="shortcut">Ctrl K</kbd></button>
      </header>
      <div class="main-scroll" id="main-content" tabindex="-1">
        <div class="page-layout">
          <main class="article">
            <header class="article-header">
              <p class="eyebrow">WORLD FOUNDATION · MODULAR WIKI</p>
              <h1>世界基础内容与规则</h1>
              <p class="article-header__lead">把世界地图、角色能力、职业、物品、家园和 Agent 决策放进同一套可检索规格。原讨论稿保持不变，本 Wiki 用于逐页审计。</p>
              <div class="summary-grid">
                <article class="summary-tile"><span class="summary-tile__label">主题页面</span><strong class="summary-tile__value">${pages.length}</strong></article>
                <article class="summary-tile"><span class="summary-tile__label">统一 Skill</span><strong class="summary-tile__value">57</strong></article>
                <article class="summary-tile"><span class="summary-tile__label">优先复核</span><strong class="summary-tile__value">${auditRows.length}</strong></article>
              </div>
            </header>
            <section class="audit-dashboard" aria-labelledby="audit-dashboard-title">
              <h2 id="audit-dashboard-title">Skill 审计入口</h2>
              <p>本轮只建立复核清单，不直接删除。选择状态可以快速查看待讨论项。</p>
              <div class="filter-group" aria-label="技能状态筛选">
                <button class="filter-chip" type="button" data-filter="all" aria-pressed="true">全部</button>
                <button class="filter-chip" type="button" data-filter="merge" aria-pressed="false">建议合并</button>
                <button class="filter-chip" type="button" data-filter="review" aria-pressed="false">建议复核</button>
                <button class="filter-chip" type="button" data-filter="defer" aria-pressed="false">延期候选</button>
              </div>
              <div class="live-region" aria-live="polite" data-filter-live></div>
              <div class="table-frame audit-preview"><table><caption>优先审计的 12 个 Skill 或相邻组合。</caption><thead><tr><th>Skill</th><th>状态</th><th>复核问题</th><th>本轮处理</th></tr></thead><tbody>${auditTableRows}</tbody></table></div>
            </section>
            ${content}
          </main>
          <aside class="toc" aria-label="主题页面"><p class="toc__title">主题页面</p><ul class="toc-list">${toc}</ul></aside>
        </div>
      </div>
    </div>
  </div>
  <div class="search-dialog" data-search-dialog role="dialog" aria-modal="true" aria-label="搜索 Wiki" hidden>
    <div class="search-panel">
      <div class="search-field"><svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m13 13 4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg><input data-search-input role="combobox" aria-label="搜索规则、物品或决策" aria-expanded="true" aria-controls="search-list" aria-autocomplete="list" placeholder="搜索规则、物品或决策"><button class="icon-button" type="button" data-search-close aria-label="关闭搜索">关闭</button></div>
      <ul class="search-results" id="search-list" role="listbox" aria-label="搜索结果">${searchResults}</ul>
      <div class="search-empty" data-search-empty hidden>没有找到相关内容。请尝试更短的关键词。</div>
    </div>
  </div>
  <script src="src/ui.js"></script>
  <script src="src/wiki.js"></script>
</body>
</html>`;

const outputName = legacyMode ? "index-original.html" : "index.html";
fs.writeFileSync(path.join(__dirname, outputName), documentHtml, "utf8");
console.log(`Built wiki/${outputName} with ${pages.length} pages and ${searchEntries.length} search entries.`);
