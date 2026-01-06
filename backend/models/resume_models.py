from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import List, Optional
import re


class HeaderModel(BaseModel):
    """Header section containing personal contact information"""
    name: str = Field(..., min_length=1, max_length=100)
    title: str = Field(..., min_length=1, max_length=150)
    email: str = Field(..., pattern=r'^[^@]+@[^@]+\.[^@]+$')
    phone: str = Field(..., pattern=r'^\+?[\d\s\-\(\)]+$')
    location: str = Field(..., min_length=1, max_length=100)

    @field_validator('name', 'title', 'location')
    @classmethod
    def validate_no_emojis_icons(cls, v):
        """Reject content containing emojis, icons, or graphics"""
        # Check for common emoji ranges and special characters
        emoji_pattern = re.compile(
            "["
            "\U0001F600-\U0001F64F"  # emoticons
            "\U0001F300-\U0001F5FF"  # symbols & pictographs
            "\U0001F680-\U0001F6FF"  # transport & map symbols
            "\U0001F1E0-\U0001F1FF"  # flags (iOS)
            "\U00002702-\U000027B0"  # dingbats
            "\U000024C2-\U0001F251"
            "]+", flags=re.UNICODE
        )
        if emoji_pattern.search(v):
            raise ValueError('Content cannot contain emojis, icons, or graphics')
        return v


class ExpertiseModel(BaseModel):
    """Expertise summary with strict word count validation"""
    summary: str = Field(..., min_length=1)
    
    @field_validator('summary')
    @classmethod
    def validate_word_count(cls, v):
        """Enforce 80-120 word count requirement"""
        word_count = len(v.split())
        if not 80 <= word_count <= 120:
            raise ValueError(f'Summary must be 80-120 words, got {word_count}')
        return v
    
    @field_validator('summary')
    @classmethod
    def validate_no_emojis_icons(cls, v):
        """Reject content containing emojis, icons, or graphics"""
        emoji_pattern = re.compile(
            "["
            "\U0001F600-\U0001F64F"
            "\U0001F300-\U0001F5FF"
            "\U0001F680-\U0001F6FF"
            "\U0001F1E0-\U0001F1FF"
            "\U00002702-\U000027B0"
            "\U000024C2-\U0001F251"
            "]+", flags=re.UNICODE
        )
        if emoji_pattern.search(v):
            raise ValueError('Content cannot contain emojis, icons, or graphics')
        return v


class SkillsModel(BaseModel):
    """Skills section with comma-separated format requirement"""
    skills: str = Field(..., min_length=1)
    
    @field_validator('skills')
    @classmethod
    def validate_comma_separated_format(cls, v):
        """Ensure skills are in comma-separated format"""
        # Check that skills contain commas (indicating proper format)
        if ',' not in v.strip():
            raise ValueError('Skills must be in comma-separated format')
        
        # Validate each skill doesn't contain emojis
        skills_list = [skill.strip() for skill in v.split(',')]
        emoji_pattern = re.compile(
            "["
            "\U0001F600-\U0001F64F"
            "\U0001F300-\U0001F5FF"
            "\U0001F680-\U0001F6FF"
            "\U0001F1E0-\U0001F1FF"
            "\U00002702-\U000027B0"
            "\U000024C2-\U0001F251"
            "]+", flags=re.UNICODE
        )
        
        for skill in skills_list:
            if emoji_pattern.search(skill):
                raise ValueError('Skills cannot contain emojis, icons, or graphics')
        
        return v


class ExperienceModel(BaseModel):
    """Work experience with minimum responsibilities requirement"""
    company: str = Field(..., min_length=1, max_length=100)
    position: str = Field(..., min_length=1, max_length=100)
    start_date: str = Field(..., pattern=r'^[A-Z]{3} \d{4}$')
    end_date: Optional[str] = Field(None, pattern=r'^[A-Z]{3} \d{4}$|^Present$')
    responsibilities: List[str] = Field(..., min_length=3)
    
    @field_validator('responsibilities')
    @classmethod
    def validate_responsibilities(cls, v):
        """Ensure minimum 3 responsibilities and bullet-point format"""
        if len(v) < 3:
            raise ValueError('Minimum 3 responsibilities required')
        
        # Validate bullet-point format and no emojis
        emoji_pattern = re.compile(
            "["
            "\U0001F600-\U0001F64F"
            "\U0001F300-\U0001F5FF"
            "\U0001F680-\U0001F6FF"
            "\U0001F1E0-\U0001F1FF"
            "\U00002702-\U000027B0"
            "\U000024C2-\U0001F251"
            "]+", flags=re.UNICODE
        )
        
        for responsibility in v:
            if emoji_pattern.search(responsibility):
                raise ValueError('Responsibilities cannot contain emojis, icons, or graphics')
            # Each responsibility should be suitable for bullet-point format
            if not responsibility.strip():
                raise ValueError('Responsibilities cannot be empty')
        
        return v
    
    @field_validator('company', 'position')
    @classmethod
    def validate_no_emojis_icons(cls, v):
        """Reject content containing emojis, icons, or graphics"""
        emoji_pattern = re.compile(
            "["
            "\U0001F600-\U0001F64F"
            "\U0001F300-\U0001F5FF"
            "\U0001F680-\U0001F6FF"
            "\U0001F1E0-\U0001F1FF"
            "\U00002702-\U000027B0"
            "\U000024C2-\U0001F251"
            "]+", flags=re.UNICODE
        )
        if emoji_pattern.search(v):
            raise ValueError('Content cannot contain emojis, icons, or graphics')
        return v


