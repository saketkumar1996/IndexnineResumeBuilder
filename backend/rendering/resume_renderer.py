from jinja2 import Environment, FileSystemLoader, select_autoescape
from docx import Document
from docx.shared import Inches, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.style import WD_STYLE_TYPE
from models.resume_models import ResumeModel
import os


class ResumeRenderer:
    """
    Resume rendering engine that generates both HTML previews and DOCX exports
    using identical data structures and formatting to ensure consistency.
    """
    
    def __init__(self, template_path: str):
        """Initialize renderer with template path"""
        self.template_path = template_path
        
        # Set up Jinja2 environment
        self.jinja_env = Environment(
            loader=FileSystemLoader(template_path),
            autoescape=select_autoescape(['html', 'xml'])
        )
        
        # Load HTML template
        try:
            self.html_template = self.jinja_env.get_template('resume.html')
        except Exception as e:
            raise RuntimeError(f"Failed to load resume.html template: {e}")
    
    def render_partial_html(self, resume_data: dict) -> str:
        """
        Generate HTML preview with partial/incomplete data
        
        Shows what data is available and placeholders for missing data.
        This allows users to see preview even while filling out the form.
        
        Args:
            resume_data: Raw dictionary data (may be incomplete)
            
        Returns:
            HTML string for partial preview display
        """
        try:
            # Create a safe version of the data with defaults
            safe_data = {
                'header': resume_data.get('header', {}),
                'expertise': resume_data.get('expertise', {}),
                'skills': resume_data.get('skills', {}),
                'experience': resume_data.get('experience', []),
                'projects': resume_data.get('projects', []),
                'education': resume_data.get('education', []),
                'awards': resume_data.get('awards', [])
            }
            
            # Use a partial template that handles missing data gracefully
            partial_template = self.jinja_env.get_template('resume_partial.html')
            html_content = partial_template.render(resume=safe_data)
            
            return html_content
            
        except Exception as e:
            # Fallback to basic HTML structure
            return f"""
            <div style="padding: 20px; font-family: Arial, sans-serif;">
                <h3 style="color: #f57c00;">Preview Loading...</h3>
                <p>Fill out the form to see your resume preview.</p>
                <div style="margin-top: 20px; padding: 10px; background: #fff3e0; border-radius: 4px;">
                    <strong>Available data:</strong>
                    <pre style="font-size: 12px; margin-top: 8px;">{str(resume_data)[:200]}...</pre>
                </div>
            </div>
            """
        """
        Generate HTML preview matching DOCX layout
        
        Uses Jinja2 templates with company-approved styling that mirrors
        the DOCX output formatting exactly.
        
        Args:
            resume_data: Validated ResumeModel instance
            
        Returns:
            HTML string for preview display
        """
        try:
            # Convert Pydantic model to dict for template rendering
            resume_dict = resume_data.model_dump()
            
            # Render HTML using template
            html_content = self.html_template.render(resume=resume_dict)
            
            return html_content
            
        except Exception as e:
            raise RuntimeError(f"Failed to render HTML template: {e}")
    
    def generate_docx(self, resume_data: ResumeModel) -> Document:
        """
        Generate DOCX using identical structure to HTML
        
        Creates a python-docx Document with company template styles,
        fonts, and formatting that matches the HTML preview exactly.
        
        Args:
            resume_data: Validated ResumeModel instance
            
        Returns:
            python-docx Document object
        """
        try:
            # Create new document
            doc = Document()
            
            # Apply company template styles
            self._apply_company_template_styles(doc)
            
            # Add resume sections in fixed order
            self._add_header_section(doc, resume_data.header)
            self._add_expertise_section(doc, resume_data.expertise)
            self._add_skills_section(doc, resume_data.skills)
            self._add_experience_section(doc, resume_data.experience)
            self._add_projects_section(doc, resume_data.projects)
            self._add_education_section(doc, resume_data.education)
            
            # Add awards section if present (optional)
            if resume_data.awards:
                self._add_awards_section(doc, resume_data.awards)
            
            return doc
            
        except Exception as e:
            raise RuntimeError(f"Failed to generate DOCX document: {e}")
    
    def _apply_company_template_styles(self, doc: Document):
        """Apply company-approved document styles"""
        # Set document margins (0.5 inch all around)
        sections = doc.sections
        for section in sections:
            section.top_margin = Inches(0.5)
            section.bottom_margin = Inches(0.5)
            section.left_margin = Inches(0.5)
            section.right_margin = Inches(0.5)
        
        # Configure default font
        style = doc.styles['Normal']
        font = style.font
        font.name = 'Times New Roman'
        font.size = Pt(11)
    
    def _add_header_section(self, doc: Document, header_data):
        """Add header section with contact information"""
        # Name (centered, larger font)
        name_para = doc.add_paragraph()
        name_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        name_run = name_para.add_run(header_data.name)
        name_run.font.size = Pt(14)
        name_run.font.bold = True
        
        # Title (centered)
        title_para = doc.add_paragraph()
        title_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        title_run = title_para.add_run(header_data.title)
        title_run.font.size = Pt(11)
        
        # Contact info (centered, smaller font)
        contact_para = doc.add_paragraph()
        contact_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        contact_text = f"{header_data.email} | {header_data.phone} | {header_data.location}"
        contact_run = contact_para.add_run(contact_text)
        contact_run.font.size = Pt(10)
        
        # Add spacing after header
        doc.add_paragraph()
    
    def _add_section_header(self, doc: Document, title: str):
        """Add section header with consistent formatting"""
        header_para = doc.add_paragraph()
        header_run = header_para.add_run(title.upper())
        header_run.font.bold = True
        header_run.font.size = Pt(11)
        
        # Add underline or spacing as needed
        doc.add_paragraph()
    
    def _add_expertise_section(self, doc: Document, expertise_data):
        """Add expertise summary section"""
        self._add_section_header(doc, "EXPERTISE SUMMARY")
        
        summary_para = doc.add_paragraph()
        summary_para.add_run(expertise_data.summary)
        
        doc.add_paragraph()  # Spacing
    
    def _add_skills_section(self, doc: Document, skills_data):
        """Add skills section"""
        self._add_section_header(doc, "SKILLS")
        
        skills_para = doc.add_paragraph()
        skills_para.add_run(skills_data.skills)
        
        doc.add_paragraph()  # Spacing
    
    def _add_experience_section(self, doc: Document, experience_list):
        """Add work experience section"""
        self._add_section_header(doc, "EXPERIENCE")
        
        for exp in experience_list:
            # Company and position
            exp_header = doc.add_paragraph()
            company_run = exp_header.add_run(f"{exp.company} - {exp.position}")
            company_run.font.bold = True
            
            # Dates
            date_text = f"{exp.start_date} - {exp.end_date or 'Present'}"
            date_para = doc.add_paragraph()
            date_run = date_para.add_run(date_text)
            date_run.font.italic = True
            
            # Responsibilities (bullet points)
            for responsibility in exp.responsibilities:
                bullet_para = doc.add_paragraph()
                bullet_para.style = 'List Bullet'
                bullet_para.add_run(responsibility)
            
            doc.add_paragraph()  # Spacing between experiences
    
    def _add_projects_section(self, doc: Document, projects_list):
        """Add project experience section"""
        self._add_section_header(doc, "PROJECT EXPERIENCE")
        
        for project in projects_list:
            # Project name
            proj_header = doc.add_paragraph()
            proj_run = proj_header.add_run(project.name)
            proj_run.font.bold = True
            
            # Dates
            date_text = f"{project.start_date} - {project.end_date or 'Present'}"
            date_para = doc.add_paragraph()
            date_run = date_para.add_run(date_text)
            date_run.font.italic = True
            
            # Description
            desc_para = doc.add_paragraph()
            desc_para.add_run(project.description)
            
            # Technologies
            tech_para = doc.add_paragraph()
            tech_run = tech_para.add_run(f"Technologies: {project.technologies}")
            tech_run.font.italic = True
            
            doc.add_paragraph()  # Spacing
    
    def _add_education_section(self, doc: Document, education_list):
        """Add education section"""
        self._add_section_header(doc, "EDUCATION")
        
        for edu in education_list:
            # Institution and degree
            edu_header = doc.add_paragraph()
            edu_text = f"{edu.institution} - {edu.degree} in {edu.field_of_study}"
            edu_run = edu_header.add_run(edu_text)
            edu_run.font.bold = True
            
            # Graduation date and GPA
            details_para = doc.add_paragraph()
            details_text = f"Graduated: {edu.graduation_date}"
            if edu.gpa:
                details_text += f" | GPA: {edu.gpa}"
            details_para.add_run(details_text)
            
            doc.add_paragraph()  # Spacing
    
    def _add_awards_section(self, doc: Document, awards_list):
        """Add awards section (optional)"""
        self._add_section_header(doc, "AWARDS")
        
        for award in awards_list:
            # Award title and organization
            award_header = doc.add_paragraph()
            award_text = f"{award.title} - {award.organization}"
            award_run = award_header.add_run(award_text)
            award_run.font.bold = True
            
            # Date
            date_para = doc.add_paragraph()
            date_para.add_run(award.date)
            
            # Description if present
            if award.description:
                desc_para = doc.add_paragraph()
                desc_para.add_run(award.description)
            
            doc.add_paragraph()  # Spacing