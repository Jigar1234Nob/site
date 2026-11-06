import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const ALLOWED_ORIGINS=new Set(["https://jigar.au","https://www.jigar.au"]);
const ALLOWED_HEADERS=["authorization","x-client-info","apikey","content-type","x-supabase-api-version","x-supabase-client-platform","x-supabase-client-platform-version","x-supabase-client-runtime","x-supabase-client-runtime-version","x-supabase-client-version","x-supabase-auth-authorization","x-retry-count","traceparent","tracestate","baggage"].join(", ");
function corsHeaders(origin:string){const allowed=ALLOWED_ORIGINS.has(origin)?origin:"";return{...(allowed?{"Access-Control-Allow-Origin":allowed}:{}),"Access-Control-Allow-Headers":ALLOWED_HEADERS,"Access-Control-Allow-Methods":"POST, OPTIONS","Access-Control-Max-Age":"86400","Vary":"Origin"};}
function respond(body:unknown,status=200,origin="https://jigar.au"){return new Response(JSON.stringify(body),{status,headers:{...corsHeaders(origin),"Content-Type":"application/json"}});}
Deno.serve(async(req)=>{
 const origin=req.headers.get("Origin")||"";
 if(req.method==="OPTIONS"){if(!ALLOWED_ORIGINS.has(origin))return new Response("Origin not allowed",{status:403});return new Response("ok",{status:200,headers:corsHeaders(origin)});}
 if(origin&&!ALLOWED_ORIGINS.has(origin))return respond({error:"Origin not allowed"},403,origin);
 if(req.method!=="POST")return respond({error:"Method not allowed"},405,origin);
 const authHeader=req.headers.get("Authorization")||"";
 if(!authHeader.startsWith("Bearer "))return respond({error:"Sign-in required"},401,origin);
 const url=Deno.env.get("SUPABASE_URL"),serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),anon=Deno.env.get("SUPABASE_ANON_KEY");
 if(!url||!serviceKey||!anon)return respond({error:"Server function is not configured"},503,origin);
 const userClient=createClient(url,anon,{global:{headers:{Authorization:authHeader}}});
 const {data:{user},error:userError}=await userClient.auth.getUser();
 if(userError||!user)return respond({error:"Invalid or expired session"},401,origin);
 const admin=createClient(url,serviceKey,{auth:{autoRefreshToken:false,persistSession:false}});
 const {data:roles,error:roleError}=await admin.from("user_roles").select("role").eq("user_id",user.id);
 if(roleError)return respond({error:"Could not verify staff permissions"},500,origin);
 const isAdmin=(roles||[]).some(r=>r.role==="admin"),isStaff=isAdmin||(roles||[]).some(r=>r.role==="editor");
 if(!isStaff)return respond({error:"Staff access required"},403,origin);
 let payload:{action?:string;user_id?:string;disabled?:boolean;event_action?:string;resource_type?:string;resource_id?:string;details?:Record<string,unknown>};
 try{payload=await req.json();}catch{return respond({error:"Invalid JSON body"},400,origin);}
 if(payload.action==="log"){
  if(!payload.event_action||!payload.resource_type)return respond({error:"Audit action and resource type are required"},400,origin);
  const {error}=await admin.from("audit_logs").insert({actor_id:user.id,action:payload.event_action,resource_type:payload.resource_type,resource_id:payload.resource_id||null,details:payload.details||{}});
  if(error)return respond({error:"Could not write audit event"},500,origin);
  return respond({logged:true},200,origin);
 }
 if(!isAdmin)return respond({error:"Administrator access required"},403,origin);
 if(payload.action==="list"){
  const {data,error}=await admin.auth.admin.listUsers({page:1,perPage:1000});
  if(error)return respond({error:error.message},500,origin);
  return respond({users:data.users.map(u=>({id:u.id,email:u.email,created_at:u.created_at,last_sign_in_at:u.last_sign_in_at,email_confirmed_at:u.email_confirmed_at,banned_until:u.banned_until,user_metadata:u.user_metadata}))},200,origin);
 }
 if(!payload.user_id||payload.user_id===user.id)return respond({error:"A different target user is required"},400,origin);
 const {data:targetRoles}=await admin.from("user_roles").select("role").eq("user_id",payload.user_id);
 if((targetRoles||[]).some(r=>r.role==="admin")){const {count}=await admin.from("user_roles").select("user_id",{count:"exact",head:true}).eq("role","admin");if((count||0)<=1)return respond({error:"You cannot disable or delete the only administrator account."},400,origin);}
 if(payload.action==="set_disabled"){
  const {data,error}=await admin.auth.admin.updateUserById(payload.user_id,{ban_duration:payload.disabled?"876000h":"none"});
  if(error)return respond({error:error.message},400,origin);
  await admin.from("audit_logs").insert({actor_id:user.id,action:payload.disabled?"auth_user_disabled":"auth_user_enabled",resource_type:"auth_user",resource_id:payload.user_id,details:{}});
  return respond({user_id:data.user.id,disabled:Boolean(payload.disabled)},200,origin);
 }
 if(payload.action==="delete"){
  const {error}=await admin.auth.admin.deleteUser(payload.user_id);
  if(error)return respond({error:error.message},400,origin);
  await admin.from("audit_logs").insert({actor_id:user.id,action:"auth_user_deleted",resource_type:"auth_user",resource_id:payload.user_id,details:{}});
  return respond({user_id:payload.user_id,deleted:true},200,origin);
 }
 return respond({error:"Unsupported action"},400,origin);
});