import React from "react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { createClinicUser, getClinicDoctors, getClinicPatients, getClinicProfiles, getClinicServices, getClinicUsers, saveClinicProfile, updateClinicProfile } from "../services/api";

const pageMeta = {
  dashboard: ["Dashboard", "Good morning. Here's today's clinic overview."],
  appointments: ["Appointments", "Manage and monitor clinic appointments."],
  patients: ["Patients", "Patients associated with this clinic."],
  doctors: ["Doctors", "Doctors registered with this clinic."],
  services: ["Services", "Services offered by this clinic."],
  staff: ["Staff & Users", "Manage dashboard access and roles."],
  reports: ["Reports", "Clinic performance and appointment analytics."],
  settings: ["Settings", "Configure your clinic."],
};

const appointments = [
  ["Ankita Sharma", "AS", "Dental Consultation", "Dr Patel", "24 Aug 2026", "09:00 AM", "CONFIRMED"],
  ["Neeta Deshmukh", "ND", "Health Consultation", "Dr Nikhil", "24 Aug 2026", "10:30 AM", "CONFIRMED"],
  ["Rahul Joshi", "RJ", "Teeth Cleaning", "Dr Sharma", "24 Aug 2026", "12:00 PM", "PENDING"],
  ["Priya Patil", "PP", "Dental Consultation", "Dr Patel", "24 Aug 2026", "03:30 PM", "CONFIRMED"],
  ["Amit Kulkarni", "AK", "Health Consultation", "Dr Nikhil", "24 Aug 2026", "06:00 PM", "CONFIRMED"],
];

function initials(user) {
  const name = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
  if (name) return name.split(/\s+/).slice(0, 2).map((x) => x[0]).join("").toUpperCase();
  return (user?.username || "CA").slice(0, 2).toUpperCase();
}

