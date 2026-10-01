const cfg = window.BOOKING_CONFIG;

const db = window.supabase.createClient(
  cfg.supabaseUrl,
  cfg.supabaseAnonKey
);

const $ = id => document.getElementById(id);

/* =========================================================
   CUSTOM ALERT / CONFIRM
   ========================================================= */

const customAlertOverlay =
  document.getElementById("customAlertOverlay");

const customAlertMessage =
  document.getElementById("customAlertMessage");

const customAlertOk =
  document.getElementById("customAlertOk");

const customAlertCancel =
  document.getElementById("customAlertCancel");


function showCustomAlert(message) {

  customAlertMessage.textContent = message;

  customAlertCancel.style.display = "none";

  customAlertOk.textContent = "OK";
  customAlertOk.classList.remove("confirm");

  customAlertOverlay.classList.add("show");
  customAlertOverlay.setAttribute(
    "aria-hidden",
    "false"
  );

  const closeAlert = () => {

    customAlertOverlay.classList.remove("show");

    customAlertOverlay.setAttribute(
      "aria-hidden",
      "true"
    );

    customAlertOk.removeEventListener(
      "click",
      closeAlert
    );

  };

  customAlertOk.addEventListener(
    "click",
    closeAlert
  );

  customAlertOk.focus();
}


function showCustomConfirm(message) {

  return new Promise(resolve => {

    customAlertMessage.textContent = message;

    customAlertCancel.style.display = "inline-block";

    customAlertOk.textContent = "Continue";
    customAlertOk.classList.add("confirm");

    customAlertOverlay.classList.add("show");
    customAlertOverlay.setAttribute(
      "aria-hidden",
      "false"
    );

    const finish = result => {

      customAlertOverlay.classList.remove("show");

      customAlertOverlay.setAttribute(
        "aria-hidden",
        "true"
      );

      customAlertCancel.style.display = "none";

      customAlertOk.textContent = "OK";
      customAlertOk.classList.remove("confirm");

      customAlertOk.removeEventListener(
        "click",
        onConfirm
      );

      customAlertCancel.removeEventListener(
        "click",
        onCancel
      );

      resolve(result);
    };

    const onConfirm = () => {
      finish(true);
    };

    const onCancel = () => {
      finish(false);
    };

    customAlertOk.addEventListener(
      "click",
      onConfirm
    );

    customAlertCancel.addEventListener(
      "click",
      onCancel
    );

    customAlertOk.focus();
  });
}


/* =========================================================
   PASSWORD VISIBILITY
   ========================================================= */

document.addEventListener(
  "change",
  event => {

    const toggle =
      event.target.closest(
        "[data-password-visibility-toggle]"
      );

    if (!toggle) {
      return;
    }


    const targetId =
      toggle.getAttribute(
        "data-password-visibility-toggle"
      );


    if (!targetId) {
      return;
    }


    const passwordInput =
      document.getElementById(
        targetId
      );


    if (!passwordInput) {
      return;
    }


    passwordInput.type =
      toggle.checked
        ? "text"
        : "password";

  }
);


customAlertOverlay.addEventListener(
  "click",
  event => {

    if (event.target !== customAlertOverlay) {
      return;
    }

    if (
      customAlertCancel.style.display !==
      "none"
    ) {
      return;
    }

    customAlertOverlay.classList.remove("show");

    customAlertOverlay.setAttribute(
      "aria-hidden",
      "true"
    );
  }
);

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

function isBasic() {
  return state.role === "Basic";
}


/*
 * Booking Settings permission defaults.
 *
 * These must mirror the defaults enforced by
 * manage-settings-users.
 *
 * Individual user overrides are applied after
 * these role defaults.
 */

const rolePermissionDefaults = {

  Administrator: {
    users: true,
    organization: true,
    location: true,
    branding: true,
    availability: true,
    booking_rules: true,
    services: true,
    calendar: true,
    appointments: true,
    clients: true,
    emails: true
  },

  Manager: {
    users: true,
    organization: false,
    location: true,
    branding: false,
    availability: true,
    booking_rules: true,
    services: true,
    calendar: true,
    appointments: true,
    clients: true,
    emails: true
  },

  Instructor: {
    users: false,
    organization: false,
    location: true,
    branding: false,
    availability: true,
    booking_rules: true,
    services: false,
    calendar: true,
    appointments: true,
    clients: true,
    emails: false
  },

  Basic: {
    users: false,
    organization: false,
    location: false,
    branding: false,
    availability: true,
    booking_rules: false,
    services: false,
    calendar: true,
    appointments: true,
    clients: true,
    emails: false
  }

};


/*
 * Determine whether the logged-in user has access
 * to one Booking Settings permission.
 *
 * state.permissions contains the final permission
 * set after role defaults and individual overrides
 * have been combined.
 *
 * The role default is retained as a safe fallback
 * during initial page loading.
 */

function hasPermission(permission) {

  if (
    state.permissions &&
    typeof state.permissions[permission] ===
      "boolean"
  ) {

    return state.permissions[permission];

  }


  return Boolean(
    rolePermissionDefaults[state.role]?.[
      permission
    ]
  );

}


function canEditLocation() {
  return hasPermission("location");
}

function canViewLocation() {
  return hasPermission("location");
}

function canEditBranding() {
  return hasPermission("branding");
}

function canEditAvailability() {
  return hasPermission("availability");
}

function canEditBookingRules() {
  return hasPermission("booking_rules");
}

function canManageStudentBookingFields() {
  return hasPermission("booking_rules");
}


/* =========================================================
   STUDENT BOOKING FIELDS
   ========================================================= */

function getStudentBookingFieldQuestions() {

  return Array.from(
    document.querySelectorAll(
      ".student-booking-field-question"
    )
  )
    .map(input => input.value.trim())
    .filter(Boolean);

}


function updateStudentBookingFieldsControls() {

  const list =
    $("studentBookingFieldsList");

  const addButton =
    $("addStudentBookingFieldBtn");

  const limitMessage =
    $("studentBookingFieldsLimitMessage");


  if (
    !list ||
    !addButton ||
    !limitMessage
  ) {
    return;
  }


  const rows =
    list.querySelectorAll(
      ".student-booking-field-row"
    );


  const atLimit =
    rows.length >= 5;


  addButton.disabled =
    atLimit;

  limitMessage.classList.toggle(
    "hidden",
    !atLimit
  );


  rows.forEach((row, index) => {

    const label =
      row.querySelector(
        ".student-booking-field-label"
      );

    const input =
      row.querySelector(
        ".student-booking-field-question"
      );


    if (label) {
      label.textContent =
        `Question ${index + 1}`;
    }


    if (input) {
      input.setAttribute(
        "aria-label",
        `Question ${index + 1}`
      );
    }

  });

}


function addStudentBookingField(
  question = ""
) {

  const list =
    $("studentBookingFieldsList");


  if (!list) {
    return;
  }


  const existingRows =
    list.querySelectorAll(
      ".student-booking-field-row"
    );


  if (existingRows.length >= 5) {
    updateStudentBookingFieldsControls();
    return;
  }


  const row =
    document.createElement("div");


  row.className =
    "student-booking-field-row";


  row.style.cssText = `
    margin-top:15px;
    padding:15px;
    border:1px solid #ddd;
    border-radius:8px;
    background:#fafafa;
  `;


  const label =
    document.createElement("label");

  label.className =
    "student-booking-field-label";

  label.style.cssText = `
    display:block;
    font-weight:700;
    margin-bottom:8px;
  `;


  const input =
    document.createElement("input");

  input.type =
    "text";

  input.className =
    "student-booking-field-question";

  input.maxLength =
    500;

  input.placeholder =
    "Enter the question the student must answer";

  input.value =
    question;

  input.style.width =
    "100%";


  const removeButton =
    document.createElement("button");

  removeButton.type =
    "button";

  removeButton.className =
    "secondary student-booking-field-remove";

  removeButton.textContent =
    "Remove Question";

  removeButton.style.marginTop =
    "10px";


  removeButton.addEventListener(
    "click",
    () => {

      row.remove();

      updateStudentBookingFieldsControls();

    }
  );


  row.appendChild(label);
  row.appendChild(input);
  row.appendChild(removeButton);

  list.appendChild(row);

  updateStudentBookingFieldsControls();

  input.focus();

}


function clearStudentBookingFields() {

  const list =
    $("studentBookingFieldsList");


  if (!list) {
    return;
  }


  list.innerHTML = "";

  updateStudentBookingFieldsControls();

}


/*
 * Load the additional required booking questions
 * for the currently selected instructor.
 *
 * This function is intentionally safe against an
 * instructor being changed while the request is
 * still in progress.
 */

async function loadStudentBookingFields(
  instructorId
) {

  if (
    !canManageStudentBookingFields() ||
    !instructorId
  ) {
    clearStudentBookingFields();
    return;
  }


  try {

    const response = await fetch(
      `${cfg.functionsBaseUrl}/save-location-settings`,
      {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          action:
            "load_student_booking_fields",

          instructor_id:
            instructorId
        })
      }
    );


    const result =
      await response.json();


    if (!response.ok || result.error) {
      throw new Error(
        typeof result.error === "string"
          ? result.error
          : JSON.stringify(
              result.error || result
            )
      );
    }


    /*
     * The instructor may have changed while this
     * request was running. Never render stale data
     * into the newly selected instructor's form.
     */

    if (
      state.instructor?.id !==
      instructorId
    ) {
      return;
    }


    clearStudentBookingFields();


    const fields =
      Array.isArray(
        result.student_booking_fields
      )
        ? result.student_booking_fields
        : [];


    fields.forEach(field => {

      addStudentBookingField(
        String(
          field?.question || ""
        )
      );

    });


    updateStudentBookingFieldsControls();


  } catch (error) {

    console.error(
      "LOAD STUDENT BOOKING FIELDS ERROR:",
      error
    );


    /*
     * Only clear the visible fields if this is
     * still the instructor whose request failed.
     */

    if (
      state.instructor?.id ===
      instructorId
    ) {
      clearStudentBookingFields();
    }

  }

}


function canEditEmails() {
  return hasPermission("emails");
}

function canManageServices() {
  return hasPermission("services");
}

function canManageUsers() {
  return hasPermission("users");
}


const state = {

  /*
   * Organization-level state.
   *
   * organizationId comes from the authenticated
   * settings_users record. It is never derived from
   * the selected instructor or Location selector.
   *
   * organization contains the organization-level
   * information displayed in the Organization tab.
   */
  organizationId: null,
  organization: null,

  locations: [],
  location: null,

  /*
   * Actual instructor records.
   *
   * These users participate in instructor-specific
   * Booking Settings such as booking pages,
   * availability, services, calendars, appointments,
   * and clients.
   */
  instructors: [],
  instructor: null,

  /*
   * Every Booking Settings user.
   *
   * This is the source of truth for User Management
   * and includes Administrators even when they do not
   * have an instructor record or public booking page.
   */
  settingsUsers: [],

  services: [],
  user: null,
  role: null,

  /*
   * Effective Booking Settings permissions for
   * the currently logged-in user.
   *
   * These are the role defaults combined with any
   * explicit per-user overrides.
   */
  permissions: null,

  appointments: {
    activeTab: "upcoming",
    historyDays: 60
  },

  /*
   * Client history display.
   *
   * Clients themselves are always returned from the
   * instructor's complete booking history.
   *
   * historyDays controls only historical appointments
   * shown inside each client card:
   *
   * 60    = past 60 days
   * "all" = complete appointment history
   *
   * Current and future appointments are always shown.
   */
  clients: {
    historyDays: 60
  },

  scheduleAvailability: null,

  /*
   * Other User Email settings are stored separately
   * for each Email event and selected instructor.
   */
  otherUserEmail: {
    activeEvent: "confirmation",
    settings: {}
  }
};


/* =========================================================
   SELECTED INSTRUCTOR UI
   ========================================================= */

function updateSelectedInstructorBanner() {

  const name =
    $("selectedInstructorName");

  const email =
    $("selectedInstructorEmail");


  if (!name || !email) {
    return;
  }


  if (!state.instructor) {

    name.textContent =
      "No Instructor Selected";

    email.textContent =
      "";

    return;
  }


  name.textContent =
    state.instructor.name ||
    "Selected Instructor";

  email.textContent =
    state.instructor.email ||
    "";

}


/* =========================================================
   APPOINTMENTS UI
   ========================================================= */

function updateAppointmentsHistoryDescription() {

  const description =
    $("appointmentsHistoryDescription");

  if (!description) {
    return;
  }


  const days =
    state.appointments.historyDays;


  if (days === "all") {

    description.textContent =
      "Showing all appointments.";

    return;
  }


  if (days === 365) {

    description.textContent =
      "Showing appointments from the last year.";

    return;
  }


  description.textContent =
    `Showing appointments from the last ${days} days.`;

}


function updateAppointmentsHistoryVisibility() {

  const controls =
    $("appointmentsHistoryControls");

  if (!controls) {
    return;
  }


  const historyTabs = [
    "past",
    "cancelled",
    "missed"
  ];


  controls.style.display =
    historyTabs.includes(
      state.appointments.activeTab
    )
      ? "block"
      : "none";

}


function selectAppointmentTab(tabName) {

  const validTabs = [
    "upcoming",
    "past",
    "cancelled",
    "missed",
    "schedule"
  ];


  if (!validTabs.includes(tabName)) {
    return;
  }


  state.appointments.activeTab =
    tabName;


  document
    .querySelectorAll("[data-appointment-tab]")
    .forEach(button => {

      const target =
        button.getAttribute(
          "data-appointment-tab"
        );

      const expectedTarget =
        `${tabName}AppointmentsTab`;

      button.classList.toggle(
        "active",
        target === expectedTarget
      );

    });


  document
    .querySelectorAll(".appointment-tab-panel")
    .forEach(panel => {

      panel.classList.add("hidden");

    });


  const activePanel =
    $(`${tabName}AppointmentsTab`);

  if (activePanel) {
    activePanel.classList.remove("hidden");
  }


  if (tabName === "schedule") {
    loadScheduleServices();
  }


  updateAppointmentsHistoryVisibility();
  updateAppointmentsHistoryDescription();

}


function selectAppointmentHistoryRange(days) {

  state.appointments.historyDays =
    days;


  document
    .querySelectorAll(".appointment-range")
    .forEach(button => {

      const buttonValue =
        button.getAttribute("data-days");

      const selected =
        String(days) === buttonValue;

      button.classList.toggle(
        "active",
        selected
      );

      button.classList.toggle(
        "primary",
        selected
      );

      button.classList.toggle(
        "secondary",
        !selected
      );

    });


  updateAppointmentsHistoryDescription();

}


/* =========================================================
   APPOINTMENTS DATA
   ========================================================= */

function formatAppointmentDateTime(
  appointment
) {

  const start =
    new Date(
      appointment.start_time
    );

  const end =
    new Date(
      appointment.end_time
    );


  const timeZone =
    state.instructor?.timezone ||
    appointment.timezone ||
    undefined;


  const dateText =
    new Intl.DateTimeFormat(
      "en-US",
      {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone
      }
    ).format(start);


  const startTime =
    new Intl.DateTimeFormat(
      "en-US",
      {
        hour: "numeric",
        minute: "2-digit",
        timeZone
      }
    ).format(start);


  const endTime =
    new Intl.DateTimeFormat(
      "en-US",
      {
        hour: "numeric",
        minute: "2-digit",
        timeZone
      }
    ).format(end);


  return {
    dateText,
    timeText:
      `${startTime} – ${endTime}`
  };

}


function renderAppointmentList(
  containerId,
  appointments
) {

  const container =
    $(containerId);


  if (!container) {
    return;
  }


  if (!appointments.length) {

    container.innerHTML = `
      <div
        class="muted"
        style="
          padding:20px 0;
        "
      >
        No appointments found.
      </div>
    `;

    return;
  }


  container.innerHTML =
    appointments
      .map(appointment => {

        const {
          dateText,
          timeText
        } =
          formatAppointmentDateTime(
            appointment
          );


        const serviceName =
          appointment.service_name ||
          "Appointment";


        const price =
          appointment.service_price_cents == null
            ? ""
            : appointment.service_price_cents === 0
              ? "Free"
              : `$${(
                  appointment.service_price_cents /
                  100
                ).toFixed(2)}`;


        /*
         * Historical Student Booking Field answers.
         *
         * These are snapshots stored with the booking,
         * so later changes to the instructor's current
         * questions do not change appointment history.
         */

        const bookingFieldAnswers =
          Array.isArray(
            appointment.booking_field_answers
          )
            ? appointment.booking_field_answers
            : [];


        const bookingFieldAnswersHtml =
          bookingFieldAnswers.length
            ? `
              <div
                style="
                  margin-top:14px;
                  padding-top:14px;
                  border-top:1px solid #eee;
                "
              >
                ${bookingFieldAnswers
                  .map(field => `
                    <div
                      style="
                        margin-top:8px;
                      "
                    >
                      <strong>
                        ${escapeHtml(
                          field.question || ""
                        )}
                      </strong>

                      <div
                        class="muted"
                        style="
                          margin-top:2px;
                        "
                      >
                        ${escapeHtml(
                          field.answer || ""
                        )}
                      </div>
                    </div>
                  `)
                  .join("")}
              </div>
            `
            : "";


        return `
          <div
            style="
              border:1px solid #ddd;
              border-radius:8px;
              padding:16px;
              margin-top:12px;
            "
          >

            <div
              style="
                font-size:18px;
                font-weight:700;
              "
            >
              ${escapeHtml(dateText)}
            </div>

            <div
              style="
                margin-top:4px;
                font-size:16px;
              "
            >
              ${escapeHtml(timeText)}
            </div>

            <div
              style="
                margin-top:14px;
              "
            >
              <strong>
                ${escapeHtml(
                  appointment.student_name ||
                  "Student"
                )}
              </strong>
            </div>

            <div
              class="muted"
              style="
                margin-top:4px;
              "
            >
              ${escapeHtml(
                appointment.student_email ||
                ""
              )}
            </div>

            ${
              appointment.student_phone
                ? `
                  <div
                    class="muted"
                    style="margin-top:2px;"
                  >
                    ${escapeHtml(
                      appointment.student_phone
                    )}
                  </div>
                `
                : ""
            }

            ${bookingFieldAnswersHtml}

            <div
              style="
                margin-top:14px;
              "
            >
              <strong>
                Service:
              </strong>

              ${escapeHtml(serviceName)}

              ${
                price
                  ? ` — ${escapeHtml(price)}`
                  : ""
              }
            </div>

            ${
              containerId === "upcomingAppointmentsList"
                ? `
                  <div
                    style="
                      margin-top:16px;
                      display:flex;
                      justify-content:flex-end;
                    "
                  >
                    <button
                      type="button"
                      class="secondary appointment-cancel-btn"
                      data-appointment-id="${escapeHtml(
                        appointment.id || ""
                      )}"
                    >
                      Cancel
                    </button>
                  </div>
                `
                : ""
            }

            ${
              containerId === "pastAppointmentsList"
                ? `
                  <div
                    style="
                      margin-top:16px;
                      display:flex;
                      justify-content:flex-end;
                    "
                  >
                    <button
                      type="button"
                      class="secondary appointment-missed-btn"
                      data-appointment-id="${escapeHtml(
                        appointment.id || ""
                      )}"
                    >
                      Mark Missed
                    </button>
                  </div>
                `
                : ""
            }

          </div>
        `;

      })
      .join("");

}


function renderAppointments(
  result
) {

  const counts =
    result.counts || {};


  const appointments =
    result.appointments || {};


  const upcoming =
    appointments.upcoming || [];

  const past =
    appointments.past || [];

  const cancelled =
    appointments.cancelled || [];

  const missed =
    appointments.missed || [];


  const upcomingCount =
    $("upcomingAppointmentsCount");

  const pastCount =
    $("pastAppointmentsCount");

  const cancelledCount =
    $("cancelledAppointmentsCount");

  const missedCount =
    $("missedAppointmentsCount");


  if (upcomingCount) {
    upcomingCount.textContent =
      `(${counts.upcoming ?? upcoming.length})`;
  }


  if (pastCount) {
    pastCount.textContent =
      `(${counts.past ?? past.length})`;
  }


  if (cancelledCount) {
    cancelledCount.textContent =
      `(${counts.cancelled ?? cancelled.length})`;
  }


  if (missedCount) {
    missedCount.textContent =
      `(${counts.missed ?? missed.length})`;
  }


  renderAppointmentList(
    "upcomingAppointmentsList",
    upcoming
  );


  renderAppointmentList(
    "pastAppointmentsList",
    past
  );


  renderAppointmentList(
    "cancelledAppointmentsList",
    cancelled
  );


  renderAppointmentList(
    "missedAppointmentsList",
    missed
  );

}


async function loadAppointments() {

  if (!state.instructor?.id) {

    renderAppointments({
      counts: {
        upcoming: 0,
        past: 0,
        cancelled: 0,
        missed: 0
      },

      appointments: {
        upcoming: [],
        past: [],
        cancelled: [],
        missed: []
      }
    });

    return;
  }


  const listIds = [
    "upcomingAppointmentsList",
    "pastAppointmentsList",
    "cancelledAppointmentsList",
    "missedAppointmentsList"
  ];


  listIds.forEach(id => {

    const container =
      $(id);

    if (container) {
      container.innerHTML = `
        <div
          class="muted"
          style="
            padding:20px 0;
          "
        >
          Loading appointments...
        </div>
      `;
    }

  });


  try {

    const authHeaders =
      await getAuthHeaders();


    const response =
      await fetch(
        `${cfg.functionsBaseUrl}/get-appointments`,
        {
          method: "POST",
          headers: authHeaders,

          body: JSON.stringify({
            instructor_id:
              state.instructor.id,

            history_days:
              state.appointments.historyDays
          })
        }
      );


    const result =
      await response.json();


    if (
      !response.ok ||
      result.error
    ) {

      throw new Error(
        result.error ||
        "Unable to load appointments."
      );

    }


    renderAppointments(
      result
    );


  } catch (error) {

    console.error(
      "APPOINTMENTS LOAD ERROR:",
      error
    );


    listIds.forEach(id => {

      const container =
        $(id);

      if (container) {
        container.innerHTML = `
          <div
            class="state error"
            style="
              margin-top:12px;
            "
          >
            ${escapeHtml(
              error.message ||
              "Unable to load appointments."
            )}
          </div>
        `;
      }

    });

  }

}


/* =========================================================
   CLIENTS UI
   ========================================================= */

