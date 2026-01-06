import React, { useState } from 'react';
import { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form';
import { ResumeFormData } from '../../schemas/resume';

interface ExpertiseSectionProps {
  register: UseFormRegister<ResumeFormData>;
  errors: FieldErrors<ResumeFormData>;
  watch: UseFormWatch<ResumeFormData>;
}

export const ExpertiseSection: React.FC<ExpertiseSectionProps> = ({ register, errors, watch }) => {
  const summaryValue = watch('expertise.summary') || '';
  const wordCount = summaryValue.split(/\s+/).filter(word => word.length > 0).length;
  
  const getWordCountColor = () => {
    if (wordCount < 80) return 'text-red-600';
    if (wordCount > 120) return 'text-red-600';
    return 'text-green-600';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">EXPERTISE SUMMARY</h2>
      
      <div>
        <label htmlFor="expertise.summary" className="block text-sm font-medium text-gray-700 mb-1">
          Professional Summary *
          <span className={`ml-2 text-sm ${getWordCountColor()}`}>
            ({wordCount}/80-120 words)
          </span>
        </label>
        <textarea
          {...register('expertise.summary')}
          id="expertise.summary"
          rows={6}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
            errors.expertise?.summary ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Write a compelling professional summary that highlights your key skills, experience, and achievements. This should be between 80-120 words and provide a clear overview of your professional background and what you bring to potential employers."
        />
        {errors.expertise?.summary && (
          <p className="mt-1 text-sm text-red-600">{errors.expertise.summary.message}</p>
        )}
        
        <div className="mt-2 text-xs text-gray-500">
          <p>Requirements:</p>
          <ul className="list-disc list-inside ml-2">
            <li>Must be between 80-120 words</li>
            <li>No emojis, icons, or graphics allowed</li>
            <li>Focus on professional achievements and skills</li>
          </ul>
        </div>
      </div>
    </div>
  );
};