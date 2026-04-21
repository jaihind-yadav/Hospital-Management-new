import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AppShell from "../components/AppShellReference";
import DataTable from "../components/DataTable";
import Modal from "../components/ModalEnhanced";
import PrescriptionDetailModal from "../components/PrescriptionDetailModal";
import ReportDetailModal from "../components/ReportDetailModal";
import {
  bookPatientAppointmentApi,
  cancelPatientAppointmentApi,
  changePatientPasswordApi,
  patientAppointmentsApi,
  patientDoctorSlotsApi,
  patientDoctorsApi,
  patientProfileApi,
  patientPrescriptionsApi,
  patientReportsApi,
  reopenPatientAppointmentApi,
  updatePatientProfileApi,
} from "../features/patient/patient.api";
import { formatDateTime, formatDateTimeFromParts } from "../utils/dateTime";
import { confirmAction } from "../utils/confirmAction";
import { validateBooking, validatePatientProfile } from "../utils/validation";
import { validatePasswordChange } from "../utils/validation";

const navItems = [{ label: "Patient Workspace", to: "/patient" }];

const PatientPage = () => {
  const [profile, setProfile] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [reports, setReports] = useState({ files: [], health_reports: [] });
  const [selectedReportDetail, setSelectedReportDetail] = useState(null);
  const [selectedPrescriptionDetail, setSelectedPrescriptionDetail] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [booking, setBooking] = useState({ slot_id: "", appointment_date: "" });
  const [openBookingModal, setOpenBookingModal] = useState(false);
  const [openProfileModal, setOpenProfileModal] = useState(false);
  const [openPasswordModal, setOpenPasswordModal] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});
  const [bookingErrors, setBookingErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const load = async () => {
    try {
      const [p, d, a, rx, records] = await Promise.all([
        patientProfileApi(),
        patientDoctorsApi(),
        patientAppointmentsApi(),
        patientPrescriptionsApi(),
        patientReportsApi(),
      ]);
      setProfile(p);
      setDoctors(d);
      setAppointments(a);
      setPrescriptions(rx);
      setReports(records);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load patient data");
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <AppShell
      title="Patient Panel"
      navItems={navItems}
      userMenuActions={[
        { label: "Edit Profile", onClick: () => setOpenProfileModal(true) },
        { label: "Change Password", onClick: () => setOpenPasswordModal(true) },
      ]}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass-panel interactive-card rounded-[28px] p-5">
          <h3 className="mb-2 font-semibold">Book Appointment</h3>
          <button className="rounded-2xl bg-gradient-to-r from-[#1f3f75] to-[#2d5daa] px-4 py-2 text-white" onClick={() => setOpenBookingModal(true)}>Add New Booking</button>
        </div>
        <div className="glass-panel interactive-card rounded-[28px] p-5">
          <h3 className="mb-2 font-semibold">Patient Workspace</h3>
          <p className="text-sm text-slate-600">
            Track appointments, prescriptions, and reports from a single dashboard.
          </p>
        </div>
      </div>

      <div className="glass-panel interactive-card mt-4 rounded-[28px] p-5">
        <DataTable
          title="My Appointments"
          data={appointments}
          searchPlaceholder="Search appointments by doctor, status, or slot"
          searchKeys={["doctor_name", "status", "slot_date", "start_time", "end_time", "slot_patient_number"]}
          emptyMessage="No appointments available yet."
          columns={[
            { header: "Doctor", accessor: "doctor_name" },
            { header: "Appointment Date", render: (row) => String(row.slot_date || row.appointment_date || "-").slice(0, 10) },
            {
              header: "Slot Time",
              render: (row) =>
                `${String(row.start_time || "-").slice(0, 8)} to ${String(row.end_time || "-").slice(0, 8)}`,
            },
            { header: "Patient No.", render: (row) => row.slot_patient_number || "-" },
            { header: "Status", accessor: "status" },
            {
              header: "Actions",
              render: (row) =>
                row.status === "cancelled" ? (
                  <button
                    className="rounded-xl bg-[#1f3f75] px-3 py-1.5 text-xs text-white transition hover:bg-[#19345f]"
                    onClick={async () => {
                      try {
                        await reopenPatientAppointmentApi(row.id);
                        toast.success("Appointment reopened");
                        load();
                      } catch (error) {
                        toast.error(error?.response?.data?.message || "Reopen failed");
                      }
                    }}
                  >
                    Reopen
                  </button>
                ) : (
                  <button
                    className="rounded-xl bg-[#10284c] px-3 py-1.5 text-xs text-white transition hover:bg-[#0c1f3a]"
                    onClick={async () => {
                      try {
                        if (!confirmAction("Are you sure you want to cancel this appointment?")) return;
                        await cancelPatientAppointmentApi(row.id);
                        toast.success("Appointment cancelled");
                        load();
                      } catch (error) {
                        toast.error(error?.response?.data?.message || "Cancel failed");
                      }
                    }}
                  >
                    Cancel
                  </button>
                ),
            },
          ]}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="glass-panel interactive-card rounded-[28px] p-5">
          <DataTable
            title="Prescription History"
            data={prescriptions}
            searchPlaceholder="Search prescriptions by doctor, notes, or medicines"
            searchKeys={["doctor_name", "notes", "medicines", "prescription_date"]}
            emptyMessage="No prescriptions available yet."
            columns={[
              { header: "Doctor", accessor: "doctor_name" },
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
            title="Reports & Health Records"
            data={[
              ...reports.files.map((item) => ({
                ...item,
                record_type: "File Report",
                summary: item.file_type,
                kind: "file",
              })),
              ...reports.health_reports.map((item) => ({
                ...item,
                record_type: "Health Report",
                summary: `${Array.isArray(item.tests) ? item.tests.length : JSON.parse(item.tests || "[]").length} test rows`,
                kind: "health",
              })),
            ]}
            searchPlaceholder="Search reports and health records"
            searchKeys={["title", "record_type", "summary", "report_date", "notes"]}
            emptyMessage="No reports available yet."
            columns={[
              { header: "Title", accessor: "title" },
              { header: "Type", accessor: "record_type" },
              { header: "Date", render: (row) => formatDateTime(row.report_date) },
              { header: "Summary", accessor: "summary" },
              {
                header: "View",
                render: (row) => (
                  <button
                    className="rounded-xl bg-[#1f3f75] px-3 py-1.5 text-xs text-white transition hover:bg-[#19345f]"
                    onClick={() => setSelectedReportDetail(row)}
                  >
                    View
                  </button>
                ),
              },
            ]}
          />
        </div>
      </div>

      <Modal open={openProfileModal} title="Edit Profile" onClose={() => setOpenProfileModal(false)}>
        {profile && (
          <form
            className="space-y-2"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const nextErrors = validatePatientProfile(profile);
                setProfileErrors(nextErrors);
                if (Object.keys(nextErrors).length) return;
                await updatePatientProfileApi(profile);
                toast.success("Profile updated");
                setOpenProfileModal(false);
                load();
              } catch (error) {
                toast.error(error?.response?.data?.message || "Update failed");
              }
            }}
          >
            <label className="block text-sm font-medium text-slate-700">Name</label>
            <input className={`w-full rounded-2xl border px-4 py-3 ${profileErrors.name ? "field-error" : "border-slate-300"}`} value={profile.name || ""} onChange={(e) => { setProfile((p) => ({ ...p, name: e.target.value })); setProfileErrors((prev) => ({ ...prev, name: "" })); }} placeholder="Name" />
            {profileErrors.name && <p className="text-sm text-red-600">{profileErrors.name}</p>}
            <label className="block text-sm font-medium text-slate-700">Gender</label>
            <select className={`w-full rounded-2xl border px-4 py-3 ${profileErrors.gender ? "field-error" : "border-slate-300"}`} value={profile.gender || ""} onChange={(e) => { setProfile((p) => ({ ...p, gender: e.target.value })); setProfileErrors((prev) => ({ ...prev, gender: "" })); }}>
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            {profileErrors.gender && <p className="text-sm text-red-600">{profileErrors.gender}</p>}
            <label className="block text-sm font-medium text-slate-700">Age</label>
            <input className={`w-full rounded-2xl border px-4 py-3 ${profileErrors.age ? "field-error" : "border-slate-300"}`} type="number" min="0" value={profile.age ?? ""} onChange={(e) => { setProfile((p) => ({ ...p, age: e.target.value === "" ? "" : Number(e.target.value) })); setProfileErrors((prev) => ({ ...prev, age: "" })); }} placeholder="Age" />
            {profileErrors.age && <p className="text-sm text-red-600">{profileErrors.age}</p>}
            <label className="block text-sm font-medium text-slate-700">Height (cm)</label>
            <input className={`w-full rounded-2xl border px-4 py-3 ${profileErrors.height_cm ? "field-error" : "border-slate-300"}`} type="number" min="1" value={profile.height_cm ?? ""} onChange={(e) => { setProfile((p) => ({ ...p, height_cm: e.target.value === "" ? "" : Number(e.target.value) })); setProfileErrors((prev) => ({ ...prev, height_cm: "" })); }} placeholder="Height (cm)" />
            {profileErrors.height_cm && <p className="text-sm text-red-600">{profileErrors.height_cm}</p>}
            <label className="block text-sm font-medium text-slate-700">Weight (kg)</label>
            <input className={`w-full rounded-2xl border px-4 py-3 ${profileErrors.weight_kg ? "field-error" : "border-slate-300"}`} type="number" min="1" value={profile.weight_kg ?? ""} onChange={(e) => { setProfile((p) => ({ ...p, weight_kg: e.target.value === "" ? "" : Number(e.target.value) })); setProfileErrors((prev) => ({ ...prev, weight_kg: "" })); }} placeholder="Weight (kg)" />
            {profileErrors.weight_kg && <p className="text-sm text-red-600">{profileErrors.weight_kg}</p>}
            <button className="rounded-2xl bg-gradient-to-r from-[#1f3f75] to-[#2d5daa] px-4 py-3 text-white">Save Profile</button>
          </form>
        )}
      </Modal>

      <Modal open={openBookingModal} title="Add New Appointment" onClose={() => setOpenBookingModal(false)}>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Doctor</label>
          <select
            className={`w-full rounded-2xl border px-4 py-3 ${bookingErrors.doctorId ? "field-error" : "border-slate-300"}`}
            value={selectedDoctor}
            onChange={async (e) => {
              const doctorId = e.target.value;
              setSelectedDoctor(doctorId);
              setBookingErrors((prev) => ({ ...prev, doctorId: "" }));
              try {
                if (doctorId) setSlots(await patientDoctorSlotsApi(doctorId));
                else setSlots([]);
              } catch (error) {
                toast.error(error?.response?.data?.message || "Failed to load slots");
              }
            }}
          >
            <option value="">Select Doctor</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          {bookingErrors.doctorId && <p className="text-sm text-red-600">{bookingErrors.doctorId}</p>}

          <label className="block text-sm font-medium text-slate-700">Available Slot</label>
          <select
            className={`w-full rounded-2xl border px-4 py-3 ${bookingErrors.slotId ? "field-error" : "border-slate-300"}`}
            value={booking.slot_id}
            onChange={(e) => {
              const slotId = e.target.value;
              const slot = slots.find((s) => String(s.id) === slotId);
              setBookingErrors((prev) => ({ ...prev, slotId: "", appointment_date: "" }));
              setBooking((p) => ({
                ...p,
                slot_id: slotId,
                appointment_date: slot?.slot_date || "",
              }));
            }}
          >
            <option value="">Select Slot</option>
            {slots.map((s) => (
              <option key={s.id} value={s.id}>
                {formatDateTimeFromParts(s.slot_date, s.start_time)} to {formatDateTimeFromParts(s.slot_date, s.end_time)}
              </option>
            ))}
          </select>
          {bookingErrors.slotId && <p className="text-sm text-red-600">{bookingErrors.slotId}</p>}

          <button
            className="rounded-2xl bg-gradient-to-r from-[#1f3f75] to-[#2d5daa] px-4 py-3 text-white"
            onClick={async () => {
              try {
                const nextErrors = validateBooking({
                  doctorId: selectedDoctor,
                  slotId: booking.slot_id,
                  appointment_date: booking.appointment_date,
                });
                setBookingErrors(nextErrors);
                if (Object.keys(nextErrors).length) return;
                await bookPatientAppointmentApi({
                  doctor_id: Number(selectedDoctor),
                  slot_id: Number(booking.slot_id),
                  appointment_date: booking.appointment_date,
                });
                toast.success("Appointment booked");
                setOpenBookingModal(false);
                load();
              } catch (error) {
                toast.error(error?.response?.data?.message || "Booking failed");
              }
            }}
          >
            Book
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
              await changePatientPasswordApi(passwordForm);
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

export default PatientPage;
