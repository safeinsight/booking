const cfg = window.BOOKING_CONFIG;

const db = window.supabase.createClient(
  cfg.supabaseUrl,
  cfg.supabaseAnonKey
);

const $ = id => document.getElementById(id);

async function getAuthHeaders() {
  const {
    data: { session }
  } = await db.auth.getSession();

  if (!session?.access_token) {
    throw new Error(
      "Your session has expired. Please log in again."
    );
  }

  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session.access_token}`
  };
}

function isAdministrator() {
  return state.role === "Administrator";
}

function isManager() {
  return state.role === "Manager";
}

function isInstructor() {
  return state.role === "Instructor";
}

function canEditLocation() {
  return isAdministrator();
}

function canEditBranding() {
  return isAdministrator();
}

function canEditAvailability() {
  return (
    isAdministrator() ||
    isManager() ||
    isInstructor()
  );
}

function canEditEmails() {
  return (
    isAdministrator() ||
    isManager()
  );
}

function canManageUsers() {
  return (
    isAdministrator() ||
    isManager()
  );
}

const state = {
  locations: [],
  location: null,
  instructors: [],
  instructor: null,
  user: null,
  role: null
};


function showError(message) {
  $("loading")?.classList.add("hidden");

  const error = $("error");

  if (error) {
    error.textContent = message;
    error.classList.remove("hidden");
  } else {
    console.error(
      "SETTINGS ERROR:",
      message
    );
  }
}


function setColorPair(colorInput, textInput, value) {
  const color = value || "#000000";

  $(colorInput).value = color;
  $(textInput).value = color;
}

async function authenticateSettingsUser() {
  const {
    data: { session }
  } = await db.auth.getSession();

  if (!session) {
    return false;
  }

  const {
    data: { user },
    error
  } = await db.auth.getUser();

  if (error || !user) {
    return false;
  }

  const { data: settingsUser, error: roleError } =
    await db
      .from("settings_users")
      .select("role, active")
      .eq("user_id", user.id)
      .single();

  if (roleError || !settingsUser) {
    throw new Error(
      "Your account is not authorized to access Booking Settings."
    );
  }

  if (!settingsUser.active) {
    throw new Error(
      "Your Booking Settings account has been deactivated."
    );
  }

  state.user = user;
  state.role = settingsUser.role;



  return true;
}

function applyRolePermissions() {
  const locationTab = $("locationTab");
  const usersTab = $("usersTab");
  const brandingTab = $("brandingTab");
  const availabilityTab = $("availabilityTab");
  const calendarTab = $("calendarTab");
  const emailsTab = $("emailsTab");

const locationTabButton =
  document.querySelector('[data-tab="locationTab"]');

const usersTabButton =
  document.querySelector('[data-tab="usersTab"]');

const brandingTabButton =
  document.querySelector('[data-tab="brandingTab"]');

const availabilityTabButton =
  document.querySelector('[data-tab="availabilityTab"]');

const calendarTabButton =
  document.querySelector('[data-tab="calendarTab"]');

const emailsTabButton =
  document.querySelector('[data-tab="emailsTab"]');

  // Administrator: full access
  if (canEditLocation()) {
    locationTabButton?.classList.remove("hidden");
    locationTab?.classList.remove("hidden");
  }

// Users: Administrator and Manager
if (canManageUsers()) {
  usersTabButton?.classList.remove("hidden");
  usersTab?.classList.remove("hidden");
}

  if (canEditBranding()) {
    brandingTabButton?.classList.remove("hidden");
    brandingTab?.classList.remove("hidden");
  }

  // Availability: Administrator, Manager, Instructor
if (canEditAvailability()) {
  availabilityTabButton?.classList.remove("hidden");
  availabilityTab?.classList.remove("hidden");
}

if (
  isAdministrator() ||
  isManager() ||
  isInstructor()
) {
  calendarTabButton?.classList.remove("hidden");
  calendarTab?.classList.remove("hidden");
}

if (canEditEmails()) {
  emailsTabButton?.classList.remove("hidden");
  emailsTab?.classList.remove("hidden");
}

  // Hide tabs that this role cannot access
  if (!canEditLocation()) {
    locationTabButton?.classList.add("hidden");
  }

if (!canManageUsers()) {
  usersTabButton?.classList.add("hidden");
  usersTab?.classList.add("hidden");
}

  if (!canEditBranding()) {
    brandingTabButton?.classList.add("hidden");
  }

if (!canEditAvailability()) {
  availabilityTabButton?.classList.add("hidden");
}

if (
  !isAdministrator() &&
  !isManager() &&
  !isInstructor()
) {
  calendarTabButton?.classList.add("hidden");
  calendarTab?.classList.add("hidden");
}

if (!canEditEmails()) {
  emailsTabButton?.classList.add("hidden");
}
}

async function loadLocationIntoForm(loc) {

state.location = loc;

const selectedLocationName =
  $("selectedLocationName");

if (selectedLocationName) {
  selectedLocationName.textContent =
    loc.name || "Default";
}

  if (!state.instructor) {
    console.warn(
      "No instructor is currently selected."
    );
  }

  $("locationName").value = loc.name || "";
  $("address").value = loc.address || "";
  $("website").value = loc.website || "";

  $("logoUrl").value =
    loc.logo_url || "safe-insight-logo.png";

  $("logoPreview").src =
    loc.logo_url || "safe-insight-logo.png";

  setColorPair(
    "primaryColor",
    "primaryColorText",
    loc.primary_color || "#FFFFFF"
  );

  setColorPair(
    "secondaryColor",
    "secondaryColorText",
    loc.secondary_color || "#000000"
  );

  setColorPair(
    "accentColor",
    "accentColorText",
    loc.accent_color || "#FF0000"
  );

  const bookingRules =
    state.instructor || loc;

  $("appointmentLength").textContent =
    `${bookingRules.appointment_length_minutes || 60} minutes`;

  $("maxStudents").textContent =
    `${bookingRules.max_students_per_slot || 8} students`;

  $("bookingHorizon").textContent =
    `${bookingRules.booking_horizon_days || 14} days`;

  $("minimumNotice").textContent =
    `${bookingRules.minimum_booking_notice_hours || 24} hours`;

  $("appointmentLengthInput").value =
    bookingRules.appointment_length_minutes || 60;

  $("maxStudentsInput").value =
    bookingRules.max_students_per_slot || 8;

  $("bookingHorizonInput").value =
    bookingRules.booking_horizon_days || 14;

  $("minimumNoticeInput").value =
    bookingRules.minimum_booking_notice_hours ?? 24;

  $("cancellationHoursInput").value =
    bookingRules.cancellation_hours ?? 24;

  $("rescheduleHoursInput").value =
    bookingRules.reschedule_hours ?? 12;

    $("emailSubject").value =
    loc.confirmation_email_subject ||
    "Your appointment confirmation";

$("emailMessage").value =
  loc.confirmation_email_message ||
  `Thank you for booking with us!

