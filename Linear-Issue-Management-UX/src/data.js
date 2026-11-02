export const STORAGE_KEY = "linear-ux-study-v1";
export const statuses = ["Backlog", "Todo", "In Progress", "In Review", "Done"];
export const priorities = ["Urgent", "High", "Medium", "Low", "No priority"];
export const people = ["Unassigned", "Kasra", "Maya", "Alex", "Nina"];
export const projects = [
  {
    name: "Customer experience",
    icon: "spark",
    color: "#a59aff",
    description: "Make every interaction feel effortless.",
    target: "Nov 28",
    lead: "Maya",
  },
  {
    name: "Platform foundations",
    icon: "layers",
    color: "#74b9e8",
    description: "A reliable platform that grows with us.",
    target: "Dec 12",
    lead: "Alex",
  },
  {
    name: "Analytics & insights",
    icon: "chart",
    color: "#e8b978",
    description: "Turn product signals into clear decisions.",
    target: "Dec 5",
    lead: "Kasra",
  },
];
const rows = [
  [
    "Redesign the issue detail experience",
    "In Progress",
    "High",
    "Maya",
    "Customer experience",
    "Design",
    "Explore a calmer layout for issue details. Keep properties accessible while giving the description room to breathe.",
  ],
  [
    "Add keyboard shortcuts to the command menu",
    "In Progress",
    "Medium",
    "Kasra",
    "Customer experience",
    "Feature",
    "Support fast navigation with a keyboard-first command menu. Include a visible shortcut hint and Escape to dismiss.",
  ],
  [
    "Improve empty states across the workspace",
    "In Progress",
    "Low",
    "Nina",
    "Customer experience",
    "Design",
    "Explain what each view is for and provide a clear next action when there are no matching issues.",
  ],
  [
    "Reduce initial dashboard load time",
    "In Progress",
    "Urgent",
    "Alex",
    "Platform foundations",
    "Performance",
    "Profile the dashboard entry point and reduce unnecessary requests. Define a baseline before making optimizations.",
  ],
  [
    "Ship the new customer feedback flow",
    "Todo",
    "High",
    "Maya",
    "Customer experience",
    "Feature",
    "Connect incoming customer feedback to actionable work. Make it easy to record context and ownership.",
  ],
  [
    "Create reusable chart color tokens",
    "Todo",
    "Medium",
    "Kasra",
    "Analytics & insights",
    "Design",
    "Use consistent, accessible colors across the analytics surfaces. Document the semantic meaning of each token.",
  ],
  [
    "Handle expired sessions gracefully",
    "Todo",
    "High",
    "Alex",
    "Platform foundations",
    "Bug",
    "Preserve unsaved work when a session expires and show a clear path to sign in again.",
  ],
  [
    "Add export options for activity reports",
    "Todo",
    "Low",
    "Nina",
    "Analytics & insights",
    "Feature",
    "Allow teams to export a focused report without losing the active filters.",
  ],
  [
    "Review navigation accessibility",
    "In Review",
    "High",
    "Nina",
    "Customer experience",
    "Design",
    "Check keyboard focus, screen-reader labels, and contrast in the workspace navigation.",
  ],
  [
    "Update API pagination documentation",
    "In Review",
    "Low",
    "Alex",
    "Platform foundations",
    "Documentation",
    "Add practical examples for cursor-based pagination and explain end-of-list behavior.",
  ],
  [
    "Explore saved views for support teams",
    "Backlog",
    "Medium",
    "Unassigned",
    "Customer experience",
    "Feature",
    "Investigate which recurring filters support teams would like to save and share.",
  ],
  [
    "Investigate notification grouping",
    "Backlog",
    "No priority",
    "Unassigned",
    "Platform foundations",
    "Feature",
    "Group related updates so the inbox highlights the most meaningful changes.",
  ],
  [
    "Define product health metrics",
    "Backlog",
    "Medium",
    "Kasra",
    "Analytics & insights",
    "Research",
    "Identify a small set of metrics that represent the quality of the customer experience.",
  ],
  [
    "Fix tooltip position near screen edges",
    "Done",
    "Medium",
    "Maya",
    "Customer experience",
    "Bug",
    "Keep tooltip content visible when a trigger is close to a viewport edge.",
  ],
  [
    "Unify the spacing scale",
    "Done",
    "Low",
    "Nina",
    "Customer experience",
    "Design",
    "Replace inconsistent spacing with a shared scale across core components.",
  ],
  [
    "Add request tracing to background jobs",
    "Done",
    "High",
    "Alex",
    "Platform foundations",
    "Performance",
    "Make asynchronous work easier to debug by connecting jobs to their originating requests.",
  ],
];
export const seedIssues = rows.map((row, index) => ({
  id: `KHA-${101 + index}`,
  title: row[0],
  status: row[1],
  priority: row[2],
  assignee: row[3],
  project: row[4],
  label: row[5],
  description: row[6],
  createdAt: "2026-11-02T08:00:00+03:30",
  dueDate: "",
  starred: index === 0,
  comments: [],
  activity: [
    {
      text: "created this issue",
      author: row[3] === "Unassigned" ? "Kasra" : row[3],
      at: "2026-11-02T08:00:00+03:30",
    },
  ],
}));

export function loadIssues() {
  try {
    const validDate = (value) => typeof value === "string" && Number.isFinite(new Date(value).getTime());
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (
      Array.isArray(value) &&
      value.every(
        (issue) =>
          issue &&
          typeof issue.id === "string" &&
          typeof issue.title === "string" &&
          typeof issue.description === "string" &&
          validDate(issue.createdAt) &&
          typeof issue.starred === "boolean" &&
          typeof issue.dueDate === "string" &&
          statuses.includes(issue.status) &&
          priorities.includes(issue.priority) &&
          people.includes(issue.assignee) &&
          projects.some((project) => project.name === issue.project) &&
          typeof issue.label === "string" &&
          Array.isArray(issue.comments) &&
          issue.comments.every(
            (comment) =>
              typeof comment.text === "string" &&
              people.includes(comment.author) &&
              validDate(comment.at),
          ) &&
          Array.isArray(issue.activity) &&
          issue.activity.every(
            (event) =>
              typeof event.text === "string" &&
              people.includes(event.author) &&
              validDate(event.at),
          ),
      )
    )
      return value;
  } catch {
    /* A corrupt or unavailable local cache must not prevent opening the study. */
  }
  return structuredClone(seedIssues);
}
