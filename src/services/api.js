const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    if (response.status === 401) {
      window.dispatchEvent(new Event("clinicflow:unauthorized"));
    }
    const message =
      data?.message ||
      data?.error ||
      (typeof data === "string" && data) ||
      `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.code = data?.code || "UNKNOWN";
    error.status = response.status;
    throw error;
  }

  return data;
}

function unwrapApiData(payload) {
  if (!payload || typeof payload !== "object") {
    return payload;
  }

  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.clinic)) return payload.clinic;
  if (Array.isArray(payload.clinics)) return payload.clinics;
  if (Array.isArray(payload.content)) return payload.content;
  if (Array.isArray(payload.items)) return payload.items;

  if (payload.data && typeof payload.data === "object") {
    if (Array.isArray(payload.data.clinic)) return payload.data.clinic;
    if (Array.isArray(payload.data.clinics)) return payload.data.clinics;
    if (Array.isArray(payload.data.content)) return payload.data.content;
    if (Array.isArray(payload.data.items)) return payload.data.items;
    return payload.data;
  }

  return payload;
}

export function login(username, password) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function createClinicUser(payload, token) {
  return request("/api/clinic-admin/users", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export function getClinicDoctors(clinicId, token) {
  return request(`/api/dashboard/clinics/${clinicId}/doctors`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).then((payload) => unwrapApiData(payload));
}

export function createClinicDoctor(clinicId, payload, token) {
  return request(`/api/dashboard/clinics/${clinicId}/doctors`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  }).then((payload) => {
    if (payload && typeof payload === "object") {
      if (payload.data && typeof payload.data === "object") return payload.data;
      if (payload.doctor) return payload.doctor;
    }
    return payload;
  });
}

export function updateClinicDoctor(clinicId, doctorId, payload, token) {
  return request(`/api/dashboard/clinics/${clinicId}/doctors/${doctorId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  }).then((response) => {
    if (response && typeof response === "object") {
      if (response.data && typeof response.data === "object") return response.data;
      if (response.doctor) return response.doctor;
    }
    return response;
  });
}

export function getDoctorServices(clinicId, token) {
  return request(`/api/n8n/clinics/${clinicId}/services`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function getClinicServices(clinicId, token, doctorId) {
  const query = doctorId ? `?doctorId=${encodeURIComponent(doctorId)}` : "";
  return request(`/api/dashboard/clinics/${clinicId}/services${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).then((payload) => unwrapApiData(payload));
}

export function createClinicService(clinicId, payload, token) {
  return request(`/api/dashboard/clinics/${clinicId}/services`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  }).then((payload) => {
    if (payload && typeof payload === "object") {
      if (payload.data && typeof payload.data === "object") return payload.data;
      if (payload.service) return payload.service;
      if (payload.services) return payload.services;
    }
    return payload;
  });
}

export function getClinicUsers(clinicId, token) {
  return request(`/api/clinic-admin/users/${clinicId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function getUserClinics(username, token) {
  return request(`/api/users?userName=${encodeURIComponent(username)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function getClinicProfiles(token) {
  return request("/api/dashboard/clinics", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).then((payload) => unwrapApiData(payload));
}

export function getClinicPatients(clinicId, token) {
  return request(`/api/dashboard/patient?clinicId=${clinicId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).then((payload) => unwrapApiData(payload));
}

export function getClinicDashboard(clinicId, token) {
  return request(`/api/dashboard/${clinicId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function getClinicHolidays(clinicId, token) {
  return request(`/api/dashboard/clinics/${clinicId}/holidays`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).then((payload) => unwrapApiData(payload));
}

export function createClinicHoliday(clinicId, payload, token) {
  return request(`/api/dashboard/clinics/${clinicId}/holidays/create`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      holidayDate: payload.holidayDate,
      name: payload.name,
    }),
  });
}

export function getClinicAppointments(clinicId, filters, token) {
  const query = new URLSearchParams();
  if (filters.from) query.set("from", filters.from);
  if (filters.to) query.set("to", filters.to);
  if (filters.doctorId) query.set("doctorId", filters.doctorId);
  if (filters.serviceId) query.set("serviceId", filters.serviceId);
  if (filters.status) query.set("status", filters.status);

  return request(`/api/dashboard/clinics/${clinicId}/appointments?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).then((payload) => unwrapApiData(payload));
}

export function updateAppointmentStatus(appointmentId, status, token) {
  return request(`/api/dashboard/appointments/${appointmentId}/status`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  }).then((payload) => {
    if (payload && typeof payload === "object") {
      if (payload.data && typeof payload.data === "object") return payload.data;
      if (payload.appointment) return payload.appointment;
    }
    return payload;
  });
}

export function cancelAppointment(appointmentId, token) {
  return request(`/api/appointments/${appointmentId}/cancel`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).then((payload) => {
    if (payload && typeof payload === "object") {
      if (payload.data && typeof payload.data === "object") return payload.data;
      if (payload.appointment) return payload.appointment;
    }
    return payload;
  });
}

export function saveClinicProfile(payload, token) {
  return request("/api/dashboard/clinics", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export function updateClinicProfile(clinicId, payload, token) {
  return request(`/api/dashboard/clinics/${clinicId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export function upsertClinicWorkingHours(clinicId, payload, token) {
  return request(`/api/dashboard/clinics/${clinicId}/working-hours`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export function getDoctorAvailability(clinicId, doctorId, token) {
  return request(`/api/dashboard/clinics/${clinicId}/doctors/${doctorId}/availability`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).then((payload) => unwrapApiData(payload));
}

export function saveDoctorAvailability(clinicId, doctorId, payload, token) {
  return request(`/api/dashboard/clinics/${clinicId}/doctors/${doctorId}/availability`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  }).then((payload) => {
    if (payload && typeof payload === "object") {
      if (payload.data && typeof payload.data === "object") return payload.data;
      if (payload.availability) return payload.availability;
    }
    return payload;
  });
}

export { API_BASE_URL };