Appointment Date: {{DATE}}
Appointment Time: {{TIME}}
Location: {{LOCATION}}

{{CONFIRMATION_BUTTON}}

{{MANAGE_BUTTON}}`;

$("confirmationButtonEnabled").checked =
  Boolean(loc.confirmation_button_enabled);

$("confirmationButtonText").value =
  loc.confirmation_button_text || "Join Video Conference";

$("confirmationButtonUrl").value =
  loc.confirmation_button_url || "";

$("reminderEnabled").checked =
  loc.reminder_enabled ?? true;

$("reminderHoursBefore").value =
  loc.reminder_hours_before ?? 24;

$("instructorEmail").value =
  loc.instructor_email || "";

$("studentReminderSubject").value =
  loc.student_reminder_subject ||
  "Reminder: Your upcoming appointment";

$("studentReminderMessage").value =
  loc.student_reminder_message ||
  `This is a reminder about your upcoming appointment.

Appointment Date: {{DATE}}
Appointment Time: {{TIME}}
Location: {{LOCATION}}

{{CONFIRMATION_BUTTON}}

{{MANAGE_BUTTON}}`;

$("instructorReminderSubject").value =
  loc.instructor_reminder_subject ||
  "Upcoming appointment reminder";

$("instructorReminderMessage").value =
  loc.instructor_reminder_message ||
  `This is a reminder about an upcoming appointment.

Appointment Date: {{DATE}}
Appointment Time: {{TIME}}
Location: {{LOCATION}}
Student: {{STUDENT_NAME}}
Instructor: {{INSTRUCTOR_NAME}}`;

$("followupEnabled").checked =
  loc.followup_enabled ?? true;

$("followupDelayMinutes").value =
  loc.followup_delay_minutes ?? 15;

$("followupSubject").value =
  loc.followup_subject ||
  "Thank you for your appointment";

$("followupMessage").value =
  loc.followup_message ||
  `Thank you for completing your appointment.

Appointment Date: {{DATE}}
Appointment Time: {{TIME}}
Location: {{LOCATION}}
Student: {{STUDENT_NAME}}
Instructor: {{INSTRUCTOR_NAME}}`;

  let availabilityRules = [];
  let availabilityError = null;

  if (state.instructor?.id) {
    const response =
      await db
        .from("availability_rules")
        .select(`
          id,
          instructor_id,
          day_of_week,
          start_time,
          end_time,
          enabled
        `)
        .eq("instructor_id", state.instructor.id)
        .order("day_of_week")
        .order("start_time");

    availabilityRules =
      response.data || [];

    availabilityError =
      response.error;
  }

  if (availabilityError) {
    console.error(
      "AVAILABILITY RULES ERROR:",
      availabilityError
    );

    $("availabilityRules").innerHTML =
      `<div class="state error">
        Unable to load availability rules.
      </div>`;
  } else {

    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday"
    ];

const rules =
  availabilityRules || [];

$("availabilityRules").innerHTML =
  dayNames.map((dayName, dayIndex) => {

    const dayRules =
      rules.filter(
        rule =>
          Number(rule.day_of_week) === dayIndex
      );

    const rows =
      dayRules.length
        ? dayRules
        : [null];

    return `
      <div
        class="availability-day"
        data-day="${dayIndex}"
        style="
          margin-top:16px;
          padding:12px;
          border:1px solid #ddd;
          border-radius:8px;
        "
      >

        <strong>
          ${dayName}
        </strong>

        <div class="availability-slots">

          ${rows.map(rule => `
            <div
              class="availability-row"
              style="
                display:grid;
                grid-template-columns:
                  90px
                  130px
                  130px
                  90px;
                gap:10px;
                align-items:center;
                margin-top:10px;
              "
            >

              <label style="margin:0;">
                <input
                  type="checkbox"
                  class="availability-enabled"
                  data-day="${dayIndex}"
                  ${rule?.enabled ? "checked" : ""}
                >
                Enabled
              </label>

              <input
                type="time"
                class="availability-start"
                data-day="${dayIndex}"
                value="${rule?.start_time
                  ? rule.start_time.substring(0, 5)
                  : ""}"
              >

              <input
                type="time"
                class="availability-end"
                data-day="${dayIndex}"
                value="${rule?.end_time
                  ? rule.end_time.substring(0, 5)
                  : ""}"
              >

              <button
                type="button"
                class="secondary availability-delete"
              >
                Delete
              </button>

            </div>
          `).join("")}

        </div>

        <button
          type="button"
          class="secondary availability-add"
          data-day="${dayIndex}"
          style="margin-top:10px;"
        >
          + Add Time Slot
        </button>

      </div>
    `;
  }).join("");

  document
  .querySelectorAll(".availability-add")
  .forEach(button => {

    button.addEventListener("click", () => {

      const day =
        button.dataset.day;

      const container =
        button
          .closest(".availability-day")
          .querySelector(".availability-slots");

      const row =
        document.createElement("div");

      row.className =
        "availability-row";

      row.style.cssText = `
        display:grid;
        grid-template-columns:
          90px
          130px
          130px
          90px;
        gap:10px;
        align-items:center;
        margin-top:10px;
      `;

      row.innerHTML = `
        <label style="margin:0;">
          <input
            type="checkbox"
            class="availability-enabled"
            data-day="${day}"
            checked
          >
          Enabled
        </label>

        <input
          type="time"
          class="availability-start"
          data-day="${day}"
          value=""
        >

        <input
          type="time"
          class="availability-end"
          data-day="${day}"
          value=""
        >

        <button
          type="button"
          class="secondary availability-delete"
        >
          Delete
        </button>
      `;

      container.appendChild(row);

      row
        .querySelector(".availability-delete")
        .addEventListener("click", () => {
          row.remove();
        });

    });

  });

document
  .querySelectorAll(".availability-delete")
  .forEach(button => {

    button.addEventListener("click", () => {

      const row =
        button.closest(".availability-row");

      if (row) {
        row.remove();
      }

    });

  });

  }

const calendarResponse = await fetch(
  `${cfg.functionsBaseUrl}/get-calendar-settings`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      location_id: loc.id
    })
  }
);

const calendarResult = await calendarResponse.json();

if (!calendarResponse.ok || calendarResult.error) {

  console.error(
    "CALENDAR SETTINGS ERROR:",
    calendarResult
  );

  $("calendarStatus").textContent =
    "Unable to load calendar configuration.";

  $("calendarInfo").textContent =
    calendarResult.error ||
    "Unable to load calendar configuration.";

} else {

  const connection =
    calendarResult.connection;

  const blockingCalendars =
    calendarResult.blocking_calendars || [];

if (connection?.google_calendar_id) {
  $("calendarStatus").textContent =
    "Google Calendar connected.";

  $("connectCalendarBtn").textContent =
    "Reconnect Google Calendar";
} else {
  $("calendarStatus").textContent =
    "Google Calendar not connected.";

  $("connectCalendarBtn").textContent =
    "Connect Google Calendar";
}

let calendarInfo = "";

if (connection?.google_calendar_id) {

  calendarInfo +=
    `<strong>Booking Calendar</strong><br>` +
    `${escapeHtml(connection.google_calendar_id)}<br><br>`;

}

if (blockingCalendars.length) {

  calendarInfo +=
    "<strong>Calendars That Block Availability</strong><br>";

  calendarInfo += blockingCalendars
    .map(calendar => {

      const primary =
        calendar.is_primary
          ? " — Primary"
          : "";

      const status =
        calendar.enabled
          ? " — Enabled"
          : " — Disabled";

      return (
        `${escapeHtml(calendar.calendar_name)}` +
        `${primary}${status}`
      );

    })
    .join("<br>");

}

$("calendarInfo").innerHTML =
  calendarInfo ||
  "No calendar configuration found.";

const controls =
  $("blockingCalendarControls");

if (controls) {

  controls.innerHTML =
    blockingCalendars.length
      ? blockingCalendars.map(calendar => {

          const buttonText =
            calendar.enabled
              ? "Disable"
              : "Enable";

return `
  <div style="margin-top:12px;">
    <strong>
      ${escapeHtml(calendar.calendar_name)}
    </strong>

    <button
      type="button"
      class="secondary blocking-calendar-toggle"
      data-calendar-id="${escapeAttr(calendar.google_calendar_id)}"
      data-calendar-enabled="${calendar.enabled}"
      style="margin-left:10px;"
    >
      ${buttonText}
    </button>
  </div>
