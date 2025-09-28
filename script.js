// ------------ Markdown Loader ------------
async function loadPage(file) {
  const el = document.getElementById("content");
  try {
    const res = await fetch("content/" + file, { cache: "no-store" });
    if (!res.ok) throw new Error(res.status + " " + res.statusText);
    const md = await res.text();
    el.innerHTML = marked.parse(md);

    const isPortfolio = file.toLowerCase() === "portfolio.md";
    document.body.classList.toggle("is-portfolio", isPortfolio);
    document.documentElement.classList.toggle("is-portfolio", isPortfolio);

    insertLastUpdate(el);

    // 仅当当前内容里存在 .quilt 时才初始化作品集交互
    if (el.querySelector(".quilt")) initPortfolioInteractions(el);
  } catch (err) {
    el.innerHTML = `<p style="color:red;">Failed to load ${file}: ${err.message}</p>`;
  }
}

function insertLastUpdate(container) {
  const footer = document.createElement("p");
  footer.className = "last-update";
  footer.textContent = "Last updated: " + new Date().toLocaleDateString(
    "en-US", { year: "numeric", month: "long", day: "numeric" }
  );
  container.appendChild(footer);
}

// ------------ 工具：找到当前行的“行尾 tile” ------------
function getRowEndTile(quilt, tile) {
  // 只取当前 quilt 的直接子元素里的 .tile（排除 expander）
  const tiles = Array.from(quilt.children).filter(el => el.classList && el.classList.contains('tile'));
  const index = tiles.indexOf(tile);
  if (index === -1) return tile;

  // 动态列数（兼容响应式）
  const cols = (getComputedStyle(quilt).gridTemplateColumns || '')
    .split(' ')
    .filter(s => s && s !== '/').length || 1;

  // 本行最后一个下标：ceil((index+1)/cols)*cols - 1
  const rowEndIdx = Math.min(Math.ceil((index + 1) / cols) * cols - 1, tiles.length - 1);
  return tiles[rowEndIdx];
}
function setActiveTile(quilt, tile) {
  quilt.querySelectorAll('.tile.is-active').forEach(t => t.classList.remove('is-active'));
  tile.classList.add('is-active');
}
function clearActive(quilt) {
  quilt.querySelectorAll('.tile.is-active').forEach(t => t.classList.remove('is-active'));
}

// ------------ Portfolio Expander (no page jump, auto height, row-end anchor) ------------
function initPortfolioInteractions(scopeEl) {
  if (scopeEl.__portfolioBound) return;
  scopeEl.__portfolioBound = true;

  scopeEl.addEventListener("click", (e) => {
    const tile = e.target.closest && e.target.closest(".tile");
    if (!tile || !scopeEl.contains(tile)) return;

    const quilt = tile.closest(".quilt") || scopeEl;
    const expander = getOrCreateExpander(quilt);

    // 行末锚点：在这一排的最后一个 tile 后面展开
    const anchor = getRowEndTile(quilt, tile);

    // 如果已经在本排下方展开 → 收起并清除高亮
    if (expander.previousElementSibling === anchor && expander.classList.contains("is-open")) {
      collapseExpander(expander);
      clearActive(quilt);
      e.preventDefault();
      return;
    }

    // 设置高亮
    setActiveTile(quilt, tile);

    // 确保 expander 在正确的 quilt 下
    if (expander.parentNode !== quilt) quilt.appendChild(expander);

    // 填充并在本排下方插入
    populateExpander(expander, tile);
    anchor.insertAdjacentElement("afterend", expander);

    // 展开
    openExpander(expander);
    e.preventDefault();
  });

  // ESC 关闭（只绑定一次）
  if (!document.__portfolioKeybound) {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        document.querySelectorAll(".tile-expander.is-open").forEach(collapseExpander);
      }
    });
    document.__portfolioKeybound = true;
  }
}

function getOrCreateExpander(quiltEl) {
  let exp = quiltEl.querySelector(".tile-expander");
  if (exp) return exp;

  exp = document.createElement("div");
  exp.className = "tile-expander";
  exp.innerHTML = `
    <div class="expander-inner">
      <div class="expander-media"></div>
      <div class="expander-body">
        <h3 class="exp-title"></h3>
        <div class="meta exp-meta"></div>
        <div class="desc exp-desc"></div>
      </div>
    </div>
  `;
  quiltEl.appendChild(exp);
  return exp;
}

function populateExpander(expander, tile) {
  const title = tile.querySelector("h3")?.textContent?.trim() || "";
  const year  = tile.querySelector("h5")?.textContent?.trim() || "";

  // 标题/年份
  expander.querySelector(".exp-title").textContent = title;
  expander.querySelector(".exp-meta").textContent  = year;

  // 不再复制 tile 的图片，直接隐藏媒体栏
  const media = expander.querySelector(".expander-media");
  media.innerHTML = "";
  expander.classList.add("no-media");

  // 描述：优先用隐藏详情；否则回退 overlay 的 <p>
  const detailHTML = tile.querySelector(".tile-detail")?.innerHTML?.trim();
  const fallbackP  = tile.querySelector(".overlay p")?.outerHTML || "";
  expander.querySelector(".exp-desc").innerHTML = detailHTML || fallbackP || "";
}


// 自适应高度展开/收起
function openExpander(expander) {
  // 先让它可见并清零高度，强制 reflow 后再设为内容高度
  expander.classList.add("is-open");
  expander.style.maxHeight = "0px";
  requestAnimationFrame(() => {
    const target = expander.scrollHeight;
    expander.style.maxHeight = target + "px";
    expander.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
}

function collapseExpander(expander) {
  expander.style.maxHeight = expander.scrollHeight + "px";
  requestAnimationFrame(() => {
    expander.style.maxHeight = "0px";
  });
  const onEnd = (e) => {
    if (e.propertyName === "max-height") {
      expander.classList.remove("is-open");
      expander.removeEventListener("transitionend", onEnd);
    }
  };
  expander.addEventListener("transitionend", onEnd);
}

// ------------ Boot ------------
window.addEventListener("DOMContentLoaded", () => {
  loadPage("home.md");
});
