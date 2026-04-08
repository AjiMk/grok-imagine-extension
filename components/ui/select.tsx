import * as React from "react";

export function Select({
  className = "",
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={["ui-select", className].join(" ")}
      {...props}
    />
  );
}
