# 魔法使群岛规则 Wiki

## 文件结构

- `content/`：可独立讨论和修改的中文 Markdown 规格页。
- `content/11-mvp-a2a-vertical-slice.md`：当前可执行的 MVP 基线，其他长期规则不得成为其上线前置。
- `index.html`：当前四时段 A2A MVP 版 Wiki。
- `index-original.html`：重建的原始 11 页世界设计版；不包含 A2A 纵切 MVP 页面，也恢复原先的 MVP“待讨论”状态。它是内容级复原，不是修改前文件的字节级备份。
- `src/`：Wiki 的设计系统、搜索、筛选与目录交互。
- `scripts/migrate-content.cjs`：从原讨论稿重新切分八个迁移页；只在需要重做迁移时运行。
- `build-wiki.cjs`：把全部内容页重新生成到 `index.html`。
- `showcase.html`：设计系统组件展示与响应式验收页，不是正式内容。

原始讨论稿位于 `../docs/archive/world-foundation-content-rules-spec.md`，作为迁移快照保留，不在 Wiki 修改过程中同步覆盖。

## 编辑约定

1. MVP 范围、时间与 A2A 纵切优先修改 `content/11-mvp-a2a-vertical-slice.md`；长期候选再修改对应主题页。
2. Skill 的删除或合并先记录到 `10-skill-audit.md`，确认后再同步修改所有引用。
3. 在项目根目录运行 `node wiki/build-wiki.cjs` 重新生成首页。
4. 需要重建原版时运行 `node wiki/build-wiki.cjs --legacy`，只更新 `wiki/index-original.html`。
5. 打开对应 HTML 检查搜索、目录、表格和窄屏布局。

`index.html` 不依赖线上字体、脚本或服务，生成后可以直接静态托管。
