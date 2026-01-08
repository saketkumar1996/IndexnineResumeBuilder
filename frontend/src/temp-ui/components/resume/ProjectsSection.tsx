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

  const addResponsibility = (projectIndex: number) => {
    const currentResp = projects[projectIndex]?.responsibilities || [];
    setValue(`projects.${projectIndex}.responsibilities`, [...currentResp, ""], { shouldValidate: true });
  };

  const removeResponsibility = (projectIndex: number, respIndex: number) => {
    const currentResp = projects[projectIndex]?.responsibilities || [];
    setValue(
      `projects.${projectIndex}.responsibilities`,
      currentResp.filter((_, i) => i !== respIndex),
      { shouldValidate: true }
    );
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
                placeholder="Entreda, Smarsh"
              />
              <TextInput
                label="Client / Product"
                value={projects[index]?.client || ""}
                onChange={(value) => setValue(`projects.${index}.client`, value, { shouldValidate: true })}
                error={errors.projects?.[index]?.client?.message}
                placeholder="Compliance Solution"
              />
            </div>

            <TextInput
              label="Technology Stack"
              value={projects[index]?.technologies || ""}
              onChange={(value) => setValue(`projects.${index}.technologies`, value, { shouldValidate: true })}
              error={errors.projects?.[index]?.technologies?.message}
              required
              placeholder="Angular 14, 17, TypeScript, Java, Postgres"
            />

            <TextAreaInput
              label="Description"
              value={projects[index]?.description || ""}
              onChange={(value) => setValue(`projects.${index}.description`, value, { shouldValidate: true })}
              error={errors.projects?.[index]?.description?.message}
              required
              placeholder="Smarsh Cyber Compliance is a cybersecurity and compliance risk management platform..."
              rows={2}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                label="Development Tools"
                value={projects[index]?.developmentTools || ""}
                onChange={(value) => setValue(`projects.${index}.developmentTools`, value, { shouldValidate: true })}
                error={errors.projects?.[index]?.developmentTools?.message}
                placeholder="Visual Studio Code, Git, Postman, Jira"
              />
              <TextInput
                label="Team Size"
                value={projects[index]?.teamSize || ""}
                onChange={(value) => setValue(`projects.${index}.teamSize`, value, { shouldValidate: true })}
                error={errors.projects?.[index]?.teamSize?.message}
                placeholder="10"
              />
            </div>

            {/* Responsibilities */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Responsibilities
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                Describe your role and contributions to this project
              </p>

              {projects[index]?.responsibilities?.map((resp, respIndex) => (
                <div key={respIndex} className="flex gap-2">
                  <TextAreaInput
                    label=""
                    value={resp}
                    onChange={(value) => {
                      const newResp = [...(projects[index]?.responsibilities || [])];
                      newResp[respIndex] = value;
                      setValue(`projects.${index}.responsibilities`, newResp, { shouldValidate: true });
                    }}
                    error={errors.projects?.[index]?.responsibilities?.[respIndex]?.message}
                    placeholder="As an Angular developer, was responsible for developing new features..."
                    rows={2}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeResponsibility(index, respIndex)}
                    className="text-muted-foreground hover:text-destructive shrink-0 mt-1"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}

              {(projects[index]?.responsibilities?.length || 0) < 10 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => addResponsibility(index)}
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

      {fields.length < 10 && (
        <Button
          type="button"
          variant="outline"
          onClick={() => append({ 
            name: "", 
            client: "",
            description: "", 
            technologies: "", 
            developmentTools: "",
            teamSize: "",
            responsibilities: [""] 
          })}
          className="w-full"
        >
          <Plus size={16} className="mr-2" />
          Add Project
        </Button>
      )}

      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No projects added yet. Showcase your project experience here.
        </p>
      )}
    </div>
  );
};
