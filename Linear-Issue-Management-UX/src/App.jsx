import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownUp,
  ArrowLeft,
  ArrowUpRight,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  CircleDashed,
  CircleDot,
  Command,
  Ellipsis,
  Flag,
  FolderKanban,
  Inbox,
  Layers,
  LayoutGrid,
  List,
  Menu,
  MessageSquare,
  Plus,
  Search,
  Send,
  Settings2,
  SignalHigh,
  SignalLow,
  SignalMedium,
  Star,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import {
  loadIssues,
  people,
  priorities,
  projects,
  statuses,
  STORAGE_KEY,
} from "./data.js";

const statusIcons = {
  Backlog: CircleDashed,
  Todo: Circle,
  "In Progress": CircleDot,
  "In Review": CircleDot,
  Done: CheckCircle2,
};
const statusClass = (value) => value.toLowerCase().replaceAll(" ", "-");
function StatusIcon({ status, size = 15 }) {
  const Icon = statusIcons[status] || Circle;
  return <Icon size={size} className={`status-icon ${statusClass(status)}`} />;
}
function PriorityIcon({ priority }) {
  const Icon =
    { Urgent: Flag, High: SignalHigh, Medium: SignalMedium, Low: SignalLow }[
      priority
    ] || Ellipsis;
  return (
    <Icon size={15} className={priority === "Urgent" ? "urgent" : "muted"} />
  );
}
function Avatar({ name, small = false }) {
  return (
    <span
      title={name}
      className={`avatar ${small ? "small" : ""} person-${name.toLowerCase()}`}
    >
      {name === "Unassigned" ? <UserRound size={12} /> : name.slice(0, 1)}
    </span>
  );
}
function Modal({ children, onClose, titleId, className = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    el.showModal();
    el.querySelector("[data-autofocus]")?.focus();
    return () => el.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={className}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      {children}
    </dialog>
  );
}
const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        timeZone: "Asia/Tehran",
      }).format(new Date(value))
    : "";

