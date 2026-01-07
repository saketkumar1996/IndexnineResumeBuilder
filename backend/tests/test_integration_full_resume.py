"""
Integration tests for complete resume validation and processing
Tests end-to-end validation, API integration, and template rendering
"""

import pytest
from fastapi.testclient import TestClient
from main import app
from models.resume_models import ResumeModel

client = TestClient(app)


class TestFullResumeIntegration:
    """Integration tests for complete resume processing"""
    
    @pytest.fixture
    def valid_complete_resume(self):
        """Complete valid resume data for testing"""
        return {
            "header": {
                "name": "Jane Smith",
                "title": "Senior Full Stack Developer",
                "email": "jane.smith@example.com",
                "phone": "+1 (555) 987-6543",
                "location": "Seattle, WA"
            },
            "expertise": {
                "summary": "Highly skilled full stack developer with over 8 years of experience in designing and implementing scalable web applications. Expertise in modern JavaScript frameworks, cloud technologies, and microservices architecture. Proven track record of leading development teams and delivering high-quality software solutions. Strong background in agile methodologies, test-driven development, and DevOps practices. Passionate about clean code, performance optimization, and user experience. Experienced in working with cross-functional teams to translate business requirements into technical solutions. Committed to continuous learning and staying current with emerging technologies and industry best practices."
            },
            "skills": {
                "skills": "JavaScript, TypeScript, React, Node.js, Python, Django, AWS, Docker, Kubernetes, PostgreSQL, MongoDB, Redis, GraphQL, REST APIs, Git, Jenkins, Terraform"
            },
            "experience": [
                {
                    "company": "TechCorp Solutions",
                    "position": "Senior Full Stack Developer",
                    "start_date": "MAR 2020",
                    "end_date": "Present",
                    "responsibilities": [
                        "Led development of microservices architecture serving 500K+ daily active users",
                        "Mentored team of 5 junior developers and established code review processes",
                        "Implemented CI/CD pipelines reducing deployment time by 60%",
                        "Architected and built real-time notification system using WebSockets and Redis",
                        "Collaborated with product managers and designers to deliver user-centric features"
                    ]
                },
                {
                    "company": "StartupXYZ",
                    "position": "Full Stack Developer",
                    "start_date": "JUN 2018",
                    "end_date": "FEB 2020",
                    "responsibilities": [
                        "Developed responsive web applications using React and Node.js",
                        "Built RESTful APIs and GraphQL endpoints for mobile and web clients",
                        "Optimized database queries resulting in 40% performance improvement",
                        "Implemented automated testing achieving 90% code coverage"
                    ]
                }
            ],
            "projects": [
                {
                    "name": "E-commerce Platform Redesign",
                    "description": "Led complete redesign of e-commerce platform handling $2M+ monthly transactions. Implemented modern React architecture with server-side rendering and optimized checkout flow.",
                    "technologies": "React, Next.js, Node.js, PostgreSQL, Redis, AWS",
                    "start_date": "JAN 2021",
                    "end_date": "JUN 2021"
                },
                {
                    "name": "Real-time Analytics Dashboard",
                    "description": "Built comprehensive analytics dashboard providing real-time insights into user behavior and system performance. Integrated with multiple data sources and APIs.",
                    "technologies": "Vue.js, Python, FastAPI, InfluxDB, Docker",
                    "start_date": "SEP 2020",
                    "end_date": "DEC 2020"
                }
            ],
            "education": [
                {
                    "institution": "University of Washington",
                    "degree": "Master of Science",
                    "field_of_study": "Computer Science",
                    "graduation_date": "JUN 2018",
                    "gpa": "3.9"
                },
                {
                    "institution": "Seattle University",
                    "degree": "Bachelor of Science",
                    "field_of_study": "Software Engineering",
                    "graduation_date": "MAY 2016",
                    "gpa": "3.7"
                }
            ],
            "awards": [
                {
                    "title": "Employee of the Year",
                    "organization": "TechCorp Solutions",
                    "date": "DEC 2022",
                    "description": "Recognized for outstanding technical leadership and project delivery"
                },
                {
                    "title": "Best Innovation Award",
                    "organization": "StartupXYZ",
                    "date": "NOV 2019",
                    "description": "Awarded for developing breakthrough real-time features"
                }
            ]
        }
    
    @pytest.fixture
    def invalid_resume_multiple_errors(self):
        """Resume with multiple validation errors for testing"""
        return {
            "header": {
                "name": "John Doe 🎉",  # Contains emoji
                "title": "",  # Empty required field
                "email": "invalid-email",  # Invalid format
                "phone": "123",  # Invalid format
                "location": "San Francisco, CA"
            },
            "expertise": {
                "summary": "Too short summary"  # < 80 words
            },
            "skills": {
                "skills": "Python JavaScript React"  # No commas
            },
            "experience": [
                {
                    "company": "Tech Corp",
                    "position": "Developer",
                    "start_date": "January 2020",  # Invalid date format
                    "end_date": "Present",
                    "responsibilities": [
                        "Only one responsibility"  # < 3 responsibilities
                    ]
                }
            ],
            "projects": [],  # Empty required section
            "education": []   # Empty required section
        }
    
    def test_complete_valid_resume_validation(self, valid_complete_resume):
        """Test that a complete valid resume passes all validation"""
        # Test Pydantic model validation
        resume_model = ResumeModel(**valid_complete_resume)
        assert resume_model.header.name == "Jane Smith"
        assert len(resume_model.experience) == 2
        assert len(resume_model.projects) == 2
        assert len(resume_model.education) == 2
        assert len(resume_model.awards) == 2
        
        # Test API validation endpoint
        response = client.post("/api/validate", json=valid_complete_resume)
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True
        assert data["errors"] is None
        assert data["data"] is not None
    
    def test_complete_valid_resume_preview_generation(self, valid_complete_resume):
        """Test that valid resume generates proper HTML preview"""
        response = client.post("/api/preview", json=valid_complete_resume)
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True
        assert data["errors"] is None
        
        html_content = data["html"]
        # Verify key content is present in HTML
        assert "Jane Smith" in html_content
        assert "Senior Full Stack Developer" in html_content
        assert "TechCorp Solutions" in html_content
        assert "University of Washington" in html_content
        assert "E-commerce Platform Redesign" in html_content
        assert "Employee of the Year" in html_content
    
    def test_invalid_resume_comprehensive_error_reporting(self, invalid_resume_multiple_errors):
        """Test that invalid resume returns comprehensive error information"""
        response = client.post("/api/validate", json=invalid_resume_multiple_errors)
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False
        assert data["errors"] is not None
        assert len(data["errors"]) > 5  # Multiple validation errors
        
        # Check for specific error types
        error_messages = [error["message"].lower() for error in data["errors"]]
        error_types = set()
        
        for error in data["errors"]:
            if "emoji" in error["message"].lower():
                error_types.add("emoji")
            elif "word" in error["message"].lower():
                error_types.add("word_count")
            elif "email" in error["message"].lower():
                error_types.add("email_format")
            elif "comma" in error["message"].lower():
                error_types.add("comma_separated")
            elif "date" in error["message"].lower():
                error_types.add("date_format")
            elif "responsibilities" in error["message"].lower():
                error_types.add("responsibilities")
            elif "empty" in error["message"].lower():
                error_types.add("empty_section")
        
        # Should have multiple types of errors
        assert len(error_types) >= 4
    
    def test_invalid_resume_blocks_export(self, invalid_resume_multiple_errors):
        """Test that invalid resume blocks DOCX export"""
        response = client.post("/api/export", json=invalid_resume_multiple_errors)
        assert response.status_code == 422
        data = response.json()
        assert "validation failed" in data["detail"]["message"].lower()
        assert "errors" in data["detail"]
    
    def test_partial_resume_data_handling(self):
        """Test handling of partial resume data during form completion"""
        partial_resume = {
            "header": {
                "name": "John Doe",
                "title": "Software Engineer",
                "email": "john@example.com",
                "phone": "+1 555-123-4567",
                "location": "San Francisco, CA"
            },
            "expertise": {
                "summary": "Experienced software engineer with expertise in web development and cloud technologies. Skilled in multiple programming languages and frameworks. Strong problem-solving abilities and excellent communication skills. Passionate about creating efficient and scalable solutions. Committed to continuous learning and professional development. Proven track record of successful project delivery. Collaborative team player with leadership experience. Dedicated to writing clean and maintainable code. Experienced in agile development methodologies and best practices. Always eager to take on new challenges and learn emerging technologies."
            },
            "skills": {
                "skills": "Python, JavaScript, React, Node.js"
            }
            # Missing required sections: experience, projects, education
        }
        
        response = client.post("/api/validate", json=partial_resume)
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False
        assert data["errors"] is not None
        
        # Should have errors for missing required sections
        error_fields = [error["field"] for error in data["errors"]]
        assert any("experience" in field for field in error_fields)
        assert any("projects" in field for field in error_fields)
        assert any("education" in field for field in error_fields)
    
    def test_resume_with_optional_fields_omitted(self):
        """Test resume validation with optional fields omitted"""
        resume_no_awards = {
            "header": {
                "name": "Alice Johnson",
                "title": "Backend Developer",
                "email": "alice@example.com",
                "phone": "+1 555-999-8888",
                "location": "Portland, OR"
            },
            "expertise": {
                "summary": "Dedicated backend developer with 5 years of experience building robust and scalable server-side applications. Proficient in Python, Java, and database design. Strong understanding of microservices architecture and cloud platforms. Experienced in API development and integration. Skilled in performance optimization and system monitoring. Committed to writing clean, testable code and following best practices. Excellent problem-solving skills and attention to detail. Collaborative team member with strong communication abilities. Passionate about learning new technologies and improving system efficiency. Always eager to tackle new challenges and deliver high-quality solutions."
            },
            "skills": {
                "skills": "Python, Java, PostgreSQL, Redis, Docker, AWS, REST APIs"
            },
            "experience": [
                {
                    "company": "DataTech Inc",
                    "position": "Backend Developer",
                    "start_date": "JAN 2019",
                    "end_date": "Present",
                    "responsibilities": [
                        "Developed and maintained RESTful APIs serving millions of requests",
                        "Optimized database performance and implemented caching strategies",
                        "Built automated deployment pipelines and monitoring systems"
                    ]
                }
            ],
            "projects": [
                {
                    "name": "Payment Processing System",
                    "description": "Built secure payment processing system handling thousands of transactions daily",
                    "technologies": "Python, PostgreSQL, Redis, Docker",
                    "start_date": "MAR 2020",
                    "end_date": "AUG 2020"
                }
            ],
            "education": [
                {
                    "institution": "Oregon State University",
                    "degree": "Bachelor of Science",
                    "field_of_study": "Computer Science",
                    "graduation_date": "DEC 2018"
                }
            ]
            # No awards section (optional)
        }
        
        # Should validate successfully without awards
        resume_model = ResumeModel(**resume_no_awards)
        assert resume_model.awards == []
        
        response = client.post("/api/validate", json=resume_no_awards)
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True
        assert data["errors"] is None
    
    def test_resume_field_length_constraints(self):
        """Test that field length constraints are properly enforced"""
        resume_with_long_fields = {
            "header": {
                "name": "A" * 101,  # Exceeds 100 char limit
                "title": "B" * 151,  # Exceeds 150 char limit
                "email": "test@example.com",
                "phone": "+1 555-123-4567",
                "location": "C" * 101  # Exceeds 100 char limit
            },
            "expertise": {
                "summary": "Valid summary with proper word count. " * 15  # Valid word count
            },
            "skills": {
                "skills": "Python, JavaScript"
            },
            "experience": [
                {
                    "company": "D" * 101,  # Exceeds 100 char limit
                    "position": "E" * 101,  # Exceeds 100 char limit
                    "start_date": "JAN 2020",
                    "end_date": "Present",
                    "responsibilities": ["Task 1", "Task 2", "Task 3"]
                }
            ],
            "projects": [
                {
                    "name": "F" * 101,  # Exceeds 100 char limit
                    "description": "G" * 501,  # Exceeds 500 char limit
                    "technologies": "Python",
                    "start_date": "JAN 2020",
                    "end_date": "DEC 2020"
                }
            ],
            "education": [
                {
                    "institution": "H" * 101,  # Exceeds 100 char limit
                    "degree": "I" * 101,  # Exceeds 100 char limit
                    "field_of_study": "J" * 101,  # Exceeds 100 char limit
                    "graduation_date": "MAY 2020",
                    "gpa": "K" * 11  # Exceeds 10 char limit
                }
            ]
        }
        
        response = client.post("/api/validate", json=resume_with_long_fields)
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False
        assert data["errors"] is not None
        
        # Should have multiple length constraint violations
        error_messages = [error["message"].lower() for error in data["errors"]]
        length_errors = [msg for msg in error_messages if "length" in msg or "characters" in msg or "char" in msg]
        assert len(length_errors) > 5