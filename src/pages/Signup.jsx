import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { createClinicUser } from "../services/api";

const initialForm = {
  username: "",
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  phone: "",
  role: "STAFF",
  clinicId: "1",
  doctorId: "",
};

export default function Signup({ onLogin, onSignupSuccess }) {
  const { token, isAuthenticated } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function update(e) {
    setForm((current) => ({ ...current, [e.target.name]: e.target.value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!isAuthenticated || !token) {
      setError(
        "This sign-up API requires a Bearer token from a clinic administrator. Please sign in as a clinic admin first."
      );
      return;
    }

    if (
      !form.username ||
      !form.email ||
      !form.password ||
      !form.firstName ||
      !form.lastName ||
      !form.phone ||
      !form.clinicId
    ) {
      setError("Please fill all required fields.");
      return;
    }

    const payload = {
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
      role: form.role,
      clinicId: Number(form.clinicId),
      doctorId: form.doctorId ? Number(form.doctorId) : null,
    };

    try {
      setLoading(true);
      await createClinicUser(payload, token);
      setSuccess("User created successfully. You can now sign in.");
      setTimeout(onSignupSuccess, 900);
    } catch (err) {
      setError(err.message || "Unable to create user.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page signup-page">
      <div className="auth-shell signup-shell">
        <div className="auth-brand">
          <div className="brand-logo">+</div>
          <div>
            <div className="brand-name">ClinicFlow</div>
            <div className="auth-brand-sub">Create clinic dashboard access</div>
          </div>
        </div>

        <div className="auth-card signup-card">
          <div className="auth-title">
            <h1>Sign up</h1>
            <p>Create a staff or doctor user for a clinic.</p>
          </div>

          {!isAuthenticated && (
            <div className="auth-warning">
              Your provided API requires <strong>Authorization: Bearer ...</strong>.
              Sign in first, then return here to create the account.
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}

          <form onSubmit={submit} className="auth-form">
            <div className="form-grid">
              <div className="field">
                <label>Username *</label>
                <input name="username" value={form.username} onChange={update} />
              </div>

              <div className="field">
                <label>Email *</label>
                <input name="email" type="email" value={form.email} onChange={update} />
              </div>

              <div className="field">
                <label>Password *</label>
                <input name="password" type="password" value={form.password} onChange={update} />
              </div>

              <div className="field">
                <label>Phone *</label>
                <input name="phone" value={form.phone} onChange={update} placeholder="+91..." />
              </div>

              <div className="field">
                <label>First Name *</label>
                <input name="firstName" value={form.firstName} onChange={update} />
              </div>

              <div className="field">
                <label>Last Name *</label>
                <input name="lastName" value={form.lastName} onChange={update} />
              </div>

              <div className="field">
                <label>Role *</label>
                <select name="role" value={form.role} onChange={update}>
                  <option value="STAFF">STAFF</option>
                  <option value="DOCTOR">DOCTOR</option>
                  <option value="CLINIC_ADMIN">CLINIC_ADMIN</option>
                </select>
              </div>

              <div className="field">
                <label>Clinic ID *</label>
                <input
                  name="clinicId"
                  type="number"
                  min="1"
                  value={form.clinicId}
                  onChange={update}
                />
              </div>

              <div className="field">
                <label>Doctor ID</label>
                <input
                  name="doctorId"
                  type="number"
                  min="1"
                  value={form.doctorId}
                  onChange={update}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="auth-actions">
              <button type="button" className="btn btn-outline" onClick={onLogin}>
                Back to Login
              </button>
              <button className="btn btn-primary" disabled={loading || !isAuthenticated}>
                {loading ? "Creating..." : "Create User"}
              </button>
            </div>
          </form>
        </div>

        <div className="auth-note">
          API: <code>POST /api/clinic-admin/users</code>
        </div>
      </div>
    </div>
  );
}
