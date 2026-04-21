import Modal from "./ModalEnhanced";
import { formatDateTime } from "../utils/dateTime";

const PrescriptionDetailModal = ({ open, onClose, prescription }) => {
  if (!open || !prescription) return null;

  return (
    <Modal open={open} onClose={onClose} title="Prescription Details">
      <div className="space-y-4 text-sm text-slate-700">
        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 md:grid-cols-2">
          {prescription.doctor_name && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Doctor</p>
              <p className="mt-1 font-medium">{prescription.doctor_name}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Prescription Date</p>
            <p className="mt-1">{formatDateTime(prescription.prescription_date)}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Consultation Notes</p>
          <p className="mt-2 whitespace-pre-wrap">{prescription.notes || "No notes available."}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Medicines & Instructions</p>
          <p className="mt-2 whitespace-pre-wrap">{prescription.medicines || "No medicines listed."}</p>
        </div>
      </div>
    </Modal>
  );
};

export default PrescriptionDetailModal;
