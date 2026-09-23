/* 文章里嵌入的演示页：自动撑高 iframe + 跟随博客的深浅色。
 *
 * 用法（写在文章 Markdown 里，前后各留一个空行）：
 *   <iframe class="post-embed" src="/demo/xxx.html" title="..." loading="lazy"
 *           style="width:100%;height:1100px;border:0;display:block"></iframe>
 *
 * 演示页放在 source/demo/ 下，和博客同源，所以父页面可以直接读子页面的
 * scrollHeight —— 演示页本身不需要写任何配合代码（不用 postMessage）。
 * style 里的固定高度是 JS 没跑起来时的兜底值，随便给个接近的就行。
 *
 * 注意：主题开了 pjax，所以要在 pjax:complete 时重新绑定。
 */
(function () {
  "use strict";

  var BOUND = "embedAutoheightBound";

  function fit(frame) {
    try {
      var doc = frame.contentDocument;
      if (!doc || !doc.documentElement) return;
      var h = Math.max(
        doc.documentElement.scrollHeight,
        doc.body ? doc.body.scrollHeight : 0
      );
      // 留 2px 容差，免得子页面因为父高度变化重排、来回抖成死循环
      if (h > 0 && Math.abs(h - frame.clientHeight) > 2) {
        frame.style.height = h + "px";
      }
    } catch (e) {
      /* 万一变成跨域就放弃，退回 style 里的固定高度 */
    }
  }

  function syncTheme(frame) {
    try {
      var mode = document.documentElement.getAttribute("data-theme");
      var doc = frame.contentDocument;
      if (!mode || !doc || !doc.documentElement) return;
      doc.documentElement.setAttribute("data-theme", mode);
    } catch (e) {}
  }

  function bind(frame) {
    if (frame.dataset[BOUND]) return;
    frame.dataset[BOUND] = "1";

    var refresh = function () {
      syncTheme(frame);
      fit(frame);
    };

    frame.addEventListener("load", function () {
      refresh();
      // 子页面内容自己变高（展开、切换模式……）时跟着调整
      try {
        var win = frame.contentWindow;
        var body = frame.contentDocument && frame.contentDocument.body;
        if (win && win.ResizeObserver && body) {
          new win.ResizeObserver(function () {
            fit(frame);
          }).observe(body);
        }
      } catch (e) {}
    });

    // pjax 回退到已经加载过的页面时不会再触发 load
    refresh();

    window.addEventListener("resize", function () {
      fit(frame);
    });

    // 博客切深浅色时，把新配色同步进去
    new MutationObserver(function () {
      syncTheme(frame);
    }).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"]
    });
  }

  function init() {
    var frames = document.querySelectorAll("iframe.post-embed");
    for (var i = 0; i < frames.length; i++) bind(frames[i]);
  }

  document.addEventListener("DOMContentLoaded", init);
  document.addEventListener("pjax:complete", init);
  if (document.readyState !== "loading") init();
})();
