// Load Markdown
async function loadPage(file) {
  const el = document.getElementById("content");
  try {
    const res = await fetch("content/" + file, { cache: "no-store" });
    if (!res.ok) throw new Error(res.status + " " + res.statusText);
    const md = await res.text();
    el.innerHTML = marked.parse(md);

    // 仅在 portfolio.md 时加类（给 <body> 和 <html> 都加，保证背景铺满）
    const isPortfolio = file.toLowerCase() === "portfolio.md";
    document.body.classList.toggle("is-portfolio", isPortfolio);
    document.documentElement.classList.toggle("is-portfolio", isPortfolio);

    // Time-stamp
    insertLastUpdate(el);
  } catch (err) {
    el.innerHTML = `<p style="color:red;">Failed to load ${file}: ${err.message}</p>`;
  }
}

// Function of time
function insertLastUpdate(container) {
  const footer = document.createElement("p");
  footer.className = "last-update";
  footer.textContent = "Last updated: " + new Date().toLocaleDateString(
    "en-US", { year: "numeric", month: "long", day: "numeric" }
  );
  container.appendChild(footer);
}

// Default Load Home Page
window.addEventListener("DOMContentLoaded", () => {
  loadPage("home.md");
});

// Delegate clicks on tiles to load the target page (works for dynamically loaded content)
document.addEventListener('click', (e) => {
  const tile = e.target.closest && e.target.closest('.tile[data-target]');
  if (tile) {
    const target = tile.getAttribute('data-target');
    if (target) {
      loadPage(target);
      e.preventDefault();
    }
  }
});
