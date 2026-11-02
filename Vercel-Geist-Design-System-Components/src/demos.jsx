import React, { useEffect, useId, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowDownUp,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  GitBranch,
  Globe,
  Loader2,
  Mail,
  Plus,
  RotateCcw,
  Shield,
  Trash2,
} from "lucide-react";
import { Button, Tooltip } from "./components.jsx";

export function ButtonsDemo({ onCreate, onDelete, onNotify, canDelete }) {
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <div className="button-demo">
      <div className="demo-row">
        <Button onClick={onCreate}>
          <Plus size={14} />
          Create project
        </Button>
        <Button
          variant="secondary"
          onClick={() => onNotify("info", "Secondary action selected")}
        >
          Secondary
        </Button>
        <Button
          variant="ghost"
          onClick={() => onNotify("info", "Ghost action selected")}
        >
          Ghost
          <ArrowUpRight size={13} />
        </Button>
      </div>
      <div className="demo-row">
        <Button variant="destructive" disabled={!canDelete} onClick={onDelete}>
          <Trash2 size={13} />
          Delete
        </Button>
        <Button
          variant="secondary"
          disabled={loading}
          aria-busy={loading}
          onClick={() => {
            setLoading(true);
            timer.current = setTimeout(() => {
              setLoading(false);
              onNotify("success", "Demo changes saved");
            }, 900);
          }}
        >
          {loading ? (
            <Loader2 size={13} className="spin" />
          ) : (
            <Check size={13} />
          )}{" "}
          {loading ? "Saving…" : "Save changes"}
        </Button>
        <Button variant="secondary" disabled>
          Disabled
        </Button>
      </div>
      <div className="size-row">
        <span className="small-label">SIZES</span>
        <Button
          size="small"
          onClick={() => onNotify("info", "Small button selected")}
        >
          Small
        </Button>
        <Button
          size="normal"
          onClick={() => onNotify("info", "Default button selected")}
        >
          Default
        </Button>
        <Button
          size="large"
          onClick={() => onNotify("info", "Large button selected")}
        >
          Large
        </Button>
      </div>
    </div>
  );
}
export function InputDemo() {
  const [email, setEmail] = useState(""),
    [submitted, setSubmitted] = useState("");
  return (
    <form
      className="input-demo"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(email);
      }}
    >
      <label>
        Email address
        <div className="input-icon">
          <Mail size={14} />
          <input
            type="email"
            aria-label="Email address"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setSubmitted("");
            }}
          />
        </div>
      </label>
      <p className="field-hint">Demo only. No email is sent or stored.</p>
      <div className="input-actions">
        <Button type="submit">
          Subscribe
          <ArrowRight size={13} />
        </Button>
        <span>Native email validation</span>
      </div>
      {submitted && (
        <div role="status" className="input-feedback">
          <Check size={13} />
          Demo submission accepted for {submitted}
        </div>
      )}
    </form>
  );
}
export function SelectDemo() {
  const [environment, setEnvironment] = useState("Production"),
    [region, setRegion] = useState("iad1");
  return (
    <div className="select-demo">
      <div className="two-fields">
        <label>
          Environment
          <select
            aria-label="Demo environment"
            value={environment}
            onChange={(event) => setEnvironment(event.target.value)}
          >
            {["Production", "Preview", "Development"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Region
          <select
            aria-label="Demo region"
            value={region}
            onChange={(event) => setRegion(event.target.value)}
          >
            <option value="iad1">Washington, D.C.</option>
            <option value="fra1">Frankfurt</option>
            <option value="hnd1">Tokyo</option>
          </select>
        </label>
      </div>
      <div className="selected-config">
        <Globe size={16} />
        <div>
          <strong>{environment} configuration</strong>
          <span>
            {region} ·{" "}
            {environment === "Production"
              ? "Stable release"
              : environment === "Preview"
                ? "Branch preview"
                : "Local development"}
          </span>
        </div>
        <span className="badge neutral">Sample</span>
      </div>
    </div>
  );
}
export function SwitchDemo() {
  const [notifications, setNotifications] = useState(true),
    [analytics, setAnalytics] = useState(false),
    [density, setDensity] = useState("comfortable");
  const id = useId();
  return (
    <div className={`switch-demo density-${density}`}>
      <div className="setting-row">
        <div>
          <strong>Email notifications</strong>
          <p>Updates about your sample projects.</p>
        </div>
        <button
          role="switch"
          aria-label="Email notifications"
          aria-checked={notifications}
          className="switch"
          onClick={() => setNotifications((value) => !value)}
        >
          <span />
        </button>
      </div>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={analytics}
          onChange={(event) => setAnalytics(event.target.checked)}
        />
        <span>
          Enable sample usage analytics
          <small>Preference demo; no events are collected.</small>
        </span>
      </label>
      <fieldset className="density-options">
        <legend>Display density</legend>
        {["comfortable", "compact"].map((value) => (
          <label key={value}>
            <input
              type="radio"
              name={id}
              value={value}
              checked={density === value}
              onChange={() => setDensity(value)}
            />
            {value[0].toUpperCase() + value.slice(1)}
          </label>
        ))}
      </fieldset>
      <div className="preference-summary">
        Notifications {notifications ? "on" : "off"} <span>·</span> Analytics{" "}
        {analytics ? "on" : "off"} <span>·</span> {density} spacing
      </div>
    </div>
  );
}
export function TabsDemo({ onNotify }) {
  const [active, setActive] = useState("Overview"),
    [name, setName] = useState("khanomi-web");
  const refs = useRef([]);
  const id = useId();
  const tabs = ["Overview", "Activity", "Settings"];
  return (
    <div className="tabs-demo">
      <div
        role="tablist"
        aria-label="Project detail tabs"
        className="demo-tablist"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab}
            ref={(el) => (refs.current[index] = el)}
            role="tab"
            id={`${id}-${tab}`}
            aria-selected={active === tab}
            aria-controls={`${id}-content`}
            tabIndex={active === tab ? 0 : -1}
            onClick={() => setActive(tab)}
            onKeyDown={(event) => {
              let next;
              if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
              if (event.key === "ArrowLeft")
                next = (index + tabs.length - 1) % tabs.length;
              if (event.key === "Home") next = 0;
              if (event.key === "End") next = tabs.length - 1;
              if (next !== undefined) {
                event.preventDefault();
                setActive(tabs[next]);
                refs.current[next]?.focus();
              }
            }}
          >
            {tab}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`${id}-content`}
        aria-labelledby={`${id}-${active}`}
        className="demo-tabpanel"
      >
        {active === "Overview" ? (
          <>
            <span className="badge success">
              <i />
              Ready
            </span>
            <h3>Your next idea starts here.</h3>
            <p>
              A sample deployment overview, designed to stay out of the way.
            </p>
            <div className="mini-stats">
              <span>
                <strong>99.9%</strong>Sample uptime
              </span>
              <span>
                <strong>128 ms</strong>Sample latency
              </span>
              <span>
                <strong>iad1</strong>Region
              </span>
            </div>
          </>
        ) : active === "Activity" ? (
          <div className="activity-list">
            <div>
              <span className="activity-dot" />
              <strong>Sample build completed</strong>
              <time>2m ago</time>
            </div>
            <div>
              <span className="activity-dot" />
              <strong>Preview configuration updated</strong>
              <time>12m ago</time>
            </div>
            <div>
              <span className="activity-dot" />
              <strong>Project created</strong>
              <time>1h ago</time>
            </div>
          </div>
        ) : (
          <form
            className="tab-settings"
            onSubmit={(event) => {
              event.preventDefault();
              onNotify("success", `Demo settings saved for ${name}`);
            }}
          >
            <label>
              Sample project name
              <input
                aria-label="Sample project name"
                required
                maxLength={80}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <Button type="submit" size="small">
              Save demo settings
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
export function BadgesDemo() {
  return (
    <div className="badges-demo">
      <span className="small-label">STATUS & CONTEXT</span>
      <div className="demo-row">
        <span className="badge success">
          <i />
          Ready
        </span>
        <span className="badge warning">
          <i />
          Building
        </span>
        <span className="badge error">
          <i />
          Error
        </span>
        <span className="badge neutral">Preview</span>
        <span className="badge blue">New</span>
      </div>
      <span className="small-label avatar-label">PEOPLE & TEAMS</span>
      <div className="avatar-row">
        <span className="avatar avatar-lg" role="img" aria-label="Kasra">
          K
        </span>
        <span className="avatar mauve" role="img" aria-label="Maya">
          M
        </span>
        <span className="avatar sand" role="img" aria-label="Alex">
          A
        </span>
        <div className="avatar-stack">
          <span className="avatar" role="img" aria-label="Kasra">
            K
          </span>
          <span className="avatar mauve" role="img" aria-label="Maya">
            M
          </span>
          <span className="avatar sand" role="img" aria-label="Alex">
            A
          </span>
          <span
            className="avatar overflow-avatar"
            aria-label="3 more sample members"
          >
            +3
          </span>
        </div>
        <span className="avatar-note">A small, focused team.</span>
      </div>
    </div>
  );
}
export function ProjectsDemo({ projects, onCreate, onOpen, onDelete }) {
  const [search, setSearch] = useState(""),
    [environment, setEnvironment] = useState("All environments"),
    [sort, setSort] = useState("asc");
  const rows = projects
    .filter(
      (project) =>
        (environment === "All environments" ||
          project.environment === environment) &&
        project.name.toLowerCase().includes(search.toLowerCase()),
    )
    .toSorted(
      (a, b) => (sort === "asc" ? 1 : -1) * a.name.localeCompare(b.name),
    );
  return (
    <div className="projects-demo">
      <div className="project-toolbar">
        <div className="project-search">
          <SearchIcon />
          <input
            aria-label="Search demo projects"
            placeholder="Search projects..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <select
          aria-label="Project environment filter"
          value={environment}
          onChange={(event) => setEnvironment(event.target.value)}
        >
          {["All environments", "Production", "Preview", "Development"].map(
            (value) => (
              <option key={value}>{value}</option>
            ),
          )}
        </select>
        <Button size="small" onClick={onCreate}>
          <Plus size={12} />
          New project
        </Button>
      </div>
      <div className="project-table-scroll">
        <table aria-label="Demo projects">
          <thead>
            <tr>
              <th aria-sort={sort === "asc" ? "ascending" : "descending"}>
                <button
                  onClick={() =>
                    setSort((value) => (value === "asc" ? "desc" : "asc"))
                  }
                >
                  Project
                  <ArrowDown
                    size={11}
                    className={sort === "desc" ? "flipped" : ""}
                  />
                </button>
              </th>
              <th>Status</th>
              <th>Environment</th>
              <th>Updated</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((project) => (
                <tr key={project.id}>
                  <td>
                    <button
                      className="project-open"
                      aria-label={`Open project ${project.name}`}
                      onClick={() => onOpen(project)}
                    >
                      <span className="project-triangle">▲</span>
                      <span>
                        <strong>{project.name}</strong>
                        <small>
                          {project.framework} · {project.url}
                        </small>
                      </span>
                    </button>
                  </td>
                  <td>
                    <span
                      className={`badge ${project.status === "Ready" ? "success" : project.status === "Error" ? "error" : "warning"}`}
                    >
                      <i />
                      {project.status}
                    </span>
                  </td>
                  <td>
                    <span className="environment-cell">
                      <GitBranch size={12} />
                      {project.environment}
                    </span>
                  </td>
                  <td className="updated-cell">{project.updated}</td>
                  <td>
                    <button
                      className="icon-button delete-icon"
                      aria-label={`Delete project ${project.name}`}
                      onClick={() => onDelete(project)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>
                  <div className="table-empty">
                    No matching projects. Try another filter.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="project-table-footer">
        <span>
          {rows.length} of {projects.length} sample projects
        </span>
        <span>Session data · no deployment is created</span>
      </div>
    </div>
  );
}
function SearchIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" />
      <path d="m12 12 5 5" stroke="currentColor" />
    </svg>
  );
}
export function DialogDemo({ onOpen }) {
  return (
    <div className="dialog-demo">
      <span className="dialog-demo-icon">
        <Plus size={22} />
      </span>
      <h3>Give your next idea a home.</h3>
      <p>A focused dialog for creating a sample project.</p>
      <Button variant="secondary" onClick={onOpen}>
        Open dialog
        <ArrowUpRight size={13} />
      </Button>
    </div>
  );
}
export function ToastDemo({ onNotify }) {
  return (
    <div className="toast-demo">
      <p>Small signals. Clear outcomes.</p>
      <div className="demo-row">
        <Button
          variant="secondary"
          onClick={() =>
            onNotify("success", "Sample operation completed successfully")
          }
        >
          Show success
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            onNotify("info", "This is an informational sample notice")
          }
        >
          Show info
        </Button>
        <Button
          variant="secondary"
          onClick={() => onNotify("error", "Sample error: please try again")}
        >
          Show error
        </Button>
      </div>
      <small>Notifications can be dismissed and expire automatically.</small>
    </div>
  );
}
export function TooltipDemo({ onCopy }) {
  return (
    <div className="tooltip-demo">
      <p>Hover or focus the trigger for a little more context.</p>
      <div className="tooltip-row">
        <Tooltip text="Copy a sample command">
          <button
            aria-label="Copy sample command"
            className="btn btn-secondary"
            onClick={() => onCopy("npm run build")}
          >
            <Copy size={14} />
            Copy command
          </button>
        </Tooltip>
        <Tooltip text="This sample is protected">
          <span className="tooltip-static">
            <Shield size={19} />
          </span>
        </Tooltip>
      </div>
      <span className="field-hint">
        Tooltips are available to keyboard focus as well as pointer hover.
      </span>
    </div>
  );
}
export function ProgressDemo() {
  const [value, setValue] = useState(40);
  return (
    <div className="progress-demo">
      <div className="progress-top">
        <strong>Build artifacts</strong>
        <span>{value}%</span>
      </div>
      <progress aria-label="Build progress" value={value} max="100" />
      <div className="progress-caption">
        {value === 100 ? (
          <>
            <Check size={13} />
            Demo build complete
          </>
        ) : (
          <>
            <span className="tiny-spinner" />
            Simulated progress · no build service connected
          </>
        )}
      </div>
      <div className="demo-row">
        <Button
          size="small"
          disabled={value === 100}
          onClick={() => setValue((current) => Math.min(100, current + 20))}
        >
          Advance
          <ArrowRight size={12} />
        </Button>
        <Button variant="secondary" size="small" onClick={() => setValue(0)}>
          <RotateCcw size={12} />
          Reset
        </Button>
      </div>
      {value < 100 && (
        <div className="skeleton-preview" aria-label="Loading skeleton">
          <span />
          <span />
          <span />
        </div>
      )}
    </div>
  );
}
