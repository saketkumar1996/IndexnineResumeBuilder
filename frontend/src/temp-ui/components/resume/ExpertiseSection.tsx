import { UseFormReturn } from "react-hook-form";
import { ResumeData } from "@/types/resume";
import { TextAreaInput } from "./FormField";

interface ExpertiseSectionProps {
  form: UseFormReturn<ResumeData>;
}

export const ExpertiseSection = ({ form }: ExpertiseSectionProps) => {
  const { watch, setValue, formState: { errors } } = form;
  const expertise = watch("expertise");

  return (
    <TextAreaInput
      label="Professional Summary"
      value={expertise.summary}
      onChange={(value) => setValue("expertise.summary", value, { shouldValidate: true })}
      error={errors.expertise?.summary?.message}
      required
      placeholder="Write a compelling 2-3 sentence summary of your professional background, key achievements, and career goals..."
      rows={4}
      showWordCount
      minWords={80}
      maxWords={120}
    />
  );
};
