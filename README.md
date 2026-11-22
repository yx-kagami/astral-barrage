# 星幕计划：弹幕远征 · Astral Barrage

原创单人竖屏弹幕射击 Roguelite。驾驶星舰躲避弹幕、收集经验并在单局内强化火力。战斗计时到 03:00 时，机械星舰「晦星方舟」入场。击败两阶段 Boss 即可通关，单局目标时长约 4–6 分钟。

## 在线试玩

发布目标为 GitHub Pages 的 [星幕计划：弹幕远征](https://yx-kagami.github.io/astral-barrage/)。从 Safari 或 Chrome 打开，保持竖屏并点按「开始游戏」。首次发布状态和实际网址可在仓库的 **Settings → Pages** 查看。

## 手机安装

- **iPhone Safari**：打开游戏网址，点按「分享」，向下滚动并选择「添加到主屏幕」。如果看到「作为网页 App 打开」，请保持开启，再点按「添加」。之后可从主屏幕图标打开独立窗口。
- **Android Chrome**：打开游戏网址，点按右上角「⋮」，选择「安装应用」或「添加到主屏幕 → 安装」，再确认。
- 安装后先通过主屏幕图标联网打开游戏并开始一局，让当前窗口完成离线缓存。退出后打开飞行模式，再从主屏幕图标启动并进入战斗。最高分和最快通关记录保存在当前浏览器或已安装应用的数据中。

## 玩法

- 主炮自动向上射击。击毁敌机掉落绿色经验晶体，靠近后会自动吸附。
- 升级暂停战斗，从三个不同的强化中选一项。火力、辅助武器、移速、装甲与擦弹收益均可改变。
- 默认机体巡星号初始有 3 格生命和 2 枚炸弹。命中飞船中央的小型核心才会受伤，受伤后短暂无敌。低速模式会显示核心。
- 每颗弹幕最多计一次擦弹。擦弹加分并充能，满 26 点恢复一枚炸弹，最多持有 4 枚。炸弹清除屏上敌弹并伤害敌机。
- 最高分、最快通关及音画设置保存在当前浏览器中。

| 操作 | 手机 | 桌面 |
| --- | --- | --- |
| 移动 | 单指在战场内拖动，可从飞船以外的位置开始 | WASD 或方向键 |
| 精确移动 | 第二根手指按住「低速」 | 按住 Shift |
| 释放炸弹 | 点按「炸弹」 | X |
| 角色技能 | 点按「技能」 | C |
| 暂停 / 继续 | 顶部暂停按钮 /「继续」 | Esc |

切换到后台会自动暂停。手机横屏时会提示转回竖屏。


## 机库与外观

在主菜单打开「机库」，可分别选择机体和皮肤，两项选择都保存在当前设备上。

| 机体 | 生命 / 炸弹 | 移速 | 主炮伤害 / 发 | 专属技能 |
| --- | --- | --- | --- | --- |
| 巡星号 | 3 / 2 | 266 | 8 | 标准武装 |
| 折岚 | 2 / 2 | 252 | 10 | 引力折叠，清除近身敌弹并命中范围内的敌人，冷却 15 秒 |
| 闻星 | 3 / 1 | 292 | 7 | 列星符阵，3 秒内提高射速并额外穿透 2 个目标，冷却 18 秒 |

「极光」与「暮金」可搭配任意机体，切换装甲配色、尾焰、武器光效和爆破颜色。两位原创角色各有独立立绘和战斗小人。碰撞核心始终按战斗规则计算。

要替换角色贴图，将透明 WebP 放入 `src/assets/hangar`，在 `src/art/FlightAssets.ts` 更新立绘与小人路径。皮肤的光效、配色和尾焰比例由 `src/config/appearance.ts` 管理，战斗数值与技能由 `src/config/aircraft.ts` 管理。新素材会进入 Vite 构建和 PWA 离线缓存。

## 本地开发

使用 Node.js 22.12+ 或 24 LTS，以及 npm。

```sh
npm ci
npm run dev
# 在另一个终端执行以下验证命令
npm run check
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

`npm run check` 可单独做类型检查。Playwright 启动生产预览，在 `/astral-barrage/` 下运行测试，以覆盖项目站点的真实路径结构。安装浏览器时可加 `--with-deps` 为 Linux 准备系统库。若已有 Chromium，可通过 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` 指向可执行文件。安装 WebKit 后，可使用 `PLAYWRIGHT_WEBKIT=1 npm run test:e2e` 运行额外的 WebKit 冒烟测试。

Vitest 验证生命值、碰撞、回收、擦弹、炸弹、强化上限、Boss 阶段、胜负状态、最佳通关记录与整局模拟。Playwright 覆盖菜单、键盘、触控模拟、首次触摸后的 Web Audio、暂停、失败重开、存档与离线启动。

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

## 自动部署

### 首次启用

1. 将本地 `main` 的首阶段提交和已验证的开发分支推送到 [GitHub 仓库](https://github.com/yx-kagami/astral-barrage)。确认默认分支为 `main`。
2. 在 iPhone Safari 登录仓库所有者账号，打开仓库的 **Settings → Pages**。如果移动页面隐藏了 **Settings**，请在 Safari 地址栏的页面菜单中选择「请求桌面网站」，然后重新打开仓库设置。
3. 在 **Build and deployment → Source** 选择 **GitHub Actions**。创建从 `feat/vertical-shooter` 到 `main` 的 PR。验证通过后使用 **Create a merge commit**，保留各阶段提交。
4. 打开 **Actions → Test and deploy GitHub Pages**，等待 `test-build` 和 `deploy` 成功。若设置 Source 前已经合并，在该工作流选择 **Run workflow → main**。从 **Settings → Pages** 打开已发布地址，确认菜单和开局均正常。

### 日常更新

1. 在 Codex 中基于最新的 `main` 创建功能分支并修改游戏。
2. 执行 `npm ci`、`npm run check`、`npm test`、`npm run build` 和 `npm run test:e2e`，再用 Conventional Commits 格式提交。
3. 推送功能分支并向 `main` 发起 PR。检查 Actions 后使用合并提交保留分支历史。
4. `main` 更新时自动执行测试、类型检查、构建及 Chromium 冒烟测试，随后将生成的 `dist` 发布到 Pages。部署完成后打开 HTTPS 游戏地址，验证本次改动。功能分支和 PR 只运行验证。

Vite 使用相对资源路径，部署目录为 `/astral-barrage/`。Manifest 的起始地址、PNG 图标和 Service Worker 作用域均相对于部署目录。只有成功缓存完整新版本后，新 Worker 才启用。已打开的对局可继续进行，下次打开或刷新时使用新版本。

## 手机验收

- iPhone Safari 用分享菜单的「添加到主屏幕」，Android Chrome 用安装菜单。分别验证图标、独立模式、刘海及底部安全区。
- 各玩一局验证跟手感、双指低速、炸弹、横竖屏切换、系统手势和误滚动。锁屏或切到后台后应暂停。
- 开启声音后开始或恢复战斗，确认正常发声与静音。低画质下检查 Boss 大量弹幕时的流畅度。
- 先联网打开，等待首次缓存完成。切换飞行模式后从主屏幕重新打开并开始战斗。
