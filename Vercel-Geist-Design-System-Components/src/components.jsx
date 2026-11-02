import React, { useEffect, useId, useRef, useState } from "react";
import {
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Eye,
  Info,
  TriangleAlert,
  X,
} from "lucide-react";
import { snippets } from "./catalog.js";

export function Button({
  variant = "primary",
  size = "normal",
  className = "",
  type = "button",
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={`btn btn-${variant} btn-${size} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
export function Modal({ label, onClose, children, className = "" }) {
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
      aria-label={label}
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
export function ExampleCard({
  id,
  title,
  description,
  children,
  onCopy,
  wide = false,
}) {
  const [tab, setTab] = useState("preview");
  const uid = useId();
  const panels = ["preview", "code"];
  return (
    <section
      className={`example-card ${wide ? "wide" : ""}`}
      aria-label={`${title} example`}
    >
      <div className="example-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <span className="example-label">COMPONENT</span>
      </div>
      <div className="example-toolbar">
        <div role="tablist" aria-label={`${title} example view`}>
          {panels.map((item, index) => (
            <button
              key={item}
              role="tab"
              id={`${uid}-${item}`}
              aria-selected={tab === item}
              aria-controls={`${uid}-panel`}
              tabIndex={tab === item ? 0 : -1}
              onClick={() => setTab(item)}
              onKeyDown={(event) => {
                if (
                  ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
                ) {
                  event.preventDefault();
                  const next =
                    event.key === "Home"
                      ? "preview"
                      : event.key === "End"
                        ? "code"
                        : panels[(index + 1) % 2];
                  setTab(next);
                  document.getElementById(`${uid}-${next}`)?.focus();
                }
              }}
            >
              {item === "preview" ? <Eye size={12} /> : <Code2 size={12} />}{" "}
              {item === "preview" ? "Preview" : "Code"}
            </button>
          ))}
        </div>
        <button
          className="copy-code-button"
          aria-label={`Copy ${title} code`}
          onClick={() => onCopy(snippets[id])}
        >
          <Copy size={12} />
          <span>Copy</span>
        </button>
      </div>
      <div
        role="tabpanel"
        id={`${uid}-panel`}
        aria-labelledby={`${uid}-${tab}`}
        className={tab === "preview" ? "example-preview" : "example-code"}
      >
        {tab === "preview" ? (
          children
        ) : (
          <pre>
            <code>{snippets[id]}</code>
          </pre>
        )}
      </div>
    </section>
  );
}
export function Toast({ notice, onClose }) {
  if (!notice) return null;
  const Icon =
    notice.type === "error"
      ? TriangleAlert
      : notice.type === "success"
        ? CheckCircle2
        : Info;
  return (
    <div
      className={`toast toast-${notice.type}`}
      role={notice.type === "error" ? "alert" : "status"}
      aria-live={notice.type === "error" ? "assertive" : "polite"}
    >
      <Icon size={16} />
      <span>{notice.text}</span>
      <button aria-label="Dismiss notification" onClick={onClose}>
        <X size={14} />
      </button>
    </div>
  );
}
export function Tooltip({ text, children }) {
  const id = useId();
  return (
    <span className="tooltip-anchor">
      <span aria-describedby={id} tabIndex={0} className="tooltip-trigger">
        {children}
      </span>
      <span id={id} role="tooltip" className="tooltip-content">
        {text}
      </span>
    </span>
  );
}