`;

        }).join("")
      : "No blocking calendars configured.";

  controls
    .querySelectorAll(".blocking-calendar-toggle")
    .forEach(button => {

      button.addEventListener("click", async () => {

        const calendarId =
          button.dataset.calendarId;

        const currentlyEnabled =
          button.dataset.calendarEnabled === "true";

        const newEnabled =
          !currentlyEnabled;

        button.disabled = true;
        button.textContent = "Saving...";

        try {

          const response = await fetch(
            `${cfg.functionsBaseUrl}/update-blocking-calendar`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                location_id: loc.id,
                google_calendar_id: calendarId,
                enabled: newEnabled
              })
            }
          );

          const result =
            await response.json();

          if (!response.ok || result.error) {
            throw new Error(
              result.error ||
              "Unable to update blocking calendar."
            );
          }

          button.dataset.calendarEnabled =
            String(newEnabled);

          button.textContent =
            newEnabled
              ? "Disable"
              : "Enable";

          const statusText =
            newEnabled
              ? " — Enabled"
              : " — Disabled";

          const calendarName =
            result.calendar?.calendar_name ||
            button
              .parentElement
              .querySelector("strong")
              .textContent;

          button
            .parentElement
            .querySelector("strong")
            .textContent =
              calendarName;

          $("calendarInfo").innerHTML =
            $("calendarInfo").innerHTML
              .replace(
                / — (Enabled|Disabled)/g,
                ""
              );

          // Reload the calendar information so the
          // displayed status matches Supabase.
          await loadLocationIntoForm(loc);

        } catch (error) {

          console.error(
            "BLOCKING CALENDAR UPDATE ERROR:",
            error
          );

          button.textContent =
            currentlyEnabled
              ? "Disable"
              : "Enable";

          alert(
            error.message ||
            "Unable to update blocking calendar."
          );

        } finally {

          button.disabled = false;

        }

      });

    });

}

  }

  // Load special days

  let specialDays = [];
  let specialDaysError = null;

  if (state.instructor?.id) {
    const response =
      await db
        .from("special_days")
        .select(`
          id,
          instructor_id,
          service_date,
          is_closed,
          start_time,
          end_time
        `)
        .eq("instructor_id", state.instructor.id)
        .order("service_date");

    specialDays =
      response.data || [];

    specialDaysError =
      response.error;
  }

  if (specialDaysError) {

    console.error(
      "SPECIAL DAYS ERROR:",
      specialDaysError
    );

    $("specialDays").innerHTML =
      `<div class="state error">
        Unable to load special days.
      </div>`;

  } else {

    const days =
      specialDays || [];

    if (!days.length) {

      $("specialDays").innerHTML =
        `<div class="muted">
          No special days configured.
        </div>`;

    } else {

      $("specialDays").innerHTML =
        days.map(day => {

          const date =
            day.service_date || "";

          const start =
            day.start_time
              ? day.start_time.substring(0, 5)
              : "";

          const end =
            day.end_time
              ? day.end_time.substring(0, 5)
              : "";

          return `
            <div
              class="special-day-row"
              data-id="${escapeAttr(day.id)}"
              style="
                display:grid;
                grid-template-columns:
                  150px
                  100px
                  130px
                  130px
                  90px;
                gap:10px;
                align-items:center;
                margin-top:10px;
              "
            >

              <input
                type="date"
                class="special-day-date"
                value="${escapeAttr(date)}"
              >

              <label style="margin:0;">
                <input
                  type="checkbox"
                  class="special-day-closed"
                  ${day.is_closed ? "checked" : ""}
                >
                Closed
              </label>

              <input
                type="time"
                class="special-day-start"
                value="${escapeAttr(start)}"
                ${day.is_closed ? "disabled" : ""}
              >

              <input
                type="time"
                class="special-day-end"
                value="${escapeAttr(end)}"
                ${day.is_closed ? "disabled" : ""}
              >

              <button
                type="button"
                class="secondary special-day-delete"
                data-id="${escapeAttr(day.id)}"
              >
                Delete
              </button>

            </div>
          `;

        }).join("");

    }

  }

    // Enable / disable special-day time fields

    document
      .querySelectorAll(".special-day-closed")
      .forEach(checkbox => {

        checkbox.addEventListener("change", () => {

          const row =
            checkbox.closest(".special-day-row");

          const start =
            row.querySelector(".special-day-start");

          const end =
            row.querySelector(".special-day-end");

          start.disabled =
            checkbox.checked;

          end.disabled =
            checkbox.checked;

        });

      });


    // Delete existing special-day rows

    document
      .querySelectorAll(".special-day-delete")
      .forEach(button => {

        button.addEventListener("click", () => {

          const row =
            button.closest(".special-day-row");

          if (row) {
            row.remove();
          }

        });

      });

$("emailSubject").value =
  loc.confirmation_email_subject ||
  "Your appointment confirmation";

$("emailMessage").value =
  loc.confirmation_email_message ||
  `Thank you for booking with us!

Appointment Date: {{DATE}}
Appointment Time: {{TIME}}
Location: {{LOCATION}}

{{CONFIRMATION_BUTTON}}

{{MANAGE_BUTTON}}`;


  
const restoreEmailDefaultBtn =
  $("restoreEmailDefaultBtn");

if (restoreEmailDefaultBtn) {

  restoreEmailDefaultBtn.addEventListener(
    "click",
    () => {

      $("emailSubject").value =
        "Your appointment confirmation";

      $("emailMessage").value =
        `Thank you for booking with us!

