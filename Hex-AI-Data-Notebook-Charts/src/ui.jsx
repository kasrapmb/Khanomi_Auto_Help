import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowDownUp,
  ArrowUp,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Database,
  Download,
  Search,
  Table2,
} from "lucide-react";
import { csvContent, formatValue } from "./data.js";

export function downloadFile(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function ResultTable({
  result,
  label = "Query result",
  source = false,
}) {
  const [search, setSearch] = useState(""),
    [sort, setSort] = useState({ index: -1, direction: "asc" }),
    [page, setPage] = useState(1),
    [pageSize, setPageSize] = useState(8),
    [tab, setTab] = useState("table");
  useEffect(() => {
    setSearch("");
    setSort({ index: -1, direction: "asc" });
    setPage(1);
  }, [result?.runId]);
  const filtered = useMemo(() => {
    const rows = (result?.rows || []).filter((row) =>
      row.some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    );
    if (sort.index < 0) return rows;
    return rows.toSorted((a, b) => {
      const x = a[sort.index],
        y = b[sort.index];
      const compare =
        typeof x === "number" && typeof y === "number"
          ? x - y
          : String(x ?? "").localeCompare(String(y ?? ""));
      return compare * (sort.direction === "asc" ? 1 : -1);
    });
  }, [result, search, sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize)),
    current = Math.min(page, pages),
    rows = filtered.slice((current - 1) * pageSize, current * pageSize);
  if (!result)
    return (
      <div className="result-placeholder">
        <Database size={21} />
        <span>Run the query to see its result.</span>
      </div>
    );
  return (
    <div className="result-block">
      <div className="result-toolbar">
        <div className="result-tabs">
          <button
            className={tab === "table" ? "selected" : ""}
            onClick={() => setTab("table")}
          >
            <Table2 size={12} />
            Table
          </button>
          <button
            className={tab === "schema" ? "selected" : ""}
            onClick={() => setTab("schema")}
          >
            <Columns3 size={12} />
            Columns
          </button>
          <span>{result.rows.length} rows</span>
        </div>
        <div className="result-actions">
          <span className="result-search">
            <Search size={12} />
            <input
              aria-label={`Search ${label}`}
              placeholder="Search results..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </span>
          <button
            className="icon-button"
            aria-label={`Export ${label} CSV`}
            disabled={!filtered.length}
            onClick={() =>
              downloadFile(
                source ? "hex-source-orders.csv" : "hex-query-result.csv",
                csvContent(result.columns, filtered),
                "text/csv;charset=utf-8;",
              )
            }
          >
            <Download size={13} />
          </button>
        </div>
      </div>
      {result.truncated && (
        <div className="truncation-note">
          Result capped at 500 rows. The chart and export use these returned
          rows.
        </div>
      )}
      {tab === "table" ? (
        <div className="result-scroll">
          <table aria-label={label}>
            <thead>
              <tr>
                <th className="row-number">#</th>
                {result.columns.map((column, index) => {
                  const numeric = result.rows.some(
                    (row) => typeof row[index] === "number",
                  );
                  return (
                    <th
                      key={column}
                      className={numeric ? "numeric" : ""}
                      aria-sort={
                        sort.index === index
                          ? sort.direction === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <button
                        onClick={() => {
                          setSort((current) => ({
                            index,
                            direction:
                              current.index === index &&
                              current.direction === "asc"
                                ? "desc"
                                : "asc",
                          }));
                          setPage(1);
                        }}
                      >
                        <span>{numeric ? "#" : "Aa"}</span>
                        {column}
                        {sort.index === index ? (
                          sort.direction === "asc" ? (
                            <ArrowUp size={10} />
                          ) : (
                            <ArrowDown size={10} />
                          )
                        ) : (
                          <ArrowDownUp size={10} />
                        )}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td className="row-number">
                      {(current - 1) * pageSize + rowIndex + 1}
                    </td>
                    {row.map((value, index) => (
                      <td
                        className={typeof value === "number" ? "numeric" : ""}
                        key={index}
                      >
                        {formatValue(value, result.columns[index])}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={result.columns.length + 1}>
                    <div className="table-empty">No matching rows.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="result-column-list">
          <p>
            Types inferred from returned values; zero-row results have unknown
            types.
          </p>
          {result.columns.map((column, index) => (
            <div key={column}>
              <span>
                <Columns3 size={12} />
                {column}
              </span>
              <code>
                {typeof result.rows.find((row) => row[index] !== null)?.[
                  index
                ] === "number"
                  ? "number"
                  : result.rows.some((row) => row[index] !== null)
                    ? "text"
                    : "unknown"}
              </code>
            </div>
          ))}
        </div>
      )}
      <div className="result-footer">
        <span>
          {filtered.length ? (current - 1) * pageSize + 1 : 0}–
          {Math.min(current * pageSize, filtered.length)} of {filtered.length}{" "}
          rows
          <span className="result-scope-note">
            {" "}
            · Search affects the table and CSV only
          </span>
        </span>
        <div>
          <label>
            Rows
            <select
              aria-label={`${label} rows per page`}
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
            >
              {[8, 15, 25].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <button
            className="icon-button"
            aria-label={`Previous ${label} page`}
            disabled={current === 1}
            onClick={() => setPage((value) => value - 1)}
          >
            <ChevronLeft size={12} />
          </button>
          <span>
            {current}/{pages}
          </span>
          <button
            className="icon-button"
            aria-label={`Next ${label} page`}
            disabled={current === pages}
            onClick={() => setPage((value) => value + 1)}
          >
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
