import { ReactNode } from "react";
import { Label } from "@/temp-ui/components/ui/label";
import { Input } from "@/temp-ui/components/ui/input";
import { Textarea } from "@/temp-ui/components/ui/textarea";

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children?: ReactNode;
}

export const FormField = ({ label, error, required, children }: FormFieldProps) => {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}
    </div>
  );
};

interface TextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "url";
}

export const TextInput = ({
  label,
  value,
  onChange,
  error,
  required,
  placeholder,
  type = "text",
}: TextInputProps) => {
  return (
    <FormField label={label} error={error} required={required}>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={error ? "border-destructive focus-visible:ring-destructive" : ""}
      />
    </FormField>
  );
};

interface TextAreaInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  showWordCount?: boolean;
  minWords?: number;
  maxWords?: number;
}

export const TextAreaInput = ({
  label,
  value,
  onChange,
  error,
  required,
  placeholder,
  rows = 4,
  showWordCount,
  minWords,
  maxWords,
}: TextAreaInputProps) => {
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  
  return (
    <FormField label={label} error={error} required={required}>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={error ? "border-destructive focus-visible:ring-destructive" : ""}
      />
      {showWordCount && (
        <p className="text-xs text-muted-foreground mt-1">
          {wordCount} words
          {minWords && maxWords && ` (${minWords}-${maxWords} recommended)`}
        </p>
      )}
    </FormField>
  );
};
