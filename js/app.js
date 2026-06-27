/* ============================================================
   inkCloudNote 推广网站 — 交互脚本
   纯原生 JS、零依赖。功能：
   1. 平台检测 → 高亮对应下载卡片
   2. 拉取 GitHub Releases 最新版本号 + 资产 URL
   3. 主题切换（手动覆盖系统）
   4. 移动端导航展开
   5. 锚点平滑滚动
   ============================================================ */

(function () {
  'use strict';

  // ===== 配置 =====
  var REPO = 'audi-studio/inkcloudnote-web';
  var RELEASES_LATEST_URL = 'https://github.com/' + REPO + '/releases/latest';
  var API_URL = 'https://api.github.com/repos/' + REPO + '/releases/latest';

  // 平台 → 资产后缀映射（多后缀兜底，按优先级排列）
  var PLATFORM_ASSETS = {
    mac: { exts: ['.dmg', '.zip'], label: 'macOS', node: 'dl-mac' },
    windows: { exts: ['.exe'], label: 'Windows', node: 'dl-win' },
    linux: { exts: ['.AppImage', '.deb', '.rpm'], label: 'Linux', node: 'dl-linux' },
    android: { exts: ['.apk'], label: 'Android', node: 'dl-android' }
  };

  // ===== 1. 平台检测 =====
  function detectPlatform() {
    var ua = navigator.userAgent.toLowerCase();
    if (/android/.test(ua)) return 'android';
    if (/iphone|ipad|ipod/.test(ua)) return 'ios';
    if (/mac os x/.test(ua)) return 'mac';
    if (/windows/.test(ua)) return 'windows';
    if (/linux/.test(ua) && !/android/.test(ua)) return 'linux';
    return 'unknown';
  }

  // ===== 2. 拉取 GitHub Releases =====
  function fetchLatestRelease() {
    // 用超时避免长时间挂起
    var timeout = new Promise(function (_, reject) {
      setTimeout(function () { reject(new Error('timeout')); }, 6000);
    });
    var fetchP = fetch(API_URL).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
    return Promise.race([fetchP, timeout]).then(function (data) {
      return {
        tag: data.tag_name,
        name: data.name,
        html_url: data.html_url,
        assets: (data.assets || []).map(function (a) {
          return { name: a.name, url: a.browser_download_url, size: a.size };
        })
      };
    });
  }

  // 按平台后缀匹配资产
  function pickAsset(assets, platform) {
    var conf = PLATFORM_ASSETS[platform];
    if (!conf || !assets || !assets.length) return null;
    // 遍历该平台的所有后缀，找到第一个匹配的资产
    for (var i = 0; i < conf.exts.length; i++) {
      for (var j = 0; j < assets.length; j++) {
        if (assets[j].name.toLowerCase().endsWith(conf.exts[i].toLowerCase())) {
          return assets[j];
        }
      }
    }
    return null;
  }

  // 文件大小格式化
  function formatSize(bytes) {
    if (!bytes) return '';
    var mb = bytes / (1024 * 1024);
    if (mb < 1) return Math.round(bytes / 1024) + ' KB';
    return mb.toFixed(1) + ' MB';
  }

  // ===== 应用到 DOM =====
  function applyRelease(release) {
    // 显示版本号
    var versionEl = document.getElementById('latest-version');
    if (versionEl && release.tag) {
      versionEl.textContent = release.tag;
    }

    // 为「已发布」的下载卡片补充文件大小信息（不覆盖 href——HTML 里已是直链）
    // 跳过 .download-card-disabled（Windows/Linux 未发布）
    ['mac', 'android'].forEach(function (platform) {
      var conf = PLATFORM_ASSETS[platform];
      var card = document.getElementById(conf.node);
      if (!card || card.classList.contains('download-card-disabled')) return;
      var asset = pickAsset(release.assets, platform);
      if (asset) {
        // href 已在 HTML 写死，这里只补充文件大小到 meta
        var meta = card.querySelector('[data-meta]');
        if (meta) {
          var sizeStr = formatSize(asset.size);
          var codeEl = meta.querySelector('code');
          var extText = codeEl ? codeEl.outerHTML : '';
          meta.innerHTML = (sizeStr ? sizeStr + ' · ' : '') + extText;
        }
      }
    });
  }

  function applyPlatformHint(platform) {
    var hint = document.getElementById('platform-hint');
    if (!hint) return;
    if (platform === 'ios') {
      hint.textContent = '检测到 iOS — 移动端暂仅支持 Android，可下载桌面版。';
      return;
    }
    if (platform === 'windows' || platform === 'linux') {
      hint.textContent = '检测到 ' + PLATFORM_ASSETS[platform].label + ' — 该平台版本即将支持，敬请期待。';
      return;
    }
    if (platform === 'unknown') {
      hint.textContent = '请根据你的系统选择对应版本。';
      return;
    }
    var conf = PLATFORM_ASSETS[platform];
    hint.textContent = '检测到 ' + conf.label + ' — 已为你高亮对应版本。';

    // 高亮当前平台卡片（仅对已发布的 mac/android 生效）
    var card = document.getElementById(conf.node);
    if (card && !card.classList.contains('download-card-disabled')) {
      card.classList.add('recommended');
    }
  }

  // ===== 3. 主题切换 =====
  function initTheme() {
    var root = document.documentElement;
    var stored = null;
    try { stored = localStorage.getItem('theme'); } catch (e) {}
    if (stored === 'light' || stored === 'dark') {
      root.setAttribute('data-theme', stored);
    }

    var toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.addEventListener('click', function () {
        var cur = root.getAttribute('data-theme');
        // 推断当前实际模式（考虑系统偏好）
        var sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        var isDark = cur ? cur === 'dark' : sysDark;
        var next = isDark ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        try { localStorage.setItem('theme', next); } catch (e) {}
      });
    }
  }

  // ===== 4. 移动端导航 =====
  function initNav() {
    var toggle = document.getElementById('nav-toggle');
    var navbar = document.getElementById('navbar');
    if (!toggle || !navbar) return;

    toggle.addEventListener('click', function () {
      var open = navbar.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    // 点击导航链接后收起
    navbar.querySelectorAll('.nav-links a').forEach(function (a) {
      a.addEventListener('click', function () {
        navbar.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ===== 5. 初始化 =====
  document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    initNav();

    // 平台检测（立即执行，无网络依赖）
    var platform = detectPlatform();
    applyPlatformHint(platform);

    // 拉取 release（异步、失败兜底）
    fetchLatestRelease()
      .then(applyRelease)
      .catch(function (err) {
        // 静默失败：下载卡片保持 releases/latest 兜底链接
        // 版本号显示占位
        var versionEl = document.getElementById('latest-version');
        if (versionEl) versionEl.textContent = '查看 Releases';
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('[inkCloudNote] release fetch failed:', err.message);
        }
      });
  });
})();
