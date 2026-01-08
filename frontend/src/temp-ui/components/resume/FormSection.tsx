import { ReactNode } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/temp-ui/components/ui/button";

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  isExpanded?: boolean;
  onToggle?: () => void;
  error?: boolean;
}

export const FormSection = ({
  title,
  description,
  children,
  isExpanded = true,
  onToggle,
  error = false,
}: FormSectionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-form-section rounded-lg form-section-shadow border ${
        error ? "border-destructive/50" : "border-border"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors rounded-t-lg"
      >
        <div>
          <h3 className="font-serif text-lg font-semibold text-foreground flex items-center gap-2">
            {title}
            {error && (
              <span className="inline-flex h-2 w-2 rounded-full bg-destructive" />
            )}
          </h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        {onToggle && (
          <div className="text-muted-foreground">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        )}
      </button>

      <motion.div
        initial={false}
        animate={{
          height: isExpanded ? "auto" : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <div className="p-4 pt-0 space-y-4">{children}</div>
      </motion.div>
    </motion.div>
  );
};
