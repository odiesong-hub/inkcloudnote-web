# inkCloudNote 推广网站

> 三端同步的 Markdown 知识库 — PC + Android + 百度网盘
> 纯静态落地页，部署在 GitHub Pages。

## 仓库定位

**本仓库仅存放推广网站源码**。产品代码（Electron / Capacitor / muya）在
[Gitee 主仓 `audi-studio/markcloudnote`](https://gitee.com/audi-studio/markcloudnote)。

## 目录结构

```
inkcloudnote-web/
├── index.html              # 单页落地页入口
├── css/style.css           # 全局样式（深浅色 + 响应式）
├── js/app.js               # 平台检测 / 版本拉取 / 主题切换
├── assets/                 # 静态素材（复用自主仓 docs/assets 等）
│   ├── pc/                 # PC 端截图/GIF
│   ├── mobile/             # 移动端图标/splash
│   ├── themes/             # 主题预览（12 张精选）
│   ├── logo.png
│   └── icon.png
├── .github/workflows/
│   └── pages.yml           # GitHub Pages 自动部署
├── robots.txt
├── sitemap.xml
├── .nojekyll               # 禁用 Jekyll
└── CNAME                   # 自定义域名（可选）
```

## 本地预览

纯静态站，无需构建。任选一种：

```bash
# Python
python3 -m http.server 8080

# Node（如装了 npx）
npx serve .

# 或直接用浏览器打开 index.html
```

访问 http://localhost:8080

## 部署

推送到 `main` 分支即触发 GitHub Actions 自动部署。
访问地址：https://audi-studio.github.io/inkcloudnote-web/

## 发布安装包到 Releases

完整流程见主仓 `docs/website/DEPLOYMENT_PLAN.md` 第 8 章。
最简命令：

```bash
gh release create v0.19.0 \
  --title "inkCloudNote v0.19.0" \
  --notes "..." \
  ./dist/marktext-mac-arm64-0.19.0.dmg \
  ./dist/marktext-win-x64-0.19.0.exe \
  ./dist/marktext-linux-0.19.0.AppImage \
  ./src/mobile/android/app/build/outputs/apk/release/app-release.apk
```

## 技术栈

- 纯 HTML5 / CSS3 / 原生 JS（零依赖、零构建）
- 移动优先响应式（断点 768px / 1024px）
- 自动深浅色（跟随系统）+ 手动切换
- GitHub Actions 部署

## License

MIT © 2026 audi-studio
基于 [MarkText](https://github.com/marktext/marktext) 上游定制。
