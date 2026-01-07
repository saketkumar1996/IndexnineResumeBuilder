"""
Property-based tests for experience responsibilities validation
Feature: Indexnine-resume-builder, Property 7: Responsibilities validation
"""

import pytest
from hypothesis import given, strategies as st
from pydantic import ValidationError
from models.resume_models import ExperienceModel


# Valid responsibilities generator (3+ responsibilities)
@st.composite
def valid_responsibilities_list(draw):
    """Generate valid list of responsibilities (minimum 3)"""
    num_responsibilities = draw(st.integers(min_value=3, max_value=8))
    
    responsibilities = []
    for _ in range(num_responsibilities):
        responsibility = draw(st.text(
            alphabet='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,()-',
            min_size=10,
            max_size=100
        ).filter(lambda x: x.strip() and len(x.replace(' ', '').replace('.', '').replace(',', '').replace('(', '').replace(')', '').replace('-', '')) > 5))
        responsibilities.append(responsibility.strip())
    
    return responsibilities


# Invalid responsibilities generator (< 3 responsibilities)
@st.composite
def invalid_responsibilities_list(draw):
    """Generate invalid list of responsibilities (< 3)"""
    num_responsibilities = draw(st.integers(min_value=0, max_value=2))
    
    responsibilities = []
    for _ in range(num_responsibilities):
        responsibility = draw(st.text(
            alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd', 'Po')),
            min_size=5,
            max_size=50
        ).filter(lambda x: x.strip() and not any(c in x for c in '🎉😀💻📱🚀')))
        responsibilities.append(responsibility.strip())
    
    return responsibilities


# Responsibilities with emojis generator
@st.composite
def responsibilities_with_emojis(draw):
    """Generate responsibilities containing emojis"""
    num_responsibilities = draw(st.integers(min_value=3, max_value=6))
    
    responsibilities = []
    for i in range(num_responsibilities):
        if i == 0 or draw(st.booleans()):  # Ensure at least one has emoji
            responsibility = draw(st.text(
                alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Po')),
                min_size=10,
                max_size=50
            ))
            emoji = draw(st.sampled_from(['🎉', '😀', '💻', '📱', '🚀', '✨', '🔥', '💡']))
            responsibilities.append(f"{responsibility} {emoji}")
        else:
            responsibility = draw(st.text(
                alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd', 'Po')),
                min_size=10,
                max_size=50
            ).filter(lambda x: x.strip()))
            responsibilities.append(responsibility.strip())
    
    return responsibilities


# Empty/whitespace responsibilities generator
@st.composite
def responsibilities_with_empty_items(draw):
    """Generate responsibilities list containing empty or whitespace-only items"""
    num_valid = draw(st.integers(min_value=2, max_value=5))
    num_empty = draw(st.integers(min_value=1, max_value=3))
    
    responsibilities = []
    
    # Add valid responsibilities
    for _ in range(num_valid):
        responsibility = draw(st.text(
            alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd', 'Po')),
            min_size=10,
            max_size=50
        ).filter(lambda x: x.strip()))
        responsibilities.append(responsibility.strip())
    
    # Add empty/whitespace responsibilities
    for _ in range(num_empty):
        empty_item = draw(st.sampled_from(['', '   ', '\t', '\n', '  \t  ']))
        responsibilities.append(empty_item)
    
    # Shuffle the list
    draw(st.randoms()).shuffle(responsibilities)
    return responsibilities


