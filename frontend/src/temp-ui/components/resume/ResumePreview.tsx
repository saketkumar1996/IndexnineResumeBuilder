import { ResumeData } from "@/types/resume";

interface ResumePreviewProps {
  data: ResumeData;
  scale?: number;
}

export const ResumePreview = ({ data, scale = 0.75 }: ResumePreviewProps) => {
  const { header, expertise, skills, experiences, projects, education, awards = [] } = data;

  const hasContent = header.fullName || expertise.summary || skills.some(s => s.category);

  return (
    <div 
      className="bg-resume-paper resume-shadow rounded-sm origin-top"
      style={{
        width: `${8.5 * 96}px`,
        minHeight: `${11 * 96}px`,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        fontFamily: "'Times New Roman', Georgia, serif",
      }}
    >
      {!hasContent ? (
        <div className="flex items-center justify-center h-full min-h-[600px] text-muted-foreground">
          <p className="text-center">
            Start filling out the form to see your resume preview
          </p>
        </div>
      ) : (
        <div className="p-12 text-[11px] leading-relaxed text-foreground">
          {/* Header */}
          {header.fullName && (
            <div className="text-center mb-4 pb-3 border-b-2 border-section-divider">
              <h1 className="text-2xl font-bold tracking-wide uppercase mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                {header.fullName}
              </h1>
              <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[10px]">
                {header.email && <span>{header.email}</span>}
                {header.phone && <span>• {header.phone}</span>}
                {header.location && <span>• {header.location}</span>}
              </div>
              <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[10px] mt-1">
                {header.linkedin && (
                  <span className="text-primary">LinkedIn</span>
                )}
                {header.github && (
                  <span className="text-primary">GitHub</span>
                )}
                {header.portfolio && (
                  <span className="text-primary">Portfolio</span>
                )}
              </div>
            </div>
          )}

          {/* Professional Summary */}
          {expertise.summary && (
            <section className="mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider border-b border-border pb-1 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                Professional Summary
              </h2>
              <p className="text-justify">{expertise.summary}</p>
            </section>
          )}

          {/* Skills */}
          {skills.some(s => s.category && s.skills) && (
            <section className="mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider border-b border-border pb-1 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                Technical Skills
              </h2>
              <div className="space-y-1">
                {skills.filter(s => s.category && s.skills).map((skill, index) => (
                  <div key={index}>
                    <span className="font-semibold">{skill.category}:</span> {skill.skills}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Experience */}
          {experiences.length > 0 && experiences.some(e => e.company) && (
            <section className="mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider border-b border-border pb-1 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                Professional Experience
              </h2>
              <div className="space-y-3">
                {experiences.filter(e => e.company).map((exp, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-baseline">
                      <div>
                        <span className="font-bold">{exp.company}</span>
                        {exp.location && <span className="text-muted-foreground"> — {exp.location}</span>}
                      </div>
                      <span className="text-[10px]">
                        {exp.startDate} – {exp.endDate}
                      </span>
                    </div>
                    <div className="italic mb-1">{exp.title}</div>
                    {exp.responsibilities?.length > 0 && (
                      <ul className="list-disc list-outside ml-4 space-y-0.5">
                        {exp.responsibilities.filter(r => r).map((resp, rIndex) => (
                          <li key={rIndex}>{resp}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          {projects.length > 0 && projects.some(p => p.name) && (
            <section className="mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider border-b border-border pb-1 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                Projects
              </h2>
              <div className="space-y-2">
                {projects.filter(p => p.name).map((project, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold">{project.name}</span>
                      {project.technologies && (
                        <span className="text-[10px] italic">{project.technologies}</span>
                      )}
                    </div>
                    <p className="text-justify">{project.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Education */}
          {education.some(e => e.institution) && (
            <section className="mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider border-b border-border pb-1 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                Education
              </h2>
              <div className="space-y-2">
                {education.filter(e => e.institution).map((edu, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold">{edu.institution}</span>
                      <span className="text-[10px]">{edu.graduationDate}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="italic">{edu.degree}</span>
                      {edu.gpa && <span className="text-[10px]">GPA: {edu.gpa}</span>}
                    </div>
                    {edu.honors && (
                      <div className="text-[10px] text-muted-foreground">{edu.honors}</div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Awards */}
          {awards.length > 0 && awards.some(a => a.title) && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider border-b border-border pb-1 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                Awards & Certifications
              </h2>
              <div className="space-y-1">
                {awards.filter(a => a.title).map((award, index) => (
                  <div key={index} className="flex justify-between items-baseline">
                    <div>
                      <span className="font-bold">{award.title}</span>
                      <span className="text-muted-foreground"> — {award.issuer}</span>
                      {award.description && (
                        <span className="text-[10px] block ml-2">{award.description}</span>
                      )}
                    </div>
                    <span className="text-[10px]">{award.date}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
