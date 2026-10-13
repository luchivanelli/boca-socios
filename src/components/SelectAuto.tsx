"use client";

import type { SelectHTMLAttributes } from "react";

/** Select que envía el formulario que lo contiene apenas cambia de valor. */
export function SelectAuto(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      onChange={(e) => {
        props.onChange?.(e);
        e.currentTarget.form?.requestSubmit();
      }}
    />
  );
}