Appointment Date: {{DATE}}
Appointment Time: {{TIME}}
Location: {{LOCATION}}

{{CONFIRMATION_BUTTON}}

{{MANAGE_BUTTON}}`;

    }
  );

}
// Add Special Day

$("addSpecialDayBtn").onclick = () => {

  const container =
    $("specialDays");

  const row =
    document.createElement("div");

  row.className =
    "special-day-row";

  row.dataset.id = "";

  row.style.cssText = `
    display:grid;
    grid-template-columns:
      150px
      100px
      130px
      130px
      90px;
    gap:10px;
    align-items:center;
    margin-top:10px;
  `;

  row.innerHTML = `

    <input
      type="date"
      class="special-day-date"
      value=""
    >

    <label style="margin:0;">
      <input
        type="checkbox"
        class="special-day-closed"
      >
      Closed
    </label>

    <input
      type="time"
      class="special-day-start"
      value=""
    >

    <input
      type="time"
      class="special-day-end"
      value=""
    >

    <button
      type="button"
      class="secondary special-day-delete"
    >
      Delete
    </button>

  `;

  container.appendChild(row);


  // Enable / disable time fields

  const checkbox =
    row.querySelector(
      ".special-day-closed"
    );

  const start =
    row.querySelector(
      ".special-day-start"
    );

  const end =
    row.querySelector(
      ".special-day-end"
    );

  checkbox.addEventListener(
    "change",
    () => {

      start.disabled =
        checkbox.checked;

      end.disabled =
        checkbox.checked;

    }
  );


  // Delete this row

  row
    .querySelector(".special-day-delete")
    .addEventListener("click", () => {

      row.remove();

    });

};

  $("brandName").textContent =
    loc.name || "Location Settings";

  $("brandSubtitle").textContent =
    loc.instructor_name
      ? `with ${loc.instructor_name}`
      : "Administration";

  $("brandLogo").src =
    loc.logo_url || "safe-insight-logo.png";

  $("footerText").textContent =
    loc.footer_text ||
    `Booking powered by ${loc.name || "Safe Insight"}`;
}


async function loadLocations() {

  const { data, error } = await db
    .from("locations")
    .select(`
      id,
      slug,
      name,
      instructor_name,
      address,
      website,
      timezone,
      appointment_length_minutes,
      max_students_per_slot,
      cancellation_hours,
      reschedule_hours,
      booking_horizon_days,
      minimum_booking_notice_hours,
      primary_color,
      secondary_color,
      accent_color,
      logo_url,
      footer_text,
      payment_required,
      confirmation_email_subject,
      confirmation_email_message,
      confirmation_button_enabled,
      confirmation_button_text,
      confirmation_button_url,
      student_confirmation_enabled,
      instructor_notification_enabled,
      reminder_enabled,
      reminder_hours_before,
      instructor_email,
      student_reminder_subject,
      student_reminder_message,
      instructor_reminder_subject,
      instructor_reminder_message,
      followup_enabled,
      followup_delay_minutes,
      followup_subject,
      followup_message
    `)
    .eq("active", true)
    .order("name");

  if (error) throw error;

  state.locations = data || [];

  if (!state.locations.length) {
    throw new Error(
      "No active booking locations are configured."
    );
  }

  const select = $("locationSelect");

  select.innerHTML = state.locations.map(loc => `
    <option value="${escapeAttr(loc.slug)}">
      ${escapeHtml(loc.name)}
      ${loc.instructor_name
        ? " — " + escapeHtml(loc.instructor_name)
        : ""}
    </option>
  `).join("");

  const wanted =
    new URLSearchParams(location.search).get("location") ||
    cfg.defaultLocationSlug;

  const selected =
    state.locations.find(loc => loc.slug === wanted) ||
    state.locations[0];

  select.value = selected.slug;

  await loadLocationIntoForm(selected);
}

async function loadAllInstructors() {

  const { data, error } =
    await db
      .from("instructors")
      .select(`
        id,
        location_id,
        user_id,
        name,
        email,
        slug,
        appointment_length_minutes,
        max_students_per_slot,
        booking_horizon_days,
        minimum_booking_notice_hours,
        cancellation_hours,
        reschedule_hours
      `)
      .order("name");

  if (error) {
    console.error(
      "ALL INSTRUCTORS LOAD ERROR:",
      error
    );

    state.instructors = [];

    renderInstructorList();

    throw error;
  }

  state.instructors =
    data || [];

let settingsUsers = [];

try {

  const authHeaders =
    await getAuthHeaders();

  const response =
    await fetch(
      `${cfg.functionsBaseUrl}/manage-settings-users`,
      {
        method: "GET",
        headers: authHeaders
      }
    );

  const result =
    await response.json();

  if (!response.ok || result.error) {
    throw new Error(
      result.error ||
      "Unable to load settings users."
    );
  }

  settingsUsers =
    result.users || [];

} catch (error) {

  console.error(
    "SETTINGS USERS LOAD ERROR:",
    error
  );

  throw error;
}

  state.instructors =
    state.instructors.map(instructor => {

      const instructorEmail =
        instructor.email
          ?.trim()
          .toLowerCase();

      const settingsUser =
        settingsUsers.find(
          user =>
            user.email
              ?.trim()
              .toLowerCase() ===
            instructorEmail
        );

return {
  ...instructor,
  user_id:
    settingsUser?.user_id ||
    instructor.user_id ||
    null,
  role:
    settingsUser?.role ||
    "Instructor",
  active:
    settingsUser?.active ??
    false,
  email_confirmed:
    settingsUser?.email_confirmed ??
    false
};

    });

  if (
    state.instructor &&
    state.instructors.some(
      instructor =>
        instructor.id === state.instructor.id
    )
  ) {
    state.instructor =
      state.instructors.find(
        instructor =>
          instructor.id === state.instructor.id
      );
  } else {
    state.instructor =
      state.instructors[0] || null;
  }

  renderInstructorList();

  const globalSelector = $("globalInstructorSelector");
  const globalSelect = $("globalInstructorSelect");

  if (globalSelector && globalSelect) {
    if (isAdministrator() || isManager()) {
      globalSelector.classList.remove("hidden");

      globalSelect.innerHTML =
        state.instructors.map(instructor => `
          <option value="${escapeAttr(instructor.id)}">
            ${escapeHtml(instructor.name)}
          </option>
        `).join("");

      globalSelect.value =
        state.instructor?.id ||
        state.instructors[0]?.id ||
        "";
    } else {
      globalSelector.classList.add("hidden");
      globalSelect.innerHTML = "";
    }
  }
}

$("locationSelect").addEventListener("change", async event => {

  const selected =
    state.locations.find(
      loc => loc.slug === event.target.value
    );

  if (selected) {
    await loadLocationIntoForm(selected);
  }
});


$("logoUrl").addEventListener("input", () => {
  const logoUrl =
    $("logoUrl").value.trim() ||
    "assets/safe-insight-logo.png";

  $("logoPreview").src = logoUrl;
  $("brandLogo").src = logoUrl;
});

$("uploadLogoBtn").addEventListener("click", async () => {

  const fileInput =
    $("logoFile");

  const status =
    $("logoUploadStatus");

  const file =
    fileInput.files?.[0];

  if (!file) {
    status.textContent =
      "Please choose an image first.";
    return;
  }

  if (!state.location?.id) {
    status.textContent =
      "Please select a location first.";
    return;
  }

  const allowedTypes = [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif"
  ];

  if (!allowedTypes.includes(file.type)) {
    status.textContent =
      "Please select a PNG, JPG, WEBP, or GIF image.";
    return;
  }

  const maxSize =
    5 * 1024 * 1024;

  if (file.size > maxSize) {
    status.textContent =
      "Image must be 5 MB or smaller.";
    return;
  }

  const button =
    $("uploadLogoBtn");

  button.disabled = true;
  status.textContent =
    "Uploading...";

  try {

    const extension =
      file.name
        .split(".")
        .pop()
        .toLowerCase();

    const filePath =
      `${state.location.id}/logo-${Date.now()}.${extension}`;

    const {
      data,
      error
    } =
      await db.storage
        .from("location-assets")
        .upload(
          filePath,
          file,
          {
            cacheControl: "3600",
            upsert: true,
            contentType: file.type
          }
        );

    if (error) {
      throw error;
    }

    const {
      data: publicUrlData
    } =
      db.storage
        .from("location-assets")
        .getPublicUrl(
          data.path
        );

    const publicUrl =
      publicUrlData.publicUrl;

    $("logoUrl").value =
      publicUrl;

    $("logoPreview").src =
      publicUrl;

    $("brandLogo").src =
      publicUrl;

    status.textContent =
      "Logo uploaded.";

  } catch (error) {

    console.error(
      "LOGO UPLOAD ERROR:",
      error
    );

    status.textContent =
      error.message ||
      "Unable to upload logo.";

  } finally {

    button.disabled = false;

  }

});

function connectColorInputs(colorId, textId) {

  $(colorId).addEventListener("input", () => {
    $(textId).value = $(colorId).value;
  });

  $(textId).addEventListener("change", () => {

    let value = $(textId).value.trim();

    if (!value.startsWith("#")) {
      value = "#" + value;
    }

    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      $(colorId).value = value;
      $(textId).value = value.toUpperCase();
    }

  });
}


connectColorInputs(
  "primaryColor",
  "primaryColorText"
);

connectColorInputs(
  "secondaryColor",
  "secondaryColorText"
);

connectColorInputs(
  "accentColor",
  "accentColorText"
);


// ============================================================
// TAB-SPECIFIC SAVE HANDLERS
// ============================================================

async function saveLocationSettings(button) {

  button.disabled = true;
  const originalText = button.textContent;
  button.textContent = "Saving...";

  try {

    const payload = {
      location_id: state.location.id,

      name:
        $("locationName").value.trim(),

      address:
        $("address").value.trim(),

      website:
        $("website").value.trim()
    };

    const response = await fetch(
      `${cfg.functionsBaseUrl}/save-location-settings`,
      {
        method: "POST",
headers: await getAuthHeaders(),
        body: JSON.stringify(payload)
      }
    );

    const result = await response.json();

    if (!response.ok || result.error) {
      throw new Error(
        typeof result.error === "string"
          ? result.error
          : JSON.stringify(result.error || result)
      );
    }

    state.location = {
      ...state.location,
      ...result.location
    };

    button.textContent = "Saved";

    setTimeout(() => {
      button.textContent = originalText;
    }, 1500);

  } catch (error) {

    console.error(
      "SAVE LOCATION SETTINGS ERROR:",
      error
    );

    button.textContent = "Save Failed";

    setTimeout(() => {
      button.textContent = originalText;
    }, 2000);

  } finally {

    button.disabled = false;

  }

}


async function saveBrandingSettings(button) {

  button.disabled = true;
  const originalText = button.textContent;
  button.textContent = "Saving...";

  try {

    const payload = {
      location_id: state.location.id,

      logo_url:
        $("logoUrl").value.trim(),

      primary_color:
        $("primaryColorText").value.trim(),

      secondary_color:
        $("secondaryColorText").value.trim(),

      accent_color:
        $("accentColorText").value.trim()
    };

    const response = await fetch(
      `${cfg.functionsBaseUrl}/save-location-settings`,
      {
        method: "POST",
        headers: await getAuthHeaders(),
                body: JSON.stringify(payload)
        }
    );

    const result = await response.json();

    if (!response.ok || result.error) {
      throw new Error(
        typeof result.error === "string"
          ? result.error
          : JSON.stringify(result.error || result)
      );
    }

    state.location = {
      ...state.location,
      ...result.location
    };

    button.textContent = "Saved";

    setTimeout(() => {
      button.textContent = originalText;
    }, 1500);

  } catch (error) {

    console.error(
      "SAVE BRANDING SETTINGS ERROR:",
      error
    );

    button.textContent = "Save Failed";

    setTimeout(() => {
      button.textContent = originalText;
    }, 2000);

  } finally {

    button.disabled = false;

  }

}


async function saveAvailabilitySettings(button) {

  button.disabled = true;
  const originalText = button.textContent;
  button.textContent = "Saving...";

  try {

    // --------------------------------------------------------
    // Save booking rules for each instructor
    // --------------------------------------------------------

    if (!state.instructor?.id) {
      throw new Error(
        "Please select an instructor before saving Booking Rules."
      );
    }

    const {
      data: updatedInstructor,
      error: settingsError
    } =
      await db
        .from("instructors")
        .update({
          appointment_length_minutes:
            Number($("appointmentLengthInput").value),

          max_students_per_slot:
            Number($("maxStudentsInput").value),

          booking_horizon_days:
            Number($("bookingHorizonInput").value),

          minimum_booking_notice_hours:
            Number($("minimumNoticeInput").value),

          cancellation_hours:
            Number($("cancellationHoursInput").value),

          reschedule_hours:
            Number($("rescheduleHoursInput").value)
        })
        .eq("id", state.instructor.id)
        .select(`
          id,
          appointment_length_minutes,
          max_students_per_slot,
          booking_horizon_days,
          minimum_booking_notice_hours,
          cancellation_hours,
          reschedule_hours
        `)
        .single();

    if (settingsError) {
      throw settingsError;
    }

    if (!updatedInstructor) {
      throw new Error(
        "The instructor Booking Rules were not updated."
      );
    }

    if (settingsError) {
      throw settingsError;
    }

    const updatedBookingRules = {
      appointment_length_minutes:
        Number($("appointmentLengthInput").value),

      max_students_per_slot:
        Number($("maxStudentsInput").value),

      booking_horizon_days:
        Number($("bookingHorizonInput").value),

      minimum_booking_notice_hours:
        Number($("minimumNoticeInput").value),

      cancellation_hours:
        Number($("cancellationHoursInput").value),

      reschedule_hours:
        Number($("rescheduleHoursInput").value)
    };

    state.instructor = {
      ...state.instructor,
      ...updatedBookingRules
    };

    state.instructors =
      state.instructors.map(instructor =>
        instructor.id === state.instructor.id
          ? {
              ...instructor,
              ...updatedBookingRules
            }
          : instructor
      );


    // --------------------------------------------------------
    // Save recurring availability
    // --------------------------------------------------------

const availabilityRules =
  Array.from(
    document.querySelectorAll(
      ".availability-row"
    )
  ).map(row => {

    const checkbox =
      row.querySelector(
        ".availability-enabled"
      );

    const startInput =
      row.querySelector(
        ".availability-start"
      );

    const endInput =
      row.querySelector(
        ".availability-end"
      );

    return {
      day_of_week:
        Number(checkbox.dataset.day),

      enabled:
        checkbox.checked,

      start_time:
        startInput?.value || null,

      end_time:
        endInput?.value || null
    };

  });


const availabilityResponse =
  await fetch(
    `${cfg.functionsBaseUrl}/save-availability-rules`,
    {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({
        instructor_id:
          state.instructor.id,
        
        rules:
          availabilityRules
      })
    }
  );


    const availabilityResult =
      await availabilityResponse.json();


    if (
      !availabilityResponse.ok ||
      availabilityResult.error
    ) {
      throw new Error(
        availabilityResult.error ||
        "Unable to save availability rules."
      );
    }


    // --------------------------------------------------------
    // Save special days
    // --------------------------------------------------------

    const specialDays =
      Array.from(
        document.querySelectorAll(
          ".special-day-row"
        )
      ).map(row => {

        const dateInput =
          row.querySelector(
            ".special-day-date"
          );

        const closedInput =
          row.querySelector(
            ".special-day-closed"
          );

        const startInput =
          row.querySelector(
            ".special-day-start"
          );

        const endInput =
          row.querySelector(
            ".special-day-end"
          );

        return {
          service_date:
            dateInput?.value || "",

          is_closed:
            closedInput?.checked || false,

          start_time:
            startInput?.value || null,

          end_time:
            endInput?.value || null
        };

      });


const specialDaysResponse =
  await fetch(
    `${cfg.functionsBaseUrl}/save-special-days`,
    {
      method: "POST",
      headers:
        await getAuthHeaders(),
      body: JSON.stringify({
        location_id:
          state.location.id,

        instructor_id:
          state.instructor.id,

        days:
          specialDays
      })
    }
  );


    const specialDaysResult =
      await specialDaysResponse.json();


    if (
      !specialDaysResponse.ok ||
      specialDaysResult.error
    ) {
      throw new Error(
        specialDaysResult.error ||
        `Unable to save special days. HTTP ${specialDaysResponse.status}`
      );
    }


    // Update local instructor state

    state.instructor = {
      ...state.instructor,

      appointment_length_minutes:
        Number($("appointmentLengthInput").value),

      max_students_per_slot:
        Number($("maxStudentsInput").value),

      booking_horizon_days:
        Number($("bookingHorizonInput").value),

      minimum_booking_notice_hours:
        Number($("minimumNoticeInput").value),

      cancellation_hours:
        Number($("cancellationHoursInput").value),

      reschedule_hours:
        Number($("rescheduleHoursInput").value)
    };


    button.textContent = "Saved";

    setTimeout(() => {
      button.textContent = originalText;
    }, 1500);

  } catch (error) {

    console.error(
      "SAVE AVAILABILITY SETTINGS ERROR:",
      error
    );

    button.textContent = "Save Failed";

    setTimeout(() => {
      button.textContent = originalText;
    }, 2000);

  } finally {

    button.disabled = false;

  }

}

async function saveBookingRulesSettings(button) {

  button.disabled = true;

  const originalText =
    button.textContent;

  button.textContent =
    "Saving...";

  try {

    if (!state.instructor?.id) {
      throw new Error(
        "Please select an instructor before saving Booking Rules."
      );
    }

    const {
      data: updatedInstructor,
      error: settingsError
    } =
      await db
        .from("instructors")
        .update({
          appointment_length_minutes:
            Number($("appointmentLengthInput").value),

          max_students_per_slot:
            Number($("maxStudentsInput").value),

          booking_horizon_days:
            Number($("bookingHorizonInput").value),

          minimum_booking_notice_hours:
            Number($("minimumNoticeInput").value),

          cancellation_hours:
            Number($("cancellationHoursInput").value),

          reschedule_hours:
            Number($("rescheduleHoursInput").value)
        })
        .eq(
          "id",
          state.instructor.id
        )
        .select(`
          id,
          appointment_length_minutes,
          max_students_per_slot,
          booking_horizon_days,
          minimum_booking_notice_hours,
          cancellation_hours,
          reschedule_hours
        `)
        .single();

    if (settingsError) {
      throw settingsError;
    }

    if (!updatedInstructor) {
      throw new Error(
        "The Booking Rules could not be saved because the selected instructor was not updated."
      );
    }

    if (settingsError) {
      throw settingsError;
    }

    state.instructor = {
      ...state.instructor,

      appointment_length_minutes:
        Number($("appointmentLengthInput").value),

      max_students_per_slot:
        Number($("maxStudentsInput").value),

      booking_horizon_days:
        Number($("bookingHorizonInput").value),

      minimum_booking_notice_hours:
        Number($("minimumNoticeInput").value),

      cancellation_hours:
        Number($("cancellationHoursInput").value),

      reschedule_hours:
        Number($("rescheduleHoursInput").value)
    };

    renderInstructorList();

    button.textContent =
      "Saved";

    setTimeout(() => {
      button.textContent =
        originalText;
    }, 1500);

  } catch (error) {

    console.error(
      "SAVE BOOKING RULES ERROR:",
      error
    );

    button.textContent =
      "Save Failed";

    setTimeout(() => {
      button.textContent =
        originalText;
    }, 2000);

  } finally {

    button.disabled = false;
  }
}

$("saveBookingRulesBtn").addEventListener(
  "click",
  async () => {
    await saveBookingRulesSettings(
      $("saveBookingRulesBtn")
    );
  }
);


async function saveEmailSettings(button) {

  button.disabled = true;
  const originalText = button.textContent;
  button.textContent = "Saving...";

  try {

    const payload = {
      location_id: state.location.id,

      confirmation_email_subject:
        $("emailSubject").value.trim(),

      confirmation_email_message:
        $("emailMessage").value.trim(),

      confirmation_button_enabled:
        $("confirmationButtonEnabled").checked,

      confirmation_button_text:
        $("confirmationButtonText").value.trim(),

      confirmation_button_url:
        $("confirmationButtonUrl").value.trim(),

      reminder_enabled:
        $("reminderEnabled").checked,

      reminder_hours_before:
        Number($("reminderHoursBefore").value),

      instructor_email:
        $("instructorEmail").value.trim(),

      student_reminder_subject:
        $("studentReminderSubject").value.trim(),

      student_reminder_message:
        $("studentReminderMessage").value.trim(),

      instructor_reminder_subject:
        $("instructorReminderSubject").value.trim(),

      instructor_reminder_message:
        $("instructorReminderMessage").value.trim(),

      followup_enabled:
        $("followupEnabled").checked,

      followup_delay_minutes:
        Number($("followupDelayMinutes").value),

      followup_subject:
        $("followupSubject").value.trim(),

      followup_message:
        $("followupMessage").value.trim()
    };


    const response = await fetch(
      `${cfg.functionsBaseUrl}/save-location-settings`,
      {
        method: "POST",
        headers: await getAuthHeaders(),
                body: JSON.stringify(payload)
      }
    );


    const result = await response.json();


    if (!response.ok || result.error) {
      throw new Error(
        typeof result.error === "string"
          ? result.error
          : JSON.stringify(
              result.error ||
              result
            )
      );
    }


    state.location = {
      ...state.location,
      ...result.location
    };


    button.textContent = "Saved";

    setTimeout(() => {
      button.textContent = originalText;
    }, 1500);

  } catch (error) {

    console.error(
      "SAVE EMAIL SETTINGS ERROR:",
      error
    );

    button.textContent = "Save Failed";

    setTimeout(() => {
      button.textContent = originalText;
    }, 2000);

  } finally {

    button.disabled = false;

  }

}


// ------------------------------------------------------------
// Connect the four tab Save buttons
// ------------------------------------------------------------

document
  .querySelectorAll(".tab-save-button")
  .forEach(button => {

    button.addEventListener("click", async () => {

      const tab =
        button.dataset.saveTab;

      if (!state.location?.id) {
        return;
      }

      if (tab === "location") {
        await saveLocationSettings(button);
      }

      if (tab === "branding") {
        await saveBrandingSettings(button);
      }

      if (tab === "availability") {
        await saveAvailabilitySettings(button);
      }

      if (tab === "emails") {
        await saveEmailSettings(button);
      }

    });

  });


function escapeHtml(value) {

  return String(value ?? "").replace(
    /[&<>"']/g,
    character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[character])
  );

}


function escapeAttr(value) {
  return escapeHtml(value);
}

function renderInstructorList() {

  const container = $("usersList");

  if (!container) return;

  if (!state.instructors.length) {
    container.innerHTML =
      `<div class="muted">
        No instructors assigned.
      </div>`;
    return;
  }

  container.innerHTML =
    state.instructors.map(instructor => {

      const bookingUrl =
        instructor.slug &&
        state.location?.slug
          ? `${window.location.origin}/booking/book/${state.location.slug}/${instructor.slug}`
          : "";

      const isSelected =
        state.instructor &&
        state.instructor.id === instructor.id;

      return `
        <div
          style="
            padding:15px;
            border:1px solid ${isSelected ? "#333" : "#ddd"};
            margin-top:10px;
            border-radius:8px;
          "
        >

          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:15px; flex-wrap:wrap;">

            <div>

              <strong>
                ${escapeHtml(instructor.name)}
              </strong>

              <br>

