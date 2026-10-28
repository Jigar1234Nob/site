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
const galleryRoot=document.querySelector("[data-project-gallery]");
if(galleryRoot){
 const cards=[...galleryRoot.querySelectorAll(".project-card")];
 const search=galleryRoot.querySelector("#project-search");
 const categorySelect=galleryRoot.querySelector("#project-category");
 const sortSelect=galleryRoot.querySelector("#project-sort");
 const statusSelect=galleryRoot.querySelector("#project-status-filter");
 const chips=[...galleryRoot.querySelectorAll("[data-filter-chip]")];
 const grid=galleryRoot.querySelector("#project-grid");
 const count=galleryRoot.querySelector("#project-count");
 const empty=galleryRoot.querySelector("#project-empty");
 let activeCategory="All";
 function renderGallery(){
  const term=(search?.value||"").trim().toLowerCase();
  const selected=categorySelect?.value||"All";
  const category=selected!=="All"?selected:activeCategory;
  const status=statusSelect?.value||"All";
  let visible=cards.filter(card=>{
   const text=(card.dataset.search||card.textContent).toLowerCase();
   const categories=(card.dataset.category||"").split("|");
   return (!term||text.includes(term))&&(category==="All"||categories.includes(category))&&(status==="All"||card.dataset.status===status);
  });
  if(sortSelect?.value==="az")visible.sort((a,b)=>a.dataset.title.localeCompare(b.dataset.title));
  if(sortSelect?.value==="za")visible.sort((a,b)=>b.dataset.title.localeCompare(a.dataset.title));
  cards.forEach(card=>card.hidden=true);
  visible.forEach(card=>{card.hidden=false;grid.appendChild(card)});
  if(count)count.textContent=String(visible.length);
  if(empty)empty.hidden=visible.length>0;
  chips.forEach(chip=>chip.setAttribute("aria-pressed",String(chip.dataset.filterChip===category)));
 }
 search?.addEventListener("input",renderGallery);
 categorySelect?.addEventListener("change",()=>{activeCategory="All";renderGallery()});
 sortSelect?.addEventListener("change",renderGallery);
 statusSelect?.addEventListener("change",renderGallery);
 chips.forEach(chip=>chip.addEventListener("click",()=>{activeCategory=chip.dataset.filterChip; if(categorySelect)categorySelect.value="All";renderGallery()}));
 renderGallery();
}


// Small, transparent cookie notice. This site does not load analytics or advertising cookies.
(() => {
  const noticeCookie = "jigar_cookie_notice";
  const hasSeenNotice = () => document.cookie.split(";").some(item => item.trim().startsWith(noticeCookie + "="));
  const saveNoticeChoice = () => {
    document.cookie = noticeCookie + "=seen; Max-Age=15552000; Path=/; SameSite=Lax" + (location.protocol === "https:" ? "; Secure" : "");
  };
  const notice = document.createElement("aside");
  notice.className = "cookie-notice";
  notice.setAttribute("aria-label", "Cookie notice");
  notice.setAttribute("aria-live", "polite");
  notice.hidden = hasSeenNotice();
  notice.innerHTML = '<div class="cookie-notice-copy"><strong>Cookies, minus the creepy stuff.</strong><p>This site uses essential browser storage to remember your theme and this notice. No analytics or advertising cookies are used.</p></div><button type="button" class="cookie-notice-dismiss">Got it</button>';
  document.body.appendChild(notice);
  const dismiss = () => {
    saveNoticeChoice();
    notice.hidden = true;
  };
  notice.querySelector(".cookie-notice-dismiss").addEventListener("click", dismiss);
  document.querySelectorAll(".footer-bottom").forEach(footer => {
    const link = document.createElement("button");
    link.type = "button";
    link.className = "cookie-notice-link";
    link.textContent = "Cookie notice";
    link.addEventListener("click", () => {
      notice.hidden = false;
      notice.querySelector(".cookie-notice-dismiss").focus();
    });
    footer.appendChild(link);
  });
})();