function Modal({ title, children, onClose, onSave, saveLabel = "Save", saveDisabled = false }) {
  return (
    <div className="modal-backdrop open" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onSave} disabled={saveDisabled}>{saveLabel}</button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, token, logout } = useAuth();
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState(null);
  const [serviceFilter, setServiceFilter] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("");
  const [search, setSearch] = useState("");
  const [staffForm, setStaffForm] = useState({
    username: "", email: "", password: "", firstName: "", lastName: "",
    phone: "", role: "STAFF", clinicId: "1", doctorId: ""
  });
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState("");
  const [staffRefreshKey, setStaffRefreshKey] = useState(0);

  const displayName =
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
    user?.username ||
    "Chetan Admin";
  const role = user?.role || "CLINIC ADMIN";
  const avatar = initials(user);

  function showToast(message) {
    setToast(message);
    window.clearTimeout(window.__clinicToast);
    window.__clinicToast = window.setTimeout(() => setToast(""), 2600);
  }

  function go(next) {
    setPage(next);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const filteredAppointments = useMemo(() => {
    const q = search.trim().toLowerCase();
    return appointments.filter((a) => {
      const matchesService = !serviceFilter || a[2] === serviceFilter;
      const matchesDoctor = !doctorFilter || a[3] === doctorFilter;
      const matchesSearch =
        !q ||
        a[0].toLowerCase().includes(q) ||
        a[2].toLowerCase().includes(q) ||
        a[3].toLowerCase().includes(q);
      return matchesService && matchesDoctor && matchesSearch;
    });
  }, [serviceFilter, doctorFilter, search]);

  return (
    <div className="app">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-logo">+</div>
          <div className="brand-name">Hola MD</div>
        </div>

        <div className="clinic-switcher">
          <small>Current clinic</small>
          <strong>Sunrise Multispeciality</strong>
        </div>

        <div className="nav-section">Overview</div>
        <NavButton active={page === "dashboard"} onClick={() => go("dashboard")} icon="▣">Dashboard</NavButton>

        <div className="nav-section">Clinic Operations</div>
        <NavButton active={page === "appointments"} onClick={() => go("appointments")} icon="◷">Appointments</NavButton>
        <NavButton active={page === "patients"} onClick={() => go("patients")} icon="♙">Patients</NavButton>
        <NavButton active={page === "doctors"} onClick={() => go("doctors")} icon="♧">Doctors</NavButton>
        <NavButton active={page === "services"} onClick={() => go("services")} icon="▤">Services</NavButton>

        <div className="nav-section">Administration</div>
        <NavButton active={page === "staff"} onClick={() => go("staff")} icon="♙">Staff & Users</NavButton>
        <NavButton active={page === "reports"} onClick={() => go("reports")} icon="▥">Reports</NavButton>
        <NavButton active={page === "settings"} onClick={() => go("settings")} icon="⚙">Settings</NavButton>

        <div className="sidebar-bottom">
          <div className="user-mini">
            <div className="avatar">{avatar}</div>
            <div>
              <div className="u-name">{displayName}</div>
              <div className="u-role">{String(role).replaceAll("_", " ")}</div>
            </div>
            <button className="logout-side" onClick={logout} title="Logout">↪</button>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu" onClick={() => setSidebarOpen((v) => !v)}>☰</button>
            <div className="page-heading">
              <h1>{pageMeta[page][0]}</h1>
              <p>{pageMeta[page][1]}</p>
            </div>
          </div>
          <div className="top-actions">
            <div className="search">
              <span>⌕</span>
              <input
                placeholder="Search patients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="icon-btn" onClick={() => showToast("No new notifications")}>♢</button>
            <div className="profile">
              <div className="avatar">{avatar}</div>
              <div className="profile-text">
                <strong>{displayName}</strong>
                <span>{String(role).replaceAll("_", " ")}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="content">
          {page === "dashboard" && (
            <DashboardHome go={go} openModal={setModal} />
          )}

          {page === "appointments" && (
            <Appointments
              rows={filteredAppointments}
              serviceFilter={serviceFilter}
              doctorFilter={doctorFilter}
              setServiceFilter={setServiceFilter}
              setDoctorFilter={setDoctorFilter}
              openModal={setModal}
              showToast={showToast}
            />
          )}

          {page === "patients" && (
            <Patients openModal={setModal} showToast={showToast} clinicId={user?.clinicId || 1} token={token} />
          )}

          {page === "doctors" && (
            <Doctors
              openModal={setModal}
              showToast={showToast}
              clinicId={user?.clinicId || 1}
              token={token}
            />
          )}

          {page === "services" && (
            <Services
              openModal={setModal}
              showToast={showToast}
              clinicId={user?.clinicId || 1}
              token={token}
            />
          )}

          {page === "staff" && (
            <Staff
              openModal={setModal}
              clinicId={user?.clinicId || 1}
              token={token}
              refreshKey={staffRefreshKey}
            />
          )}

          {page === "reports" && <Reports showToast={showToast} />}

          {page === "settings" && <Settings showToast={showToast} clinicId={user?.clinicId || 1} token={token} />}
        </div>
      </main>

      {modal === "appointment" && (
        <Modal title="New Appointment" onClose={() => setModal(null)} onSave={() => { setModal(null); showToast("Appointment created successfully"); }} saveLabel="Create Appointment">
          <div className="form-grid">
            <Field label="Patient Name" placeholder="Enter patient name" />
            <Field label="WhatsApp Number" placeholder="+91..." />
            <Field label="Service" select options={["Dental Consultation", "Teeth Cleaning", "Health Consultation"]} />
            <Field label="Doctor" select options={["Dr Patel", "Dr Sharma", "Dr Nikhil"]} />
            <Field label="Date" type="date" defaultValue="2026-08-24" />
            <Field label="Time" select options={["09:00 AM", "10:30 AM", "12:00 PM", "03:30 PM", "06:00 PM"]} />
          </div>
        </Modal>
      )}

      {modal === "patient" && (
        <Modal title="Add Patient" onClose={() => setModal(null)} onSave={() => { setModal(null); showToast("Patient added"); }} saveLabel="Add Patient">
          <div className="form-grid">
            <Field label="Patient Name" placeholder="Full name" />
            <Field label="WhatsApp Number" placeholder="+91..." />
            <Field label="Email" placeholder="Optional" />
            <Field label="Date of Birth" type="date" />
          </div>
        </Modal>
      )}

      {modal === "doctor" && (
        <Modal title="Add Doctor" onClose={() => setModal(null)} onSave={() => { setModal(null); showToast("Doctor added"); }} saveLabel="Add Doctor">
          <div className="form-grid">
            <Field label="Doctor Name" placeholder="Dr ..." />
            <Field label="Specialization" placeholder="Dentist / MD / etc." />
            <Field label="Email" />
            <Field label="Phone" />
          </div>
        </Modal>
      )}

      {modal === "service" && (
        <Modal title="Add Service" onClose={() => setModal(null)} onSave={() => { setModal(null); showToast("Service added"); }} saveLabel="Add Service">
          <div className="form-grid">
            <Field label="Service Name" placeholder="Consultation" />
            <Field label="Duration" select options={["30 minutes", "45 minutes", "60 minutes"]} />
            <Field label="Price" type="number" placeholder="0" />
            <Field label="Status" select options={["Active", "Inactive"]} />
          </div>
        </Modal>
      )}

      {modal === "staff" && (
        <Modal
          title="Add Staff / User"
          onClose={() => { setModal(null); setStaffError(""); }}
          onSave={async () => {
            setStaffError("");
            if (!token) {
              setStaffError("A clinic-admin login token is required.");
              return;
            }
            const required = ["username", "email", "password", "firstName", "lastName", "phone", "clinicId"];
            if (required.some((key) => !String(staffForm[key]).trim())) {
              setStaffError("Please fill all required fields.");
              return;
            }
            try {
              setStaffLoading(true);
              await createClinicUser({
                username: staffForm.username.trim(),
                email: staffForm.email.trim(),
                password: staffForm.password,
                firstName: staffForm.firstName.trim(),
                lastName: staffForm.lastName.trim(),
                phone: staffForm.phone.trim(),
                role: staffForm.role,
                clinicId: Number(staffForm.clinicId),
                doctorId: staffForm.doctorId ? Number(staffForm.doctorId) : null
              }, token);
              setModal(null);
              setStaffForm({ username:"", email:"", password:"", firstName:"", lastName:"", phone:"", role:"STAFF", clinicId:String(user?.clinicId || 1), doctorId:"" });
              setStaffRefreshKey((value) => value + 1);
              showToast("User created successfully");
            } catch (err) {
              setStaffError(err.message || "Unable to create user.");
            } finally {
              setStaffLoading(false);
            }
          }}
          saveLabel={staffLoading ? "Creating..." : "Create User"}
          saveDisabled={staffLoading}
        >
          {staffError && <div className="auth-error">{staffError}</div>}
          <div className="form-grid">
            <Field label="Username *" value={staffForm.username} onChange={(e) => setStaffForm(v => ({...v, username:e.target.value}))} />
            <Field label="Email *" type="email" value={staffForm.email} onChange={(e) => setStaffForm(v => ({...v, email:e.target.value}))} />
            <Field label="Password *" type="password" value={staffForm.password} onChange={(e) => setStaffForm(v => ({...v, password:e.target.value}))} />
            <Field label="Phone *" value={staffForm.phone} onChange={(e) => setStaffForm(v => ({...v, phone:e.target.value}))} placeholder="+91..." />
            <Field label="First Name *" value={staffForm.firstName} onChange={(e) => setStaffForm(v => ({...v, firstName:e.target.value}))} />
            <Field label="Last Name *" value={staffForm.lastName} onChange={(e) => setStaffForm(v => ({...v, lastName:e.target.value}))} />
            <div className="field"><label>Role *</label><select value={staffForm.role} onChange={(e) => setStaffForm(v => ({...v, role:e.target.value}))}><option>STAFF</option><option>DOCTOR</option><option>CLINIC_ADMIN</option></select></div>
            <Field label="Clinic ID *" type="number" min="1" value={staffForm.clinicId} onChange={(e) => setStaffForm(v => ({...v, clinicId:e.target.value}))} />
            <Field label="Doctor ID" type="number" min="1" value={staffForm.doctorId} onChange={(e) => setStaffForm(v => ({...v, doctorId:e.target.value}))} placeholder="Optional" />
          </div>
        </Modal>
      )}

      {toast && <div className="toast show">{toast}</div>}
    </div>
  );
}

