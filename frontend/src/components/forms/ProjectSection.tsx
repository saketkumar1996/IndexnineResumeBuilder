import React from 'react';
import { UseFormRegister, FieldErrors, Control, useFieldArray } from 'react-hook-form';
import { ResumeFormData } from '../../schemas/resume';

interface ProjectSectionProps {
  register: UseFormRegister<ResumeFormData>;
  errors: FieldErrors<ResumeFormData>;
  control: Control<ResumeFormData>;
}

export const ProjectSection: React.FC<ProjectSectionProps> = ({ register, errors, control }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'projects'
  });

  const addProject = () => {
    append({
      name: '',
      description: '',
      technologies: '',
      start_date: '',
      end_date: ''
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">PROJECT EXPERIENCE</h2>
        <button
          type="button"
          onClick={addProject}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add Project
        </button>
      </div>

      {fields.map((field, index) => (
        <div key={field.id} className="mb-6 p-4 border border-gray-200 rounded-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-800">Project {index + 1}</h3>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Name *
              </label>
              <input
                {...register(`projects.${index}.name` as const)}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="E-commerce Platform"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Technologies *
              </label>
              <input
                {...register(`projects.${index}.technologies` as const)}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="React, Node.js, PostgreSQL"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date * (MMM YYYY)
              </label>
              <input
                {...register(`projects.${index}.start_date` as const)}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="JAN 2021"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date (MMM YYYY or Present)
              </label>
              <input
                {...register(`projects.${index}.end_date` as const)}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="DEC 2021"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              {...register(`projects.${index}.description` as const)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
              placeholder="Built a scalable e-commerce platform serving 10k+ users..."
            />
          </div>
        </div>
      ))}
    </div>
  );
};