export default function App() {
  const [issues, setIssues] = useState(loadIssues);
  const [section, setSection] = useState("All issues");
  const [layout, setLayout] = useState("list");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [priorityFilter, setPriorityFilter] = useState("All priorities");
  const [sort, setSort] = useState("Manual");
  const [selectedId, setSelectedId] = useState(null);
  const [create, setCreate] = useState(false);
  const [command, setCommand] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [notice, setNotice] = useState("");
  const [storageError, setStorageError] = useState(false);
  const [collapsed, setCollapsed] = useState({});
  const selected = issues.find((issue) => issue.id === selectedId);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(issues));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [issues]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    function keyboard(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (!selectedId && !create) setCommand((value) => !value);
      }
      const editing =
        ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName) ||
        event.target.isContentEditable;
      if (
        !editing &&
        !selectedId &&
        !create &&
        !command &&
        event.key.toLowerCase() === "c" &&
        !event.metaKey &&
        !event.ctrlKey
      ) {
        event.preventDefault();
        setCreate(true);
      }
    }
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, [selectedId, create, command]);
  const navigate = (next) => {
    setSection(next);
    setQuery("");
    setStatusFilter("All statuses");
    setPriorityFilter("All priorities");
    setMobileNav(false);
  };
  const updateIssue = (id, patch, activity) => {
    setIssues((current) =>
      current.map((issue) =>
        issue.id !== id
          ? issue
          : {
              ...issue,
              ...patch,
              activity: activity
                ? [
                    ...issue.activity,
                    {
                      text: activity,
                      author: "Kasra",
                      at: new Date().toISOString(),
                    },
                  ]
                : issue.activity,
            },
      ),
    );
  };
  const createIssue = (draft) => {
    const number =
      Math.max(
        100,
        ...issues.map((issue) => Number(issue.id.split("-")[1]) || 0),
      ) + 1;
    const issue = {
      ...draft,
      id: `KHA-${number}`,
      createdAt: new Date().toISOString(),
      starred: false,
      dueDate: "",
      comments: [],
      activity: [
        {
          text: "created this issue",
          author: "Kasra",
          at: new Date().toISOString(),
        },
      ],
    };
    setIssues((current) => [...current, issue]);
    setCreate(false);
    navigate("All issues");
    setCollapsed({});
    setNotice(`${issue.id} created`);
  };
  const visible = useMemo(() => {
    let result = issues.filter((issue) => {
      if (section === "My issues" && issue.assignee !== "Kasra") return false;
      if (section === "Favorites" && !issue.starred) return false;
      if (
        section === "Active" &&
        !["In Progress", "In Review"].includes(issue.status)
      )
        return false;
      if (section === "Backlog" && issue.status !== "Backlog") return false;
      if (
        projects.some((project) => project.name === section) &&
        issue.project !== section
      )
        return false;
      return (
        (statusFilter === "All statuses" || issue.status === statusFilter) &&
        (priorityFilter === "All priorities" ||
          issue.priority === priorityFilter) &&
        `${issue.id} ${issue.title} ${issue.label} ${issue.description}`
          .toLowerCase()
          .includes(query.toLowerCase())
      );
    });
    if (sort === "Priority")
      result = result.toSorted(
        (a, b) =>
          priorities.indexOf(a.priority) - priorities.indexOf(b.priority),
      );
    if (sort === "Title")
      result = result.toSorted((a, b) => a.title.localeCompare(b.title));
    if (sort === "Newest")
      result = result.toSorted(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
    return result;
  }, [issues, section, query, statusFilter, priorityFilter, sort]);
  const activeCount = issues.filter((issue) =>
    ["In Progress", "In Review"].includes(issue.status),
  ).length;
  const doneCount = issues.filter((issue) => issue.status === "Done").length;
  const isProjects = section === "Projects";
  const isInbox = section === "Inbox";
  const filtered =
    statusFilter !== "All statuses" ||
    priorityFilter !== "All priorities" ||
    query;
  const navButton = (label, Icon, count) => (
    <button
      key={label}
      className={`nav-item ${section === label ? "selected" : ""}`}
      onClick={() => navigate(label)}
    >
      <Icon size={16} />
      <span>{label}</span>
      {count !== undefined && <span className="nav-count">{count}</span>}
    </button>
  );
  return (
    <div className="app-shell">
      {mobileNav && (
        <button
          className="nav-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileNav(false)}
        />
      )}
      <aside className={`sidebar ${mobileNav ? "mobile-open" : ""}`}>
        <div className="workspace">
          <span className="workspace-icon">K</span>
          <strong>Khanomi</strong>
          <span className="workspace-badge">Workspace</span>
          <button
            aria-label="Close navigation"
            className="icon-button mobile-only"
            onClick={() => setMobileNav(false)}
          >
            <X size={16} />
          </button>
        </div>
        <div className="quick-actions">
          <button className="search-launch" onClick={() => setCommand(true)}>
            <Search size={15} />
            <span>Search anything</span>
            <kbd>⌘ K</kbd>
          </button>
          <button
            className="compose-button"
            aria-label="Create issue"
            onClick={() => setCreate(true)}
          >
            <Plus size={17} />
          </button>
        </div>
        <nav aria-label="Workspace navigation">
          {navButton(
            "Inbox",
            Inbox,
            issues.reduce((sum, issue) => sum + issue.comments.length, 0) ||
              undefined,
          )}
          {navButton(
            "My issues",
            CircleDot,
            issues.filter((issue) => issue.assignee === "Kasra").length,
          )}
          <div className="nav-heading">Workspace</div>
          {navButton("All issues", Layers, issues.length)}
          {navButton("Projects", FolderKanban, projects.length)}
          {navButton("Favorites", Star)}
          <div className="nav-heading team-heading">
            <ChevronDown size={12} />
            Your teams
            <button
              aria-label="Create team issue"
              onClick={() => setCreate(true)}
            >
              <Plus size={13} />
            </button>
          </div>
          <div className="team-title">
            <span className="team-icon">K</span>
            <strong>Khanomi product</strong>
            <ChevronDown size={12} />
          </div>
          <div className="team-links">
            {navButton("Active", CircleDot, activeCount)}
            {navButton(
              "Backlog",
              CircleDashed,
              issues.filter((issue) => issue.status === "Backlog").length,
            )}
          </div>
          <div className="nav-heading">Projects</div>
          {projects.map((project) => (
            <button
              key={project.name}
              onClick={() => navigate(project.name)}
              className={`nav-item project-nav ${section === project.name ? "selected" : ""}`}
            >
              <span
                className="project-dot"
                style={{ background: project.color }}
              />
              <span>{project.name}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="study-label">
            <span className="live-dot" />
            Independent UX study
          </div>
          <div className="profile">
            <Avatar name="Kasra" />
            <div>
              <strong>kasrapmb</strong>
              <span>Local workspace</span>
            </div>
            <span className="profile-shortcut">K</span>
          </div>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              aria-label="Open navigation"
              className="icon-button mobile-only"
              onClick={() => setMobileNav(true)}
            >
              <Menu size={18} />
            </button>
            <span className="team-icon">K</span>
            <span>Khanomi product</span>
            <ChevronRight size={13} />
            <strong>{section}</strong>
          </div>
          <div className="topbar-right">
            <span className="demo-indicator">Local demo</span>
            <button
              className="icon-button"
              aria-label="Search issues"
              onClick={() => setCommand(true)}
            >
              <Search size={16} />
            </button>
            <button
              className="icon-button"
              aria-label="Open inbox"
              onClick={() => navigate("Inbox")}
            >
              <Bell size={16} />
            </button>
            <Avatar name="Kasra" />
          </div>
        </header>
        <section className="page-heading">
          <div>
            <div className="eyebrow">BUILD WITH INTENTION</div>
            <h1>
              {section}
              <span className="heading-dot">.</span>
            </h1>
            <p>
              {isProjects
                ? "Big ideas, broken into meaningful progress."
                : isInbox
                  ? "Stay close to the conversations that move work forward."
                  : "A clear space for the work that matters."}
            </p>
          </div>
          <button className="primary-button" onClick={() => setCreate(true)}>
            <Plus size={15} />
            New issue<kbd>C</kbd>
          </button>
        </section>
        <section className="overview-strip" aria-label="Workspace overview">
          <div>
            <span className="metric-icon">
              <Layers size={16} />
            </span>
            <span>
              Total issues<strong>{issues.length}</strong>
            </span>
            <div className="mini-bars">
              {[7, 12, 9, 17, 13, 20, 16, 23, 19, 26].map((height, i) => (
                <i key={i} style={{ height }} />
              ))}
            </div>
          </div>
          <div>
            <span className="metric-icon yellow">
              <CircleDot size={17} />
            </span>
            <span>
              In progress
              <strong>
                {
                  issues.filter((issue) => issue.status === "In Progress")
                    .length
                }
                <small>Keep the momentum</small>
              </strong>
            </span>
          </div>
          <div>
            <span className="metric-icon green">
              <CheckCircle2 size={17} />
            </span>
            <span>
              Completed
              <strong>
                {doneCount}
                <small>
                  {issues.length
                    ? Math.round((doneCount / issues.length) * 100)
                    : 0}
                  % of all work
                </small>
              </strong>
            </span>
          </div>
          <div className="progress-metric">
            <span>
              Workspace progress
              <b>
                {issues.length
                  ? Math.round((doneCount / issues.length) * 100)
                  : 0}
                %
              </b>
            </span>
            <div className="progress-track">
              <i
                style={{
                  width: `${issues.length ? (doneCount / issues.length) * 100 : 0}%`,
                }}
              />
            </div>
            <small>One step closer to shipping.</small>
          </div>
        </section>
        {storageError && (
          <div role="alert" className="storage-alert">
            Browser storage is unavailable. Changes will be lost when this page
            closes.
          </div>
        )}
        {isProjects ? (
          <div className="projects-grid">
            {projects.map((project) => {
              const group = issues.filter(
                (issue) => issue.project === project.name,
              );
              const completed = group.filter(
                (issue) => issue.status === "Done",
              ).length;
              return (
                <button
                  className="project-card"
                  key={project.name}
                  onClick={() => navigate(project.name)}
                >
                  <div className="project-card-top">
                    <span
                      style={{
                        background: `${project.color}18`,
                        color: project.color,
                      }}
                    >
                      <FolderKanban size={21} />
                    </span>
                    <ArrowUpRight size={17} />
                  </div>
                  <h2>{project.name}</h2>
                  <p>{project.description}</p>
                  <div className="project-count">
                    <span>
                      {completed} of {group.length} issues complete
                    </span>
                    <span>
                      {group.length
                        ? Math.round((completed / group.length) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="progress-track">
                    <i
                      style={{
                        width: `${group.length ? (completed / group.length) * 100 : 0}%`,
                        background: project.color,
                      }}
                    />
                  </div>
                  <div className="project-card-footer">
                    <span>
                      <Avatar name={project.lead} small />
                      {project.lead}
                    </span>
                    <span>Target {project.target}</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : isInbox ? (
          <InboxView issues={issues} onOpen={setSelectedId} />
        ) : (
          <>
            <div className="view-toolbar">
              <div className="view-tabs">
                <button
                  className={layout === "list" ? "active" : ""}
                  onClick={() => setLayout("list")}
                >
                  <List size={15} />
                  List
                </button>
                <button
                  className={layout === "board" ? "active" : ""}
                  onClick={() => setLayout("board")}
                >
                  <LayoutGrid size={14} />
                  Board
                </button>
                <span className="view-total">{visible.length} issues</span>
              </div>
              <div className="toolbar-actions">
                <div className="inline-search">
                  <Search size={14} />
                  <input
                    aria-label="Filter issues by text"
                    placeholder="Search issues..."
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>
                <details className="filter-menu">
                  <summary>
                    <Settings2 size={14} />
                    Filter{filtered && <i className="filter-dot" />}
                  </summary>
                  <div className="filter-popover">
                    <strong>Filter issues</strong>
                    <label>
                      Status
                      <select
                        aria-label="Filter by status"
                        value={statusFilter}
                        onChange={(event) =>
                          setStatusFilter(event.target.value)
                        }
                      >
                        {["All statuses", ...statuses].map((value) => (
                          <option key={value}>{value}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Priority
                      <select
                        aria-label="Filter by priority"
                        value={priorityFilter}
                        onChange={(event) =>
                          setPriorityFilter(event.target.value)
                        }
                      >
                        {["All priorities", ...priorities].map((value) => (
                          <option key={value}>{value}</option>
                        ))}
                      </select>
                    </label>
                    <button
                      className="subtle-button"
                      onClick={() => {
                        setStatusFilter("All statuses");
                        setPriorityFilter("All priorities");
                        setQuery("");
                      }}
                    >
                      Clear filters
                    </button>
                  </div>
                </details>
                <label className="sort-control">
                  <ArrowDownUp size={13} />
                  <select
                    aria-label="Sort issues"
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                  >
                    {["Manual", "Priority", "Title", "Newest"].map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
            {filtered && (
              <div className="active-filter-line">
                <span>{visible.length} matching issues</span>
                <button
                  onClick={() => {
                    setStatusFilter("All statuses");
                    setPriorityFilter("All priorities");
                    setQuery("");
                  }}
                >
                  Clear filters
                  <X size={12} />
                </button>
              </div>
            )}
            {!visible.length ? (
              <div className="empty-state">
                <Search size={30} />
                <h2>No issues found</h2>
                <p>Try another search or create a new issue to get started.</p>
                <button
                  className="subtle-button"
                  onClick={() => setCreate(true)}
                >
                  <Plus size={14} />
                  Create an issue
                </button>
              </div>
            ) : layout === "list" ? (
              <div className="issue-list">
                {["In Progress", "Todo", "In Review", "Backlog", "Done"].map(
                  (status) => {
                    const group = visible.filter(
                      (issue) => issue.status === status,
                    );
                    if (!group.length) return null;
                    return (
                      <section className="issue-group" key={status}>
                        <div className="group-heading">
                          <button
                            aria-expanded={!collapsed[status]}
                            onClick={() =>
                              setCollapsed((current) => ({
                                ...current,
                                [status]: !current[status],
                              }))
                            }
                          >
                            <ChevronDown
                              size={13}
                              className={collapsed[status] ? "collapsed" : ""}
                            />
                            <StatusIcon status={status} />
                            <strong>{status}</strong>
                            <span>{group.length}</span>
                          </button>
                          <button
                            className="icon-button"
                            aria-label={`Add ${status} issue`}
                            onClick={() => setCreate(status)}
                          >
                            <Plus size={15} />
                          </button>
                        </div>
                        {!collapsed[status] &&
                          group.map((issue) => (
                            <button
                              className="issue-row"
                              key={issue.id}
                              onClick={() => setSelectedId(issue.id)}
                              aria-label={`Open ${issue.id}: ${issue.title}`}
                            >
                              <PriorityIcon priority={issue.priority} />
                              <span className="issue-id">{issue.id}</span>
                              <StatusIcon status={issue.status} />
                              <span className="issue-title">{issue.title}</span>
                              <span
                                className={`issue-label label-${issue.label.toLowerCase()}`}
                              >
                                <i />
                                {issue.label}
                              </span>
                              <span className="row-project">
                                {issue.project}
                              </span>
                              <Avatar name={issue.assignee} small />
                              <span className="row-date">
                                {formatDate(issue.createdAt)}
                              </span>
                            </button>
                          ))}
                      </section>
                    );
                  },
                )}
                <div className="list-footer">
                  <span>
                    <CheckCircle2 size={13} />
                    {storageError ? "Changes are not saved" : "All changes saved locally"}
                  </span>
                  <span>{issues.length} issues in your workspace</span>
                </div>
              </div>
            ) : (
              <div className="board">
                {statuses.map((status) => (
                  <section
                    className="board-column"
                    key={status}
                    aria-label={`${status} column`}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      const id = event.dataTransfer.getData("text/plain");
                      if (
                        issues.some(
                          (issue) => issue.id === id && issue.status !== status,
                        )
                      ) {
                        updateIssue(id, { status }, `moved to ${status}`);
                        setNotice(`Moved to ${status}`);
                      }
                    }}
                  >
                    <div className="board-heading">
                      <StatusIcon status={status} />
                      <strong>{status}</strong>
                      <span>
                        {
                          visible.filter((issue) => issue.status === status)
                            .length
                        }
                      </span>
                      <button
                        className="icon-button"
                        aria-label={`Add ${status} issue`}
                        onClick={() => setCreate(status)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    {visible
                      .filter((issue) => issue.status === status)
                      .map((issue) => (
                        <button
                          draggable
                          className="issue-card"
                          key={issue.id}
                          onDragStart={(event) =>
                            event.dataTransfer.setData("text/plain", issue.id)
                          }
                          onClick={() => setSelectedId(issue.id)}
                          aria-label={`Open ${issue.id}: ${issue.title}`}
                        >
                          <span className="card-id">
                            <span>{issue.id}</span>
                            <PriorityIcon priority={issue.priority} />
                          </span>
                          <strong>{issue.title}</strong>
                          <span className="card-bottom">
                            <span
                              className={`issue-label label-${issue.label.toLowerCase()}`}
                            >
                              <i />
                              {issue.label}
                            </span>
                            <Avatar name={issue.assignee} small />
                          </span>
                        </button>
                      ))}
                  </section>
                ))}
              </div>
            )}
          </>
        )}
        <footer className="app-footer">
          <span>
            <span className="linear-mark" />
            Linear-inspired workspace
          </span>
          <span>Built for focus. Made to move.</span>
          <span>Demo data · browser storage</span>
        </footer>
      </main>
      {create && (
        <CreateIssue
          initialStatus={typeof create === "string" ? create : "Todo"}
          onClose={() => setCreate(false)}
          onCreate={createIssue}
        />
      )}
      {selected && (
        <IssueDetail
          issue={selected}
          onClose={() => setSelectedId(null)}
          onUpdate={(patch, activity) =>
            updateIssue(selected.id, patch, activity)
          }
          onDelete={() => {
            if (
              window.confirm(`Delete ${selected.id}? This cannot be undone.`)
            ) {
              setIssues((current) =>
                current.filter((issue) => issue.id !== selected.id),
              );
              setSelectedId(null);
              setNotice("Issue deleted");
            }
          }}
        />
      )}
      {command && (
        <CommandMenu
          issues={issues}
          onClose={() => setCommand(false)}
          onOpen={(id) => {
            setCommand(false);
            setSelectedId(id);
          }}
          onCreate={() => {
            setCommand(false);
            setCreate(true);
          }}
        />
      )}
      {notice && (
        <div role="status" className="toast">
          <Check size={16} />
          {notice}
        </div>
      )}
    </div>
  );
}

function CreateIssue({ initialStatus, onClose, onCreate }) {
  const [draft, setDraft] = useState({
    title: "",
    description: "",
    status: initialStatus,
    priority: "Medium",
    assignee: "Kasra",
    project: projects[0].name,
    label: "Feature",
  });
  const set = (key, value) =>
    setDraft((current) => ({ ...current, [key]: value }));
  return (
    <Modal onClose={onClose} titleId="create-title" className="create-dialog">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (draft.title.trim())
            onCreate({
              ...draft,
              title: draft.title.trim(),
              description: draft.description.trim(),
            });
        }}
      >
        <div className="modal-top">
          <span className="team-icon">K</span>
          <h2 id="create-title">New issue</h2>
          <ChevronRight size={13} />
          <span>Khanomi product</span>
          <button
            type="button"
            className="icon-button"
            aria-label="Close new issue"
            onClick={onClose}
          >
            <X size={17} />
          </button>
        </div>
        <div className="create-fields">
          <input
            data-autofocus
            aria-label="Issue title"
            required
            maxLength={180}
            placeholder="Issue title"
            value={draft.title}
            onChange={(event) => set("title", event.target.value)}
          />
          <textarea
            aria-label="Issue description"
            placeholder="Add a description, context, or acceptance criteria..."
            value={draft.description}
            onChange={(event) => set("description", event.target.value)}
            rows={5}
          />
          <div className="create-properties">
            <label>
              Status
              <select
                aria-label="Status"
                value={draft.status}
                onChange={(event) => set("status", event.target.value)}
              >
                {statuses.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label>
              Priority
              <select
                aria-label="Priority"
                value={draft.priority}
                onChange={(event) => set("priority", event.target.value)}
              >
                {priorities.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label>
              Assignee
              <select
                aria-label="Assignee"
                value={draft.assignee}
                onChange={(event) => set("assignee", event.target.value)}
              >
                {people.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label>
              Project
              <select
                aria-label="Project"
                value={draft.project}
                onChange={(event) => set("project", event.target.value)}
              >
                {projects.map((project) => (
                  <option key={project.name}>{project.name}</option>
                ))}
              </select>
            </label>
            <label>
              Label
              <select
                aria-label="Label"
                value={draft.label}
                onChange={(event) => set("label", event.target.value)}
              >
                {[
                  "Feature",
                  "Design",
                  "Bug",
                  "Performance",
                  "Documentation",
                  "Research",
                ].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <div className="modal-bottom">
          <span>Saved in this browser only</span>
          <button
            className="primary-button"
            disabled={!draft.title.trim()}
            type="submit"
          >
            Create issue
            <ArrowUpRight size={14} />
          </button>
        </div>
      </form>
    </Modal>
  );
}

function IssueDetail({ issue, onClose, onUpdate, onDelete }) {
  const [comment, setComment] = useState("");
  const changeProperty = (key, value) =>
    onUpdate({ [key]: value }, `changed ${key} to ${value}`);
  return (
    <Modal onClose={onClose} titleId="detail-title" className="detail-dialog">
      <div className="detail-top">
        <button
          className="icon-button"
          aria-label="Close issue details"
          onClick={onClose}
        >
          <ArrowLeft size={17} />
        </button>
        <span>{issue.id}</span>
        <span className="detail-top-spacer" />
        <button
          className={`icon-button ${issue.starred ? "starred" : ""}`}
          aria-label={
            issue.starred ? "Remove from favorites" : "Add to favorites"
          }
          onClick={() => onUpdate({ starred: !issue.starred })}
        >
          <Star size={16} fill={issue.starred ? "currentColor" : "none"} />
        </button>
        <button
          className="icon-button danger"
          aria-label="Delete issue"
          onClick={onDelete}
        >
          <Trash2 size={16} />
        </button>
        <button
          className="icon-button"
          aria-label="Close details"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>
      <div className="detail-body">
        <div className="detail-main">
          <div className="detail-breadcrumb">
            <span className="project-dot" />
            {issue.project}
            <ChevronRight size={12} />
            {issue.id}
          </div>
          <h2 id="detail-title" className="sr-only">
            {issue.id} details
          </h2>
          <textarea
            className="detail-title"
            aria-label="Edit issue title"
            maxLength={180}
            rows={2}
            value={issue.title}
            onChange={(event) => onUpdate({ title: event.target.value })}
            onBlur={() => {
              if (!issue.title.trim()) onUpdate({ title: "Untitled issue" });
            }}
          />
          <textarea
            className="detail-description"
            aria-label="Edit issue description"
            rows={6}
            value={issue.description}
            placeholder="Add a description..."
            onChange={(event) => onUpdate({ description: event.target.value })}
          />
          <div className="activity-heading">
            <h3>Activity</h3>
            <span>{issue.activity.length + issue.comments.length}</span>
          </div>
          <div className="activity-list">
            {issue.activity.map((event, index) => (
              <div className="activity-event" key={index}>
                <Avatar name={event.author} small />
                <span>
                  <b>{event.author}</b> {event.text}
                </span>
                <time>{formatDate(event.at)}</time>
              </div>
            ))}
            {issue.comments.map((entry, index) => (
              <div className="comment" key={index}>
                <Avatar name={entry.author} small />
                <div>
                  <header>
                    <strong>{entry.author}</strong>
                    <time>{formatDate(entry.at)}</time>
                  </header>
                  <p>{entry.text}</p>
                </div>
              </div>
            ))}
          </div>
          <form
            className="comment-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!comment.trim()) return;
              onUpdate({
                comments: [
                  ...issue.comments,
                  {
                    author: "Kasra",
                    text: comment.trim(),
                    at: new Date().toISOString(),
                  },
                ],
              });
              setComment("");
            }}
          >
            <textarea
              aria-label="Write a comment"
              placeholder="Leave a comment..."
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={3}
              maxLength={5000}
            />
            <div>
              <span>
                <MessageSquare size={13} />
                Keep the conversation moving
              </span>
              <button
                className="primary-button"
                aria-label="Post comment"
                disabled={!comment.trim()}
              >
                <Send size={14} />
              </button>
            </div>
          </form>
        </div>
        <aside className="detail-properties">
          <h3>Properties</h3>
          <label>
            <span>
              <StatusIcon status={issue.status} />
              Status
            </span>
            <select
              aria-label="Issue status"
              value={issue.status}
              onChange={(event) => changeProperty("status", event.target.value)}
            >
              {statuses.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            <span>
              <PriorityIcon priority={issue.priority} />
              Priority
            </span>
            <select
              aria-label="Issue priority"
              value={issue.priority}
              onChange={(event) =>
                changeProperty("priority", event.target.value)
              }
            >
              {priorities.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            <span>
              <UserRound size={14} />
              Assignee
            </span>
            <select
              aria-label="Issue assignee"
              value={issue.assignee}
              onChange={(event) =>
                changeProperty("assignee", event.target.value)
              }
            >
              {people.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            <span>
              <FolderKanban size={14} />
              Project
            </span>
            <select
              aria-label="Issue project"
              value={issue.project}
              onChange={(event) =>
                changeProperty("project", event.target.value)
              }
            >
              {projects.map((project) => (
                <option key={project.name}>{project.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span>
              <Flag size={14} />
              Due date
            </span>
            <input
              type="date"
              aria-label="Issue due date"
              value={issue.dueDate || ""}
              onChange={(event) =>
                changeProperty("dueDate", event.target.value)
              }
            />
          </label>
          <div className="property-divider" />
          <h3>Label</h3>
          <span className={`issue-label label-${issue.label.toLowerCase()}`}>
            <i />
            {issue.label}
          </span>
          <div className="detail-note">
            <span className="live-dot" />
            <span>
              Changes save automatically
              <br />
              in this browser.
            </span>
          </div>
        </aside>
      </div>
    </Modal>
  );
}

function CommandMenu({ issues, onClose, onOpen, onCreate }) {
  const [query, setQuery] = useState("");
  const matches = issues
    .filter((issue) =>
      `${issue.id} ${issue.title}`.toLowerCase().includes(query.toLowerCase()),
    )
    .slice(0, 8);
  return (
    <Modal onClose={onClose} titleId="search-title" className="command-dialog">
      <h2 id="search-title" className="sr-only">
        Search workspace
      </h2>
      <div className="command-input">
        <Search size={19} />
        <input
          data-autofocus
          aria-label="Search workspace"
          placeholder="Search issues by title or ID..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && matches[0]) {
              event.preventDefault();
              event.stopPropagation();
              onOpen(matches[0].id);
            }
          }}
        />
        <button
          className="key-button"
          aria-label="Close search"
          onClick={onClose}
        >
          esc
        </button>
      </div>
      <div className="command-results">
        <div className="nav-heading">Issues</div>
        {matches.map((issue) => (
          <button key={issue.id} onClick={() => onOpen(issue.id)}>
            <StatusIcon status={issue.status} />
            <span className="issue-id">{issue.id}</span>
            <span>{issue.title}</span>
            <ArrowUpRight size={13} />
          </button>
        ))}
        {!matches.length && <p>No matching issues.</p>}
      </div>
      <button className="command-create" onClick={onCreate}>
        <Plus size={15} />
        Create new issue<span>C</span>
      </button>
      <div className="command-footer">
        <span>
          <Command size={12} />A little less searching. A lot more doing.
        </span>
        <span>↵ Open first result</span>
      </div>
    </Modal>
  );
}

function InboxView({ issues, onOpen }) {
  const entries = issues
    .flatMap((issue) => issue.comments.map((comment) => ({ issue, comment })))
    .toSorted((a, b) => new Date(b.comment.at) - new Date(a.comment.at));
  return (
    <section className="inbox-view">
      {entries.length ? (
        <>
          <div className="inbox-heading">
            <MessageSquare size={16} />
            Recent conversations<span>{entries.length}</span>
          </div>
          {entries.map(({ issue, comment }, index) => (
            <button
              className="inbox-entry"
              key={`${issue.id}-${index}`}
              onClick={() => onOpen(issue.id)}
            >
              <Avatar name={comment.author} />
              <div>
                <strong>
                  {issue.id} · {issue.title}
                </strong>
                <p>{comment.text}</p>
                <span>
                  {comment.author} commented · {formatDate(comment.at)}
                </span>
              </div>
              <ChevronRight size={15} />
            </button>
          ))}
        </>
      ) : (
        <div className="empty-state inbox-empty">
          <span className="inbox-illustration">
            <Inbox size={35} />
            <Check size={14} />
          </span>
          <h2>You’re all caught up</h2>
          <p>
            Comments on your workspace issues will appear here.
            <br />A little quiet is a good thing.
          </p>
          <span className="quiet-caption">SPACE TO DO YOUR BEST WORK</span>
        </div>
      )}
    </section>
  );
}
