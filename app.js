const cfg = window.BOOKING_CONFIG;

const state = {
  locations: [],
  location: null,
  date: null,
  availability: null,
  rawAvailability: null,
  selectedStart: null,
  selectedEnd: null,
  student: null,
  calendarMonth: null,

  /*
   * Additional instructor-specific questions that
   * the student must answer before booking.
   *
   * Definitions are loaded from the backend.
   * Answers are collected separately when the
   * student submits the information form.
   */
  studentBookingFields: [],
  studentBookingAnswers: [],

services: [],

selectedServicePriceIds: [],
selectedServiceIds: [],

/*
 * Quantity selected for each booking service.
 *
 * Keys are the service's stable booking identifier:
 *   paid service = Stripe Price ID
 *   free service = local services.id
 *
 * Services default to quantity 1. A quantity greater
 * than 1 is only available when the server-provided
 * max_quantity permits it.
 */
selectedServiceQuantities: {},

  studentTimezone:
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    "America/Los_Angeles"
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

function formatTime(iso, timeZone) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timeZone || "America/Phoenix",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(iso));
}

function formatDate(iso, timeZone) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timeZone || "America/Phoenix",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(new Date(iso));
}

function getDateKey(iso, timeZone) {
  const parts =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }
    ).formatToParts(new Date(iso));

  const year =
    parts.find(p => p.type === "year")?.value;

  const month =
    parts.find(p => p.type === "month")?.value;

  const day =
    parts.find(p => p.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function groupAvailabilityByStudentTimezone(days) {
  const grouped = new Map();

  for (const instructorDay of days || []) {
    for (const slot of instructorDay.slots || []) {
      const studentDate =
        getDateKey(
          slot.start,
          state.studentTimezone
        );

      if (!grouped.has(studentDate)) {
        grouped.set(studentDate, {
          date: studentDate,
          label: formatDate(
            slot.start,
            state.studentTimezone
          ),
          has_available: false,
          slots: []
        });
      }

      const studentDay =
        grouped.get(studentDate);

      studentDay.slots.push(slot);

      if (
        !slot.blocked &&
        slot.remaining > 0
      ) {
        studentDay.has_available = true;
      }
    }
  }

  return [...grouped.values()]
    .map(day => ({
      ...day,
      slots: day.slots.sort(
        (a, b) =>
          new Date(a.start).getTime() -
          new Date(b.start).getTime()
      )
    }))
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date)
    );
}

function getInstructorTimezone() {
  return (
    state.instructor?.timezone ||
    state.location?.timezone ||
    "America/Phoenix"
  );
}

function initializeStudentTimezone() {
  const select = $("studentTimezone");

  if (!select) {
    return;
  }

  const supported =
    [...select.options].some(
      option =>
        option.value === state.studentTimezone
    );

  if (!supported) {
    state.studentTimezone =
      "America/Los_Angeles";
  }

  select.value =
    state.studentTimezone;
}

function getBookingRoute() {
  const path = window.location.pathname.replace(/\/+$/, "");

  const match = path.match(
    /\/booking\/book\/([^/]+)\/([^/]+)$/
  );

  if (!match) {
    const params =
      new URLSearchParams(window.location.search);

    return {
      locationSlug:
        params.get("location") ||
        cfg.defaultLocationSlug,

      instructorSlug:
        params.get("instructor")
    };
  }

  return {
    locationSlug: decodeURIComponent(match[1]),
    instructorSlug: decodeURIComponent(match[2])
  };
}

function applyBranding(loc) {
  const root = document.documentElement;

  root.style.setProperty(
    "--primary",
    loc.primary_color || "#FFFFFF"
  );

  root.style.setProperty(
    "--secondary",
    loc.secondary_color || "#000000"
  );

  root.style.setProperty(
    "--accent",
    loc.accent_color || "#FF0000"
  );

  $("brandLogo").src =
    loc.logo_url || "safe-insight-logo.png";

  $("brandLogo").alt =
    "Safe Insight";

  $("brandName").textContent =
    "Safe Insight";

  $("brandSubtitle").textContent =
    "";

  $("footerText").textContent =
    loc.footer_text ||
    "Booking powered by Safe Insight";
}