function updateClientsHistoryDescription() {

  const description =
    $("clientsHistoryDescription");


  if (!description) {
    return;
  }


  if (state.clients.historyDays === "all") {

    description.textContent =
      "Showing complete appointment history for each client.";

    return;
  }


  description.textContent =
    "Showing all current and upcoming appointments, plus past appointments from the last 60 days.";

}


function selectClientHistoryRange(days) {

  state.clients.historyDays =
    days;


  document
    .querySelectorAll(".client-range")
    .forEach(button => {

      const buttonValue =
        button.getAttribute(
          "data-client-days"
        );

      const selected =
        String(days) ===
        buttonValue;


      button.classList.toggle(
        "active",
        selected
      );

      button.classList.toggle(
        "primary",
        selected
      );

      button.classList.toggle(
        "secondary",
        !selected
      );

    });


  updateClientsHistoryDescription();

}


function getClientAppointmentStatus(
  appointment
) {

  const status =
    String(
      appointment.status || ""
    ).toLowerCase();


  if (status === "cancelled") {
    return "Cancelled";
  }


  if (status === "missed") {
    return "Missed";
  }


  const endTime =
    new Date(
      appointment.end_time
    );


  if (
    Number.isFinite(
      endTime.getTime()
    ) &&
    endTime <= new Date()
  ) {
    return "Completed";
  }


  if (status === "rescheduled") {
    return "Rescheduled";
  }


  return "Upcoming";

}


function renderClientAppointment(
  appointment
) {

  const {
    dateText,
    timeText
  } =
    formatAppointmentDateTime(
      appointment
    );


  const status =
    getClientAppointmentStatus(
      appointment
    );


  const serviceName =
    appointment.service_name ||
    "Appointment";


  const price =
    appointment.service_price_cents == null
      ? ""
      : appointment.service_price_cents === 0
        ? "Free"
        : `$${(
            appointment.service_price_cents /
            100
          ).toFixed(2)}`;


  return `
    <div
      style="
        margin-top:12px;
        padding:14px;
        border:1px solid #ddd;
        border-radius:8px;
        background:#fafafa;
      "
    >

      <div
        style="
          display:flex;
          justify-content:space-between;
          gap:12px;
          align-items:flex-start;
          flex-wrap:wrap;
        "
      >

        <div>

          <div
            style="
              font-weight:700;
            "
          >
            ${escapeHtml(dateText)}
          </div>

          <div
            class="muted"
            style="
              margin-top:3px;
            "
          >
            ${escapeHtml(timeText)}
          </div>

        </div>


        <div
          style="
            font-weight:700;
          "
        >
          ${escapeHtml(status)}
        </div>

      </div>


      <div
        style="
          margin-top:10px;
        "
      >

        <strong>
          Service:
        </strong>

        ${escapeHtml(serviceName)}

        ${
          price
            ? ` — ${escapeHtml(price)}`
            : ""
        }

      </div>

    </div>
  `;

}


function renderClients(result) {

  const container =
    $("clientsList");


  if (!container) {
    return;
  }


  const clients =
    Array.isArray(result?.clients)
      ? result.clients
      : [];


  if (!clients.length) {

    container.innerHTML = `
      <div
        class="muted"
        style="
          padding:20px 0;
        "
      >
        No clients found.
      </div>
    `;

    return;
  }


  container.innerHTML =
    clients
      .map((client, index) => {

        const appointments =
          Array.isArray(
            client.appointments
          )
            ? client.appointments
            : [];


        const appointmentCount =
          appointments.length;


        const appointmentText =
          appointmentCount === 1
            ? "1 appointment"
            : `${appointmentCount} appointments`;


        const clientName =
          client.name ||
          "Unnamed Client";


        const clientEmail =
          client.email || "";


        const clientPhone =
          client.phone || "";


        const appointmentsHtml =
          appointmentCount
            ? appointments
                .map(
                  appointment =>
                    renderClientAppointment(
                      appointment
                    )
                )
                .join("")
            : `
              <div
                class="muted"
                style="
                  padding:16px 0 4px;
                "
              >
                No appointments in the selected history range.
              </div>
            `;


        return `
          <div
            class="client-card"
            style="
              border:1px solid #ddd;
              border-radius:8px;
              margin-top:14px;
              overflow:hidden;
            "
          >

            <button
              type="button"
              class="client-card-toggle"
              data-client-index="${index}"
              aria-expanded="false"
              style="
                width:100%;
                border:0;
                border-radius:0;
                background:transparent;
                color:inherit;
                padding:16px;
                text-align:left;
                cursor:pointer;
              "
            >

              <div
                style="
                  display:flex;
                  justify-content:space-between;
                  gap:16px;
                  align-items:flex-start;
                "
              >

                <div
                  style="
                    min-width:0;
                  "
                >

                  <div
                    style="
                      font-size:18px;
                      font-weight:700;
                    "
                  >
                    ${escapeHtml(clientName)}
                  </div>

                  ${
                    clientPhone
                      ? `
                        <div
                          class="muted"
                          style="
                            margin-top:5px;
                            overflow-wrap:anywhere;
                          "
                        >
                          ${escapeHtml(clientPhone)}
                        </div>
                      `
                      : ""
                  }

                  ${
                    clientEmail
                      ? `
                        <div
                          class="muted"
                          style="
                            margin-top:3px;
                            overflow-wrap:anywhere;
                          "
                        >
                          ${escapeHtml(clientEmail)}
                        </div>
                      `
                      : ""
                  }

                </div>


                <div
                  style="
                    flex:0 0 auto;
                    text-align:right;
                  "
                >

                  <div
                    class="muted"
                  >
                    ${escapeHtml(
                      appointmentText
                    )}
                  </div>

                  <div
                    class="client-card-arrow"
                    style="
                      margin-top:5px;
                      font-size:18px;
                    "
                  >
                    ▼
                  </div>

                </div>

              </div>

            </button>


            <div
              class="client-card-appointments hidden"
              data-client-appointments="${index}"
              style="
                padding:0 16px 16px;
                border-top:1px solid #eee;
              "
            >

              ${appointmentsHtml}

            </div>

          </div>
        `;

      })
      .join("");

}


function clearClients() {

  const container =
    $("clientsList");


  if (!container) {
    return;
  }


  container.innerHTML = `
    <div
      class="muted"
      style="
        padding:20px 0;
      "
    >
      No instructor selected.
    </div>
  `;

}


/* =========================================================
   CLIENTS DATA
   ========================================================= */

async function loadClients() {

  if (!hasPermission("clients")) {
    return;
  }


  if (!state.instructor?.id) {

    clearClients();

    return;
  }


  const instructorId =
    state.instructor.id;


  const container =
    $("clientsList");


  if (container) {

    container.innerHTML = `
      <div
        class="muted"
        style="
          padding:20px 0;
        "
      >
        Loading clients...
      </div>
    `;

  }


  try {

    const authHeaders =
      await getAuthHeaders();


    const response =
      await fetch(
        `${cfg.functionsBaseUrl}/get-appointments`,
        {
          method: "POST",

          headers:
            authHeaders,

          body: JSON.stringify({
            mode:
              "clients",

            instructor_id:
              instructorId,

            history_days:
              state.clients.historyDays
          })
        }
      );


    const result =
      await response.json();


    if (
      !response.ok ||
      result.error
    ) {

      throw new Error(
        result.error ||
        "Unable to load clients."
      );

    }


    /*
     * The selected instructor may have changed while
     * this request was running.
     *
     * Never render the previous instructor's clients
     * into the newly selected instructor's tab.
     */

    if (
      state.instructor?.id !==
      instructorId
    ) {
      return;
    }


    renderClients(
      result
    );


  } catch (error) {

    console.error(
      "CLIENTS LOAD ERROR:",
      error
    );


    /*
     * Only display this request's error if the same
     * instructor is still selected.
     */

    if (
      state.instructor?.id !==
      instructorId
    ) {
      return;
    }


    if (container) {

      container.innerHTML = `
        <div
          class="state error"
          style="
            margin-top:12px;
          "
        >
          ${escapeHtml(
            error.message ||
            "Unable to load clients."
          )}
        </div>
      `;

    }

  }

}


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


/* =========================================================
   ORGANIZATION SETTINGS
   ========================================================= */

/*
 * Organization data is independent of the currently
 * selected Location or Instructor.
 *
 * The organization ID comes only from the authenticated
 * settings_users record and is stored in
 * state.organizationId.
 */

function loadOrganizationIntoForm(organization) {

  state.organization =
    organization || null;


  const organizationData =
    organization || {};


  $("organizationName").value =
    organizationData.name || "";

  $("organizationHeadquartersName").value =
    organizationData.headquarters_name || "";

  $("organizationAddressLine1").value =
    organizationData.headquarters_address_line_1 || "";

  $("organizationAddressLine2").value =
    organizationData.headquarters_address_line_2 || "";

  $("organizationCity").value =
    organizationData.headquarters_city || "";

  $("organizationStateProvince").value =
    organizationData.headquarters_state_province || "";

  $("organizationPostalCode").value =
    organizationData.headquarters_postal_code || "";

  $("organizationCountry").value =
    organizationData.headquarters_country || "";

  $("organizationMainPhone").value =
    organizationData.main_phone || "";

  $("organizationMainEmail").value =
    organizationData.main_email || "";

  $("organizationWebsite").value =
    organizationData.website || "";

}


async function loadOrganizationSettings() {

  /*
   * Do not attempt the protected organization SELECT
   * unless the logged-in user has Organization access.
   */

  if (!hasPermission("organization")) {

    state.organization = null;

    return;
  }


  if (!state.organizationId) {

    throw new Error(
      "Your Booking Settings account is not assigned to an organization."
    );

  }


  const {
    data,
    error
  } =
    await db
      .from("organizations")
      .select(`
        id,
        name,
        headquarters_name,
        headquarters_address_line_1,
        headquarters_address_line_2,
        headquarters_city,
        headquarters_state_province,
        headquarters_postal_code,
        headquarters_country,
        main_phone,
        main_email,
        website
      `)
      .eq(
        "id",
        state.organizationId
      )
      .single();


  if (error) {

    console.error(
      "LOAD ORGANIZATION SETTINGS ERROR:",
      error
    );

    throw new Error(
      "Unable to load Organization settings."
    );

  }


  if (!data) {

    throw new Error(
      "Unable to find your organization."
    );

  }


  /*
   * Extra defensive check:
   *
   * The RLS policy already restricts the SELECT to the
   * authenticated user's organization. Never render a
   * record that does not match the organization assigned
   * during authentication.
   */

  if (
    data.id !==
    state.organizationId
  ) {

    throw new Error(
      "The Organization settings response did not match your account."
    );

  }


  loadOrganizationIntoForm(
    data
  );

}


async function saveOrganizationSettings(button) {

  if (!hasPermission("organization")) {

    showCustomAlert(
      "You do not have permission to manage Organization settings."
    );

    return;
  }


  if (!state.organizationId) {

    showCustomAlert(
      "Your Booking Settings account is not assigned to an organization."
    );

    return;
  }


  const originalText =
    button.textContent;


  button.disabled = true;

  button.textContent =
    "Saving...";


  try {

    /*
     * IMPORTANT:
     *
     * organization_id is deliberately NOT sent.
     *
     * The save-organization-settings Edge Function
     * derives the organization exclusively from the
     * authenticated settings_users membership.
     *
     * slug and active are also deliberately absent.
     */

    const payload = {

      name:
        $("organizationName").value.trim(),

      headquarters_name:
        $("organizationHeadquartersName").value.trim(),

      headquarters_address_line_1:
        $("organizationAddressLine1").value.trim(),

      headquarters_address_line_2:
        $("organizationAddressLine2").value.trim(),

      headquarters_city:
        $("organizationCity").value.trim(),

      headquarters_state_province:
        $("organizationStateProvince").value.trim(),

      headquarters_postal_code:
        $("organizationPostalCode").value.trim(),

      headquarters_country:
        $("organizationCountry").value.trim(),

      main_phone:
        $("organizationMainPhone").value.trim(),

      main_email:
        $("organizationMainEmail").value.trim(),

      website:
        $("organizationWebsite").value.trim()

    };


    if (!payload.name) {

      throw new Error(
        "Organization Name is required."
      );

    }


    const response =
      await fetch(
        `${cfg.functionsBaseUrl}/save-organization-settings`,
        {
          method: "POST",
          headers:
            await getAuthHeaders(),

          body:
            JSON.stringify(
              payload
            )
        }
      );


    const result =
      await response.json();


    if (
      !response.ok ||
      result.error
    ) {

      const errorMessage =
        typeof result.error === "string"
          ? result.error
          : result.error?.message ||
            result.message ||
            JSON.stringify(
              result.error || result
            );


      throw new Error(
        errorMessage ||
        "Unable to save Organization settings."
      );

    }


    if (!result.organization) {

      throw new Error(
        "The Organization settings were not returned after saving."
      );

    }


    /*
     * The server returns the authoritative saved values.
     * Use those values to keep both state and the form
     * synchronized with the database.
     */

    loadOrganizationIntoForm(
      result.organization
    );


    button.textContent =
      "Saved";


    setTimeout(() => {

      button.textContent =
        originalText;

    }, 1500);


  } catch (error) {

    console.error(
      "SAVE ORGANIZATION SETTINGS ERROR:",
      error
    );


    button.textContent =
      "Save Failed";


    showCustomAlert(
      error.message ||
      "Unable to save Organization settings."
    );


    setTimeout(() => {

      button.textContent =
        originalText;

    }, 2000);


  } finally {

    button.disabled = false;

  }

}


$("saveOrganizationBtn")?.addEventListener(
  "click",
  async event => {

    await saveOrganizationSettings(
      event.currentTarget
    );

  }
);


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
      .select(
        "role, active, permissions, organization_id"
      )
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

  if (!settingsUser.organization_id) {
    throw new Error(
      "Your Booking Settings account is not assigned to an organization."
    );
  }


  state.user = user;
  state.role = settingsUser.role;
  state.organizationId =
    settingsUser.organization_id;


  /*
   * Build the logged-in user's effective permission
   * set locally from their role defaults plus their
   * explicit database overrides.
   */

  const roleDefaults =
    rolePermissionDefaults[
      settingsUser.role
    ] || {};


  const permissionOverrides =
    (
      settingsUser.permissions &&
      typeof settingsUser.permissions ===
        "object" &&
      !Array.isArray(
        settingsUser.permissions
      )
    )
      ? settingsUser.permissions
      : {};


  state.permissions = {
    ...roleDefaults,
    ...permissionOverrides
  };


  return true;
}

function applyRolePermissions() {

  /*
   * Top-level Booking Settings tabs are controlled
   * entirely by the logged-in user's effective
   * permissions.
   *
   * Role defaults have already been combined with
   * individual overrides in state.permissions.
   */

  const tabPermissions = [
    {
      permission: "users",
      panelId: "usersTab"
    },
    {
      permission: "organization",
      panelId: "organizationTab"
    },
    {
      permission: "location",
      panelId: "locationTab"
    },
    {
      permission: "branding",
      panelId: "brandingTab"
    },
    {
      permission: "availability",
      panelId: "availabilityTab"
    },
    {
      permission: "booking_rules",
      panelId: "bookingRulesTab"
    },
    {
      permission: "services",
      panelId: "servicesTab"
    },
    {
      permission: "calendar",
      panelId: "calendarTab"
    },
    {
      permission: "appointments",
      panelId: "appointmentsTab"
    },
    {
      permission: "clients",
      panelId: "clientsTab"
    },
    {
      permission: "emails",
      panelId: "emailsTab"
    }
  ];


  /*
   * Apply visibility to BOTH the tab button and its
   * corresponding panel.
   *
   * This deliberately handles both directions:
   * permissions can be granted OR removed while the
   * page is open.
   */

  tabPermissions.forEach(item => {

    const allowed =
      hasPermission(
        item.permission
      );

    const panel =
      $(item.panelId);

    const button =
      document.querySelector(
        `[data-tab="${item.panelId}"]`
      );


    button?.classList.toggle(
      "hidden",
      !allowed
    );


    panel?.classList.toggle(
      "hidden",
      !allowed
    );

  });


  /*
   * Student Booking Fields live inside Booking Rules.
   * Access therefore follows the Booking Rules
   * permission.
   */

  const studentBookingFieldsSection =
    $("studentBookingFieldsSection");

  if (studentBookingFieldsSection) {

    studentBookingFieldsSection
      .classList.toggle(
        "hidden",
        !canManageStudentBookingFields()
      );

  }


  /*
   * Determine whether the currently active tab is
   * still permitted.
   *
   * This matters when a user's permissions change
   * while they are already on the Settings page.
   */

  const activeButton =
    document.querySelector(
      ".settings-tab.active"
    );

  const activePanelId =
    activeButton?.getAttribute(
      "data-tab"
    );

  const activeTabConfig =
    tabPermissions.find(
      item =>
        item.panelId ===
        activePanelId
    );

  const activeTabStillAllowed =
    activeTabConfig
      ? hasPermission(
          activeTabConfig.permission
        )
      : false;


  if (activeTabStillAllowed) {
    return;
  }


  /*
   * The active tab is no longer available, or there
   * was no valid active tab.
   *
   * Clear the old active state and move to the first
   * permitted tab in normal page order.
   */

  document
    .querySelectorAll(
      ".settings-tab-panel"
    )
    .forEach(panel => {

      panel.classList.remove(
        "active"
      );

    });


  document
    .querySelectorAll(
      ".settings-tab"
    )
    .forEach(tab => {

      tab.classList.remove(
        "active"
      );

    });


  const firstAllowedTab =
    tabPermissions.find(
      item =>
        hasPermission(
          item.permission
        )
    );


  if (!firstAllowedTab) {

    console.warn(
      "This user does not have access to any Booking Settings tabs."
    );

    return;

  }


  const firstAllowedPanel =
    $(firstAllowedTab.panelId);

  const firstAllowedButton =
    document.querySelector(
      `[data-tab="${firstAllowedTab.panelId}"]`
    );


  firstAllowedPanel?.classList.add(
    "active"
  );

  firstAllowedButton?.classList.add(
    "active"
  );

}


