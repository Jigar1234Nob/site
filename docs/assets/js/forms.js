import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "/assets/js/supabase-client.js";

const db = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const $ = (selector) => document.querySelector(selector);
const root = $("#public-form");
const params = new URLSearchParams(location.search);
const slug = params.get("slug");
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));

function formCard(form, archived = false) {
  return `<article class="public-form-list-card">
    <div class="public-form-card-top">
      <span class="public-form-status ${archived ? "archived" : "open"}">${archived ? "Archived · View only" : "Open"}</span>
    </div>
    <h2>${esc(form.title)}</h2>
    <p>${esc(form.description || "View the form details.")}</p>
    <a class="account-submit public-form-open-link" href="/forms/?slug=${encodeURIComponent(form.slug)}">${archived ? "View archived form" : "Open form"} <span aria-hidden="true">→</span></a>
  </article>`;
}

async function renderListing() {
  const { data: forms, error } = await db.from("forms")
    .select("id,slug,title,description,status,updated_at")
    .in("status", ["open", "archived"])
    .order("updated_at", { ascending: false });

  if (error) {
    root.innerHTML = '<section class="public-form-card"><h1>Forms unavailable</h1><p>We could not load the forms right now. Please try again later.</p></section>';
    return;
  }

  const openForms = (forms || []).filter((form) => form.status === "open");
  const archivedForms = (forms || []).filter((form) => form.status === "archived");

  root.innerHTML = `
    <div class="public-form-intro">
      <p class="kicker">JIGAR.AU · COMMUNITY FORMS</p>
      <h1>Forms & applications</h1>
      <p>Browse currently available forms and previous forms that are still accepting responses.</p>
    </div>
    <section class="public-form-section" aria-labelledby="open-forms-heading">
      <div class="public-form-section-heading"><div><p class="kicker">AVAILABLE NOW</p><h2 id="open-forms-heading">Open forms</h2></div><span class="public-form-count">${openForms.length}</span></div>
      <div class="public-form-list">${openForms.length ? openForms.map((form) => formCard(form)).join("") : '<p class="public-form-empty">There are no open forms right now.</p>'}</div>
    </section>
    <section class="public-form-section archived-section" aria-labelledby="archived-forms-heading">
      <div class="public-form-section-heading"><div><p class="kicker">PREVIOUSLY LISTED</p><h2 id="archived-forms-heading">Archived forms</h2><p>Archived forms can still be viewed, but submissions are disabled.</p></div><span class="public-form-count">${archivedForms.length}</span></div>
      <div class="public-form-list">${archivedForms.length ? archivedForms.map((form) => formCard(form, true)).join("") : '<p class="public-form-empty">There are no archived forms.</p>'}</div>
    </section>`;
}

function fieldHtml(field) {
  const id = "field-" + field.name;
  const required = field.required ? "required" : "";
  const label = esc(field.label) + (field.required ? " *" : "");
  if (field.type === "textarea") {
    return `<label class="public-field" for="${esc(id)}">${label}<textarea id="${esc(id)}" name="${esc(field.name)}" ${required} maxlength="${Number(field.maxLength || 4000)}"></textarea></label>`;
  }
  if (field.type === "checkbox") {
    return `<label class="public-check"><input id="${esc(id)}" name="${esc(field.name)}" type="checkbox" ${required}><span>${label}</span></label>`;
  }
  if (["select", "multiselect"].includes(field.type)) {
    return `<label class="public-field" for="${esc(id)}">${label}<select id="${esc(id)}" name="${esc(field.name)}" ${field.type === "multiselect" ? "multiple" : ""} ${required}>${field.type === "select" ? '<option value="">Choose an option…</option>' : ""}${(field.options || []).map((option) => '<option value="' + esc(option) + '">' + esc(option) + "</option>").join("")}</select></label>`;
  }
  const type = ["email", "number", "date"].includes(field.type) ? field.type : "text";
  return `<label class="public-field" for="${esc(id)}">${label}<input id="${esc(id)}" name="${esc(field.name)}" type="${type}" ${required} maxlength="${Number(field.maxLength || 500)}"></label>`;
}

