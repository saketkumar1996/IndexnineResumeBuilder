/**
 * TypeScript interfaces mirroring backend Pydantic models
 * Updated to match temp-ui component expectations
 * Requirements: 1.5, 5.5, 10.1, 10.2
 */

export interface HeaderData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export interface ExpertiseData {
  summary: string;
}

export interface SkillsData {
  category: string;
  skills: string;
}

export interface ExperienceData {
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate?: string;
  responsibilities: string[];
}

export interface ProjectData {
  name: string;
  description: string;
  technologies: string;
  link?: string;
}

export interface EducationData {
  institution: string;
  degree: string;
  location: string;
  graduationDate: string;
  gpa?: string;
  honors?: string;
}

export interface AwardData {
  title: string;
  issuer: string;
  date: string;
  description?: string;
}

export interface ResumeData {
  header: HeaderData;
  expertise: ExpertiseData;
  skills: SkillsData[];
  experiences: ExperienceData[];
  projects: ProjectData[];
  education: EducationData[];
  awards?: AwardData[];
}

// Default data structure
export const defaultResumeData: ResumeData = {
  header: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    portfolio: "",
  },
  expertise: {
    summary: "",
  },
  skills: [
    {
      category: "",
      skills: "",
    },
  ],
  experiences: [
    {
      company: "",
      title: "",
      location: "",
      startDate: "",
      endDate: "",
      responsibilities: [""],
    },
  ],
  projects: [
    {
      name: "",
      description: "",
      technologies: "",
      link: "",
    },
  ],
  education: [
    {
      institution: "",
      degree: "",
      location: "",
      graduationDate: "",
      gpa: "",
      honors: "",
    },
  ],
  awards: [],
};

// Sample data that complies with all validation rules
export const sampleResumeData: ResumeData = {
  header: {
    fullName: "John Smith",
    email: "john.smith@email.com",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, CA",
    linkedin: "https://linkedin.com/in/johnsmith",
    github: "https://github.com/johnsmith",
    portfolio: "https://johnsmith.dev",
  },
  expertise: {
    summary: "Experienced software engineer with over 8 years of expertise in full-stack development, cloud architecture, and team leadership. Proven track record of delivering scalable web applications using modern technologies including React, Node.js, Python, and AWS services. Strong background in agile methodologies, code review processes, and mentoring junior developers. Passionate about building high-performance systems that solve complex business problems while maintaining clean, maintainable code. Experienced in leading cross-functional teams and driving technical decisions that align with business objectives and industry best practices.",
  },
  skills: [
    {
      category: "Programming Languages",
      skills: "JavaScript, TypeScript, Python, Go, Java",
    },
    {
      category: "Frontend Technologies",
      skills: "React, Vue.js, HTML5, CSS3, Tailwind CSS",
    },
    {
      category: "Backend Technologies",
      skills: "Node.js, FastAPI, Express.js, PostgreSQL, MongoDB",
    },
    {
      category: "Cloud & DevOps",
      skills: "AWS, Docker, Kubernetes, CI/CD, Git",
    },
  ],
  experiences: [
    {
      company: "Tech Solutions Inc",
      title: "Senior Software Engineer",
      location: "San Francisco, CA",
      startDate: "01/2020",
      endDate: "Present",
      responsibilities: [
        "Led development of microservices architecture serving 1M+ daily active users",
        "Implemented CI/CD pipelines reducing deployment time by 75% and improving reliability",
        "Mentored 5 junior developers and conducted code reviews to maintain high code quality standards",
      ],
    },
  ],
  projects: [
    {
      name: "E-commerce Platform Redesign",
      description: "Complete redesign of legacy e-commerce platform using modern React and Node.js stack",
      technologies: "React, Node.js, PostgreSQL, AWS, Docker",
      link: "https://github.com/johnsmith/ecommerce-platform",
    },
  ],
  education: [
    {
      institution: "University of California",
      degree: "Bachelor of Science in Computer Science",
      location: "Berkeley, CA",
      graduationDate: "05/2016",
      gpa: "3.8/4.0",
      honors: "Magna Cum Laude, Dean's List",
    },
  ],
  awards: [],
};

// API Response Types
export interface ValidationError {
  field: string;
  message: string;
  type: string;
  input?: any;
  spec_reference?: string;
}

export interface ValidationResponse {
  valid: boolean;
  errors?: ValidationError[];
  data?: ResumeData;
}

export interface PreviewResponse {
  html: string;
  valid: boolean;
  errors?: ValidationError[];
}