async function loadLocationIntoForm(loc) {

state.location = loc;



  if (!state.instructor) {
    console.warn(
      "No instructor is currently selected."
    );
  }

  const instructorLocation =
    state.instructor || {};

  $("locationName").value =
    instructorLocation.location_name ||
    loc.name ||
    "";

  $("address").value =
    instructorLocation.address ||
    loc.address ||
    "";

  $("website").value =
    instructorLocation.website ||
    loc.website ||
    "";

  $("services").value =
    instructorLocation.services ||
    "";

  $("instructorTimezone").value =
    instructorLocation.timezone ||
    "America/Phoenix";

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


  /*
   * Email Settings
   *
   * Instructor values override Location defaults.
   * NULL instructor values inherit from the Location.
   */
  const instructorEmailSettings =
    state.instructor || {};

  const emailSettings = {
    confirmation_email_subject:
      instructorEmailSettings.confirmation_email_subject ??
      loc.confirmation_email_subject,

    confirmation_email_message:
      instructorEmailSettings.confirmation_email_message ??
      loc.confirmation_email_message,

    student_confirmation_enabled:
      instructorEmailSettings.student_confirmation_enabled ??
      loc.student_confirmation_enabled,

    confirmation_button_enabled:
      instructorEmailSettings.confirmation_button_enabled ??
      loc.confirmation_button_enabled,

    confirmation_button_text:
      instructorEmailSettings.confirmation_button_text ??
      loc.confirmation_button_text,

    confirmation_button_url:
      instructorEmailSettings.confirmation_button_url ??
      loc.confirmation_button_url,

    instructor_confirmation_email:
      instructorEmailSettings.instructor_confirmation_email ??
      loc.instructor_confirmation_email,

    instructor_confirmation_subject:
      instructorEmailSettings.instructor_confirmation_subject ??
      loc.instructor_confirmation_subject,

    instructor_confirmation_message:
      instructorEmailSettings.instructor_confirmation_message ??
      loc.instructor_confirmation_message,

    reschedule_email_subject:
      instructorEmailSettings.reschedule_email_subject ??
      loc.reschedule_email_subject,

    reschedule_email_message:
      instructorEmailSettings.reschedule_email_message ??
      loc.reschedule_email_message,

    reschedule_button_enabled:
      instructorEmailSettings.reschedule_button_enabled ??
      loc.reschedule_button_enabled,

    reschedule_button_text:
      instructorEmailSettings.reschedule_button_text ??
      loc.reschedule_button_text,

    reschedule_button_url:
      instructorEmailSettings.reschedule_button_url ??
      loc.reschedule_button_url,

    instructor_reschedule_email:
      instructorEmailSettings.instructor_reschedule_email ??
      loc.instructor_reschedule_email,

    instructor_reschedule_subject:
      instructorEmailSettings.instructor_reschedule_subject ??
      loc.instructor_reschedule_subject,

    instructor_reschedule_message:
      instructorEmailSettings.instructor_reschedule_message ??
      loc.instructor_reschedule_message,

    reminder_enabled:
      instructorEmailSettings.reminder_enabled ??
      loc.reminder_enabled,

    reminder_hours_before:
      instructorEmailSettings.reminder_hours_before ??
      loc.reminder_hours_before,

    instructor_email:
      instructorEmailSettings.instructor_email ??
      loc.instructor_email,

    student_reminder_subject:
      instructorEmailSettings.student_reminder_subject ??
      loc.student_reminder_subject,

    student_reminder_message:
      instructorEmailSettings.student_reminder_message ??
      loc.student_reminder_message,

    instructor_reminder_subject:
      instructorEmailSettings.instructor_reminder_subject ??
      loc.instructor_reminder_subject,

    instructor_reminder_message:
      instructorEmailSettings.instructor_reminder_message ??
      loc.instructor_reminder_message,

    cancel_email_subject:
      instructorEmailSettings.cancel_email_subject ??
      loc.cancel_email_subject,

    cancel_email_message:
      instructorEmailSettings.cancel_email_message ??
      loc.cancel_email_message,

    instructor_cancel_email:
      instructorEmailSettings.instructor_cancel_email,

    instructor_cancel_subject:
      instructorEmailSettings.instructor_cancel_subject,

    instructor_cancel_message:
      instructorEmailSettings.instructor_cancel_message,

    missed_email_subject:
      instructorEmailSettings.missed_email_subject ??
      loc.missed_email_subject,

    missed_email_message:
      instructorEmailSettings.missed_email_message ??
      loc.missed_email_message,

    followup_enabled:
      instructorEmailSettings.followup_enabled ??
      loc.followup_enabled,

    followup_delay_minutes:
      instructorEmailSettings.followup_delay_minutes ??
      loc.followup_delay_minutes,

    followup_subject:
      instructorEmailSettings.followup_subject ??
      loc.followup_subject,

    followup_message:
      instructorEmailSettings.followup_message ??
      loc.followup_message
  };


  $("emailSubject").value =
    emailSettings.confirmation_email_subject ||
    "Your appointment confirmation";

  $("emailMessage").value =
    emailSettings.confirmation_email_message ||
    `Thank you for booking with us!

Appointment Date: {{DATE}}
Appointment Time: {{TIME}}
Location: {{LOCATION}}

{{CONFIRMATION_BUTTON}}

{{MANAGE_BUTTON}}`;

  $("instructorConfirmationEmail").value =
    emailSettings.instructor_confirmation_email ||
    "";

  $("instructorConfirmationSubject").value =
    emailSettings.instructor_confirmation_subject ||
    "New appointment booking";

  $("instructorConfirmationMessage").value =
    emailSettings.instructor_confirmation_message ||
    `A new appointment has been booked.

Appointment Date: {{DATE}}
Appointment Time: {{TIME}}
Location: {{LOCATION}}
Student: {{STUDENT_NAME}}
Instructor: {{INSTRUCTOR_NAME}}`;

  $("confirmationButtonEnabled").checked =
    Boolean(
      emailSettings.confirmation_button_enabled
    );

  $("confirmationButtonText").value =
    emailSettings.confirmation_button_text ||
    "Join Video Conference";

  $("confirmationButtonUrl").value =
    emailSettings.confirmation_button_url ||
    "";


  /*
   * Reschedule Email
   */

  $("rescheduleEmailSubject").value =
    emailSettings.reschedule_email_subject ||
    "Your appointment has been rescheduled";

  $("rescheduleEmailMessage").value =
    emailSettings.reschedule_email_message ||
    `Your appointment has been rescheduled.

Appointment Date: {{DATE}}
Appointment Time: {{TIME}}
Location: {{LOCATION}}

{{RESCHEDULE_BUTTON}}

{{MANAGE_BUTTON}}`;

  $("rescheduleButtonEnabled").checked =
    Boolean(
      emailSettings.reschedule_button_enabled
    );

  $("rescheduleButtonText").value =
    emailSettings.reschedule_button_text ||
    "Join Video Conference";

  $("rescheduleButtonUrl").value =
    emailSettings.reschedule_button_url ||
    "";

  $("instructorRescheduleEmail").value =
    emailSettings.instructor_reschedule_email ||
    "";

  $("instructorRescheduleSubject").value =
    emailSettings.instructor_reschedule_subject ||
    "Appointment rescheduled";

  $("instructorRescheduleMessage").value =
    emailSettings.instructor_reschedule_message ||
    `An appointment has been rescheduled.

Appointment Date: {{DATE}}
Appointment Time: {{TIME}}
Location: {{LOCATION}}
Student: {{STUDENT_NAME}}
Instructor: {{INSTRUCTOR_NAME}}`;


  /*
   * Cancel Email
   */

  $("studentCancelSubject").value =
    emailSettings.cancel_email_subject ||
    "Your appointment has been cancelled";

  $("studentCancelMessage").value =
    emailSettings.cancel_email_message ||
    `Your appointment has been cancelled.

Appointment Date: {{DATE}}
Appointment Time: {{TIME}}
Location: {{LOCATION}}
Student: {{STUDENT_NAME}}
Instructor: {{INSTRUCTOR_NAME}}`;

  $("instructorCancelEmail").value =
    emailSettings.instructor_cancel_email ||
    "";

  $("instructorCancelSubject").value =
    emailSettings.instructor_cancel_subject ||
    "Appointment Cancellation";

  $("instructorCancelMessage").value =
    emailSettings.instructor_cancel_message ||
    `An appointment has been cancelled.

Appointment Date: {{DATE}}
Appointment Time: {{TIME}}
Location: {{LOCATION}}
Student: {{STUDENT_NAME}}
Instructor: {{INSTRUCTOR_NAME}}`;


  /*
   * Missed Email
   */

  $("studentMissedSubject").value =
    emailSettings.missed_email_subject ||
    "You missed your appointment";

  $("studentMissedMessage").value =
    emailSettings.missed_email_message ||
    `You missed your appointment.

Appointment Date: {{DATE}}
Appointment Time: {{TIME}}
Location: {{LOCATION}}
Student: {{STUDENT_NAME}}
Instructor: {{INSTRUCTOR_NAME}}

{{MANAGE_BUTTON}}`;


  /*
   * Reminder Email
   */

  $("reminderEnabled").checked =
    emailSettings.reminder_enabled ?? true;

  $("reminderHoursBefore").value =
    emailSettings.reminder_hours_before ?? 24;

  $("instructorEmail").value =
    emailSettings.instructor_email ||
    "";

  $("studentReminderSubject").value =
    emailSettings.student_reminder_subject ||
    "Reminder: Your upcoming appointment";

  $("studentReminderMessage").value =
    emailSettings.student_reminder_message ||
    `This is a reminder about your upcoming appointment.

Appointment Date: {{DATE}}
Appointment Time: {{TIME}}
Location: {{LOCATION}}

{{CONFIRMATION_BUTTON}}

{{MANAGE_BUTTON}}`;

  $("instructorReminderSubject").value =
    emailSettings.instructor_reminder_subject ||
    "Upcoming appointment reminder";

  $("instructorReminderMessage").value =
    emailSettings.instructor_reminder_message ||
    `This is a reminder about an upcoming appointment.

Appointment Date: {{DATE}}
Appointment Time: {{TIME}}
Location: {{LOCATION}}
Student: {{STUDENT_NAME}}
Instructor: {{INSTRUCTOR_NAME}}`;


  /*
   * Follow-Up Email
   */

  $("followupEnabled").checked =
    emailSettings.followup_enabled ?? true;

  $("followupDelayMinutes").value =
    emailSettings.followup_delay_minutes ?? 15;

  $("followupSubject").value =
    emailSettings.followup_subject ||
    "Thank you for your appointment";

  $("followupMessage").value =
    emailSettings.followup_message ||
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

  if (hasPermission("calendar")) {

    /*
     * Calendar settings are independent of the rest of
     * Location/Booking Settings initialization.
     *
     * Load them in the background so the Calendar tab
     * does not delay the rest of the page becoming ready.
     */
    (async () => {

      try {

        const calendarResponse = await fetch(
          `${cfg.functionsBaseUrl}/get-calendar-settings`,
          {
            method: "POST",
            headers: await getAuthHeaders(),
            body: JSON.stringify({
              location_id:
                state.location?.id,

              instructor_id:
                state.instructor?.id
            })
          }
        );


        const calendarResult =
          await calendarResponse.json();


        if (
          !calendarResponse.ok ||
          calendarResult.error
        ) {

          console.error(
            "CALENDAR SETTINGS ERROR:",
            calendarResult
          );

          $("calendarInfo").textContent =
            calendarResult.error ||
            "Unable to load calendar configuration.";

          return;

        }


        const connection =
          calendarResult.connection;

        const blockingCalendars =
          calendarResult.blocking_calendars || [];


        if (connection?.google_calendar_id) {

          $("connectCalendarBtn").textContent =
            "Connect NEW Google Calendar";

          $("calendarConnectionName").textContent =
            "Connected";

        } else {

          $("connectCalendarBtn").textContent =
            "Connect Google Calendar";

          $("calendarConnectionName").textContent =
            "Not connected";

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
          connection?.google_calendar_id
            ? calendarInfo
            : "No calendar connection found.";


        const controls =
          $("blockingCalendarControls");


        if (controls) {

          controls.innerHTML =
            blockingCalendars.length
              ? blockingCalendars.map(calendar => {

                  return `
                    <div style="margin-top:12px;">
                      <strong>
                        ${escapeHtml(calendar.calendar_name)}
                      </strong>
                    </div>
                  `;

                }).join("")
              : "No blocking calendars configured.";


          controls
            .querySelectorAll(".blocking-calendar-toggle")
            .forEach(button => {

              button.addEventListener(
                "click",
                async () => {

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
                        headers: await getAuthHeaders(),
                        body: JSON.stringify({
                          location_id:
                            state.location.id,

                          google_calendar_id:
                            calendarId,

                          enabled:
                            newEnabled
                        })
                      }
                    );


                    const result =
                      await response.json();


                    if (
                      !response.ok ||
                      result.error
                    ) {

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


                    /*
                     * Reload calendar information after
                     * a blocking-calendar change.
                     */
                    await loadLocationIntoForm(
                      state.location
                    );


                  } catch (error) {

                    console.error(
                      "BLOCKING CALENDAR UPDATE ERROR:",
                      error
                    );

                    button.textContent =
                      currentlyEnabled
                        ? "Disable"
                        : "Enable";


                    showCustomAlert(
                      error.message ||
                      "Unable to update blocking calendar."
                    );


                  } finally {

                    button.disabled = false;

                  }

                }
              );

            });

        }


        $("calendarInfo").innerHTML =
          connection?.google_calendar_id
            ? calendarInfo
            : "No calendar connection found.";


      } catch (error) {

        console.error(
          "CALENDAR SETTINGS LOAD ERROR:",
          error
        );

      }

    })();

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
                display:flex;
                flex-wrap:wrap;
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

      $("instructorConfirmationSubject").value =
        "New appointment booking";

      $("instructorConfirmationMessage").value =
        `A new appointment has been booked.

Appointment Date: {{DATE}}
Appointment Time: {{TIME}}
Location: {{LOCATION}}
Student: {{STUDENT_NAME}}
Instructor: {{INSTRUCTOR_NAME}}`;

    }
  );

}


/* =========================================================
   STUDENT BOOKING FIELDS — ADD QUESTION
   ========================================================= */

const addStudentBookingFieldBtn =
  $("addStudentBookingFieldBtn");

if (addStudentBookingFieldBtn) {

  /*
   * loadLocationIntoForm() can run multiple times while
   * Settings is open.
   *
   * Use onclick assignment instead of addEventListener()
   * so repeated form loads replace this handler rather
   * than stacking additional click handlers.
   */

  addStudentBookingFieldBtn.onclick =
    () => {

      if (!canManageStudentBookingFields()) {
        return;
      }

      addStudentBookingField();

    };

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
    display:flex;
    flex-wrap:wrap;
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
  "Safe Insight";

$("brandSubtitle").textContent =
  state.instructor?.name
    ? `with ${state.instructor.name}`
    : "Administration";

$("brandLogo").src =
  loc.logo_url || "safe-insight-logo.png";

  $("footerText").textContent =
    loc.footer_text ||
    `Booking powered by ${loc.name || "Safe Insight"}`;
}


function validateManualAppointment() {

  const studentName =
    $("scheduleStudentName")?.value.trim() || "";

  const studentEmail =
    $("scheduleStudentEmail")?.value.trim() || "";

  const studentPhone =
    $("scheduleStudentPhone")?.value.trim() || "";

  const selectedService =
    document.querySelector(
      'input[name="scheduleService"]:checked'
    );

  const selectedTimeMode =
    document.querySelector(
      'input[name="scheduleTimeMode"]:checked'
    )?.value;


  if (!studentName) {
    return {
      valid: false,
      message:
        "Enter the student's name."
    };
  }


  if (!studentEmail) {
    return {
      valid: false,
      message:
        "Enter the student's email address."
    };
  }


  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      studentEmail
    )
  ) {
    return {
      valid: false,
      message:
        "Enter a valid student email address."
    };
  }


  if (!selectedService) {
    return {
      valid: false,
      message:
        "Select a service."
    };
  }


  let startTime = "";
  let endTime = "";
  let conflictOverride = false;


  if (selectedTimeMode === "available") {

    const selection =
      $("scheduleAvailableTimeSelection");

    startTime =
      selection?.dataset.startTime || "";

    endTime =
      selection?.dataset.endTime || "";


    if (!startTime || !endTime) {
      return {
        valid: false,
        message:
          "Select an available appointment time."
      };
    }

  } else if (
    selectedTimeMode === "custom"
  ) {

    const selection =
      $("scheduleCustomTimeSelection");

    const conflictStatus =
      $("scheduleCustomConflictStatus");


    startTime =
      selection?.dataset.startIso || "";

    endTime =
      selection?.dataset.endIso || "";


    if (!startTime || !endTime) {
      return {
        valid: false,
        message:
          "Select a custom appointment date and time."
      };
    }


    const conflict =
      conflictStatus?.dataset.conflict ===
      "true";

    conflictOverride =
      conflictStatus?.dataset.override ===
      "true";


    if (
      conflict &&
      !conflictOverride
    ) {
      return {
        valid: false,
        message:
          "This appointment has a scheduling conflict. Approve the conflict override before continuing."
      };
    }

  } else {

    return {
      valid: false,
      message:
        "Select an appointment time option."
    };
  }


  return {
    valid: true,

    appointment: {
      student: {
        fullName: studentName,
        email: studentEmail,
        phone: studentPhone
      },

      serviceId:
        selectedService.value,

      timeMode:
        selectedTimeMode,

      startTime,
      endTime,

      conflictOverride
    }
  };
}


async function loadScheduleServices() {

  if (!state.instructor?.id) {
    renderScheduleServices([]);
    return;
  }


  const locationSlug =
    state.location?.slug;

  const instructorSlug =
    state.instructor?.slug;


  if (
    !locationSlug ||
    !instructorSlug
  ) {
    renderScheduleServices([]);
    return;
  }


  const container =
    $("scheduleServicesList");


  if (container) {
    container.innerHTML = `
      <div class="muted">
        Loading services...
      </div>
    `;
  }


  try {

    const response =
      await fetch(
        `${cfg.functionsBaseUrl}/get-availability?location=${encodeURIComponent(locationSlug)}&instructor=${encodeURIComponent(instructorSlug)}`,
        {
          headers: {
            "Authorization":
              `Bearer ${cfg.supabaseAnonKey}`
          }
        }
      );


    const result =
      await response.json();


    if (
      !response.ok ||
      result.error
    ) {
      throw new Error(
        result.error ||
        "Unable to load services."
      );
    }


    state.scheduleAvailability =
      result;

    renderScheduleServices(
      result.services || []
    );

    renderScheduleAvailableDates(
      result.days || []
    );

  } catch (error) {

    console.error(
      "SCHEDULE SERVICES LOAD ERROR:",
      error
    );


    if (container) {
      container.innerHTML = `
        <div class="muted">
          Unable to load services.
        </div>
      `;
    }

  }

}


function renderScheduleAvailableDates(days = []) {

  const dateSelect =
    $("scheduleAvailableDate");

  const timesContainer =
    $("scheduleAvailableTimes");

  const selection =
    $("scheduleAvailableTimeSelection");


  if (!dateSelect) {
    return;
  }


  const availableDays =
    days.filter(day =>
      day.has_available === true
    );


  if (!availableDays.length) {

    dateSelect.innerHTML = `
      <option value="">
        No available dates
      </option>
    `;

    dateSelect.disabled =
      true;


    if (timesContainer) {
      timesContainer.innerHTML = `
        <div class="muted">
          No appointment times are currently available.
        </div>
      `;
    }


    if (selection) {
      selection.textContent =
        "";
    }


    return;
  }


  dateSelect.disabled =
    false;


  dateSelect.innerHTML = `
    <option value="">
      Select a date
    </option>

    ${availableDays
      .map(day => `
        <option
          value="${escapeAttr(day.date)}"
        >
          ${escapeHtml(
            day.label ||
            day.date
          )}
        </option>
      `)
      .join("")}
  `;


  if (timesContainer) {
    timesContainer.innerHTML = `
      <div class="muted">
        Select a date to view available times.
      </div>
    `;
  }


  if (selection) {
    selection.textContent =
      "";
  }

}


async function checkScheduleCustomTimeConflict() {

  const status =
    $("scheduleCustomConflictStatus");

  const selection =
    $("scheduleCustomTimeSelection");


  if (
    !status ||
    !selection
  ) {
    return;
  }


  const date =
    selection.dataset.date;

  const startTime =
    selection.dataset.startTime;

  const endTime =
    selection.dataset.endTime;


  if (
    !date ||
    !startTime ||
    !endTime
  ) {
    status.classList.add(
      "hidden"
    );

    status.innerHTML = "";

    return;
  }


  const instructorId =
    state.instructor?.id;


  const instructorTimeZone =
    state.instructor?.timezone;


  if (
    !instructorId ||
    !instructorTimeZone
  ) {
    status.classList.remove(
      "hidden"
    );

    status.innerHTML = `
      <strong>
        Unable to check conflicts.
      </strong>

      <div class="muted" style="margin-top:4px;">
        The selected instructor or time zone is unavailable.
      </div>
    `;

    return;
  }


  /*
   * Convert the instructor's manually
   * entered local date/time into real
   * UTC timestamps for the backend.
   */
  function localDateTimeToIso(
    localDate,
    localTime,
    timeZone
  ) {

    const [
      year,
      month,
      day
    ] =
      localDate
        .split("-")
        .map(Number);


    const [
      hour,
      minute
    ] =
      localTime
        .split(":")
        .map(Number);


    /*
     * Start with the requested wall-clock
     * values represented as UTC.
     */
    let guess =
      Date.UTC(
        year,
        month - 1,
        day,
        hour,
        minute,
        0
      );


    /*
     * Determine how that instant appears
     * in the instructor's timezone, then
     * correct the guess. Two passes handle
     * normal timezone/DST offsets.
     */
    for (
      let pass = 0;
      pass < 2;
      pass++
    ) {

      const parts =
        new Intl.DateTimeFormat(
          "en-US",
          {
            timeZone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hourCycle: "h23"
          }
        )
          .formatToParts(
            new Date(guess)
          );


      const values = {};

      parts.forEach(part => {
        if (
          part.type !== "literal"
        ) {
          values[part.type] =
            Number(part.value);
        }
      });


      const represented =
        Date.UTC(
          values.year,
          values.month - 1,
          values.day,
          values.hour,
          values.minute,
          0
        );


      const desired =
        Date.UTC(
          year,
          month - 1,
          day,
          hour,
          minute,
          0
        );


      guess +=
        desired -
        represented;

    }


    return new Date(
      guess
    ).toISOString();

  }


  let startIso;
  let endIso;


  try {

    startIso =
      localDateTimeToIso(
        date,
        startTime,
        instructorTimeZone
      );


    /*
     * Calculate the end from the real
     * instant so appointments crossing
     * midnight remain correct.
     */
    const appointmentLength =
      Number(
        state.instructor
          ?.appointment_length_minutes
      ) || 45;


    endIso =
      new Date(
        new Date(
          startIso
        ).getTime() +
        (
          appointmentLength *
          60 *
          1000
        )
      ).toISOString();


  } catch (error) {

    console.error(
      "CUSTOM TIME CONVERSION ERROR:",
      error
    );


    status.classList.remove(
      "hidden"
    );

    status.innerHTML = `
      <strong>
        Unable to check conflicts.
      </strong>

      <div class="muted" style="margin-top:4px;">
        The custom appointment time could not be processed.
      </div>
    `;

    return;
  }


  /*
   * Preserve the authoritative UTC
   * timestamps for eventual booking.
   */
  selection.dataset.startIso =
    startIso;

  selection.dataset.endIso =
    endIso;


  status.classList.remove(
    "hidden"
  );

  status.innerHTML = `
    <strong>
      Checking for conflicts...
    </strong>
  `;


  try {

    const authHeaders =
      await getAuthHeaders();


    const response =
      await fetch(
        `${cfg.functionsBaseUrl}/check-manual-booking-conflict`,
        {
          method: "POST",

          headers:
            authHeaders,

          body:
            JSON.stringify({
              instructor_id:
                instructorId,

              start_time:
                startIso,

              end_time:
                endIso
            })
        }
      );


    const result =
      await response.json();


    if (!response.ok) {
      throw new Error(
        result?.error ||
        "Unable to check appointment conflicts."
      );
    }


    /*
     * Protect against the user changing
     * the date/time while this request
     * was still running.
     */
    if (
      selection.dataset.startIso !==
        startIso ||
      selection.dataset.endIso !==
        endIso
    ) {
      return;
    }


    if (!result.conflict) {

      status.dataset.conflict =
        "false";

      status.dataset.override =
        "false";

      status.innerHTML = `
        <strong>
          No conflicts found.
        </strong>

        <div class="muted" style="margin-top:4px;">
          This custom appointment time is clear.
        </div>
      `;

      return;
    }


    const conflictMessages =
      [];


    if (
      result.booking_conflict
    ) {
      conflictMessages.push(
        "an existing Safe Insight appointment"
      );
    }


    if (
      result.google_conflict
    ) {
      conflictMessages.push(
        "a blocking Google Calendar event"
      );
    }


    status.dataset.conflict =
      "true";

    status.dataset.override =
      "false";


    status.innerHTML = `
      <strong>
        Scheduling conflict found.
      </strong>

      <div
        class="muted"
        style="margin-top:4px;"
      >
        This time overlaps
        ${escapeHtml(
          conflictMessages.join(
            " and "
          )
        )}.
      </div>

      <div
        style="margin-top:14px;"
      >
        <button
          type="button"
          class="secondary"
          id="scheduleOverrideConflictBtn"
        >
          Override Conflict
        </button>
      </div>
    `;


  } catch (error) {

    console.error(
      "CUSTOM TIME CONFLICT CHECK ERROR:",
      error
    );


    status.innerHTML = `
      <strong>
        Unable to check conflicts.
      </strong>

      <div class="muted" style="margin-top:4px;">
        ${escapeHtml(
          error instanceof Error
            ? error.message
            : String(error)
        )}
      </div>
    `;

  }

}


