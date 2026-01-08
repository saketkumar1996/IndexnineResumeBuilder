import { UseFormReturn, useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { ResumeData } from "@/types/resume";
import { TextInput } from "./FormField";
import { Button } from "@/temp-ui/components/ui/button";

interface SkillsSectionProps {
  form: UseFormReturn<ResumeData>;
}

export const SkillsSection = ({ form }: SkillsSectionProps) => {
  const { control, watch, setValue, formState: { errors } } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "skills",
  });

  const skills = watch("skills");

  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-3 items-start">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
            <TextInput
              label="Category"
              value={skills[index]?.category || ""}
              onChange={(value) => setValue(`skills.${index}.category`, value, { shouldValidate: true })}
              error={errors.skills?.[index]?.category?.message}
              required
              placeholder="e.g., Languages, Frameworks"
            />
            <TextInput
              label="Skills"
              value={skills[index]?.skills || ""}
              onChange={(value) => setValue(`skills.${index}.skills`, value, { shouldValidate: true })}
              error={errors.skills?.[index]?.skills?.message}
              required
              placeholder="e.g., JavaScript, Python, Go"
            />
          </div>
          {fields.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(index)}
              className="mt-7 text-muted-foreground hover:text-destructive"
            >
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      ))}

      {fields.length < 6 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ category: "", skills: "" })}
          className="w-full"
        >
          <Plus size={16} className="mr-2" />
          Add Skill Category
        </Button>
      )}
    </div>
  );
};
