import { UseFormReturn, useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { ResumeData } from "@/types/resume";
import { TextInput, TextAreaInput } from "./FormField";
import { Button } from "@/temp-ui/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface ProjectsSectionProps {
  form: UseFormReturn<ResumeData>;
}

export const ProjectsSection = ({ form }: ProjectsSectionProps) => {
  const { control, watch, setValue, formState: { errors } } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "projects",
  });

  const projects = watch("projects");

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
                Project {index + 1}
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
                label="Project Name"
                value={projects[index]?.name || ""}
                onChange={(value) => setValue(`projects.${index}.name`, value, { shouldValidate: true })}
                error={errors.projects?.[index]?.name?.message}
                required
                placeholder="Open Source CLI Tool"
              />
              <TextInput
                label="Technologies"
                value={projects[index]?.technologies || ""}
                onChange={(value) => setValue(`projects.${index}.technologies`, value, { shouldValidate: true })}
                error={errors.projects?.[index]?.technologies?.message}
                required
                placeholder="React, TypeScript, Node.js"
              />
            </div>

            <TextAreaInput
              label="Description"
              value={projects[index]?.description || ""}
              onChange={(value) => setValue(`projects.${index}.description`, value, { shouldValidate: true })}
              error={errors.projects?.[index]?.description?.message}
              required
              placeholder="Describe the project, your role, and key achievements..."
              rows={2}
            />

            <TextInput
              label="Link"
              type="url"
              value={projects[index]?.link || ""}
              onChange={(value) => setValue(`projects.${index}.link`, value, { shouldValidate: true })}
              error={errors.projects?.[index]?.link?.message}
              placeholder="https://github.com/..."
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {fields.length < 4 && (
        <Button
          type="button"
          variant="outline"
          onClick={() => append({ name: "", description: "", technologies: "", link: "" })}
          className="w-full"
        >
          <Plus size={16} className="mr-2" />
          Add Project
        </Button>
      )}

      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No projects added yet. Showcase your personal or notable projects here.
        </p>
      )}
    </div>
  );
};
