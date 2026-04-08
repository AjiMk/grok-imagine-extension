import * as React from "react";

export function TabsList({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={["ui-tabs-list", className].join(" ")}
      {...props}
    />
  );
}

export function TabsTrigger({
  active,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      className={["ui-tab", active ? "is-active" : "", className].join(" ")}
      {...props}
    />
  );
}
