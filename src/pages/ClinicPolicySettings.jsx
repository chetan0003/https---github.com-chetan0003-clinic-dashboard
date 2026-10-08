import React, { useEffect, useState } from "react";
import {
  updateClinicPolicy,
  activateClinicPolicy,
  createClinicPolicy,
  deactivateClinicPolicy,
  getClinicPoliciesByCategory,
  getClinicPolicy,
  getClinicPolicyVersions,
  rollbackClinicPolicy,
  validateClinicPolicy,
} from "../services/api";

const categories = [
  { id: "APPOINTMENT", label: "Appointment", icon: "▦" },
  { id: "PAYMENT", label: "Payment", icon: "▤" },
  { id: "QUEUE", label: "Queue", icon: "♧" },
  { id: "PATIENT_REGISTRATION", label: "Patient Registration", icon: "♙" },
  { id: "COMMUNICATION", label: "Communication", icon: "▱" },
  { id: "WORKING_HOURS", label: "Working Hours", icon: "◷" },
];

const defaultAppointmentConfig = {
  bookingMode: "BOTH",
  advanceBookingDays: 30,
  minimumNoticeMinutes: 60,
  maxAppointmentsPerPatientPerDay: 2,
  defaultAppointmentDurationMinutes: 15,
  slotIntervalMinutes: 15,
  bufferMinutes: 5,
  allowWalkIns: true,
  allowCancellation: true,
  cancellationCutoffHours: 4,
  allowRescheduling: true,
  rescheduleCutoffHours: 2,
  noShowAfterMinutes: 15,
  enableWaitlist: true,
  requireConfirmation: true,
};

const appointmentFields = [
  { key: "bookingMode", label: "Booking Mode", type: "select", options: [["ONLINE_ONLY", "Online only"], ["STAFF_ONLY", "Staff only"], ["BOTH", "Both (Online + Staff)"]] },
  { key: "advanceBookingDays", label: "Advance Booking Window", type: "number", suffix: "days", min: 0 },
  { key: "minimumNoticeMinutes", label: "Minimum Booking Notice", type: "number", suffix: "minutes", min: 0 },
  { key: "maxAppointmentsPerPatientPerDay", label: "Maximum Appointments per Patient per Day", type: "number", min: 1 },
  { key: "defaultAppointmentDurationMinutes", label: "Default Appointment Duration", type: "number", suffix: "minutes", min: 1 },
  { key: "slotIntervalMinutes", label: "Slot Interval", type: "number", suffix: "minutes", min: 1 },
  { key: "bufferMinutes", label: "Buffer Between Appointments", type: "number", suffix: "minutes", min: 0 },
  { key: "allowWalkIns", label: "Allow Walk-in Appointments", type: "toggle", group: "Walk-in Appointments" },
  { key: "allowCancellation", label: "Allow Cancellation", type: "toggle", group: "Cancellation & Rescheduling" },
  { key: "cancellationCutoffHours", label: "Cancellation Cutoff", type: "number", suffix: "hours", min: 0, group: "Cancellation & Rescheduling" },
  { key: "allowRescheduling", label: "Allow Rescheduling", type: "toggle", group: "Cancellation & Rescheduling" },
  { key: "rescheduleCutoffHours", label: "Rescheduling Cutoff", type: "number", suffix: "hours", min: 0, group: "Cancellation & Rescheduling" },
  { key: "noShowAfterMinutes", label: "Mark as No-show After", type: "number", suffix: "minutes", min: 0, group: "No-show Handling" },
  { key: "enableWaitlist", label: "Enable Waitlist", type: "toggle", group: "Waitlist" },
  { key: "requireConfirmation", label: "Require Confirmation", type: "toggle", group: "Appointment Confirmation" },
];

function asList(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.content)) return value.content;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.versions)) return value.versions;
  if (Array.isArray(value?.policies)) return value.policies;
  return [];
}

function policyId(policy) {
  return policy?.policyId ?? policy?.id;
}

function policyStatus(policy) {
  return policy?.status || (policy?.active ? "ACTIVE" : "DRAFT");
}