function NavButton({ active, onClick, icon, children }) {
  return (
    <button className={`nav-item ${active ? "active" : ""}`} onClick={onClick}>
      <span className="nav-icon">{icon}</span>{children}
    </button>
  );
}

function Field({ label, select, options = [], ...props }) {
  return (
    <div className="field">
      <label>{label}</label>
      {select ? (
        <select {...props} defaultValue={props.value === undefined ? options[0] : undefined}>
          {options.map((x) => <option key={x}>{x}</option>)}
        </select>
      ) : (
        <input {...props} />
      )}
    </div>
  );
}

function DashboardHome({ go, openModal }) {
  return (
    <section className="page active">
      <div className="welcome">
        <h2>Good morning 👋</h2>
        <p>Here is what's happening at Sunrise Multispeciality today.</p>
      </div>

      <div className="grid-4">
        <Kpi label="Today's Appointments" value="18" footer="↑ 12% vs yesterday" />
        <Kpi label="Pending Appointments" value="4" footer="2 need attention" />
        <Kpi label="Total Patients" value="1,248" footer="↑ 8.4% this month" />
        <Kpi label="Active Doctors" value="7" footer="6 available today" />
      </div>

      <div className="grid-2 mt">
        <div className="card">
          <div className="card-header">
            <div><h3>Today's Schedule</h3><p>Monday, 24 August 2026</p></div>
            <button className="btn btn-light" onClick={() => go("appointments")}>View all</button>
          </div>
          <div className="card-body">
            <div className="schedule-list">
              {appointments.map((a) => (
                <div className="schedule-row" key={a[0]}>
                  <div className="time">{a[5]}</div>
                  <div><div className="patient-name">{a[0]}</div><div className="patient-meta">{a[2]} · {a[3]}</div></div>
                  <span className={`status ${a[6].toLowerCase()}`}>{a[6]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div><h3>Appointments This Week</h3><p>Number of appointments by day</p></div></div>
          <div className="card-body">
            <div className="chart">
              {[62, 78, 53, 86, 69, 39, 16].map((h, i) => (
                <div className="bar-wrap" key={i}>
                  <div className="bar" style={{ height: `${h}%` }} />
                  <span className="bar-label">{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i]}</span>
                </div>
              ))}
            </div>
            <div className="chart-grid"><span>0</span><span>10</span><span>20</span><span>30</span></div>
          </div>
        </div>
      </div>

      <div className="grid-3 mt">
        <QuickCard title="Quick Actions" subtitle="Common clinic operations">
          <button className="btn btn-primary" onClick={() => openModal("appointment")}>+ Appointment</button>
          <button className="btn btn-light" onClick={() => go("patients")}>Patients</button>
          <button className="btn btn-light" onClick={() => go("doctors")}>Doctors</button>
        </QuickCard>
        <QuickCard title="Popular Services" subtitle="This month">
          <InfoLine left="Dental Consultation" right="142" />
          <InfoLine left="Health Consultation" right="96" />
          <InfoLine left="Teeth Cleaning" right="71" />
        </QuickCard>
        <QuickCard title="Doctor Availability" subtitle="Today">
          <InfoLine left="Available" right="6 doctors" positive />
          <InfoLine left="On leave" right="1 doctor" />
          <InfoLine left="Total" right="7 doctors" />
        </QuickCard>
      </div>
    </section>
  );
}

function Kpi({ label, value, footer }) {
  return (
    <div className="card kpi">
      <div className="kpi-top"><span className="kpi-label">{label}</span><span className="kpi-icon">◷</span></div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-footer">{footer}</div>
    </div>
  );
}

function QuickCard({ title, subtitle, children }) {
  return (
    <div className="card">
      <div className="card-header"><div><h3>{title}</h3><p>{subtitle}</p></div></div>
      <div className="card-body"><div className="quick-actions">{children}</div></div>
    </div>
  );
}

function InfoLine({ left, right, positive }) {
  return <div className="info-line"><span>{left}</span><strong className={positive ? "up" : ""}>{right}</strong></div>;
}

function Appointments({ rows, serviceFilter, doctorFilter, setServiceFilter, setDoctorFilter, openModal, showToast }) {
  return (
    <section className="page active">
      <div className="card">
        <div className="card-header">
          <div><h3>Appointments</h3><p>Manage and monitor clinic appointments</p></div>
          <button className="btn btn-primary" onClick={() => openModal("appointment")}>+ New Appointment</button>
        </div>
        <div className="filters">
          <input className="control" type="date" defaultValue="2026-08-24" />
          <select className="control" value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)}>
            <option value="">All Services</option>
            <option>Dental Consultation</option><option>Teeth Cleaning</option><option>Health Consultation</option>
          </select>
          <select className="control" value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value)}>
            <option value="">All Doctors</option><option>Dr Patel</option><option>Dr Sharma</option><option>Dr Nikhil</option>
          </select>
          <select className="control"><option>All Status</option><option>Confirmed</option><option>Pending</option><option>Cancelled</option></select>
          <button className="btn btn-outline" onClick={() => showToast("Filters applied")}>Apply</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Patient</th><th>Service</th><th>Doctor</th><th>Date</th><th>Time</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a[0]}>
                  <td><div className="patient-cell"><div className="small-avatar">{a[1]}</div><div><strong>{a[0]}</strong><span>+91 98765 43210</span></div></div></td>
                  <td>{a[2]}</td><td>{a[3]}</td><td>{a[4]}</td><td>{a[5]}</td>
                  <td><span className={`status ${a[6].toLowerCase()}`}>{a[6]}</span></td>
                  <td><button className="btn btn-light" onClick={() => showToast("Appointment details opened")}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pagination"><span>Showing {rows.length} of 18 appointments</span><div className="page-buttons"><button>‹</button><button className="active">1</button><button>2</button><button>3</button><button>4</button><button>›</button></div></div>
      </div>
    </section>
  );
}

