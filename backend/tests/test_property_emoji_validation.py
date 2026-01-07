"""
Property-based tests for emoji/icon/graphics rejection across all fields
Feature: Indexnine-resume-builder, Property 8: Emoji rejection validation
"""

import pytest
from hypothesis import given, strategies as st
from pydantic import ValidationError
from models.resume_models import (
    HeaderModel, ExpertiseModel, SkillsModel, ExperienceModel,
    ProjectModel, EducationModel, AwardModel
)


# Emoji generator
@st.composite
def text_with_emojis(draw):
    """Generate text containing various emojis and special characters"""
    base_text = draw(st.text(
        alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd', 'Po')),
        min_size=5,
        max_size=50
    ).filter(lambda x: x.strip()))
    
    # Add emojis at random positions
    emojis = ['🎉', '😀', '💻', '📱', '🚀', '✨', '🔥', '💡', '🎯', '⭐', '🌟', '💪', '👍', '🔧', '⚡']
    emoji = draw(st.sampled_from(emojis))
    
    # Insert emoji at random position
    position = draw(st.integers(min_value=0, max_value=len(base_text)))
    return base_text[:position] + emoji + base_text[position:]


# Clean text generator (no emojis)
@st.composite
def clean_text(draw):
    """Generate clean text without emojis"""
    return draw(st.text(
        alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd', 'Po', 'Pc')),
        min_size=1,
        max_size=100
    ).filter(lambda x: x.strip() and not any(ord(c) > 127 for c in x)))


