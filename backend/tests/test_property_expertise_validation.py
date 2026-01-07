"""
Property-based tests for expertise summary validation
Feature: Indexnine-resume-builder, Property 5: Expertise summary word count validation
"""

import pytest
from hypothesis import given, strategies as st
from pydantic import ValidationError
from models.resume_models import ExpertiseModel


# Valid word count generator (80-120 words)
@st.composite
def valid_expertise_summary(draw):
    """Generate expertise summaries with valid word count (80-120 words)"""
    target_word_count = draw(st.integers(min_value=80, max_value=120))
    
    # Generate meaningful words for resume context
    resume_words = [
        'experienced', 'professional', 'skilled', 'proficient', 'expert', 'specialist',
        'developer', 'engineer', 'manager', 'analyst', 'consultant', 'architect',
        'software', 'technology', 'systems', 'applications', 'solutions', 'projects',
        'team', 'leadership', 'collaboration', 'communication', 'problem-solving',
        'innovative', 'strategic', 'analytical', 'detail-oriented', 'results-driven',
        'Python', 'JavaScript', 'Java', 'React', 'Node.js', 'database', 'API',
        'cloud', 'AWS', 'Azure', 'Docker', 'Kubernetes', 'microservices',
        'agile', 'scrum', 'DevOps', 'CI/CD', 'testing', 'debugging', 'optimization',
        'design', 'implementation', 'deployment', 'maintenance', 'documentation',
        'requirements', 'specifications', 'architecture', 'scalability', 'performance',
        'security', 'compliance', 'best', 'practices', 'standards', 'methodologies'
    ]
    
    # Generate exactly the target number of words
    words = draw(st.lists(
        st.sampled_from(resume_words),
        min_size=target_word_count,
        max_size=target_word_count
    ))
    
    return ' '.join(words)


# Invalid word count generators
@st.composite
def too_short_expertise_summary(draw):
    """Generate expertise summaries with too few words (< 80 words)"""
    word_count = draw(st.integers(min_value=1, max_value=79))
    
    resume_words = [
        'experienced', 'professional', 'skilled', 'developer', 'engineer',
        'software', 'technology', 'systems', 'Python', 'JavaScript'
    ]
    
    words = draw(st.lists(
        st.sampled_from(resume_words),
        min_size=word_count,
        max_size=word_count
    ))
    
    return ' '.join(words)


@st.composite
def too_long_expertise_summary(draw):
    """Generate expertise summaries with too many words (> 120 words)"""
    word_count = draw(st.integers(min_value=121, max_value=200))
    
    resume_words = [
        'experienced', 'professional', 'skilled', 'proficient', 'expert', 'specialist',
        'developer', 'engineer', 'manager', 'analyst', 'consultant', 'architect',
        'software', 'technology', 'systems', 'applications', 'solutions', 'projects',
        'team', 'leadership', 'collaboration', 'communication', 'problem-solving',
        'innovative', 'strategic', 'analytical', 'detail-oriented', 'results-driven'
    ]
    
    words = draw(st.lists(
        st.sampled_from(resume_words),
        min_size=word_count,
        max_size=word_count
    ))
    
    return ' '.join(words)


# Edge case generators
@st.composite
def expertise_with_extra_whitespace(draw):
    """Generate summaries with extra whitespace that should still count words correctly"""
    target_word_count = draw(st.integers(min_value=80, max_value=120))
    
    resume_words = [
        'experienced', 'professional', 'skilled', 'developer', 'engineer',
        'software', 'technology', 'systems', 'Python', 'JavaScript', 'React'
    ]
    
    words = draw(st.lists(
        st.sampled_from(resume_words),
        min_size=target_word_count,
        max_size=target_word_count
    ))
    
    # Add random extra whitespace between words
    result = []
    for i, word in enumerate(words):
        result.append(word)
        if i < len(words) - 1:  # Don't add spaces after last word
            spaces = draw(st.integers(min_value=1, max_value=5))
            result.append(' ' * spaces)
    
    # Add potential leading/trailing whitespace
    text = ''.join(result)
    leading_spaces = draw(st.integers(min_value=0, max_value=3))
    trailing_spaces = draw(st.integers(min_value=0, max_value=3))
    
    return ' ' * leading_spaces + text + ' ' * trailing_spaces


