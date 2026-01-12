import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  Font,
  Link,
  Image,
  pdf
} from "@react-pdf/renderer";
import { ResumeData } from "@/types/resume";
import { 
  getCachedLogoDataUrl, 
  getCachedLinkedinIconDataUrl, 
  getCachedGithubIconDataUrl, 
  getCachedGlobeIconDataUrl 
} from "@/temp-ui/utils/pdfUtils";

// These will be set before rendering
let logoDataUrl: string | null = null;
let linkedinIconUrl: string | null = null;
let githubIconUrl: string | null = null;
let globeIconUrl: string | null = null;

// Register fonts
Font.register({
  family: "Helvetica",
  fonts: [
    { src: "https://cdn.jsdelivr.net/npm/@canvas-fonts/arial@1.0.4/Arial.ttf" },
    { src: "https://cdn.jsdelivr.net/npm/@canvas-fonts/arial-bold@1.0.4/Arial%20Bold.ttf", fontWeight: "bold" },
    { src: "https://cdn.jsdelivr.net/npm/@canvas-fonts/arial-italic@1.0.4/Arial%20Italic.ttf", fontStyle: "italic" },
  ],
});

// Convert hex to RGB for React-PDF compatibility
const greenColor = "#2E9E5E"; // rgb(46, 158, 94)
const grayColor = "#4A4A4A"; // rgb(74, 74, 74)
const grayLightColor = "#666666"; // rgb(102, 102, 102)

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 48,
    paddingVertical: 32,
    fontSize: 11,
    fontFamily: "Helvetica",
    lineHeight: 1.6,
    color: grayColor,
  },
  logoContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  logoImage: {
    height: 20,
    width: 140, // Maintain aspect ratio (1399/200 * 20 ≈ 140)
  },
  logoText: {
    fontSize: 11,
    fontWeight: "bold",
    color: greenColor,
    letterSpacing: 1,
  },
  header: {
    marginBottom: 16,
  },
  name: {
    fontSize: 28, // Reduced from 33.6
    fontWeight: "normal",
    color: grayColor,
    marginBottom: 16, // Increased from 8
    letterSpacing: 0.5,
  },
  designation: {
    fontSize: 16.8, // text-lg equivalent (14px * 1.2)
    color: greenColor,
    marginBottom: 12,
  },
  socialLinks: {
    flexDirection: "row",
    marginBottom: 12,
  },
  socialLink: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    textDecoration: "none",
  },
  socialText: {
    fontSize: 9.6,
    color: grayColor,
    marginLeft: 4,
  },
  socialIcon: {
    width: 12,
    height: 12,
    marginRight: 4,
    fontSize: 12,
    color: greenColor,
    fontWeight: "bold",
  },
  greenBar: {
    height: 6, // h-1.5 equivalent
    backgroundColor: greenColor,
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13.2, // text-sm equivalent (11px * 1.2)
    fontWeight: "bold",
    color: greenColor,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  paragraph: {
    textAlign: "justify",
    marginBottom: 8,
    fontSize: 11,
    lineHeight: 1.6,
    color: grayColor,
  },
  bulletList: {
    marginLeft: 20,
    marginTop: 6,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 6,
  },
  bullet: {
    width: 8,
    fontSize: 11,
    marginRight: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 1.6,
    textAlign: "justify",
    color: grayColor,
  },
  skillRow: {
    fontSize: 11,
    lineHeight: 1.6,
    color: grayColor,
  },
  experienceEntry: {
    marginBottom: 12,
  },
  experienceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  companyInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  companyName: {
    fontWeight: "bold",
    fontSize: 11,
    color: grayColor,
  },
  location: {
    fontSize: 11,
    color: grayColor,
  },
  jobTitle: {
    fontStyle: "italic",
    color: "#666666",
    fontSize: 11,
  },
  dateRange: {
    fontSize: 9.6, // text-[10px] equivalent
    color: "#666666",
    marginTop: 2,
  },
  projectEntry: {
    marginBottom: 20,
  },
  projectName: {
    fontWeight: "bold",
    fontSize: 13.2, // text-[12px] equivalent
    marginBottom: 8,
    color: grayColor,
  },
  projectClient: {
    color: "#666666",
    fontSize: 11,
  },
  projectDetail: {
    fontSize: 9.6,
    marginBottom: 8,
    lineHeight: 1.4,
    color: grayColor,
  },
  projectDetailLabel: {
    fontWeight: "bold",
  },
  responsibilityTitle: {
    fontWeight: "bold",
    color: greenColor,
    fontSize: 9.6,
    marginTop: 8,
    marginBottom: 4,
  },
  educationEntry: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  institution: {
    fontWeight: "bold",
    fontSize: 11,
    color: grayColor,
  },
  degree: {
    fontSize: 11,
    color: grayColor,
  },
  educationYear: {
    fontSize: 9.6,
    color: grayColor,
  },
  awardItem: {
    flexDirection: "row",
    marginBottom: 4,
  },
  awardText: {
    fontSize: 11,
    color: grayColor,
  },
});