function formatAddress(address) {
  if (!address) return "";

  const parts = address.split(",").map(part => part.trim());

  if (parts.length >= 3) {
    const street = parts[0];
    const city = parts[parts.length - 2];
    const stateZip = parts[parts.length - 1];

    return `${escapeHtml(street)}<br>${escapeHtml(city)}, ${escapeHtml(stateZip)}`;
  }

  return escapeHtml(address);
}

function renderLocationSummary() {
  const l = state.location;
  const i = state.instructor || {};

  const locationName =
    i.location_name ||
    l.name ||
    "";

  const address =
    i.address ||
    l.address ||
    "";

  const services =
    i.services ||
    "";

  const appointmentLength =
    i.appointment_length_minutes ??
    l.appointment_length_minutes;

  const capacity =
    i.max_students_per_slot ??
    l.max_students_per_slot;

  const formattedAddress =
    escapeHtml(address).replace(/\r?\n/g, "<br>");

  const formattedServices =
    escapeHtml(services).replace(/\r?\n/g, "<br>");

  $("locationSummary").innerHTML = `
    <strong>Instructor:</strong><br>
    ${i.name ? escapeHtml(i.name) : ""}

    <br><br>

    <strong>Location:</strong><br>
    ${escapeHtml(locationName)}<br>
    ${address ? formattedAddress : ""}

    ${services ? `
      <br><br>
      <strong>Services:</strong><br>
      ${formattedServices}
    ` : ""}

    <br><br>

    <strong>Booking:</strong><br>
    Appointment Length: ${appointmentLength} minutes<br>
    Appointment Capacity: ${capacity} student${capacity === 1 ? "" : "s"}
  `;
}

async function loadBookingContext() {
  const route =
    getBookingRoute();

  if (!route.locationSlug) {
    throw new Error(
      "Missing booking location."
    );
  }

  if (!route.instructorSlug) {
    throw new Error(
      "Missing booking instructor."
    );
  }

  /*
   * Public booking context is resolved exclusively
   * through get-availability.
   *
   * The browser no longer reads locations or
   * instructors directly from Supabase.
   */
  const res =
    await fetch(
      `${cfg.functionsBaseUrl}/get-availability?location=${encodeURIComponent(route.locationSlug)}&instructor=${encodeURIComponent(route.instructorSlug)}`,
      {
        headers: {
          "Authorization":
            `Bearer ${cfg.supabaseAnonKey}`
        }
      }
    );

  const json =
    await res.json();

  if (!res.ok) {
    throw new Error(
      json.error ||
      "Unable to load booking information."
    );
  }

  if (
    !json.location ||
    !json.instructor
  ) {
    throw new Error(
      "The booking location or instructor could not be found."
    );
  }

  /*
   * Store only the public-safe location and
   * instructor objects intentionally returned by
   * get-availability.
   */
  state.location =
    json.location;

  state.locations = [
    json.location
  ];

  state.instructor =
    json.instructor;

  state.instructorSlug =
    json.instructor.slug ||
    route.instructorSlug;

  /*
   * Preserve the already-loaded availability response.
   * loadDates() will refresh it when the student
   * proceeds to the date-selection step.
   */
  state.rawAvailability =
    json;

  /*
   * The public Booking Page is now route-specific.
   * It must never build a cross-organization location
   * directory from database records.
   */
  const select =
    $("locationSelect");

  if (select) {
    select.innerHTML =
      `<option value="${escapeAttr(state.location.slug)}">${escapeHtml(state.location.name)}</option>`;

    select.value =
      state.location.slug;

    select.disabled =
      true;

    select.style.display =
      "none";
  }

  applyBranding(
    state.location
  );

  $("brandName").textContent =
    "Safe Insight";

  $("brandSubtitle").textContent =
    state.instructor.name
      ? `with ${state.instructor.name}`
      : "";

  renderLocationSummary();
}

