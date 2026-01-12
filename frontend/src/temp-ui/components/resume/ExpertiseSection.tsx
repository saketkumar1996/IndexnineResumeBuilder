import { UseFormReturn } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { ResumeData } from "@/types/resume";
import { TextAreaInput } from "./FormField";
import { Button } from "@/temp-ui/components/ui/button";

interface ExpertiseSectionProps {
  form: UseFormReturn<ResumeData>;
}

export const ExpertiseSection = ({ form }: ExpertiseSectionProps) => {
  const { watch, setValue, formState: { errors } } = form;
  const expertise = watch("expertise");

  const summaryValue = expertise.summary || "";
  const wordCount = summaryValue.split(/\s+/).filter(word => word.length > 0).length;
  
  const getWordCountColor = () => {
    if (wordCount < 80) return 'text-destructive';
    if (wordCount > 120) return 'text-destructive';
    return 'text-green-600';
  };

  const addBulletPoint = () => {
    const currentPoints = expertise.bulletPoints || [];
    setValue("expertise.bulletPoints", [...currentPoints, ""], { shouldValidate: true });
  };

  const removeBulletPoint = (index: number) => {
    const currentPoints = expertise.bulletPoints || [];
    setValue(
      "expertise.bulletPoints",
      currentPoints.filter((_, i) => i !== index),
      { shouldValidate: true }
    );
  };

  const updateBulletPoint = (index: number, value: string) => {
    const currentPoints = [...(expertise.bulletPoints || [])];
    currentPoints[index] = value;
    setValue("expertise.bulletPoints", currentPoints, { shouldValidate: true });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">
            Professional Summary *
          </label>
          <span className={`text-sm ${getWordCountColor()}`}>
            {wordCount}/80-120 words
          </span>
        </div>
        <TextAreaInput
          label=""
          value={expertise.summary || ""}
          onChange={(value) => setValue("expertise.summary", value, { shouldValidate: true })}
          error={errors.expertise?.summary?.message}
          placeholder="Write a compelling professional summary that highlights your key skills, experience, and achievements. This should be between 80-120 words and provide a clear overview of your professional background and what you bring to potential employers."
          rows={6}
        />
        <div className="text-xs text-muted-foreground">
          <p>Requirements:</p>
          <ul className="list-disc list-inside ml-2">
            <li>Must be between 80-120 words</li>
            <li>No emojis, icons, or graphics allowed</li>
            <li>Focus on professional achievements and skills</li>
          </ul>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Bullet Points
        </label>
        <p className="text-xs text-muted-foreground mb-2">
          Add additional expertise highlights as bullet points
        </p>

        {expertise.bulletPoints?.map((point, index) => (
          <div key={index} className="flex gap-2 items-start">
            <div className="flex-1 min-w-0">
              <TextAreaInput
                label=""
                value={point}
                onChange={(value) => updateBulletPoint(index, value)}
                error={errors.expertise?.bulletPoints?.[index]?.message}
                placeholder="Skilled in investigating and troubleshooting issues..."
                rows={2}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeBulletPoint(index)}
              className="text-muted-foreground hover:text-destructive shrink-0 mt-1"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        ))}

        {(expertise.bulletPoints?.length || 0) < 6 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addBulletPoint}
            className="text-muted-foreground"
          >
            <Plus size={14} className="mr-1" />
            Add bullet point
          </Button>
        )}
      </div>
    </div>
  );
};
