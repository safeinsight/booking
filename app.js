const cfg = window.BOOKING_CONFIG;
const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);

const state = {
  locations: [],
  location: null,
  date: null,
  availability: null,
  selectedStart: null,
  selectedEnd: null,
  student: null
};

const $ = id => document.getElementById(id);
const panels = [...document.querySelectorAll(".step-panel")];

function showStep(n) {
  panels.forEach(p => p.classList.toggle("hidden", Number(p.dataset.panel) !== n));
  document.querySelectorAll(".step").forEach(s =>
    s.classList.toggle("active", Number(s.dataset.step) === n)
  );
}

function showError(message) {
  $("loading").classList.add("hidden");
  $("error").textContent = message;
  $("error").classList.remove("hidden");
}

function formatTime(iso) {
  return new Intl.DateTimeFormat(undefined, {hour:"numeric", minute:"2-digit"}).format(new Date(iso));
}
function formatDate(iso) {
  return new Intl.DateTimeFormat(undefined, {weekday:"long", month:"long", day:"numeric", year:"numeric"})
    .format(new Date(iso));
}
function getSlug() {
  return new URLSearchParams(location.search).get("location") || cfg.defaultLocationSlug;
}

function applyBranding(loc) {
  const root = document.documentElement;
  root.style.setProperty("--primary", loc.primary_color || "#FFFFFF");
  root.style.setProperty("--secondary", loc.secondary_color || "#000000");
  root.style.setProperty("--accent", loc.accent_color || "#FF0000");
  $("brandLogo").src = loc.logo_url || "assets/safe-insight-logo.png";
  $("brandLogo").alt = loc.name || "Booking";
  $("brandName").textContent = loc.name || "Booking";
  $("brandSubtitle").textContent = loc.instructor_name ? `with ${loc.instructor_name}` : "Booking";
  $("footerText").textContent = loc.footer_text || `Booking powered by ${loc.name || "Safe Insight"}`;
}

function renderLocationSummary() {
  const l = state.location;
  $("locationSummary").innerHTML = `
    <strong>${escapeHtml(l.name)}</strong><br>
    ${l.instructor_name ? `Instructor: ${escapeHtml(l.instructor_name)}<br>` : ""}
    ${l.address ? escapeHtml(l.address) + "<br>" : ""}
    ${l.appointment_length_minutes} minute slots<br>
    Capacity: ${l.max_students_per_slot} student${l.max_students_per_slot === 1 ? "" : "s"} per slot
  `;
}

async function loadLocations() {
  const { data, error } = await db
    .from("locations")
    .select("id,slug,name,instructor_name,address,timezone,appointment_length_minutes,max_students_per_slot,cancellation_hours,reschedule_hours,primary_color,secondary_color,accent_color,logo_url,footer_text,payment_required")
    .eq("active", true)
    .order("name");

  if (error) throw error;
  state.locations = data || [];
  if (!state.locations.length) throw new Error("No active booking locations are configured.");

  const select = $("locationSelect");
  select.innerHTML = state.locations.map(l =>
    `<option value="${escapeAttr(l.slug)}">${escapeHtml(l.name)}${l.instructor_name ? " — " + escapeHtml(l.instructor_name) : ""}</option>`
  ).join("");

  const wanted = getSlug();
  const selected = state.locations.find(l => l.slug === wanted) || state.locations[0];
  select.value = selected.slug;
  state.location = selected;
  applyBranding(selected);
  renderLocationSummary();
}