class TestExpertiseSummaryValidation:
    """
    Property 5: Expertise summary word count validation
    Validates: Requirements 2.3
    """
    
    @given(valid_expertise_summary())
    def test_valid_word_count_summaries_accepted(self, summary):
        """For any expertise summary with 80-120 words, the model should accept it"""
        try:
            expertise = ExpertiseModel(summary=summary)
            assert expertise.summary == summary
            
            # Verify word count is actually in valid range
            word_count = len(summary.split())
            assert 80 <= word_count <= 120, f"Generated summary has {word_count} words, expected 80-120"
            
        except ValidationError as e:
            word_count = len(summary.split())
            pytest.fail(f"Valid expertise summary with {word_count} words was rejected: {e}")
    
    @given(too_short_expertise_summary())
    def test_too_short_summaries_rejected(self, summary):
        """For any expertise summary with < 80 words, the model should reject it"""
        word_count = len(summary.split())
        assert word_count < 80, f"Test data error: summary has {word_count} words, expected < 80"
        
        with pytest.raises(ValidationError) as exc_info:
            ExpertiseModel(summary=summary)
        
        # Verify the error message mentions word count
        error_message = str(exc_info.value)
        assert 'word' in error_message.lower()
        assert str(word_count) in error_message
    
    @given(too_long_expertise_summary())
    def test_too_long_summaries_rejected(self, summary):
        """For any expertise summary with > 120 words, the model should reject it"""
        word_count = len(summary.split())
        assert word_count > 120, f"Test data error: summary has {word_count} words, expected > 120"
        
        with pytest.raises(ValidationError) as exc_info:
            ExpertiseModel(summary=summary)
        
        # Verify the error message mentions word count
        error_message = str(exc_info.value)
        assert 'word' in error_message.lower()
        assert str(word_count) in error_message
    
    @given(expertise_with_extra_whitespace())
    def test_extra_whitespace_handled_correctly(self, summary):
        """For any expertise summary with extra whitespace, word counting should be accurate"""
        # The summary should be accepted if the actual word count is valid
        actual_word_count = len(summary.split())
        
        if 80 <= actual_word_count <= 120:
            try:
                expertise = ExpertiseModel(summary=summary)
                assert expertise.summary == summary
            except ValidationError as e:
                pytest.fail(f"Valid expertise summary with {actual_word_count} words (with extra whitespace) was rejected: {e}")
        else:
            # Should be rejected if word count is invalid
            with pytest.raises(ValidationError):
                ExpertiseModel(summary=summary)
    
    def test_boundary_conditions(self):
        """Test exact boundary conditions for word count"""
        # Exactly 80 words should be accepted
        words_80 = ' '.join(['word'] * 80)
        expertise_80 = ExpertiseModel(summary=words_80)
        assert len(expertise_80.summary.split()) == 80
        
        # Exactly 120 words should be accepted
        words_120 = ' '.join(['word'] * 120)
        expertise_120 = ExpertiseModel(summary=words_120)
        assert len(expertise_120.summary.split()) == 120
        
        # 79 words should be rejected
        words_79 = ' '.join(['word'] * 79)
        with pytest.raises(ValidationError) as exc_info:
            ExpertiseModel(summary=words_79)
        assert '79' in str(exc_info.value)
        
        # 121 words should be rejected
        words_121 = ' '.join(['word'] * 121)
        with pytest.raises(ValidationError) as exc_info:
            ExpertiseModel(summary=words_121)
        assert '121' in str(exc_info.value)
    
    def test_empty_string_rejected(self):
        """Empty expertise summary should be rejected"""
        with pytest.raises(ValidationError):
            ExpertiseModel(summary="")
    
    def test_whitespace_only_rejected(self):
        """Whitespace-only expertise summary should be rejected"""
        with pytest.raises(ValidationError):
            ExpertiseModel(summary="   ")
        
        with pytest.raises(ValidationError):
            ExpertiseModel(summary="\t\n  ")
    
    @given(st.text(min_size=1, max_size=1000))
    def test_word_count_calculation_consistency(self, text):
        """For any text, word count calculation should be consistent with Python's split()"""
        word_count = len(text.split())
        
        if 80 <= word_count <= 120:
            # Should be accepted
            try:
                expertise = ExpertiseModel(summary=text)
                assert expertise.summary == text
            except ValidationError:
                # Only fail if it's not due to emoji validation
                if not any(ord(char) > 127 for char in text):  # Simple check for non-ASCII
                    pytest.fail(f"Text with {word_count} words was unexpectedly rejected")
        else:
            # Should be rejected due to word count (unless it has other validation issues)
            with pytest.raises(ValidationError):
                ExpertiseModel(summary=text)