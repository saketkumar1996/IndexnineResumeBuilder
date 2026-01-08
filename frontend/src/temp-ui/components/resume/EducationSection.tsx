import { UseFormReturn, useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { ResumeData } from "@/types/resume";
import { TextInput } from "./FormField";
import { Button } from "@/temp-ui/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface EducationSectionProps {
  form: UseFormReturn<ResumeData>;
}

export const EducationSection = ({ form }: EducationSectionProps) => {
  const { control, watch, setValue, formState: { errors } } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "education",
  });

  const education = watch("education");

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
                Education {index + 1}
              </span>
              {fields.length > 0 && (
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
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                label="Institution"
                value={education[index]?.institution || ""}
                onChange={(value) => setValue(`education.${index}.institution`, value, { shouldValidate: true })}
                error={errors.education?.[index]?.institution?.message}
                required
                placeholder="University of California"
              />
              <TextInput
                label="Degree"
                value={education[index]?.degree || ""}
                onChange={(value) => setValue(`education.${index}.degree`, value, { shouldValidate: true })}
                error={errors.education?.[index]?.degree?.message}
                required
                placeholder="Bachelor of Science"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                label="Location"
                value={education[index]?.location || ""}
                onChange={(value) => setValue(`education.${index}.location`, value, { shouldValidate: true })}
                error={errors.education?.[index]?.location?.message}
                required
                placeholder="Berkeley, CA"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                label="Start Year"
                value={education[index]?.startYear || ""}
                onChange={(value) => setValue(`education.${index}.startYear`, value, { shouldValidate: true })}
                error={errors.education?.[index]?.startYear?.message}
                placeholder="2011"
              />
              <TextInput
                label="End Year"
                value={education[index]?.endYear || ""}
                onChange={(value) => setValue(`education.${index}.endYear`, value, { shouldValidate: true })}
                error={errors.education?.[index]?.endYear?.message}
                required
                placeholder="2016"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                label="GPA (Optional)"
                value={education[index]?.gpa || ""}
                onChange={(value) => setValue(`education.${index}.gpa`, value, { shouldValidate: true })}
                error={errors.education?.[index]?.gpa?.message}
                placeholder="3.8/4.0"
              />
              <TextInput
                label="Honors (Optional)"
                value={education[index]?.honors || ""}
                onChange={(value) => setValue(`education.${index}.honors`, value, { shouldValidate: true })}
                error={errors.education?.[index]?.honors?.message}
                placeholder="Magna Cum Laude, Dean's List"
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {fields.length < 5 && (
        <Button
          type="button"
          variant="outline"
          onClick={() => append({ institution: "", degree: "", location: "", startYear: "", endYear: "", gpa: "", honors: "" })}
          className="w-full"
        >
          <Plus size={16} className="mr-2" />
          Add Education
        </Button>
      )}

      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No education added yet. Click the button above to add your educational background.
        </p>
      )}
    </div>
  );
};
