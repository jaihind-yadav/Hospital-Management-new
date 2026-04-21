import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AppShell from "../components/AppShellReference";
import DataTable from "../components/DataTable";
import Modal from "../components/ModalEnhanced";
import ReportDetailModal from "../components/ReportDetailModal";
import {
  changeExecutivePasswordApi,
  confirmExecutiveBookingApi,
  createHealthReportApi,
  deleteReportApi,
  executiveAppointmentsApi,
  executiveDoctorsApi,
  executiveDoctorSlotsApi,
  executivePatientsApi,
  executivePatientHealthReportsApi,
  executivePatientApi,
  executivePatientReportsApi,
  executiveProfileApi,
  markAttendanceApi,
  reopenExecutiveAppointmentApi,
  sendExecutiveBookingOtpApi,
  updateExecutivePatientProfileApi,
  updateExecutiveProfileApi,
  uploadPatientReportApi,
} from "../features/executive/executive.api";
import {
  formatDateTime,
  formatDateTimeFromParts,
  getCurrentDateTimeLocal,
  getTodayDate,
  normalizeDateTimeLocalToApi,
} from "../utils/dateTime";
import { confirmAction } from "../utils/confirmAction";
import { validatePatientProfile, validateProfile, validateReportUpload } from "../utils/validation";
import { validatePasswordChange } from "../utils/validation";

const navItems = [
  { label: "Appointments", to: "/executive/attendance" },
  { label: "Patient Reports", to: "/executive/reports" },
  { label: "Book Appointment", to: "/executive/booking" },
];