function updateScheduleCustomTimeSelection() {

  const dateInput =
    $("scheduleCustomDate");

  const timeInput =
    $("scheduleCustomStartTime");

  const selection =
    $("scheduleCustomTimeSelection");


  if (
    !dateInput ||
    !timeInput ||
    !selection
  ) {
    return;
  }


  const date =
    dateInput.value;

  const time =
    timeInput.value;


  selection.textContent =
    "";

  delete selection.dataset.date;
  delete selection.dataset.startTime;
  delete selection.dataset.endTime;


  if (
    !date ||
    !time
  ) {
    return;
  }


  const appointmentLength =
    Number(
      state.instructor
        ?.appointment_length_minutes
    ) || 45;


  const [
    hour,
    minute
  ] =
    time
      .split(":")
      .map(Number);


  const startMinutes =
    (hour * 60) +
    minute;

  const endMinutes =
    startMinutes +
    appointmentLength;


  const endHour =
    Math.floor(
      endMinutes / 60
    ) % 24;

  const endMinute =
    endMinutes % 60;


  const endTime =
    `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`;


  const startLabel =
    new Intl.DateTimeFormat(
      "en-US",
      {
        hour:
          "numeric",

        minute:
          "2-digit",

        hour12:
          true,

        timeZone:
          "UTC"
      }
    ).format(
      new Date(
        `2000-01-01T${time}:00Z`
      )
    );


  const endLabel =
    new Intl.DateTimeFormat(
      "en-US",
      {
        hour:
          "numeric",

        minute:
          "2-digit",

        hour12:
          true,

        timeZone:
          "UTC"
      }
    ).format(
      new Date(
        `2000-01-01T${endTime}:00Z`
      )
    );


  const [
    year,
    month,
    day
  ] =
    date
      .split("-")
      .map(Number);


  const dateLabel =
    new Intl.DateTimeFormat(
      "en-US",
      {
        month:
          "short",

        day:
          "numeric",

        year:
          "numeric",

        timeZone:
          "UTC"
      }
    ).format(
      new Date(
        Date.UTC(
          year,
          month - 1,
          day
        )
      )
    );


  selection.dataset.date =
    date;

  selection.dataset.startTime =
    time;

  selection.dataset.endTime =
    endTime;


  selection.textContent =
    `Selected: ${dateLabel} • ${startLabel} – ${endLabel}`;


  checkScheduleCustomTimeConflict();

}


function renderScheduleAvailableTimes(date) {

  const container =
    $("scheduleAvailableTimes");
  const selection =
    $("scheduleAvailableTimeSelection");


  if (!container) {
    return;
  }


  if (selection) {
    selection.textContent =
      "";
  }


  if (!date) {

    container.innerHTML = `
      <div class="muted">
        Select a date to view available times.
      </div>
    `;

    return;
  }


  const day =
    state.scheduleAvailability?.days?.find(
      item =>
        item.date === date
    );


  if (!day) {

    container.innerHTML = `
      <div class="muted">
        No availability was found for this date.
      </div>
    `;

    return;
  }


  const availableSlots =
    (day.slots || []).filter(
      slot =>
        slot.blocked !== true &&
        Number(slot.remaining || 0) > 0
    );


  if (!availableSlots.length) {

    container.innerHTML = `
      <div class="muted">
        No appointment times are currently available
        for this date.
      </div>
    `;

    return;
  }


  container.innerHTML =
    availableSlots
      .map(slot => {

        const startTime =
          slot.start_time ||
          slot.start ||
          "";

        const endTime =
          slot.end_time ||
          slot.end ||
          "";

        const instructorTimeZone =
          state.instructor?.timezone ||
          "UTC";


        let label =
          startTime;


        if (startTime) {

          try {

            label =
              new Intl.DateTimeFormat(
                "en-US",
                {
                  timeZone:
                    instructorTimeZone,

                  hour:
                    "numeric",

                  minute:
                    "2-digit",

                  hour12:
                    true
                }
              ).format(
                new Date(startTime)
              );

          } catch (error) {

            console.error(
              "SCHEDULE TIME FORMAT ERROR:",
              error
            );

          }

        }


        return `
          <button
            type="button"
            class="secondary schedule-available-time"
            data-start-time="${escapeAttr(startTime)}"
            data-end-time="${escapeAttr(endTime)}"
            data-time-label="${escapeAttr(label)}"
          >
            ${escapeHtml(label)}
          </button>
        `;

      })
      .join("");

}


function renderScheduleServices(services = []) {

  const container =
    $("scheduleServicesList");


  if (!container) {
    return;
  }


  if (!state.instructor?.id) {

    container.innerHTML = `
      <div class="muted">
        Select an instructor to view available services.
      </div>
    `;

    return;
  }


  if (!services.length) {

    container.innerHTML = `
      <div class="muted">
        No services are available for this instructor.
      </div>
    `;

    return;
  }


  container.innerHTML =
    services
      .map(service => {

        const serviceId =
          service.id ||
          service.product_id ||
          "";

        const serviceName =
          service.product_name ||
          service.name ||
          "Service";

        const description =
          service.product_description ||
          service.description ||
          "";

        const isFree =
          service.service_type === "free" ||
          Number(service.price_cents || 0) === 0;

        const priceText =
          isFree
            ? "Free"
            : `$${(
                Number(service.price_cents || 0) / 100
              ).toFixed(2)}`;


        return `
          <div
            style="
              padding:15px;
              border:1px solid #ddd;
              border-radius:8px;
              margin-bottom:10px;
            "
          >

            <label
              style="
                display:grid;
                grid-template-columns:auto minmax(0, 1fr);
                gap:12px;
                align-items:start;
                margin:0;
                width:100%;
                cursor:pointer;
              "
            >

              <input
                type="radio"
                name="scheduleService"
                class="schedule-service"
                value="${escapeAttr(serviceId)}"
                data-service-type="${escapeAttr(
                  service.service_type || "paid"
                )}"
                style="
                  width:auto;
                  min-width:0;
                  margin:4px 0 0 0;
                "
              >

              <span
                style="
                  display:block;
                  min-width:0;
                  width:auto;
                "
              >

                <strong
                  style="
                    display:block;
                    overflow-wrap:anywhere;
                  "
                >
                  ${escapeHtml(serviceName)}
                </strong>

                <div style="margin-top:5px;">
                  ${escapeHtml(priceText)}
                </div>

                ${
                  description
                    ? `
                      <div
                        class="muted"
                        style="
                          margin-top:5px;
                          overflow-wrap:anywhere;
                        "
                      >
                        ${escapeHtml(description)}
                      </div>
                    `
                    : ""
                }

              </span>

            </label>

          </div>
        `;

      })
      .join("");

}


function renderServices() {

  const container =
    $("servicesList");

  const requiredSection =
    $("requiredServicesSection");

  const requiredContainer =
    $("requiredServicesList");

  const allowCustomerServiceSelection =
    $("allowCustomerServiceSelection");


  if (allowCustomerServiceSelection) {

    allowCustomerServiceSelection.checked =
      state.instructor
        ?.allow_customer_service_selection === true;

  }


  /*
   * Build one service card.
   *
   * The same card markup is used whether the service
   * appears in Required Services or the normal list.
   */
  function renderServiceCard(service) {

    const price =
      (
        service.price_cents / 100
      ).toFixed(2);

    const currency =
      String(
        service.currency || "usd"
      ).toUpperCase();

    const maxQuantity =
      Number.isInteger(
        Number(service.max_quantity)
      ) &&
      Number(service.max_quantity) >= 1
        ? Number(service.max_quantity)
        : 1;


    /*
     * Local free services do not have Stripe
     * Product or Price IDs.
     */
    if (
      service.service_type === "free"
    ) {

      return `
        <div
          style="
            padding:15px;
            border:1px solid #ddd;
            border-radius:8px;
            margin-bottom:10px;
          "
        >

          <div
            style="
              display:flex;
              align-items:flex-start;
              gap:12px;
            "
          >

            <span
              style="
                display:block;
                min-width:0;
                width:100%;
              "
            >

              <strong>
                ${escapeHtml(service.product_name)}
              </strong>

              <div style="margin-top:5px;">
                Free
              </div>

              ${
                service.product_description
                  ? `
                    <div
                      class="muted"
                      style="margin-top:5px;"
                    >
                      ${escapeHtml(service.product_description)}
                    </div>
                  `
                  : ""
              }

              <div
                class="muted"
                style="margin-top:10px;"
              >
                Local service — no Stripe product required
              </div>

              <label
                style="
                  display:flex;
                  align-items:center;
                  gap:8px;
                  margin-top:10px;
                  cursor:pointer;
                "
              >

                <input
                  type="checkbox"
                  data-free-service-required
                  data-service-id="${escapeAttr(service.id)}"
                  ${service.required ? "checked" : ""}
                >

                <span>
                  Required for booking
                </span>

              </label>


              <div
                style="
                  margin-top:15px;
                  max-width:240px;
                "
              >

                <label
                  style="
                    display:block;
                    margin-bottom:5px;
                  "
                >
                  Maximum Quantity per Booking
                </label>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value="${maxQuantity}"
                  data-free-service-max-quantity
                  data-service-id="${escapeAttr(service.id)}"
                  style="
                    width:100%;
                    max-width:120px;
                  "
                >

                <div
                  class="muted"
                  style="
                    margin-top:5px;
                    font-size:0.9em;
                  "
                >
                  Maximum number a customer may purchase in one booking.
                </div>

              </div>


              <button
                type="button"
                class="secondary"
                data-deactivate-free-service
                data-service-id="${escapeAttr(service.id)}"
                style="margin-top:12px;"
              >
                Remove Free Service
              </button>

            </span>

          </div>

        </div>
      `;
    }


    /*
     * Paid services continue using the existing
     * Stripe assignment controls.
     */
    return `
      <div
        style="
          padding:15px;
          border:1px solid #ddd;
          border-radius:8px;
          margin-bottom:10px;
        "
      >

        <label
          style="
            display:flex;
            align-items:flex-start;
            gap:12px;
            cursor:pointer;
          "
        >

          <input
            type="checkbox"
            data-stripe-service
            data-product-id="${escapeAttr(service.product_id)}"
            data-price-id="${escapeAttr(service.price_id)}"
            ${service.assigned ? "checked" : ""}
            style="
              margin-top:4px;
              flex:0 0 auto;
            "
          >

          <span
            style="
              display:block;
              min-width:0;
              width:100%;
            "
          >

            <strong>
              ${escapeHtml(service.product_name)}
            </strong>

            <div style="margin-top:5px;">
              $${price} ${escapeHtml(currency)}
            </div>

            ${
              service.product_description
                ? `
                  <div
                    class="muted"
                    style="margin-top:5px;"
                  >
                    ${escapeHtml(service.product_description)}
                  </div>
                `
                : ""
            }

            <label
              style="
                display:flex;
                align-items:center;
                gap:8px;
                margin-top:10px;
                cursor:${service.assigned ? "pointer" : "default"};
              "
            >

              <input
                type="checkbox"
                data-stripe-service-required
                data-product-id="${escapeAttr(service.product_id)}"
                data-price-id="${escapeAttr(service.price_id)}"
                ${service.required ? "checked" : ""}
                ${service.assigned ? "" : "disabled"}
              >

              <span>
                Required for booking
              </span>

            </label>


            <div
              style="
                margin-top:15px;
                max-width:240px;
              "
            >

              <label
                style="
                  display:block;
                  margin-bottom:5px;
                "
              >
                Maximum Quantity per Booking
              </label>

              <input
                type="number"
                min="1"
                step="1"
                value="${maxQuantity}"
                data-stripe-service-max-quantity
                data-product-id="${escapeAttr(service.product_id)}"
                data-price-id="${escapeAttr(service.price_id)}"
                ${service.assigned ? "" : "disabled"}
                style="
                  width:100%;
                  max-width:120px;
                "
              >

              <div
                class="muted"
                style="
                  margin-top:5px;
                  font-size:0.9em;
                "
              >
                ${
                  service.assigned
                    ? "Maximum number a customer may purchase in one booking."
                    : "Assign this service before setting its maximum quantity."
                }
              </div>

            </div>

          </span>

        </label>

      </div>
    `;

  }


  /*
   * No instructor selected.
   */
  if (!state.instructor?.id) {

    if (requiredSection) {
      requiredSection.classList.add(
        "hidden"
      );
    }

    if (requiredContainer) {
      requiredContainer.innerHTML = "";
    }

    if (container) {
      container.innerHTML = `
        <p class="muted">
          Select an instructor to manage services.
        </p>
      `;
    }

    return;
  }


  /*
   * Separate services that are required for this
   * instructor from all remaining services.
   */
  const requiredServices =
    state.services.filter(
      service =>
        service.required === true
    );

  const otherServices =
    state.services.filter(
      service =>
        service.required !== true
    );


  /*
   * Required services appear above Create Service.
   * Hide the entire section when none are required.
   */
  if (
    requiredSection &&
    requiredContainer
  ) {

    if (requiredServices.length) {

      requiredSection.classList.remove(
        "hidden"
      );

      requiredContainer.innerHTML =
        requiredServices
          .map(renderServiceCard)
          .join("");

    } else {

      requiredSection.classList.add(
        "hidden"
      );

      requiredContainer.innerHTML =
        "";

    }

  }


  if (!container) {
    return;
  }


  /*
   * Preserve the existing empty-state behavior.
   */
  if (!state.services.length) {

    container.innerHTML = `
      <p class="muted">
        No active services were found.
      </p>
    `;

    return;
  }


  /*
   * Everything that is not required remains in the
   * normal Services list below Create Service and
   * Allow User to Select.
   */
  if (!otherServices.length) {

    container.innerHTML = `
      <p class="muted">
        All assigned services are currently required for booking.
      </p>
    `;

    return;
  }


  container.innerHTML =
    otherServices
      .map(renderServiceCard)
      .join("");

}


function setupServiceTypeSelector() {

  const typeSelect =
    document.getElementById(
      "newServiceType"
    );

  const paidHelp =
    document.getElementById(
      "paidServiceHelp"
    );

  const freeFields =
    document.getElementById(
      "freeServiceFields"
    );


  if (
    !typeSelect ||
    !paidHelp ||
    !freeFields
  ) {
    return;
  }


  function updateServiceTypeDisplay() {

    const isFree =
      typeSelect.value === "free";


    paidHelp.classList.toggle(
      "hidden",
      isFree
    );

    freeFields.classList.toggle(
      "hidden",
      !isFree
    );
  }


  typeSelect.addEventListener(
    "change",
    updateServiceTypeDisplay
  );


  updateServiceTypeDisplay();
}


document.addEventListener(
  "click",
  async event => {

    /*
     * Remove/deactivate a locally-created
     * free service.
     */
    const deactivateButton =
      event.target.closest(
        "[data-deactivate-free-service]"
      );

    if (deactivateButton) {

      if (!state.instructor?.id) {
        showCustomAlert(
          "Please select an instructor first."
        );
        return;
      }


      const serviceId =
        deactivateButton.getAttribute(
          "data-service-id"
        );


      if (!serviceId) {
        return;
      }


      const confirmed =
        await showCustomConfirm(
          "Remove this free service?"
        );


      if (!confirmed) {
        return;
      }


      const originalText =
        deactivateButton.textContent;

      deactivateButton.disabled = true;
      deactivateButton.textContent =
        "Removing...";


      try {

        const authHeaders =
          await getAuthHeaders();


        const response =
          await fetch(
            `${cfg.functionsBaseUrl}/stripe-products`,
            {
              method: "POST",
              headers: authHeaders,
              body: JSON.stringify({
                action:
                  "deactivate_free_service",

                instructor_id:
                  state.instructor.id,

                service_id:
                  serviceId
              })
            }
          );


        const result =
          await response.json();


        if (
          !response.ok ||
          result.error
        ) {
          throw new Error(
            result.error ||
            "Unable to remove free service."
          );
        }


        await loadServices();


        showCustomAlert(
          "Free service removed successfully."
        );


      } catch (error) {

        console.error(
          "REMOVE FREE SERVICE ERROR:",
          error
        );


        showCustomAlert(
          error.message ||
          "Unable to remove free service."
        );


      } finally {

        deactivateButton.disabled =
          false;

        deactivateButton.textContent =
          originalText;
      }


      return;
    }


    const button =
      event.target.closest(
        "#createFreeServiceBtn"
      );

    if (!button) {
      return;
    }


    if (!state.instructor?.id) {
      showCustomAlert(
        "Please select an instructor first."
      );
      return;
    }


    const nameInput =
      document.getElementById(
        "newFreeServiceName"
      );

    const descriptionInput =
      document.getElementById(
        "newFreeServiceDescription"
      );

    const requiredInput =
      document.getElementById(
        "newFreeServiceRequired"
      );


    const name =
      nameInput?.value.trim() || "";

    const description =
      descriptionInput?.value.trim() || "";

    const required =
      requiredInput?.checked === true;


    if (!name) {
      showCustomAlert(
        "Please enter a service name."
      );
      return;
    }


    const originalText =
      button.textContent;

    button.disabled = true;
    button.textContent =
      "Creating...";


    try {

      const authHeaders =
        await getAuthHeaders();


      const response =
        await fetch(
          `${cfg.functionsBaseUrl}/stripe-products`,
          {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
              action:
                "create_free_service",

              instructor_id:
                state.instructor.id,

              name,

              description,

              required
            })
          }
        );


      const result =
        await response.json();


      if (
        !response.ok ||
        result.error
      ) {
        throw new Error(
          result.error ||
          "Unable to create free service."
        );
      }


      /*
       * Clear the form after successful creation.
       */
      if (nameInput) {
        nameInput.value = "";
      }

      if (descriptionInput) {
        descriptionInput.value = "";
      }

      if (requiredInput) {
        requiredInput.checked = false;
      }


      /*
       * Reload the service list so the new local
       * service appears immediately.
       */
      await loadServices();


      showCustomAlert(
        "Free service created successfully."
      );


    } catch (error) {

      console.error(
        "CREATE FREE SERVICE ERROR:",
        error
      );

      showCustomAlert(
        error.message ||
        "Unable to create free service."
      );


    } finally {

      button.disabled = false;
      button.textContent =
        originalText;
    }
  }
);


