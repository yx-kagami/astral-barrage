# Astral Barrage 开发约定

- 将可测试的战斗规则保留在 `src/systems` 与 `src/entities`，远离浏览器和 Phaser API。场景负责固定步长、渲染及对界面和音频的调用。将平衡参数放在 `src/config`。
- 维护 390×844 的逻辑坐标和固定时间步。改动弹幕、暂停、触控或场景生命周期时，验证常规游戏入口、随机升级界面切换、窗口旋转和重开。
- 维护简体中文界面，保证触控目标大小与安全区。使用原创素材，保持生产包可从 GitHub Pages 仓库子路径运行。
- 用 `npm ci` 安装锁定依赖。提交前执行 `npm test` 和 `npm run build`。涉及用户操作或 PWA 的改动还应执行 `npm run test:e2e`。
- 将胜负、碰撞、擦弹、升级与关卡边界条件放入 Vitest。浏览器测试通过真实界面操作和浏览器输入验证，避免在 production 代码暴露测试状态。
- 提交按可独立验证的阶段拆分，使用 Conventional Commits。保留 `package-lock.json` 和源素材，排除 `node_modules`、构建输出、测试产物及凭证。功能分支通过 PR 进入 `main`。
