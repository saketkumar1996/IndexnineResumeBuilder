import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ResumeSchema, ResumeFormData } from '../schemas/resume';
import { HeaderSection } from './forms/HeaderSection';
import { ExpertiseSection } from './forms/ExpertiseSection';
import { SkillsSection } from './forms/SkillsSection';
import { ExperienceSection } from './forms/ExperienceSection';
import { ProjectSection } from './forms/ProjectSection';
import { EducationSection } from './forms/EducationSection';

interface ResumeFormProps {
  onFormChange: (data: ResumeFormData, isValid: boolean) => void;
  onExport: (data: ResumeFormData) => void;
  isValidating?: boolean;
  isExporting?: boolean;
}

export const ResumeForm: React.FC<ResumeFormProps> = ({
  onFormChange,
  onExport,
  isExporting = false
}) => {
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isValid }
  } = useForm<ResumeFormData>({
    resolver: zodResolver(ResumeSchema),
    mode: 'onBlur', // Changed from 'onChange' to reduce validation frequency
    reValidateMode: 'onBlur',
    defaultValues: {
      header: {
        name: '',
        title: '',
        email: '',
        phone: '',
        location: ''
      },
      expertise: {
        summary: ''
      },
      skills: {
        skills: ''
      },
      experience: [{
        company: '',
        position: '',
        start_date: '',
        end_date: '',
        responsibilities: ['', '', '']
      }],
      projects: [{
        name: '',
        description: '',
        technologies: '',
        start_date: '',
        end_date: ''
      }],
      education: [{
        institution: '',
        degree: '',
        field_of_study: '',
        graduation_date: '',
        gpa: ''
      }],
      awards: []
    }
  });

  // Watch all form data for real-time validation and preview
  const watchedData = watch();

  React.useEffect(() => {
    // Always call onFormChange with current data, don't validate for preview
    onFormChange(watchedData, isValid);
  }, [watchedData, isValid, onFormChange]);

  const onSubmit = (data: ResumeFormData) => {
    onFormChange(data, true);
  };

  const handleExport = () => {
    if (isValid) {
      onExport(watchedData);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Indexnine Resume Builder
        </h1>
        <p className="text-gray-600">
          Create a company-compliant resume with strict validation and Indexnine output.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header Section */}
        <HeaderSection register={register} errors={errors} />

        {/* Expertise Summary Section */}
        <ExpertiseSection register={register} errors={errors} watch={watch} />

        {/* Skills Section */}
        <SkillsSection register={register} errors={errors} />

        {/* Experience Section */}
        <ExperienceSection register={register} errors={errors} control={control} />

        {/* Project Experience Section */}
        <ProjectSection register={register} errors={errors} control={control} />

        {/* Education Section */}
        <EducationSection register={register} errors={errors} control={control} />

        {/* Action Buttons */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={handleExport}
              disabled={!isValid || isExporting}
              className={`flex-1 px-6 py-3 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isValid && !isExporting
                  ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isExporting ? 'Exporting...' : 'Export DOCX'}
            </button>
          </div>

          {!isValid && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                Please fix all validation errors before exporting. Preview updates automatically as you type.
              </p>
            </div>
          )}

          <div className="mt-4 text-xs text-gray-500">
            <p>Features:</p>
            <ul className="list-disc list-inside ml-2">
              <li>Real-time preview updates as you type (500ms delay)</li>
              <li>Export is only available when all validation passes</li>
              <li>All sections must be completed with valid data</li>
            </ul>
          </div>
        </div>
      </form>
    </div>
  );
};