import{createClient}from"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import{SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY}from"/assets/js/supabase-client.js";
const db=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
const features=[...document.querySelectorAll("[data-project-slug]")];
if(features.length){
 const{data,error}=await db.from("projects").select("slug,title,summary,website_url,repository_url,metadata").eq("is_published",true);
 if(error)console.error("Could not load featured portfolio projects:",error.message);
 else{
  const bySlug=new Map((data||[]).map(p=>[p.slug,p]));
  for(const feature of features){
   const p=bySlug.get(feature.dataset.projectSlug);if(!p)continue;
   const heading=feature.querySelector(".feature-copy h2");if(heading)heading.textContent=p.title||"";
   const summary=feature.querySelector(".feature-copy p:not(.kicker)");if(summary)summary.textContent=p.summary||"";
   const links=feature.querySelector(".feature-copy .links");
   if(links){
    links.replaceChildren();
    const metadata=p.metadata&&typeof p.metadata==="object"?p.metadata:{};
    const items=[[p.website_url,"Open project ↗"],[p.repository_url,"Source code ↗"],...(Array.isArray(metadata.links)?metadata.links.map(x=>[x.url,x.label]):[])];
    for(const[url,label]of items){if(!url||!label)continue;try{const u=new URL(url);if(!["https:","http:"].includes(u.protocol))continue;const a=document.createElement("a");a.href=u.href;a.target="_blank";a.rel="noopener noreferrer";a.textContent=String(label);links.append(a);}catch{}}
   }
   const artwork=feature.querySelector("a.artwork");if(artwork&&p.website_url)artwork.href=p.website_url;
  }
 }
}