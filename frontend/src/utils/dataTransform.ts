import { ResumeData } from '@/types/resume';

// Backend data interfaces (matching the Pydantic models)
interface BackendHeaderModel {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
}

interface BackendExpertiseModel {
  summary: string;
}

interface BackendSkillsModel {
  skills: string;
}

interface BackendExperienceModel {
  company: string;
  position: string;
  start_date: string;
  end_date?: string;
  responsibilities: string[];
}

interface BackendProjectModel {
  name: string;
  description: string;
  technologies: string;
  start_date: string;
  end_date?: string;
}

interface BackendEducationModel {
  institution: string;
  degree: string;
  field_of_study: string;
  graduation_date: string;
  gpa?: string;
}

interface BackendAwardModel {
  title: string;
  organization: string;
  date: string;
  description?: string;
}

interface BackendResumeModel {
  header: BackendHeaderModel;
  expertise: BackendExpertiseModel;
  skills: BackendSkillsModel;
  experience: BackendExperienceModel[];
  projects: BackendProjectModel[];
  education: BackendEducationModel[];
  awards?: BackendAwardModel[];
}

// Convert MM/YYYY to MMM YYYY format
function convertDateFormat(date: string): string {
  if (!date || date === 'Present') return date;
  
  const months = [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
  ];
  
  const match = date.match(/^(\d{2})\/(\d{4})$/);
  if (match) {
    const monthIndex = parseInt(match[1]) - 1;
    const year = match[2];
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${months[monthIndex]} ${year}`;
    }
  }
  
  return date;
}

// Convert MMM YYYY to MM/YYYY format
function convertDateFormatToFrontend(date: string): string {
  if (!date || date === 'Present') return date;
  
  const months = [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
  ];
  
  const match = date.match(/^([A-Z]{3}) (\d{4})$/);
  if (match) {
    const monthIndex = months.indexOf(match[1]);
    const year = match[2];
    if (monthIndex >= 0) {
      return `${String(monthIndex + 1).padStart(2, '0')}/${year}`;
    }
  }
  
  return date;
}

// Transform frontend data to backend format
export function transformToBackend(frontendData: ResumeData): BackendResumeModel {
  // Combine skills categories into a single comma-separated string
  const skillsString = frontendData.skills
    .filter(skill => skill.category && skill.skills)
    .map(skill => skill.skills)
    .join(', ');

  // Extract job title from the first experience or use a default
  const jobTitle = frontendData.experiences.length > 0 && frontendData.experiences[0].title
    ? frontendData.experiences[0].title 
    : 'Professional';

  // Ensure we have at least one experience with minimum data
  const experiences = frontendData.experiences.length > 0 && frontendData.experiences[0].company
    ? frontendData.experiences
        .filter(exp => exp.company && exp.title) // Only include experiences with required fields
        .map(exp => ({
          company: exp.company,
          position: exp.title,
          start_date: convertDateFormat(exp.startDate) || 'JAN 2020',
          end_date: exp.endDate && exp.endDate !== 'Present' ? convertDateFormat(exp.endDate) : exp.endDate || 'Present',
          responsibilities: exp.responsibilities.filter(r => r && r.trim()).length >= 3 
            ? exp.responsibilities.filter(r => r && r.trim())
            : [
                'Contributed to team projects and initiatives',
                'Collaborated with cross-functional teams',
                'Maintained high standards of work quality'
              ],
        }))
    : [{
        company: 'Company Name',
        position: 'Position Title',
        start_date: 'JAN 2020',
        end_date: 'Present',
        responsibilities: [
          'Contributed to team projects and initiatives',
          'Collaborated with cross-functional teams',
          'Maintained high standards of work quality'
        ],
      }];

  // Ensure we have at least one education entry
  const education = frontendData.education.length > 0 && frontendData.education[0].institution
    ? frontendData.education
        .filter(edu => edu.institution && edu.degree) // Only include education with required fields
        .map(edu => ({
          institution: edu.institution,
          degree: edu.degree,
          field_of_study: edu.degree, // Use degree as field of study since we don't have separate field
          graduation_date: convertDateFormat(edu.graduationDate) || 'MAY 2020',
          gpa: edu.gpa || undefined,
        }))
    : [{
        institution: 'University Name',
        degree: 'Bachelor of Science',
        field_of_study: 'Computer Science',
        graduation_date: 'MAY 2020',
        gpa: undefined,
      }];

  // Handle projects - only include if we have real data
  const projects = frontendData.projects.length > 0 && frontendData.projects[0].name
    ? frontendData.projects
        .filter(proj => proj.name && proj.description) // Only include projects with required fields
        .map(proj => ({
          name: proj.name,
          description: proj.description,
          technologies: proj.technologies || 'Various technologies',
          start_date: 'JAN 2023',
          end_date: 'DEC 2023',
        }))
    : [{
        name: 'Sample Project',
        description: 'Project description will appear here',
        technologies: 'Various technologies',
        start_date: 'JAN 2023',
        end_date: 'DEC 2023',
      }];

  return {
    header: {
      name: frontendData.header.fullName || 'Your Name',
      title: jobTitle,
      email: frontendData.header.email || 'your.email@example.com',
      phone: frontendData.header.phone || '+1 (555) 123-4567',
      location: frontendData.header.location || 'City, State',
    },
    expertise: {
      summary: frontendData.expertise.summary || 'Professional summary will appear here. This section should contain 80-120 words describing your expertise, experience, and key qualifications. It serves as an introduction to your professional background and highlights your most relevant skills and achievements. The summary should be compelling and provide a clear overview of what you bring to potential employers. Make sure to customize this section to reflect your unique professional experience and career objectives.',
    },
    skills: {
      skills: skillsString || 'Skill 1, Skill 2, Skill 3, Skill 4, Skill 5',
    },
    experience: experiences,
    projects: projects,
    education: education,
    awards: frontendData.awards?.filter(award => award.title && award.issuer).map(award => ({
      title: award.title,
      organization: award.issuer,
      date: convertDateFormat(award.date) || 'JAN 2023',
      description: award.description,
    })) || [],
  };
}

// Transform backend data to frontend format (for loading existing data)
export function transformToFrontend(backendData: BackendResumeModel): ResumeData {
  // Split skills string into categories (simplified approach)
  const skillsArray = backendData.skills.skills
    ? [{ category: 'Technical Skills', skills: backendData.skills.skills }]
    : [{ category: '', skills: '' }];

  return {
    header: {
      fullName: backendData.header.name,
      email: backendData.header.email,
      phone: backendData.header.phone,
      location: backendData.header.location,
      linkedin: '',
      github: '',
      portfolio: '',
    },
    expertise: {
      summary: backendData.expertise.summary,
    },
    skills: skillsArray,
    experiences: backendData.experience.map(exp => ({
      company: exp.company,
      title: exp.position,
      location: '', // Backend doesn't have location for experiences
      startDate: convertDateFormatToFrontend(exp.start_date),
      endDate: exp.end_date ? convertDateFormatToFrontend(exp.end_date) : '',
      responsibilities: exp.responsibilities,
    })),
    projects: backendData.projects.map(proj => ({
      name: proj.name,
      description: proj.description,
      technologies: proj.technologies,
      link: '',
    })),
    education: backendData.education.map(edu => ({
      institution: edu.institution,
      degree: edu.degree,
      location: '', // Backend doesn't have location for education
      graduationDate: convertDateFormatToFrontend(edu.graduation_date),
      gpa: edu.gpa || '',
      honors: '',
    })),
    awards: backendData.awards?.map(award => ({
      title: award.title,
      issuer: award.organization,
      date: convertDateFormatToFrontend(award.date),
      description: award.description,
    })) || [],
  };
}