<small>
  ${escapeHtml(instructor.email || "")}
</small>

<br>

<small style="display:block; margin-top:8px;">
  <strong>Account:</strong>
  ${
    instructor.user_id
      ? (
          instructor.email_confirmed
            ? "Active"
            : "Invited — awaiting confirmation"
        )
      : "No Booking Settings account"
  }
</small>

<label style="display:block; margin-top:10px;">
  <strong>Role:</strong>
  <select
    data-role-instructor="${escapeHtml(instructor.id)}"
    style="margin-left:8px;"
  >
<option
  value="Administrator"
  ${instructor.role === "Administrator" ? "selected" : ""}
>
  Administrator
</option>

<option
  value="Manager"
  ${instructor.role === "Manager" ? "selected" : ""}
>
  Manager
</option>

<option
  value="Instructor"
  ${instructor.role === "Instructor" ? "selected" : ""}
>
  Instructor
</option>
  </select>
</label>

              ${
                bookingUrl
                  ? `
                    <br>
                    <small>
                      Booking URL:
                      <code>${escapeHtml(bookingUrl)}</code>
                    </small>
                  `
                  : `
                    <br>
                    <small class="muted">
                      No booking URL configured.
                    </small>
                  `
              }

            </div>

            <button
              type="button"
              class="${isSelected ? "primary" : "secondary"}"
              data-select-instructor="${escapeHtml(instructor.id)}"
            >
              ${isSelected ? "Selected" : "Select"}
            </button>

          </div>

        </div>
      `;

    }).join("");
}

document.addEventListener("click", async function (event) {

  const button =
    event.target.closest("[data-select-instructor]");

  if (!button) return;

  const instructorId =
    button.getAttribute("data-select-instructor");

  if (!instructorId) return;

  const selectedInstructor =
    state.instructors.find(
      instructor =>
        instructor.id === instructorId
    );

  if (!selectedInstructor) return;

state.instructor =
  selectedInstructor;

await loadLocationIntoForm(
  state.location
);

const selectedLocationInstructor =
  $("selectedLocationInstructor");

if (selectedLocationInstructor) {
  selectedLocationInstructor.textContent =
    selectedInstructor.name;
}

const selectedCalendarName =
  $("selectedCalendarName");

if (selectedCalendarName) {
  selectedCalendarName.textContent =
    selectedInstructor.name;
}

const calendarSelectedName =
  $("calendarSelectedName");

if (calendarSelectedName) {
  calendarSelectedName.textContent =
    selectedInstructor.name;
}

const availabilityInstructorName =
  $("availabilityInstructorName");

if (availabilityInstructorName) {
  availabilityInstructorName.textContent =
    selectedInstructor.name;
}

const emailsInstructorName =
  $("emailsInstructorName");

if (emailsInstructorName) {
  emailsInstructorName.textContent =
    selectedInstructor.name;
}

  await loadLocationIntoForm(
    state.location
  );

  renderInstructorList();

  const selectedUserPanel =
    $("selectedUserPanel");

  const selectedUserInfo =
    $("selectedUserInfo");

  if (
    selectedUserPanel &&
    selectedUserInfo
  ) {

    const bookingUrl =
      selectedInstructor.slug
        ? `${window.location.origin}/booking/book/${state.location.slug}/${selectedInstructor.slug}`
        : "";

    selectedUserInfo.innerHTML = `
      <strong>
        ${escapeHtml(selectedInstructor.name)}
      </strong>

      <br>

      <span>
        ${escapeHtml(selectedInstructor.email || "")}
      </span>

      ${
        bookingUrl
          ? `
            <br><br>
            <strong>Booking URL:</strong>
            <br>
            <code>${escapeHtml(bookingUrl)}</code>
          `
          : ""
      }
    `;

    selectedUserPanel.classList.remove("hidden");
  }

});

document.addEventListener("change", async function (event) {

  const globalSelect =
    event.target.closest("#globalInstructorSelect");

  if (globalSelect) {

    const instructorId =
      globalSelect.value;

    if (!instructorId) return;

    const selectedInstructor =
      state.instructors.find(
        instructor =>
          instructor.id === instructorId
      );

    if (!selectedInstructor) return;

    state.instructor =
      selectedInstructor;

    const selectedLocationInstructor =
      $("selectedLocationInstructor");

    if (selectedLocationInstructor) {
      selectedLocationInstructor.textContent =
        selectedInstructor.name;
    }

    const selectedCalendarName =
      $("selectedCalendarName");

    if (selectedCalendarName) {
      selectedCalendarName.textContent =
        selectedInstructor.name;
    }

    const calendarSelectedName =
      $("calendarSelectedName");

    if (calendarSelectedName) {
      calendarSelectedName.textContent =
        selectedInstructor.name;
    }

    const availabilityInstructorName =
      $("availabilityInstructorName");

    if (availabilityInstructorName) {
      availabilityInstructorName.textContent =
        selectedInstructor.name;
    }

    const emailsInstructorName =
      $("emailsInstructorName");

    if (emailsInstructorName) {
      emailsInstructorName.textContent =
        selectedInstructor.name;
    }

    await loadLocationIntoForm(
      state.location
    );

    renderInstructorList();

    const selectedUserPanel =
      $("selectedUserPanel");

    const selectedUserInfo =
      $("selectedUserInfo");

    if (
      selectedUserPanel &&
      selectedUserInfo
    ) {

      const bookingUrl =
        selectedInstructor.slug
          ? `${window.location.origin}/booking/book/${state.location.slug}/${selectedInstructor.slug}`
          : "";

      selectedUserInfo.innerHTML = `
        <strong>
          ${escapeHtml(selectedInstructor.name)}
        </strong>

        <br>

        <span>
          ${escapeHtml(selectedInstructor.email || "")}
        </span>

        ${
          bookingUrl
            ? `
              <br><br>
              <strong>Booking URL:</strong>
              <br>
              <code>${escapeHtml(bookingUrl)}</code>
            `
            : ""
        }
      `;

      selectedUserPanel.classList.remove("hidden");
    }

    return;
  }

  const select =
    event.target.closest("[data-role-instructor]");

  if (!select) return;

  const instructorId =
    select.getAttribute("data-role-instructor");

  if (!instructorId) return;

  const instructor =
    state.instructors.find(
      item =>
        item.id === instructorId
    );

  if (!instructor) return;

  const newRole =
    select.value;

  if (!instructor.user_id) {

    alert(
      "This instructor does not have a Booking Settings account yet."
    );

    renderInstructorList();

    return;
  }

  const previousRole =
    instructor.role;

  select.disabled = true;

  try {

    const authHeaders =
      await getAuthHeaders();

    const response =
      await fetch(
        `${cfg.functionsBaseUrl}/manage-settings-users`,
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            action: "update_role",
            user_id: instructor.user_id,
            role: newRole
          })
        }
      );

    const result =
      await response.json();

    if (!response.ok || result.error) {
      throw new Error(
        result.error ||
        "Unable to update instructor role."
      );
    }

    instructor.role =
      result.user?.role ||
      newRole;

    if (
      state.instructor?.id ===
      instructor.id
    ) {
      state.instructor =
        instructor;
    }

    renderInstructorList();

  } catch (error) {

    console.error(
      "UPDATE INSTRUCTOR ROLE ERROR:",
      error
    );

    instructor.role =
      previousRole;

    renderInstructorList();

    alert(
      error.message ||
      "Unable to update instructor role."
    );

  }

});

function makeSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}


$("addInstructorBtn").addEventListener("click", async () => {

  if (!state.location?.id) {
    alert("Please select a location first.");
    return;
  }

  const name = prompt("Instructor name:");

  if (!name?.trim()) {
    return;
  }

  const email = prompt("Instructor email address:");

  if (!email?.trim()) {
    return;
  }

  const slug = makeSlug(name);

  if (!slug) {
    alert("Unable to generate an instructor URL slug.");
    return;
  }

  const duplicate = state.instructors.some(
    instructor =>
      instructor.slug?.toLowerCase() === slug.toLowerCase()
  );

  if (duplicate) {
    alert(
      `An instructor with the slug "${slug}" already exists at this location.`
    );
    return;
  }

  const button = $("addInstructorBtn");

  button.disabled = true;
  const originalText = button.textContent;
  button.textContent = "Adding...";

  try {

    const { data, error } =
      await db
        .from("instructors")
        .insert({
          location_id: state.location.id,
          name: name.trim(),
          email: email.trim(),
          slug
        })
        .select()
        .single();

    if (error) {
      throw error;
    }

    state.instructors = [
      ...state.instructors,
      data
    ].sort((a, b) =>
      String(a.name || "")
        .localeCompare(String(b.name || ""))
    );

    state.instructor = data;

    renderInstructorList();

  } catch (error) {

    console.error(
      "ADD INSTRUCTOR ERROR:",
      error
    );

    alert(
      error.message ||
      "Unable to add instructor."
    );

  } finally {

    button.disabled = false;
    button.textContent = originalText;

  }

});

$("connectCalendarBtn").addEventListener("click", () => {
  if (!state.location?.id) {
    $("calendarStatus").textContent =
      "Please select a location first.";
    return;
  }

  const oauthUrl =
    `${cfg.functionsBaseUrl}/google-oauth-start` +
    `?location_id=${encodeURIComponent(state.location.id)}`;

  window.open(
    oauthUrl,
    "_blank",
    "noopener,noreferrer"
  );
});

async function handleSettingsLogin() {
  const email = $("loginEmail").value.trim();
  const password = $("loginPassword").value;

  $("loginError").classList.add("hidden");
  $("loginError").textContent = "";

  if (!email || !password) {
    $("loginError").textContent =
      "Please enter your email and password.";
    $("loginError").classList.remove("hidden");
    return;
  }

  const { error } = await db.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    $("loginError").textContent =
      "Login failed. Please check your email and password.";
    $("loginError").classList.remove("hidden");
    return;
  }

  window.location.reload();
}

$("loginBtn").addEventListener(
  "click",
  handleSettingsLogin
);

$("loginPassword").addEventListener(
  "keydown",
  event => {
    if (event.key === "Enter") {
      handleSettingsLogin();
    }
  }
);

$("logoutBtn").addEventListener(
  "click",
  async () => {
    await db.auth.signOut();
    window.location.reload();
  }
);


(async function init() {
  try {
    const authenticated =
      await authenticateSettingsUser();

    $("loading").classList.add("hidden");

    if (!authenticated) {
      $("loginPanel").classList.remove("hidden");
      $("settingsApp").classList.add("hidden");
      return;
    }

$("loginPanel").classList.add("hidden");

$("settingsUserEmail").textContent =
  state.user.email;

$("settingsUserRole").textContent =
  state.role;

applyRolePermissions();

  await loadAllInstructors();

  await loadLocations();

  $("settingsApp").classList.remove("hidden");
    
  } catch (err) {
    showError(err.message);
  }
})();
