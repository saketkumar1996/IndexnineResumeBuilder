import React from 'react';
import { UseFormRegister, FieldErrors, Control, useFieldArray } from 'react-hook-form';
import { ResumeFormData } from '../../schemas/resume';

interface EducationSectionProps {
  register: UseFormRegister<ResumeFormData>;
  errors: FieldErrors<ResumeFormData>;
  control: Control<ResumeFormData>;
}

export const EducationSection: React.FC<EducationSectionProps> = ({ register, errors, control }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'education'
  });

  const addEducation = () => {
    append({
      institution: '',
      degree: '',
      field_of_study: '',
      graduation_date: '',
      gpa: ''
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">EDUCATION</h2>
        <button
          type="button"
          onClick={addEducation}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add Education
        </button>
      </div>

      {fields.map((field, index) => (
        <div key={field.id} className="mb-6 p-4 border border-gray-200 rounded-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-800">Education {index + 1}</h3>
            {fields.length > 1 && (
              <button
                type="button"
                onClick={() => remove(index)}
                className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Remove
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Institution *
              </label>
              <input
                {...register(`education.${index}.institution` as const)}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="University of California"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Degree *
              </label>
              <input
                {...register(`education.${index}.degree` as const)}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Bachelor of Science"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Field of Study *
              </label>
              <input
                {...register(`education.${index}.field_of_study` as const)}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Computer Science"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Graduation Date * (MMM YYYY)
              </label>
              <input
                {...register(`education.${index}.graduation_date` as const)}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="MAY 2018"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GPA (Optional)
              </label>
              <input
                {...register(`education.${index}.gpa` as const)}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="3.8"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};