interface ResumePDFProps {
  data: ResumeData;
}

const ResumePDF = ({ data }: ResumePDFProps) => {
  const { header, expertise, skills, experiences, projects, education, awards } = data;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          {logoDataUrl ? (
            <Image src={logoDataUrl} style={styles.logoImage} />
          ) : (
            <Text style={styles.logoText}>INDEXNINE</Text>
          )}
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{header.fullName}</Text>
          {header.designation && (
            <Text style={styles.designation}>{header.designation}</Text>
          )}
          {/* Social Links */}
          {(header.linkedin || header.github || header.portfolio) && (
            <View style={styles.socialLinks}>
              {header.linkedin && (
                <Link src={header.linkedin} style={styles.socialLink}>
                  {linkedinIconUrl ? (
                    <Image src={linkedinIconUrl} style={styles.socialIcon} />
                  ) : (
                    <Text style={styles.socialIcon}>in</Text>
                  )}
                  <Text style={styles.socialText}>LinkedIn</Text>
                </Link>
              )}
              {header.github && (
                <Link src={header.github} style={styles.socialLink}>
                  {githubIconUrl ? (
                    <Image src={githubIconUrl} style={styles.socialIcon} />
                  ) : (
                    <Text style={styles.socialIcon}>⌘</Text>
                  )}
                  <Text style={styles.socialText}>GitHub</Text>
                </Link>
              )}
              {header.portfolio && (
                <Link src={header.portfolio} style={styles.socialLink}>
                  {globeIconUrl ? (
                    <Image src={globeIconUrl} style={styles.socialIcon} />
                  ) : (
                    <Text style={styles.socialIcon}>◉</Text>
                  )}
                  <Text style={styles.socialText}>Portfolio</Text>
                </Link>
              )}
            </View>
          )}
          <View style={styles.greenBar} />
        </View>

        {/* Expertise */}
        {(expertise.summary || expertise.bulletPoints?.some(bp => bp)) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EXPERTISE</Text>
            {expertise.summary && (
              <Text style={styles.paragraph}>{expertise.summary}</Text>
            )}
            {expertise.bulletPoints && expertise.bulletPoints.filter(bp => bp).length > 0 && (
              <View style={styles.bulletList}>
                {expertise.bulletPoints.filter(bp => bp).map((point, index) => (
                  <View key={index} style={styles.bulletItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bulletText}>{point}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Skills */}
        {skills.skills && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SKILLS</Text>
            <Text style={styles.skillRow}>{skills.skills}</Text>
          </View>
        )}

        {/* Experience */}
        {experiences.length > 0 && experiences.some(e => e.company) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EXPERIENCE</Text>
            {experiences.filter(e => e.company).map((exp, index) => (
              <View key={index} style={styles.experienceEntry}>
                <View style={styles.companyInfo}>
                  <Text style={styles.companyName}>{exp.company}</Text>
                  {exp.location && <Text style={styles.location}>, {exp.location}</Text>}
                  <Text style={styles.jobTitle}> - {exp.title}</Text>
                </View>
                <Text style={styles.dateRange}>{exp.startDate} - {exp.endDate || "Present"}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Project Experience */}
        {projects.length > 0 && projects.some(p => p.name) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PROJECT EXPERIENCE</Text>
            {projects.filter(p => p.name).map((project, index) => (
              <View key={index} style={styles.projectEntry}>
                <Text>
                  <Text style={styles.projectName}>{project.name}</Text>
                  {project.client && <Text style={styles.projectClient}> - {project.client}</Text>}
                </Text>
                
                <Text style={styles.projectDetail}>
                  <Text style={styles.projectDetailLabel}>Technology Stack: </Text>
                  {project.technologies}
                </Text>
                
                {project.description && (
                  <Text style={styles.projectDetail}>
                    <Text style={styles.projectDetailLabel}>Description: </Text>
                    {project.description}
                  </Text>
                )}
                
                {project.developmentTools && (
                  <Text style={styles.projectDetail}>
                    <Text style={styles.projectDetailLabel}>Development Tools: </Text>
                    {project.developmentTools}
                  </Text>
                )}
                
                {project.teamSize && (
                  <Text style={styles.projectDetail}>
                    <Text style={styles.projectDetailLabel}>Team Size: </Text>
                    {project.teamSize}
                  </Text>
                )}
                
                {project.responsibilities && project.responsibilities.filter(r => r).length > 0 && (
                  <View>
                    <Text style={styles.responsibilityTitle}>Responsibility:</Text>
                    <View style={styles.bulletList}>
                      {project.responsibilities.filter(r => r).map((resp, rIndex) => (
                        <View key={rIndex} style={styles.bulletItem}>
                          <Text style={styles.bullet}>•</Text>
                          <Text style={styles.bulletText}>{resp}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {education.some(e => e.institution) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EDUCATION</Text>
            {education.filter(e => e.institution).map((edu, index) => (
              <View key={index} style={styles.educationEntry}>
                <Text>
                  <Text style={styles.institution}>{edu.institution}</Text>
                  <Text style={styles.degree}> - {edu.degree}</Text>
                </Text>
                <Text style={styles.educationYear}>
                  {edu.startYear} - {edu.endYear}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Awards */}
        {awards.length > 0 && awards.some(a => a.title) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AWARDS</Text>
            <View style={styles.bulletList}>
              {awards.filter(a => a.title).map((award, index) => (
                <View key={index} style={styles.awardItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.awardText}>
                    {award.title}
                    {award.year && ` (${award.year})`}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
};

export const generatePDF = async (data: ResumeData): Promise<Blob> => {
  // Pre-compute all image data URLs before rendering
  // This ensures icons and logo are ready when the PDF is generated
  const greenColor = '#2E9E5E';
  
  // Reset to null first
  logoDataUrl = null;
  linkedinIconUrl = null;
  githubIconUrl = null;
  globeIconUrl = null;
  
  try {
    const results = await Promise.allSettled([
      getCachedLogoDataUrl(),
      getCachedLinkedinIconDataUrl(greenColor),
      getCachedGithubIconDataUrl(greenColor),
      getCachedGlobeIconDataUrl(greenColor),
    ]);
    
    // Extract successful results
    if (results[0].status === 'fulfilled') logoDataUrl = results[0].value;
    if (results[1].status === 'fulfilled') linkedinIconUrl = results[1].value;
    if (results[2].status === 'fulfilled') githubIconUrl = results[2].value;
    if (results[3].status === 'fulfilled') globeIconUrl = results[3].value;
    
    // Log any failures for debugging
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const names = ['logo', 'linkedin', 'github', 'globe'];
        console.warn(`Failed to generate ${names[index]} icon:`, result.reason);
      }
    });
  } catch (error) {
    console.error('Error generating image data URLs:', error);
    // Continue with null values - components will handle fallback
  }
  
  const blob = await pdf(<ResumePDF data={data} />).toBlob();
  return blob;
};

export default ResumePDF;
