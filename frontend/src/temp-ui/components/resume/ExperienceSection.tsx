import { UseFormReturn, useFieldArray } from "react-hook-form";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { ResumeData } from "@/types/resume";
import { TextInput, TextAreaInput } from "./FormField";
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
      responsibilities: [""],
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
                placeholder="TechCorp Inc."
              />
              <TextInput
                label="Job Title"
                value={experiences[index]?.title || ""}
                onChange={(value) => setValue(`experiences.${index}.title`, value, { shouldValidate: true })}
                error={errors.experiences?.[index]?.title?.message}
                required
                placeholder="Senior Software Engineer"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TextInput
                label="Location"
                value={experiences[index]?.location || ""}
                onChange={(value) => setValue(`experiences.${index}.location`, value, { shouldValidate: true })}
                error={errors.experiences?.[index]?.location?.message}
                required
                placeholder="San Francisco, CA"
              />
              <TextInput
                label="Start Date"
                value={experiences[index]?.startDate || ""}
                onChange={(value) => setValue(`experiences.${index}.startDate`, value, { shouldValidate: true })}
                error={errors.experiences?.[index]?.startDate?.message}
                required
                placeholder="MM/YYYY"
              />
              <TextInput
                label="End Date"
                value={experiences[index]?.endDate || ""}
                onChange={(value) => setValue(`experiences.${index}.endDate`, value, { shouldValidate: true })}
                error={errors.experiences?.[index]?.endDate?.message}
                required
                placeholder="MM/YYYY or Present"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Responsibilities <span className="text-destructive">*</span>
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                Start each bullet with an action verb (e.g., Led, Developed, Implemented)
              </p>
              
              {experiences[index]?.responsibilities?.map((_, respIndex) => (
                <div key={respIndex} className="flex gap-2">
                  <TextInput
                    label=""
                    value={experiences[index]?.responsibilities?.[respIndex] || ""}
                    onChange={(value) => {
                      const newResp = [...(experiences[index]?.responsibilities || [])];
                      newResp[respIndex] = value;
                      setValue(`experiences.${index}.responsibilities`, newResp, { shouldValidate: true });
                    }}
                    error={errors.experiences?.[index]?.responsibilities?.[respIndex]?.message}
                    placeholder="Describe your achievement with measurable impact..."
                  />
                  {(experiences[index]?.responsibilities?.length || 0) > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newResp = experiences[index]?.responsibilities?.filter((_, i) => i !== respIndex) || [];
                        setValue(`experiences.${index}.responsibilities`, newResp, { shouldValidate: true });
                      }}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
              ))}
              
              {(experiences[index]?.responsibilities?.length || 0) < 6 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newResp = [...(experiences[index]?.responsibilities || []), ""];
                    setValue(`experiences.${index}.responsibilities`, newResp);
                  }}
                  className="text-muted-foreground"
                >
                  <Plus size={14} className="mr-1" />
                  Add responsibility
                </Button>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {fields.length < 5 && (
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
