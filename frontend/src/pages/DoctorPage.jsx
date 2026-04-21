import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AppShell from "../components/AppShellReference";
import DataTable from "../components/DataTable";
import Modal from "../components/ModalEnhanced";
import PrescriptionDetailModal from "../components/PrescriptionDetailModal";
import ReportDetailModal from "../components/ReportDetailModal";
import {
  changeDoctorPasswordApi,
  createDoctorSlotApi,
  createDoctorPrescriptionApi,
  doctorAppointmentHealthReportsApi,
  doctorAppointmentPatientApi,
  doctorAppointmentPrescriptionsApi,
  doctorAppointmentReportsApi,
  deleteDoctorSlotApi,
  doctorAppointmentsApi,
  doctorProfileApi,
  listDoctorSlotsApi,
  updateDoctorProfileApi,
} from "../features/doctor/doctor.api";
import { formatDateTime, formatDateTimeFromParts, getTodayDate } from "../utils/dateTime";
import { confirmAction } from "../utils/confirmAction";
import { validateDoctorSlot, validateProfile } from "../utils/validation";
import { validatePasswordChange } from "../utils/validation";

const navItems = [
  { label: "Manage Slots", to: "/doctor/slots" },
  { label: "Manage Appointments", to: "/doctor/appointments" },
];

