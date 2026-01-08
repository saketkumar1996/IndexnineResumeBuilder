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
          value={header.fullName || ""}
          onChange={(value) => setValue("header.fullName", value, { shouldValidate: true })}
          error={errors.header?.fullName?.message}
          required
          placeholder="John Doe"
        />
        <TextInput
          label="Designation / Title"
          value={header.designation || ""}
          onChange={(value) => setValue("header.designation", value, { shouldValidate: true })}
          error={errors.header?.designation?.message}
          required
          placeholder="Sr. Consultant - Software Engineer"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextInput
          label="Email Address"
          type="email"
          value={header.email || ""}
          onChange={(value) => setValue("header.email", value, { shouldValidate: true })}
          error={errors.header?.email?.message}
          required
          placeholder="john.doe@example.com"
        />
        <TextInput
          label="Phone Number"
          type="tel"
          value={header.phone || ""}
          onChange={(value) => setValue("header.phone", value, { shouldValidate: true })}
          error={errors.header?.phone?.message}
          required
          placeholder="+1 (555) 123-4567"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextInput
          label="Location"
          value={header.location || ""}
          onChange={(value) => setValue("header.location", value, { shouldValidate: true })}
          error={errors.header?.location?.message}
          required
          placeholder="San Francisco, CA"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TextInput
          label="LinkedIn (Optional)"
          type="url"
          value={header.linkedin || ""}
          onChange={(value) => setValue("header.linkedin", value, { shouldValidate: true })}
          error={errors.header?.linkedin?.message}
          placeholder="https://linkedin.com/in/yourprofile"
        />
        <TextInput
          label="GitHub (Optional)"
          type="url"
          value={header.github || ""}
          onChange={(value) => setValue("header.github", value, { shouldValidate: true })}
          error={errors.header?.github?.message}
          placeholder="https://github.com/yourusername"
        />
        <TextInput
          label="Portfolio (Optional)"
          type="url"
          value={header.portfolio || ""}
          onChange={(value) => setValue("header.portfolio", value, { shouldValidate: true })}
          error={errors.header?.portfolio?.message}
          placeholder="https://yourportfolio.com"
        />
      </div>
    </div>
  );
};
