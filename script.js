// Load Markdown
async function loadPage(file) {
  const el = document.getElementById("content");
  try {
    const res = await fetch("content/" + file, { cache: "no-store" });
    if (!res.ok) throw new Error(res.status + " " + res.statusText);
    const md = await res.text();
    el.innerHTML = marked.parse(md);

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
  const now = new Date();
  const options = { year: "numeric", month: "long", day: "numeric" };
  footer.textContent = "Last updated: " + now.toLocaleDateString("en-US", options);
  container.appendChild(footer);
}

// Default Load Home Page
window.addEventListener("DOMContentLoaded", () => {
  loadPage("home.md");
});