async function loadDates() {
  $("availabilityNote").textContent =
    `Bookings are available for the next two weeks and must be made at least 24 hours in advance. ` +
    `Cancellation: ${state.location.cancellation_hours} hours. ` +
    `Reschedule: ${state.location.reschedule_hours} hours.`;

  const res = await fetch(`${cfg.functionsBaseUrl}/get-availability?location=${encodeURIComponent(state.location.slug)}`, {
    headers: { "Authorization": `Bearer ${cfg.supabaseAnonKey}` }
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Unable to load availability.");

  state.availability = json;
  const dateSelect = $("dateSelect");
  dateSelect.innerHTML = json.days.map(d =>
    `<option value="${d.date}">${escapeHtml(d.label)}${d.has_available ? "" : " — No availability"}</option>`
  ).join("");

  state.date = json.days.find(d => d.has_available)?.date || json.days[0]?.date;
  if (state.date) dateSelect.value = state.date;
  renderSlots();
}

function renderSlots() {
  const day = state.availability.days.find(d => d.date === state.date);
  const container = $("slots");
  state.selectedStart = state.selectedEnd = null;
  $("toInfoBtn").disabled = true;

  if (!day) {
    container.innerHTML = "<p class='muted'>No availability for this date.</p>";
    return;
  }

  container.innerHTML = day.slots.map((s, i) => {
    const status = s.blocked ? "blocked" : (s.remaining <= 0 ? "unavailable full" : "");
    return `<button type="button" class="slot ${status}" data-index="${i}" ${status ? "disabled" : ""}>
      ${formatTime(s.start)}<br><small>${s.remaining} space${s.remaining === 1 ? "" : "s"}</small>
    </button>`;
  }).join("");

  container.querySelectorAll(".slot:not(:disabled)").forEach(btn =>
    btn.addEventListener("click", () => selectSlot(Number(btn.dataset.index)))
  );
}

function selectSlot(index) {
  const day = state.availability.days.find(d => d.date === state.date);
  const slots = day.slots;
  const clicked = slots[index];
  if (!clicked || clicked.blocked || clicked.remaining <= 0) return;

  // First click starts a contiguous booking.
  if (!state.selectedStart) {
    state.selectedStart = index;
    state.selectedEnd = index;
  } else if (index === state.selectedStart) {
    // Clicking start again clears selection.
    state.selectedStart = state.selectedEnd = null;
  } else if (index === state.selectedStart - 1) {
    // Extend backward only if consecutive and available.
    state.selectedStart = index;
  } else if (index === state.selectedEnd + 1) {
    // Extend forward only if consecutive and available.
    state.selectedEnd = index;
  } else {
    // A non-adjacent click starts a new contiguous selection.
    state.selectedStart = state.selectedEnd = index;
  }

  // Validate every slot in the selected range.
  if (state.selectedStart !== null) {
    for (let i = state.selectedStart; i <= state.selectedEnd; i++) {
      if (slots[i].blocked || slots[i].remaining <= 0) {
        state.selectedEnd = i - 1;
        break;
      }
    }
  }

  const buttons = [...container.querySelectorAll(".slot")];
  buttons.forEach((b, i) => {
    b.classList.toggle("start", i === state.selectedStart);
    b.classList.toggle("selected", state.selectedStart !== null && i >= state.selectedStart && i <= state.selectedEnd);
  });

  if (state.selectedStart !== null) {
    const first = slots[state.selectedStart], last = slots[state.selectedEnd];
    $("selectionSummary").textContent =
      `Selected: ${formatTime(first.start)} – ${formatTime(last.end)}`;
    $("toInfoBtn").disabled = false;
  } else {
    $("selectionSummary").textContent = "";
    $("toInfoBtn").disabled = true;
  }
}

function buildReview() {
  const day = state.availability.days.find(d => d.date === state.date);
  const first = day.slots[state.selectedStart];
  const last = day.slots[state.selectedEnd];
  const l = state.location;

  $("review").innerHTML = `
    <strong>${escapeHtml(l.name)}</strong><br>
    ${l.instructor_name ? `Instructor: ${escapeHtml(l.instructor_name)}<br>` : ""}
    ${formatDate(first.start)}<br>
    ${formatTime(first.start)} – ${formatTime(last.end)}<br>
    ${l.address ? escapeHtml(l.address) + "<br>" : ""}
    <hr>
    <strong>Student</strong><br>
    ${escapeHtml(state.student.fullName)}<br>
    ${escapeHtml(state.student.phone)}<br>
    ${escapeHtml(state.student.email)}
  `;

  if (l.payment_required) {
    $("paymentNotice").textContent = "Payment will be collected securely before the booking is finalized.";
    $("paymentNotice").classList.remove("hidden");
  } else {
    $("paymentNotice").classList.add("hidden");
  }
}

$("locationSelect").addEventListener("change", async e => {
  try {
    state.location = state.locations.find(l => l.slug === e.target.value);
    applyBranding(state.location);
    renderLocationSummary();
    await loadDates();
  } catch (err) { showError(err.message); }
});

$("toDateBtn").addEventListener("click", async () => {
  try { await loadDates(); showStep(2); }
  catch (err) { showError(err.message); }
});
$("dateSelect").addEventListener("change", e => {
  state.date = e.target.value;
  renderSlots();
});
$("toInfoBtn").addEventListener("click", () => showStep(3));
$("studentForm").addEventListener("submit", e => {
  e.preventDefault();
  state.student = {
    fullName: $("fullName").value.trim(),
    phone: $("phone").value.trim(),
    email: $("email").value.trim()
  };
  buildReview();
  showStep(4);
});
document.querySelectorAll(".back").forEach(b => b.addEventListener("click", () => showStep(Number(b.dataset.back))));

$("confirmBtn").addEventListener("click", async () => {
  $("confirmBtn").disabled = true;
  $("submitStatus").textContent = "Checking availability and creating your booking…";
  try {
    const day = state.availability.days.find(d => d.date === state.date);
    const first = day.slots[state.selectedStart];
    const last = day.slots[state.selectedEnd];

    const res = await fetch(`${cfg.functionsBaseUrl}/create-booking`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${cfg.supabaseAnonKey}`
      },
      body: JSON.stringify({
        location_slug: state.location.slug,
        start_time: first.start,
        end_time: last.end,
        student: state.student
      })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "The booking could not be completed.");

    if (json.checkout_url) {
      window.location.href = json.checkout_url;
      return;
    }

    $("bookingApp").querySelectorAll(".step-panel").forEach(p => p.classList.add("hidden"));
    $("success").classList.remove("hidden");
    $("successText").textContent =
      `Your appointment at ${state.location.name} is confirmed for ${formatDate(first.start)}, ${formatTime(first.start)} – ${formatTime(last.end)}.`;
    $("manageLink").href = json.manage_url || "#";
  } catch (err) {
    $("submitStatus").textContent = err.message;
    $("confirmBtn").disabled = false;
  }
});

function escapeHtml(v) {
  return String(v ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}
function escapeAttr(v) { return escapeHtml(v); }

(async function init() {
  try {
    await loadLocations();
    $("loading").classList.add("hidden");
    $("bookingApp").classList.remove("hidden");
    showStep(1);
  } catch (err) { showError(err.message); }
})();