async function loadDates() {
  const i = state.instructor || {};
  const l = state.location || {};

  const bookingHorizon =
    i.booking_horizon_days ??
    l.booking_horizon_days ??
    14;

  const minimumNotice =
    i.minimum_booking_notice_hours ??
    l.minimum_booking_notice_hours ??
    24;

  const cancellationHours =
    i.cancellation_hours ??
    l.cancellation_hours ??
    0;

  const rescheduleHours =
    i.reschedule_hours ??
    l.reschedule_hours ??
    0;

  $("availabilityNote").textContent =
    `Bookings are available for the next ${bookingHorizon} days and must be made at least ${minimumNotice} hours in advance. ` +
    `Cancellation: ${cancellationHours} hours. ` +
    `Reschedule: ${rescheduleHours} hours.`;

  /*
   * loadBookingContext() already loaded the complete
   * get-availability response for this booking route
   * and stored it in state.rawAvailability.
   *
   * Reuse that response instead of making a second
   * network request when Continue is clicked.
   */
  const json =
    state.rawAvailability;

  if (!json) {
    throw new Error(
      "Booking availability has not finished loading."
    );
  }

  /*
   * Additional required questions configured for
   * the currently selected instructor.
   *
   * These definitions come from get-availability
   * and include the stable field ID that will later
   * be submitted with the student's answer.
   */
  state.studentBookingFields =
    Array.isArray(
      json.student_booking_fields
    )
      ? json.student_booking_fields
      : [];

  /*
   * Answers belong to the currently loaded question
   * definitions. Clear any previous answers whenever
   * availability/instructor data is reloaded.
   */
  state.studentBookingAnswers = [];

  state.services =
    json.services || [];


  /*
   * Paid Stripe services continue to be tracked
   * by Stripe Price ID.
   */
  state.selectedServicePriceIds =
    json.allow_customer_service_selection === true
      ? state.services
          .filter(
            service =>
              service.required === true
          )
          .map(
            service =>
              service.price_id
          )
          .filter(Boolean)
      : state.services
          .map(
            service =>
              service.price_id
          )
          .filter(Boolean);


  /*
   * Local free services have no Stripe Price ID,
   * so track them by their local service ID.
   */
  state.selectedServiceIds =
    json.allow_customer_service_selection === true
      ? state.services
          .filter(
            service =>
              service.service_type === "free" &&
              service.required === true
          )
          .map(
            service =>
              service.id
          )
          .filter(Boolean)
      : state.services
          .filter(
            service =>
              service.service_type === "free"
          )
          .map(
            service =>
              service.id
          )
          .filter(Boolean);


  const studentDays =
    groupAvailabilityByStudentTimezone(
      state.rawAvailability.days
    );

  state.availability = {
    ...state.rawAvailability,
    days: studentDays
  };

  const firstAvailable =
    studentDays.find(
      d => d.has_available
    );

  state.date =
    firstAvailable?.date ||
    studentDays[0]?.date ||
    null;

  state.calendarMonth =
    state.date
      ? state.date.slice(0, 7)
      : null;

  renderCalendar();
  renderSelectedDate();
  renderSlots();
}


function renderSelectedDate() {
  const day = state.availability?.days.find(
    d => d.date === state.date
  );

  $("dateDisplay").value = day ? day.label : "";
}


