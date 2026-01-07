"""
Resume rendering module for HTML and PDF generation
Handles template rendering and document creation with consistent output
"""

from jinja2 import Environment, FileSystemLoader
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, KeepTogether
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from models.resume_models import ResumeModel
from typing import Dict, Any
import os
import io


class ResumeRenderer:
    """Handles HTML and DOCX rendering for resume data"""
    
    def __init__(self, template_path: str = "templates"):
        """Initialize renderer with template path"""
        self.template_path = template_path
        self.jinja_env = Environment(loader=FileSystemLoader(template_path))
    
    def render_html(self, resume_data: ResumeModel) -> str:
        """Render resume data to HTML using Jinja2 template"""
        try:
            template = self.jinja_env.get_template("resume.html")
            return template.render(resume=resume_data)
        except Exception as e:
            # Fallback to basic HTML structure
            return self._generate_basic_html(resume_data)
    
    def render_partial_html(self, partial_data: Dict[str, Any]) -> str:
        """Render partial resume data with placeholders for missing sections"""
        try:
            template = self.jinja_env.get_template("resume_partial.html")
            return template.render(data=partial_data)
        except Exception:
            # Fallback to basic partial HTML
            return self._generate_partial_html(partial_data)
    
    def generate_pdf(self, resume_data: ResumeModel) -> bytes:
        """Generate PDF document from resume data using ReportLab"""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, 
                              rightMargin=0.75*inch, leftMargin=0.75*inch,
                              topMargin=0.75*inch, bottomMargin=0.75*inch)
        
        # Get styles
        styles = getSampleStyleSheet()
        
        # Custom styles
        name_style = ParagraphStyle(
            'NameStyle',
            parent=styles['Heading1'],
            fontSize=18,
            alignment=TA_CENTER,
            spaceAfter=6
        )
        
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Normal'],
            fontSize=12,
            alignment=TA_CENTER,
            spaceAfter=4
        )
        
        contact_style = ParagraphStyle(
            'ContactStyle',
            parent=styles['Normal'],
            fontSize=10,
            alignment=TA_CENTER,
            spaceAfter=12
        )
        
        section_header_style = ParagraphStyle(
            'SectionHeaderStyle',
            parent=styles['Heading2'],
            fontSize=12,
            fontName='Helvetica-Bold',
            spaceAfter=6,
            spaceBefore=12,
            textTransform='uppercase'
        )
        
        body_style = ParagraphStyle(
            'BodyStyle',
            parent=styles['Normal'],
            fontSize=11,
            spaceAfter=6
        )
        
        item_header_style = ParagraphStyle(
            'ItemHeaderStyle',
            parent=styles['Normal'],
            fontSize=11,
            fontName='Helvetica-Bold',
            spaceAfter=2
        )
        
        date_style = ParagraphStyle(
            'DateStyle',
            parent=styles['Normal'],
            fontSize=10,
            fontName='Helvetica-Oblique',
            spaceAfter=4
        )
        
        # Build story
        story = []
        
        # Header section
        story.append(Paragraph(resume_data.header.name, name_style))
        story.append(Paragraph(resume_data.header.title, title_style))
        contact_info = f"{resume_data.header.email} | {resume_data.header.phone} | {resume_data.header.location}"
        story.append(Paragraph(contact_info, contact_style))
        
        # Add a line separator
        story.append(Spacer(1, 6))
        
        # Expertise section
        story.append(Paragraph("EXPERTISE", section_header_style))
        story.append(Paragraph(resume_data.expertise.summary, body_style))
        
        # Skills section
        story.append(Paragraph("SKILLS", section_header_style))
        story.append(Paragraph(resume_data.skills.skills, body_style))
        
        # Experience section
        story.append(Paragraph("EXPERIENCE", section_header_style))
        for exp in resume_data.experience:
            exp_content = []
            exp_content.append(Paragraph(f"{exp.company} - {exp.position}", item_header_style))
            exp_content.append(Paragraph(f"{exp.start_date} - {exp.end_date or 'Present'}", date_style))
            
            for responsibility in exp.responsibilities:
                exp_content.append(Paragraph(f"• {responsibility}", body_style))
            
            story.append(KeepTogether(exp_content))
            story.append(Spacer(1, 6))
        
        # Projects section
        story.append(Paragraph("PROJECT EXPERIENCE", section_header_style))
        for project in resume_data.projects:
            proj_content = []
            proj_content.append(Paragraph(project.name, item_header_style))
            proj_content.append(Paragraph(f"{project.start_date} - {project.end_date or 'Present'}", date_style))
            proj_content.append(Paragraph(project.description, body_style))
            proj_content.append(Paragraph(f"<b>Technologies:</b> {project.technologies}", body_style))
            
            story.append(KeepTogether(proj_content))
            story.append(Spacer(1, 6))
        
        # Education section
        story.append(Paragraph("EDUCATION", section_header_style))
        for edu in resume_data.education:
            edu_content = []
            edu_content.append(Paragraph(f"{edu.institution} - {edu.degree}", item_header_style))
            edu_content.append(Paragraph(edu.field_of_study, body_style))
            grad_info = f"Graduated: {edu.graduation_date}"
            if edu.gpa:
                grad_info += f" | GPA: {edu.gpa}"
            edu_content.append(Paragraph(grad_info, date_style))
            
            story.append(KeepTogether(edu_content))
            story.append(Spacer(1, 6))
        
        # Awards section (if any)
        if resume_data.awards:
            story.append(Paragraph("AWARDS", section_header_style))
            for award in resume_data.awards:
                award_content = []
                award_content.append(Paragraph(f"{award.title} - {award.organization}", item_header_style))
                award_content.append(Paragraph(award.date, date_style))
                if award.description:
                    award_content.append(Paragraph(award.description, body_style))
                
                story.append(KeepTogether(award_content))
                story.append(Spacer(1, 6))
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()
    
    def _generate_basic_html(self, resume_data: ResumeModel) -> str:
        """Generate basic HTML structure as fallback"""
        html = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Resume Preview</title>
            <style>
                body {{ font-family: 'Times New Roman', serif; margin: 0.5in; }}
                .header {{ text-align: center; margin-bottom: 20px; }}
                .name {{ font-size: 18px; font-weight: bold; }}
                .section-header {{ font-weight: bold; margin-top: 20px; margin-bottom: 10px; }}
            </style>
        </head>
        <body>
            <div class="header">
                <div class="name">{resume_data.header.name}</div>
                <div>{resume_data.header.title}</div>
                <div>{resume_data.header.email} | {resume_data.header.phone}</div>
                <div>{resume_data.header.location}</div>
            </div>
            
            <div class="section-header">EXPERTISE</div>
            <p>{resume_data.expertise.summary}</p>
            
            <div class="section-header">SKILLS</div>
            <p>{resume_data.skills.skills}</p>
            
            <div class="section-header">EXPERIENCE</div>
        """
        
        for exp in resume_data.experience:
            html += f"""
            <div>
                <strong>{exp.company} - {exp.position}</strong><br>
                {exp.start_date} - {exp.end_date or 'Present'}<br>
                <ul>
            """
            for resp in exp.responsibilities:
                html += f"<li>{resp}</li>"
            html += "</ul></div>"
        
        html += """
            </body>
            </html>
        """
        return html
    
    def _generate_partial_html(self, partial_data: Dict[str, Any]) -> str:
        """Generate partial HTML with available data"""
        html = """
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Resume Preview - Incomplete</title>
            <style>
                body { font-family: 'Times New Roman', serif; margin: 0.5in; }
                .placeholder { color: #888; font-style: italic; }
                .validation-error { color: red; margin: 10px 0; }
            </style>
        </head>
        <body>
            <div class="validation-error">Resume validation incomplete. Please fix errors and complete all required sections.</div>
        """
        
        if "header" in partial_data:
            header = partial_data["header"]
            html += f"""
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 18px; font-weight: bold;">{header.get('name', 'Name not provided')}</div>
                <div>{header.get('title', 'Title not provided')}</div>
            </div>
            """
        
        html += "</body></html>"
        return html