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
  family: "Times-Roman",
  src: "https://cdn.jsdelivr.net/npm/@canvas-fonts/times-new-roman@1.0.4/Times%20New%20Roman.ttf",
});

Font.register({
  family: "Times-Bold",
  src: "https://cdn.jsdelivr.net/npm/@canvas-fonts/times-new-roman-bold@1.0.4/Times%20New%20Roman%20Bold.ttf",
});

Font.register({
  family: "Times-Italic",
  src: "https://cdn.jsdelivr.net/npm/@canvas-fonts/times-new-roman-italic@1.0.4/Times%20New%20Roman%20Italic.ttf",
});

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 10,
    fontFamily: "Times-Roman",
    lineHeight: 1.4,
  },
  header: {
    textAlign: "center",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: "#1e3a5f",
  },
  name: {
    fontSize: 22,
    fontFamily: "Times-Bold",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 6,
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    fontSize: 9,
    gap: 4,
  },
  contactItem: {
    marginHorizontal: 4,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Times-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#cccccc",
    paddingBottom: 2,
    marginBottom: 6,
  },
  paragraph: {
    textAlign: "justify",
  },
  skillRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  skillCategory: {
    fontFamily: "Times-Bold",
  },
  experienceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  companyName: {
    fontFamily: "Times-Bold",
  },
  dateRange: {
    fontSize: 9,
  },
  jobTitle: {
    fontFamily: "Times-Italic",
    marginBottom: 4,
  },
  bulletList: {
    marginLeft: 12,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 2,
  },
  bullet: {
    width: 10,
  },
  bulletText: {
    flex: 1,
  },
  projectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  projectName: {
    fontFamily: "Times-Bold",
  },
  technologies: {
    fontSize: 9,
    fontFamily: "Times-Italic",
  },
  educationEntry: {
    marginBottom: 6,
  },
  educationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  institution: {
    fontFamily: "Times-Bold",
  },
  degree: {
    fontFamily: "Times-Italic",
  },
  honors: {
    fontSize: 9,
    color: "#666666",
  },
  awardEntry: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  awardTitle: {
    fontFamily: "Times-Bold",
  },
  awardIssuer: {
    color: "#666666",
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{header.fullName}</Text>
          <View style={styles.contactRow}>
            {header.email && <Text style={styles.contactItem}>{header.email}</Text>}
            {header.phone && <Text style={styles.contactItem}>• {header.phone}</Text>}
            {header.location && <Text style={styles.contactItem}>• {header.location}</Text>}
          </View>
          <View style={styles.contactRow}>
            {header.linkedin && <Text style={styles.contactItem}>LinkedIn</Text>}
            {header.github && <Text style={styles.contactItem}>GitHub</Text>}
            {header.portfolio && <Text style={styles.contactItem}>Portfolio</Text>}
          </View>
        </View>

        {/* Professional Summary */}
        {expertise.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={styles.paragraph}>{expertise.summary}</Text>
          </View>
        )}

        {/* Skills */}
        {skills.some(s => s.category && s.skills) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Technical Skills</Text>
            {skills.filter(s => s.category && s.skills).map((skill, index) => (
              <View key={index} style={styles.skillRow}>
                <Text style={styles.skillCategory}>{skill.category}: </Text>
                <Text>{skill.skills}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Experience */}
        {experiences.length > 0 && experiences.some(e => e.company) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Experience</Text>
            {experiences.filter(e => e.company).map((exp, index) => (
              <View key={index} style={{ marginBottom: 8 }}>
                <View style={styles.experienceHeader}>
                  <Text>
                    <Text style={styles.companyName}>{exp.company}</Text>
                    {exp.location && <Text> — {exp.location}</Text>}
                  </Text>
                  <Text style={styles.dateRange}>{exp.startDate} – {exp.endDate}</Text>
                </View>
                <Text style={styles.jobTitle}>{exp.title}</Text>
                <View style={styles.bulletList}>
                  {exp.responsibilities?.filter(r => r).map((resp, rIndex) => (
                    <View key={rIndex} style={styles.bulletItem}>
                      <Text style={styles.bullet}>•</Text>
                      <Text style={styles.bulletText}>{resp}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {projects.length > 0 && projects.some(p => p.name) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {projects.filter(p => p.name).map((project, index) => (
              <View key={index} style={{ marginBottom: 6 }}>
                <View style={styles.projectHeader}>
                  <Text style={styles.projectName}>{project.name}</Text>
                  {project.technologies && (
                    <Text style={styles.technologies}>{project.technologies}</Text>
                  )}
                </View>
                <Text style={styles.paragraph}>{project.description}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {education.some(e => e.institution) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {education.filter(e => e.institution).map((edu, index) => (
              <View key={index} style={styles.educationEntry}>
                <View style={styles.educationHeader}>
                  <Text style={styles.institution}>{edu.institution}</Text>
                  <Text style={styles.dateRange}>{edu.graduationDate}</Text>
                </View>
                <View style={styles.educationHeader}>
                  <Text style={styles.degree}>{edu.degree}</Text>
                  {edu.gpa && <Text style={styles.dateRange}>GPA: {edu.gpa}</Text>}
                </View>
                {edu.honors && <Text style={styles.honors}>{edu.honors}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Awards */}
        {awards.length > 0 && awards.some(a => a.title) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Awards & Certifications</Text>
            {awards.filter(a => a.title).map((award, index) => (
              <View key={index} style={styles.awardEntry}>
                <Text>
                  <Text style={styles.awardTitle}>{award.title}</Text>
                  <Text style={styles.awardIssuer}> — {award.issuer}</Text>
                </Text>
                <Text style={styles.dateRange}>{award.date}</Text>
              </View>
            ))}
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