function showMessage(text, isError = false) {
  const element = $("#form-status");
  if (!element) return;
  element.textContent = text;
  element.dataset.type = isError ? "error" : "success";
  element.hidden = false;
}

async function renderForm() {
  const { data: form, error } = await db.from("forms")
    .select("id,slug,title,description,definition,allow_anonymous,status")
    .eq("slug", slug)
    .in("status", ["open", "archived"])
    .maybeSingle();

  if (error || !form) {
    root.innerHTML = '<section class="public-form-card"><h1>Form unavailable</h1><p>This form is not available. It may have been closed or moved.</p><a href="/forms/">Browse available forms</a></section>';
    return;
  }

  const { data: authData } = await db.auth.getSession();
  const session = authData?.session || null;
  if (!form.allow_anonymous && !session) {
    root.innerHTML = '<section class="public-form-card"><h1>Sign in required</h1><p>You need to sign in before submitting this form.</p><a href="/account/">Sign in</a></section>';
    return;
  }

  const fields = form.definition?.fields || [];
  const archivedNotice = form.status === "archived"
    ? '<p class="public-form-archived-notice">This form is archived and available to view only. Submissions are closed.</p>'
    : "";

  root.innerHTML = `
    <div class="public-form-intro">
      <p class="kicker">JIGAR.AU · ONLINE FORM</p>
      <p><a href="/forms/">← All forms</a></p>
      ${archivedNotice}
      <h1>${esc(form.title)}</h1>
      <p>${esc(form.description || "Complete the form below. Required fields are marked.")}</p>
      <p class="form-privacy">Your response is visible only to authorised site staff and, when signed in, your account.</p>
    </div>
    ${form.status === "archived" ? `<section class="public-form-card" aria-label="Archived form responses">${fields.map((field) => fieldHtml({...field, required: false})).join("")}<p class="form-privacy">This archived form is read-only. Responses are no longer accepted.</p></section>` : `<form id="submission-form" class="public-form-card">
      <div id="form-status" class="account-status" role="status" hidden></div>
      ${fields.map(fieldHtml).join("")}
      <label class="form-honeypot" aria-hidden="true">Leave this field empty<input name="website" tabindex="-1" autocomplete="off"></label>
      <button class="account-submit" type="submit">Submit response</button>
      <p class="form-privacy">Please do not include passwords, authentication codes or unnecessary sensitive information.</p>
    </form>`}`;

  if (form.status !== "open") return;

  $("#submission-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (formElement.elements.website.value) return;
    const button = formElement.querySelector('button[type="submit"]');
    button.disabled = true;
    const answers = {};

    for (const field of fields) {
      const element = formElement.elements[field.name];
      if (!element) continue;
      const value = field.type === "checkbox" ? element.checked
        : field.type === "multiselect" ? [...element.selectedOptions].map((option) => option.value)
        : element.value.trim();
      if (field.required && (value === false || value === "" || (Array.isArray(value) && !value.length))) {
        button.disabled = false;
        showMessage("Please complete: " + field.label, true);
        element.focus();
        return;
      }
      answers[field.name] = value;
    }

    const applicantName = answers.full_name || answers.name || session?.user?.user_metadata?.display_name || null;
    const applicantEmail = answers.email || session?.user?.email || null;
    const { error: submitError } = await db.from("form_submissions").insert({
      form_id: form.id,
      user_id: session?.user?.id || null,
      applicant_name: applicantName,
      applicant_email: applicantEmail,
      answers,
      assessment_version: Number(form.definition?.version || 1),
      assessment_definition: form.definition || {}
    });

    button.disabled = false;
    if (submitError) {
      showMessage("Your response could not be submitted. Please try again or contact support.", true);
      return;
    }

    formElement.innerHTML = '<h2>Response submitted.</h2><p>Thank you. Your response has been received.</p><a href="/forms/">Back to all forms</a>';
  });
}

if (slug) renderForm();
else renderListing();
