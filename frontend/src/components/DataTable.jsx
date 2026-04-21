import { useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 10;

const toSearchText = (value) => {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map(toSearchText).join(" ");
  if (typeof value === "object") return Object.values(value).map(toSearchText).join(" ");
  return String(value);
};

const DataTable = ({
  title,
  data = [],
  columns = [],
  searchPlaceholder = "Search records",
  searchKeys = [],
  emptyMessage = "No records found.",
  actionsLabel = "Actions",
}) => {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filteredData = useMemo(() => {
    const searchText = query.trim().toLowerCase();
    if (!searchText) return data;

    return data.filter((row) => {
      const haystack = searchKeys.length
        ? searchKeys.map((key) => toSearchText(row?.[key])).join(" ")
        : columns.map((column) => toSearchText(column.accessor ? row?.[column.accessor] : "")).join(" ");
      return haystack.toLowerCase().includes(searchText);
    });
  }, [columns, data, query, searchKeys]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [query, data.length]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredData.slice(start, start + PAGE_SIZE);
  }, [filteredData, page]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {title ? <h3 className="text-lg font-semibold">{title}</h3> : <div />}
        <div className="flex items-center gap-3">
          <div className="table-chip">
            {filteredData.length} result{filteredData.length === 1 ? "" : "s"}
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="table-search w-full min-w-[220px] rounded-2xl border px-4 py-2.5 text-sm md:w-72"
          />
        </div>
      </div>

      <div className="table-shell overflow-hidden rounded-[24px] border border-slate-200 bg-white/90">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
              <tr>
                {columns.map((column) => (
                  <th key={column.header} className="px-4 py-3 font-semibold">
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length ? (
                paginatedData.map((row, index) => (
                  <tr key={row.id || row._id || `${index}-${query}`} className="border-t border-slate-100">
                    {columns.map((column) => (
                      <td key={column.header} className="px-4 py-3 align-top">
                        {column.render
                          ? column.render(row)
                          : toSearchText(column.accessor ? row?.[column.accessor] : "") || "-"}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={Math.max(columns.length, 1)} className="px-4 py-10 text-center text-slate-500">
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filteredData.length > PAGE_SIZE && (
        <div className="flex flex-col gap-3 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>
            Showing {(page - 1) * PAGE_SIZE + 1}-
            {Math.min(page * PAGE_SIZE, filteredData.length)} of {filteredData.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="table-page-btn"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <span className="table-chip">
              Page {page} / {totalPages}
            </span>
            <button
              type="button"
              className="table-page-btn"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
