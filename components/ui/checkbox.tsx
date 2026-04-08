import * as React from "react";

export function Checkbox({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={["ui-checkbox", className].join(" ")}
      {...props}
    />
  );
}
