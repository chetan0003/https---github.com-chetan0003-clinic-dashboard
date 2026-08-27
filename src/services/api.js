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
    const message =
      data?.message ||
      data?.error ||
      (typeof data === "string" && data) ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
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
  });
}

export function createClinicDoctor(clinicId, payload, token) {
  return request(`/api/dashboard/clinics/${clinicId}/doctors`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export function getClinicServices(clinicId, token) {
  return request(`/api/dashboard/clinics/${clinicId}/services`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function createClinicService(clinicId, payload, token) {
  return request(`/api/dashboard/clinics/${clinicId}/services`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
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
  });
}

export function getClinicPatients(clinicId, token) {
  return request(`/api/dashboard/patient?clinicId=${clinicId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function getClinicDashboard(clinicId, token) {
  return request(`/api/dashboard/${clinicId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
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

export { API_BASE_URL };
