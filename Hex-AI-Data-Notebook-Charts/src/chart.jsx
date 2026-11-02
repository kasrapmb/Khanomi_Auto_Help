import React from "react";
import {
  BarChart3,
  ChartNoAxesCombined,
  ChevronDown,
  LineChart,
} from "lucide-react";
import { formatValue } from "./data.js";

export default function ResultChart({
  result,
  xAxis,
  yAxis,
  onX,
  onY,
  type,
  onType,
}) {
  const columns = result?.columns || [],
    numeric = columns.filter((column, index) =>
      result.rows.some(
        (row) => typeof row[index] === "number" && Number.isFinite(row[index]),
      ),
    );
  const xIndex = columns.indexOf(xAxis),
    yIndex = columns.indexOf(yAxis),
    rows = (result?.rows || [])
      .slice(0, 40)
      .filter(
        (row) =>
          typeof row[yIndex] === "number" && Number.isFinite(row[yIndex]),
      );
  const max = Math.max(1, ...rows.map((row) => row[yIndex])),
    min = Math.min(0, ...rows.map((row) => row[yIndex])),
    range = max - min;
  const w = 720,
    h = 220,
    left = 65,
    right = 20,
    top = 16,
    base = 174,
    plot = w - left - right,
    step = plot / Math.max(1, rows.length),
    barWidth = Math.min(48, step * 0.55);
  const y = (value) => base - ((value - min) / range) * (base - top),
    zero = y(0);
  const points = rows.map((row, index) => [
    left + step * (index + 0.5),
    y(row[yIndex]),
  ]);
  const path = points
    .map(([x, y], index) => `${index ? "L" : "M"}${x},${y}`)
    .join(" ");
  return (
    <div className="visualization">
      <div className="chart-config">
        <div className="chart-fields">
          <label>
            X axis
            <select
              aria-label="Chart X axis"
              value={columns.includes(xAxis) ? xAxis : ""}
              onChange={(event) => onX(event.target.value)}
              disabled={!columns.length}
            >
              {!columns.length && <option value="">Run a query</option>}
              {columns.map((column) => (
                <option key={column}>{column}</option>
              ))}
            </select>
          </label>
          <label>
            Y axis
            <select
              aria-label="Chart Y axis"
              value={numeric.includes(yAxis) ? yAxis : ""}
              onChange={(event) => onY(event.target.value)}
              disabled={!numeric.length}
            >
              {!numeric.length && <option value="">No numeric field</option>}
              {numeric.map((column) => (
                <option key={column}>{column}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="chart-type">
          <button
            aria-label="Bar chart"
            aria-pressed={type === "bar"}
            className={type === "bar" ? "selected" : ""}
            onClick={() => onType("bar")}
          >
            <BarChart3 size={14} />
          </button>
          <button
            aria-label="Line chart"
            aria-pressed={type === "line"}
            className={type === "line" ? "selected" : ""}
            onClick={() => onType("line")}
          >
            <LineChart size={14} />
          </button>
        </div>
      </div>
      {result && rows.length && xIndex >= 0 && yIndex >= 0 ? (
        <svg
          viewBox={`0 0 ${w} ${h}`}
          role="img"
          aria-label={`${type === "bar" ? "Bar" : "Line"} chart of ${yAxis} by ${xAxis}`}
        >
          {[0, 0.5, 1].map((fraction) => (
            <g key={fraction}>
              <line
                x1={left}
                y1={base - fraction * (base - top)}
                x2={w - right}
                y2={base - fraction * (base - top)}
                stroke="#e8e2ed"
                strokeDasharray="3 5"
              />
              <text
                x="0"
                y={base - fraction * (base - top) + 4}
                fontSize="9"
                fill="#a194b0"
              >
                {formatValue(min + fraction * range, yAxis)}
              </text>
            </g>
          ))}
          <line x1={left} x2={w - right} y1={zero} y2={zero} stroke="#d9d0e1" />
          {type === "line" && (
            <path
              d={path}
              stroke="#8b74b1"
              strokeWidth="2.5"
              fill="none"
              strokeLinejoin="round"
            />
          )}
          {rows.map((row, index) => {
            const x = points[index][0],
              yy = points[index][1];
            return (
              <g key={index}>
                {type === "bar" ? (
                  <rect
                    data-testid="chart-bar"
                    x={x - barWidth / 2}
                    y={Math.min(yy, zero)}
                    width={barWidth}
                    height={Math.max(1, Math.abs(yy - zero))}
                    rx="3"
                    fill={index === rows.length - 1 ? "#8769ae" : "#c6b7d9"}
                  >
                    <title>
                      {String(row[xIndex] ?? "NULL")}:{" "}
                      {formatValue(row[yIndex], yAxis)}
                    </title>
                  </rect>
                ) : (
                  <circle
                    cx={x}
                    cy={yy}
                    r="3"
                    fill="#fff"
                    stroke="#8b74b1"
                    strokeWidth="1.8"
                  >
                    <title>
                      {String(row[xIndex] ?? "NULL")}:{" "}
                      {formatValue(row[yIndex], yAxis)}
                    </title>
                  </circle>
                )}
                {(rows.length <= 10 ||
                  index % Math.ceil(rows.length / 8) === 0) && (
                  <text
                    x={x}
                    y="198"
                    textAnchor="middle"
                    fontSize="9"
                    fill="#a194b0"
                  >
                    {String(row[xIndex] ?? "NULL").slice(0, 16)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      ) : (
        <div className="chart-empty">
          <ChartNoAxesCombined size={25} />
          <strong>A chart follows your data.</strong>
          <span>
            Run a query with a numeric column to visualize its result.
          </span>
        </div>
      )}
      <div className="chart-footnote">
        <span>
          <i />
          Row-based plot · aggregate in SQL when needed
        </span>
        <span>
          {(result?.rows.length || 0) > 40
            ? "First 40 returned rows"
            : `${rows.length} plotted rows`}
        </span>
      </div>
    </div>
  );
}
