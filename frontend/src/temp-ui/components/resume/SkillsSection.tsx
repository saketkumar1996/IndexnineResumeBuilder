import { UseFormReturn } from "react-hook-form";
import { ResumeData } from "@/types/resume";
import { TextAreaInput } from "./FormField";

interface SkillsSectionProps {
  form: UseFormReturn<ResumeData>;
}

export const SkillsSection = ({ form }: SkillsSectionProps) => {
  const { watch, setValue, formState: { errors } } = form;
  const skills = watch("skills");

  return (
    <div className="space-y-4">
      <TextAreaInput
        label="Technical Skills"
        value={skills.skills || ""}
        onChange={(value) => setValue("skills.skills", value, { shouldValidate: true })}
        error={errors.skills?.skills?.message}
        required
        placeholder="Angular (9,10,12,14,17), JavaScript, TypeScript, React.js, NestJs, HTML-CSS, Bootstrap, CoreUI, NgRx, Jest, Karma, Jasmine, REST API Integration, Postman, Swagger, Git, SVN, Bitbucket, Eclipse, Visual Studio Code, Jira, Confluence, Figma"
        rows={3}
      />
      <div className="text-xs text-muted-foreground">
        <p>Requirements:</p>
        <ul className="list-disc list-inside ml-2">
          <li>Must be comma-separated format</li>
          <li>No emojis, icons, or graphics allowed</li>
          <li>Include programming languages, frameworks, tools, and methodologies</li>
        </ul>
      </div>
    </div>
  );
};
