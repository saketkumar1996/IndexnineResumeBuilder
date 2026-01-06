"""
Property-based tests for date format validation
Feature: Indexnine-resume-builder, Property 4: Date format validation
"""

import pytest
from hypothesis import given, strategies as st
from pydantic import ValidationError
from models.resume_models import ExperienceModel, ProjectModel, EducationModel, AwardModel


# Valid MMM YYYY format generator
@st.composite
def valid_date_format(draw):
    """Generate valid MMM YYYY format dates"""
    months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
              'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
    month = draw(st.sampled_from(months))
    year = draw(st.integers(min_value=1950, max_value=2030))
    return f"{month} {year}"


# Invalid date format generator
@st.composite
def invalid_date_format(draw):
    """Generate invalid date formats that should be rejected"""
    invalid_formats = [
        # Wrong month format
        st.text(min_size=1, max_size=5).filter(lambda x: x not in ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'Present']),
        # Wrong separators
        st.builds(lambda m, y: f"{m}-{y}", st.sampled_from(['JAN', 'FEB', 'MAR']), st.integers(2000, 2030)),
        st.builds(lambda m, y: f"{m}/{y}", st.sampled_from(['JAN', 'FEB', 'MAR']), st.integers(2000, 2030)),
        st.builds(lambda m, y: f"{m}.{y}", st.sampled_from(['JAN', 'FEB', 'MAR']), st.integers(2000, 2030)),
        # Numeric months
        st.builds(lambda m, y: f"{m:02d} {y}", st.integers(1, 12), st.integers(2000, 2030)),
        # Full month names
        st.builds(lambda m, y: f"{m} {y}", st.sampled_from(['January', 'February', 'March']), st.integers(2000, 2030)),
        # Wrong year format
        st.builds(lambda m, y: f"{m} {y:02d}", st.sampled_from(['JAN', 'FEB', 'MAR']), st.integers(0, 99)),
        # No space
        st.builds(lambda m, y: f"{m}{y}", st.sampled_from(['JAN', 'FEB', 'MAR']), st.integers(2000, 2030)),
        # Multiple spaces
        st.builds(lambda m, y: f"{m}  {y}", st.sampled_from(['JAN', 'FEB', 'MAR']), st.integers(2000, 2030)),
    ]
    return draw(st.one_of(invalid_formats))


class TestDateFormatValidation:
    """
    Property 4: Date format validation
    Validates: Requirements 2.2
    """
    
    @given(valid_date_format())
    def test_valid_date_formats_accepted_in_experience(self, valid_date):
        """For any valid MMM YYYY format date, experience model should accept it"""
        try:
            experience = ExperienceModel(
                company="Test Company",
                position="Test Position", 
                start_date=valid_date,
                end_date=valid_date,
                responsibilities=["Task 1", "Task 2", "Task 3"]
            )
            assert experience.start_date == valid_date
            assert experience.end_date == valid_date
        except ValidationError:
            pytest.fail(f"Valid date format {valid_date} was rejected")
    
    @given(valid_date_format())
    def test_valid_date_formats_accepted_in_projects(self, valid_date):
        """For any valid MMM YYYY format date, project model should accept it"""
        try:
            project = ProjectModel(
                name="Test Project",
                description="Test Description",
                technologies="Python, FastAPI",
                start_date=valid_date,
                end_date=valid_date
            )
            assert project.start_date == valid_date
            assert project.end_date == valid_date
        except ValidationError:
            pytest.fail(f"Valid date format {valid_date} was rejected")
    
    @given(valid_date_format())
    def test_valid_date_formats_accepted_in_education(self, valid_date):
        """For any valid MMM YYYY format date, education model should accept it"""
        try:
            education = EducationModel(
                institution="Test University",
                degree="Bachelor of Science",
                field_of_study="Computer Science",
                graduation_date=valid_date
            )
            assert education.graduation_date == valid_date
        except ValidationError:
            pytest.fail(f"Valid date format {valid_date} was rejected")
    
    @given(valid_date_format())
    def test_valid_date_formats_accepted_in_awards(self, valid_date):
        """For any valid MMM YYYY format date, award model should accept it"""
        try:
            award = AwardModel(
                title="Test Award",
                organization="Test Organization",
                date=valid_date
            )
            assert award.date == valid_date
        except ValidationError:
            pytest.fail(f"Valid date format {valid_date} was rejected")
    
    @given(invalid_date_format())
    def test_invalid_date_formats_rejected_in_experience(self, invalid_date):
        """For any invalid date format, experience model should reject it"""
        # Skip 'Present' as it's valid for end_date
        if invalid_date == 'Present':
            return
            
        with pytest.raises(ValidationError):
            ExperienceModel(
                company="Test Company",
                position="Test Position",
                start_date=invalid_date,
                responsibilities=["Task 1", "Task 2", "Task 3"]
            )
    
    @given(invalid_date_format())
    def test_invalid_date_formats_rejected_in_projects(self, invalid_date):
        """For any invalid date format, project model should reject it"""
        # Skip 'Present' as it's valid for end_date
        if invalid_date == 'Present':
            return
            
        with pytest.raises(ValidationError):
            ProjectModel(
                name="Test Project",
                description="Test Description", 
                technologies="Python, FastAPI",
                start_date=invalid_date
            )
    
    @given(invalid_date_format())
    def test_invalid_date_formats_rejected_in_education(self, invalid_date):
        """For any invalid date format, education model should reject it"""
        with pytest.raises(ValidationError):
            EducationModel(
                institution="Test University",
                degree="Bachelor of Science",
                field_of_study="Computer Science",
                graduation_date=invalid_date
            )
    
    @given(invalid_date_format())
    def test_invalid_date_formats_rejected_in_awards(self, invalid_date):
        """For any invalid date format, award model should reject it"""
        with pytest.raises(ValidationError):
            AwardModel(
                title="Test Award",
                organization="Test Organization",
                date=invalid_date
            )
    
    def test_present_accepted_for_end_dates_only(self):
        """Present should be accepted for end dates but not start dates"""
        # Present valid for end_date in experience
        experience = ExperienceModel(
            company="Test Company",
            position="Test Position",
            start_date="JAN 2020",
            end_date="Present",
            responsibilities=["Task 1", "Task 2", "Task 3"]
        )
        assert experience.end_date == "Present"
        
        # Present valid for end_date in projects
        project = ProjectModel(
            name="Test Project",
            description="Test Description",
            technologies="Python, FastAPI", 
            start_date="JAN 2020",
            end_date="Present"
        )
        assert project.end_date == "Present"
        
        # Present invalid for start_date
        with pytest.raises(ValidationError):
            ExperienceModel(
                company="Test Company",
                position="Test Position",
                start_date="Present",
                responsibilities=["Task 1", "Task 2", "Task 3"]
            )