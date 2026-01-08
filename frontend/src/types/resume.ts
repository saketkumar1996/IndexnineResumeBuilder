/**
 * TypeScript interfaces mirroring backend Pydantic models
 * Updated to match temp-ui component expectations
 * Requirements: 1.5, 5.5, 10.1, 10.2
 */

export interface HeaderData {
  fullName: string;
  designation: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export interface ExpertiseData {
  summary: string;
  bulletPoints?: string[];
}

export interface SkillsData {
  skills: string;
}

export interface ExperienceData {
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate?: string;
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
  startYear: string;
  endYear: string;
  gpa?: string;
  honors?: string;
}

export interface AwardData {
  title: string;
  year: string;
}

export interface ResumeData {
  header: HeaderData;
  expertise: ExpertiseData;
  skills: SkillsData;
  experiences: ExperienceData[];
  projects: ProjectData[];
  education: EducationData[];
  awards?: AwardData[];
}

// Default data structure
export const defaultResumeData: ResumeData = {
  header: {
    fullName: "",
    designation: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    portfolio: "",
  },
  expertise: {
    summary: "",
    bulletPoints: [],
  },
  skills: {
    skills: "",
  },
  experiences: [
    {
      company: "",
      title: "",
      location: "",
      startDate: "",
      endDate: "",
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
      startYear: "",
      endYear: "",
      gpa: "",
      honors: "",
    },
  ],
  awards: [],
};

// Sample data that complies with all validation rules
export const sampleResumeData: ResumeData = {
  header: {
    fullName: "FirstName Second Name",
    designation: "Sr. Consultant - Software Engineer",
    email: "firstname.secondname@email.com",
    phone: "+1 (555) 123-4567",
    location: "Pune, Maharashtra",
    linkedin: "https://linkedin.com/in/firstname-secondname",
    github: "https://github.com/firstname-secondname",
    portfolio: "https://firstname-secondname.dev",
  },
  expertise: {
    summary: "6+ years of experience in designing, developing, modifying, debugging, and maintaining software code according to functional, non-functional, and technical design specifications. Skilled in investigating and troubleshooting issues by reviewing and debugging code, providing fixes and workarounds, and ensuring operability for maintaining existing software solutions. Worked across various domains viz. Security, Education, Fintech, Security and Travel. Good communication and interpersonal skills, accustomed to working in a team environment and capable of working efficiently under pressure.",
    bulletPoints: [
      "Skilled in investigating and troubleshooting issues by reviewing and debugging code, providing fixes and workarounds, and ensuring operability for maintaining existing software solutions.",
      "Worked across various domains viz. Security, Education, Fintech, Security and Travel.",
      "Good communication and interpersonal skills, accustomed to working in a team environment and capable of working efficiently under pressure.",
    ],
  },
  skills: {
    skills: "Angular (9,10,12,14,17), JavaScript, TypeScript, React.js, NestJs, HTML-CSS, Bootstrap, CoreUI, NgRx, Jest, Karma, Jasmine, REST API Integration, Postman, Swagger, Git, SVN, Bitbucket, Eclipse, Visual Studio Code, Jira, Confluence, Figma",
  },
  experiences: [
    {
      company: "Indexnine Technologies Pvt. Ltd.",
      title: "Sr. Consultant - Senior Software Engineer",
      location: "Pune",
      startDate: "Apr 2024",
      endDate: "Present",
    },
    {
      company: "Indexnine Technologies Pvt. Ltd.",
      title: "Consultant - Senior Software Engineer",
      location: "Pune",
      startDate: "Apr 2023",
      endDate: "Mar 2024",
    },
    {
      company: "Indexnine Technologies Pvt. Ltd.",
      title: "Software Engineer",
      location: "Pune",
      startDate: "Jan 2021",
      endDate: "Mar 2023",
    },
  ],
  projects: [
    {
      name: "Entreda, Smarsh",
      client: "Compliance Solution",
      description: "Smarsh Cyber Compliance is a cybersecurity and compliance risk management platform. It helps organizations monitor, remediate, and report on cyber risks in real time.",
      technologies: "Angular 14, 17, TypeScript, Java, Postgres",
      developmentTools: "Visual studio code, Git, Postman, Jira, Confluence",
      teamSize: "40",
      responsibilities: [
        "As an Angular developer, was responsible for developing new features, working on enhancements in existing features, and fixing bugs.",
        "Integrated libraries like CoreUI and AG-Grid to enhance UI, enabling advanced data table functionalities such as sorting, filtering, and pagination.",
        "Responsible for migration from Angular v14 to v17 without breaking code and functionality.",
        "I implemented NgRx for state management, caching API responses in the store to minimize redundant API calls and improve application performance.",
        "Implemented unit tests using Jest to ensure reliable functionality and improve code coverage.",
        "Followed the Agile methodology and participated in sprint planning, backlog grooming and retrospective.",
        "Used confluence for documentation of features and API contract discussion.",
      ],
    },
    {
      name: "Gyan AI",
      client: "",
      description: "Auto-curating Research Engine: Gyan's platform is designed to be self-organizing, providing unbiased and fully explainable analyses without hallucinations or inconsistencies.",
      technologies: "Angular 12, TypeScript, HTML, SCSS, MySQL, Java",
      developmentTools: "Visual studio code, Git, Postman, Figma, SonarQube",
      teamSize: "10",
      responsibilities: [
        "As a senior frontend developer, my role involves collaborating with the team to design and develop user-friendly UI components using Angular and implementing functionalities.",
        "Additionally, I contribute to requirement analysis, feature development, bug fixing, and ensuring seamless integration between frontend and backend components.",
        "Actively involved in feature discussion with customers as senior developer in the team.",
        "Integrated D3.js to visualize and create interactive graphical representations of data, enhancing data insights and user experience.",
        "Enhanced user experience by implementing lazy loading to minimize the initial bundle size and improve route-based module loading.",
        "Used SonarQube to monitor and improve code quality, ensuring high maintainability and security compliance across the codebase.",
      ],
    },
    {
      name: "MySpot Redesign, Book Engine",
      client: "",
      description: "MySpot collects all parking related information with location. The parking managers use it as an admin portal. Data for parking locations can be accessed by parking vendors.",
      technologies: "Angular 10, TypeScript, HTML, SCSS, MySQL, Java",
      developmentTools: "Visual studio code, Git, Postman",
      teamSize: "11",
      responsibilities: [
        "Collaborate with designers and other stakeholders to understand the requirements and objectives for the redesign project.",
        "Worked on creation of angular components and angular tasks.",
        "Conduct a thorough analysis of the existing application and its user interface to identify areas for improvement and optimization.",
        "Integrated Google Calendar API/library to enable calendar functionalities within the application.",
        "Improved API handling by using Angular resolvers to load data in advance of component rendering.",
        "Design and implement new user interface designs that are visually appealing, intuitive, and optimized for user engagement and satisfaction.",
      ],
    },
  ],
  education: [
    {
      institution: "DBNCOET (Amravati University)",
      degree: "B.E. (Information Technology)",
      location: "Amravati, Maharashtra",
      startYear: "2011",
      endYear: "2016",
      gpa: "",
      honors: "",
    },
  ],
  awards: [
    {
      title: "Secured first Rank at college level Web Page Design Competition",
      year: "2016",
    },
    {
      title: "Third prize in Hackathon (TECHNOFEST) in college",
      year: "2015",
    },
  ],
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