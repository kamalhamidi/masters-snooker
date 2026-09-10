"use client";

import { useI18n } from "@/lib/i18n/provider";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "./input";

export function PasswordInput(
  props: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">,
) {
  const { tr } = useI18n();

  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className="pe-12"
      />
      <button
        type="button"
        aria-label={visible ? tr("Hide password") : tr("Show password")}
        aria-pressed={visible}
        onClick={() => setVisible(!visible)}
        className="absolute end-0 top-0 flex h-11 w-11 items-center justify-center rounded-e-xl text-muted hover:text-foreground"
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