class TestEmojiRejectionValidation:
    """
    Property 8: Emoji/icon/graphics rejection validation
    Validates: Requirements 2.5
    """
    
    @given(text_with_emojis())
    def test_header_fields_reject_emojis(self, emoji_text):
        """Header fields should reject any text containing emojis"""
        # Test name field
        with pytest.raises(ValidationError) as exc_info:
            HeaderModel(
                name=emoji_text,
                title="Software Engineer",
                email="test@example.com",
                phone="+1 555-123-4567",
                location="San Francisco, CA"
            )
        assert any(word in str(exc_info.value).lower() for word in ['emoji', 'icon', 'graphic'])
        
        # Test title field
        with pytest.raises(ValidationError) as exc_info:
            HeaderModel(
                name="John Doe",
                title=emoji_text,
                email="test@example.com",
                phone="+1 555-123-4567",
                location="San Francisco, CA"
            )
        assert any(word in str(exc_info.value).lower() for word in ['emoji', 'icon', 'graphic'])
        
        # Test location field
        with pytest.raises(ValidationError) as exc_info:
            HeaderModel(
                name="John Doe",
                title="Software Engineer",
                email="test@example.com",
                phone="+1 555-123-4567",
                location=emoji_text
            )
        assert any(word in str(exc_info.value).lower() for word in ['emoji', 'icon', 'graphic'])
    
    @given(text_with_emojis())
    def test_expertise_summary_rejects_emojis(self, emoji_text):
        """Expertise summary should reject emojis"""
        # Create a summary with proper word count but containing emojis
        words = emoji_text.split()
        if len(words) < 80:
            # Pad with clean words to meet word count requirement
            clean_words = ["experienced", "professional", "developer", "technology", "solutions"] * 20
            words.extend(clean_words[:80 - len(words)])
        elif len(words) > 120:
            words = words[:120]
        
        emoji_summary = " ".join(words)
        
        with pytest.raises(ValidationError) as exc_info:
            ExpertiseModel(summary=emoji_summary)
        
        error_message = str(exc_info.value).lower()
        assert any(word in error_message for word in ['emoji', 'icon', 'graphic'])
    
    @given(text_with_emojis())
    def test_experience_fields_reject_emojis(self, emoji_text):
        """Experience fields should reject emojis"""
        # Test company field
        with pytest.raises(ValidationError) as exc_info:
            ExperienceModel(
                company=emoji_text,
                position="Software Engineer",
                start_date="JAN 2020",
                end_date="DEC 2021",
                responsibilities=["Task 1", "Task 2", "Task 3"]
            )
        assert any(word in str(exc_info.value).lower() for word in ['emoji', 'icon', 'graphic'])
        
        # Test position field
        with pytest.raises(ValidationError) as exc_info:
            ExperienceModel(
                company="Tech Corp",
                position=emoji_text,
                start_date="JAN 2020",
                end_date="DEC 2021",
                responsibilities=["Task 1", "Task 2", "Task 3"]
            )
        assert any(word in str(exc_info.value).lower() for word in ['emoji', 'icon', 'graphic'])
        
        # Test responsibilities with emojis
        with pytest.raises(ValidationError) as exc_info:
            ExperienceModel(
                company="Tech Corp",
                position="Software Engineer",
                start_date="JAN 2020",
                end_date="DEC 2021",
                responsibilities=[emoji_text, "Task 2", "Task 3"]
            )
        assert any(word in str(exc_info.value).lower() for word in ['emoji', 'icon', 'graphic'])
    
    @given(text_with_emojis())
    def test_project_fields_reject_emojis(self, emoji_text):
        """Project fields should reject emojis"""
        # Test name field
        with pytest.raises(ValidationError) as exc_info:
            ProjectModel(
                name=emoji_text,
                description="A great project",
                technologies="Python, React",
                start_date="JAN 2020",
                end_date="DEC 2020"
            )
        assert any(word in str(exc_info.value).lower() for word in ['emoji', 'icon', 'graphic'])
        
        # Test description field
        with pytest.raises(ValidationError) as exc_info:
            ProjectModel(
                name="Great Project",
                description=emoji_text,
                technologies="Python, React",
                start_date="JAN 2020",
                end_date="DEC 2020"
            )
        assert any(word in str(exc_info.value).lower() for word in ['emoji', 'icon', 'graphic'])
        
        # Test technologies field
        with pytest.raises(ValidationError) as exc_info:
            ProjectModel(
                name="Great Project",
                description="A great project",
                technologies=emoji_text,
                start_date="JAN 2020",
                end_date="DEC 2020"
            )
        assert any(word in str(exc_info.value).lower() for word in ['emoji', 'icon', 'graphic'])
    
    @given(text_with_emojis())
    def test_education_fields_reject_emojis(self, emoji_text):
        """Education fields should reject emojis"""
        # Test institution field
        with pytest.raises(ValidationError) as exc_info:
            EducationModel(
                institution=emoji_text,
                degree="Bachelor of Science",
                field_of_study="Computer Science",
                graduation_date="MAY 2020",
                gpa="3.8"
            )
        assert any(word in str(exc_info.value).lower() for word in ['emoji', 'icon', 'graphic'])
        
        # Test degree field
        with pytest.raises(ValidationError) as exc_info:
            EducationModel(
                institution="University of California",
                degree=emoji_text,
                field_of_study="Computer Science",
                graduation_date="MAY 2020",
                gpa="3.8"
            )
        assert any(word in str(exc_info.value).lower() for word in ['emoji', 'icon', 'graphic'])
        
        # Test field_of_study
        with pytest.raises(ValidationError) as exc_info:
            EducationModel(
                institution="University of California",
                degree="Bachelor of Science",
                field_of_study=emoji_text,
                graduation_date="MAY 2020",
                gpa="3.8"
            )
        assert any(word in str(exc_info.value).lower() for word in ['emoji', 'icon', 'graphic'])
        
        # Test GPA field
        if len(emoji_text) <= 10:  # GPA has max length constraint
            with pytest.raises(ValidationError) as exc_info:
                EducationModel(
                    institution="University of California",
                    degree="Bachelor of Science",
                    field_of_study="Computer Science",
                    graduation_date="MAY 2020",
                    gpa=emoji_text
                )
            assert any(word in str(exc_info.value).lower() for word in ['emoji', 'icon', 'graphic'])
    
    @given(text_with_emojis())
    def test_award_fields_reject_emojis(self, emoji_text):
        """Award fields should reject emojis"""
        # Test title field
        with pytest.raises(ValidationError) as exc_info:
            AwardModel(
                title=emoji_text,
                organization="Tech Awards",
                date="DEC 2020",
                description="Great achievement"
            )
        assert any(word in str(exc_info.value).lower() for word in ['emoji', 'icon', 'graphic'])
        
        # Test organization field
        with pytest.raises(ValidationError) as exc_info:
            AwardModel(
                title="Best Developer",
                organization=emoji_text,
                date="DEC 2020",
                description="Great achievement"
            )
        assert any(word in str(exc_info.value).lower() for word in ['emoji', 'icon', 'graphic'])
        
        # Test description field (if within length limit)
        if len(emoji_text) <= 200:
            with pytest.raises(ValidationError) as exc_info:
                AwardModel(
                    title="Best Developer",
                    organization="Tech Awards",
                    date="DEC 2020",
                    description=emoji_text
                )
            assert any(word in str(exc_info.value).lower() for word in ['emoji', 'icon', 'graphic'])
    
    @given(clean_text())
    def test_clean_text_accepted(self, clean_text_value):
        """Clean text without emojis should be accepted"""
        if not clean_text_value.strip():
            return  # Skip empty strings
        
        try:
            # Test with header name field (has length constraints)
            if len(clean_text_value) <= 100:
                header = HeaderModel(
                    name=clean_text_value,
                    title="Software Engineer",
                    email="test@example.com",
                    phone="+1 555-123-4567",
                    location="San Francisco, CA"
                )
                assert header.name == clean_text_value
        except ValidationError as e:
            # Should only fail for other validation reasons, not emojis
            error_message = str(e).lower()
            assert not any(word in error_message for word in ['emoji', 'icon', 'graphic'])
    
    def test_specific_emoji_characters(self):
        """Test specific emoji characters that should be rejected"""
        problematic_emojis = [
            "🎉", "😀", "💻", "📱", "🚀", "✨", "🔥", "💡", "🎯", "⭐",
            "🌟", "💪", "👍", "🔧", "⚡", "🏆", "🎊", "🎈", "🎁", "🎀"
        ]
        
        for emoji in problematic_emojis:
            text_with_emoji = f"Software Engineer {emoji}"
            
            with pytest.raises(ValidationError) as exc_info:
                HeaderModel(
                    name=text_with_emoji,
                    title="Software Engineer",
                    email="test@example.com",
                    phone="+1 555-123-4567",
                    location="San Francisco, CA"
                )
            
            error_message = str(exc_info.value).lower()
            assert any(word in error_message for word in ['emoji', 'icon', 'graphic'])