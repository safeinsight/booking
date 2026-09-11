const cfg = window.BOOKING_CONFIG;

const db = window.supabase.createClient(
  cfg.supabaseUrl,
  cfg.supabaseAnonKey
);

const $ = id => document.getElementById(id);

const state = {
  locations: [],
  location: null
};


function showError(message) {
  $("loading").classList.add("hidden");
  $("error").textContent = message;
  $("error").classList.remove("hidden");
}


function setColorPair(colorInput, textInput, value) {
  const color = value || "#000000";

  $(colorInput).value = color;
  $(textInput).value = color;
}


async function loadLocationIntoForm(loc) {

  state.location = loc;

  $("locationName").value = loc.name || "";
  $("instructorName").value = loc.instructor_name || "";
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

  $("appointmentLength").textContent =
    `${loc.appointment_length_minutes || 60} minutes`;

  $("maxStudents").textContent =
    `${loc.max_students_per_slot || 8} students`;

  $("bookingHorizon").textContent =
    `${loc.booking_horizon_days || 14} days`;

  $("minimumNotice").textContent =
    `${loc.minimum_booking_notice_hours || 24} hours`;

  $("appointmentLengthInput").value =
    loc.appointment_length_minutes || 60;

  $("maxStudentsInput").value =
    loc.max_students_per_slot || 8;

  $("bookingHorizonInput").value =
    loc.booking_horizon_days || 14;

  $("minimumNoticeInput").value =
    loc.minimum_booking_notice_hours ?? 24;

  $("cancellationHoursInput").value =
    loc.cancellation_hours ?? 24;

  $("rescheduleHoursInput").value =
    loc.reschedule_hours ?? 12;

    $("emailSubject").value =
    loc.confirmation_email_subject ||
    "Your appointment confirmation";

$("emailMessage").value =
  loc.confirmation_email_message ||
  `Thank you for booking with us!

Appointment Date: {{DATE}}
Appointment Time: {{TIME}}
Location: {{LOCATION}}

{{MANAGE_BUTTON}}`;

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

const { data: availabilityRules, error: availabilityError } =
  await db
    .from("availability_rules")
    .select(`
      id,
      day_of_week,
      start_time,
      end_time,
      enabled
    `)
      .eq("location_id", loc.id)
      .order("day_of_week")
      .order("start_time");

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

  const { data: specialDays, error: specialDaysError } =
    await db
      .from("special_days")
      .select(`
        id,
        service_date,
        is_closed,
        start_time,
        end_time
      `)
      .eq("location_id", loc.id)
      .order("service_date");

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

{{MANAGE_BUTTON}}`;

    }
  );

}
// Add Special Day

$("addSpecialDayBtn").addEventListener("click", () => {

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

});

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

  loadLocationIntoForm(selected);
}


$("locationSelect").addEventListener("change", event => {

  const selected =
    state.locations.find(
      loc => loc.slug === event.target.value
    );

  if (selected) {
    loadLocationIntoForm(selected);
  }
});


$("logoUrl").addEventListener("input", () => {
  const logoUrl =
    $("logoUrl").value.trim() ||
    "assets/safe-insight-logo.png";

  $("logoPreview").src = logoUrl;
  $("brandLogo").src = logoUrl;
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

      instructor_name:
        $("instructorName").value.trim(),

      address:
        $("address").value.trim(),

      website:
        $("website").value.trim()
    };

    const response = await fetch(
      `${cfg.functionsBaseUrl}/save-location-settings`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
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
        headers: {
          "Content-Type": "application/json"
        },
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
    // Save booking rules
    // --------------------------------------------------------

    const settingsPayload = {
      location_id: state.location.id,

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

    const settingsResponse = await fetch(
      `${cfg.functionsBaseUrl}/save-location-settings`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(settingsPayload)
      }
    );

    const settingsResult =
      await settingsResponse.json();

    if (
      !settingsResponse.ok ||
      settingsResult.error
    ) {
      throw new Error(
        typeof settingsResult.error === "string"
          ? settingsResult.error
          : JSON.stringify(
              settingsResult.error ||
              settingsResult
            )
      );
    }


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
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            location_id:
              state.location.id,

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
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            location_id:
              state.location.id,

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


    // Update local location state

    state.location = {
      ...state.location,
      ...settingsResult.location
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
        headers: {
          "Content-Type": "application/json"
        },
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

(async function init() {

  try {

    await loadLocations();

    $("loading").classList.add("hidden");
    $("settingsApp").classList.remove("hidden");

  } catch (err) {

    showError(err.message);

  }

})();