class TestResponsibilitiesValidation:
    """
    Property 7: Experience responsibilities validation
    Validates: Requirements 2.4
    """
    
    @given(valid_responsibilities_list())
    def test_valid_responsibilities_accepted(self, valid_responsibilities):
        """For any valid responsibilities list (3+), experience model should accept it"""
        try:
            experience = ExperienceModel(
                company="Test Company",
                position="Test Position",
                start_date="JAN 2020",
                end_date="DEC 2021",
                responsibilities=valid_responsibilities
            )
            assert len(experience.responsibilities) >= 3
            assert experience.responsibilities == valid_responsibilities
        except ValidationError:
            pytest.fail(f"Valid responsibilities list with {len(valid_responsibilities)} items was rejected")
    
    @given(invalid_responsibilities_list())
    def test_invalid_responsibilities_rejected(self, invalid_responsibilities):
        """For any responsibilities list with < 3 items, experience model should reject it"""
        with pytest.raises(ValidationError) as exc_info:
            ExperienceModel(
                company="Test Company",
                position="Test Position",
                start_date="JAN 2020",
                end_date="DEC 2021",
                responsibilities=invalid_responsibilities
            )
        
        error_message = str(exc_info.value)
        assert "3" in error_message and "responsibilities" in error_message.lower()
    
    @given(responsibilities_with_emojis())
    def test_responsibilities_with_emojis_rejected(self, emoji_responsibilities):
        """For any responsibilities containing emojis, experience model should reject them"""
        with pytest.raises(ValidationError) as exc_info:
            ExperienceModel(
                company="Test Company",
                position="Test Position",
                start_date="JAN 2020",
                end_date="DEC 2021",
                responsibilities=emoji_responsibilities
            )
        
        error_message = str(exc_info.value)
        assert any(word in error_message.lower() for word in ['emoji', 'icon', 'graphic'])
    
    @given(responsibilities_with_empty_items())
    def test_responsibilities_with_empty_items_rejected(self, responsibilities_with_empty):
        """For any responsibilities list containing empty items, experience model should reject it"""
        with pytest.raises(ValidationError) as exc_info:
            ExperienceModel(
                company="Test Company",
                position="Test Position",
                start_date="JAN 2020",
                end_date="DEC 2021",
                responsibilities=responsibilities_with_empty
            )
        
        error_message = str(exc_info.value)
        assert "empty" in error_message.lower() or "responsibilities" in error_message.lower()
    
    def test_boundary_conditions(self):
        """Test exact boundary conditions for responsibilities count"""
        # Exactly 3 responsibilities should be valid
        three_responsibilities = [
            "Developed web applications using React and Node.js",
            "Collaborated with cross-functional teams to deliver projects",
            "Implemented automated testing and CI/CD pipelines"
        ]
        
        experience = ExperienceModel(
            company="Test Company",
            position="Test Position",
            start_date="JAN 2020",
            end_date="DEC 2021",
            responsibilities=three_responsibilities
        )
        assert len(experience.responsibilities) == 3
        
        # 2 responsibilities should be invalid
        two_responsibilities = [
            "Developed web applications",
            "Collaborated with teams"
        ]
        
        with pytest.raises(ValidationError):
            ExperienceModel(
                company="Test Company",
                position="Test Position",
                start_date="JAN 2020",
                end_date="DEC 2021",
                responsibilities=two_responsibilities
            )
        
        # Empty list should be invalid
        with pytest.raises(ValidationError):
            ExperienceModel(
                company="Test Company",
                position="Test Position",
                start_date="JAN 2020",
                end_date="DEC 2021",
                responsibilities=[]
            )
    
    def test_realistic_responsibilities_examples(self):
        """Test with realistic responsibilities examples"""
        realistic_examples = [
            [
                "Led development of microservices architecture using Python and FastAPI",
                "Mentored junior developers and conducted comprehensive code reviews",
                "Implemented CI/CD pipelines using Jenkins, Docker, and Kubernetes",
                "Collaborated with product managers to define technical requirements"
            ],
            [
                "Designed and developed responsive web applications using React and TypeScript",
                "Optimized database queries resulting in 40% performance improvement",
                "Participated in agile development processes and sprint planning sessions"
            ],
            [
                "Built RESTful APIs serving over 1 million requests per day",
                "Implemented automated testing strategies achieving 95% code coverage",
                "Troubleshot production issues and implemented monitoring solutions",
                "Documented technical specifications and API endpoints"
            ]
        ]
        
        for responsibilities in realistic_examples:
            experience = ExperienceModel(
                company="Test Company",
                position="Software Engineer",
                start_date="JAN 2020",
                end_date="Present",
                responsibilities=responsibilities
            )
            assert len(experience.responsibilities) >= 3
            assert experience.responsibilities == responsibilities