function PolicyConfigEditor({ category, config, setConfig, jsonText, setJsonText, jsonError, setJsonError }) {
  if (category !== "APPOINTMENT") {
    return <div className="clinic-policy-json-editor">
      <div className="clinic-policy-group-heading"><h4>Policy Configuration</h4><p>Enter the category configuration as JSON.</p></div>
      <textarea
        className="clinic-policy-json"
        value={jsonText}
        spellCheck="false"
        onChange={(event) => {
          setJsonText(event.target.value);
          try {
            const parsed = JSON.parse(event.target.value || "{}");
            if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") throw new Error("Policy config must be a JSON object.");
            setConfig(parsed);
            setJsonError("");
          } catch (err) {
            setJsonError(err.message || "Enter a valid JSON object.");
          }
        }}
        aria-label="Policy configuration JSON"
      />
      {jsonError && <div className="auth-error">{jsonError}</div>}
    </div>;
  }

  const groups = ["Booking Settings", "Cancellation & Rescheduling", "Walk-in Appointments", "No-show Handling", "Waitlist", "Appointment Confirmation"];
  return <div className="clinic-policy-appointment-fields">
    {groups.map((group) => {
      const fields = appointmentFields.filter((field) => (field.group || "Booking Settings") === group);
      return <section className="clinic-policy-config-group" key={group}>
        <h4>{group}</h4>
        <div className="clinic-policy-config-grid">
          {fields.map((field) => <div className="clinic-policy-config-field" key={field.key}>
            {field.type === "toggle" ? <label className="clinic-policy-toggle"><span>{field.label}</span><input type="checkbox" checked={Boolean(config[field.key])} onChange={(event) => setConfig((value) => ({ ...value, [field.key]: event.target.checked }))} /></label> : <>
              <label htmlFor={`policy-${field.key}`}>{field.label}</label>
              {field.type === "select" ? <select id={`policy-${field.key}`} value={config[field.key] ?? "BOTH"} onChange={(event) => setConfig((value) => ({ ...value, [field.key]: event.target.value }))}>{field.options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select> : <div className="clinic-policy-number-field"><input id={`policy-${field.key}`} type="number" min={field.min} value={config[field.key] ?? 0} onChange={(event) => setConfig((value) => ({ ...value, [field.key]: Number(event.target.value) }))} />{field.suffix && <span>{field.suffix}</span>}</div>}
            </>}
          </div>)}
        </div>
      </section>;
    })}
  </div>;
}

export default function ClinicPolicySettings({ clinicId, token, showToast }) {
  const [category, setCategory] = useState("APPOINTMENT");
  const [policies, setPolicies] = useState([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState("");
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [policyCode, setPolicyCode] = useState("APPOINTMENT");
  const [policyName, setPolicyName] = useState("Appointment Booking Policy");
  const [changeReason, setChangeReason] = useState("Initial policy configuration");
  const [activationReason, setActivationReason] = useState("");
  const [config, setConfig] = useState(defaultAppointmentConfig);
  const [jsonText, setJsonText] = useState("{}");
  const [jsonError, setJsonError] = useState("");
  const [policiesLoading, setPoliciesLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [rollingBackVersionId, setRollingBackVersionId] = useState(null);
  const [validation, setValidation] = useState(null);
  const [versions, setVersions] = useState([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const activeCategory = categories.find((item) => item.id === category) || categories[0];
  const isNewPolicy = !selectedPolicyId;

  useEffect(() => {
    let cancelled = false;

    async function loadPolicies() {
      if (!token || !clinicId) {
        setPolicies([]);
        setPoliciesLoading(false);
        setError(!token ? "Please log in to manage clinic policies." : "Select a clinic to manage its policies.");
        return;
      }

      try {
        setPoliciesLoading(true);
        setError("");
        const result = await getClinicPoliciesByCategory(clinicId, category, token);
        if (cancelled) return;
        const list = asList(result);
        setPolicies(list);
        setSelectedPolicyId((currentId) => currentId && list.some((item) => String(policyId(item)) === String(currentId))
          ? currentId
          : String(policyId(list[0]) || ""));
      } catch (err) {
        if (!cancelled) {
          setPolicies([]);
          setError(err.message || "Unable to load clinic policies.");
        }
      } finally {
        if (!cancelled) setPoliciesLoading(false);
      }
    }

    loadPolicies();
    return () => { cancelled = true; };
  }, [category, clinicId, token, refreshKey]);

  useEffect(() => {
    let cancelled = false;

    async function loadSelectedPolicy() {
      if (!selectedPolicyId || !token || !clinicId) {
        setSelectedPolicy(null);
        setVersions([]);
        setVersionsLoading(false);
        setValidation(null);
        setPolicyCode(category);
        setPolicyName(`${activeCategory.label} Policy`);
        setChangeReason("Initial policy configuration");
        const initialConfig = category === "APPOINTMENT" ? defaultAppointmentConfig : {};
        setConfig(initialConfig);
        setJsonText(JSON.stringify(initialConfig, null, 2));
        setJsonError("");
        return;
      }

      try {
        setDetailLoading(true);
        setVersionsLoading(true);
        const [policyResult, versionsResult] = await Promise.allSettled([
          getClinicPolicy(clinicId, selectedPolicyId, token),
          getClinicPolicyVersions(clinicId, selectedPolicyId, token),
        ]);
        if (cancelled) return;
        if (policyResult.status === "rejected") throw policyResult.reason;
        const policy = policyResult.value?.policy || policyResult.value;
        const policyConfig = policy?.policyConfig || policy?.config || {};
        setSelectedPolicy(policy);
        setPolicyCode(policy?.policyCode || category);
        setPolicyName(policy?.policyName || `${activeCategory.label} Policy`);
        setChangeReason("");
        setConfig(policyConfig);
        setJsonText(JSON.stringify(policyConfig, null, 2));
        setJsonError("");
        setValidation(null);
        setVersions(versionsResult.status === "fulfilled" ? asList(versionsResult.value) : []);
      } catch (err) {
        if (!cancelled) setError(err.message || "Unable to load policy details.");
      } finally {
        if (!cancelled) {
          setDetailLoading(false);
          setVersionsLoading(false);
        }
      }
    }

    loadSelectedPolicy();
    return () => { cancelled = true; };
  }, [category, activeCategory.label, clinicId, refreshKey, selectedPolicyId, token]);

  function selectCategory(nextCategory) {
    setCategory(nextCategory);
    setSelectedPolicyId("");
    setSelectedPolicy(null);
    setValidation(null);
    setError("");
  }

  function startNewPolicy() {
    setSelectedPolicyId("");
    setSelectedPolicy(null);
    setValidation(null);
    setError("");
  }

  async function saveDraft() {
    console.log("SAVE DRAFT CLICKED");
    console.log("Policy ID:", selectedPolicyId);
    console.log("Clinic ID:", clinicId);
    console.log("Is New Policy:", isNewPolicy);
    if (!policyCode.trim() || !policyName.trim() || !changeReason.trim()) {
      setError("Enter a policy code, policy name, and change reason.");
      return;
    }
    if (jsonError) {
      setError("Fix the policy configuration JSON before saving.");
      return;
    }

    const payload = { policyCode: policyCode.trim(), policyName: policyName.trim(), category, changeReason: changeReason.trim(), policyConfig: config };
    try {
      setSaving(true);
      setError("");
      const result = isNewPolicy
        ? await createClinicPolicy(clinicId, payload, token)
        : await updateClinicPolicy(clinicId, selectedPolicyId, payload, token);
      const savedPolicyId = policyId(result?.policy || result) || policyId(selectedPolicy);
      showToast("Policy saved as draft.");
      if (savedPolicyId) setSelectedPolicyId(String(savedPolicyId));
      setRefreshKey((key) => key + 1);
    } catch (err) {
      setError(err.message || "Unable to save policy.");
    } finally {
      setSaving(false);
    }
  }

  async function validatePolicy() {
  if (!selectedPolicyId) {
    setError("Save the policy as a draft before validating it.");
    return;
  }

  try {
    setValidating(true);
    setError("");

    const result = await validateClinicPolicy(
      clinicId,
      selectedPolicyId,
      token
    );

    console.log("Policy Validation Response:", result);

    setValidation(result);

    const valid =
      result?.valid ??
      result?.isValid ??
      result?.success ??
      false;

    if (valid) {
      showToast("Policy validation successful.");
    } else {
      setError(
        result?.errors?.join(", ") ||
        result?.message ||
        "Policy validation failed."
      );
    }

    // IMPORTANT:
    // Do not call setRefreshKey() here.
    // It triggers useEffect and clears validation.

  } catch (err) {
    console.error("Policy validation error:", err);

    setValidation(null);

    setError(
      err.message || "Unable to validate policy."
    );
  } finally {
    setValidating(false);
  }
}

  async function changePolicyStatus(activate) {
    if (!selectedPolicyId) return;
    if (activate && !validation) {
      setError("Validate the policy before activating it.");
      return;
    }
    if (activate && !activationReason.trim()) {
      setError("Enter a reason for activating this policy.");
      return;
    }

    try {
      setChangingStatus(true);
      setError("");
      if (activate) await activateClinicPolicy(clinicId, selectedPolicyId, activationReason.trim(), token);
      else await deactivateClinicPolicy(clinicId, selectedPolicyId, token);
      showToast(activate ? "Policy activated." : "Policy deactivated.");
      setActivationReason("");
      setRefreshKey((key) => key + 1);
    } catch (err) {
      setError(err.message || `Unable to ${activate ? "activate" : "deactivate"} policy.`);
    } finally {
      setChangingStatus(false);
    }
  }

  async function rollbackPolicy(version) {
    const versionId = version.versionId ?? version.id ?? version.version;
    if (!selectedPolicyId || versionId == null) return;
    const confirmed = window.confirm(`Roll back to version ${version.versionNumber ?? version.version ?? versionId}?`);
    if (!confirmed) return;

    try {
      setRollingBackVersionId(versionId);
      setError("");
      await rollbackClinicPolicy(clinicId, selectedPolicyId, versionId, token);
      showToast("Policy rolled back successfully.");
      setRefreshKey((key) => key + 1);
    } catch (err) {
      setError(err.message || "Unable to roll back policy.");
    } finally {
      setRollingBackVersionId(null);
    }
  }

  const isActive = String(policyStatus(selectedPolicy)).toUpperCase() === "ACTIVE";
  const validationStatus = String(validation?.status || "").toUpperCase();
  const validationPassed = Boolean(validation?.valid ?? validation?.isValid ?? validation?.success ?? ["VALID", "SUCCESS", "PASSED"].includes(validationStatus));
  const validationMessages = validation?.errors || validation?.issues || [];
  const statusLabel = selectedPolicy ? policyStatus(selectedPolicy) : "DRAFT";

  return <div className="clinic-policy-page">
    <div className="clinic-policy-heading"><div><h3>Clinic Policy Settings</h3><p>Configure how appointments, payments, queues, and clinic workflows are managed.</p></div><div className="clinic-policy-top-actions"><button className="btn btn-outline" onClick={startNewPolicy}>New Policy</button><button className="btn btn-primary" onClick={saveDraft} disabled={saving || detailLoading}>{saving ? "Saving..." : "Save as Draft"}</button></div></div>
    {error && <div className="auth-error">{error}</div>}
    <div className="clinic-policy-categories" role="tablist" aria-label="Policy categories">
      {categories.map((item) => <button key={item.id} role="tab" aria-selected={category === item.id} className={category === item.id ? "active" : ""} onClick={() => selectCategory(item.id)}><span aria-hidden="true">{item.icon}</span>{item.label}</button>)}
    </div>
    <div className="clinic-policy-layout">
      <main className="clinic-policy-editor">
        <div className="clinic-policy-section-title"><div><h3>{activeCategory.label} Policy</h3><p>Configure policy behavior for {activeCategory.label.toLowerCase()}.</p></div><span className={`status ${isActive ? "confirmed" : "pending"}`}>{statusLabel}</span></div>
        {policiesLoading && <p className="muted">Loading policies...</p>}
        {!policiesLoading && policies.length > 0 && <div className="clinic-policy-selector"><label htmlFor="clinic-policy-select">Policy</label><select id="clinic-policy-select" value={selectedPolicyId} onChange={(event) => setSelectedPolicyId(event.target.value)}>{policies.map((policy) => <option key={policyId(policy)} value={policyId(policy)}>{policy.policyName || policy.policyCode || `Policy ${policyId(policy)}`}</option>)}</select></div>}
        {detailLoading && <p className="muted">Loading policy details...</p>}
        <div className="clinic-policy-meta-grid">
          <div className="field"><label htmlFor="policy-code">Policy Code</label><input id="policy-code" value={policyCode} onChange={(event) => setPolicyCode(event.target.value)} disabled={!isNewPolicy} /></div>
          <div className="field"><label htmlFor="policy-name">Policy Name</label><input id="policy-name" value={policyName} onChange={(event) => setPolicyName(event.target.value)} /></div>
          <div className="field clinic-policy-reason"><label htmlFor="policy-change-reason">Change Reason</label><input id="policy-change-reason" value={changeReason} onChange={(event) => setChangeReason(event.target.value)} placeholder="Describe why this policy is changing" /></div>
        </div>
        <PolicyConfigEditor
  category={category}
  config={config}
  setConfig={(nextConfig) => {
    setConfig(nextConfig);
    setValidation(null);
  }}
  jsonText={jsonText}
  setJsonText={(value) => {
    setJsonText(value);
    setValidation(null);
  }}
  jsonError={jsonError}
  setJsonError={setJsonError}
/>
        <div className="clinic-policy-form-actions"><button className="btn btn-outline" onClick={validatePolicy} disabled={!selectedPolicyId || validating || saving}>{validating ? "Validating..." : "Validate Settings"}</button><button className="btn btn-primary" onClick={saveDraft} disabled={saving || detailLoading}>{saving ? "Saving..." : "Save as Draft"}</button></div>
      </main>
      <aside className="clinic-policy-sidebar">
        <section className="clinic-policy-side-card"><h4>Policy Status</h4><span className={`status ${isActive ? "confirmed" : "pending"}`}>{statusLabel}</span><dl><div><dt>Version</dt><dd>{selectedPolicy?.versionNumber ?? selectedPolicy?.version ?? "Draft"}</dd></div><div><dt>Effective from</dt><dd>{selectedPolicy?.effectiveFrom || "Not active"}</dd></div><div><dt>Last updated</dt><dd>{selectedPolicy?.updatedAt || selectedPolicy?.lastUpdatedAt || "-"}</dd></div></dl></section>
        <section className="clinic-policy-side-card"><h4>Validation</h4>{!validation && <p className="muted">Validate settings before activating this policy.</p>}{validation && <><span className={`status ${validationPassed ? "confirmed" : "pending"}`}>{validationPassed ? "No issues found" : "Review required"}</span>{validationMessages.length > 0 && <ul className="clinic-policy-validation-list">{validationMessages.map((message, index) => <li key={index}>{typeof message === "string" ? message : message.message || JSON.stringify(message)}</li>)}</ul>}{validation?.message && <p className="muted">{validation.message}</p>}</>}</section>
        <section className="clinic-policy-side-card"><h4>Quick Actions</h4><div className="clinic-policy-quick-actions"><button className="btn btn-outline" onClick={saveDraft} disabled={saving}>{saving ? "Saving..." : "Save as Draft"}</button><button className="btn btn-outline" onClick={validatePolicy} disabled={!selectedPolicyId || validating}>{validating ? "Validating..." : "Validate Settings"}</button>{isActive ? <button className="btn btn-danger" onClick={() => changePolicyStatus(false)} disabled={changingStatus}>{changingStatus ? "Saving..." : "Deactivate Policy"}</button> : <><input className="control" value={activationReason} onChange={(event) => setActivationReason(event.target.value)} placeholder="Activation reason" /><button className="btn btn-primary" onClick={() => changePolicyStatus(true)} disabled={!selectedPolicyId || !validationPassed || changingStatus}>{changingStatus ? "Activating..." : "Activate Policy"}</button></>}</div></section>
        <section className="clinic-policy-side-card"><div className="clinic-policy-history-heading"><h4>Version History</h4><button className="btn btn-outline" onClick={() => setRefreshKey((key) => key + 1)} disabled={!selectedPolicyId}>Refresh</button></div>{versionsLoading && <p className="muted">Loading versions...</p>}{!versionsLoading && versions.length === 0 && <p className="muted">No previous versions.</p>}<div className="clinic-policy-versions">{versions.map((version) => {
          const versionId = version.versionId ?? version.id ?? version.version;
          const isCurrentVersion = String(versionId) === String(selectedPolicy?.activeVersionId ?? selectedPolicy?.versionId);
          return <div className="clinic-policy-version" key={versionId}><div><strong>v{version.versionNumber ?? version.version ?? versionId}{isCurrentVersion ? " (Active)" : ""}</strong><span>{version.createdAt || version.updatedAt || ""}</span><small>{version.changedBy || version.updatedBy || ""}</small></div>{!isCurrentVersion && <button className="btn btn-outline" disabled={rollingBackVersionId === versionId} onClick={() => rollbackPolicy(version)}>{rollingBackVersionId === versionId ? "Rolling back..." : "Rollback"}</button>}</div>;
        })}</div></section>
      </aside>
    </div>
  </div>;
}