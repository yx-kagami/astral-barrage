# 星幕计划：弹幕远征 · Astral Barrage

原创单人竖屏弹幕射击 Roguelite。驾驶星舰躲避弹幕、收集经验并在单局内强化火力。战斗计时到 03:00 时，机械星舰「晦星方舟」入场。击败两阶段 Boss 即可通关，单局目标时长约 4–6 分钟。

## 玩法

- 主炮自动向上射击。击毁敌机掉落绿色经验晶体，靠近后会自动吸附。
- 升级暂停战斗，从三个不同的强化中选一项。火力、辅助武器、移速、装甲与擦弹收益均可改变。
- 初始有 3 格生命和 2 枚炸弹。命中飞船中央的小型核心才会受伤，受伤后短暂无敌。低速模式会显示核心。
- 每颗弹幕最多计一次擦弹。擦弹加分并充能，满 26 点恢复一枚炸弹，最多持有 4 枚。炸弹清除屏上敌弹并伤害敌机。
- 最高分、最快通关及音画设置保存在当前浏览器中。

| 操作 | 手机 | 桌面 |
| --- | --- | --- |
| 移动 | 单指在战场内拖动，可从飞船以外的位置开始 | WASD 或方向键 |
| 精确移动 | 第二根手指按住「低速」 | 按住 Shift |
| 释放炸弹 | 点按「炸弹」 | X |
| 暂停 / 继续 | 顶部暂停按钮 /「继续」 | Esc |

切换到后台会自动暂停。手机横屏时会提示转回竖屏。

## 本地开发和测试

使用 Node.js 22.12+ 或 24 LTS，以及 npm。

```sh
npm ci
npm run dev
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

`npm run check` 可单独做类型检查。Playwright 启动生产预览，在 `/astral-barrage/` 下运行测试，以覆盖项目站点的真实路径结构。安装浏览器时可加 `--with-deps` 为 Linux 准备系统库。若已有 Chromium，可通过 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` 指向可执行文件。安装 WebKit 后，可使用 `PLAYWRIGHT_WEBKIT=1 npm run test:e2e` 运行额外的 WebKit 冒烟测试。

Vitest 验证生命值、碰撞、回收、擦弹、炸弹、强化上限、Boss 阶段、胜负状态，以及通过常规移动和武器完成的整局模拟。Playwright 覆盖菜单、键盘、触控模拟、暂停、失败重开、存档与离线启动。

## 架构

| 目录 | 职责 |
| --- | --- |
| `src/config` | 逻辑尺寸、敌机数据、关卡节奏和强化表 |
| `src/entities` | 自机、三类敌机和两阶段 Boss |
| `src/systems` | 对局状态、池化弹幕、碰撞、掉落、强化和粒子 |
| `src/scenes` | Phaser 4 场景循环、星空、战场渲染和程序化美术 |
| `src/ui` | DOM 界面、键盘和多点触控 |
| `src/utils` | 合成音频、本地存档和 PWA 注册 |
| `scripts` | Service Worker 模板与原创 PNG 图标生成器 |

战斗以 390×844 为逻辑尺寸，按 120 Hz 固定时间步推进，由 Phaser Canvas 渲染。HTML 界面独立缩放并适应安全区域。低画质降低星点和粒子数量。所有图像与音频在本项目中绘制或合成，运行时没有外部资源请求。

## GitHub Pages 部署

1. 将本仓库连接到 GitHub 的项目仓库，将功能分支推送到 `origin`。对于空的 GitHub 仓库，可用首阶段提交作为 `main` 基线，再将功能分支通过 PR 合并到 `main`。
2. 在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
3. `main` 更新时，工作流会通过 `npm ci` 安装依赖，执行 Vitest、TypeScript 检查、生产构建和 Chromium 冒烟测试，然后发布 `dist`。
4. 在 Actions 的部署环境或 **Settings → Pages** 复制实际的公开地址。

Vite 使用相对资源路径。Manifest 的起始地址、PNG 图标和 Service Worker 作用域均相对于部署目录。构建按产物内容生成离线缓存版本，只有成功缓存完整新版本后才启用新 Worker。打开游戏并完成首次缓存后，即可离线重新打开。

## 手机验收

- iPhone Safari 用分享菜单的「添加到主屏幕」，Android Chrome 用安装菜单。分别验证图标、独立模式、刘海及底部安全区。
- 各玩一局验证跟手感、双指低速、炸弹、横竖屏切换、系统手势和误滚动。锁屏或切到后台后应暂停。
- 开启声音后开始或恢复战斗，确认正常发声与静音。低画质下检查 Boss 大量弹幕时的流畅度。
- 先联网打开，等待首次缓存完成。切换飞行模式后从主屏幕重新打开并开始战斗。
