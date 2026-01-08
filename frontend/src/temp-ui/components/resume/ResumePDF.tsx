import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  Font,
  pdf
} from "@react-pdf/renderer";
import { ResumeData } from "@/types/resume";

// Register fonts
Font.register({
  family: "Helvetica",
  fonts: [
    { src: "https://cdn.jsdelivr.net/npm/@canvas-fonts/arial@1.0.4/Arial.ttf" },
    { src: "https://cdn.jsdelivr.net/npm/@canvas-fonts/arial-bold@1.0.4/Arial%20Bold.ttf", fontWeight: "bold" },
    { src: "https://cdn.jsdelivr.net/npm/@canvas-fonts/arial-italic@1.0.4/Arial%20Italic.ttf", fontStyle: "italic" },
  ],
});

const greenColor = "#2E9E5E";
const grayColor = "#4A4A4A";

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 48,
    paddingVertical: 32,
    fontSize: 10,
    fontFamily: "Helvetica",
    lineHeight: 1.4,
    color: grayColor,
  },
  logoContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  logoText: {
    fontSize: 11,
    fontWeight: "bold",
    color: greenColor,
    letterSpacing: 1,
  },
  header: {
    marginBottom: 12,
  },
  name: {
    fontSize: 28,
    fontWeight: "normal",
    color: grayColor,
    marginBottom: 4,
    letterSpacing: 1,
  },
  designation: {
    fontSize: 14,
    color: greenColor,
    marginBottom: 10,
  },
  greenBar: {
    height: 5,
    backgroundColor: greenColor,
    marginBottom: 16,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: greenColor,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  paragraph: {
    textAlign: "justify",
    marginBottom: 6,
    fontSize: 10,
    lineHeight: 1.5,
  },
  bulletList: {
    marginLeft: 12,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 4,
  },
  bullet: {
    width: 10,
    fontSize: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.5,
  },
  skillRow: {
    marginBottom: 3,
    fontSize: 10,
    lineHeight: 1.5,
  },
  skillCategory: {
    fontWeight: "bold",
  },
  experienceEntry: {
    marginBottom: 8,
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
    fontSize: 10,
  },
  location: {
    fontSize: 10,
  },
  jobTitle: {
    fontStyle: "italic",
    color: "#666666",
    fontSize: 10,
  },
  dateRange: {
    fontSize: 9,
    color: "#666666",
  },
  projectEntry: {
    marginBottom: 12,
  },
  projectName: {
    fontWeight: "bold",
    fontSize: 11,
    marginBottom: 4,
  },
  projectClient: {
    color: "#666666",
    fontSize: 10,
  },
  projectDetail: {
    fontSize: 9,
    marginBottom: 3,
    lineHeight: 1.4,
  },
  projectDetailLabel: {
    fontWeight: "bold",
  },
  responsibilityTitle: {
    fontWeight: "bold",
    color: greenColor,
    fontSize: 9,
    marginTop: 4,
    marginBottom: 4,
  },
  educationEntry: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  institution: {
    fontWeight: "bold",
    fontSize: 10,
  },
  degree: {
    fontSize: 10,
  },
  awardItem: {
    flexDirection: "row",
    marginBottom: 3,
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
          <Text style={styles.logoText}>⊞ INDEXNINE</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{header.fullName}</Text>
          {header.designation && (
            <Text style={styles.designation}>{header.designation}</Text>
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
                <Text style={styles.dateRange}>
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
                  <Text style={styles.bulletText}>
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
  const blob = await pdf(<ResumePDF data={data} />).toBlob();
  return blob;
};

export default ResumePDF;