function renderCalendar() {
  const container = $("calendarDays");
  const monthLabel = $("calendarMonth");
  const prev = $("calendarPrev");
  const next = $("calendarNext");

  if (
    !container ||
    !monthLabel ||
    !state.availability?.days?.length ||
    !state.calendarMonth
  ) {
    return;
  }

  const [year, month] = state.calendarMonth.split("-").map(Number);

  const monthStart = new Date(year, month - 1, 1);
  const firstWeekday = monthStart.getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const availabilityByDate = new Map(
    state.availability.days.map(d => [d.date, d])
  );

  const minDate = state.availability.days[0].date;
  const maxDate =
    state.availability.days[state.availability.days.length - 1].date;

  monthLabel.textContent = monthStart.toLocaleDateString(
    "en-US",
    {
      month: "long",
      year: "numeric"
    }
  );

  container.innerHTML = "";

  // Empty cells before the first day of the month
  for (let i = 0; i < firstWeekday; i++) {
    const blank = document.createElement("span");

    blank.className = "calendar-day blank";
    blank.setAttribute("aria-hidden", "true");

    container.appendChild(blank);
  }

  // Actual calendar dates
  for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber++) {
    const date =
      `${year}-${String(month).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;

    const day = availabilityByDate.get(date);

    const button = document.createElement("button");

    button.type = "button";
    button.className = "calendar-day";
    button.textContent = dayNumber;
    button.dataset.date = date;

    // Date isn't within the availability range
    if (date < minDate || date > maxDate || !day) {
      button.disabled = true;
      button.classList.add("outside-range");
      button.setAttribute(
        "aria-label",
        `${date}, unavailable`
      );
    }

    // Date exists but has no available slots
    else if (!day.has_available) {
      button.disabled = true;
      button.classList.add("unavailable");
      button.setAttribute(
        "aria-label",
        `${day.label}, no availability`
      );
    }

    // Date can be selected
    else {
      button.classList.add("available");

      button.setAttribute(
        "aria-label",
        day.label
      );

      button.addEventListener(
        "click",
        () => selectDate(date)
      );
    }

    // Currently selected date
    if (date === state.date) {
      button.classList.add("selected");
    }

    container.appendChild(button);
  }

  const minMonth = minDate.slice(0, 7);
  const maxMonth = maxDate.slice(0, 7);

  prev.disabled = state.calendarMonth <= minMonth;
  next.disabled = state.calendarMonth >= maxMonth;
}


function selectDate(date) {
  const day = state.availability?.days.find(
    d => d.date === date
  );

  if (!day || !day.has_available) {
    return;
  }

  state.date = date;
  state.calendarMonth = date.slice(0, 7);

  // Reset any previously selected time range
  state.selectedStart = null;
  state.selectedEnd = null;

  renderCalendar();
  renderSelectedDate();
  renderSlots();
}


function changeCalendarMonth(delta) {
  if (!state.calendarMonth) {
    return;
  }

  const [year, month] =
    state.calendarMonth.split("-").map(Number);

  const nextMonth =
    new Date(year, month - 1 + delta, 1);

  state.calendarMonth =
    `${nextMonth.getFullYear()}-${String(
      nextMonth.getMonth() + 1
    ).padStart(2, "0")}`;

  renderCalendar();
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
       ${formatTime(s.start, state.studentTimezone)}<br><small>${s.remaining} space${s.remaining === 1 ? "" : "s"}</small>
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
  if (state.selectedStart === null) {
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

  const buttons = [...document.querySelectorAll(".slot")];
  buttons.forEach((b, i) => {
    b.classList.toggle("start", i === state.selectedStart);
    b.classList.toggle("selected", state.selectedStart !== null && i >= state.selectedStart && i <= state.selectedEnd);
  });

  if (state.selectedStart !== null) {
    const first = slots[state.selectedStart], last = slots[state.selectedEnd];
    $("selectionSummary").textContent =
      `Selected: ${formatTime(first.start, state.studentTimezone)} – ${formatTime(last.end, state.studentTimezone)}`;
    $("toInfoBtn").disabled = false;
  } else {
    $("selectionSummary").textContent = "";
    $("toInfoBtn").disabled = true;
  }
}

function renderStudentBookingFields() {
  const container =
    $("studentBookingFields");

  if (!container) {
    return;
  }

  const fields =
    Array.isArray(state.studentBookingFields)
      ? state.studentBookingFields
      : [];

  if (!fields.length) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML =
    fields
      .map(field => {

        const fieldId =
          String(field?.id || "");

        const question =
          String(field?.question || "").trim();

        if (!fieldId || !question) {
          return "";
        }

        return `
          <div
            class="student-booking-field"
            style="margin-top:15px;"
          >
            <label
              for="studentBookingField_${escapeAttr(fieldId)}"
            >
              ${escapeHtml(question)}
            </label>

            <input
              id="studentBookingField_${escapeAttr(fieldId)}"
              type="text"
              maxlength="1000"
              required
              data-student-booking-field-id="${escapeAttr(fieldId)}"
            >
          </div>
        `;
      })
      .join("");
}


function renderBookingServices() {
  const container =
    $("bookingServices");

  const list =
    $("bookingServicesList");

  const total =
    $("bookingServicesTotal");

  if (
    !container ||
    !list ||
    !total
  ) {
    return;
  }


  if (!state.services.length) {
    container.classList.add("hidden");
    list.innerHTML = "";
    total.textContent = "";
    return;
  }


  const allowSelection =
    state.rawAvailability
      ?.allow_customer_service_selection === true;


  container.classList.remove("hidden");


  list.innerHTML =
    state.services
      .map(service => {

        const amount =
          new Intl.NumberFormat(
            "en-US",
            {
              style: "currency",
              currency:
                String(
                  service.currency || "usd"
                ).toUpperCase()
            }
          ).format(
            (service.price_cents || 0) / 100
          );


        const isFreeService =
          service.service_type === "free";


        const serviceValue =
          isFreeService
            ? service.id
            : service.price_id;


        const checked =
          isFreeService
            ? state.selectedServiceIds
                .includes(service.id)
            : state.selectedServicePriceIds
                .includes(service.price_id);


        /*
         * max_quantity comes from get-availability.
         *
         * Treat any missing or invalid value as 1 so
         * existing services retain their original
         * single-quantity behavior.
         */
        const maxQuantity =
          Number.isInteger(
            Number(service.max_quantity)
          ) &&
          Number(service.max_quantity) >= 1
            ? Number(service.max_quantity)
            : 1;


        /*
         * Preserve the student's current quantity
         * whenever this function re-renders.
         */
        let selectedQuantity =
          Number(
            state.selectedServiceQuantities[
              serviceValue
            ] ?? 1
          );


        if (
          !Number.isInteger(selectedQuantity) ||
          selectedQuantity < 1
        ) {
          selectedQuantity = 1;
        }


        selectedQuantity =
          Math.min(
            selectedQuantity,
            maxQuantity
          );


        state.selectedServiceQuantities[
          serviceValue
        ] = selectedQuantity;


        /*
         * Only show a quantity control when:
         *
         * 1. This service actually permits more than one.
         * 2. The service is currently selected.
         *
         * Services with max_quantity = 1 retain the
         * existing clean single-service appearance.
         */
        const quantityControl =
          maxQuantity > 1 &&
          checked
            ? `
              <div
                style="
                  margin-top:12px;
                  display:flex;
                  align-items:center;
                  gap:10px;
                  flex-wrap:wrap;
                "
              >
                <label
                  for="serviceQuantity_${escapeAttr(serviceValue)}"
                  style="
                    font-weight:600;
                    margin:0;
                  "
                >
                  Quantity:
                </label>

                <select
                  id="serviceQuantity_${escapeAttr(serviceValue)}"
                  data-booking-service-quantity
                  data-service-value="${escapeAttr(serviceValue)}"
                  style="
                    width:auto;
                    min-width:70px;
                    margin:0;
                  "
                >
                  ${
                    Array.from(
                      {
                        length: maxQuantity
                      },
                      (_, index) =>
                        index + 1
                    )
                      .map(quantity => `
                        <option
                          value="${quantity}"
                          ${
                            quantity === selectedQuantity
                              ? "selected"
                              : ""
                          }
                        >
                          ${quantity}
                        </option>
                      `)
                      .join("")
                  }
                </select>

                <span class="muted">
                  Maximum ${maxQuantity} per booking
                </span>
              </div>
            `
            : "";


        return `
          <div
            style="
              margin:12px 0;
              padding:12px;
              border:1px solid #ddd;
              border-radius:6px;
            "
          >
            ${
              allowSelection
                ? `
                  <label
                    style="
                      display:flex;
                      align-items:center;
                      justify-content:flex-start;
                      gap:8px;
                      width:fit-content;
                      cursor:pointer;
                    "
                  >
                    <input
                      type="checkbox"
                      data-booking-service
                      data-service-type="${isFreeService ? "free" : "paid"}"
                      value="${escapeAttr(serviceValue)}"
                      ${checked ? "checked" : ""}
                      ${service.required === true ? "disabled" : ""}
                      style="
                        width:auto;
                        margin:0;
                        flex:0 0 auto;
                      "
                    >
                    <strong>
                      ${escapeHtml(service.product_name)}
                      ${
                        service.required === true
                          ? " (Required)"
                          : ""
                      }
                    </strong>
                  </label>
                `
                : `
                  <strong>${escapeHtml(service.product_name)}</strong>
                `
            }

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

            <div style="margin-top:5px;">
              ${escapeHtml(amount)}
              ${
                maxQuantity > 1
                  ? " each"
                  : ""
              }
            </div>

            ${quantityControl}
          </div>
        `;
      })
      .join("");


  const selectedServices =
    state.services.filter(
      service => {

        if (
          service.service_type === "free"
        ) {
          return state.selectedServiceIds
            .includes(service.id);
        }


        return state.selectedServicePriceIds
          .includes(service.price_id);
      }
    );


  /*
   * Quantity-aware displayed total.
   */
  const totalCents =
    selectedServices.reduce(
      (sum, service) => {

        const serviceValue =
          service.service_type === "free"
            ? service.id
            : service.price_id;


        const quantity =
          Number(
            state.selectedServiceQuantities[
              serviceValue
            ] ?? 1
          );


        return (
          sum +
          (
            Number(service.price_cents || 0) *
            quantity
          )
        );
      },
      0
    );


  const currency =
    selectedServices[0]?.currency ||
    state.services[0]?.currency ||
    "usd";


  total.textContent =
    `Total: ${
      new Intl.NumberFormat(
        "en-US",
        {
          style: "currency",
          currency:
            String(currency).toUpperCase()
        }
      ).format(totalCents / 100)
    }`;
}


$("bookingServicesList").addEventListener(
  "change",
  event => {

    /*
     * Handle quantity changes separately from
     * service checkbox changes.
     */
    const quantitySelect =
      event.target.closest(
        "[data-booking-service-quantity]"
      );


    if (quantitySelect) {

      const serviceValue =
        quantitySelect.dataset.serviceValue;


      const service =
        state.services.find(
          item => {

            const itemValue =
              item.service_type === "free"
                ? item.id
                : item.price_id;

            return (
              String(itemValue) ===
              String(serviceValue)
            );
          }
        );


      if (!service) {
        return;
      }


      const maxQuantity =
        Number.isInteger(
          Number(service.max_quantity)
        ) &&
        Number(service.max_quantity) >= 1
          ? Number(service.max_quantity)
          : 1;


      let quantity =
        Number(quantitySelect.value);


      if (
        !Number.isInteger(quantity) ||
        quantity < 1
      ) {
        quantity = 1;
      }


      quantity =
        Math.min(
          quantity,
          maxQuantity
        );


      state.selectedServiceQuantities[
        serviceValue
      ] = quantity;


      renderBookingServices();

      return;
    }


    const checkbox =
      event.target.closest(
        "[data-booking-service]"
      );


    if (!checkbox) {
      return;
    }


    const checkedServices =
      [...document.querySelectorAll(
        "[data-booking-service]:checked"
      )];


    /*
     * Paid services continue to use their
     * Stripe Price IDs.
     */
    state.selectedServicePriceIds =
      checkedServices
        .filter(
          input =>
            input.dataset.serviceType === "paid"
        )
        .map(
          input =>
            input.value
        )
        .filter(Boolean);


    /*
     * Free services use their local
     * services.id UUID instead.
     */
    state.selectedServiceIds =
      checkedServices
        .filter(
          input =>
            input.dataset.serviceType === "free"
        )
        .map(
          input =>
            input.value
        )
        .filter(Boolean);


    /*
     * A newly selected service always has at
     * least quantity 1.
     *
     * Do not delete an existing quantity when
     * unchecked so a temporary uncheck/recheck
     * during this booking does not unexpectedly
     * reset the student's choice.
     */
    checkedServices.forEach(
      input => {

        if (
          !state.selectedServiceQuantities[
            input.value
          ]
        ) {
          state.selectedServiceQuantities[
            input.value
          ] = 1;
        }
      }
    );


    renderBookingServices();
  }
);


  "change",
  event => {

    const checkbox =
      event.target.closest(
        "[data-booking-service]"
      );

    if (!checkbox) {
      return;
    }


    const checkedServices =
      [...document.querySelectorAll(
        "[data-booking-service]:checked"
      )];


    /*
     * Paid services continue to use their
     * Stripe Price IDs.
     */
    state.selectedServicePriceIds =
      checkedServices
        .filter(
          input =>
            input.dataset.serviceType === "paid"
        )
        .map(
          input =>
            input.value
        )
        .filter(Boolean);


    /*
     * Free services use their local
     * services.id UUID instead.
     */
    state.selectedServiceIds =
      checkedServices
        .filter(
          input =>
            input.dataset.serviceType === "free"
        )
        .map(
          input =>
            input.value
        )
        .filter(Boolean);


    renderBookingServices();
  }
);


function buildReview() {
  const day = state.availability.days.find(d => d.date === state.date);
  const first = day.slots[state.selectedStart];
  const last = day.slots[state.selectedEnd];
  const l = state.location;

  const instructor = state.instructor || {};

  const reviewLocationName =
    instructor.location_name ||
    l.name ||
    "";

  const reviewAddress =
    instructor.address ||
    l.address ||
    "";

  const bookingFieldReview =
    state.studentBookingAnswers
      .map(answer => {

        const field =
          state.studentBookingFields.find(
            item =>
              String(item?.id) ===
              String(answer?.field_id)
          );

        if (!field) {
          return "";
        }

        return `
          <br><br>
          <strong>${escapeHtml(field.question)}</strong><br>
          ${escapeHtml(answer.answer)}
        `;
      })
      .join("");

  $("review").innerHTML = `
    <strong>${escapeHtml(reviewLocationName)}</strong><br>
    ${instructor.name ? `Instructor: ${escapeHtml(instructor.name)}<br>` : ""}
${formatDate(first.start, state.studentTimezone)}<br>
${formatTime(first.start, state.studentTimezone)} – ${formatTime(last.end, state.studentTimezone)}<br>
    ${reviewAddress ? escapeHtml(reviewAddress) + "<br>" : ""}
    
    <hr>
    <strong>Student</strong><br>
    ${escapeHtml(state.student.fullName)}<br>
    ${escapeHtml(state.student.phone)}<br>
    ${escapeHtml(state.student.email)}
    ${bookingFieldReview}
  `;

  const selectedServices =
    state.services.filter(
      service => {

        if (
          service.service_type === "free"
        ) {
          return state.selectedServiceIds
            .includes(service.id);
        }


        return state.selectedServicePriceIds
          .includes(service.price_id);
      }
    );

  const selectedTotalCents =
    selectedServices.reduce(
      (sum, service) =>
        sum + Number(service.price_cents || 0),
      0
    );

  if (
    l.payment_required &&
    selectedTotalCents > 0
  ) {
    $("paymentNotice").textContent =
      "Payment will be collected securely before the booking is finalized.";

    $("paymentNotice").classList.remove("hidden");
  } else {
    $("paymentNotice").classList.add("hidden");
  }
}

$("studentTimezone").addEventListener(
  "change",
  e => {
    state.studentTimezone =
      e.target.value ||
      "America/Los_Angeles";

    state.selectedStart = null;
    state.selectedEnd = null;

    if (state.rawAvailability?.days?.length) {
      const studentDays =
        groupAvailabilityByStudentTimezone(
          state.rawAvailability.days
        );

      state.availability = {
        ...state.rawAvailability,
        days: studentDays
      };

      const firstAvailable =
        studentDays.find(
          d => d.has_available
        );

      state.date =
        firstAvailable?.date ||
        studentDays[0]?.date ||
        null;

      state.calendarMonth =
        state.date
          ? state.date.slice(0, 7)
          : null;

      renderCalendar();
      renderSelectedDate();
      renderSlots();
    }
  }
);

$("toDateBtn").addEventListener(
  "click",
  async () => {

    try {

      /*
       * loadDates() now processes the availability
       * response already loaded by loadBookingContext().
       *
       * No second network request is made.
       */
      await loadDates();

      showStep(2);

    } catch (err) {

      showError(
        err.message
      );

    }

  }
);
$("calendarPrev").addEventListener(
  "click",
  () => changeCalendarMonth(-1)
);

$("calendarNext").addEventListener(
  "click",
  () => changeCalendarMonth(1)
);
$("toInfoBtn").addEventListener(
  "click",
  () => {

    renderStudentBookingFields();

    showStep(3);
  }
);

$("studentForm").addEventListener("submit", e => {
  e.preventDefault();

  state.student = {
    fullName: $("fullName").value.trim(),
    phone: $("phone").value.trim(),
    email: $("email").value.trim()
  };

  /*
   * Capture the student's answers using the stable
   * booking-field IDs supplied by the backend.
   *
   * Do not trust or submit question text from the
   * browser. create-booking will later resolve the
   * authoritative question text by field_id.
   */
  state.studentBookingAnswers =
    [...document.querySelectorAll(
      "[data-student-booking-field-id]"
    )]
      .map(input => ({
        field_id:
          input.dataset.studentBookingFieldId,

        answer:
          input.value.trim()
      }));

  buildReview();
  renderBookingServices();

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
  instructor_slug: state.instructorSlug,
  start_time: first.start,
  end_time: last.end,
  student: state.student,
  student_timezone: state.studentTimezone,

  /*
   * Additional required Student Booking Field answers.
   *
   * Only the stable field ID and the student's answer
   * are submitted. create-booking independently loads
   * the authoritative question definitions.
   */
  student_booking_answers:
    state.studentBookingAnswers,

  /*
   * Paid services are identified by their
   * Stripe Price IDs.
   */
  selected_service_price_ids:
    state.selectedServicePriceIds,

  /*
   * Local free services have no Stripe Price ID,
   * so identify them by services.id instead.
   */
  selected_service_ids:
    state.selectedServiceIds
})
});

const responseText = await res.text();

console.log("CREATE-BOOKING STATUS:", res.status);
console.log("CREATE-BOOKING RESPONSE:", responseText);

let json = {};
try {
  json = JSON.parse(responseText);
} catch (parseError) {
  console.error("CREATE-BOOKING JSON PARSE ERROR:", parseError);
}

if (!res.ok) {
  throw new Error(
    json.error ||
    responseText ||
    "The booking could not be completed."
  );
}

    if (json.checkout_url) {
      window.location.href = json.checkout_url;
      return;
    }

    $("bookingApp").querySelectorAll(".step-panel").forEach(p => p.classList.add("hidden"));
    $("success").classList.remove("hidden");
    $("successText").innerHTML =
      `Your appointment at ${escapeHtml(state.location.name)} is confirmed for<br>` +
      `${formatDate(first.start, state.studentTimezone)}<br>` +
      `${formatTime(first.start, state.studentTimezone)} – ${formatTime(last.end, state.studentTimezone)}`;
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
    /*
     * Resolve the requested public booking route through
     * the server-controlled public booking boundary.
     *
     * No direct browser access to locations or instructors
     * is required.
     */
    await loadBookingContext();

    initializeStudentTimezone();

    $("loading").classList.add("hidden");
    $("bookingApp").classList.remove("hidden");
    showStep(1);
  } catch (err) {
    showError(err.message);
  }
})();
