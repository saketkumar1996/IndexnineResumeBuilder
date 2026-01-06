import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { ResumeFormData } from '../../schemas/resume';

interface HeaderSectionProps {
  register: UseFormRegister<ResumeFormData>;
  errors: FieldErrors<ResumeFormData>;
}

export const HeaderSection: React.FC<HeaderSectionProps> = ({ register, errors }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">HEADER</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="header.name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <input
            {...register('header.name')}
            type="text"
            id="header.name"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.header?.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="John Doe"
          />
          {errors.header?.name && (
            <p className="mt-1 text-sm text-red-600">{errors.header.name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="header.title" className="block text-sm font-medium text-gray-700 mb-1">
            Professional Title *
          </label>
          <input
            {...register('header.title')}
            type="text"
            id="header.title"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.header?.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Software Engineer"
          />
          {errors.header?.title && (
            <p className="mt-1 text-sm text-red-600">{errors.header.title.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="header.email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <input
            {...register('header.email')}
            type="email"
            id="header.email"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.header?.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="john.doe@example.com"
          />
          {errors.header?.email && (
            <p className="mt-1 text-sm text-red-600">{errors.header.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="header.phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number *
          </label>
          <input
            {...register('header.phone')}
            type="tel"
            id="header.phone"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.header?.phone ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="+1 (555) 123-4567"
          />
          {errors.header?.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.header.phone.message}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label htmlFor="header.location" className="block text-sm font-medium text-gray-700 mb-1">
            Location *
          </label>
          <input
            {...register('header.location')}
            type="text"
            id="header.location"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.header?.location ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="San Francisco, CA"
          />
          {errors.header?.location && (
            <p className="mt-1 text-sm text-red-600">{errors.header.location.message}</p>
          )}
        </div>
      </div>
    </div>
  );
};