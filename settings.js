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

function canEditLocation() {
  return (
    isAdministrator() ||
    isManager() ||
    isInstructor()
  );
}

function canViewLocation() {
  return (
    isAdministrator() ||
    isManager() ||
    isInstructor()
  );
}

function canEditBranding() {
  return isAdministrator();
}

function canEditAvailability() {
  return (
    isAdministrator() ||
    isManager() ||
    isInstructor() ||
    isBasic()
  );
}

function canEditBookingRules() {
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

function canManageServices() {
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
  services: [],
  user: null,
  role: null,

  appointments: {
    activeTab: "upcoming",
    historyDays: 60
  },

  scheduleAvailability: null
};


/* =========================================================
   APPOINTMENTS UI
   ========================================================= */

function updateAppointmentsInstructorBanner() {

  const name =
    $("appointmentsInstructorName");

  const email =
    $("appointmentsInstructorEmail");


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


function updateEmailsInstructorBanner() {

  const name =
    $("emailsInstructorName");

  const email =
    $("emailsInstructorEmail");


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
  const bookingRulesTab = $("bookingRulesTab");
  const servicesTab = $("servicesTab");
  const appointmentsTab = $("appointmentsTab");
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

const servicesTabButton =
  document.querySelector('[data-tab="servicesTab"]');

const appointmentsTabButton =
  document.querySelector('[data-tab="appointmentsTab"]');

const calendarTabButton =
  document.querySelector('[data-tab="calendarTab"]');

const emailsTabButton =
  document.querySelector('[data-tab="emailsTab"]');

  const bookingRulesTabButton =
  document.querySelector('[data-tab="bookingRulesTab"]');

// Location tab visibility
if (canViewLocation()) {
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

  // Availability: Administrator, Manager, Instructor, Basic
  
if (canEditAvailability()) {
  availabilityTabButton?.classList.remove("hidden");
  availabilityTab?.classList.remove("hidden");
}

if (
  isAdministrator() ||
  isManager() ||
  isInstructor()
) {
  bookingRulesTabButton?.classList.remove("hidden");
  bookingRulesTab?.classList.remove("hidden");
}

if (canManageServices()) {
  servicesTabButton?.classList.remove("hidden");
  servicesTab?.classList.remove("hidden");
}

if (
  isAdministrator() ||
  isManager() ||
  isInstructor() ||
  isBasic()
) {
  calendarTabButton?.classList.remove("hidden");
  calendarTab?.classList.remove("hidden");
}

if (isManager() || isInstructor() || isBasic()) {
  document.querySelectorAll(".settings-tab-panel").forEach(panel => {
    panel.classList.remove("active");
  });

  document.querySelectorAll(".settings-tab").forEach(tab => {
    tab.classList.remove("active");
  });

if (isManager()) {
  locationTab?.classList.add("active");
  locationTabButton?.classList.add("active");
}

if (isInstructor()) {
  appointmentsTab?.classList.add("active");
  appointmentsTabButton?.classList.add("active");
}

if (isBasic()) {
  availabilityTab?.classList.add("active");
  availabilityTabButton?.classList.add("active");
}
}

if (canEditEmails()) {
  emailsTabButton?.classList.remove("hidden");
  emailsTab?.classList.remove("hidden");
}

  // Hide tabs that this role cannot access
if (!canViewLocation()) {
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

if (!canManageServices()) {
  servicesTabButton?.classList.add("hidden");
  servicesTab?.classList.add("hidden");
}

if (
  !isAdministrator() &&
  !isManager() &&
  !isInstructor()
) {
  bookingRulesTabButton?.classList.add("hidden");
  bookingRulesTab?.classList.add("hidden");
}

if (
  !isAdministrator() &&
  !isManager() &&
  !isInstructor() &&
  !isBasic()
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

const calendarResponse = await fetch(
  `${cfg.functionsBaseUrl}/get-calendar-settings`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
body: JSON.stringify({
  location_id: state.location?.id,
  instructor_id: state.instructor?.id
})
  }
);

const calendarResult = await calendarResponse.json();

if (!calendarResponse.ok || calendarResult.error) {

  console.error(
    "CALENDAR SETTINGS ERROR:",
    calendarResult
  );

  $("calendarInfo").textContent =
    calendarResult.error ||
    "Unable to load calendar configuration.";

} else {

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
                  location_id: state.location.id,
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
          await loadLocationIntoForm(state.location);

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

      });

    });

  
$("calendarInfo").innerHTML =
  connection?.google_calendar_id
    ? calendarInfo
    : "No calendar connection found.";

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

        const label =
          slot.label ||
          slot.time_label ||
          startTime;


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

  const allowCustomerServiceSelection =
    $("allowCustomerServiceSelection");

  if (allowCustomerServiceSelection) {
    allowCustomerServiceSelection.checked =
      state.instructor
        ?.allow_customer_service_selection === true;
  }

  if (!container) {
    return;
  }

  if (!state.instructor?.id) {

    container.innerHTML = `
      <p class="muted">
        Select an instructor to manage services.
      </p>
    `;

    return;
  }


  if (!state.services.length) {

    container.innerHTML = `
      <p class="muted">
        No active Stripe products with an active
        one-time default price were found.
      </p>
    `;

    return;
  }


  container.innerHTML =
    state.services
      .map(service => {

        const price =
          (
            service.price_cents / 100
          ).toFixed(2);

        const currency =
          String(
            service.currency || "usd"
          ).toUpperCase();


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

                <span>

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

              <span>

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

              </span>

            </label>

          </div>
        `;
      })
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

  updateAppointmentsInstructorBanner();
  updateEmailsInstructorBanner();
  
  if (state.instructor) {



    const calendarSelectedName =
      $("calendarSelectedName");

    if (calendarSelectedName) {
      calendarSelectedName.textContent =
        state.instructor.name;
    }


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
        state.instructor?.id || "";

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

    const payload = {
      location_id:
        state.location.id,

      instructor_id:
        state.instructor.id,

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

function updateBookingUrlDisplay() {
  const urlText = $("bookingUrlText");
  const copyButton = $("copyBookingUrlBtn");

  if (!urlText) return;

  const bookingUrl =
    state.instructor &&
    state.location?.slug &&
    state.instructor.slug
      ? `${window.location.origin}/booking/?location=${encodeURIComponent(state.location.slug)}&instructor=${encodeURIComponent(state.instructor.slug)}`
      : "";

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



function renderInstructorList() {

  const container = $("usersList");

  if (!container) return;

  if (!state.instructors.length) {
    container.innerHTML =
      `<div class="muted">
        No users assigned.
      </div>`;
    return;
  }

  container.innerHTML =
    state.instructors.map(instructor => {

      const bookingUrl =
        instructor.slug &&
        state.location?.slug
          ? `${window.location.origin}/booking/?location=${encodeURIComponent(state.location.slug)}&instructor=${encodeURIComponent(instructor.slug)}`
          : "";

      const isSelected =
        state.instructor &&
        state.instructor.id === instructor.id;

let status = "Removed";

if (instructor.user_id) {
  if (instructor.active && instructor.email_confirmed) {
    status = "Active";
  } else if (instructor.active && !instructor.email_confirmed) {
    status = "Invited - Awaiting Confirmation";
  }
}

      return `
        <div
          data-select-instructor="${escapeAttr(instructor.id)}"
          style="
            padding:24px;
            border:3px solid ${isSelected ? "#333" : "#ddd"};
            margin-top:15px;
            border-radius:10px;
            cursor:pointer;
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
            ${escapeHtml(instructor.name)}
          </div>


          <!-- USER EMAIL -->

          <div
            style="
              font-size:17px;
              margin-top:3px;
            "
          >
            ${escapeHtml(instructor.email || "")}
          </div>


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
                data-role-instructor="${escapeAttr(instructor.id)}"
                style="
                  width:160px;
                  margin-left:8px;
                "
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

                <option
                  value="Basic"
                  ${instructor.role === "Basic" ? "selected" : ""}
                >
                  Basic
                </option>

              </select>

            </label>

          </div>


          <!-- BOOKING URL -->

          ${
            bookingUrl
              ? `
                <div
                  style="
                    margin-top:18px;
                    font-size:15px;
                  "
                >
                  Booking URL:
                  <code>${escapeHtml(bookingUrl)}</code>
                </div>
              `
              : `
                <div
                  class="muted"
                  style="margin-top:18px;"
                >
                  No booking URL configured.
                </div>
              `
          }


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
              data-deactivate-user="${escapeAttr(instructor.user_id || "")}"
            >
              Deactivate
            </button>

            <button
              type="button"
              class="secondary"
              data-delete-user="${escapeAttr(instructor.user_id || "")}"
            >
              Delete
            </button>

            <button
              type="button"
              class="secondary"
              data-resend-invite="${escapeAttr(instructor.user_id || "")}"
            >
              Resend Invite
            </button>

          </div>

        </div>
      `;

    }).join("");
}

document.addEventListener("click", async function (event) {

  // Do not treat management controls as instructor selection.
  if (
    event.target.closest("[data-role-instructor]") ||
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


  const instructor =
    state.instructors.find(
      item =>
        item.user_id === userId
    );


  const userName =
    instructor?.name ||
    "this user";


const confirmed =
  await showCustomConfirm(
    `Are you sure you want to permanently delete ${userName}?\n\n` +
    `This will permanently remove their user account, instructor record, ` +
    `bookings, and other associated data.\n\n` +
    `This cannot be undone.`
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
     * Remove the deleted instructor from the
     * current page state immediately.
     */
    state.instructors =
      state.instructors.filter(
        item =>
          item.user_id !== userId
      );


    /*
     * If the deleted instructor was currently
     * selected, clear the selection.
     */
    if (
      state.instructor?.user_id ===
      userId
    ) {

      state.instructor =
        null;

    }


    renderInstructorList();


    /*
     * Reload the instructors so the User
     * Management list and global instructor
     * selector are rebuilt from the database.
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

const confirmed =
  await showCustomConfirm(
    "Are you sure you want to deactivate this user?"
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

    renderInstructorList();

    showCustomAlert(
      "User deactivated successfully."
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

  const instructor =
    state.instructors.find(
      item =>
        item.user_id === userId
    );

  const userName =
    instructor?.name ||
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

// EXISTING ROLE CHANGE HANDLER
// Leave this line exactly where it is.


document.addEventListener("change", async function (event) {

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

    if (!instructorId) {
      state.instructor = null;

    updateBookingUrlDisplay();

      const calendarSelectedName =
        $("calendarSelectedName");

      if (calendarSelectedName) {
        calendarSelectedName.textContent =
          "NONE SELECTED";
      }



      renderInstructorList();

    await loadLocationIntoForm(
      state.location
    );

    await loadServices();

    renderInstructorList();



    return;
    }

const { data: selectedInstructor, error: instructorError } =
  await db
    .from("instructors")
    .select(`
      id,
      location_id,
      user_id,
      name,
      email,
      slug,
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

if (!selectedInstructor) return;

state.instructor =
  selectedInstructor;

updateBookingUrlDisplay();

updateAppointmentsInstructorBanner();
updateEmailsInstructorBanner();

const calendarSelectedName =
  $("calendarSelectedName");

if (calendarSelectedName) {
  calendarSelectedName.textContent =
    selectedInstructor.name;
}

await loadLocationIntoForm(
  state.location
);

await loadServices();

await loadAppointments();

renderInstructorList();

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

    showCustomAlert(
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

    showCustomAlert(
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

function isInvitationFlow() {
  const hashParams = new URLSearchParams(
    window.location.hash.replace(/^#/, "")
  );

  const queryParams = new URLSearchParams(
    window.location.search
  );

  const hashType = hashParams.get("type");
  const queryType = queryParams.get("type");

  return (
    hashType === "invite" ||
    hashType === "recovery" ||
    queryType === "invite" ||
    queryType === "recovery"
  );
}


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
    } = await db.auth.updateUser({
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

    /*
     * The invitation/recovery URL is no longer
     * needed after the password has been created.
     *
     * Remove the auth parameters from the browser
     * address before continuing.
     */
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

$("createPasswordBtn").addEventListener(
  "click",
  handleCreatePassword
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

    const invitationFlow =
      isInvitationFlow();

    /*
     * Supabase processes the invitation URL and
     * establishes the temporary authenticated session.
     */
    const {
      data: {
        session
      }
    } = await db.auth.getSession();

    $("loading").classList.add("hidden");

    /*
     * Invitation link:
     *
     * A valid invitation should already have
     * produced an authenticated session.
     *
     * Show the password creation screen instead
     * of the normal login screen.
     */
    if (
      invitationFlow &&
      session
    ) {
      $("loginPanel")
        .classList.add("hidden");

      $("settingsApp")
        .classList.add("hidden");

      $("createPasswordPanel")
        .classList.remove("hidden");

      return;
    }

    /*
     * Normal Settings login.
     */
    const authenticated =
      await authenticateSettingsUser();

    if (!authenticated) {

      $("loginPanel")
        .classList.remove("hidden");

      $("createPasswordPanel")
        .classList.add("hidden");

      $("settingsApp")
        .classList.add("hidden");

      return;
    }

    /*
     * Normal authenticated Settings user.
     */
    $("loginPanel")
      .classList.add("hidden");

    $("createPasswordPanel")
      .classList.add("hidden");

    $("settingsUserEmail").textContent =
      state.user.email;

    $("settingsUserRole").textContent =
      state.role;

    applyRolePermissions();

    setupServiceTypeSelector();

    await loadAllInstructors();
    await loadLocations();
    await loadServices();
    await loadAppointments();

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


        await loadAppointments();


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


        await loadAppointments();


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

updateAppointmentsInstructorBanner();
updateEmailsInstructorBanner();