async function loadServices() {

  /*
   * Services are managed only by Administrators and Managers.
   * Do not call the protected Services endpoint for roles that
   * are not authorized to manage services.
   */
  if (!canManageServices()) {
    state.services = [];
    return;
  }

  if (!state.instructor?.id) {
    state.services = [];
    renderServices();
    return;
  }

  try {

    const authHeaders =
      await getAuthHeaders();

    const response =
      await fetch(
        `${cfg.functionsBaseUrl}/stripe-products?instructor_id=${encodeURIComponent(state.instructor.id)}`,
        {
          method: "GET",
          headers: authHeaders
        }
      );

    const result =
      await response.json();

    if (
      !response.ok ||
      result.error
    ) {
      throw new Error(
        result.error ||
        "Unable to load Stripe products."
      );
    }

    state.services =
      result.products || [];

    renderServices();

  } catch (error) {

    console.error(
      "STRIPE PRODUCTS LOAD ERROR:",
      error
    );

    state.services = [];

    renderServices();

    showCustomAlert(
      error.message ||
      "Unable to load Stripe products."
    );
  }
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
      instructor_confirmation_email,
      instructor_confirmation_subject,
      instructor_confirmation_message,
      confirmation_button_enabled,
      confirmation_button_text,
      confirmation_button_url,

      reschedule_email_subject,
      reschedule_email_message,
      reschedule_button_enabled,
      reschedule_button_text,
      reschedule_button_url,
      instructor_reschedule_email,
      instructor_reschedule_subject,
      instructor_reschedule_message,

      cancel_email_subject,
      cancel_email_message,
      missed_email_subject,
      missed_email_message,

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

  /*
   * Instructor records and the privileged Settings Users
   * collection are independent data sources.
   *
   * Start both requests together so User Management data
   * does not have to wait for the instructor query, and
   * the instructor query does not have to wait for User
   * Management.
   */

  const instructorLoadPromise =
    db
      .from("instructors")
      .select(`
        id,
        location_id,
        user_id,
        name,
        email,
        slug,
        location_name,
        address,
        website,
        services,
        timezone,
        appointment_length_minutes,
        max_students_per_slot,
        booking_horizon_days,
        minimum_booking_notice_hours,
        cancellation_hours,
        reschedule_hours,
        allow_customer_service_selection,

        confirmation_email_subject,
        confirmation_email_message,
        student_confirmation_enabled,
        confirmation_button_enabled,
        confirmation_button_text,
        confirmation_button_url,
        instructor_confirmation_email,
        instructor_confirmation_subject,
        instructor_confirmation_message,

        reschedule_email_subject,
        reschedule_email_message,
        reschedule_button_enabled,
        reschedule_button_text,
        reschedule_button_url,
        instructor_reschedule_email,
        instructor_reschedule_subject,
        instructor_reschedule_message,

        reminder_enabled,
        reminder_hours_before,
        instructor_email,
        student_reminder_subject,
        student_reminder_message,
        instructor_reminder_subject,
        instructor_reminder_message,

        cancel_email_subject,
        cancel_email_message,

        instructor_cancel_email,
        instructor_cancel_subject,
        instructor_cancel_message,

        missed_email_subject,
        missed_email_message,

        followup_enabled,
        followup_delay_minutes,
        followup_subject,
        followup_message
      `)
      .order("name");


  const settingsUsersLoadPromise =
    canManageUsers()
      ? (async () => {

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

          if (
            !response.ok ||
            result.error
          ) {
            throw new Error(
              result.error ||
              "Unable to load settings users."
            );
          }

          return result.users || [];

        })()
      : Promise.resolve([]);


  const [
    instructorResult,
    settingsUsers
  ] =
    await Promise.all([
      instructorLoadPromise,
      settingsUsersLoadPromise
    ]);


  const {
    data,
    error
  } =
    instructorResult;


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


  state.settingsUsers =
    settingsUsers;


  /*
   * User Management was loaded in parallel with the
   * instructor query above.
   *
   * Do not request manage-settings-users a second time.
   * state.settingsUsers already contains the result from
   * settingsUsersLoadPromise.
   */


  /*
   * Enrich actual instructor records with their
   * Booking Settings account information when one
   * exists.
   *
   * This does NOT add Settings-only users to the
   * instructor collection.
   */
  state.instructors =
    state.instructors.map(instructor => {

      const instructorEmail =
        instructor.email
          ?.trim()
          .toLowerCase();

      const settingsUser =
        state.settingsUsers.find(
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


  const loggedInInstructor =
    state.user?.id
      ? state.instructors.find(
          instructor =>
            instructor.user_id === state.user.id
        )
      : null;

  if (loggedInInstructor) {

    state.instructor =
      loggedInInstructor;

  } else if (
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


  updateBookingUrlDisplay();

  updateSelectedInstructorBanner();


  if (state.instructor) {

    const calendarSelectedName =
      $("calendarSelectedName");

    if (calendarSelectedName) {

      calendarSelectedName.textContent =
        state.instructor.name;

    }


    /*
     * Begin loading Student Booking Fields for the
     * initially selected instructor.
     *
     * Do not await this request. It should never
     * delay the rest of the Settings initialization.
     */
    loadStudentBookingFields(
      state.instructor.id
    );

  } else {

    clearStudentBookingFields();

  }


  renderInstructorList();


  /*
   * Other User Email settings are an
   * Administrator / Manager feature.
   *
   * Instructor and Basic users must not call the
   * protected load_other_user_email_settings action.
   *
   * This request is intentionally NOT awaited here.
   * Other User Email settings are independent of the
   * rest of Booking Settings initialization and must
   * never delay the page becoming available.
   */
  if (canEditEmails()) {

    renderOtherUserEmailRecipients();

    /*
     * Start loading the settings in the background.
     *
     * loadOtherUserEmailSettings() already protects
     * against stale instructor responses, so it is
     * safe to allow this request to finish independently.
     */
    loadOtherUserEmailSettings()
      .then(() => {

        /*
         * The request may complete after the rest of
         * initialization. Render only after its data
         * has actually arrived.
         */
        renderActiveOtherUserEmailSettings();

      })
      .catch(error => {

        console.error(
          "OTHER USER EMAIL SETTINGS LOAD ERROR:",
          error
        );

      });

  } else {

    /*
     * Make sure no previously cached Other User Email
     * state survives for a role that cannot manage it.
     */
    state.otherUserEmail.settings = {};

  }


  const globalSelector =
    $("globalInstructorSelector");

  const globalSelect =
    $("globalInstructorSelect");

  if (
    globalSelector &&
    globalSelect
  ) {

    if (
      isAdministrator() ||
      isManager()
    ) {

      globalSelector.classList.remove(
        "hidden"
      );

      globalSelect.innerHTML =
        state.instructors
          .map(instructor => `
            <option value="${escapeAttr(instructor.id)}">
              ${escapeHtml(instructor.name)}
            </option>
          `)
          .join("");

      globalSelect.value =
        state.instructor?.id || "";

    } else {

      globalSelector.classList.add(
        "hidden"
      );

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


$("otherUserEmailEnabled")?.addEventListener(
  "change",
  () => {

    updateOtherUserEmailVisibility();

    captureActiveOtherUserEmailSettings();

  }
);


$("otherUserEmailSubject")?.addEventListener(
  "input",
  () => {

    captureActiveOtherUserEmailSettings();

  }
);


$("otherUserEmailMessage")?.addEventListener(
  "input",
  () => {

    captureActiveOtherUserEmailSettings();

  }
);


$("otherUserEmailRecipients")?.addEventListener(
  "change",
  event => {

    if (
      !event.target.matches(
        ".other-user-email-recipient"
      )
    ) {
      return;
    }


    captureActiveOtherUserEmailSettings();

  }
);


document
  .querySelectorAll("[data-email-tab]")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const target =
          button.getAttribute(
            "data-email-tab"
          );


        const eventTypes = {
          confirmationEmailTab:
            "confirmation",

          rescheduleEmailTab:
            "reschedule",

          reminderEmailTab:
            "reminder",

          cancelEmailTab:
            "cancel",

          missedEmailTab:
            "missed",

          followupEmailTab:
            "followup"
        };


        const eventType =
          eventTypes[target];


        if (!eventType) {
          return;
        }


        /*
         * Preserve any unsaved Other User Email
         * changes from the tab we are leaving
         * before displaying another Email event.
         */
        captureActiveOtherUserEmailSettings();


        state.otherUserEmail.activeEvent =
          eventType;


        /*
         * Display the saved or locally edited
         * configuration for the newly selected
         * Email event.
         */
        renderActiveOtherUserEmailSettings();

      }
    );

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
            upsert: false,
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

    if (!state.instructor?.id) {
      throw new Error(
        "No instructor is currently selected."
      );
    }

    const payload = {
      location_id:
        state.location.id,

      instructor_id:
        state.instructor.id,

      location_name:
        $("locationName").value.trim(),

      address:
        $("address").value.trim(),

      website:
        $("website").value.trim(),

      services:
        $("services").value.trim(),

      timezone:
        $("instructorTimezone").value ||
        "America/Phoenix"
    };

    const response = await fetch(
      `${cfg.functionsBaseUrl}/save-location-settings`,
      {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(payload)
      }
    );

    const result =
      await response.json();

    if (!response.ok || result.error) {
      throw new Error(
        typeof result.error === "string"
          ? result.error
          : JSON.stringify(
              result.error || result
            )
      );
    }

    state.instructor = {
      ...state.instructor,
      ...(result.instructor || {}),
      location_name:
        payload.location_name,
      address:
        payload.address,
      website:
        payload.website,
      services:
        payload.services
    };

    /*
     * Keep the master instructor cache synchronized with
     * the instructor that was just saved.
     *
     * Instructor switching reads from state.instructors,
     * so leaving the old record there would restore stale
     * Location settings when switching away and back.
     */
    state.instructors =
      state.instructors.map(instructor =>
        instructor.id === state.instructor.id
          ? {
              ...instructor,
              ...state.instructor
            }
          : instructor
      );

    button.textContent = "Saved";

    setTimeout(() => {
      button.textContent =
        originalText;
    }, 1500);

  } catch (error) {

    console.error(
      "SAVE LOCATION SETTINGS ERROR:",
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


    const payload = {
      location_id:
        state.location.id,

      instructor_id:
        state.instructor.id,

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


    /*
     * Student Booking Fields are managed only by
     * Administrators and Managers.
     *
     * Instructors can still save the normal Booking Rules,
     * but this protected field is intentionally omitted
     * from their request.
     */

    if (canManageStudentBookingFields()) {
      payload.student_booking_fields =
        getStudentBookingFieldQuestions();
    }


    const response = await fetch(
      `${cfg.functionsBaseUrl}/save-location-settings`,
      {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(payload)
      }
    );

    const result =
      await response.json();

    if (!response.ok || result.error) {
      throw new Error(
        typeof result.error === "string"
          ? result.error
          : JSON.stringify(
              result.error || result
            )
      );
    }

    if (!result.instructor) {
      throw new Error(
        "The Booking Rules could not be saved because the selected instructor was not updated."
      );
    }


    /*
     * For Administrators and Managers, synchronize the
     * visible Student Booking Fields with the authoritative
     * rows returned by the backend.
     *
     * Instructors do not submit or receive this protected
     * setting through the Booking Rules save.
     */

    if (canManageStudentBookingFields()) {

      clearStudentBookingFields();


      const savedStudentBookingFields =
        Array.isArray(
          result.student_booking_fields
        )
          ? result.student_booking_fields
          : [];


      savedStudentBookingFields.forEach(
        field => {

          addStudentBookingField(
            String(
              field?.question || ""
            )
          );

        }
      );


      updateStudentBookingFieldsControls();

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

    renderInstructorList();

    // Update the Availability summary immediately
    $("appointmentLength").textContent =
      `${updatedBookingRules.appointment_length_minutes} minutes`;

    $("maxStudents").textContent =
      `${updatedBookingRules.max_students_per_slot} students`;

    $("bookingHorizon").textContent =
      `${updatedBookingRules.booking_horizon_days} days`;

    $("minimumNotice").textContent =
      `${updatedBookingRules.minimum_booking_notice_hours} hours`;

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




async function saveEmailSettings(button) {

  button.disabled = true;
  const originalText = button.textContent;
  button.textContent = "Saving...";

  try {

    if (!state.instructor?.id) {
      throw new Error(
        "Please select an instructor before saving Email settings."
      );
    }


    /*
     * Capture the currently displayed Other User Email
     * configuration before saving.
     *
     * The other Email events are already kept current in
     * state.otherUserEmail.settings as the user edits and
     * switches between Email tabs.
     */
    captureActiveOtherUserEmailSettings();


    /*
     * Send all six Other User Email configurations together.
     *
     * Events that have never been configured are still sent
     * as explicit disabled records. This gives every instructor
     * a complete, predictable six-event configuration after
     * the first Email Settings save.
     */
    const otherUserEventTypes = [
      "confirmation",
      "reschedule",
      "reminder",
      "cancel",
      "missed",
      "followup"
    ];


    const allOtherUserSettings =
      otherUserEventTypes.map(eventType => {

        const settings =
          state.otherUserEmail.settings[
            eventType
          ] || {};


        return {
          event_type:
            eventType,

          enabled:
            settings.enabled === true,

          recipient_user_ids:
            Array.isArray(
              settings.recipient_user_ids
            )
              ? settings.recipient_user_ids
              : [],

          subject:
            settings.subject || "",

          message:
            settings.message || ""
        };

      });


    const payload = {
      location_id:
        state.location.id,

      instructor_id:
        state.instructor.id,

      other_user_email_settings:
        allOtherUserSettings,

    confirmation_email_subject:
      $("emailSubject").value.trim(),

    confirmation_email_message:
      $("emailMessage").value.trim(),

    instructor_confirmation_email:
      $("instructorConfirmationEmail").value.trim(),

    instructor_confirmation_subject:
      $("instructorConfirmationSubject").value.trim(),

    instructor_confirmation_message:
      $("instructorConfirmationMessage").value.trim(),

      confirmation_button_enabled:
        $("confirmationButtonEnabled").checked,

      confirmation_button_text:
        $("confirmationButtonText").value.trim(),

confirmation_button_url:
  $("confirmationButtonUrl").value.trim(),

reschedule_email_subject:
  $("rescheduleEmailSubject").value.trim(),

reschedule_email_message:
  $("rescheduleEmailMessage").value.trim(),

reschedule_button_enabled:
  $("rescheduleButtonEnabled").checked,

reschedule_button_text:
  $("rescheduleButtonText").value.trim(),

reschedule_button_url:
  $("rescheduleButtonUrl").value.trim(),

instructor_reschedule_email:
  $("instructorRescheduleEmail").value.trim(),

instructor_reschedule_subject:
  $("instructorRescheduleSubject").value.trim(),

instructor_reschedule_message:
  $("instructorRescheduleMessage").value.trim(),

    cancel_email_subject:
      $("studentCancelSubject").value.trim(),

    cancel_email_message:
      $("studentCancelMessage").value.trim(),

    instructor_cancel_email:
      $("instructorCancelEmail").value.trim(),

    instructor_cancel_subject:
      $("instructorCancelSubject").value.trim(),

    instructor_cancel_message:
      $("instructorCancelMessage").value.trim(),

    missed_email_subject:
      $("studentMissedSubject").value.trim(),

    missed_email_message:
      $("studentMissedMessage").value.trim(),

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


    if (!result.instructor) {
      throw new Error(
        "The Email settings could not be saved because the selected instructor was not updated."
      );
    }


    state.instructor = {
      ...state.instructor,
      ...result.instructor
    };


    state.instructors =
      state.instructors.map(instructor =>
        instructor.id === state.instructor.id
          ? {
              ...instructor,
              ...result.instructor
            }
          : instructor
      );


    /*
     * Keep the local Other User Email cache synchronized
     * with the authoritative record returned by the server.
     */
    if (result.other_user_email_settings) {

      const savedOtherUserSettings =
        Array.isArray(
          result.other_user_email_settings
        )
          ? result.other_user_email_settings
          : [
              result.other_user_email_settings
            ];


      savedOtherUserSettings.forEach(record => {

        if (!record?.event_type) {
          return;
        }

        state.otherUserEmail.settings[
          record.event_type
        ] = record;

      });

    }


    renderActiveOtherUserEmailSettings();


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

      if (tab === "bookingRules") {
        await saveBookingRulesSettings(button);
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


/* =========================================================
   BOOKING URL
   ========================================================= */

function getBookingUrl(instructor) {

  if (!instructor || !state.location?.slug) {
    return "";
  }

  /*
   * Normally the instructor in state.instructors already
   * contains its slug.
   *
   * For the currently selected instructor, also allow the
   * fully loaded state.instructor record to supply the slug.
   * This keeps the Users display and Calendar display using
   * the same source of truth.
   */
  const instructorSlug =
    instructor.slug ||
    (
      state.instructor?.id === instructor.id
        ? state.instructor.slug
        : ""
    );

  if (!instructorSlug) {
    return "";
  }

  return `https://apps.safeinsight.net/booking/?location=${encodeURIComponent(state.location.slug)}&instructor=${encodeURIComponent(instructorSlug)}`;
}


function updateBookingUrlDisplay() {
  const urlText = $("bookingUrlText");
  const copyButton = $("copyBookingUrlBtn");

  if (!urlText) return;

  const bookingUrl =
    getBookingUrl(state.instructor);

  if (bookingUrl) {
    urlText.textContent = bookingUrl;

    if (copyButton) {
      copyButton.classList.remove("hidden");
    }
  } else {
    urlText.textContent = "No booking URL configured.";

    if (copyButton) {
      copyButton.classList.add("hidden");
    }
  }
}


/* =========================================================
   OTHER USER EMAIL RECIPIENTS
   ========================================================= */

async function loadOtherUserEmailSettings() {

  /*
   * Capture the instructor this request belongs to.
   *
   * Instructor selection can change while this
   * asynchronous request is still running. Never
   * allow an older request to overwrite the settings
   * for a newly selected instructor.
   */
  const instructorId =
    state.instructor?.id || null;


  /*
   * Clear the previous instructor's settings while
   * the newly selected instructor is loading.
   */
  state.otherUserEmail.settings = {};


  if (!instructorId) {
    return;
  }


  try {

    const authHeaders =
      await getAuthHeaders();


    const response =
      await fetch(
        `${cfg.functionsBaseUrl}/save-location-settings`,
        {
          method: "POST",
          headers: authHeaders,

          body: JSON.stringify({
            action:
              "load_other_user_email_settings",

            instructor_id:
              instructorId
          })
        }
      );


    const result =
      await response.json();


    if (
      !response.ok ||
      result.error
    ) {
      throw new Error(
        result.error ||
        "Unable to load Other User Email settings."
      );
    }


    /*
     * The selected instructor may have changed while
     * this request was running. If so, this response
     * is stale and must not modify shared state.
     */
    if (
      state.instructor?.id !==
      instructorId
    ) {
      return;
    }


    const records =
      result.other_user_email_settings || [];


    /*
     * Build this instructor's settings separately,
     * then replace the shared cache in one operation.
     * This prevents overlapping requests from mixing
     * records from different instructors.
     */
    const loadedSettings = {};


    records.forEach(record => {

      if (!record?.event_type) {
        return;
      }


      loadedSettings[
        record.event_type
      ] = record;

    });


    state.otherUserEmail.settings =
      loadedSettings;


  } catch (error) {

    /*
     * If the instructor changed while this request
     * was running, this request is obsolete.
     */
    if (
      state.instructor?.id !==
      instructorId
    ) {
      return;
    }


    console.error(
      "OTHER USER EMAIL SETTINGS LOAD ERROR:",
      error
    );

    throw error;

  }

}


function updateOtherUserEmailVisibility() {

  const enabled =
    $("otherUserEmailEnabled");

  const options =
    $("otherUserEmailOptions");

  if (!enabled || !options) {
    return;
  }

  options.classList.toggle(
    "hidden",
    !enabled.checked
  );
}


function renderActiveOtherUserEmailSettings() {

  const eventType =
    state.otherUserEmail.activeEvent;

  const settings =
    state.otherUserEmail.settings[
      eventType
    ] || null;


  const enabled =
    $("otherUserEmailEnabled");

  const subject =
    $("otherUserEmailSubject");

  const message =
    $("otherUserEmailMessage");


  if (
    !enabled ||
    !subject ||
    !message
  ) {
    return;
  }


  enabled.checked =
    settings?.enabled === true;

  subject.value =
    settings?.subject || "";

  message.value =
    settings?.message || "";


  const selectedUserIds =
    new Set(
      Array.isArray(
        settings?.recipient_user_ids
      )
        ? settings.recipient_user_ids
        : []
    );


  document
    .querySelectorAll(
      ".other-user-email-recipient"
    )
    .forEach(checkbox => {

      checkbox.checked =
        selectedUserIds.has(
          checkbox.value
        );

    });


  updateOtherUserEmailVisibility();

}


function captureActiveOtherUserEmailSettings() {

  const eventType =
    state.otherUserEmail.activeEvent;

  if (!eventType) {
    return;
  }


  state.otherUserEmail.settings[
    eventType
  ] = {
    ...(
      state.otherUserEmail.settings[
        eventType
      ] || {}
    ),

    event_type:
      eventType,

    enabled:
      $("otherUserEmailEnabled")
        ?.checked === true,

    recipient_user_ids:
      Array.from(
        document.querySelectorAll(
          ".other-user-email-recipient:checked"
        )
      ).map(checkbox =>
        checkbox.value
      ),

    subject:
      $("otherUserEmailSubject")
        ?.value || "",

    message:
      $("otherUserEmailMessage")
        ?.value || ""
  };

}


function renderOtherUserEmailRecipients() {

  const container =
    $("otherUserEmailRecipients");

  if (!container) {
    return;
  }


  const selectedInstructorUserId =
    state.instructor?.user_id || null;

  const selectedInstructorEmail =
    state.instructor?.email
      ?.trim()
      .toLowerCase() || "";


  const availableUsers =
    state.settingsUsers.filter(user => {

      if (
        !user.user_id ||
        !user.active ||
        !user.email
      ) {
        return false;
      }


      /*
       * The selected instructor already has their own
       * Instructor email configuration. Do not offer
       * them again as an Other User recipient.
       */
      if (
        selectedInstructorUserId &&
        user.user_id === selectedInstructorUserId
      ) {
        return false;
      }


      /*
       * Email fallback protects older instructor records
       * that may not yet have user_id populated.
       */
      if (
        selectedInstructorEmail &&
        user.email
          .trim()
          .toLowerCase() ===
        selectedInstructorEmail
      ) {
        return false;
      }


      return true;

    });


  if (!availableUsers.length) {

    container.innerHTML = `
      <div class="muted">
        No other active Booking Settings users are available.
      </div>
    `;

    return;
  }


  container.innerHTML =
    availableUsers
      .map(user => {

        const instructor =
          state.instructors.find(item =>
            (
              user.user_id &&
              item.user_id === user.user_id
            ) ||
            (
              user.email &&
              item.email
                ?.trim()
                .toLowerCase() ===
              user.email
                .trim()
                .toLowerCase()
            )
          ) || null;


        const displayName =
          instructor?.name ||
          user.email;


        return `
          <label
            style="
              display:flex;
              align-items:center;
              gap:8px;
              margin:0;
              padding:2px 0;
              line-height:1.3;
            "
          >
            <input
              type="checkbox"
              class="other-user-email-recipient"
              value="${escapeAttr(user.user_id)}"
            >

            <span>
              <strong>
                ${escapeHtml(displayName)}
              </strong>

              <span class="muted">
                — ${escapeHtml(user.role || "User")}
                — ${escapeHtml(user.email)}
              </span>
            </span>
          </label>
        `;

      })
      .join("");
}



function renderInstructorList() {

  const container =
    $("usersList");

  if (!container) {
    return;
  }


  /*
   * User Management is driven by settingsUsers,
   * NOT by instructors.
   *
   * Administrators therefore appear here even
   * when they intentionally have no instructor
   * record or public booking page.
   */
  if (!state.settingsUsers.length) {

    container.innerHTML =
      `<div class="muted">
        No users assigned.
      </div>`;

    return;
  }


  container.innerHTML =
    state.settingsUsers
      .map(settingsUser => {

        /*
         * A Booking Settings user may also have
         * an instructor record.
         *
         * Match by user_id first. Email is retained
         * as a safe fallback for older records.
         */
        const userEmail =
          settingsUser.email
            ?.trim()
            .toLowerCase() || "";

        const instructor =
          state.instructors.find(item =>
            (
              settingsUser.user_id &&
              item.user_id === settingsUser.user_id
            ) ||
            (
              userEmail &&
              item.email
                ?.trim()
                .toLowerCase() === userEmail
            )
          ) || null;


        /*
         * Instructor-backed users have a stored
         * display name. Settings-only users such
         * as Administrators currently do not.
         *
         * Use the email as their visible identity
         * rather than pretending they are instructors.
         */
        const displayName =
          instructor?.name ||
          settingsUser.email ||
          "Booking Settings User";


        let status =
          "Removed";

        if (settingsUser.user_id) {

          if (
            settingsUser.active &&
            settingsUser.email_confirmed
          ) {
            status =
              "Active";

          } else if (
            settingsUser.active &&
            !settingsUser.email_confirmed
          ) {
            status =
              "Invited - Awaiting Confirmation";
          }

        }


        return `
          <div
            ${
              instructor?.id
                ? `data-select-instructor="${escapeAttr(instructor.id)}"`
                : ""
            }
            style="
              padding:24px;
              border:3px solid ${
                instructor?.id &&
                state.instructor?.id === instructor.id
                  ? "#333"
                  : "#ddd"
              };
              margin-top:15px;
              border-radius:10px;
              cursor:${
                instructor?.id
                  ? "pointer"
                  : "default"
              };
            "
          >

            <!-- USER NAME -->

            <div
              style="
                font-size:21px;
                font-weight:700;
                line-height:1.3;
              "
            >
              ${escapeHtml(displayName)}
            </div>


            <!-- USER EMAIL -->

            ${
              instructor?.name
                ? `
                  <div
                    style="
                      font-size:17px;
                      margin-top:3px;
                    "
                  >
                    ${escapeHtml(settingsUser.email || "")}
                  </div>
                `
                : ""
            }


            <!-- STATUS -->

            <div
              style="
                font-size:16px;
                margin-top:14px;
              "
            >
              <strong>Status:</strong>
              ${escapeHtml(status)}
            </div>


            <!-- ROLE -->

            <div
              style="
                margin-top:12px;
              "
            >

              <label>
                <strong>Role:</strong>

                <select
                  data-role-user="${escapeAttr(settingsUser.user_id || "")}"
                  style="
                    width:160px;
                    margin-left:8px;
                  "
                >

                  <option
                    value="Administrator"
                    ${settingsUser.role === "Administrator" ? "selected" : ""}
                  >
                    Administrator
                  </option>

                  <option
                    value="Manager"
                    ${settingsUser.role === "Manager" ? "selected" : ""}
                  >
                    Manager
                  </option>

                  <option
                    value="Instructor"
                    ${settingsUser.role === "Instructor" ? "selected" : ""}
                  >
                    Instructor
                  </option>

                  <option
                    value="Basic"
                    ${settingsUser.role === "Basic" ? "selected" : ""}
                  >
                    Basic
                  </option>

                </select>

              </label>

            </div>


            <!-- ADMINISTRATOR PASSWORD RECOVERY -->

            ${
              isAdministrator()
                ? `
                  <details
                    data-password-recovery="${escapeAttr(settingsUser.user_id || "")}"
                    ${state.openPasswordRecoveryUserId === settingsUser.user_id ? "open" : ""}
                    style="
                      margin-top:18px;
                      border:1px solid #ddd;
                      border-radius:8px;
                      padding:12px 14px;
                      background:#fafafa;
                    "
                  >

                    <summary
                      style="
                        cursor:pointer;
                        font-weight:700;
                        user-select:none;
                      "
                    >
                      Password Recovery
                    </summary>


                    <div
                      style="
                        margin-top:12px;
                      "
                    >

                      <div
                        class="muted"
                        style="
                          margin-bottom:12px;
                          line-height:1.4;
                        "
                      >
                        Set a temporary password if this user
                        cannot access normal email password recovery.
                        The user can change the password after logging in.
                      </div>


                      <label>
                        Temporary Password
                      </label>

                      <input
                        type="password"
                        id="temporaryPassword-${escapeAttr(settingsUser.user_id || "")}"
                        data-temporary-password="${escapeAttr(settingsUser.user_id || "")}"
                        autocomplete="new-password"
                        placeholder="Minimum 8 characters"
                        style="
                          max-width:360px;
                        "
                      >

                      <label
                        style="
                          margin-top:8px;
                          display:inline-flex;
                          align-items:center;
                          gap:8px;
                          cursor:pointer;
                        "
                      >
                        <input
                          type="checkbox"
                          data-password-visibility-toggle="temporaryPassword-${escapeAttr(settingsUser.user_id || "")}"
                        >
                        Show Password
                      </label>


                      <label
                        style="
                          margin-top:12px;
                        "
                      >
                        Confirm Temporary Password
                      </label>

                      <input
                        type="password"
                        id="confirmTemporaryPassword-${escapeAttr(settingsUser.user_id || "")}"
                        data-confirm-temporary-password="${escapeAttr(settingsUser.user_id || "")}"
                        autocomplete="new-password"
                        placeholder="Re-enter password"
                        style="
                          max-width:360px;
                        "
                      >

                      <label
                        style="
                          margin-top:8px;
                          display:inline-flex;
                          align-items:center;
                          gap:8px;
                          cursor:pointer;
                        "
                      >
                        <input
                          type="checkbox"
                          data-password-visibility-toggle="confirmTemporaryPassword-${escapeAttr(settingsUser.user_id || "")}"
                        >
                        Show Password
                      </label>


                      <button
                        type="button"
                        class="secondary"
                        data-set-temporary-password="${escapeAttr(settingsUser.user_id || "")}"
                        style="
                          margin-top:14px;
                        "
                      >
                        Set Temporary Password
                      </button>

                    </div>

                  </details>
                `
                : ""
            }


            <!-- PERMISSIONS -->

            <details
              data-user-permissions="${escapeAttr(settingsUser.user_id || "")}"
              style="
                margin-top:18px;
                border:1px solid #ddd;
                border-radius:8px;
                padding:12px 14px;
                background:#fafafa;
              "
            >

              <summary
                style="
                  cursor:pointer;
                  font-weight:700;
                  user-select:none;
                "
              >
                Permissions
              </summary>


              <div
                style="
                  margin-top:12px;
                "
              >

                <div
                  class="muted"
                  style="
                    margin-bottom:12px;
                    line-height:1.4;
                  "
                >
                  Role defaults are shown below.
                  Individual changes override this user's
                  role without changing the role itself.
                </div>


                <div
                  style="
                    display:grid;
                    grid-template-columns:
                      repeat(
                        auto-fit,
                        minmax(190px, 1fr)
                      );
                    gap:8px 18px;
                  "
                >

                  ${[
                    ["users", "Users"],
                    ["organization", "Organization"],
                    ["location", "Location"],
                    ["branding", "Branding"],
                    ["availability", "Availability"],
                    ["booking_rules", "Booking Rules"],
                    ["services", "Services"],
                    ["calendar", "Calendar"],
                    ["appointments", "Appointments"],
                    ["clients", "Clients"],
                    ["emails", "Emails"]
                  ]
                    .map(([permission, label]) => {

                      const effectivePermissions =
                        settingsUser.effective_permissions ||
                        rolePermissionDefaults[
                          settingsUser.role
                        ] ||
                        {};

                      const checked =
                        effectivePermissions[
                          permission
                        ] === true;

                      return `
                        <label
                          style="
                            display:flex;
                            align-items:center;
                            gap:8px;
                            margin:0;
                            cursor:pointer;
                          "
                        >

                          <input
                            type="checkbox"
                            data-user-permission="${escapeAttr(settingsUser.user_id || "")}"
                            data-permission-key="${escapeAttr(permission)}"
                            ${checked ? "checked" : ""}
                          >

                          <span>
                            ${escapeHtml(label)}
                          </span>

                        </label>
                      `;

                    })
                    .join("")}

                </div>


                <div
                  style="
                    margin-top:14px;
                  "
                >

                  <button
                    type="button"
                    class="secondary"
                    data-reset-user-permissions="${escapeAttr(settingsUser.user_id || "")}"
                  >
                    Reset to Role Defaults
                  </button>

                </div>

              </div>

            </details>


            <!-- USER ACTIONS -->

            <div
              style="
                display:flex;
                gap:10px;
                flex-wrap:wrap;
                margin-top:24px;
              "
            >

              <button
                type="button"
                class="secondary"
                data-deactivate-user="${escapeAttr(settingsUser.user_id || "")}"
              >
                Deactivate
              </button>

              <button
                type="button"
                class="secondary"
                data-delete-user="${escapeAttr(settingsUser.user_id || "")}"
              >
                Delete
              </button>

              <button
                type="button"
                class="secondary"
                data-resend-invite="${escapeAttr(settingsUser.user_id || "")}"
              >
                Resend Invite
              </button>

            </div>

          </div>
        `;

      })
      .join("");

}

document.addEventListener("click", async function (event) {

  /*
   * Do not treat User Management controls as
   * instructor selection.
   *
   * Instructor-linked user cards are themselves
   * selectable. Any interactive control inside the
   * card must therefore be excluded here so using
   * that control does not also trigger an instructor
   * change and the resulting form rerender.
   */

  if (
    event.target.closest("[data-role-user]") ||
    event.target.closest("[data-user-permissions]") ||
    event.target.closest("[data-user-permission]") ||
    event.target.closest("[data-reset-user-permissions]") ||
    event.target.closest("[data-password-recovery]") ||
    event.target.closest("[data-temporary-password]") ||
    event.target.closest("[data-confirm-temporary-password]") ||
    event.target.closest("[data-set-temporary-password]") ||
    event.target.closest("[data-deactivate-user]") ||
    event.target.closest("[data-delete-user]") ||
    event.target.closest("[data-resend-invite]")
  ) {
    return;
  }

  const card =
    event.target.closest("[data-select-instructor]");

  if (!card) return;

  const instructorId =
    card.getAttribute("data-select-instructor");

  if (!instructorId) return;

  const selectedInstructor =
    state.instructors.find(
      instructor =>
        instructor.id === instructorId
    );

  if (!selectedInstructor) return;

  state.instructor =
    selectedInstructor;

  const globalSelect =
    $("globalInstructorSelect");

  if (globalSelect) {
    globalSelect.value =
      selectedInstructor.id;
  }

  updateBookingUrlDisplay();


  /*
   * Start Student Booking Fields immediately.
   *
   * Do not await this request. It can load
   * independently while the rest of the selected
   * instructor UI continues updating.
   */
  loadStudentBookingFields(
    selectedInstructor.id
  );


  /*
   * Update Other User Email settings immediately.
   * Do not make the Email UI wait for unrelated
   * Location or Services requests to finish.
   */
  renderOtherUserEmailRecipients();

  await loadOtherUserEmailSettings();

  renderActiveOtherUserEmailSettings();


  await loadLocationIntoForm(
    state.location
  );

  await loadServices();


  const calendarSelectedName =
    $("calendarSelectedName");

  if (calendarSelectedName) {
    calendarSelectedName.textContent =
      selectedInstructor.name;
  }


  renderInstructorList();

});


// ------------------------------------------------------
// DELETE USER
// ------------------------------------------------------

document.addEventListener("click", async function (event) {

  const button =
    event.target.closest("[data-delete-user]");

  if (!button) return;

  const userId =
    button.getAttribute("data-delete-user");

  if (!userId) {
    showCustomAlert(
      "This user does not have a Booking Settings account."
    );
    return;
  }


  /*
   * User Management is based on settingsUsers.
   * The user may or may not also have an
   * instructor record.
   */
  const settingsUser =
    state.settingsUsers.find(
      item =>
        item.user_id === userId
    );

  const instructor =
    state.instructors.find(
      item =>
        item.user_id === userId
    );


  const userName =
    instructor?.name ||
    settingsUser?.email ||
    "this user";


  /*
   * Instructor-backed users may have booking data.
   * Settings-only users such as Administrators do not
   * require an instructor record.
   */
  const deleteWarning =
    instructor
      ? (
          `Are you sure you want to permanently delete ${userName}?\n\n` +
          `This will permanently remove their user account, instructor record, ` +
          `bookings, and other associated data.\n\n` +
          `This cannot be undone.`
        )
      : (
          `Are you sure you want to permanently delete ${userName}?\n\n` +
          `This will permanently remove their Booking Settings user account.\n\n` +
          `This cannot be undone.`
        );


  const confirmed =
    await showCustomConfirm(
      deleteWarning
    );

  if (!confirmed) {
    return;
  }


  const originalText =
    button.textContent;


  button.disabled = true;

  button.textContent =
    "Deleting...";


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
            action: "delete",
            user_id: userId
          })
        }
      );


    const result =
      await response.json();


    if (!response.ok || result.error) {

      throw new Error(
        result.error ||
        "Unable to delete user."
      );

    }


    /*
     * Reload both Settings users and actual
     * instructors from the database.
     *
     * loadAllInstructors() now owns both collections
     * and will automatically repair the selected
     * instructor if the deleted user had one.
     */
    await loadAllInstructors();


    showCustomAlert(
      `${userName} has been permanently deleted.`
    );


  } catch (error) {

    console.error(
      "DELETE USER ERROR:",
      error
    );


    showCustomAlert(
      error.message ||
      "Unable to delete user."
    );


    button.disabled = false;

    button.textContent =
      originalText;

  }

});


// ------------------------------------------------------
// DEACTIVATE USER
// ------------------------------------------------------

document.addEventListener("click", async function (event) {

  const button =
    event.target.closest("[data-deactivate-user]");

  if (!button) return;

  const userId =
    button.getAttribute("data-deactivate-user");

  if (!userId) {
    showCustomAlert(
      "This user does not have a Booking Settings account."
    );
    return;
  }


  const settingsUser =
    state.settingsUsers.find(
      item =>
        item.user_id === userId
    );

  const instructor =
    state.instructors.find(
      item =>
        item.user_id === userId
    );


  const userName =
    instructor?.name ||
    settingsUser?.email ||
    "this user";


  const confirmed =
    await showCustomConfirm(
      `Are you sure you want to deactivate ${userName}?`
    );

  if (!confirmed) {
    return;
  }


  const originalText =
    button.textContent;

  button.disabled = true;

  button.textContent =
    "Deactivating...";


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
            action: "update_active",
            user_id: userId,
            active: false
          })
        }
      );


    const result =
      await response.json();


    if (!response.ok || result.error) {

      throw new Error(
        result.error ||
        "Unable to deactivate user."
      );

    }


    await loadAllInstructors();


    showCustomAlert(
      `${userName} has been deactivated successfully.`
    );


  } catch (error) {

    console.error(
      "DEACTIVATE USER ERROR:",
      error
    );


    showCustomAlert(
      error.message ||
      "Unable to deactivate user."
    );


  } finally {

    button.disabled = false;

    button.textContent =
      originalText;

  }

});


// ------------------------------------------------------
// RESEND INVITE
// ------------------------------------------------------

document.addEventListener("click", async function (event) {

  const button =
    event.target.closest("[data-resend-invite]");

  if (!button) return;

  const userId =
    button.getAttribute("data-resend-invite");

  if (!userId) {
    showCustomAlert(
      "This user does not have a Booking Settings account."
    );
    return;
  }


  const settingsUser =
    state.settingsUsers.find(
      item =>
        item.user_id === userId
    );

  const instructor =
    state.instructors.find(
      item =>
        item.user_id === userId
    );


  const userName =
    instructor?.name ||
    settingsUser?.email ||
    "this user";


  const originalText =
    button.textContent;


  button.disabled = true;

  button.textContent =
    "Sending...";


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
            action: "resend_invite",
            user_id: userId
          })
        }
      );


    const result =
      await response.json();


    if (
      !response.ok ||
      result.error
    ) {

      throw new Error(
        result.error ||
        "Unable to resend invitation."
      );

    }


    button.textContent =
      "Sent";


    showCustomAlert(
      `The invitation has been resent to ${userName}.`
    );


    setTimeout(() => {

      button.disabled = false;

      button.textContent =
        originalText;

    }, 1500);


  } catch (error) {

    console.error(
      "RESEND INVITE ERROR:",
      error
    );


    button.disabled = false;

    button.textContent =
      originalText;


    showCustomAlert(
      error.message ||
      "Unable to resend invitation."
    );

  }

});


