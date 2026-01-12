import { ResumeData } from "@/types/resume";
import { Linkedin, Github, Globe } from "lucide-react";
import logoImage from "@/Black Logo.svg";

interface ResumePreviewProps {
  data: ResumeData;
  scale?: number;
}

export const ResumePreview = ({ data, scale = 0.75 }: ResumePreviewProps) => {
  const { header, expertise, skills, experiences, projects, education, awards } = data;

  const hasContent = header.fullName || expertise.summary || skills.skills;

  // Green color matching the PDF: #2E9E5E (a professional green)
  const greenColor = "#2E9E5E";
  const grayColor = "#4A4A4A";

  return (
    <div 
      className="bg-white shadow-lg origin-top"
      style={{
        width: `${8.5 * 96}px`,
        minHeight: `${11 * 96}px`,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      {!hasContent ? (
        <div className="flex items-center justify-center h-full min-h-[600px] text-gray-400">
          <p className="text-center">
            Start filling out the form to see your resume preview
          </p>
        </div>
      ) : (
        <div className="px-12 py-8 text-[11px] leading-relaxed" style={{ color: grayColor }}>
          {/* Logo in top-right */}
          <div className="flex justify-end mb-2">
            <img 
              src={logoImage} 
              alt="Indexnine Logo" 
              className="h-5"
              style={{ maxHeight: '20px' }}
            />
          </div>

          {/* Header */}
          {header.fullName && (
            <div className="mb-4">
              <h1 className="text-3xl font-light tracking-wide mb-4" style={{ color: grayColor }}>
                {header.fullName}
              </h1>
              {header.designation && (
                <p className="text-lg mb-2" style={{ color: greenColor }}>
                  {header.designation}
                </p>
              )}
              {/* Social Links */}
              {(header.linkedin || header.github || header.portfolio) && (
                <div className="flex items-center gap-4 mb-3">
                  {header.linkedin && (
                    <a
                      href={header.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] hover:underline"
                      style={{ color: grayColor }}
                    >
                      <Linkedin size={12} style={{ color: greenColor }} />
                      <span>LinkedIn</span>
                    </a>
                  )}
                  {header.github && (
                    <a
                      href={header.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] hover:underline"
                      style={{ color: grayColor }}
                    >
                      <Github size={12} style={{ color: greenColor }} />
                      <span>GitHub</span>
                    </a>
                  )}
                  {header.portfolio && (
                    <a
                      href={header.portfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] hover:underline"
                      style={{ color: grayColor }}
                    >
                      <Globe size={12} style={{ color: greenColor }} />
                      <span>Portfolio</span>
                    </a>
                  )}
                </div>
              )}
              {/* Green bar separator */}
              <div className="h-1.5 w-full mb-4" style={{ backgroundColor: greenColor }}></div>
            </div>
          )}

          {/* Expertise Section */}
          {(expertise.summary || expertise.bulletPoints?.some(bp => bp)) && (
            <section className="mb-5">
              <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: greenColor }}>
                EXPERTISE
              </h2>
              {expertise.summary && (
                <p className="text-justify mb-2 text-[11px] leading-relaxed">{expertise.summary}</p>
              )}
              {expertise.bulletPoints && expertise.bulletPoints.filter(bp => bp).length > 0 && (
                <ul className="list-disc list-outside ml-5 space-y-1.5">
                  {expertise.bulletPoints.filter(bp => bp).map((point, index) => (
                    <li key={index} className="text-[11px] leading-relaxed text-justify">{point}</li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* Skills Section */}
          {skills.skills && (
            <section className="mb-5">
              <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: greenColor }}>
                SKILLS
              </h2>
              <p className="text-[11px] leading-relaxed">{skills.skills}</p>
            </section>
          )}

          {/* Experience Section */}
          {experiences.length > 0 && experiences.some(e => e.company) && (
            <section className="mb-5">
              <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: greenColor }}>
                EXPERIENCE
              </h2>
              <div className="space-y-3">
                {experiences.filter(e => e.company).map((exp, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-start mb-0.5">
                      <div>
                        <span className="font-bold text-[11px]">{exp.company}</span>
                        {exp.location && <span>, {exp.location}</span>}
                        <span className="italic text-gray-500"> - {exp.title}</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {exp.startDate} - {exp.endDate || "Present"}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Project Experience Section */}
          {projects.length > 0 && projects.some(p => p.name) && (
            <section className="mb-5">
              <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: greenColor }}>
                PROJECT EXPERIENCE
              </h2>
              <div className="space-y-5">
                {projects.filter(p => p.name).map((project, index) => (
                  <div key={index}>
                    <div className="mb-2">
                      <span className="font-bold text-[12px]">{project.name}</span>
                      {project.client && <span className="text-gray-500"> - {project.client}</span>}
                    </div>
                    
                    <div className="mb-2 text-[10px]">
                      <span className="font-bold">Technology Stack:</span> {project.technologies}
                    </div>
                    
                    {project.description && (
                      <div className="mb-2 text-[10px]">
                        <span className="font-bold">Description:</span> {project.description}
                      </div>
                    )}
                    
                    {project.developmentTools && (
                      <div className="mb-2 text-[10px]">
                        <span className="font-bold">Development Tools:</span> {project.developmentTools}
                      </div>
                    )}
                    
                    {project.teamSize && (
                      <div className="mb-2 text-[10px]">
                        <span className="font-bold">Team Size:</span> {project.teamSize}
                      </div>
                    )}
                    
                    {project.responsibilities && project.responsibilities.filter(r => r).length > 0 && (
                      <div className="mt-2">
                        <p className="font-bold text-[10px] mb-1" style={{ color: greenColor }}>Responsibility:</p>
                        <ul className="list-disc list-outside ml-5 space-y-1">
                          {project.responsibilities.filter(r => r).map((resp, rIndex) => (
                            <li key={rIndex} className="text-[10px] leading-relaxed">{resp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Education Section */}
          {education.some(e => e.institution) && (
            <section className="mb-5">
              <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: greenColor }}>
                EDUCATION
              </h2>
              <div className="space-y-2">
                {education.filter(e => e.institution).map((edu, index) => (
                  <div key={index} className="flex justify-between items-baseline">
                    <div>
                      <span className="font-bold">{edu.institution}</span>
                      <span> - {edu.degree}</span>
                    </div>
                    <span className="text-[10px]">
                      {edu.startYear} - {edu.endYear}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Awards Section */}
          {awards.length > 0 && awards.some(a => a.title) && (
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: greenColor }}>
                AWARDS
              </h2>
              <ul className="list-disc list-outside ml-5 space-y-1">
                {awards.filter(a => a.title).map((award, index) => (
                  <li key={index} className="text-[11px]">
                    {award.title}
                    {award.year && <span> ({award.year})</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