const ExecutivePage = ({ section = "attendance" }) => {
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [appointmentDateFilter, setAppointmentDateFilter] = useState(getTodayDate);
  const [appointmentDoctorFilter, setAppointmentDoctorFilter] = useState("");
  const [patientId, setPatientId] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [patientOptions, setPatientOptions] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [bookingSlots, setBookingSlots] = useState([]);
  const [patient, setPatient] = useState(null);
  const [reports, setReports] = useState([]);
  const [healthReports, setHealthReports] = useState([]);
  const [selectedReportDetail, setSelectedReportDetail] = useState(null);
  const [file, setFile] = useState(null);
  const [reportDateTime, setReportDateTime] = useState(getCurrentDateTimeLocal);
  const [openReportModal, setOpenReportModal] = useState(false);
  const [openProfileModal, setOpenProfileModal] = useState(false);
  const [openPasswordModal, setOpenPasswordModal] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});
  const [reportErrors, setReportErrors] = useState({});
  const [patientErrors, setPatientErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [bookingErrors, setBookingErrors] = useState({});
  const [bookingOtpSent, setBookingOtpSent] = useState(false);
  const [bookingOtpMeta, setBookingOtpMeta] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [bookingForm, setBookingForm] = useState({
    booking_mode: "existing",
    patient_id: "",
    name: "",
    email: "",
    mobile: "",
    doctor_id: "",
    slot_id: "",
    otp_code: "",
  });
  const [healthReportForm, setHealthReportForm] = useState({
    title: "",
    report_date: getCurrentDateTimeLocal(),
    notes: "",
    tests: [{ test_name: "", result: "", unit: "", range: "", level: "normal" }],
  });

  const loadBaseData = async () => {
    try {
      const [p, patientList] = await Promise.all([
        executiveProfileApi(),
        executivePatientsApi(),
      ]);
      setProfile(p);
      setPatientOptions(patientList);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load executive data");
    }
  };

  const resetBookingFlow = () => {
    setBookingForm({
      booking_mode: "existing",
      patient_id: "",
      name: "",
      email: "",
      mobile: "",
      doctor_id: "",
      slot_id: "",
      otp_code: "",
    });
    setBookingSlots([]);
    setBookingErrors({});
    setBookingOtpSent(false);
    setBookingOtpMeta(null);
  };

  const loadPatientData = async () => {
    try {
      if (!patientId) {
        toast.error("Enter patient ID");
        return;
      }
      const [p, r, hr] = await Promise.all([
        executivePatientApi(patientId),
        executivePatientReportsApi(patientId),
        executivePatientHealthReportsApi(patientId),
      ]);
      setPatient(p);
      setReports(r);
      setHealthReports(hr);
      toast.success("Patient loaded");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load patient");
    }
  };

  useEffect(() => {
    loadBaseData();
  }, []);

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const data = await executiveDoctorsApi();
        setDoctors(data);
      } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to load doctors");
      }
    };

    loadDoctors();
  }, []);

  useEffect(() => {
    const loadPatients = async () => {
      try {
        const data = await executivePatientsApi(patientSearch);
        setPatientOptions(data);
      } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to load patients");
      }
    };

    loadPatients();
  }, [patientSearch]);

  useEffect(() => {
    const loadBookingSlots = async () => {
      try {
        if (!bookingForm.doctor_id) {
          setBookingSlots([]);
          return;
        }

        const data = await executiveDoctorSlotsApi(bookingForm.doctor_id);
        setBookingSlots(data);
      } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to load doctor slots");
      }
    };

    loadBookingSlots();
  }, [bookingForm.doctor_id]);

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const data = await executiveAppointmentsApi(appointmentDateFilter, appointmentDoctorFilter);
        setAppointments(data);
      } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to load appointments");
      }
    };

    loadAppointments();
  }, [appointmentDateFilter, appointmentDoctorFilter]);

  return (
    <AppShell
      title="Executive Panel"
      navItems={navItems}
      userMenuActions={[
        { label: "Edit Profile", onClick: () => setOpenProfileModal(true) },
        { label: "Change Password", onClick: () => setOpenPasswordModal(true) },
      ]}
    >
      {section === "attendance" ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="glass-panel interactive-card rounded-[28px] p-5">
              <h3 className="mb-2 font-semibold">Appointments</h3>
              <p className="text-sm text-slate-600">
                Review scheduled visits and mark patients present or absent.
              </p>
            </div>
            <div className="glass-panel interactive-card rounded-[28px] p-5">
              <h3 className="mb-2 font-semibold">Executive Workspace</h3>
              <p className="text-sm text-slate-600">
                Handle operational appointment flow from one attendance dashboard.
              </p>
            </div>
          </div>

          <div className="glass-panel interactive-card rounded-[28px] p-5">
            <div className="mb-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Appointments Attendance</h3>
                <p className="text-sm text-slate-500">Today is preselected so the daily attendance list opens first.</p>
              </div>
            </div>
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end">
              <div className="w-full md:w-[260px]">
                <label className="mb-1 block text-sm font-medium text-slate-700">Appointment Date</label>
                <input
                  type="date"
                  value={appointmentDateFilter}
                  onChange={(e) => setAppointmentDateFilter(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5"
                />
              </div>
              <div className="w-full md:w-[260px]">
                <label className="mb-1 block text-sm font-medium text-slate-700">Doctor</label>
                <select
                  value={appointmentDoctorFilter}
                  onChange={(e) => setAppointmentDoctorFilter(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5"
                >
                  <option value="">All Doctors</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <DataTable
              data={appointments}
              searchPlaceholder="Search by patient, doctor, status, or slot"
              searchKeys={["patient_name", "doctor_name", "status", "slot_date", "start_time", "end_time", "slot_patient_number"]}
              emptyMessage="No appointments available for the selected date."
              columns={[
                { header: "Patient", accessor: "patient_name" },
                { header: "Doctor", accessor: "doctor_name" },
                { header: "Appointment Date", render: (row) => String(row.slot_date || row.appointment_date || "-").slice(0, 10) },
                {
                  header: "Slot Time",
                  render: (row) =>
                    `${String(row.start_time || "-").slice(0, 8)} to ${String(row.end_time || "-").slice(0, 8)}`,
                },
                { header: "Patient No.", render: (row) => row.slot_patient_number || "-" },
                {
                  header: "Actions",
                  render: (row) =>
                    row.status === "cancelled" ? (
                      <button
                        className="rounded-xl bg-[#1f3f75] px-3 py-1.5 text-xs text-white transition hover:bg-[#19345f]"
                        onClick={async () => {
                          try {
                            await reopenExecutiveAppointmentApi(row.id);
                            toast.success("Appointment reopened");
                            setAppointments(await executiveAppointmentsApi(appointmentDateFilter, appointmentDoctorFilter));
                          } catch (error) {
                            toast.error(error?.response?.data?.message || "Reopen failed");
                          }
                        }}
                      >
                        Reopen
                      </button>
                    ) : row.status === "completed" ? (
                      <span className="inline-flex rounded-xl bg-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500">
                        Closed
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <button className="rounded-xl bg-[#1f3f75] px-3 py-1.5 text-xs text-white transition hover:bg-[#19345f]" onClick={async () => { try { await markAttendanceApi(row.id, 1); toast.success("Marked present"); setAppointments(await executiveAppointmentsApi(appointmentDateFilter, appointmentDoctorFilter)); } catch (error) { toast.error(error?.response?.data?.message || "Update failed"); } }}>Present</button>
                        <button className="rounded-xl bg-[#355c9a] px-3 py-1.5 text-xs text-white transition hover:bg-[#2b4b80]" onClick={async () => { try { await markAttendanceApi(row.id, 0); toast.success("Marked absent"); setAppointments(await executiveAppointmentsApi(appointmentDateFilter, appointmentDoctorFilter)); } catch (error) { toast.error(error?.response?.data?.message || "Update failed"); } }}>Absent</button>
                      </div>
                    ),
                },
              ]}
            />
          </div>
        </div>
      ) : section === "reports" ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="glass-panel interactive-card rounded-[28px] p-5">
              <h3 className="mb-2 font-semibold">Patient Reports</h3>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Search Patient</label>
                <input
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  placeholder="Search by name, email, mobile, or ID"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                />
                <label className="block text-sm font-medium text-slate-700">Select Patient</label>
                <select
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                >
                  <option value="">Select Patient</option>
                  {patientOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name} | {option.mobile || "-"} | #{option.id}
                    </option>
                  ))}
                </select>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button className="rounded-2xl bg-slate-800 px-4 py-2 text-white" onClick={loadPatientData}>Load Patient</button>
                    <button className="rounded-2xl bg-gradient-to-r from-[#1f3f75] to-[#2d5daa] px-4 py-2 text-white" onClick={() => setOpenReportModal(true)}>Add New Report</button>
                  </div>
                  {patient && <p className="text-sm text-slate-600">Patient: {patient.name}</p>}
                </div>
              </div>
            </div>
            <div className="glass-panel interactive-card rounded-[28px] p-5">
              <h3 className="mb-2 font-semibold">Reports Workspace</h3>
              <p className="text-sm text-slate-600">
                Load a patient, manage uploads, and maintain structured health reports.
              </p>
            </div>
          </div>

          <div className="glass-panel interactive-card rounded-[28px] p-5">
            <DataTable
              title="Uploaded Reports"
              data={reports}
              searchPlaceholder="Search patient reports"
              searchKeys={["file_name", "file_type", "report_date"]}
              emptyMessage="No uploaded reports for this patient."
              columns={[
                { header: "File Name", accessor: "file_name" },
                { header: "Type", accessor: "file_type" },
                { header: "Date", render: (row) => formatDateTime(row.report_date) },
                {
                  header: "View",
                  render: (row) => (
                    <button
                      className="rounded-xl bg-[#355c9a] px-3 py-1.5 text-xs text-white transition hover:bg-[#2b4b80]"
                      onClick={() => setSelectedReportDetail({ ...row, kind: "file", title: row.file_name })}
                    >
                      View
                    </button>
                  ),
                },
                {
                  header: "Actions",
                  render: (row) => (
                    <button
                      className="rounded-xl bg-[#10284c] px-3 py-1.5 text-xs text-white transition hover:bg-[#0c1f3a]"
                      onClick={async () => {
                        try {
                          if (!confirmAction("Are you sure you want to delete this report?")) return;
                          await deleteReportApi(row.id);
                          toast.success("Report deleted");
                          loadPatientData();
                        } catch (error) {
                          toast.error(error?.response?.data?.message || "Delete failed");
                        }
                      }}
                    >
                      Delete
                    </button>
                  ),
                },
              ]}
            />
          </div>

          {patient && (
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="glass-panel interactive-card rounded-[28px] p-5">
                <h3 className="mb-3 font-semibold">Patient Profile</h3>
                <form
                  className="space-y-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      const nextErrors = validatePatientProfile(patient);
                      setPatientErrors(nextErrors);
                      if (Object.keys(nextErrors).length) return;
                      await updateExecutivePatientProfileApi(patient.id, patient);
                      toast.success("Patient profile updated");
                      loadPatientData();
                    } catch (error) {
                      toast.error(error?.response?.data?.message || "Patient update failed");
                    }
                  }}
                >
                  <label className="block text-sm font-medium text-slate-700">Name</label>
                  <input className={`w-full rounded-2xl border px-4 py-3 ${patientErrors.name ? "field-error" : "border-slate-300"}`} value={patient.name || ""} onChange={(e) => { setPatient((prev) => ({ ...prev, name: e.target.value })); setPatientErrors((prev) => ({ ...prev, name: "" })); }} placeholder="Name" />
                  {patientErrors.name && <p className="text-sm text-red-600">{patientErrors.name}</p>}
                  <label className="block text-sm font-medium text-slate-700">Email Address</label>
                  <input className="w-full rounded-2xl border border-slate-300 px-4 py-3" value={patient.email || ""} onChange={(e) => setPatient((prev) => ({ ...prev, email: e.target.value }))} placeholder="Email" />
                  <label className="block text-sm font-medium text-slate-700">Mobile Number</label>
                  <input className="w-full rounded-2xl border border-slate-300 px-4 py-3" value={patient.mobile || ""} onChange={(e) => setPatient((prev) => ({ ...prev, mobile: e.target.value }))} placeholder="Mobile" />
                  <label className="block text-sm font-medium text-slate-700">Gender</label>
                  <select className="w-full rounded-2xl border border-slate-300 px-4 py-3" value={patient.gender || ""} onChange={(e) => setPatient((prev) => ({ ...prev, gender: e.target.value }))}>
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  <label className="block text-sm font-medium text-slate-700">Age</label>
                  <input className="w-full rounded-2xl border border-slate-300 px-4 py-3" type="number" min="0" value={patient.age ?? ""} onChange={(e) => setPatient((prev) => ({ ...prev, age: e.target.value === "" ? "" : Number(e.target.value) }))} placeholder="Age" />
                  <label className="block text-sm font-medium text-slate-700">Height (cm)</label>
                  <input className="w-full rounded-2xl border border-slate-300 px-4 py-3" type="number" min="1" value={patient.height_cm ?? ""} onChange={(e) => setPatient((prev) => ({ ...prev, height_cm: e.target.value === "" ? "" : Number(e.target.value) }))} placeholder="Height (cm)" />
                  <label className="block text-sm font-medium text-slate-700">Weight (kg)</label>
                  <input className="w-full rounded-2xl border border-slate-300 px-4 py-3" type="number" min="1" value={patient.weight_kg ?? ""} onChange={(e) => setPatient((prev) => ({ ...prev, weight_kg: e.target.value === "" ? "" : Number(e.target.value) }))} placeholder="Weight (kg)" />
                  <button className="rounded-2xl bg-gradient-to-r from-[#1f3f75] to-[#2d5daa] px-4 py-3 text-white">
                    Save Patient Profile
                  </button>
                </form>
              </div>

              <div className="glass-panel interactive-card rounded-[28px] p-5">
                <h3 className="mb-3 font-semibold">Structured Health Report</h3>
                <div className="space-y-2 rounded-2xl border border-slate-200 bg-white/80 p-4">
                  <label className="block text-sm font-medium text-slate-700">Report Title</label>
                  <input className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Report title" value={healthReportForm.title} onChange={(e) => setHealthReportForm((prev) => ({ ...prev, title: e.target.value }))} />
                  <label className="block text-sm font-medium text-slate-700">Report Date & Time</label>
                  <input className="w-full rounded-2xl border border-slate-300 px-4 py-3" type="datetime-local" value={healthReportForm.report_date} onChange={(e) => setHealthReportForm((prev) => ({ ...prev, report_date: e.target.value }))} />
                  {healthReportForm.tests.map((test, index) => (
                    <div key={index} className="grid gap-2 rounded-2xl border border-slate-200 p-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Test Name</label>
                        <input className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Test name" value={test.test_name} onChange={(e) => setHealthReportForm((prev) => ({ ...prev, tests: prev.tests.map((item, idx) => idx === index ? { ...item, test_name: e.target.value } : item) }))} />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Result</label>
                        <input className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Result" value={test.result} onChange={(e) => setHealthReportForm((prev) => ({ ...prev, tests: prev.tests.map((item, idx) => idx === index ? { ...item, result: e.target.value } : item) }))} />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Unit</label>
                        <input className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Unit" value={test.unit} onChange={(e) => setHealthReportForm((prev) => ({ ...prev, tests: prev.tests.map((item, idx) => idx === index ? { ...item, unit: e.target.value } : item) }))} />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Normal Range</label>
                        <input className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Normal range" value={test.range} onChange={(e) => setHealthReportForm((prev) => ({ ...prev, tests: prev.tests.map((item, idx) => idx === index ? { ...item, range: e.target.value } : item) }))} />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Level</label>
                        <select className="w-full rounded-2xl border border-slate-300 px-4 py-3" value={test.level} onChange={(e) => setHealthReportForm((prev) => ({ ...prev, tests: prev.tests.map((item, idx) => idx === index ? { ...item, level: e.target.value } : item) }))}>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="low">Low</option>
                        <option value="critical">Critical</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        className="mt-6 h-12 rounded-2xl border border-slate-300 px-4 font-medium text-[#1f3f75] transition hover:border-[#1f3f75] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={healthReportForm.tests.length === 1}
                        onClick={() =>
                          setHealthReportForm((prev) => ({
                            ...prev,
                            tests:
                              prev.tests.length === 1
                                ? prev.tests
                                : prev.tests.filter((_, idx) => idx !== index),
                          }))
                        }
                      >
                        Remove Row
                      </button>
                    </div>
                  ))}
                  <button type="button" className="rounded-2xl border border-slate-300 px-4 py-3" onClick={() => setHealthReportForm((prev) => ({ ...prev, tests: [...prev.tests, { test_name: "", result: "", unit: "", range: "", level: "normal" }] }))}>
                    Add Test Row
                  </button>
                  <label className="block text-sm font-medium text-slate-700">Notes</label>
                  <textarea className="min-h-24 w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Notes" value={healthReportForm.notes} onChange={(e) => setHealthReportForm((prev) => ({ ...prev, notes: e.target.value }))} />
                  <button
                    className="rounded-2xl bg-gradient-to-r from-[#1f3f75] to-[#2d5daa] px-4 py-3 text-white"
                    onClick={async () => {
                      try {
                        await createHealthReportApi(patient.id, {
                          ...healthReportForm,
                          report_date: normalizeDateTimeLocalToApi(healthReportForm.report_date),
                        });
                        toast.success("Health report created");
                        setHealthReportForm({
                          title: "",
                          report_date: getCurrentDateTimeLocal(),
                          notes: "",
                          tests: [{ test_name: "", result: "", unit: "", range: "", level: "normal" }],
                        });
                        loadPatientData();
                      } catch (error) {
                        toast.error(error?.response?.data?.message || "Failed to create health report");
                      }
                    }}
                  >
                    Save Health Report
                  </button>
                </div>
              </div>

              <div className="glass-panel interactive-card rounded-[28px] p-5 xl:col-span-2">
                <DataTable
                  title="Patient Health Reports"
                  data={healthReports}
                  searchPlaceholder="Search health reports"
                  searchKeys={["title", "report_date", "notes"]}
                  emptyMessage="No structured health reports created yet."
                  columns={[
                    { header: "Title", accessor: "title" },
                    { header: "Report Date", render: (row) => formatDateTime(row.report_date) },
                    {
                      header: "Tests",
                      render: (row) => (Array.isArray(row.tests) ? row.tests.length : JSON.parse(row.tests || "[]").length),
                    },
                    { header: "Notes", render: (row) => row.notes || "-" },
                    {
                      header: "View",
                      render: (row) => (
                        <button
                          className="rounded-xl bg-[#1f3f75] px-3 py-1.5 text-xs text-white transition hover:bg-[#19345f]"
                          onClick={() => setSelectedReportDetail({ ...row, kind: "health" })}
                        >
                          View
                        </button>
                      ),
                    },
                  ]}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="glass-panel interactive-card rounded-[28px] p-5">
              <h3 className="mb-2 font-semibold">OTP Appointment Booking</h3>
              <p className="text-sm text-slate-600">
                Book on behalf of an existing or new patient after mobile OTP confirmation.
              </p>
            </div>
            <div className="glass-panel interactive-card rounded-[28px] p-5">
              <h3 className="mb-2 font-semibold">Executive Assisted Flow</h3>
              <p className="text-sm text-slate-600">
                Choose patient details, select a doctor slot, send OTP, then confirm booking.
              </p>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="glass-panel interactive-card rounded-[28px] p-5">
              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                    bookingForm.booking_mode === "existing"
                      ? "bg-[#1f3f75] text-white"
                      : "border border-slate-300 bg-white text-slate-700"
                  }`}
                  onClick={() => {
                    setBookingForm((prev) => ({
                      ...prev,
                      booking_mode: "existing",
                      name: "",
                      email: "",
                      mobile: "",
                      patient_id: prev.patient_id,
                      otp_code: "",
                    }));
                    setBookingErrors({});
                    setBookingOtpSent(false);
                    setBookingOtpMeta(null);
                  }}
                >
                  Existing Patient
                </button>
                <button
                  type="button"
                  className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                    bookingForm.booking_mode === "new"
                      ? "bg-[#1f3f75] text-white"
                      : "border border-slate-300 bg-white text-slate-700"
                  }`}
                  onClick={() => {
                    setBookingForm((prev) => ({
                      ...prev,
                      booking_mode: "new",
                      patient_id: "",
                      otp_code: "",
                    }));
                    setBookingErrors({});
                    setBookingOtpSent(false);
                    setBookingOtpMeta(null);
                  }}
                >
                  New Patient
                </button>
              </div>

              <div className="space-y-3">
                {bookingForm.booking_mode === "existing" ? (
                  <>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Search Existing Patient</label>
                      <input
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                        placeholder="Search by name, email, mobile, or ID"
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Select Existing Patient</label>
                      <select
                        className={`w-full rounded-2xl border px-4 py-3 ${
                          bookingErrors.patient_id ? "field-error" : "border-slate-300"
                        }`}
                        value={bookingForm.patient_id}
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          const selectedPatient = patientOptions.find((item) => String(item.id) === selectedId);
                          setBookingForm((prev) => ({
                            ...prev,
                            patient_id: selectedId,
                            mobile: selectedPatient?.mobile || "",
                            otp_code: "",
                          }));
                          setBookingErrors((prev) => ({ ...prev, patient_id: "" }));
                          setBookingOtpSent(false);
                          setBookingOtpMeta(null);
                        }}
                      >
                        <option value="">Select Patient</option>
                        {patientOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.name} | {option.mobile || "-"} | #{option.id}
                          </option>
                        ))}
                      </select>
                      {bookingErrors.patient_id && <p className="mt-1 text-sm text-red-600">{bookingErrors.patient_id}</p>}
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Patient Name</label>
                      <input
                        className={`w-full rounded-2xl border px-4 py-3 ${bookingErrors.name ? "field-error" : "border-slate-300"}`}
                        value={bookingForm.name}
                        onChange={(e) => {
                          setBookingForm((prev) => ({ ...prev, name: e.target.value, otp_code: "" }));
                          setBookingErrors((prev) => ({ ...prev, name: "" }));
                          setBookingOtpSent(false);
                          setBookingOtpMeta(null);
                        }}
                      />
                      {bookingErrors.name && <p className="mt-1 text-sm text-red-600">{bookingErrors.name}</p>}
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Email Address</label>
                      <input
                        type="email"
                        className={`w-full rounded-2xl border px-4 py-3 ${bookingErrors.email ? "field-error" : "border-slate-300"}`}
                        value={bookingForm.email}
                        onChange={(e) => {
                          setBookingForm((prev) => ({ ...prev, email: e.target.value, otp_code: "" }));
                          setBookingErrors((prev) => ({ ...prev, email: "" }));
                          setBookingOtpSent(false);
                          setBookingOtpMeta(null);
                        }}
                      />
                      {bookingErrors.email && <p className="mt-1 text-sm text-red-600">{bookingErrors.email}</p>}
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Mobile Number</label>
                      <input
                        className={`w-full rounded-2xl border px-4 py-3 ${bookingErrors.mobile ? "field-error" : "border-slate-300"}`}
                        value={bookingForm.mobile}
                        onChange={(e) => {
                          setBookingForm((prev) => ({
                            ...prev,
                            mobile: e.target.value.replace(/\D/g, "").slice(0, 15),
                            otp_code: "",
                          }));
                          setBookingErrors((prev) => ({ ...prev, mobile: "" }));
                          setBookingOtpSent(false);
                          setBookingOtpMeta(null);
                        }}
                      />
                      {bookingErrors.mobile && <p className="mt-1 text-sm text-red-600">{bookingErrors.mobile}</p>}
                    </div>
                  </>
                )}

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Doctor</label>
                  <select
                    className={`w-full rounded-2xl border px-4 py-3 ${bookingErrors.doctor_id ? "field-error" : "border-slate-300"}`}
                    value={bookingForm.doctor_id}
                    onChange={(e) => {
                      setBookingForm((prev) => ({
                        ...prev,
                        doctor_id: e.target.value,
                        slot_id: "",
                        otp_code: "",
                      }));
                      setBookingErrors((prev) => ({ ...prev, doctor_id: "", slot_id: "" }));
                      setBookingOtpSent(false);
                      setBookingOtpMeta(null);
                    }}
                  >
                    <option value="">Select Doctor</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name}
                      </option>
                    ))}
                  </select>
                  {bookingErrors.doctor_id && <p className="mt-1 text-sm text-red-600">{bookingErrors.doctor_id}</p>}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Available Slot</label>
                  <select
                    className={`w-full rounded-2xl border px-4 py-3 ${bookingErrors.slot_id ? "field-error" : "border-slate-300"}`}
                    value={bookingForm.slot_id}
                    onChange={(e) => {
                      setBookingForm((prev) => ({ ...prev, slot_id: e.target.value, otp_code: "" }));
                      setBookingErrors((prev) => ({ ...prev, slot_id: "" }));
                      setBookingOtpSent(false);
                      setBookingOtpMeta(null);
                    }}
                  >
                    <option value="">Select Slot</option>
                    {bookingSlots.map((slot) => (
                      <option key={slot.id} value={slot.id}>
                        {formatDateTimeFromParts(slot.slot_date, slot.start_time)} to {formatDateTimeFromParts(slot.slot_date, slot.end_time)}
                      </option>
                    ))}
                  </select>
                  {bookingErrors.slot_id && <p className="mt-1 text-sm text-red-600">{bookingErrors.slot_id}</p>}
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="rounded-2xl bg-gradient-to-r from-[#1f3f75] to-[#2d5daa] px-4 py-3 text-white"
                    onClick={async () => {
                      try {
                        const payload = {
                          ...bookingForm,
                          doctor_id: Number(bookingForm.doctor_id),
                          slot_id: Number(bookingForm.slot_id),
                          patient_id: bookingForm.patient_id ? Number(bookingForm.patient_id) : null,
                        };
                        const response = await sendExecutiveBookingOtpApi(payload);
                        setBookingOtpSent(true);
                        setBookingOtpMeta(response);
                        setBookingErrors({});
                        toast.success("OTP sent successfully");
                      } catch (error) {
                        toast.error(error?.response?.data?.message || "Failed to send OTP");
                      }
                    }}
                  >
                    Send OTP
                  </button>
                  <button
                    type="button"
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-slate-700"
                    onClick={resetBookingFlow}
                  >
                    Reset
                  </button>
                </div>

                {bookingOtpSent && (
                  <div className="space-y-3 rounded-2xl border border-slate-200 bg-white/80 p-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Enter OTP</label>
                      <input
                        className={`w-full rounded-2xl border px-4 py-3 ${bookingErrors.otp_code ? "field-error" : "border-slate-300"}`}
                        value={bookingForm.otp_code}
                        onChange={(e) => {
                          setBookingForm((prev) => ({
                            ...prev,
                            otp_code: e.target.value.replace(/\D/g, "").slice(0, 6),
                          }));
                          setBookingErrors((prev) => ({ ...prev, otp_code: "" }));
                        }}
                        placeholder="6-digit OTP"
                      />
                      {bookingErrors.otp_code && <p className="mt-1 text-sm text-red-600">{bookingErrors.otp_code}</p>}
                    </div>
                    {bookingOtpMeta?.otp_code && (
                      <p className="text-sm text-slate-500">
                        Demo OTP: <span className="font-semibold text-slate-800">{bookingOtpMeta.otp_code}</span>
                      </p>
                    )}
                    <button
                      type="button"
                      className="rounded-2xl bg-[#10284c] px-4 py-3 text-white"
                      onClick={async () => {
                        try {
                          if (!bookingForm.otp_code || bookingForm.otp_code.length !== 6) {
                            setBookingErrors((prev) => ({ ...prev, otp_code: "Valid OTP is required" }));
                            return;
                          }
                          const payload = {
                            ...bookingForm,
                            doctor_id: Number(bookingForm.doctor_id),
                            slot_id: Number(bookingForm.slot_id),
                            patient_id: bookingForm.patient_id ? Number(bookingForm.patient_id) : null,
                          };
                          await confirmExecutiveBookingApi(payload);
                          toast.success("Appointment booked successfully");
                          resetBookingFlow();
                          setAppointments(await executiveAppointmentsApi(getTodayDate()));
                          setPatientSearch("");
                          const refreshedPatients = await executivePatientsApi();
                          setPatientOptions(refreshedPatients);
                        } catch (error) {
                          toast.error(error?.response?.data?.message || "Booking failed");
                        }
                      }}
                    >
                      Confirm OTP & Book
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="glass-panel interactive-card rounded-[28px] p-5">
              <h3 className="mb-3 font-semibold">Booking Summary</h3>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Patient Type</p>
                  <p className="mt-1 capitalize">{bookingForm.booking_mode}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Selected Mobile</p>
                  <p className="mt-1">
                    {bookingForm.booking_mode === "existing"
                      ? patientOptions.find((item) => String(item.id) === bookingForm.patient_id)?.mobile || "-"
                      : bookingForm.mobile || "-"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Selected Slot</p>
                  <p className="mt-1">
                    {bookingSlots.find((slot) => String(slot.id) === bookingForm.slot_id)
                      ? `${formatDateTimeFromParts(
                          bookingSlots.find((slot) => String(slot.id) === bookingForm.slot_id)?.slot_date,
                          bookingSlots.find((slot) => String(slot.id) === bookingForm.slot_id)?.start_time
                        )} to ${formatDateTimeFromParts(
                          bookingSlots.find((slot) => String(slot.id) === bookingForm.slot_id)?.slot_date,
                          bookingSlots.find((slot) => String(slot.id) === bookingForm.slot_id)?.end_time
                        )}`
                      : "No slot selected"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">OTP Status</p>
                  <p className="mt-1">{bookingOtpSent ? "OTP sent and awaiting confirmation" : "OTP not sent yet"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal open={openProfileModal} title="Edit Profile" onClose={() => setOpenProfileModal(false)}>
        {profile && (
          <form
            className="space-y-2"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const nextErrors = validateProfile(profile);
                setProfileErrors(nextErrors);
                if (Object.keys(nextErrors).length) return;
                await updateExecutiveProfileApi(profile);
                toast.success("Profile updated");
                setOpenProfileModal(false);
                loadBaseData();
              } catch (error) {
                toast.error(error?.response?.data?.message || "Update failed");
              }
            }}
          >
            <label className="block text-sm font-medium text-slate-700">Name</label>
            <input className={`w-full rounded-2xl border px-4 py-3 ${profileErrors.name ? "field-error" : "border-slate-300"}`} value={profile.name || ""} onChange={(e) => { setProfile((p) => ({ ...p, name: e.target.value })); setProfileErrors((prev) => ({ ...prev, name: "" })); }} placeholder="Name" />
            {profileErrors.name && <p className="text-sm text-red-600">{profileErrors.name}</p>}
            <label className="block text-sm font-medium text-slate-700">Email Address</label>
            <input className={`w-full rounded-2xl border px-4 py-3 ${profileErrors.email ? "field-error" : "border-slate-300"}`} value={profile.email || ""} onChange={(e) => { setProfile((p) => ({ ...p, email: e.target.value })); setProfileErrors((prev) => ({ ...prev, email: "" })); }} placeholder="Email" />
            {profileErrors.email && <p className="text-sm text-red-600">{profileErrors.email}</p>}
            <label className="block text-sm font-medium text-slate-700">Mobile Number</label>
            <input className={`w-full rounded-2xl border px-4 py-3 ${profileErrors.mobile ? "field-error" : "border-slate-300"}`} value={profile.mobile || ""} onChange={(e) => { setProfile((p) => ({ ...p, mobile: e.target.value })); setProfileErrors((prev) => ({ ...prev, mobile: "" })); }} placeholder="Mobile" />
            {profileErrors.mobile && <p className="text-sm text-red-600">{profileErrors.mobile}</p>}
            <button className="rounded-2xl bg-gradient-to-r from-[#1f3f75] to-[#2d5daa] px-4 py-3 text-white">Save Profile</button>
          </form>
        )}
      </Modal>

      <Modal open={openReportModal} title="Add New Report" onClose={() => setOpenReportModal(false)}>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Patient ID</label>
          <select
            className={`w-full rounded-2xl border px-4 py-3 ${reportErrors.patientId ? "field-error" : "border-slate-300"}`}
            value={patientId}
            onChange={(e) => {
              setPatientId(e.target.value);
              setReportErrors((prev) => ({ ...prev, patientId: "" }));
            }}
          >
            <option value="">Select Patient</option>
            {patientOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name} | {option.mobile || "-"} | #{option.id}
              </option>
            ))}
          </select>
          {reportErrors.patientId && <p className="text-sm text-red-600">{reportErrors.patientId}</p>}
          <label className="block text-sm font-medium text-slate-700">Report Date & Time</label>
          <input
            type="datetime-local"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            value={reportDateTime}
            onChange={(e) => setReportDateTime(e.target.value)}
          />
          <label className="block text-sm font-medium text-slate-700">Report File</label>
          <input type="file" onChange={(e) => { setFile(e.target.files?.[0] || null); setReportErrors((prev) => ({ ...prev, file: "" })); }} />
          {reportErrors.file && <p className="text-sm text-red-600">{reportErrors.file}</p>}
          <button
            className="rounded-2xl bg-gradient-to-r from-[#1f3f75] to-[#2d5daa] px-4 py-3 text-white"
            onClick={async () => {
              try {
                const nextErrors = validateReportUpload({ patientId, file });
                setReportErrors(nextErrors);
                if (Object.keys(nextErrors).length) return;
                await uploadPatientReportApi(
                  patientId,
                  file,
                  normalizeDateTimeLocalToApi(reportDateTime)
                );
                toast.success("Report uploaded");
                setOpenReportModal(false);
                setFile(null);
                setReportDateTime(getCurrentDateTimeLocal());
                loadPatientData();
              } catch (error) {
                toast.error(error?.response?.data?.message || "Upload failed");
              }
            }}
          >
            Upload Report
          </button>
        </div>
      </Modal>

      <Modal
        open={openPasswordModal}
        title="Change Password"
        onClose={() => setOpenPasswordModal(false)}
      >
        <form
          className="space-y-2"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const nextErrors = validatePasswordChange(passwordForm);
              setPasswordErrors(nextErrors);
              if (Object.keys(nextErrors).length) return;
              await changeExecutivePasswordApi(passwordForm);
              toast.success("Password updated");
              setPasswordForm({
                current_password: "",
                new_password: "",
                confirm_password: "",
              });
              setOpenPasswordModal(false);
            } catch (error) {
              toast.error(error?.response?.data?.message || "Password update failed");
            }
          }}
        >
          <label className="block text-sm font-medium text-slate-700">Current Password</label>
          <input type="password" className={`w-full rounded-2xl border px-4 py-3 ${passwordErrors.current_password ? "field-error" : "border-slate-300"}`} placeholder="Current password" value={passwordForm.current_password} onChange={(e) => { setPasswordForm((prev) => ({ ...prev, current_password: e.target.value })); setPasswordErrors((prev) => ({ ...prev, current_password: "" })); }} />
          {passwordErrors.current_password && <p className="text-sm text-red-600">{passwordErrors.current_password}</p>}
          <label className="block text-sm font-medium text-slate-700">New Password</label>
          <input type="password" className={`w-full rounded-2xl border px-4 py-3 ${passwordErrors.new_password ? "field-error" : "border-slate-300"}`} placeholder="New password" value={passwordForm.new_password} onChange={(e) => { setPasswordForm((prev) => ({ ...prev, new_password: e.target.value })); setPasswordErrors((prev) => ({ ...prev, new_password: "" })); }} />
          {passwordErrors.new_password && <p className="text-sm text-red-600">{passwordErrors.new_password}</p>}
          <label className="block text-sm font-medium text-slate-700">Confirm New Password</label>
          <input type="password" className={`w-full rounded-2xl border px-4 py-3 ${passwordErrors.confirm_password ? "field-error" : "border-slate-300"}`} placeholder="Confirm new password" value={passwordForm.confirm_password} onChange={(e) => { setPasswordForm((prev) => ({ ...prev, confirm_password: e.target.value })); setPasswordErrors((prev) => ({ ...prev, confirm_password: "" })); }} />
          {passwordErrors.confirm_password && <p className="text-sm text-red-600">{passwordErrors.confirm_password}</p>}
          <button className="rounded-2xl bg-gradient-to-r from-[#1f3f75] to-[#2d5daa] px-4 py-3 text-white">Update Password</button>
        </form>
      </Modal>

      <ReportDetailModal
        open={Boolean(selectedReportDetail)}
        report={selectedReportDetail}
        onClose={() => setSelectedReportDetail(null)}
      />
    </AppShell>
  );
};

export default ExecutivePage;