// ------------------------------------------------------
// USER PERMISSION CHANGE
// ------------------------------------------------------

document.addEventListener("change", async function (event) {

  const checkbox =
    event.target.closest(
      "[data-user-permission]"
    );

  if (!checkbox) return;


  const userId =
    checkbox.getAttribute(
      "data-user-permission"
    );

  const permission =
    checkbox.getAttribute(
      "data-permission-key"
    );


  if (
    !userId ||
    !permission
  ) {
    return;
  }


  const settingsUser =
    state.settingsUsers.find(
      user =>
        user.user_id === userId
    );


  if (!settingsUser) {

    showCustomAlert(
      "Unable to find this Booking Settings user."
    );

    renderInstructorList();

    return;

  }


  const previousValue =
    !checkbox.checked;

  const newValue =
    checkbox.checked;


  checkbox.disabled = true;


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
            action:
              "update_permission",

            user_id:
              userId,

            permission:
              permission,

            allowed:
              newValue
          })
        }
      );


    const result =
      await response.json();


    if (
      !response.ok ||
      result.error
    ) {

      console.error(
        "UPDATE USER PERMISSION RESPONSE:",
        result
      );


      const errorMessage =
        typeof result.error === "string"
          ? result.error
          : result.error?.message ||
            result.message ||
            JSON.stringify(
              result.error || result
            );


      throw new Error(
        errorMessage ||
        "Unable to update user permission."
      );

    }


    /*
     * Keep the User Management source of truth
     * synchronized with the backend response.
     */

    settingsUser.permissions =
      result.user?.permissions ||
      {};


    settingsUser.effective_permissions =
      result.user?.effective_permissions ||
      {
        ...(
          rolePermissionDefaults[
            settingsUser.role
          ] || {}
        ),
        ...settingsUser.permissions
      };


    /*
     * If the edited account is the currently
     * logged-in user, immediately update the
     * permissions controlling this page.
     */

    if (
      state.user?.id === userId
    ) {

      state.permissions = {
        ...settingsUser.effective_permissions
      };


      applyRolePermissions();


      /*
       * Keep Organization data synchronized when the
       * currently logged-in user's Organization permission
       * is changed while this page is open.
       */

      if (
        permission === "organization"
      ) {

        if (
          hasPermission("organization")
        ) {

          await loadOrganizationSettings();

        } else {

          state.organization = null;

        }

      }

    }


    /*
     * Re-render the User cards so all displayed
     * permission values remain synchronized.
     *
     * Then reopen this user's Permissions box.
     * A successful checkbox change should not
     * unexpectedly collapse the panel the
     * Administrator is actively working in.
     */

    renderInstructorList();


    const permissionsPanel =
      document.querySelector(
        `[data-user-permissions="${CSS.escape(userId)}"]`
      );


    if (permissionsPanel) {
      permissionsPanel.open = true;
    }


  } catch (error) {

    console.error(
      "UPDATE USER PERMISSION ERROR:",
      error
    );


    checkbox.checked =
      previousValue;


    showCustomAlert(
      error.message ||
      "Unable to update user permission."
    );


  } finally {

    /*
     * renderInstructorList() normally replaces
     * this checkbox after a successful save.
     *
     * This protects the original control when
     * the request fails before a rerender.
     */

    checkbox.disabled = false;

  }

});


// ------------------------------------------------------
// PRESERVE PASSWORD RECOVERY PANEL STATE
// ------------------------------------------------------

document.addEventListener("toggle", function (event) {

  const panel =
    event.target.closest?.(
      "[data-password-recovery]"
    );


  if (!panel) {
    return;
  }


  const userId =
    panel.getAttribute(
      "data-password-recovery"
    );


  if (!userId) {
    return;
  }


  if (panel.open) {

    state.openPasswordRecoveryUserId =
      userId;

  } else if (
    state.openPasswordRecoveryUserId ===
    userId
  ) {

    state.openPasswordRecoveryUserId =
      null;

  }

}, true);


// ------------------------------------------------------
// SET TEMPORARY USER PASSWORD
// ------------------------------------------------------

document.addEventListener("click", async function (event) {

  const button =
    event.target.closest(
      "[data-set-temporary-password]"
    );

  if (!button) return;


  const userId =
    button.getAttribute(
      "data-set-temporary-password"
    );


  if (!userId) {
    return;
  }


  /*
   * The UI only renders this control for an
   * Administrator, but the Edge Function independently
   * enforces Administrator-role authorization.
   */

  if (!isAdministrator()) {

    showCustomAlert(
      "Only an Administrator can set a temporary password."
    );

    return;
  }


  const settingsUser =
    state.settingsUsers.find(
      user =>
        user.user_id === userId
    );


  if (!settingsUser) {

    showCustomAlert(
      "Unable to find this Booking Settings user."
    );

    renderInstructorList();

    return;
  }


  const passwordInput =
    document.querySelector(
      `[data-temporary-password="${CSS.escape(userId)}"]`
    );


  const confirmPasswordInput =
    document.querySelector(
      `[data-confirm-temporary-password="${CSS.escape(userId)}"]`
    );


  if (
    !passwordInput ||
    !confirmPasswordInput
  ) {

    showCustomAlert(
      "Unable to locate the temporary password fields."
    );

    return;
  }


  const password =
    passwordInput.value;


  const confirmPassword =
    confirmPasswordInput.value;


  if (password.length < 8) {

    showCustomAlert(
      "Password must be at least 8 characters."
    );

    passwordInput.focus();

    return;
  }


  if (
    password !==
    confirmPassword
  ) {

    showCustomAlert(
      "The passwords do not match."
    );

    confirmPasswordInput.focus();

    return;
  }


  const confirmed =
    await showCustomConfirm(
      `Set a new temporary password for ${settingsUser.email || "this user"}? Their current password will immediately stop working.`
    );


  if (!confirmed) {
    return;
  }


  const originalText =
    button.textContent;


  button.disabled = true;

  passwordInput.disabled = true;
  confirmPasswordInput.disabled = true;

  button.textContent =
    "Setting Password...";


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
            action:
              "set_temporary_password",

            user_id:
              userId,

            password
          })
        }
      );


    const result =
      await response.json();


    if (
      !response.ok ||
      result.error
    ) {

      console.error(
        "SET TEMPORARY PASSWORD RESPONSE:",
        result
      );


      const errorMessage =
        typeof result.error === "string"
          ? result.error
          : result.error?.message ||
            result.message ||
            JSON.stringify(
              result.error || result
            );


      throw new Error(
        errorMessage ||
        "Unable to set temporary password."
      );

    }


    /*
     * Clear both password fields immediately after
     * Supabase confirms the change.
     *
     * Never retain the submitted password in the UI.
     */

    passwordInput.value = "";
    confirmPasswordInput.value = "";


    showCustomAlert(
      `Temporary password set successfully for ${settingsUser.email || "this user"}. The user can now log in with the new password and may change it after logging in.`
    );


  } catch (error) {

    console.error(
      "SET TEMPORARY PASSWORD ERROR:",
      error
    );


    showCustomAlert(
      error.message ||
      "Unable to set temporary password."
    );


  } finally {

    button.disabled = false;

    passwordInput.disabled = false;
    confirmPasswordInput.disabled = false;

    button.textContent =
      originalText;

  }

});


// ------------------------------------------------------
// RESET USER PERMISSIONS TO ROLE DEFAULTS
// ------------------------------------------------------

document.addEventListener("click", async function (event) {

  const button =
    event.target.closest(
      "[data-reset-user-permissions]"
    );

  if (!button) return;


  const userId =
    button.getAttribute(
      "data-reset-user-permissions"
    );


  if (!userId) {
    return;
  }


  const settingsUser =
    state.settingsUsers.find(
      user =>
        user.user_id === userId
    );


  if (!settingsUser) {

    showCustomAlert(
      "Unable to find this Booking Settings user."
    );

    renderInstructorList();

    return;

  }


  const confirmed =
    await showCustomConfirm(
      `Reset permissions for ${settingsUser.email || "this user"} to the default permissions for the ${settingsUser.role} role?`
    );


  if (!confirmed) {
    return;
  }


  button.disabled = true;


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
            action:
              "reset_permissions",

            user_id:
              userId
          })
        }
      );


    const result =
      await response.json();


    if (
      !response.ok ||
      result.error
    ) {

      console.error(
        "RESET USER PERMISSIONS RESPONSE:",
        result
      );


      const errorMessage =
        typeof result.error === "string"
          ? result.error
          : result.error?.message ||
            result.message ||
            JSON.stringify(
              result.error || result
            );


      throw new Error(
        errorMessage ||
        "Unable to reset user permissions."
      );

    }


    /*
     * Reset means there are no explicit per-user
     * overrides remaining.
     */

    settingsUser.permissions =
      result.user?.permissions ||
      {};


    settingsUser.effective_permissions =
      result.user?.effective_permissions ||
      {
        ...(
          rolePermissionDefaults[
            settingsUser.role
          ] || {}
        )
      };


    /*
     * If the Administrator reset their own
     * permissions, immediately synchronize the
     * tabs available on the current page.
     */

    if (
      state.user?.id === userId
    ) {

      state.permissions = {
        ...settingsUser.effective_permissions
      };


      applyRolePermissions();

    }


    /*
     * Refresh the User cards so the checkboxes
     * show the restored role defaults.
     *
     * Keep this Permissions panel expanded so
     * the Administrator can immediately see the
     * result of the reset.
     */

    renderInstructorList();


    const permissionsPanel =
      document.querySelector(
        `[data-user-permissions="${CSS.escape(userId)}"]`
      );


    if (permissionsPanel) {
      permissionsPanel.open = true;
    }


  } catch (error) {

    console.error(
      "RESET USER PERMISSIONS ERROR:",
      error
    );


    showCustomAlert(
      error.message ||
      "Unable to reset user permissions."
    );


    button.disabled = false;

  }

});


