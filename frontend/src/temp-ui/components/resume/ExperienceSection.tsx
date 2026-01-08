import { UseFormReturn, useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { ResumeData } from "@/types/resume";
import { TextInput } from "./FormField";
import { Button } from "@/temp-ui/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface ExperienceSectionProps {
  form: UseFormReturn<ResumeData>;
}

export const ExperienceSection = ({ form }: ExperienceSectionProps) => {
  const { control, watch, setValue, formState: { errors } } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "experiences",
  });

  const experiences = watch("experiences");

  const addExperience = () => {
    append({
      company: "",
      title: "",
      location: "",
      startDate: "",
      endDate: "",
    });
  };

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
                Experience {index + 1}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                label="Company"
                value={experiences[index]?.company || ""}
                onChange={(value) => setValue(`experiences.${index}.company`, value, { shouldValidate: true })}
                error={errors.experiences?.[index]?.company?.message}
                required
                placeholder="Indexnine Technologies Pvt. Ltd."
              />
              <TextInput
                label="Job Title"
                value={experiences[index]?.title || ""}
                onChange={(value) => setValue(`experiences.${index}.title`, value, { shouldValidate: true })}
                error={errors.experiences?.[index]?.title?.message}
                required
                placeholder="Sr. Consultant - Senior Software Engineer"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TextInput
                label="Location"
                value={experiences[index]?.location || ""}
                onChange={(value) => setValue(`experiences.${index}.location`, value, { shouldValidate: true })}
                error={errors.experiences?.[index]?.location?.message}
                required
                placeholder="Pune"
              />
              <TextInput
                label="Start Date (MMM YYYY)"
                value={experiences[index]?.startDate || ""}
                onChange={(value) => setValue(`experiences.${index}.startDate`, value, { shouldValidate: true })}
                error={errors.experiences?.[index]?.startDate?.message}
                required
                placeholder="Apr 2024"
              />
              <TextInput
                label="End Date (MMM YYYY or Present)"
                value={experiences[index]?.endDate || ""}
                onChange={(value) => setValue(`experiences.${index}.endDate`, value, { shouldValidate: true })}
                error={errors.experiences?.[index]?.endDate?.message}
                placeholder="Present"
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {fields.length < 10 && (
        <Button
          type="button"
          variant="outline"
          onClick={addExperience}
          className="w-full"
        >
          <Plus size={16} className="mr-2" />
          Add Experience
        </Button>
      )}

      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No experiences added yet. Click the button above to add your work history.
        </p>
      )}
    </div>
  );
};
