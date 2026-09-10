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

        const rule =
          dayRules[0] || null;

        return `
          <div
            class="availability-row"
            style="
              display:grid;
              grid-template-columns:
                120px
                90px
                130px
                130px;
              gap:10px;
              align-items:center;
              margin-top:10px;
            "
          >

            <strong>
              ${dayName}
            </strong>

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

          </div>
        `;

      }).join("");

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
    "<strong>Blocking Calendars</strong><br>";

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
            <div style="margin-top:10px;">
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

$("emailMessage").value = "";


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
      payment_required
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


$("saveBtn").addEventListener("click", async () => {

  const button = $("saveBtn");

  button.disabled = true;
  $("saveStatus").textContent = "Saving...";

  try {

    const payload = {
      location_id: state.location.id,
      name: $("locationName").value.trim(),
      instructor_name: $("instructorName").value.trim(),
      address: $("address").value.trim(),
      logo_url: $("logoUrl").value.trim(),
      primary_color: $("primaryColorText").value.trim(),
      secondary_color: $("secondaryColorText").value.trim(),
      accent_color: $("accentColorText").value.trim()
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
      console.log("SAVE RESPONSE:", result);

      throw new Error(
        typeof result.error === "string"
          ? result.error
          : JSON.stringify(result.error || result)
      );
    }

    const availabilityRules =
      Array.from(
        document.querySelectorAll(
          ".availability-enabled"
        )
      ).map(checkbox => {

        const day =
          Number(checkbox.dataset.day);

        const startInput =
          document.querySelector(
            `.availability-start[data-day="${day}"]`
          );

        const endInput =
          document.querySelector(
            `.availability-end[data-day="${day}"]`
          );

        return {
          day_of_week: day,
          enabled: checkbox.checked,
          start_time: startInput?.value || null,
          end_time: endInput?.value || null
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
            location_id: state.location.id,
            rules: availabilityRules
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

    state.location = result.location;


    // Save Special Days

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

      console.error(
        "SAVE SPECIAL DAYS RESPONSE:",
        {
          status:
            specialDaysResponse.status,

          statusText:
            specialDaysResponse.statusText,

          result:
            specialDaysResult
        }
      );

      throw new Error(
        specialDaysResult.error ||
        `Unable to save special days. HTTP ${specialDaysResponse.status}`
      );

    }


    $("saveStatus").textContent =
      "Settings saved successfully.";

  } catch (error) {

    console.error(
      "SAVE SETTINGS ERROR:",
      error
    );

    $("saveStatus").textContent =
      "Error: " + (error.message || error);

  } finally {

    button.disabled = false;

  }

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