// EXISTING ROLE CHANGE HANDLER
// Leave this line exactly where it is.


document.addEventListener("change", async function (event) {

  /*
   * Manual custom appointment
   * date/time selection.
   */
  if (
    event.target.id ===
      "scheduleCustomDate" ||
    event.target.id ===
      "scheduleCustomStartTime"
  ) {

    updateScheduleCustomTimeSelection();

    return;
  }


  /*
   * Manual appointment available-date selection.
   */
  if (
    event.target.id ===
    "scheduleAvailableDate"
  ) {

    renderScheduleAvailableTimes(
      event.target.value
    );

    return;
  }


  /*
   * Manual appointment scheduling mode.
   *
   * Available Time uses the instructor's normal
   * student-bookable availability.
   *
   * Custom Time allows an authorized user to
   * manually choose a date and time.
   */
  const scheduleTimeMode =
    event.target.closest(
      'input[name="scheduleTimeMode"]'
    );

  if (scheduleTimeMode) {

    const availablePanel =
      $("scheduleAvailableTimePanel");

    const customPanel =
      $("scheduleCustomTimePanel");


    if (
      !availablePanel ||
      !customPanel
    ) {
      return;
    }


    const useCustomTime =
      scheduleTimeMode.value === "custom";


    availablePanel.classList.toggle(
      "hidden",
      useCustomTime
    );

    customPanel.classList.toggle(
      "hidden",
      !useCustomTime
    );


    return;
  }


  /*
   * Required checkbox for a locally-created
   * free service.
   */
  const freeServiceRequired =
    event.target.closest(
      "[data-free-service-required]"
    );

  if (freeServiceRequired) {

    if (!state.instructor?.id) {
      return;
    }


    const serviceId =
      freeServiceRequired.getAttribute(
        "data-service-id"
      );

    const required =
      freeServiceRequired.checked;


    if (!serviceId) {
      return;
    }


    freeServiceRequired.disabled =
      true;


    try {

      const authHeaders =
        await getAuthHeaders();


      const response =
        await fetch(
          `${cfg.functionsBaseUrl}/stripe-products`,
          {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
              action:
                "update_free_service_required",

              instructor_id:
                state.instructor.id,

              service_id:
                serviceId,

              required
            })
          }
        );


      const result =
        await response.json();


      if (
        !response.ok ||
        result.error
      ) {
        throw new Error(
          result.error ||
          "Unable to update free service."
        );
      }


      const service =
        state.services.find(
          item =>
            item.id === serviceId
        );


      if (service) {
        service.required =
          result.required === true;
      }


    } catch (error) {

      console.error(
        "FREE SERVICE REQUIRED ERROR:",
        error
      );


      /*
       * Restore the checkbox to its previous
       * value if the save failed.
       */
      freeServiceRequired.checked =
        !required;


      showCustomAlert(
        error.message ||
        "Unable to update free service."
      );


    } finally {

      freeServiceRequired.disabled =
        false;
    }


    return;
  }


  const allowCustomerServiceSelection =
    event.target.closest(
      "#allowCustomerServiceSelection"
    );

  if (allowCustomerServiceSelection) {

    if (!state.instructor?.id) {
      return;
    }

    const enabled =
      allowCustomerServiceSelection.checked;

    allowCustomerServiceSelection.disabled =
      true;

    try {

      const authHeaders =
        await getAuthHeaders();

      const response =
        await fetch(
          `${cfg.functionsBaseUrl}/stripe-products`,
          {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
              action:
                "update_customer_service_selection",

              instructor_id:
                state.instructor.id,

              allow_customer_service_selection:
                enabled
            })
          }
        );

      const result =
        await response.json();

      if (
        !response.ok ||
        result.error
      ) {
        throw new Error(
          result.error ||
          "Unable to update customer service selection."
        );
      }

      state.instructor
        .allow_customer_service_selection =
          result.allow_customer_service_selection;

      const instructor =
        state.instructors.find(
          item =>
            item.id ===
            state.instructor.id
        );

      if (instructor) {
        instructor
          .allow_customer_service_selection =
            result.allow_customer_service_selection;
      }

    } catch (error) {

      console.error(
        "CUSTOMER SERVICE SELECTION ERROR:",
        error
      );

      allowCustomerServiceSelection.checked =
        !enabled;

      showCustomAlert(
        error.message ||
        "Unable to update customer service selection."
      );

    } finally {

      allowCustomerServiceSelection.disabled =
        false;
    }

    return;
  }


  const requiredService =
    event.target.closest(
      "[data-stripe-service-required]"
    );

  if (requiredService) {

    if (!state.instructor?.id) {
      return;
    }

    const productId =
      requiredService.getAttribute(
        "data-product-id"
      );

    const priceId =
      requiredService.getAttribute(
        "data-price-id"
      );

    const required =
      requiredService.checked;

    requiredService.disabled = true;

    try {

      const authHeaders =
        await getAuthHeaders();

      const response =
        await fetch(
          `${cfg.functionsBaseUrl}/stripe-products`,
          {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
              instructor_id:
                state.instructor.id,

              product_id:
                productId,

              price_id:
                priceId,

              assigned:
                true,

              required:
                required
            })
          }
        );

      const result =
        await response.json();

      if (
        !response.ok ||
        result.error
      ) {
        throw new Error(
          result.error ||
          "Unable to update required service."
        );
      }

      const service =
        state.services.find(
          item =>
            item.product_id ===
            productId
        );

      if (service) {
        service.assigned =
          result.assigned === true;

        service.required =
          result.required === true;
      }

    } catch (error) {

      console.error(
        "REQUIRED SERVICE ERROR:",
        error
      );

      requiredService.checked =
        !required;

      showCustomAlert(
        error.message ||
        "Unable to update required service."
      );

    } finally {

      requiredService.disabled =
        false;
    }

    return;
  }


  const stripeService =
    event.target.closest(
      "[data-stripe-service]"
    );

  if (stripeService) {

    if (!state.instructor?.id) {
      return;
    }

    const productId =
      stripeService.getAttribute(
        "data-product-id"
      );

    const priceId =
      stripeService.getAttribute(
        "data-price-id"
      );

    const assigned =
      stripeService.checked;

    stripeService.disabled = true;

    try {

      const authHeaders =
        await getAuthHeaders();

      const response =
        await fetch(
          `${cfg.functionsBaseUrl}/stripe-products`,
          {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
              instructor_id:
                state.instructor.id,

              product_id:
                productId,

              price_id:
                priceId,

              assigned:
                assigned
            })
          }
        );

      const result =
        await response.json();

      if (
        !response.ok ||
        result.error
      ) {
        throw new Error(
          result.error ||
          "Unable to update service assignment."
        );
      }

      const service =
        state.services.find(
          item =>
            item.product_id ===
            productId
        );

      if (service) {
        service.assigned =
          result.assigned === true;

        service.required =
          result.required === true;
      }

      renderServices();

    } catch (error) {

      console.error(
        "SERVICE ASSIGNMENT ERROR:",
        error
      );

      stripeService.checked =
        !assigned;

      showCustomAlert(
        error.message ||
        "Unable to update service assignment."
      );

    } finally {

      stripeService.disabled =
        false;
    }

    return;
  }
  
  const globalSelect =
    event.target.closest("#globalInstructorSelect");

  if (globalSelect) {

    const instructorId =
      globalSelect.value;


    /*
     * If no instructor is selected, clear the
     * instructor-specific UI and reload the
     * remaining shared settings.
     */
    if (!instructorId) {

      state.instructor = null;

      updateBookingUrlDisplay();
      updateSelectedInstructorBanner();

      const calendarSelectedName =
        $("calendarSelectedName");

      if (calendarSelectedName) {
        calendarSelectedName.textContent =
          "NONE SELECTED";
      }


      /*
       * Clear instructor-specific appointment and
       * client displays immediately so information
       * from the previously selected instructor
       * cannot remain visible.
       */

      if (hasPermission("appointments")) {

        await loadAppointments();

      }


      if (hasPermission("clients")) {

        clearClients();

      }


      renderInstructorList();

      await loadLocationIntoForm(
        state.location
      );

      await loadServices();

      renderInstructorList();

      return;
    }


    /*
     * Immediately switch to the already-loaded
     * instructor record.
     *
     * This allows Appointments to begin loading
     * without waiting for the complete instructor
     * settings query below.
     */
    const immediateInstructor =
      state.instructors.find(
        instructor =>
          instructor.id === instructorId
      );

    if (immediateInstructor) {

      state.instructor =
        immediateInstructor;

      updateBookingUrlDisplay();
      updateSelectedInstructorBanner();

      const calendarSelectedName =
        $("calendarSelectedName");

      if (calendarSelectedName) {
        calendarSelectedName.textContent =
          immediateInstructor.name;
      }

      /*
       * Start instructor-specific requests immediately.
       *
       * These requests are intentionally not awaited here.
       * Appointments, Clients, and Student Booking Fields
       * can load independently while the complete instructor
       * settings record loads below.
       *
       * Appointments and Clients remain independent
       * permissions.
       */

      if (hasPermission("appointments")) {

        loadAppointments();

      }


      if (hasPermission("clients")) {

        loadClients();

      }


      loadStudentBookingFields(
        immediateInstructor.id
      );

    }


    /*
     * Load the complete instructor settings record.
     *
     * IMPORTANT:
     * Keep the instructor-specific Location fields in
     * this query. loadLocationIntoForm() uses these
     * values as instructor overrides for the shared
     * Location defaults.
     *
     * Omitting them here would replace the already-loaded
     * instructor with an incomplete record when switching
     * instructors, causing Location Name, Address, Website,
     * or Services to fall back to the Location defaults.
     */
    const {
      data: selectedInstructor,
      error: instructorError
    } =
      await db
        .from("instructors")
        .select(`
          id,
          location_id,
          user_id,
          name,
          email,
          slug,

          location_name,
          address,
          website,
          services,

          timezone,
          appointment_length_minutes,
          max_students_per_slot,
          booking_horizon_days,
          minimum_booking_notice_hours,
          cancellation_hours,
          reschedule_hours,
          allow_customer_service_selection,

          confirmation_email_subject,
          confirmation_email_message,
          student_confirmation_enabled,
          confirmation_button_enabled,
          confirmation_button_text,
          confirmation_button_url,
          instructor_confirmation_email,
          instructor_confirmation_subject,
          instructor_confirmation_message,

          reschedule_email_subject,
          reschedule_email_message,
          reschedule_button_enabled,
          reschedule_button_text,
          reschedule_button_url,
          instructor_reschedule_email,
          instructor_reschedule_subject,
          instructor_reschedule_message,

          reminder_enabled,
          reminder_hours_before,
          instructor_email,
          student_reminder_subject,
          student_reminder_message,
          instructor_reminder_subject,
          instructor_reminder_message,

          cancel_email_subject,
          cancel_email_message,

          instructor_cancel_email,
          instructor_cancel_subject,
          instructor_cancel_message,

          missed_email_subject,
          missed_email_message,

          followup_enabled,
          followup_delay_minutes,
          followup_subject,
          followup_message
        `)
        .eq("id", instructorId)
        .single();


    if (instructorError) {

      console.error(
        "INSTRUCTOR LOAD ERROR:",
        instructorError
      );

      return;
    }


    if (!selectedInstructor) {
      return;
    }


    state.instructor =
      selectedInstructor;

    updateBookingUrlDisplay();
    updateSelectedInstructorBanner();

    const calendarSelectedName =
      $("calendarSelectedName");

    if (calendarSelectedName) {
      calendarSelectedName.textContent =
        selectedInstructor.name;
    }


    /*
     * Update Other User Email settings immediately.
     * Appointments are already loading independently
     * and do not wait for these requests.
     */
    renderOtherUserEmailRecipients();

    await loadOtherUserEmailSettings();

    renderActiveOtherUserEmailSettings();


    await loadLocationIntoForm(
      state.location
    );

    await loadServices();


    /*
     * Refresh Schedule availability/services for
     * the newly selected instructor.
     */
    await loadScheduleServices();


    renderInstructorList();

    return;
  }


  const select =
    event.target.closest("[data-role-user]");

  if (!select) return;

  const userId =
    select.getAttribute("data-role-user");

  if (!userId) return;

  const settingsUser =
    state.settingsUsers.find(
      user =>
        user.user_id === userId
    );

  if (!settingsUser) {

    showCustomAlert(
      "Unable to find this Booking Settings user."
    );

    renderInstructorList();

    return;
  }

  const newRole =
    select.value;

  const previousRole =
    settingsUser.role;

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
            user_id: userId,
            role: newRole
          })
        }
      );

    const result =
      await response.json();

    if (!response.ok || result.error) {

      console.error(
        "MANAGE SETTINGS USERS RESPONSE:",
        result
      );

      const errorMessage =
        typeof result.error === "string"
          ? result.error
          : result.error?.message ||
            result.message ||
            JSON.stringify(result.error || result);

      throw new Error(
        errorMessage ||
        "Unable to update user role."
      );
    }

    /*
     * Update the User Management source of truth.
     *
     * A role change does NOT erase intentional
     * per-user permission overrides.
     *
     * The backend returns both the preserved
     * overrides and the newly calculated effective
     * permissions for the user's new role.
     */
    settingsUser.role =
      result.user?.role ||
      newRole;


    settingsUser.permissions =
      result.user?.permissions ||
      settingsUser.permissions ||
      {};


    settingsUser.effective_permissions =
      result.user?.effective_permissions ||
      {
        ...(
          rolePermissionDefaults[
            settingsUser.role
          ] || {}
        ),
        ...settingsUser.permissions
      };


    /*
     * If this user also has an instructor record,
     * keep that record synchronized.
     */
    const instructor =
      state.instructors.find(
        item =>
          item.user_id === userId
      );

    if (instructor) {

      instructor.role =
        settingsUser.role;

      if (
        state.instructor?.id ===
        instructor.id
      ) {
        state.instructor =
          instructor;
      }

    }


    /*
     * If the logged-in user changes their own role,
     * immediately synchronize both the role and the
     * effective permissions controlling this page.
     */
    if (
      state.user?.id === userId
    ) {

      state.role =
        settingsUser.role;


      state.permissions = {
        ...settingsUser.effective_permissions
      };


      applyRolePermissions();

    }


    /*
     * Refresh the User cards so the displayed
     * permission checkboxes reflect the new role
     * defaults plus any preserved overrides.
     */
    renderInstructorList();


    /*
     * Keep this user's Permissions panel open after
     * the role change so the Administrator can
     * immediately see the resulting permissions.
     */
    const permissionsPanel =
      document.querySelector(
        `[data-user-permissions="${CSS.escape(userId)}"]`
      );


    if (permissionsPanel) {
      permissionsPanel.open = true;
    }


  } catch (error) {

    console.error(
      "UPDATE USER ROLE ERROR:",
      error
    );

    settingsUser.role =
      previousRole;

    renderInstructorList();

    showCustomAlert(
      error.message ||
      "Unable to update user role."
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


document.addEventListener("click", async function (event) {

  const button =
    event.target.closest("#addInstructorBtn");

  if (!button) {
    return;
  }

  const nameInput =
    $("newUserName");

  const emailInput =
    $("newUserEmail");

  const roleInput =
    $("newUserRole");

  const name =
    nameInput?.value.trim() || "";

  const email =
    emailInput?.value.trim().toLowerCase() || "";

const role =
    roleInput?.value || "";

  if (!email) {
    showCustomAlert(
      "Please enter an email address."
    );
    return;
  }

  if (![
    "Administrator",
    "Manager",
    "Instructor",
    "Basic"
  ].includes(role)) {
    showCustomAlert(
      "Please select a valid user role."
    );
    return;
  }

  if (
    role === "Instructor" &&
    !name
  ) {
    showCustomAlert(
      "Please enter the instructor name."
    );
    return;
  }

  button.disabled = true;

  const originalText =
    button.textContent;

  button.textContent =
    "Sending...";

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
            action: "invite",
            name,
            email,
            role,
            location_id:
              state.location?.id || null
          })
        }
      );

    const result =
      await response.json();

    if (
      !response.ok ||
      result.error
    ) {
      throw new Error(
        result.error ||
        "Unable to add user."
      );
    }

    if (nameInput) {
      nameInput.value = "";
    }

    if (emailInput) {
      emailInput.value = "";
    }

    await loadAllInstructors();

    renderInstructorList();

    showCustomAlert(
      result.message ||
      "Invitation sent successfully."
    );

  } catch (error) {

    console.error(
      "ADD USER ERROR:",
      error
    );

    showCustomAlert(
      error.message ||
      "Unable to add user."
    );

  } finally {

    button.disabled = false;

    button.textContent =
      originalText;
  }

});

$("connectCalendarBtn").addEventListener("click", () => {
  if (!state.location?.id) {
    $("calendarStatus").textContent =
      "Please select a location first.";
    return;
  }

  if (!state.instructor?.id) {
    $("calendarStatus").textContent =
      "Please select an instructor first.";
    return;
  }

  const oauthUrl =
    `${cfg.functionsBaseUrl}/google-oauth-start` +
    `?location_id=${encodeURIComponent(state.location.id)}` +
    `&instructor_id=${encodeURIComponent(state.instructor.id)}`;

  window.open(
    oauthUrl,
    "_blank",
    "noopener,noreferrer"
  );
});

/* =========================================================
   AUTHENTICATION FLOWS
   ========================================================= */

function getAuthFlowType() {

  const hashParams =
    new URLSearchParams(
      window.location.hash.replace(
        /^#/,
        ""
      )
    );

  const queryParams =
    new URLSearchParams(
      window.location.search
    );


  return (
    hashParams.get("type") ||
    queryParams.get("type") ||
    ""
  );

}


function isInvitationFlow() {

  return (
    getAuthFlowType() ===
    "invite"
  );

}


function isPasswordRecoveryFlow() {

  return (
    getAuthFlowType() ===
    "recovery"
  );

}


/* =========================================================
   CREATE PASSWORD
   ========================================================= */

async function handleCreatePassword() {

  const password =
    $("newPassword").value;

  const confirmPassword =
    $("confirmNewPassword").value;

  const error =
    $("createPasswordError");


  error.classList.add("hidden");
  error.textContent = "";


  if (!password || !confirmPassword) {

    error.textContent =
      "Please enter and confirm your password.";

    error.classList.remove("hidden");

    return;
  }


  if (password.length < 8) {

    error.textContent =
      "Password must be at least 8 characters.";

    error.classList.remove("hidden");

    return;
  }


  if (password !== confirmPassword) {

    error.textContent =
      "The passwords do not match.";

    error.classList.remove("hidden");

    return;
  }


  const button =
    $("createPasswordBtn");

  const originalText =
    button.textContent;


  button.disabled = true;

  button.textContent =
    "Creating Password...";


  try {

    const {
      data,
      error: updateError
    } =
      await db.auth.updateUser({
        password
      });


    if (updateError) {
      throw updateError;
    }


    if (!data?.user) {

      throw new Error(
        "Unable to update your password."
      );

    }


    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );


    window.location.reload();


  } catch (error) {

    console.error(
      "CREATE PASSWORD ERROR:",
      error
    );


    $("createPasswordError").textContent =
      error.message ||
      "Unable to create your password.";


    $("createPasswordError")
      .classList.remove("hidden");


  } finally {

    button.disabled = false;

    button.textContent =
      originalText;

  }

}


/* =========================================================
   SETTINGS LOGIN
   ========================================================= */

async function handleSettingsLogin() {

  const email =
    $("loginEmail").value.trim();

  const password =
    $("loginPassword").value;


  $("loginError")
    .classList.add("hidden");

  $("loginError").textContent =
    "";


  if (!email || !password) {

    $("loginError").textContent =
      "Please enter your email and password.";

    $("loginError")
      .classList.remove("hidden");

    return;

  }


  const {
    error
  } =
    await db.auth.signInWithPassword({
      email,
      password
    });


  if (error) {

    $("loginError").textContent =
      "Login failed. Please check your email and password.";

    $("loginError")
      .classList.remove("hidden");

    return;

  }


  window.location.reload();

}


/* =========================================================
   FORGOT PASSWORD
   ========================================================= */

function showForgotPasswordPanel() {

  const loginEmail =
    $("loginEmail").value.trim();


  $("loginPanel")
    .classList.add("hidden");

  $("forgotPasswordPanel")
    .classList.remove("hidden");


  $("forgotPasswordEmail").value =
    loginEmail;


  $("forgotPasswordMessage").textContent =
    "";

  $("forgotPasswordMessage")
    .classList.add("hidden");


  $("forgotPasswordEmail").focus();

}


function hideForgotPasswordPanel() {

  const recoveryEmail =
    $("forgotPasswordEmail").value.trim();


  if (recoveryEmail) {

    $("loginEmail").value =
      recoveryEmail;

  }


  $("forgotPasswordEmail").value =
    "";

  $("forgotPasswordMessage").textContent =
    "";

  $("forgotPasswordMessage")
    .classList.add("hidden");


  $("forgotPasswordPanel")
    .classList.add("hidden");

  $("loginPanel")
    .classList.remove("hidden");


  $("loginPassword").focus();

}


async function handleForgotPassword() {

  const email =
    $("forgotPasswordEmail")
      .value
      .trim();

  const message =
    $("forgotPasswordMessage");

  const button =
    $("sendPasswordResetBtn");


  message.textContent =
    "";

  message.classList.add("hidden");


  if (!email) {

    message.textContent =
      "Please enter your email address.";

    message.classList.remove("hidden");

    $("forgotPasswordEmail").focus();

    return;

  }


  const originalText =
    button.textContent;


  button.disabled = true;

  button.textContent =
    "Sending...";


  try {

    const redirectTo =
      window.location.origin +
      window.location.pathname;


    const {
      error
    } =
      await db.auth.resetPasswordForEmail(
        email,
        {
          redirectTo
        }
      );


    if (error) {
      throw error;
    }


    /*
     * Use the same confirmation message whether or not
     * an account exists for this email address.
     *
     * This avoids exposing which email addresses have
     * Booking Settings accounts.
     */

    message.textContent =
      "If a Booking Settings account exists for that email address, a password recovery link has been sent.";

    message.classList.remove("hidden");


  } catch (error) {

    console.error(
      "FORGOT PASSWORD ERROR:",
      error
    );


    message.textContent =
      error.message ||
      "Unable to send the password recovery email.";

    message.classList.remove("hidden");


  } finally {

    button.disabled = false;

    button.textContent =
      originalText;

  }

}


