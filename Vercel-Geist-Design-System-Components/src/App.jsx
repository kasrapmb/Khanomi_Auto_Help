import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Box,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code2,
  Command,
  Copy,
  ExternalLink,
  Layers,
  Menu,
  Moon,
  Plus,
  Search,
  Sun,
  Triangle,
  X,
} from "lucide-react";
import {
  catalog,
  initialProjects,
  PREF_KEY,
  readPreferences,
  snippets,
} from "./catalog.js";
import { Button, ExampleCard, Modal, Toast } from "./components.jsx";
import {
  BadgesDemo,
  ButtonsDemo,
  DialogDemo,
  InputDemo,
  ProgressDemo,
  ProjectsDemo,
  SelectDemo,
  SwitchDemo,
  TabsDemo,
  ToastDemo,
  TooltipDemo,
} from "./demos.jsx";

export default function App() {
  const [active, setActive] = useState(() => readPreferences().active);
  const [theme, setTheme] = useState(() => readPreferences().theme);
  const [storageError, setStorageError] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notice, setNotice] = useState(null);
  const [projects, setProjects] = useState(() =>
    structuredClone(initialProjects),
  );
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const detail = projects.find((project) => project.id === detailId);
  const mainRef = useRef(null);
  const page = catalog.find((item) => item.id === active) || catalog[0];
  const componentCount = catalog.filter(
    (item) => item.group === "Components",
  ).length;
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify({ theme, active }));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [theme, active]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    const handler = (event) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k" &&
        !creating &&
        !deleting &&
        !detail
      ) {
        event.preventDefault();
        setSearchOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [creating, deleting, detail]);
  const notify = (type, text) => setNotice({ type, text });
  const navigate = (id) => {
    setActive(id);
    setMobileNav(false);
    setSearchOpen(false);
    requestAnimationFrame(() =>
      window.scrollTo({ top: 0, behavior: "instant" }),
    );
  };
  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      notify("success", "Code copied to clipboard");
    } catch {
      notify(
        "error",
        "Clipboard unavailable. Select and copy the code manually.",
      );
    }
  };
  const createProject = (draft) => {
    setProjects((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        ...draft,
        url: `${draft.name}.example`,
        status: "Ready",
        framework: "React",
        owner: "K",
        updated: "Just now",
      },
    ]);
    setCreating(false);
    notify("success", `Sample project ${draft.name} created`);
  };
  const deleteProject = () => {
    const name = deleting.name;
    setProjects((current) =>
      current.filter((project) => project.id !== deleting.id),
    );
    setDeleting(null);
    notify("success", `Sample project ${name} deleted`);
  };
  const renderDemo = (id) => {
    if (id === "button")
      return (
        <ButtonsDemo
          onCreate={() => setCreating(true)}
          onDelete={() => setDeleting(projects[0])}
          canDelete={projects.length > 0}
          onNotify={notify}
        />
      );
    if (id === "input") return <InputDemo />;
    if (id === "select") return <SelectDemo />;
    if (id === "switch") return <SwitchDemo />;
    if (id === "tabs") return <TabsDemo onNotify={notify} />;
    if (id === "badge") return <BadgesDemo />;
    if (id === "table")
      return (
        <ProjectsDemo
          projects={projects}
          onCreate={() => setCreating(true)}
          onOpen={(project) => setDetailId(project.id)}
          onDelete={setDeleting}
        />
      );
    if (id === "dialog") return <DialogDemo onOpen={() => setCreating(true)} />;
    if (id === "toast") return <ToastDemo onNotify={notify} />;
    if (id === "tooltip") return <TooltipDemo onCopy={copy} />;
    if (id === "progress") return <ProgressDemo />;
  };
  const example = (id) => {
    const item = catalog.find((entry) => entry.id === id);
    return (
      <ExampleCard
        key={id}
        id={id}
        title={item.name}
        description={item.description}
        onCopy={copy}
        wide={id === "table"}
      >
        {renderDemo(id)}
      </ExampleCard>
    );
  };
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header">
        <div className="site-brand">
          <button
            className="icon-button mobile-only"
            aria-label="Open navigation"
            onClick={() => setMobileNav(true)}
          >
            <Menu size={18} />
          </button>
          <button
            className="brand-button"
            aria-label="Go to overview"
            onClick={() => navigate("overview")}
          >
            <span className="vercel-mark" />
            Geist
            <span className="brand-divider" />
            <span className="brand-subtitle">Design system</span>
          </button>
          <span className="study-badge">STUDY</span>
        </div>
        <nav className="top-navigation" aria-label="Main sections">
          <button
            className={
              !["tokens", "typography"].includes(active) ? "active" : ""
            }
            onClick={() => navigate("overview")}
          >
            Components
          </button>
          <button
            className={
              ["tokens", "typography"].includes(active) ? "active" : ""
            }
            onClick={() => navigate("tokens")}
          >
            Foundations
          </button>
          <a
            href="https://github.com/kasrapmb/Khanomi_Auto_Help/tree/main/Vercel-Geist-Design-System-Components"
            target="_blank"
            rel="noreferrer"
          >
            Source
            <ArrowUpRight size={12} />
          </a>
        </nav>
        <div className="header-actions">
          <button
            className="header-search"
            aria-label="Search components"
            onClick={() => setSearchOpen(true)}
          >
            <Search size={14} />
            <span>Search...</span>
            <kbd>⌘ K</kbd>
          </button>
          <button
            className="theme-button"
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
            onClick={() =>
              setTheme((current) => (current === "light" ? "dark" : "light"))
            }
          >
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <span className="header-avatar" title="kasrapmb">
            K
          </span>
        </div>
      </header>
      {mobileNav && (
        <button
          className="nav-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileNav(false)}
        />
      )}
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <div className="sidebar-mobile-heading">
          <strong>Geist study</strong>
          <button
            className="icon-button"
            aria-label="Close sidebar"
            onClick={() => setMobileNav(false)}
          >
            <X size={17} />
          </button>
        </div>
        <button
          className="sidebar-search"
          onClick={() => {
            setSearchOpen(true);
            setMobileNav(false);
          }}
        >
          <Search size={13} />
          <span>Find a component</span>
          <kbd>⌘ K</kbd>
        </button>
        <nav aria-label="Component navigation">
          {["Getting started", "Components", "Foundations"].map((group) => (
            <div className="nav-group" key={group}>
              <div className="nav-heading">
                {group}
                {group === "Components" && <span>{componentCount}</span>}
              </div>
              {catalog
                .filter((item) => item.group === group)
                .map((item) => (
                  <button
                    key={item.id}
                    className={`nav-item ${active === item.id ? "selected" : ""}`}
                    aria-current={active === item.id ? "page" : undefined}
                    onClick={() => navigate(item.id)}
                  >
                    {item.id === "overview" && <BookOpen size={13} />}
                    <span>{item.name}</span>
                    {item.id === "progress" && (
                      <span className="new-tag">NEW</span>
                    )}
                    {active === item.id && <span className="nav-active-dot" />}
                  </button>
                ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="note-symbol">✳</span>
            <p>
              Consistency is a feature.
              <br />
              <strong>Let the details do the work.</strong>
            </p>
          </div>
          <div className="author-profile">
            <span className="header-avatar">K</span>
            <div>
              <strong>kasrapmb</strong>
              <span>Independent UI study</span>
            </div>
            <span className="profile-dot" />
          </div>
        </div>
      </aside>
      <main className="main-area" id="main-content" ref={mainRef}>
        <div className="content-wrap">
          <div className="breadcrumb">
            <span>Geist</span>
            <ChevronRight size={11} />
            <span>{page.group}</span>
            <ChevronRight size={11} />
            <strong>{page.name}</strong>
          </div>
          {storageError && (
            <div className="storage-warning" role="alert">
              Preferences are not saved because browser storage is unavailable.
            </div>
          )}
          {active === "overview" ? (
            <>
              <section className="hero">
                <div className="eyebrow">
                  <span className="eyebrow-dot" />A SHARED VISUAL LANGUAGE
                </div>
                <h1>
                  The details make
                  <br />
                  the difference<span className="heading-period">.</span>
                </h1>
                <p>
                  Thoughtful primitives for focused products.
                  <br />
                  Explore the building blocks of a clear, consistent interface.
                </p>
                <div className="hero-actions">
                  <Button
                    onClick={() =>
                      document
                        .getElementById("examples")
                        ?.scrollIntoView({
                          behavior: window.matchMedia(
                            "(prefers-reduced-motion: reduce)",
                          ).matches
                            ? "auto"
                            : "smooth",
                        })
                    }
                  >
                    Explore components
                    <ArrowRight size={13} />
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => navigate("tokens")}
                  >
                    Design tokens
                    <Layers size={13} />
                  </Button>
                </div>
                <div className="hero-stats">
                  <span>
                    <strong>{componentCount}</strong>Interactive components
                  </span>
                  <span className="stat-divider" />
                  <span>
                    <strong>02</strong>Official typefaces
                  </span>
                  <span className="stat-divider" />
                  <span>
                    <strong>02</strong>Color themes
                  </span>
                </div>
                <div className="hero-art" aria-hidden="true">
                  <div className="art-grid" />
                  <div className="art-orbit orbit-1" />
                  <div className="art-orbit orbit-2" />
                  <div className="art-square">
                    <span className="vercel-mark" />
                  </div>
                  <span className="art-label label-top">PRECISE BY DESIGN</span>
                  <span className="art-label label-bottom">
                    GEIST / STUDY 01
                  </span>
                  <span className="art-cross cross-one">+</span>
                  <span className="art-cross cross-two">+</span>
                </div>
              </section>
              <div className="section-intro" id="examples">
                <div>
                  <span className="eyebrow">THE BUILDING BLOCKS</span>
                  <h2>Small parts. A coherent whole.</h2>
                </div>
                <span className="section-meta">Live examples · React</span>
              </div>
              <div className="examples-grid">
                {["button", "input", "switch", "badge", "table"].map(example)}
              </div>
              <div className="foundation-banner">
                <div>
                  <span className="foundation-symbol">Aa</span>
                  <div>
                    <h3>A foundation for every detail.</h3>
                    <p>
                      Explore the type, colors and spacing behind this
                      interface.
                    </p>
                  </div>
                </div>
                <Button variant="secondary" onClick={() => navigate("tokens")}>
                  Explore foundations
                  <ArrowUpRight size={13} />
                </Button>
              </div>
            </>
          ) : active === "tokens" ? (
            <Tokens theme={theme} onCopy={copy} />
          ) : active === "typography" ? (
            <Typography />
          ) : (
            <>
              <section className="component-page-heading">
                <span className="eyebrow">{page.group.toUpperCase()}</span>
                <h1>
                  {page.name}
                  <span className="heading-period">.</span>
                </h1>
                <p>{page.description}</p>
                <div className="component-meta">
                  <span>
                    <span className="status-dot" />
                    Interactive example
                  </span>
                  <span>React · Native browser primitives</span>
                </div>
              </section>
              <div className="single-example">{example(active)}</div>
              <div className="usage-note">
                <Code2 size={15} />
                <div>
                  <strong>Read the implementation.</strong>
                  <p>
                    Examples are independently authored. Usage snippets are
                    illustrative; the working implementation lives in{" "}
                    <code>src/demos.jsx</code> and{" "}
                    <code>src/components.jsx</code>.
                  </p>
                </div>
              </div>
              <div className="component-pagination">
                <button
                  onClick={() =>
                    navigate(
                      catalog[
                        Math.max(
                          0,
                          catalog.findIndex((item) => item.id === active) - 1,
                        )
                      ].id,
                    )
                  }
                >
                  <ArrowLeft size={13} />
                  Previous component
                </button>
                <button
                  onClick={() =>
                    navigate(
                      catalog[
                        Math.min(
                          catalog.length - 1,
                          catalog.findIndex((item) => item.id === active) + 1,
                        )
                      ].id,
                    )
                  }
                >
                  Next component
                  <ArrowRight size={13} />
                </button>
              </div>
            </>
          )}
          <footer className="site-footer">
            <div>
              <span className="vercel-mark" />
              <strong>Geist study</strong>
              <span className="footer-divider" />
              <span>Built with care by kasrapmb.</span>
            </div>
            <span>Independent reconstruction · No Vercel connection</span>
          </footer>
        </div>
      </main>
      {searchOpen && (
        <SearchDialog
          onClose={() => setSearchOpen(false)}
          onSelect={navigate}
        />
      )}
      {creating && (
        <CreateProject
          projects={projects}
          onClose={() => setCreating(false)}
          onCreate={createProject}
        />
      )}
      {deleting && (
        <Modal
          label="Delete sample project"
          onClose={() => setDeleting(null)}
          className="project-dialog"
        >
          <div className="dialog-header">
            <span className="dialog-symbol destructive-symbol">
              <Box size={20} />
            </span>
            <button
              className="icon-button"
              aria-label="Close delete confirmation"
              onClick={() => setDeleting(null)}
            >
              <X size={17} />
            </button>
          </div>
          <h2>Delete sample project?</h2>
          <p>
            <strong>{deleting.name}</strong> will be removed from this browser
            session. No real deployment is affected.
          </p>
          <div className="dialog-actions">
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteProject}>
              Confirm delete
            </Button>
          </div>
        </Modal>
      )}
      {detail && (
        <Modal
          label={`${detail.name} project details`}
          onClose={() => setDetailId(null)}
          className="project-dialog"
        >
          <div className="dialog-header">
            <span className="dialog-symbol">
              <span className="vercel-mark" />
            </span>
            <button
              className="icon-button"
              aria-label="Close project details"
              onClick={() => setDetailId(null)}
            >
              <X size={17} />
            </button>
          </div>
          <h2>{detail.name}</h2>
          <p>Sample project details. This is a local session record.</p>
          <dl className="project-properties">
            {[
              ["Status", detail.status],
              ["Environment", detail.environment],
              ["Framework", detail.framework],
              ["Sample domain", detail.url],
            ].map(([key, value]) => (
              <div key={key}>
                <dt>{key}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <div className="dialog-actions">
            <Button variant="secondary" onClick={() => setDetailId(null)}>
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setDetailId(null);
                setDeleting(detail);
              }}
            >
              Delete sample project
            </Button>
          </div>
        </Modal>
      )}
      <Toast notice={notice} onClose={() => setNotice(null)} />
    </div>
  );
}

function SearchDialog({ onClose, onSelect }) {
  const [query, setQuery] = useState("");
  const matches = catalog.filter((item) =>
    `${item.name} ${item.description}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <Modal
      label="Search component library"
      onClose={onClose}
      className="search-dialog"
    >
      <div className="search-dialog-input">
        <Search size={18} />
        <input
          data-autofocus
          aria-label="Search component library"
          placeholder="Search components and foundations..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && matches[0]) {
              event.preventDefault();
              event.stopPropagation();
              onSelect(matches[0].id);
            }
          }}
        />
        <button
          className="key-button"
          aria-label="Close component search"
          onClick={onClose}
        >
          esc
        </button>
      </div>
      <div className="search-results">
        <span className="small-label">COMPONENTS & FOUNDATIONS</span>
        {matches.length ? (
          matches.map((item) => (
            <button key={item.id} onClick={() => onSelect(item.id)}>
              <span className="search-result-icon">
                {item.group === "Foundations" ? (
                  <Layers size={14} />
                ) : (
                  <Box size={14} />
                )}
              </span>
              <span>
                <strong>{item.name}</strong>
                <small>{item.group}</small>
              </span>
              <ArrowUpRight size={12} />
            </button>
          ))
        ) : (
          <div className="search-empty">No components match that search.</div>
        )}
      </div>
      <div className="search-dialog-footer">
        <span>
          <Command size={11} />
          Find your next building block.
        </span>
        <span>↵ Open first result</span>
      </div>
    </Modal>
  );
}
function CreateProject({ projects, onClose, onCreate }) {
  const [name, setName] = useState(""),
    [environment, setEnvironment] = useState("Production"),
    [error, setError] = useState("");
  return (
    <Modal
      label="Create sample project"
      onClose={onClose}
      className="project-dialog"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const value = name.trim();
          if (!value) return;
          if (projects.some((project) => project.name === value)) {
            setError("A sample project with this name already exists.");
            return;
          }
          onCreate({ name: value, environment });
        }}
      >
        <div className="dialog-header">
          <span className="dialog-symbol">
            <Plus size={22} />
          </span>
          <button
            type="button"
            className="icon-button"
            aria-label="Close create project"
            onClick={onClose}
          >
            <X size={17} />
          </button>
        </div>
        <h2>Create a project.</h2>
        <p>
          A local example of a focused creation flow. No deployment or external
          request is made.
        </p>
        <label>
          Project name
          <input
            data-autofocus
            aria-label="New project name"
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            maxLength={60}
            placeholder="my-next-project"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError("");
            }}
          />
        </label>
        <span className="field-hint">
          Lowercase letters, numbers and single hyphens.
        </span>
        <label>
          Environment
          <select
            aria-label="New project environment"
            value={environment}
            onChange={(event) => setEnvironment(event.target.value)}
          >
            {["Production", "Preview", "Development"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!name.trim()}>
            Create sample project
            <ArrowRight size={13} />
          </Button>
        </div>
      </form>
    </Modal>
  );
}
function Tokens({ theme, onCopy }) {
  const palette =
    theme === "dark"
      ? [
          ["Background", "#0a0a0a"],
          ["Surface", "#111111"],
          ["Foreground", "#ededed"],
          ["Muted", "#a1a1a1"],
          ["Border", "#2a2a2a"],
          ["Accent", "#52a8ff"],
          ["Success", "#62c073"],
          ["Error", "#ff6369"],
        ]
      : [
          ["Background", "#ffffff"],
          ["Surface", "#fafafa"],
          ["Foreground", "#171717"],
          ["Muted", "#666666"],
          ["Border", "#eaeaea"],
          ["Accent", "#0070f3"],
          ["Success", "#1a7f37"],
          ["Error", "#e00b0b"],
        ];
  return (
    <>
      <section className="component-page-heading">
        <span className="eyebrow">FOUNDATIONS</span>
        <h1>
          A language for the details<span className="heading-period">.</span>
        </h1>
        <p>Shared values that keep every component in conversation.</p>
        <div className="component-meta">
          <span>
            <span className="status-dot" />
            {theme === "dark" ? "Dark" : "Light"} palette
          </span>
          <span>Source of truth: src/tokens.css</span>
        </div>
      </section>
      <div className="tokens-section">
        <div className="section-intro">
          <div>
            <h2>Color</h2>
            <p>Semantic roles, across both themes.</p>
          </div>
          <span className="section-meta">Click to copy a value</span>
        </div>
        <div className="palette-grid">
          {palette.map(([name, value]) => (
            <button
              className="color-card"
              key={name}
              aria-label={`Copy ${name} color`}
              onClick={() => onCopy(`--${name.toLowerCase()}: ${value};`)}
            >
              <span className="color-swatch" style={{ background: value }} />
              <span className="color-name">
                {name}
                <Copy size={11} />
              </span>
              <code>{value}</code>
            </button>
          ))}
        </div>
      </div>
      <div className="tokens-section">
        <div className="section-intro">
          <div>
            <h2>Spacing</h2>
            <p>A four-pixel rhythm for a consistent interface.</p>
          </div>
        </div>
        <div className="spacing-grid">
          {[4, 8, 12, 16, 24, 32, 48].map((size) => (
            <button
              key={size}
              aria-label={`Copy ${size} pixel spacing`}
              onClick={() => onCopy(`${size}px`)}
            >
              <span className="spacing-preview">
                <i style={{ height: size }} />
              </span>
              <code>{size}px</code>
            </button>
          ))}
        </div>
      </div>
      <div className="tokens-section">
        <div className="section-intro">
          <div>
            <h2>Radius</h2>
            <p>Shape that supports the hierarchy.</p>
          </div>
        </div>
        <div className="radius-grid">
          {[4, 6, 8, 12].map((radius) => (
            <button
              key={radius}
              aria-label={`Copy ${radius} pixel radius`}
              onClick={() => onCopy(`border-radius: ${radius}px;`)}
            >
              <span style={{ borderRadius: radius }} />
              <code>{radius}px</code>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
function Typography() {
  const [text, setText] = useState("Make something wonderful."),
    [size, setSize] = useState(48),
    [weight, setWeight] = useState("500");
  return (
    <>
      <section className="component-page-heading">
        <span className="eyebrow">FOUNDATIONS</span>
        <h1>
          Clarity has a typeface<span className="heading-period">.</span>
        </h1>
        <p>
          Official Geist Sans and Geist Mono, served locally under the SIL Open
          Font License.
        </p>
      </section>
      <section className="type-card">
        <div className="type-card-heading">
          <div>
            <h2>Geist Sans</h2>
            <p>A practical voice for interfaces.</p>
          </div>
          <code>font-family: "Geist Sans"</code>
        </div>
        <div className="type-controls">
          <label>
            Specimen text
            <input
              aria-label="Typography specimen text"
              value={text}
              maxLength={140}
              onChange={(event) => setText(event.target.value)}
            />
          </label>
          <label>
            Size <span>{size}px</span>
            <input
              type="range"
              aria-label="Typography font size"
              min="24"
              max="64"
              value={size}
              onChange={(event) => setSize(Number(event.target.value))}
            />
          </label>
          <label>
            Weight
            <select
              aria-label="Typography font weight"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
            >
              {["400", "500", "600", "700"].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
        </div>
        <div
          className="type-specimen"
          data-testid="sans-specimen"
          style={{ fontSize: size, fontWeight: weight }}
        >
          {text || "Your words go here."}
        </div>
        <div className="alphabet">
          ABCDEFGHIJKLMNOPQRSTUVWXYZ
          <br />
          abcdefghijklmnopqrstuvwxyz
          <br />
          0123456789 !@#$%&*()
        </div>
      </section>
      <section className="type-card mono-card">
        <div className="type-card-heading">
          <div>
            <h2>Geist Mono</h2>
            <p>Precision for the technical details.</p>
          </div>
          <code>font-family: "Geist Mono"</code>
        </div>
        <pre className="mono-specimen" data-testid="mono-specimen">
          {
            'const clarity = true;\nconst details = ["type", "space", "color"];\n\nexport function buildSomethingGood() {\n  return details.map(detail => care(detail));\n}'
          }
        </pre>
      </section>
      <div className="font-license-note">
        <CheckCircle2 size={14} />
        <p>
          Unmodified official variable fonts from <code>geist@1.9.0</code>.
          License, package integrity and file checksums are preserved in{" "}
          <code>licenses/</code>. No third-party font requests.
        </p>
      </div>
    </>
  );
}