class ProjectModel(BaseModel):
    """Project experience section"""
    name: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=1, max_length=500)
    technologies: str = Field(..., min_length=1)
    start_date: str = Field(..., pattern=r'^[A-Z]{3} \d{4}$')
    end_date: Optional[str] = Field(None, pattern=r'^[A-Z]{3} \d{4}$|^Present$')
    
    @field_validator('name', 'description', 'technologies')
    @classmethod
    def validate_no_emojis_icons(cls, v):
        """Reject content containing emojis, icons, or graphics"""
        emoji_pattern = re.compile(
            "["
            "\U0001F600-\U0001F64F"
            "\U0001F300-\U0001F5FF"
            "\U0001F680-\U0001F6FF"
            "\U0001F1E0-\U0001F1FF"
            "\U00002702-\U000027B0"
            "\U000024C2-\U0001F251"
            "]+", flags=re.UNICODE
        )
        if emoji_pattern.search(v):
            raise ValueError('Content cannot contain emojis, icons, or graphics')
        return v


class EducationModel(BaseModel):
    """Education section"""
    institution: str = Field(..., min_length=1, max_length=100)
    degree: str = Field(..., min_length=1, max_length=100)
    field_of_study: str = Field(..., min_length=1, max_length=100)
    graduation_date: str = Field(..., pattern=r'^[A-Z]{3} \d{4}$')
    gpa: Optional[str] = Field(None, max_length=10)
    
    @field_validator('institution', 'degree', 'field_of_study', 'gpa')
    @classmethod
    def validate_no_emojis_icons(cls, v):
        """Reject content containing emojis, icons, or graphics"""
        if v is None:
            return v
        emoji_pattern = re.compile(
            "["
            "\U0001F600-\U0001F64F"
            "\U0001F300-\U0001F5FF"
            "\U0001F680-\U0001F6FF"
            "\U0001F1E0-\U0001F1FF"
            "\U00002702-\U000027B0"
            "\U000024C2-\U0001F251"
            "]+", flags=re.UNICODE
        )
        if emoji_pattern.search(v):
            raise ValueError('Content cannot contain emojis, icons, or graphics')
        return v


class AwardModel(BaseModel):
    """Awards section (optional)"""
    title: str = Field(..., min_length=1, max_length=100)
    organization: str = Field(..., min_length=1, max_length=100)
    date: str = Field(..., pattern=r'^[A-Z]{3} \d{4}$')
    description: Optional[str] = Field(None, max_length=200)
    
    @field_validator('title', 'organization', 'description')
    @classmethod
    def validate_no_emojis_icons(cls, v):
        """Reject content containing emojis, icons, or graphics"""
        if v is None:
            return v
        emoji_pattern = re.compile(
            "["
            "\U0001F600-\U0001F64F"
            "\U0001F300-\U0001F5FF"
            "\U0001F680-\U0001F6FF"
            "\U0001F1E0-\U0001F1FF"
            "\U00002702-\U000027B0"
            "\U000024C2-\U0001F251"
            "]+", flags=re.UNICODE
        )
        if emoji_pattern.search(v):
            raise ValueError('Content cannot contain emojis, icons, or graphics')
        return v


class ResumeModel(BaseModel):
    """Complete resume data model enforcing spec compliance"""
    model_config = ConfigDict(validate_assignment=True, extra="forbid")
    
    header: HeaderModel
    expertise: ExpertiseModel
    skills: SkillsModel
    experience: List[ExperienceModel]
    projects: List[ProjectModel]
    education: List[EducationModel]
    awards: Optional[List[AwardModel]] = []
        
    @field_validator('experience', 'projects', 'education')
    @classmethod
    def validate_required_sections_not_empty(cls, v, info):
        """Ensure required sections are not empty"""
        if not v:
            raise ValueError(f'{info.field_name} section cannot be empty')
        return v
    
    @field_validator('experience')
    @classmethod
    def validate_experience_order(cls, v):
        """Validate experience entries (basic validation for now)"""
        if not v:
            raise ValueError('Experience section is required')
        return v