/* =========================================================
   RESET PASSWORD
   ========================================================= */

async function handleResetPassword() {

  const password =
    $("resetPasswordNew").value;

  const confirmPassword =
    $("resetPasswordConfirm").value;

  const error =
    $("resetPasswordError");


  error.classList.add("hidden");
  error.textContent = "";


  if (!password || !confirmPassword) {

    error.textContent =
      "Please enter and confirm your new password.";

    error.classList.remove("hidden");

    return;
  }


  if (password.length < 8) {

    error.textContent =
      "Password must be at least 8 characters.";

    error.classList.remove("hidden");

    return;
  }


  if (password !== confirmPassword) {

    error.textContent =
      "The passwords do not match.";

    error.classList.remove("hidden");

    return;
  }


  const button =
    $("resetPasswordBtn");

  const originalText =
    button.textContent;


  button.disabled = true;

  button.textContent =
    "Saving Password...";


  try {

    const {
      data,
      error: updateError
    } =
      await db.auth.updateUser({
        password
      });


    if (updateError) {
      throw updateError;
    }


    if (!data?.user) {

      throw new Error(
        "Unable to reset your password."
      );

    }


    /*
     * The recovery URL is no longer needed after
     * Supabase confirms the new password.
     *
     * Remove all recovery parameters before
     * returning to the normal Booking Settings page.
     */

    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );


    /*
     * Sign out of the temporary recovery session.
     *
     * The user will then log in normally using
     * the new password they just created.
     */

    const {
      error: signOutError
    } =
      await db.auth.signOut();


    if (signOutError) {
      throw signOutError;
    }


    window.location.reload();


  } catch (error) {

    console.error(
      "RESET PASSWORD ERROR:",
      error
    );


    $("resetPasswordError").textContent =
      error.message ||
      "Unable to reset your password.";


    $("resetPasswordError")
      .classList.remove("hidden");


  } finally {

    button.disabled = false;

    button.textContent =
      originalText;

  }

}


/* =========================================================
   AUTHENTICATION EVENT HANDLERS
   ========================================================= */

$("loginBtn").addEventListener(
  "click",
  handleSettingsLogin
);


$("forgotPasswordBtn").addEventListener(
  "click",
  showForgotPasswordPanel
);


$("cancelForgotPasswordBtn").addEventListener(
  "click",
  hideForgotPasswordPanel
);


$("sendPasswordResetBtn").addEventListener(
  "click",
  handleForgotPassword
);


$("createPasswordBtn").addEventListener(
  "click",
  handleCreatePassword
);


$("resetPasswordBtn").addEventListener(
  "click",
  handleResetPassword
);


$("loginPassword").addEventListener(
  "keydown",
  event => {

    if (event.key === "Enter") {
      handleSettingsLogin();
    }

  }
);


$("forgotPasswordEmail").addEventListener(
  "keydown",
  event => {

    if (event.key === "Enter") {
      handleForgotPassword();
    }

  }
);


$("resetPasswordConfirm").addEventListener(
  "keydown",
  event => {

    if (event.key === "Enter") {
      handleResetPassword();
    }

  }
);


/* =========================================================
   CHANGE PASSWORD
   ========================================================= */

$("changePasswordBtn").addEventListener(
  "click",
  () => {

    $("changePasswordNew").value = "";
    $("changePasswordConfirm").value = "";

    $("changePasswordPanel")
      .classList.remove("hidden");

    $("changePasswordNew").focus();

  }
);


$("cancelChangePasswordBtn").addEventListener(
  "click",
  () => {

    $("changePasswordNew").value = "";
    $("changePasswordConfirm").value = "";

    $("changePasswordPanel")
      .classList.add("hidden");

  }
);


$("saveChangedPasswordBtn").addEventListener(
  "click",
  async () => {

    const password =
      $("changePasswordNew").value;

    const confirmPassword =
      $("changePasswordConfirm").value;


    if (!password || !confirmPassword) {

      showCustomAlert(
        "Please enter and confirm your new password."
      );

      return;
    }


    if (password.length < 8) {

      showCustomAlert(
        "Password must be at least 8 characters."
      );

      return;
    }


    if (password !== confirmPassword) {

      showCustomAlert(
        "The passwords do not match."
      );

      return;
    }


    const confirmed =
      await showCustomConfirm(
        "Change the password for your Booking Settings account?"
      );


    if (!confirmed) {
      return;
    }


    const button =
      $("saveChangedPasswordBtn");

    const originalText =
      button.textContent;


    button.disabled = true;

    button.textContent =
      "Changing Password...";


    try {

      const {
        error
      } = await db.auth.updateUser({
        password
      });


      if (error) {
        throw error;
      }


      /*
       * Clear the password from the form immediately
       * after Supabase confirms the update.
       */

      $("changePasswordNew").value = "";
      $("changePasswordConfirm").value = "";


      $("changePasswordPanel")
        .classList.add("hidden");


      showCustomAlert(
        "Your password has been changed."
      );


    } catch (error) {

      console.error(
        "CHANGE PASSWORD ERROR:",
        error
      );


      showCustomAlert(
        error.message ||
        "Unable to change your password."
      );


    } finally {

      button.disabled = false;

      button.textContent =
        originalText;

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

    const invitationFlow =
      isInvitationFlow();

    const passwordRecoveryFlow =
      isPasswordRecoveryFlow();


    /*
     * Supabase processes invitation and password
     * recovery URLs and establishes a temporary
     * authenticated session.
     */

    const {
      data: {
        session
      }
    } =
      await db.auth.getSession();


    $("loading")
      .classList.add("hidden");


    /*
     * INVITATION FLOW
     *
     * A valid invitation should already have
     * produced an authenticated session.
     *
     * Show only the Create Password screen.
     */

    if (
      invitationFlow &&
      session
    ) {

      $("loginPanel")
        .classList.add("hidden");

      $("forgotPasswordPanel")
        .classList.add("hidden");

      $("resetPasswordPanel")
        .classList.add("hidden");

      $("settingsApp")
        .classList.add("hidden");

      $("createPasswordPanel")
        .classList.remove("hidden");


      $("newPassword").focus();

      return;

    }


    /*
     * PASSWORD RECOVERY FLOW
     *
     * A valid recovery link should already have
     * produced an authenticated recovery session.
     *
     * Recovery gets its own password screen and
     * must never fall into the invitation flow.
     */

    if (
      passwordRecoveryFlow &&
      session
    ) {

      $("loginPanel")
        .classList.add("hidden");

      $("forgotPasswordPanel")
        .classList.add("hidden");

      $("createPasswordPanel")
        .classList.add("hidden");

      $("settingsApp")
        .classList.add("hidden");

      $("resetPasswordPanel")
        .classList.remove("hidden");


      $("resetPasswordNew").focus();

      return;

    }


    /*
     * NORMAL SETTINGS LOGIN
     *
     * No valid invitation or recovery session is
     * being processed.
     */

    const authenticated =
      await authenticateSettingsUser();


    if (!authenticated) {

      $("forgotPasswordPanel")
        .classList.add("hidden");

      $("createPasswordPanel")
        .classList.add("hidden");

      $("resetPasswordPanel")
        .classList.add("hidden");

      $("settingsApp")
        .classList.add("hidden");

      $("loginPanel")
        .classList.remove("hidden");

      return;

    }


    /*
     * NORMAL AUTHENTICATED SETTINGS USER
     */

    $("loginPanel")
      .classList.add("hidden");

    $("forgotPasswordPanel")
      .classList.add("hidden");

    $("createPasswordPanel")
      .classList.add("hidden");

    $("resetPasswordPanel")
      .classList.add("hidden");


    $("settingsUserEmail").textContent =
      state.user.email;

    $("settingsUserRole").textContent =
      state.role;


    applyRolePermissions();

    setupServiceTypeSelector();


    /*
     * Organization settings belong to the authenticated
     * organization, not to the selected Location or
     * Instructor.
     *
     * Organization and Instructor data are independent,
     * so begin both requests at the same time.
     */
    const organizationLoadPromise =
      hasPermission("organization")
        ? loadOrganizationSettings()
        : Promise.resolve();

    const instructorLoadPromise =
      loadAllInstructors();


    await Promise.all([
      organizationLoadPromise,
      instructorLoadPromise
    ]);


    /*
     * loadAllInstructors() initially renders the Users list
     * before the location slug is available.
     *
     * Render it again now that the instructor collection
     * is loaded and the selected instructor is established.
     */
    renderInstructorList();


    /*
     * Locations, Services, Appointments, and Clients all
     * depend on the selected instructor now being available,
     * but they are otherwise independent of one another.
     *
     * Start all four requests together.
     *
     * Location is the only request that must complete before
     * the Settings application becomes visible because it
     * establishes the active Location and populates the
     * Location-dependent settings UI.
     *
     * Services, Appointments, and Clients are intentionally
     * allowed to finish in the background. Their individual
     * loaders already render their own loading/error states,
     * so none of these unrelated requests should delay the
     * initial appearance of the Settings application.
     */
    const locationLoadPromise =
      loadLocations();

    const servicesLoadPromise =
      loadServices();


    const appointmentsLoadPromise =
      hasPermission("appointments")
        ? loadAppointments()
        : Promise.resolve();


    const clientsLoadPromise =
      hasPermission("clients")
        ? loadClients()
        : Promise.resolve();


    /*
     * Location remains part of the initial readiness gate.
     *
     * The other three requests continue running independently
     * while the Settings interface becomes available.
     */
    await locationLoadPromise;


    updateClientsHistoryDescription();

    updateBookingUrlDisplay();

    $("settingsApp")
      .classList.remove("hidden");


  } catch (err) {

    showError(err.message);
  }
})();






$("copyBookingUrlBtn")?.addEventListener(
  "click",
  async () => {
    const urlText = $("bookingUrlText");

    if (!urlText) return;

    const url = urlText.textContent.trim();

    if (!url || url === "No booking URL configured.") {
      return;
    }

    try {
      await navigator.clipboard.writeText(url);

      const button = $("copyBookingUrlBtn");

      if (button) {
        const originalText = button.textContent;

        button.textContent = "Copied!";

        setTimeout(() => {
          button.textContent = originalText;
        }, 1500);
      }
    } catch (err) {
      console.error(
        "Unable to copy Booking URL:",
        err
      );
    }
  }
);


/* =========================================================
   CLIENTS TAB CONTROLS
   ========================================================= */

document.addEventListener(
  "click",
  async function (event) {

    /*
     * CLIENT HISTORY RANGE
     *
     * Clients themselves always remain visible.
     * This changes only the historical appointments
     * displayed inside each client card.
     */

    const clientRangeButton =
      event.target.closest(
        ".client-range"
      );


    if (clientRangeButton) {

      const value =
        clientRangeButton.getAttribute(
          "data-client-days"
        );


      const days =
        value === "all"
          ? "all"
          : 60;


      selectClientHistoryRange(
        days
      );


      await loadClients();

      return;
    }


    /*
     * CLIENT CARD EXPAND / COLLAPSE
     */

    const clientToggle =
      event.target.closest(
        ".client-card-toggle"
      );


    if (clientToggle) {

      const clientIndex =
        clientToggle.getAttribute(
          "data-client-index"
        );


      if (clientIndex == null) {
        return;
      }


      const appointments =
        document.querySelector(
          `[data-client-appointments="${clientIndex}"]`
        );


      if (!appointments) {
        return;
      }


      const currentlyExpanded =
        clientToggle.getAttribute(
          "aria-expanded"
        ) === "true";


      const expanded =
        !currentlyExpanded;


      clientToggle.setAttribute(
        "aria-expanded",
        String(expanded)
      );


      appointments.classList.toggle(
        "hidden",
        !expanded
      );


      const arrow =
        clientToggle.querySelector(
          ".client-card-arrow"
        );


      if (arrow) {

        arrow.textContent =
          expanded
            ? "▲"
            : "▼";

      }


      return;
    }

  }
);


/* =========================================================
   APPOINTMENTS TAB CONTROLS
   ========================================================= */

document.addEventListener(
  "click",
  async function (event) {

    const appointmentTab =
      event.target.closest(
        "[data-appointment-tab]"
      );


    if (appointmentTab) {

      const target =
        appointmentTab.getAttribute(
          "data-appointment-tab"
        );


      if (!target) {
        return;
      }


      const tabName =
        target.replace(
          "AppointmentsTab",
          ""
        );


      selectAppointmentTab(
        tabName
      );

      return;
    }


    /*
     * MANUAL APPOINTMENT
     * CREATE BOOKING.
     */
    const scheduleAppointmentButton =
      event.target.closest(
        "#scheduleAppointmentBtn"
      );

    if (scheduleAppointmentButton) {

      const result =
        validateManualAppointment();


      if (!result.valid) {

        showCustomAlert(
          result.message
        );

        return;
      }


      if (!state.instructor?.id) {

        showCustomAlert(
          "Select an instructor before scheduling an appointment."
        );

        return;
      }


      const appointment =
        result.appointment;

      const status =
        $("scheduleAppointmentStatus");


      scheduleAppointmentButton.disabled =
        true;

      scheduleAppointmentButton.textContent =
        "Scheduling...";


      if (status) {

        status.textContent =
          "Creating appointment...";

        status.classList.remove(
          "hidden"
        );

      }


      try {

        const authHeaders =
          await getAuthHeaders();


        const response =
          await fetch(
            `${cfg.functionsBaseUrl}/create-manual-booking`,
            {
              method: "POST",

              headers:
                authHeaders,

              body: JSON.stringify({
                instructor_id:
                  state.instructor.id,

                student:
                  appointment.student,

                service_id:
                  appointment.serviceId,

                time_mode:
                  appointment.timeMode,

                start_time:
                  appointment.startTime,

                end_time:
                  appointment.endTime,

                conflict_override:
                  appointment.conflictOverride
              })
            }
          );


        const responseText =
          await response.text();


        let createResult = {};


        if (responseText) {

          try {

            createResult =
              JSON.parse(
                responseText
              );

          } catch {

            throw new Error(
              responseText
            );

          }

        }


        if (
          !response.ok ||
          createResult.error
        ) {

          throw new Error(
            createResult.error ||
            "Unable to schedule the appointment."
          );

        }


        console.log(
          "MANUAL APPOINTMENT CREATED:",
          createResult
        );


        if (status) {

          status.textContent =
            "Appointment scheduled successfully.";

        }


        await showCustomAlert(
          "Appointment scheduled successfully."
        );


        /*
         * Refresh instructor-specific appointment data
         * after the manual booking is created.
         *
         * Appointments and Clients are independent
         * permissions, so refresh only the data the
         * logged-in user is authorized to view.
         */

        if (hasPermission("appointments")) {

          await loadAppointments();

        }


        if (hasPermission("clients")) {

          await loadClients();

        }


      } catch (error) {

        console.error(
          "CREATE MANUAL APPOINTMENT ERROR:",
          error
        );


        if (status) {

          status.textContent =
            error.message ||
            "Unable to schedule the appointment.";

        }


        showCustomAlert(
          error.message ||
          "Unable to schedule the appointment."
        );


      } finally {

        scheduleAppointmentButton.disabled =
          false;

        scheduleAppointmentButton.textContent =
          "Schedule Appointment";

      }


      return;
    }


    /*
     * MANUAL APPOINTMENT
     * CONFLICT OVERRIDE.
     */
    const overrideConflictButton =
      event.target.closest(
        "#scheduleOverrideConflictBtn"
      );

    if (overrideConflictButton) {

      const confirmed =
        await showCustomConfirm(
          "This appointment conflicts with an existing appointment or calendar event. Continue with the override?"
        );


      if (!confirmed) {
        return;
      }


      const status =
        $("scheduleCustomConflictStatus");


      if (!status) {
        return;
      }


      status.dataset.override =
        "true";


      status.innerHTML = `
        <strong>
          Conflict override approved.
        </strong>

        <div
          class="muted"
          style="margin-top:4px;"
        >
          This appointment may be scheduled despite the detected conflict.
        </div>
      `;


      return;
    }


    /*
     * SELECT AVAILABLE TIME FOR
     * MANUAL APPOINTMENT.
     */
    const scheduleTimeButton =
      event.target.closest(
        ".schedule-available-time"
      );

    if (scheduleTimeButton) {

      const startTime =
        scheduleTimeButton.getAttribute(
          "data-start-time"
        ) || "";

      const endTime =
        scheduleTimeButton.getAttribute(
          "data-end-time"
        ) || "";

      const timeLabel =
        scheduleTimeButton.getAttribute(
          "data-time-label"
        ) || scheduleTimeButton.textContent.trim();


      document
        .querySelectorAll(
          ".schedule-available-time"
        )
        .forEach(button => {

          button.classList.remove(
            "primary"
          );

          button.classList.add(
            "secondary"
          );

        });


      scheduleTimeButton.classList.remove(
        "secondary"
      );

      scheduleTimeButton.classList.add(
        "primary"
      );


      const selection =
        $("scheduleAvailableTimeSelection");


      if (selection) {

        selection.dataset.startTime =
          startTime;

        selection.dataset.endTime =
          endTime;

        selection.textContent =
          `Selected: ${timeLabel}`;

      }


      return;
    }


    const rangeButton =
      event.target.closest(
        ".appointment-range"
      );


    if (rangeButton) {

      const value =
        rangeButton.getAttribute(
          "data-days"
        );


      const days =
        value === "all"
          ? "all"
          : Number(value);


      selectAppointmentHistoryRange(
        days
      );

      await loadAppointments();

      return;
    }


    const olderButton =
      event.target.closest(
        "#viewOlderAppointmentsBtn"
      );


    if (olderButton) {

      const current =
        state.appointments.historyDays;


      let next =
        90;


      if (current === 30) {
        next = 60;
      } else if (current === 60) {
        next = 90;
      } else if (current === 90) {
        next = 365;
      } else if (current === 365) {
        next = "all";
      } else {
        next = "all";
      }


      selectAppointmentHistoryRange(
        next
      );

      await loadAppointments();

      return;
    }


    /*
     * CANCEL APPOINTMENT
     */

    const cancelButton =
      event.target.closest(
        ".appointment-cancel-btn"
      );


    if (cancelButton) {

      const bookingId =
        cancelButton.getAttribute(
          "data-appointment-id"
        );


      if (
        !bookingId ||
        !state.instructor?.id
      ) {

        showCustomAlert(
          "Unable to identify this appointment."
        );

        return;
      }


      const confirmed =
        await showCustomConfirm(
          "Cancel this appointment? The student will be notified and the appointment time will become available again."
        );


      if (!confirmed) {
        return;
      }


      const originalText =
        cancelButton.textContent;


      cancelButton.disabled =
        true;

      cancelButton.textContent =
        "Cancelling...";


      try {

        const authHeaders =
          await getAuthHeaders();


        const response =
          await fetch(
            `${cfg.functionsBaseUrl}/admin-cancel-booking`,
            {
              method:
                "POST",

              headers:
                authHeaders,

              body:
                JSON.stringify({
                  booking_id:
                    bookingId,

                  instructor_id:
                    state.instructor.id
                })
            }
          );


        const result =
          await response.json();


        if (
          !response.ok ||
          result.error
        ) {

          throw new Error(
            result.error ||
            "Unable to cancel appointment."
          );

        }


        /*
         * Refresh instructor-specific appointment data
         * after the appointment is cancelled.
         *
         * Appointments and Clients are independent
         * permissions, so refresh only the data the
         * logged-in user is authorized to view.
         */

        if (hasPermission("appointments")) {

          await loadAppointments();

        }


        if (hasPermission("clients")) {

          await loadClients();

        }


        if (
          result.cancellation_email_sent ===
          false
        ) {

          showCustomAlert(
            "The appointment was cancelled, but the student cancellation email could not be sent."
          );

        }


      } catch (error) {

        console.error(
          "APPOINTMENT CANCEL ERROR:",
          error
        );


        cancelButton.disabled =
          false;

        cancelButton.textContent =
          originalText;


        showCustomAlert(
          error.message ||
          "Unable to cancel appointment."
        );

      }


      return;
    }


    /*
     * MARK APPOINTMENT MISSED
     */

    const missedButton =
      event.target.closest(
        ".appointment-missed-btn"
      );


    if (missedButton) {

      const bookingId =
        missedButton.getAttribute(
          "data-appointment-id"
        );


      if (
        !bookingId ||
        !state.instructor?.id
      ) {

        showCustomAlert(
          "Unable to identify this appointment."
        );

        return;
      }


      const confirmed =
        await showCustomConfirm(
          "Mark this appointment as missed?"
        );


      if (!confirmed) {
        return;
      }


      const originalText =
        missedButton.textContent;


      missedButton.disabled =
        true;

      missedButton.textContent =
        "Marking...";


      try {

        const authHeaders =
          await getAuthHeaders();


        const response =
          await fetch(
            `${cfg.functionsBaseUrl}/mark-booking-missed`,
            {
              method:
                "POST",

              headers:
                authHeaders,

              body:
                JSON.stringify({
                  booking_id:
                    bookingId,

                  instructor_id:
                    state.instructor.id
                })
            }
          );


        const result =
          await response.json();


        if (
          !response.ok ||
          result.error
        ) {

          throw new Error(
            result.error ||
            "Unable to mark appointment missed."
          );

        }


        /*
         * Refresh instructor-specific appointment data
         * after the appointment is marked missed.
         *
         * Appointments and Clients are independent
         * permissions, so refresh only the data the
         * logged-in user is authorized to view.
         */

        if (hasPermission("appointments")) {

          await loadAppointments();

        }


        if (hasPermission("clients")) {

          await loadClients();

        }


      } catch (error) {

        console.error(
          "APPOINTMENT MARK MISSED ERROR:",
          error
        );


        missedButton.disabled =
          false;

        missedButton.textContent =
          originalText;


        showCustomAlert(
          error.message ||
          "Unable to mark appointment missed."
        );

      }


      return;
    }

  }
);


/*
 * Establish the default Appointments view.
 */

selectAppointmentTab(
  state.appointments.activeTab
);

selectAppointmentHistoryRange(
  state.appointments.historyDays
);

updateSelectedInstructorBanner();