const DoctorPage = ({ section = "slots" }) => {
  const [profile, setProfile] = useState(null);
  const [slots, setSlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [appointmentDateFilter, setAppointmentDateFilter] = useState(getTodayDate);
  const [slotForm, setSlotForm] = useState({
    slot_date: "",
    start_time: "",
    end_time: "",
    max_appointments: 1,
  });
  const [openSlotModal, setOpenSlotModal] = useState(false);
  const [openProfileModal, setOpenProfileModal] = useState(false);
  const [openPasswordModal, setOpenPasswordModal] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});
  const [slotErrors, setSlotErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientPrescriptions, setPatientPrescriptions] = useState([]);
  const [patientReports, setPatientReports] = useState([]);
  const [patientHealthReports, setPatientHealthReports] = useState([]);
  const [selectedReportDetail, setSelectedReportDetail] = useState(null);
  const [selectedPrescriptionDetail, setSelectedPrescriptionDetail] = useState(null);
  const [prescriptionForm, setPrescriptionForm] = useState({
    notes: "",
    medicines: "",
  });

  const loadBaseData = async () => {
    try {
      const [p, s] = await Promise.all([
        doctorProfileApi(),
        listDoctorSlotsApi(),
      ]);
      setProfile(p);
      setSlots(s);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load doctor data");
    }
  };

  useEffect(() => {
    loadBaseData();
  }, []);

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const data = await doctorAppointmentsApi(appointmentDateFilter);
        setAppointments(data);
      } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to load appointments");
      }
    };

    loadAppointments();
  }, [appointmentDateFilter]);

  const loadAppointmentWorkspace = async (appointmentId) => {
    try {
      const [patient, prescriptions, reports, healthReports] = await Promise.all([
        doctorAppointmentPatientApi(appointmentId),
        doctorAppointmentPrescriptionsApi(appointmentId),
        doctorAppointmentReportsApi(appointmentId),
        doctorAppointmentHealthReportsApi(appointmentId),
      ]);
      setSelectedAppointmentId(String(appointmentId));
      setSelectedPatient(patient);
      setPatientPrescriptions(prescriptions);
      setPatientReports(reports);
      setPatientHealthReports(healthReports);
      toast.success("Patient workspace loaded");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load patient workspace");
    }
  };

  return (
    <AppShell
      title="Doctor Panel"
      navItems={navItems}
      userMenuActions={[
        { label: "Edit Profile", onClick: () => setOpenProfileModal(true) },
        { label: "Change Password", onClick: () => setOpenPasswordModal(true) },
      ]}
    >
      {section === "slots" ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="glass-panel interactive-card rounded-[28px] p-5">
              <h3 className="mb-2 font-semibold">Create Slot</h3>
              <button className="rounded-2xl bg-gradient-to-r from-[#1f3f75] to-[#2d5daa] px-4 py-2 text-white" onClick={() => setOpenSlotModal(true)}>Add New Slot</button>
            </div>
            <div className="glass-panel interactive-card rounded-[28px] p-5">
              <h3 className="mb-2 font-semibold">Slot Management</h3>
              <p className="text-sm text-slate-600">
                Create, review, and maintain your availability from this section.
              </p>
            </div>
          </div>

          <div className="glass-panel interactive-card rounded-[28px] p-5">
            <DataTable
              title="My Slots"
              data={slots}
              searchPlaceholder="Search slots by date or time"
              searchKeys={["slot_date", "start_time", "end_time"]}
              emptyMessage="No slots created yet."
              columns={[
                { header: "Start", render: (row) => formatDateTimeFromParts(row.slot_date, row.start_time) },
                { header: "End", render: (row) => formatDateTimeFromParts(row.slot_date, row.end_time) },
                { header: "Capacity", render: (row) => row.max_appointments },
                {
                  header: "Actions",
                  render: (row) => (
                    <button
                      className="rounded-xl bg-[#10284c] px-3 py-1.5 text-xs text-white transition hover:bg-[#0c1f3a]"
                      onClick={async () => {
                        try {
                        if (!confirmAction("Are you sure you want to delete this slot?")) return;
                        await deleteDoctorSlotApi(row.id);
                        toast.success("Slot deleted");
                        loadBaseData();
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
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="glass-panel interactive-card rounded-[28px] p-5">
              <h3 className="mb-2 font-semibold">Appointment Management</h3>
              <p className="text-sm text-slate-600">
                Review scheduled visits, open consultation workspaces, and manage outcomes.
              </p>
            </div>
            <div className="glass-panel interactive-card rounded-[28px] p-5">
              <h3 className="mb-2 font-semibold">Doctor Workspace</h3>
              <p className="text-sm text-slate-600">
                View patient history, reports, and prescriptions in one connected flow.
              </p>
            </div>
          </div>

          <div className="glass-panel interactive-card rounded-[28px] p-5">
            <div className="mb-3">
              <h3 className="text-lg font-semibold text-slate-900">Appointments</h3>
              <p className="text-sm text-slate-500">Today is preselected for faster daily review.</p>
            </div>
            <div className="mb-4 flex justify-start">
              <div className="w-full md:w-[260px]">
              <label className="mb-1 block text-sm font-medium text-slate-700">Appointment Date</label>
              <input
                type="date"
                value={appointmentDateFilter}
                onChange={(e) => setAppointmentDateFilter(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5"
              />
              </div>
            </div>
            <DataTable
              data={appointments}
              searchPlaceholder="Search appointments by patient, status, or slot"
              searchKeys={["patient_name", "status", "slot_date", "start_time", "end_time", "slot_patient_number"]}
              emptyMessage="No appointments available for the selected date."
              columns={[
                { header: "Patient", accessor: "patient_name" },
                { header: "Appointment Date", render: (row) => String(row.slot_date || row.appointment_date || "-").slice(0, 10) },
                {
                  header: "Slot Time",
                  render: (row) =>
                    `${formatDateTimeFromParts(row.slot_date, row.start_time).slice(11)} to ${formatDateTimeFromParts(
                      row.slot_date,
                      row.end_time
                    ).slice(11)}`,
                },
                { header: "Patient No.", render: (row) => row.slot_patient_number || "-" },
                { header: "Status", accessor: "status" },
                {
                  header: "Actions",
                  render: (row) =>
                    row.status === "cancelled" ? (
                      <button
                        type="button"
                        disabled
                        className="cursor-not-allowed rounded-xl bg-slate-300 px-3 py-1.5 text-xs text-slate-500"
                      >
                        Visit Closed
                      </button>
                    ) : (
                      <button
                        className="rounded-xl bg-[#1f3f75] px-3 py-1.5 text-xs text-white transition hover:bg-[#19345f]"
                        onClick={() => {
                          if (row.status === "cancelled") {
                            toast.error("Cancelled appointments cannot be opened");
                            return;
                          }
                          loadAppointmentWorkspace(row.id);
                        }}
                      >
                        Open Visit
                      </button>
                    ),
                },
              ]}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="glass-panel interactive-card rounded-[28px] p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold">Patient Consultation Workspace</h3>
                  <p className="text-sm text-slate-500">
                    Select an appointment to view profile, reports, and history.
                  </p>
                </div>
                {selectedAppointmentId && (
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs text-white">
                    Appointment #{selectedAppointmentId}
                  </span>
                )}
              </div>

              {selectedPatient ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                    <p className="text-lg font-semibold">{selectedPatient.name}</p>
                    <p className="text-sm text-slate-500">
                      {selectedPatient.email} | {selectedPatient.mobile}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Gender: {selectedPatient.gender || "N/A"} | Age: {selectedPatient.age || "N/A"} |
                      Height: {selectedPatient.height_cm || "N/A"} | Weight: {selectedPatient.weight_kg || "N/A"}
                    </p>
                  </div>

                  <form
                    className="space-y-3 rounded-2xl border border-slate-200 bg-white/80 p-4"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      try {
                        if (!selectedAppointmentId) {
                          toast.error("Select an appointment first");
                          return;
                        }
                        await createDoctorPrescriptionApi(selectedAppointmentId, prescriptionForm);
                        toast.success("Prescription saved");
                        setPrescriptionForm({ notes: "", medicines: "" });
                        loadAppointmentWorkspace(selectedAppointmentId);
                        loadBaseData();
                      } catch (error) {
                        toast.error(error?.response?.data?.message || "Failed to save prescription");
                      }
                    }}
                  >
                    <div>
                      <h4 className="font-semibold">Write Prescription</h4>
                      <p className="text-sm text-slate-500">
                        Add diagnosis notes and medicine instructions for this visit.
                      </p>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Consultation Notes</label>
                      <textarea
                        className="min-h-28 w-full rounded-2xl border border-slate-300 px-4 py-3"
                        placeholder="Diagnosis / consultation notes"
                        value={prescriptionForm.notes}
                        onChange={(e) =>
                          setPrescriptionForm((prev) => ({ ...prev, notes: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Medicines and Dosage Instructions</label>
                      <textarea
                        className="min-h-28 w-full rounded-2xl border border-slate-300 px-4 py-3"
                        placeholder="Medicines and dosage instructions"
                        value={prescriptionForm.medicines}
                        onChange={(e) =>
                          setPrescriptionForm((prev) => ({ ...prev, medicines: e.target.value }))
                        }
                      />
                    </div>
                    <button className="rounded-2xl bg-gradient-to-r from-[#1f3f75] to-[#2d5daa] px-4 py-3 text-white">
                      Save Prescription
                    </button>
                  </form>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
                  Open a booked appointment to review patient history and write a prescription.
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="glass-panel interactive-card rounded-[28px] p-5">
                <DataTable
                  title="Prescription History"
                  data={patientPrescriptions}
                  searchPlaceholder="Search prescription history"
                  searchKeys={["prescription_date", "notes", "medicines"]}
                  emptyMessage="No previous prescriptions found."
                  columns={[
                    { header: "Date", render: (row) => formatDateTime(row.prescription_date) },
                    { header: "Notes", render: (row) => row.notes || "No notes" },
                    { header: "Medicines", render: (row) => row.medicines || "No medicines listed" },
                    {
                      header: "View",
                      render: (row) => (
                        <button
                          className="rounded-xl bg-[#1f3f75] px-3 py-1.5 text-xs text-white transition hover:bg-[#19345f]"
                          onClick={() => setSelectedPrescriptionDetail(row)}
                        >
                          View
                        </button>
                      ),
                    },
                  ]}
                />
              </div>

              <div className="glass-panel interactive-card rounded-[28px] p-5">
                <DataTable
                  title="Uploaded Reports"
                  data={patientReports}
                  searchPlaceholder="Search uploaded reports"
                  searchKeys={["file_name", "file_type", "report_date"]}
                  emptyMessage="No uploaded files found."
                  columns={[
                    { header: "File Name", accessor: "file_name" },
                    { header: "Report Date", render: (row) => formatDateTime(row.report_date) },
                    { header: "File Type", accessor: "file_type" },
                    {
                      header: "View",
                      render: (row) => (
                        <button
                          className="rounded-xl bg-[#1f3f75] px-3 py-1.5 text-xs text-white transition hover:bg-[#19345f]"
                          onClick={() => setSelectedReportDetail({ ...row, kind: "file", title: row.file_name })}
                        >
                          View
                        </button>
                      ),
                    },
                  ]}
                />
              </div>

              <div className="glass-panel interactive-card rounded-[28px] p-5">
                <DataTable
                  title="Health Report Cards"
                  data={patientHealthReports}
                  searchPlaceholder="Search health reports"
                  searchKeys={["title", "report_date", "notes"]}
                  emptyMessage="No structured health reports found."
                  columns={[
                    { header: "Title", accessor: "title" },
                    { header: "Report Date", render: (row) => formatDateTime(row.report_date) },
                    {
                      header: "Tests",
                      render: (row) => (Array.isArray(row.tests) ? row.tests.length : JSON.parse(row.tests || "[]").length),
                    },
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
                await updateDoctorProfileApi(profile);
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

      <Modal open={openSlotModal} title="Add New Slot" onClose={() => setOpenSlotModal(false)}>
        <form
          className="space-y-2"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const nextErrors = validateDoctorSlot(slotForm);
              setSlotErrors(nextErrors);
              if (Object.keys(nextErrors).length) return;
              await createDoctorSlotApi(slotForm);
              toast.success("Slot added");
              setSlotForm({ slot_date: "", start_time: "", end_time: "", max_appointments: 1 });
              setOpenSlotModal(false);
              loadBaseData();
            } catch (error) {
              toast.error(error?.response?.data?.message || "Create failed");
            }
          }}
        >
          <label className="block text-sm font-medium text-slate-700">Slot Date</label>
          <input type="date" className={`w-full rounded-2xl border px-4 py-3 ${slotErrors.slot_date ? "field-error" : "border-slate-300"}`} value={slotForm.slot_date} onChange={(e) => { setSlotForm((p) => ({ ...p, slot_date: e.target.value })); setSlotErrors((prev) => ({ ...prev, slot_date: "" })); }} required />
          {slotErrors.slot_date && <p className="text-sm text-red-600">{slotErrors.slot_date}</p>}
          <label className="block text-sm font-medium text-slate-700">Start Time</label>
          <input type="time" className={`w-full rounded-2xl border px-4 py-3 ${slotErrors.start_time ? "field-error" : "border-slate-300"}`} value={slotForm.start_time} onChange={(e) => { setSlotForm((p) => ({ ...p, start_time: e.target.value })); setSlotErrors((prev) => ({ ...prev, start_time: "" })); }} required />
          {slotErrors.start_time && <p className="text-sm text-red-600">{slotErrors.start_time}</p>}
          <label className="block text-sm font-medium text-slate-700">End Time</label>
          <input type="time" className={`w-full rounded-2xl border px-4 py-3 ${slotErrors.end_time ? "field-error" : "border-slate-300"}`} value={slotForm.end_time} onChange={(e) => { setSlotForm((p) => ({ ...p, end_time: e.target.value })); setSlotErrors((prev) => ({ ...prev, end_time: "" })); }} required />
          {slotErrors.end_time && <p className="text-sm text-red-600">{slotErrors.end_time}</p>}
          <label className="block text-sm font-medium text-slate-700">Maximum Appointments</label>
          <input type="number" min="1" className={`w-full rounded-2xl border px-4 py-3 ${slotErrors.max_appointments ? "field-error" : "border-slate-300"}`} value={slotForm.max_appointments} onChange={(e) => { setSlotForm((p) => ({ ...p, max_appointments: Number(e.target.value) })); setSlotErrors((prev) => ({ ...prev, max_appointments: "" })); }} required />
          {slotErrors.max_appointments && <p className="text-sm text-red-600">{slotErrors.max_appointments}</p>}
          <button className="rounded-2xl bg-gradient-to-r from-[#1f3f75] to-[#2d5daa] px-4 py-3 text-white">Add Slot</button>
        </form>
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
              await changeDoctorPasswordApi(passwordForm);
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
      <PrescriptionDetailModal
        open={Boolean(selectedPrescriptionDetail)}
        prescription={selectedPrescriptionDetail}
        onClose={() => setSelectedPrescriptionDetail(null)}
      />
    </AppShell>
  );
};

export default DoctorPage;