function Patients({ openModal, showToast, clinicId, token }) {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPatients() {
      if (!token) {
        setPatients([]);
        setLoading(false);
        setError("Please log in to view patients.");
        return;
      }

      try {
        setLoading(true);
        setError("");
        const result = await getClinicPatients(clinicId, token);
        if (!cancelled) setPatients(Array.isArray(result) ? result : []);
      } catch (err) {
        if (!cancelled) setError(err.message || "Unable to load patients.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPatients();
    return () => { cancelled = true; };
  }, [clinicId, token]);

  const filteredPatients = patients.filter((patient) => {
    const query = searchTerm.trim().toLowerCase();
    return !query || patient.name?.toLowerCase().includes(query) || patient.phoneNo?.toLowerCase().includes(query);
  });

  return <section className="page active"><div className="card">
    <div className="card-header"><div><h3>Patients</h3><p>Patients associated with this clinic</p></div><button className="btn btn-primary" onClick={() => openModal("patient")}>+ Add Patient</button></div>
    <div className="filters"><input className="control" style={{minWidth:240}} placeholder="Search by name or WhatsApp..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /><button className="btn btn-outline" onClick={() => showToast(`${filteredPatients.length} patients found`)}>Search</button></div>
    <div className="card-body">
      {loading && <p className="muted">Loading patients...</p>}
      {!loading && error && <div className="auth-error">{error}</div>}
      {!loading && !error && filteredPatients.length === 0 && <p className="muted">No patients found for this clinic.</p>}
    </div>
    {!loading && !error && filteredPatients.length > 0 && <div className="table-wrap"><table><thead><tr><th>ID</th><th>Patient</th><th>WhatsApp</th><th>Clinic ID</th><th>Action</th></tr></thead><tbody>
      {filteredPatients.map((patient) => <tr key={patient.id}><td>{patient.id}</td><td><div className="patient-cell"><div className="small-avatar">{initials({ firstName: patient.name })}</div><div><strong>{patient.name}</strong><span>Patient</span></div></div></td><td>{patient.phoneNo}</td><td>{patient.clinicId}</td><td><button className="btn btn-light" onClick={() => showToast("Patient profile opened")}>View</button></td></tr>)}
    </tbody></table></div>}
  </div></section>;
}

function Doctors({ openModal, showToast, clinicId, token }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDoctors() {
      if (!token) {
        setDoctors([]);
        setLoading(false);
        setError("Please log in to view doctors.");
        return;
      }

      try {
        setLoading(true);
        setError("");
        const result = await getClinicDoctors(clinicId, token);
        if (!cancelled) setDoctors(Array.isArray(result) ? result : []);
      } catch (err) {
        if (!cancelled) setError(err.message || "Unable to load doctors.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDoctors();
    return () => { cancelled = true; };
  }, [clinicId, token]);

  return <section className="page active"><div className="card">
    <div className="card-header"><div><h3>Doctors</h3><p>Doctors registered with this clinic</p></div><button className="btn btn-primary" onClick={() => openModal("doctor")}>+ Add Doctor</button></div>
    <div className="card-body">
      {loading && <p className="muted">Loading doctors...</p>}
      {!loading && error && <div className="auth-error">{error}</div>}
      {!loading && !error && doctors.length === 0 && <p className="muted">No doctors found for this clinic.</p>}
      {!loading && !error && <div className="grid-3">{doctors.map((doctor) => <div className="card profile-card" key={doctor.id}>
      <div className="doctor-head"><div className="doctor-avatar">{initials({ firstName: doctor.name })}</div><div><div className="doctor-name">{doctor.name}</div><div className="doctor-speciality">{doctor.specialization}</div></div></div>
      <InfoLine left="Status" right={doctor.isActive ? "Active" : "Inactive"} positive={doctor.isActive} />
      <button className="btn btn-light full-btn" onClick={() => showToast("Doctor profile opened")}>View Profile</button>
    </div>)}</div>}
    </div>
  </div></section>;
}

function Services({ openModal, showToast, clinicId, token }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadServices() {
      if (!token) {
        setServices([]);
        setLoading(false);
        setError("Please log in to view services.");
        return;
      }

      try {
        setLoading(true);
        setError("");
        const result = await getClinicServices(clinicId, token);
        if (!cancelled) setServices(Array.isArray(result) ? result : []);
      } catch (err) {
        if (!cancelled) setError(err.message || "Unable to load services.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadServices();
    return () => { cancelled = true; };
  }, [clinicId, token]);

  return <section className="page active"><div className="card">
    <div className="card-header"><div><h3>Services</h3><p>Services offered by this clinic</p></div><button className="btn btn-primary" onClick={() => openModal("service")}>+ Add Service</button></div>
    <div className="card-body">
      {loading && <p className="muted">Loading services...</p>}
      {!loading && error && <div className="auth-error">{error}</div>}
      {!loading && !error && services.length === 0 && <p className="muted">No services found for this clinic.</p>}
      {!loading && !error && <div className="grid-3">{services.map((service) => <div className="card profile-card" key={service.id}>
      <div className="doctor-head"><div className="service-icon">✚</div><div><div className="doctor-name">{service.name}</div><div className="doctor-speciality">{service.durationMinutes} minutes</div></div></div>
      <InfoLine left="Price" right={`₹${Number(service.price).toFixed(2)}`} />
      <button className="btn btn-light full-btn" onClick={() => showToast("Service details opened")}>Manage</button>
    </div>)}</div>}
    </div>
  </div></section>;
}

function Staff({ openModal, clinicId, token, refreshKey }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      if (!token) {
        setUsers([]);
        setLoading(false);
        setError("Please log in to view staff and users.");
        return;
      }

      try {
        setLoading(true);
        setError("");
        const result = await getClinicUsers(clinicId, token);
        if (!cancelled) setUsers(Array.isArray(result) ? result : []);
      } catch (err) {
        if (!cancelled) setError(err.message || "Unable to load staff and users.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadUsers();
    return () => { cancelled = true; };
  }, [clinicId, token, refreshKey]);

  return <section className="page active"><div className="card">
    <div className="card-header"><div><h3>Staff & Users</h3><p>Manage clinic dashboard access and roles</p></div><button className="btn btn-primary" onClick={() => openModal("staff")}>+ Add User</button></div>
    <div className="card-body">
      {loading && <p className="muted">Loading staff and users...</p>}
      {!loading && error && <div className="auth-error">{error}</div>}
      {!loading && !error && users.length === 0 && <p className="muted">No staff or users found for this clinic.</p>}
      {!loading && !error && <div className="table-wrap"><table><thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Last Login</th><th>Action</th></tr></thead><tbody>
        {users.map((clinicUser) => <tr key={clinicUser.clinicUserId}><td><div className="patient-cell"><div className="small-avatar">{clinicUser.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</div><div><strong>{clinicUser.name}</strong><span>Clinic user</span></div></div></td><td>{clinicUser.email}</td><td>{clinicUser.role}</td><td><span className={`status ${clinicUser.status ? "confirmed" : "cancelled"}`}>{clinicUser.status ? "ACTIVE" : "DISABLED"}</span></td><td>{clinicUser.lastLogin || "Never"}</td><td><button className="btn btn-light">Edit</button></td></tr>)}
      </tbody></table></div>}
    </div>
  </div></section>;
}

function Reports({ showToast }) {
  return <section className="page active"><div className="welcome"><h2>Reports</h2><p>Clinic performance and appointment analytics.</p></div>
    <div className="grid-4"><Kpi label="Appointments" value="412" footer="This month" /><Kpi label="Completed" value="371" footer="90.0% completion" /><Kpi label="Cancelled" value="17" footer="4.1% cancellation" /><Kpi label="New Patients" value="83" footer="↑ 11% vs last month" /></div>
    <div className="card mt"><div className="card-header"><div><h3>Monthly Appointment Report</h3><p>Export detailed data for the selected period.</p></div><button className="btn btn-primary" onClick={() => showToast("Report export started")}>Export CSV</button></div>
      <div className="card-body"><div className="chart report-chart">{[55,61,69,64,75,82,91,88].map((h,i)=><div className="bar-wrap" key={i}><div className="bar" style={{height:`${h}%`}}/><span className="bar-label">{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug"][i]}</span></div>)}</div></div>
    </div>
  </section>;
}

function Settings({ showToast, clinicId, token }) {
  const [form, setForm] = useState({
    name: "Sunrise Multispeciality",
    whatsappNumber: "+91 98765 43210",
    timezone: "Asia/Kolkata",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [clinics, setClinics] = useState([]);
  const [loadingClinics, setLoadingClinics] = useState(true);
  const [editingClinicId, setEditingClinicId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadClinics() {
      if (!token) {
        setClinics([]);
        setLoadingClinics(false);
        setError("Please log in to view clinic profiles.");
        return;
      }

      try {
        setLoadingClinics(true);
        const result = await getClinicProfiles(token);
        if (!cancelled) setClinics(Array.isArray(result) ? result : []);
      } catch (err) {
        if (!cancelled) setError(err.message || "Unable to load clinic profiles.");
      } finally {
        if (!cancelled) setLoadingClinics(false);
      }
    }

    loadClinics();
    return () => { cancelled = true; };
  }, [token]);

  async function handleSave() {
    if (!token) {
      setError("A clinic-admin login token is required.");
      return;
    }

    if (!form.name.trim() || !form.whatsappNumber.trim() || !form.timezone) {
      setError("Please fill all clinic profile fields.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const payload = {
        name: form.name.trim(),
        whatsappNumber: form.whatsappNumber.trim(),
        timezone: form.timezone,
      };
      if (editingClinicId === null) {
        await saveClinicProfile(payload, token);
      } else {
        await updateClinicProfile(editingClinicId, payload, token);
      }
      const result = await getClinicProfiles(token);
      setClinics(Array.isArray(result) ? result : []);
      setEditingClinicId(null);
      showToast(editingClinicId === null ? "Clinic profile saved" : "Clinic profile updated");
    } catch (err) {
      setError(err.message || "Unable to save clinic profile.");
    } finally {
      setSaving(false);
    }
  }

  function editClinic(clinic) {
    setEditingClinicId(clinic.id);
    setForm({
      name: clinic.name || "",
      whatsappNumber: clinic.whatsappNumber || "",
      timezone: clinic.timezone || "Asia/Kolkata",
    });
    setError("");
  }

  function cancelEdit() {
    setEditingClinicId(null);
    setForm({ name: "", whatsappNumber: "", timezone: "Asia/Kolkata" });
    setError("");
  }

  return <section className="page active"><div className="card"><div className="settings-grid">
    <div className="settings-nav"><button className="active">Clinic Profile</button><button>Appointment Settings</button><button>WhatsApp / AI</button><button>Notifications</button><button>Security</button></div>
    <div className="settings-main"><h3>Clinic Profile</h3><p className="muted">Basic information displayed across your clinic dashboard.</p>
      {error && <div className="auth-error">{error}</div>}
      {editingClinicId !== null && <div className="auth-warning">Editing clinic #{editingClinicId}</div>}
      <div className="form-grid mt">
        <Field label="Clinic Name" value={form.name} onChange={(e) => setForm((value) => ({ ...value, name: e.target.value }))} />
        <Field label="Clinic ID" value={clinicId} disabled />
        <Field label="WhatsApp Number" value={form.whatsappNumber} onChange={(e) => setForm((value) => ({ ...value, whatsappNumber: e.target.value }))} />
        <Field label="Timezone" select options={["Asia/Kolkata"]} value={form.timezone} onChange={(e) => setForm((value) => ({ ...value, timezone: e.target.value }))} />
      </div>
      <div className="quick-actions mt">
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editingClinicId === null ? "Save Changes" : "Update Clinic"}</button>
        {editingClinicId !== null && <button className="btn btn-outline" onClick={cancelEdit} disabled={saving}>Cancel Edit</button>}
      </div>
      <div className="mt">
        <h3>Saved Clinic Profiles</h3>
        {loadingClinics && <p className="muted">Loading clinic profiles...</p>}
        {!loadingClinics && clinics.length === 0 && <p className="muted">No clinic profiles found.</p>}
        {!loadingClinics && clinics.length > 0 && <div className="table-wrap"><table><thead><tr><th>ID</th><th>Clinic Name</th><th>WhatsApp Number</th><th>Timezone</th><th>Status</th><th>Created</th><th>Action</th></tr></thead><tbody>
          {clinics.map((clinic) => <tr key={clinic.id}><td>{clinic.id}</td><td><strong>{clinic.name}</strong></td><td>{clinic.whatsappNumber}</td><td>{clinic.timezone}</td><td><span className={`status ${clinic.active ? "confirmed" : "cancelled"}`}>{clinic.active ? "ACTIVE" : "INACTIVE"}</span></td><td>{clinic.createdAt ? new Date(clinic.createdAt).toLocaleDateString() : "-"}</td><td><button className="btn btn-light" onClick={() => editClinic(clinic)}>Edit</button></td></tr>)}
        </tbody></table></div>}
      </div>
    </div>
  </div></div></section>;
}
