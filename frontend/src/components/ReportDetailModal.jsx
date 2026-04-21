import Modal from "./ModalEnhanced";
import { formatDateTime } from "../utils/dateTime";

const parseTests = (tests) => {
  if (Array.isArray(tests)) return tests;
  if (!tests) return [];
  try {
    return JSON.parse(tests);
  } catch {
    return [];
  }
};

const ReportDetailModal = ({ open, onClose, report }) => {
  if (!open || !report) return null;

  const tests = parseTests(report.tests);
  const isHealthReport = report.kind === "health" || report.record_type === "Health Report" || report.title;

  return (
    <Modal open={open} onClose={onClose} title={isHealthReport ? "Health Report Details" : "Uploaded Report Details"}>
      <div className="space-y-4 text-sm text-slate-700">
        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Title</p>
            <p className="mt-1 font-medium">{report.title || report.file_name || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Date</p>
            <p className="mt-1">{formatDateTime(report.report_date)}</p>
          </div>
          {!isHealthReport && (
            <>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">File Type</p>
                <p className="mt-1">{report.file_type || "-"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">File Path</p>
                <p className="mt-1 break-all">{report.file_path || "-"}</p>
              </div>
            </>
          )}
          {isHealthReport && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Test Rows</p>
              <p className="mt-1">{tests.length}</p>
            </div>
          )}
        </div>

        {report.notes && (
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Notes</p>
            <p className="mt-2 whitespace-pre-wrap">{report.notes}</p>
          </div>
        )}

        {isHealthReport && (
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Test Details</p>
            {tests.length ? (
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    <tr>
                      <th className="pb-2 pr-4">Test</th>
                      <th className="pb-2 pr-4">Result</th>
                      <th className="pb-2 pr-4">Unit</th>
                      <th className="pb-2 pr-4">Range</th>
                      <th className="pb-2">Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tests.map((test, index) => (
                      <tr key={`${test.test_name || "test"}-${index}`} className="border-t border-slate-100">
                        <td className="py-2 pr-4">{test.test_name || "-"}</td>
                        <td className="py-2 pr-4">{test.result || "-"}</td>
                        <td className="py-2 pr-4">{test.unit || "-"}</td>
                        <td className="py-2 pr-4">{test.range || "-"}</td>
                        <td className="py-2 capitalize">{test.level || "normal"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-2 text-slate-500">No test rows available.</p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ReportDetailModal;
