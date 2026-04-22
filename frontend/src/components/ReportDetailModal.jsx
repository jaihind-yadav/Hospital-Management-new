import { useEffect, useState } from "react";
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

const getUploadedFileUrl = (filePath) => {
  if (!filePath) return "";

  if (/^https?:\/\//i.test(filePath)) {
    return filePath;
  }

  const normalizedPath = String(filePath).replace(/\\/g, "/");
  const uploadsIndex = normalizedPath.toLowerCase().lastIndexOf("/uploads/");
  const relativeUploadsPath =
    uploadsIndex >= 0 ? normalizedPath.slice(uploadsIndex) : normalizedPath.startsWith("/uploads/")
      ? normalizedPath
      : "";

  if (!relativeUploadsPath) return "";

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
  const appBaseUrl = apiBaseUrl.replace(/\/api\/?$/i, "");
  return `${appBaseUrl}${relativeUploadsPath}`;
};

const getUploadedFileKind = (report) => {
  const fileHints = `${report?.file_type || ""} ${report?.file_name || ""} ${report?.file_path || ""}`.toLowerCase();

  if (fileHints.includes("pdf") || fileHints.endsWith(".pdf")) {
    return "pdf";
  }

  if (
    fileHints.includes("image") ||
    /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(fileHints)
  ) {
    return "image";
  }

  return "image";
};

const ReportDetailModal = ({ open, onClose, report }) => {
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setPreviewOpen(false);
    }
  }, [open, report?.id]);

  if (!open || !report) return null;

  const tests = parseTests(report.tests);
  const isHealthReport =
    report.kind === "health" ||
    report.record_type === "Health Report" ||
    (!report.kind && !report.file_path && (Array.isArray(report.tests) || typeof report.tests === "string"));
  const fileUrl = !isHealthReport ? getUploadedFileUrl(report.file_path) : "";
  const fileKind = !isHealthReport ? getUploadedFileKind(report) : "other";

  const handlePrintHealthReport = () => {
    if (!isHealthReport) return;

    const printWindow = window.open("", "_blank", "width=1000,height=750");
    if (!printWindow) return;

    const title = report.title || "Health Report";
    const reportDate = formatDateTime(report.report_date);
    const notes = report.notes || "No notes available.";
    const testsMarkup = tests.length
      ? tests
          .map(
            (test) => `
              <tr>
                <td>${test.test_name || "-"}</td>
                <td>${test.result || "-"}</td>
                <td>${test.unit || "-"}</td>
                <td>${test.range || "-"}</td>
                <td>${test.level || "normal"}</td>
              </tr>
            `
          )
          .join("")
      : `<tr><td colspan="5">No test rows available.</td></tr>`;

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Health Report Details</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #0f172a; }
            h1 { margin: 0 0 24px; font-size: 28px; color: #1f3f75; }
            .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-bottom: 20px; }
            .card { border: 1px solid #cbd5e1; border-radius: 16px; padding: 16px; margin-bottom: 16px; }
            .label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #64748b; margin-bottom: 6px; }
            .value { white-space: pre-wrap; word-break: break-word; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 14px; }
            th { background: #eff6ff; color: #1e3a8a; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>Health Report Details</h1>
          <div class="grid">
            <div class="card">
              <div class="label">Title</div>
              <div class="value">${title}</div>
            </div>
            <div class="card">
              <div class="label">Report Date</div>
              <div class="value">${reportDate}</div>
            </div>
          </div>
          <div class="card">
            <div class="label">Notes</div>
            <div class="value">${notes}</div>
          </div>
          <div class="card">
            <div class="label">Test Details</div>
            <table>
              <thead>
                <tr>
                  <th>Test</th>
                  <th>Result</th>
                  <th>Unit</th>
                  <th>Range</th>
                  <th>Level</th>
                </tr>
              </thead>
              <tbody>${testsMarkup}</tbody>
            </table>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={isHealthReport ? "Health Report Details" : "View Report"}
        actions={
          isHealthReport ? (
            <button
              type="button"
              onClick={handlePrintHealthReport}
              className="rounded-full border border-[#1f3f75] bg-[#1f3f75] px-3 py-1 text-sm font-medium text-white transition hover:border-[#19345f] hover:bg-[#19345f]"
            >
              Print
            </button>
          ) : null
        }
      >
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
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">View Report</p>
                  {fileUrl ? (
                    <button
                      type="button"
                      onClick={() => setPreviewOpen(true)}
                      className="mt-1 inline-flex rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-medium text-[#1f3f75] hover:bg-slate-50"
                    >
                      View
                    </button>
                  ) : (
                    <p className="mt-1 break-all">{report.file_path || "-"}</p>
                  )}
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

      {!isHealthReport && fileUrl && (
        <Modal
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          title="View Report"
          panelClassName="max-w-7xl"
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-600">
              <div>
                <p className="font-medium text-slate-900">{report.title || report.file_name || "Report file"}</p>
                <p>{report.file_type || "Uploaded file"}</p>
              </div>
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-xl bg-[#1f3f75] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#19345f]"
              >
                Open in New Tab
              </a>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
              {fileKind === "image" ? (
                <div className="flex max-h-[75vh] min-h-[420px] items-center justify-center p-4">
                  <img
                    src={fileUrl}
                    alt={report.title || report.file_name || "Uploaded report"}
                    className="max-h-[70vh] w-full object-contain"
                  />
                </div>
              ) : fileKind === "pdf" ? (
                <iframe
                  title={report.title || report.file_name || "Uploaded report PDF"}
                  src={fileUrl}
                  className="h-[75vh] w-full bg-white"
                />
              ) : (
                <div className="flex min-h-[320px] items-center justify-center p-6 text-center text-sm text-slate-500">
                  Preview is not available for this file type. Use "Open in New Tab" to view it.
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default ReportDetailModal;
