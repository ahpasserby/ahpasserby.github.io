(function () {
  const cfg = (typeof GLOBAL_CONFIG !== "undefined" && GLOBAL_CONFIG.friends_vue_info) || {};
  const API = (cfg.apiurl || "").replace(/\/+$/, "/") || null;
  if (!API) return;

  const STYLE = `
    #hexo-circle-of-friends-root { margin-top: 1rem; }
    .cf-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
    .cf-card { background: var(--card-bg); border: var(--style-border-always); box-shadow: var(--anzhiyu-shadow-border); border-radius: 12px; padding: 14px 16px; transition: transform .2s; }
    .cf-card:hover { transform: translateY(-2px); }
    .cf-card .cf-title { font-weight: 700; font-size: 1rem; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .cf-card .cf-title a { color: var(--anzhiyu-fontcolor); text-decoration: none; }
    .cf-card .cf-title a:hover { color: var(--anzhiyu-theme); }
    .cf-card .cf-meta { display: flex; align-items: center; gap: 8px; margin-top: 10px; font-size: .82rem; color: var(--anzhiyu-secondtext); }
    .cf-card .cf-meta img { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; }
    .cf-card .cf-meta a { color: var(--anzhiyu-fontcolor); text-decoration: none; }
    .cf-card .cf-meta a:hover { color: var(--anzhiyu-theme); }
    .cf-card .cf-meta time { margin-left: auto; }
    .cf-stats { display: flex; gap: 24px; padding: 16px 0; flex-wrap: wrap; color: var(--anzhiyu-fontcolor); }
    .cf-stats .cf-stat-num { font-weight: 700; font-size: 1.2rem; }
    .cf-stats .cf-stat-label { font-size: .85rem; color: var(--anzhiyu-secondtext); margin-left: 4px; }
    .cf-loadmore { display: block; width: 100%; padding: 12px; margin-top: 16px; border: var(--style-border-always); border-radius: 12px; background: var(--card-bg); color: var(--anzhiyu-fontcolor); text-align: center; cursor: pointer; font-size: .9rem; }
    .cf-loadmore:hover { color: var(--anzhiyu-theme); }
    .cf-empty { text-align: center; padding: 40px 0; color: var(--anzhiyu-secondtext); }
  `;
  const styleEl = document.createElement("style");
  styleEl.textContent = STYLE;
  document.head.appendChild(styleEl);

  const PAGE_SIZE = 20;
  let cursor = 0;
  let total = 0;

  function fmtDate(s) {
    return (s || "").slice(0, 10);
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function cardHTML(a) {
    return (
      '<div class="cf-card">' +
      '  <div class="cf-title"><a href="' +
      esc(a.link) +
      '" target="_blank" rel="external nofollow noopener">' +
      esc(a.title) +
      "</a></div>" +
      '  <div class="cf-meta">' +
      (a.avatar ? '<img src="' + esc(a.avatar) + '" alt="" onerror="this.style.display=\'none\'">' : "") +
      '    <a href="' +
      esc(a.link) +
      '" target="_blank" rel="external nofollow noopener">' +
      esc(a.author) +
      "</a>" +
      "    <time>" +
      esc(fmtDate(a.updated || a.created)) +
      "</time>" +
      "  </div>" +
      "</div>"
    );
  }

  async function loadPage(root, start) {
    const url = API + "all?start=" + start + "&end=" + (start + PAGE_SIZE) + "&rule=updated";
    let data;
    try {
      const resp = await fetch(url);
      data = await resp.json();
    } catch (e) {
      root.innerHTML = '<div class="cf-empty">朋友圈数据加载失败：' + esc(e.message) + "</div>";
      return;
    }
    const stats = data.statistical_data || {};
    const articles = data.article_data || [];
    total = stats.article_num || 0;

    if (start === 0) {
      let html =
        '<div class="cf-stats">' +
        '<div><span class="cf-stat-num">' + (stats.friends_num || 0) + '</span><span class="cf-stat-label">订阅</span></div>' +
        '<div><span class="cf-stat-num">' + (stats.active_num || 0) + '</span><span class="cf-stat-label">活跃</span></div>' +
        '<div><span class="cf-stat-num">' + (stats.article_num || 0) + '</span><span class="cf-stat-label">日志</span></div>' +
        '<div style="margin-left:auto;font-size:.82rem;color:var(--anzhiyu-secondtext);">更新于 ' + esc(stats.last_updated_time || "") + '</div>' +
        '</div>' +
        '<div class="cf-grid" id="cf-grid"></div>' +
        '<div id="cf-loadmore-wrap"></div>';
      root.innerHTML = html;
    }
    if (!articles.length && start === 0) {
      document.getElementById("cf-grid").innerHTML = '<div class="cf-empty">暂无文章</div>';
      return;
    }
    const grid = document.getElementById("cf-grid");
    grid.insertAdjacentHTML("beforeend", articles.map(cardHTML).join(""));
    cursor = start + articles.length;

    const wrap = document.getElementById("cf-loadmore-wrap");
    if (cursor < total) {
      wrap.innerHTML = '<button class="cf-loadmore" id="cf-loadmore-btn">加载更多 (' + cursor + ' / ' + total + ')</button>';
      document.getElementById("cf-loadmore-btn").onclick = function () { loadPage(root, cursor); };
    } else {
      wrap.innerHTML = '';
    }
  }

  function render() {
    const root = document.getElementById("hexo-circle-of-friends-root");
    if (!root) return;
    root.innerHTML = '<div class="cf-empty">加载中...</div>';
    cursor = 0;
    loadPage(root, 0);
  }

  function patchRandomPost() {
    if (typeof window.fetchRandomPost !== "function") return;
    window.fetchRandomPost = function () {
      const rpEl = document.getElementById("random-post");
      if (!rpEl) return;
      rpEl.innerHTML = "钓鱼中...";
      fetch(API + "randompost")
        .then(function (r) { return r.json(); })
        .then(function (j) {
          const post = Array.isArray(j) ? j[0] : j;
          if (!post || !post.title) {
            rpEl.innerHTML = "钓鱼失败，稍后再试...";
            return;
          }
          rpEl.innerHTML =
            '来自友链 <b>' + esc(post.author) + '</b> 的文章：' +
            '<a class="random-friends-post" target="_blank" rel="external nofollow noopener" href="' + esc(post.link) + '">' + esc(post.title) + '</a>';
        })
        .catch(function () { rpEl.innerHTML = "钓鱼失败，稍后再试..."; });
    };
    if (document.getElementById("random-post")) {
      window.fetchRandomPost();
    }
  }

  function init() {
    if (location.pathname.indexOf("/fcircle") < 0) return;
    render();
    let tries = 0;
    const iv = setInterval(function () {
      if (typeof window.fetchRandomPost === "function") {
        clearInterval(iv);
        patchRandomPost();
      } else if (++tries > 50) {
        clearInterval(iv);
      }
    }, 100);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  document.addEventListener("pjax:complete", init);
})();
