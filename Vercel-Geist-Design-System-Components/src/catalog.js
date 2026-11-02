export const PREF_KEY = "geist-study-preferences-v1";
export const catalog = [
  {
    id: "overview",
    name: "Overview",
    group: "Getting started",
    description:
      "A collection of purposeful components. Built to work together.",
  },
  {
    id: "button",
    name: "Button",
    group: "Components",
    description: "A clear action, at just the right emphasis.",
  },
  {
    id: "input",
    name: "Input",
    group: "Components",
    description: "Thoughtful defaults for collecting information.",
  },
  {
    id: "select",
    name: "Select",
    group: "Components",
    description: "A familiar way to choose from a set of options.",
  },
  {
    id: "switch",
    name: "Switch & Checkbox",
    group: "Components",
    description: "Small controls for meaningful preferences.",
  },
  {
    id: "tabs",
    name: "Tabs",
    group: "Components",
    description: "Related content, organized without the noise.",
  },
  {
    id: "badge",
    name: "Badge & Avatar",
    group: "Components",
    description: "Compact context that helps people scan.",
  },
  {
    id: "table",
    name: "Table",
    group: "Components",
    description: "Structured information with a clear hierarchy.",
  },
  {
    id: "dialog",
    name: "Dialog",
    group: "Components",
    description: "Give an important decision a focused space.",
  },
  {
    id: "toast",
    name: "Toast",
    group: "Components",
    description: "Timely feedback, without interrupting the flow.",
  },
  {
    id: "tooltip",
    name: "Tooltip",
    group: "Components",
    description: "A little more context, right when it is needed.",
  },
  {
    id: "progress",
    name: "Progress",
    group: "Components",
    description: "Make the state of a process visible.",
  },
  {
    id: "tokens",
    name: "Design tokens",
    group: "Foundations",
    description: "One visual language, from color to spacing.",
  },
  {
    id: "typography",
    name: "Typography",
    group: "Foundations",
    description: "Geist Sans and Geist Mono, locally served.",
  },
];
export function readPreferences() {
  try {
    const value = JSON.parse(localStorage.getItem(PREF_KEY));
    if (
      value &&
      ["light", "dark"].includes(value.theme) &&
      catalog.some((item) => item.id === value.active)
    )
      return value;
  } catch {}
  return { theme: "light", active: "overview" };
}
export const initialProjects = [
  {
    id: "p1",
    name: "khanomi-web",
    url: "khanomi-web.example",
    environment: "Production",
    status: "Ready",
    framework: "React",
    owner: "K",
    updated: "2m ago",
  },
  {
    id: "p2",
    name: "analytics-api",
    url: "analytics-api.example",
    environment: "Preview",
    status: "Building",
    framework: "Node.js",
    owner: "M",
    updated: "8m ago",
  },
  {
    id: "p3",
    name: "design-system",
    url: "design-system.example",
    environment: "Production",
    status: "Ready",
    framework: "Vite",
    owner: "K",
    updated: "24m ago",
  },
  {
    id: "p4",
    name: "checkout-service",
    url: "checkout-service.example",
    environment: "Preview",
    status: "Error",
    framework: "Node.js",
    owner: "A",
    updated: "1h ago",
  },
];
export const snippets = {
  button: `<Button variant="primary">Create project</Button>\n<Button variant="secondary">Learn more</Button>\n<Button variant="destructive">Delete</Button>`,
  input: `<label htmlFor="email">Email address</label>\n<input id="email" type="email" required />\n<button type="submit">Subscribe</button>`,
  select: `<select aria-label="Environment" value={environment}\n  onChange={event => setEnvironment(event.target.value)}>\n  <option>Production</option>\n  <option>Preview</option>\n</select>`,
  switch: `<button role="switch" aria-checked={enabled}\n  onClick={() => setEnabled(!enabled)}>\n  <span className="switch-thumb" />\n</button>`,
  tabs: `<div role="tablist" aria-label="Project views">\n  <button role="tab" aria-selected={active === 'Overview'}>\n    Overview\n  </button>\n</div>`,
  badge: `<span className="badge success">Ready</span>\n<span className="badge warning">Building</span>\n<span className="avatar" aria-label="Kasra">K</span>`,
  table: `<table aria-label="Demo projects">\n  <thead><tr><th scope="col">Project</th></tr></thead>\n  <tbody>{projects.map(project => (\n    <tr key={project.id}><td>{project.name}</td></tr>\n  ))}</tbody>\n</table>`,
  dialog: `const dialog = useRef(null);\ndialog.current.showModal();\n// Native dialog contains focus and supports Escape.\n<dialog ref={dialog} aria-label="Create project">\n  <ProjectForm />\n</dialog>`,
  toast: `setNotice({ type: 'success', text: 'Changes saved' });\n<div role="status" aria-live="polite">\n  Changes saved\n</div>`,
  tooltip: `<button aria-describedby="copy-hint">Copy</button>\n<span id="copy-hint" role="tooltip">Copy snippet</span>`,
  progress: `<progress aria-label="Upload progress"\n  max="100" value={progress} />\n<button onClick={() => setProgress(value => Math.min(100, value + 20))}>\n  Advance\n</button>`,
};
