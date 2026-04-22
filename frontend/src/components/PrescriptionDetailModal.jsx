import Modal from "./ModalEnhanced";
import { formatDateTime } from "../utils/dateTime";

const PrescriptionDetailModal = ({ open, onClose, prescription }) => {
  if (!open || !prescription) return null;

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    const doctorName = prescription.doctor_name || "Not available";
    const prescriptionDate = formatDateTime(prescription.prescription_date);
    const consultationNotes = prescription.notes || "No notes available.";
    const medicines = prescription.medicines || "No medicines listed.";

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Prescription Details</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 32px;
              color: #0f172a;
              line-height: 1.5;
            }
            h1 {
              margin: 0 0 24px;
              font-size: 28px;
              color: #1f3f75;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 16px;
              margin-bottom: 20px;
            }
            .card {
              border: 1px solid #cbd5e1;
              border-radius: 16px;
              padding: 16px;
              margin-bottom: 16px;
            }
            .label {
              font-size: 12px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.12em;
              color: #64748b;
              margin-bottom: 6px;
            }
            .value {
              white-space: pre-wrap;
              word-break: break-word;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <h1>Prescription Details</h1>
          <div class="grid">
            <div class="card">
              <div class="label">Doctor</div>
              <div class="value">${doctorName}</div>
            </div>
            <div class="card">
              <div class="label">Prescription Date</div>
              <div class="value">${prescriptionDate}</div>
            </div>
          </div>
          <div class="card">
            <div class="label">Consultation Notes</div>
            <div class="value">${consultationNotes}</div>
          </div>
          <div class="card">
            <div class="label">Medicines & Instructions</div>
            <div class="value">${medicines}</div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Prescription Details"
      actions={
        <button
          type="button"
          onClick={handlePrint}
          className="rounded-full border border-[#1f3f75] bg-[#1f3f75] px-3 py-1 text-sm font-medium text-white transition hover:border-[#19345f] hover:bg-[#19345f]"
        >
          Print
        </button>
      }
    >
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
