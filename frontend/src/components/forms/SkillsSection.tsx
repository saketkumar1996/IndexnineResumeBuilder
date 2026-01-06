import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { ResumeFormData } from '../../schemas/resume';

interface SkillsSectionProps {
  register: UseFormRegister<ResumeFormData>;
  errors: FieldErrors<ResumeFormData>;
}

export const SkillsSection: React.FC<SkillsSectionProps> = ({ register, errors }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">SKILLS</h2>
      
      <div>
        <label htmlFor="skills.skills" className="block text-sm font-medium text-gray-700 mb-1">
          Technical Skills *
        </label>
        <textarea
          {...register('skills.skills')}
          id="skills.skills"
          rows={3}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
            errors.skills?.skills ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Python, JavaScript, React, Node.js, AWS, Docker, Kubernetes, PostgreSQL, MongoDB, Git, Agile, Scrum"
        />
        {errors.skills?.skills && (
          <p className="mt-1 text-sm text-red-600">{errors.skills.skills.message}</p>
        )}
        
        <div className="mt-2 text-xs text-gray-500">
          <p>Requirements:</p>
          <ul className="list-disc list-inside ml-2">
            <li>Must be comma-separated format</li>
            <li>No emojis, icons, or graphics allowed</li>
            <li>Include programming languages, frameworks, tools, and methodologies</li>
          </ul>
        </div>
      </div>
    </div>
  );
};