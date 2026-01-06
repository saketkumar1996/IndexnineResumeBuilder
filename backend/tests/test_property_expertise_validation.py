"""
Property-based tests for expertise summary word count validation
Feature: Indexnine-resume-builder, Property 5: Expertise summary word count validation
"""

import pytest
from hypothesis import given, strategies as st
from pydantic import ValidationError
from models.resume_models import ExpertiseModel


# Valid word count generator (80-120 words)
@st.composite
def valid_word_count_summary(draw):
    """Generate summaries with valid word count (80-120 words)"""
    word_count = draw(st.integers(min_value=80, max_value=120))
    
    # Generate realistic words for resume summaries
    words = draw(st.lists(
        st.text(
            alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd')),
            min_size=2,
            max_size=12
        ).filter(lambda x: x.strip() and not any(c in x for c in '🎉😀💻📱🚀')),
        min_size=word_count,
        max_size=word_count
    ))
    
    return ' '.join(words)


# Invalid word count generator (outside 80-120 range)
@st.composite
def invalid_word_count_summary(draw):
    """Generate summaries with invalid word count (< 80 or > 120 words)"""
    # Choose either too few or too many words
    choice = draw(st.booleans())
    
    if choice:
        # Too few words (1-79)
        word_count = draw(st.integers(min_value=1, max_value=79))
    else:
        # Too many words (121-200)
        word_count = draw(st.integers(min_value=121, max_value=200))
    
    # Generate realistic words
    words = draw(st.lists(
        st.text(
            alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd')),
            min_size=2,
            max_size=12
        ).filter(lambda x: x.strip() and not any(c in x for c in '🎉😀💻📱🚀')),
        min_size=word_count,
        max_size=word_count
    ))
    
    return ' '.join(words)


# Summary with emojis generator
@st.composite
def summary_with_emojis(draw):
    """Generate summaries containing emojis that should be rejected"""
    word_count = draw(st.integers(min_value=80, max_value=120))
    
    # Generate words with some containing emojis
    words = []
    for _ in range(word_count):
        if draw(st.booleans()) and len(words) < word_count - 5:  # Ensure we don't make all words emojis
            # Add emoji to word
            word = draw(st.text(
                alphabet=st.characters(whitelist_categories=('Lu', 'Ll')),
                min_size=3,
                max_size=8
            ))
            emoji = draw(st.sampled_from(['🎉', '😀', '💻', '📱', '🚀', '✨', '🔥', '💡']))
            words.append(f"{word}{emoji}")
        else:
            # Regular word
            word = draw(st.text(
                alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd')),
                min_size=2,
                max_size=12
            ).filter(lambda x: x.strip()))
            words.append(word)
    
    return ' '.join(words)


class TestExpertiseSummaryValidation:
    """
    Property 5: Expertise summary word count validation
    Validates: Requirements 2.3
    """
    
    @given(valid_word_count_summary())
    def test_valid_word_count_summaries_accepted(self, valid_summary):
        """For any summary with 80-120 words, expertise model should accept it"""
        try:
            expertise = ExpertiseModel(summary=valid_summary)
            word_count = len(valid_summary.split())
            assert 80 <= word_count <= 120
            assert expertise.summary == valid_summary
        except ValidationError:
            word_count = len(valid_summary.split())
            pytest.fail(f"Valid summary with {word_count} words was rejected: {valid_summary[:100]}...")
    
    @given(invalid_word_count_summary())
    def test_invalid_word_count_summaries_rejected(self, invalid_summary):
        """For any summary outside 80-120 word range, expertise model should reject it"""
        word_count = len(invalid_summary.split())
        
        with pytest.raises(ValidationError) as exc_info:
            ExpertiseModel(summary=invalid_summary)
        
        # Verify the error message mentions word count
        error_message = str(exc_info.value)
        assert "word" in error_message.lower()
        assert str(word_count) in error_message
    
    @given(summary_with_emojis())
    def test_summaries_with_emojis_rejected(self, emoji_summary):
        """For any summary containing emojis, expertise model should reject it"""
        with pytest.raises(ValidationError) as exc_info:
            ExpertiseModel(summary=emoji_summary)
        
        # Verify the error message mentions emojis/icons/graphics
        error_message = str(exc_info.value)
        assert any(word in error_message.lower() for word in ['emoji', 'icon', 'graphic'])
    
    def test_boundary_word_counts(self):
        """Test exact boundary conditions for word count validation"""
        # Exactly 80 words should be valid
        words_80 = ' '.join(['word'] * 80)
        expertise_80 = ExpertiseModel(summary=words_80)
        assert len(expertise_80.summary.split()) == 80
        
        # Exactly 120 words should be valid
        words_120 = ' '.join(['word'] * 120)
        expertise_120 = ExpertiseModel(summary=words_120)
        assert len(expertise_120.summary.split()) == 120
        
        # 79 words should be invalid
        words_79 = ' '.join(['word'] * 79)
        with pytest.raises(ValidationError):
            ExpertiseModel(summary=words_79)
        
        # 121 words should be invalid
        words_121 = ' '.join(['word'] * 121)
        with pytest.raises(ValidationError):
            ExpertiseModel(summary=words_121)
    
    def test_empty_summary_rejected(self):
        """Empty summaries should be rejected"""
        with pytest.raises(ValidationError):
            ExpertiseModel(summary="")
        
        with pytest.raises(ValidationError):
            ExpertiseModel(summary="   ")  # Only whitespace
    
    def test_word_count_calculation_accuracy(self):
        """Verify word count calculation handles various spacing correctly"""
        # Multiple spaces between words should still count correctly
        summary_multi_space = "This  is   a    test summary with multiple spaces between words. " * 10
        summary_multi_space = summary_multi_space.strip()
        
        # Count words manually
        actual_word_count = len(summary_multi_space.split())
        
        if 80 <= actual_word_count <= 120:
            # Should be accepted
            expertise = ExpertiseModel(summary=summary_multi_space)
            assert expertise.summary == summary_multi_space
        else:
            # Should be rejected
            with pytest.raises(ValidationError):
                ExpertiseModel(summary=summary_multi_space)