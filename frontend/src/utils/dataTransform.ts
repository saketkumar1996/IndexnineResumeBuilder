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
  technology_stack: string;
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
  // Skills is now a single string
  const skillsString = frontendData.skills?.skills || 'Skill 1, Skill 2, Skill 3, Skill 4, Skill 5';

  // Extract job title from the first experience or use a default
  const jobTitle = frontendData.experiences.length > 0 && frontendData.experiences[0].title
    ? frontendData.experiences[0].title 
    : 'Professional';

  // Convert date format to uppercase (e.g., "Apr 2024" -> "APR 2024")
  const convertToUppercaseDate = (date: string): string => {
    if (!date || date === 'Present') return date;
    const match = date.match(/^([A-Za-z]{3})\s+(\d{4})$/);
    if (match) {
      return `${match[1].toUpperCase()} ${match[2]}`;
    }
    return date.toUpperCase();
  };

  // Get all project responsibilities
  const allProjectResponsibilities = frontendData.projects
    .filter(p => p.responsibilities && p.responsibilities.length > 0)
    .flatMap(p => p.responsibilities || [])
    .filter(r => r && r.trim());

  // Default responsibilities if none available
  const defaultResponsibilities = [
    "Developed and maintained software applications following best practices and coding standards.",
    "Collaborated with cross-functional teams to deliver high-quality solutions on time.",
    "Participated in code reviews, testing, and debugging to ensure application reliability."
  ];

  // Ensure we have at least one experience with minimum data
  const experiences = frontendData.experiences.length > 0 && frontendData.experiences[0].company
    ? frontendData.experiences
        .filter(exp => exp.company && exp.title) // Only include experiences with required fields
        .map((exp, index) => {
          // Distribute project responsibilities across experiences, or use defaults
          let responsibilities: string[];
          if (allProjectResponsibilities.length >= 3) {
            // Distribute responsibilities across experiences
            const responsibilitiesPerExp = Math.max(3, Math.ceil(allProjectResponsibilities.length / frontendData.experiences.length));
            const startIdx = index * responsibilitiesPerExp;
            const endIdx = Math.min(startIdx + responsibilitiesPerExp, allProjectResponsibilities.length);
            responsibilities = allProjectResponsibilities.slice(startIdx, endIdx);
            // Ensure at least 3
            if (responsibilities.length < 3) {
              responsibilities = [...responsibilities, ...defaultResponsibilities.slice(0, 3 - responsibilities.length)];
            }
          } else {
            responsibilities = defaultResponsibilities;
          }
          
          return {
            company: exp.company,
            position: exp.title,
            start_date: convertToUppercaseDate(exp.startDate || 'JAN 2020'),
            end_date: exp.endDate ? convertToUppercaseDate(exp.endDate) : 'Present',
            responsibilities: responsibilities.slice(0, Math.max(3, responsibilities.length)),
          };
        })
    : [{
        company: 'Company Name',
        position: 'Position Title',
        start_date: 'JAN 2020',
        end_date: 'Present',
        responsibilities: defaultResponsibilities,
      }];

  // Ensure we have at least one education entry
  const education = frontendData.education.length > 0 && frontendData.education[0].institution
    ? frontendData.education
        .filter(edu => edu.institution && edu.degree) // Only include education with required fields
        .map(edu => {
          // Convert year range to graduation date (use end year as graduation)
          const graduationYear = edu.endYear || '2020';
          const graduationDate = `MAY ${graduationYear}`;
          return {
            institution: edu.institution,
            degree: edu.degree,
            field_of_study: edu.degree, // Use degree as field of study since we don't have separate field
            graduation_date: graduationDate,
            gpa: edu.gpa || undefined,
          };
        })
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
          technology_stack: proj.technologies || 'Various technologies', // Backend expects technology_stack
          start_date: 'JAN 2023',
          end_date: 'DEC 2023',
        }))
    : [{
        name: 'Sample Project',
        description: 'Project description will appear here',
        technology_stack: 'Various technologies',
        start_date: 'JAN 2023',
        end_date: 'DEC 2023',
      }];

  return {
    header: {
      name: frontendData.header.fullName || 'Your Name',
      title: frontendData.header.designation || jobTitle,
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
    awards: frontendData.awards?.filter(award => award.title && award.year).map(award => ({
      title: award.title,
      organization: 'Organization', // Backend requires organization with at least 1 character
      date: `JAN ${award.year}` || 'JAN 2023',
      description: '',
    })) || [],
  };
}

// Transform backend data to frontend format (for loading existing data)
export function transformToFrontend(backendData: BackendResumeModel): ResumeData {
  // Skills is now a single string
  const skillsData = {
    skills: backendData.skills.skills || ''
  };

  return {
    header: {
      fullName: backendData.header.name,
      designation: backendData.header.title || '',
      email: backendData.header.email,
      phone: backendData.header.phone,
      location: backendData.header.location,
      linkedin: '',
      github: '',
      portfolio: '',
    },
    expertise: {
      summary: backendData.expertise.summary,
      bulletPoints: [],
    },
    skills: skillsData,
    experiences: backendData.experience.map(exp => ({
      company: exp.company,
      title: exp.position,
      location: '', // Backend doesn't have location for experiences
      startDate: exp.start_date || '',
      endDate: exp.end_date || '',
    })),
    projects: backendData.projects.map(proj => ({
      name: proj.name,
      description: proj.description,
      technologies: proj.technologies,
      link: '',
    })),
    education: backendData.education.map(edu => {
      // Extract year from graduation date (format: MMM YYYY)
      const graduationYear = edu.graduation_date.match(/\d{4}/)?.[0] || '';
      return {
        institution: edu.institution,
        degree: edu.degree,
        location: '', // Backend doesn't have location for education
        startYear: graduationYear ? String(parseInt(graduationYear) - 4) : '',
        endYear: graduationYear || '',
        gpa: edu.gpa || '',
        honors: '',
      };
    }),
    awards: backendData.awards?.map(award => {
      // Extract year from date (format: MMM YYYY)
      const year = award.date.match(/\d{4}/)?.[0] || '';
      return {
        title: award.title,
        year: year || '',
      };
    }) || [],
  };
}