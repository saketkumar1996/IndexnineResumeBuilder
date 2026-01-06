import React from 'react';
import { UseFormRegister, FieldErrors, Control, useFieldArray } from 'react-hook-form';
import { ResumeFormData } from '../../schemas/resume';

interface ExperienceSectionProps {
  register: UseFormRegister<ResumeFormData>;
  errors: FieldErrors<ResumeFormData>;
  control: Control<ResumeFormData>;
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({ register, errors, control }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'experience'
  });

  const addExperience = () => {
    append({
      company: '',
      position: '',
      start_date: '',
      end_date: '',
      responsibilities: ['', '', '']
    });
  };

  const addResponsibility = (experienceIndex: number) => {
    const currentResponsibilities = fields[experienceIndex].responsibilities || [];
    const updatedFields = [...fields];
    updatedFields[experienceIndex] = {
      ...updatedFields[experienceIndex],
      responsibilities: [...currentResponsibilities, '']
    };
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">EXPERIENCE</h2>
        <button
          type="button"
          onClick={addExperience}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Add Experience
        </button>
      </div>

      {fields.map((field, index) => (
        <div key={field.id} className="mb-6 p-4 border border-gray-200 rounded-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-800">Experience {index + 1}</h3>
            {fields.length > 1 && (
              <button
                type="button"
                onClick={() => remove(index)}
                className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Remove
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company *
              </label>
              <input
                {...register(`experience.${index}.company` as const)}
                type="text"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.experience?.[index]?.company ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Tech Corp"
              />
              {errors.experience?.[index]?.company && (
                <p className="mt-1 text-sm text-red-600">{errors.experience[index]?.company?.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position *
              </label>
              <input
                {...register(`experience.${index}.position` as const)}
                type="text"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.experience?.[index]?.position ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Senior Software Engineer"
              />
              {errors.experience?.[index]?.position && (
                <p className="mt-1 text-sm text-red-600">{errors.experience[index]?.position?.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date * (MMM YYYY)
              </label>
              <input
                {...register(`experience.${index}.start_date` as const)}
                type="text"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.experience?.[index]?.start_date ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="JAN 2020"
              />
              {errors.experience?.[index]?.start_date && (
                <p className="mt-1 text-sm text-red-600">{errors.experience[index]?.start_date?.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date (MMM YYYY or Present)
              </label>
              <input
                {...register(`experience.${index}.end_date` as const)}
                type="text"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.experience?.[index]?.end_date ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Present"
              />
              {errors.experience?.[index]?.end_date && (
                <p className="mt-1 text-sm text-red-600">{errors.experience[index]?.end_date?.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Responsibilities * (Minimum 3)
            </label>
            {field.responsibilities?.map((_, respIndex) => (
              <div key={respIndex} className="mb-2">
                <textarea
                  {...register(`experience.${index}.responsibilities.${respIndex}` as const)}
                  rows={2}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                    errors.experience?.[index]?.responsibilities?.[respIndex] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={`Responsibility ${respIndex + 1}`}
                />
                {errors.experience?.[index]?.responsibilities?.[respIndex] && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.experience[index]?.responsibilities?.[respIndex]?.message}
                  </p>
                )}
              </div>
            ))}
            {errors.experience?.[index]?.responsibilities && (
              <p className="mt-1 text-sm text-red-600">{errors.experience[index]?.responsibilities?.message}</p>
            )}
          </div>
        </div>
      ))}

      {fields.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No experience entries yet. Click "Add Experience" to get started.</p>
        </div>
      )}
    </div>
  );
};