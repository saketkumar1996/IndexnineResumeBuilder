"""
Property-based tests for skills comma-separated format validation
Feature: Indexnine-resume-builder, Property 6: Skills format validation
"""

import pytest
from hypothesis import given, strategies as st
from pydantic import ValidationError
from models.resume_models import SkillsModel


# Valid comma-separated skills generator
@st.composite
def valid_comma_separated_skills(draw):
    """Generate valid comma-separated skills"""
    # Generate 3-15 individual skills
    num_skills = draw(st.integers(min_value=3, max_value=15))
    
    skills = []
    for _ in range(num_skills):
        skill = draw(st.text(
            alphabet='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 +-.',
            min_size=2,
            max_size=20
        ).filter(lambda x: x.strip() and ',' not in x and x.replace(' ', '').replace('+', '').replace('-', '').replace('.', '').isalnum()))
        skills.append(skill.strip())
    
    return ', '.join(skills)


# Invalid skills format generator (no commas)
@st.composite
def invalid_skills_no_commas(draw):
    """Generate skills without comma separation"""
    # Generate space-separated or other formats
    num_skills = draw(st.integers(min_value=2, max_value=10))
    
    skills = []
    for _ in range(num_skills):
        skill = draw(st.text(
            alphabet='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
            min_size=2,
            max_size=15
        ).filter(lambda x: x.strip() and ',' not in x and x.isalnum()))
        skills.append(skill.strip())
    
    # Join with various non-comma separators
    separator = draw(st.sampled_from([' ', ' | ', ' - ', ' / ', '; ', '\n']))
    return separator.join(skills)


# Skills with emojis generator
@st.composite
def skills_with_emojis(draw):
    """Generate comma-separated skills containing emojis"""
    num_skills = draw(st.integers(min_value=3, max_value=10))
    
    skills = []
    for i in range(num_skills):
        if i == 0 or draw(st.booleans()):  # Ensure at least one skill has emoji
            skill = draw(st.text(
                alphabet=st.characters(whitelist_categories=('Lu', 'Ll')),
                min_size=3,
                max_size=10
            ))
            emoji = draw(st.sampled_from(['🎉', '😀', '💻', '📱', '🚀', '✨', '🔥', '💡']))
            skills.append(f"{skill}{emoji}")
        else:
            skill = draw(st.text(
                alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd')),
                min_size=2,
                max_size=15
            ).filter(lambda x: x.strip() and ',' not in x))
            skills.append(skill.strip())
    
    return ', '.join(skills)


class TestSkillsFormatValidation:
    """
    Property 6: Skills comma-separated format validation
    Validates: Requirements 6.2
    """
    
    @given(valid_comma_separated_skills())
    def test_valid_comma_separated_skills_accepted(self, valid_skills):
        """For any valid comma-separated skills, skills model should accept them"""
        try:
            skills_model = SkillsModel(skills=valid_skills)
            assert skills_model.skills == valid_skills
            assert ',' in valid_skills  # Verify it actually contains commas
        except ValidationError:
            pytest.fail(f"Valid comma-separated skills were rejected: {valid_skills}")
    
    @given(invalid_skills_no_commas())
    def test_skills_without_commas_rejected(self, invalid_skills):
        """For any skills without comma separation, skills model should reject them"""
        with pytest.raises(ValidationError) as exc_info:
            SkillsModel(skills=invalid_skills)
        
        error_message = str(exc_info.value)
        assert "comma" in error_message.lower()
    
    @given(skills_with_emojis())
    def test_skills_with_emojis_rejected(self, emoji_skills):
        """For any skills containing emojis, skills model should reject them"""
        with pytest.raises(ValidationError) as exc_info:
            SkillsModel(skills=emoji_skills)
        
        error_message = str(exc_info.value)
        assert any(word in error_message.lower() for word in ['emoji', 'icon', 'graphic'])
    
    def test_edge_cases(self):
        """Test specific edge cases for skills validation"""
        # Single skill with comma should be valid
        single_skill = "Python, JavaScript"
        skills_model = SkillsModel(skills=single_skill)
        assert skills_model.skills == single_skill
        
        # Empty string should be rejected
        with pytest.raises(ValidationError):
            SkillsModel(skills="")
        
        # Only whitespace should be rejected
        with pytest.raises(ValidationError):
            SkillsModel(skills="   ")
        
        # Single word without comma should be rejected
        with pytest.raises(ValidationError):
            SkillsModel(skills="Python")
        
        # Skills with extra spaces should be valid
        spaced_skills = "Python , JavaScript , React , Node.js"
        skills_model = SkillsModel(skills=spaced_skills)
        assert skills_model.skills == spaced_skills
    
    def test_realistic_skills_examples(self):
        """Test with realistic skills examples"""
        realistic_skills = [
            "Python, JavaScript, React, Node.js, AWS, Docker",
            "Java, Spring Boot, MySQL, Redis, Kubernetes, Jenkins",
            "C++, Qt, Linux, Git, CMake, GDB",
            "HTML, CSS, TypeScript, Vue.js, PostgreSQL, MongoDB"
        ]
        
        for skills in realistic_skills:
            skills_model = SkillsModel(skills=skills)
            assert skills_model.skills == skills