import { UseFormReturn } from "react-hook-form";
import { ResumeData } from "@/types/resume";
import { TextInput } from "./FormField";

interface HeaderSectionProps {
  form: UseFormReturn<ResumeData>;
}

export const HeaderSection = ({ form }: HeaderSectionProps) => {
  const { watch, setValue, formState: { errors } } = form;
  const header = watch("header");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextInput
          label="Full Name"
          value={header.fullName}
          onChange={(value) => setValue("header.fullName", value, { shouldValidate: true })}
          error={errors.header?.fullName?.message}
          required
          placeholder="John Doe"
        />
        <TextInput
          label="Email"
          type="email"
          value={header.email}
          onChange={(value) => setValue("header.email", value, { shouldValidate: true })}
          error={errors.header?.email?.message}
          required
          placeholder="john@example.com"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextInput
          label="Phone"
          type="tel"
          value={header.phone}
          onChange={(value) => setValue("header.phone", value, { shouldValidate: true })}
          error={errors.header?.phone?.message}
          required
          placeholder="(555) 123-4567"
        />
        <TextInput
          label="Location"
          value={header.location}
          onChange={(value) => setValue("header.location", value, { shouldValidate: true })}
          error={errors.header?.location?.message}
          required
          placeholder="San Francisco, CA"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TextInput
          label="LinkedIn"
          type="url"
          value={header.linkedin || ""}
          onChange={(value) => setValue("header.linkedin", value, { shouldValidate: true })}
          error={errors.header?.linkedin?.message}
          placeholder="https://linkedin.com/in/..."
        />
        <TextInput
          label="GitHub"
          type="url"
          value={header.github || ""}
          onChange={(value) => setValue("header.github", value, { shouldValidate: true })}
          error={errors.header?.github?.message}
          placeholder="https://github.com/..."
        />
        <TextInput
          label="Portfolio"
          type="url"
          value={header.portfolio || ""}
          onChange={(value) => setValue("header.portfolio", value, { shouldValidate: true })}
          error={errors.header?.portfolio?.message}
          placeholder="https://yoursite.com"
        />
      </div>
    </div>
  );
};
