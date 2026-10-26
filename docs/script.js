(() => {
  const root = document.documentElement;
  const themeButton = document.querySelector(".theme-toggle");
  const themeLabel = document.querySelector(".theme-label");
  const themeIcon = document.querySelector(".theme-icon");
  const storedTheme = (() => { try { return localStorage.getItem("jigar-theme"); } catch { return null; } })();
  const systemTheme = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  function setTheme(theme) {
    root.dataset.theme = theme;
    if (themeLabel) themeLabel.textContent = theme === "dark" ? "Light mode" : "Dark mode";
    if (themeIcon) themeIcon.textContent = theme === "dark" ? "☼" : "☾";
    if (themeButton) themeButton.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === "dark" ? "#080b12" : "#f5f7fb";
  }
  setTheme(storedTheme === "light" || storedTheme === "dark" ? storedTheme : systemTheme);
  themeButton?.addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    setTheme(next);
    try { localStorage.setItem("jigar-theme", next); } catch {}
  });

  const menuButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".site-nav");
  function closeMenu() {
    nav?.classList.remove("is-open");
    menuButton?.setAttribute("aria-expanded", "false");
    menuButton?.setAttribute("aria-label", "Open navigation");
  }
  menuButton?.addEventListener("click", () => {
    const open = nav?.classList.toggle("is-open") ?? false;
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  });
  nav?.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));
  window.addEventListener("resize", () => { if (window.innerWidth > 700) closeMenu(); });

  const cards = [...document.querySelectorAll(".project-card")];
  const filterButtons = [...document.querySelectorAll("[data-filter]")];
  const count = document.querySelector(".project-count");
  filterButtons.forEach(button => button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    filterButtons.forEach(item => {
      const active = item === button;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    let shown = 0;
    cards.forEach(card => {
      const visible = filter === "all" || card.dataset.category === filter;
      card.hidden = !visible;
      if (visible) shown++;
    });
    if (count) count.textContent = "SHOWING " + String(shown).padStart(2, "0") + " PROJECT" + (shown === 1 ? "" : "S");
  }));

  const commandOutput = document.querySelector("#terminal-output");
  const commands = {
    about: ["whoami", ["I'm Jigar Rai.", "I make music, build projects, explore technology and learn by doing."]],
    interests: ["interests", ["Music and artist releases", "Websites and apps", "Troubleshooting and IT", "Servers, Linux, Docker and hardware experiments"]],
    projects: ["projects", ["JPN — personal web platform", "SPCITCLUB Minecraft Server — community project", "Web and app experiments", "Home lab and OS experiments", "My music — Spotify artist profile"]],
    help: ["help", ["Available commands: whoami, interests, projects, help"]]
  };
  document.querySelectorAll("[data-command]").forEach(button => button.addEventListener("click", () => {
    const item = commands[button.dataset.command] || commands.help;
    if (!commandOutput) return;
    commandOutput.replaceChildren();
    const prompt = document.createElement("p");
    const user = document.createElement("b");
    user.textContent = "jigar@portfolio";
    prompt.append(user, document.createTextNode(":~$ "));
    const command = document.createElement("span");
    command.textContent = item[0];
    prompt.append(command);
    commandOutput.append(prompt);
    item[1].forEach(line => {
      const output = document.createElement("p");
      output.textContent = line;
      commandOutput.append(output);
    });
  }));

  const year = document.querySelector("#year");
  if (year) year.textContent = new Date().getFullYear();

  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); }
    }), { threshold: 0.12 });
    revealEls.forEach(el => observer.observe(el));
  } else revealEls.forEach(el => el.classList.add("is-visible"));

  const cursor = document.querySelector(".cursor-glow");
  if (cursor && window.matchMedia("(hover: hover) and (pointer: fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.body.classList.add("custom-cursor");
    window.addEventListener("pointermove", event => {
      cursor.style.left = event.clientX + "px";
      cursor.style.top = event.clientY + "px";
      cursor.classList.add("is-visible");
    }, { passive: true });
    document.querySelectorAll("a, button").forEach(el => {
      el.addEventListener("pointerenter", () => cursor.classList.add("is-hovering"));
      el.addEventListener("pointerleave", () => cursor.classList.remove("is-hovering"));
    });
  }
})();