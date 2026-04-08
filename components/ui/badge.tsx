import * as React from "react";

export function Badge({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={["ui-badge", className].join(" ")}
      {...props}
    />
  );
}
