(() => {
  const root = document.documentElement;
  const themeButton = document.querySelector(".theme-toggle");
  let savedTheme = null;
  try { savedTheme = localStorage.getItem("jigar-theme"); } catch {}
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  function setTheme(value) {
    root.dataset.theme = value;
    if (themeButton) {
      themeButton.setAttribute("aria-label", value === "dark" ? "Switch to light mode" : "Switch to dark mode");
      const icon = themeButton.querySelector(".theme-icon");
      if (icon) icon.textContent = value === "dark" ? "☼" : "◐";
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = value === "dark" ? "#0b1220" : "#f5f7fb";
  }
  setTheme(savedTheme === "light" || savedTheme === "dark" ? savedTheme : (prefersDark ? "dark" : "light"));
  themeButton?.addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    setTheme(next);
    try { localStorage.setItem("jigar-theme", next); } catch {}
  });

  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav-links");
  function closeNav() {
    nav?.classList.remove("is-open");
    navToggle?.setAttribute("aria-expanded", "false");
    navToggle?.setAttribute("aria-label", "Open navigation");
  }
  navToggle?.addEventListener("click", () => {
    const isOpen = nav?.classList.toggle("is-open") ?? false;
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  });
  nav?.querySelectorAll("a").forEach(link => link.addEventListener("click", closeNav));
  window.addEventListener("resize", () => { if (window.innerWidth > 760) closeNav(); });
  const year = document.querySelector("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  const resourceSearch = document.querySelector("#resource-search");
  const resourceCards = [...document.querySelectorAll(".resource-card")];
  const resourceCount = document.querySelector("#resource-count");
  function filterResources() {
    const term = (resourceSearch?.value || "").trim().toLowerCase();
    let shown = 0;
    resourceCards.forEach(card => {
      const searchable = ((card.dataset.search || "") + " " + card.textContent).toLowerCase();
      const visible = !term || searchable.includes(term);
      card.hidden = !visible;
      if (visible) shown++;
    });
    if (resourceCount) resourceCount.textContent = String(shown);
  }
  resourceSearch?.addEventListener("input", filterResources);
  filterResources();

  // This site does not load analytics or advertising cookies.
  const cookieName = "jigar_cookie_notice";
  const noticeAlreadySeen = () => document.cookie.split(";").some(item => item.trim().startsWith(cookieName + "="));
  const notice = document.createElement("aside");
  notice.className = "cookie-notice";
  notice.setAttribute("aria-label", "Cookie notice");
  notice.innerHTML = '<div class="cookie-notice-copy"><strong>Cookies, without the creepy stuff.</strong><p>This site uses browser storage to remember your theme and a small cookie to remember this notice. No analytics or advertising cookies are used.</p></div><button type="button" class="cookie-notice-dismiss">Got it</button>';
  notice.hidden = noticeAlreadySeen();
  document.body.appendChild(notice);
  const dismiss = () => {
    document.cookie = cookieName + "=seen; Max-Age=15552000; Path=/; SameSite=Lax" + (location.protocol === "https:" ? "; Secure" : "");
    notice.hidden = true;
  };
  notice.querySelector(".cookie-notice-dismiss").addEventListener("click", dismiss);
  document.querySelectorAll(".cookie-notice-link").forEach(link => link.addEventListener("click", () => {
    notice.hidden = false;
    notice.querySelector(".cookie-notice-dismiss").focus();
  }));
})();