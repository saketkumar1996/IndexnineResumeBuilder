import { UseFormReturn, useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { ResumeData } from "@/types/resume";
import { TextInput } from "./FormField";
import { Button } from "@/temp-ui/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface AwardsSectionProps {
  form: UseFormReturn<ResumeData>;
}

export const AwardsSection = ({ form }: AwardsSectionProps) => {
  const { control, watch, setValue, formState: { errors } } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "awards",
  });

  const awards = watch("awards");

  return (
    <div className="space-y-6">
      <AnimatePresence mode="popLayout">
        {fields.map((field, index) => (
          <motion.div
            key={field.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border border-border rounded-lg p-4 space-y-4 bg-muted/30"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Award {index + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(index)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 size={16} className="mr-1" />
                Remove
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3">
                <TextInput
                  label="Award Title"
                  value={awards[index]?.title || ""}
                  onChange={(value) => setValue(`awards.${index}.title`, value, { shouldValidate: true })}
                  error={errors.awards?.[index]?.title?.message}
                  required
                  placeholder="Secured first Rank at college level Web Page Design Competition"
                />
              </div>
              <TextInput
                label="Year"
                value={awards[index]?.year || ""}
                onChange={(value) => setValue(`awards.${index}.year`, value, { shouldValidate: true })}
                error={errors.awards?.[index]?.year?.message}
                required
                placeholder="2016"
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {fields.length < 10 && (
        <Button
          type="button"
          variant="outline"
          onClick={() => append({ title: "", year: "" })}
          className="w-full"
        >
          <Plus size={16} className="mr-2" />
          Add Award
        </Button>
      )}

      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No awards added yet. Highlight your recognitions and achievements here.
        </p>
      )}
    </div>
  );
};
