import { ReactNode } from "react";

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string | null;
  hint?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, error, hint, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-faint">{hint}</p>
      ) : null}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", ...rest }: InputProps) {
  return (
    <input
      className={`w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-faint transition-colors focus:border-accent focus:outline-2 focus:outline-offset-0 focus:outline-accent/40 ${className}`}
      {...rest}
    />
  );
}

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className = "", ...rest }: TextareaProps) {
  return (
    <textarea
      className={`w-full resize-none rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-faint transition-colors focus:border-accent focus:outline-2 focus:outline-offset-0 focus:outline-accent/40 ${className}`}
      {...rest}
    />
  );
}
