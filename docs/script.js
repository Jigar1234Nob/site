(() => {
const root=document.documentElement,theme=document.querySelector(".theme-toggle"),saved=(()=>{try{return localStorage.getItem("jigar-theme")}catch{return null}})(),dark=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches;
function setTheme(value){root.dataset.theme=value;if(theme)theme.setAttribute("aria-label",value==="dark"?"Switch to light mode":"Switch to dark mode");const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=value==="dark"?"#000000":"#f5f5f7"}
setTheme(saved==="light"||saved==="dark"?saved:(dark?"dark":"light"));
theme?.addEventListener("click",()=>{const next=root.dataset.theme==="dark"?"light":"dark";setTheme(next);try{localStorage.setItem("jigar-theme",next)}catch{}});
const toggle=document.querySelector(".nav-toggle"),nav=document.querySelector(".nav-links");
function closeMenu(){nav?.classList.remove("is-open");toggle?.setAttribute("aria-expanded","false");toggle?.setAttribute("aria-label","Open menu")}
toggle?.addEventListener("click",()=>{const open=nav?.classList.toggle("is-open")??false;toggle.setAttribute("aria-expanded",String(open));toggle.setAttribute("aria-label",open?"Close menu":"Open menu")});
nav?.querySelectorAll("a").forEach(a=>a.addEventListener("click",closeMenu));window.addEventListener("resize",()=>{if(innerWidth>760)closeMenu()});
const year=document.querySelector("#year");if(year)year.textContent=new Date().getFullYear();
})();