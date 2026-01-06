"""
Unit tests for API endpoints
Tests endpoint responses with valid and invalid data, error handling and status codes
Requirements: 5.2, 7.4
"""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


class TestValidationEndpoint:
    """Test the /api/validate endpoint"""
    
    def test_valid_resume_data_accepted(self):
        """Test that valid resume data is accepted and returns success"""
        valid_resume = {
            "header": {
                "name": "John Doe",
                "title": "Software Engineer",
                "email": "john.doe@example.com",
                "phone": "+1 (555) 123-4567",
                "location": "San Francisco, CA"
            },
            "expertise": {
                "summary": "Experienced software engineer with over 5 years of experience in full-stack development. Proficient in Python, JavaScript, and cloud technologies. Strong background in building scalable web applications and microservices. Passionate about clean code, test-driven development, and agile methodologies. Proven track record of delivering high-quality software solutions on time and within budget. Excellent communication skills and ability to work effectively in cross-functional teams. Committed to continuous learning and staying updated with the latest industry trends and best practices."
            },
            "skills": {
                "skills": "Python, JavaScript, React, Node.js, AWS, Docker, Kubernetes, PostgreSQL, MongoDB"
            },
            "experience": [
                {
                    "company": "Tech Corp",
                    "position": "Senior Software Engineer",
                    "start_date": "JAN 2020",
                    "end_date": "Present",
                    "responsibilities": [
                        "Led development of microservices architecture",
                        "Mentored junior developers and conducted code reviews",
                        "Implemented CI/CD pipelines using Jenkins and Docker"
                    ]
                }
            ],
            "projects": [
                {
                    "name": "E-commerce Platform",
                    "description": "Built a scalable e-commerce platform serving 10k+ users",
                    "technologies": "React, Node.js, PostgreSQL, AWS",
                    "start_date": "MAR 2021",
                    "end_date": "DEC 2021"
                }
            ],
            "education": [
                {
                    "institution": "University of California",
                    "degree": "Bachelor of Science",
                    "field_of_study": "Computer Science",
                    "graduation_date": "MAY 2018",
                    "gpa": "3.8"
                }
            ],
            "awards": []
        }
        
        response = client.post("/api/validate", json=valid_resume)
        
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True
        assert data["errors"] is None
        assert data["data"] is not None
    
    def test_invalid_resume_data_rejected(self):
        """Test that invalid resume data is rejected with proper error messages"""
        invalid_resume = {
            "header": {
                "name": "John Doe",
                "title": "Software Engineer",
                "email": "invalid-email",  # Invalid email format
                "phone": "+1 (555) 123-4567",
                "location": "San Francisco, CA"
            },
            "expertise": {
                "summary": "Too short"  # Invalid word count (< 80 words)
            },
            "skills": {
                "skills": "Python JavaScript React"  # Missing comma separation
            },
            "experience": [
                {
                    "company": "Tech Corp",
                    "position": "Senior Software Engineer",
                    "start_date": "January 2020",  # Invalid date format
                    "end_date": "Present",
                    "responsibilities": [
                        "Only one responsibility"  # Less than 3 responsibilities
                    ]
                }
            ],
            "projects": [],  # Empty required section
            "education": []   # Empty required section
        }
        
        response = client.post("/api/validate", json=invalid_resume)
        
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False
        assert data["errors"] is not None
        assert len(data["errors"]) > 0
        assert data["data"] is None
    
    def test_missing_required_fields_rejected(self):
        """Test that missing required fields are properly rejected"""
        incomplete_resume = {
            "header": {
                "name": "John Doe"
                # Missing required fields
            }
        }
        
        response = client.post("/api/validate", json=incomplete_resume)
        
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False
        assert data["errors"] is not None


class TestPreviewEndpoint:
    """Test the /api/preview endpoint"""
    
    def test_valid_data_generates_preview(self):
        """Test that valid data generates HTML preview"""
        valid_resume = {
            "header": {
                "name": "John Doe",
                "title": "Software Engineer",
                "email": "john.doe@example.com",
                "phone": "+1 (555) 123-4567",
                "location": "San Francisco, CA"
            },
            "expertise": {
                "summary": "Experienced software engineer with over 5 years of experience in full-stack development. Proficient in Python, JavaScript, and cloud technologies. Strong background in building scalable web applications and microservices. Passionate about clean code, test-driven development, and agile methodologies. Proven track record of delivering high-quality software solutions on time and within budget. Excellent communication skills and ability to work effectively in cross-functional teams. Committed to continuous learning and staying updated with the latest industry trends and best practices."
            },
            "skills": {
                "skills": "Python, JavaScript, React, Node.js, AWS, Docker, Kubernetes, PostgreSQL, MongoDB"
            },
            "experience": [
                {
                    "company": "Tech Corp",
                    "position": "Senior Software Engineer",
                    "start_date": "JAN 2020",
                    "end_date": "Present",
                    "responsibilities": [
                        "Led development of microservices architecture",
                        "Mentored junior developers and conducted code reviews",
                        "Implemented CI/CD pipelines using Jenkins and Docker"
                    ]
                }
            ],
            "projects": [
                {
                    "name": "E-commerce Platform",
                    "description": "Built a scalable e-commerce platform serving 10k+ users",
                    "technologies": "React, Node.js, PostgreSQL, AWS",
                    "start_date": "MAR 2021",
                    "end_date": "DEC 2021"
                }
            ],
            "education": [
                {
                    "institution": "University of California",
                    "degree": "Bachelor of Science",
                    "field_of_study": "Computer Science",
                    "graduation_date": "MAY 2018",
                    "gpa": "3.8"
                }
            ],
            "awards": []
        }
        
        response = client.post("/api/preview", json=valid_resume)
        
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True
        assert data["html"] is not None
        assert "John Doe" in data["html"]
        assert "Software Engineer" in data["html"]
        assert data["errors"] is None
    
    def test_invalid_data_returns_error_preview(self):
        """Test that invalid data returns error message instead of preview"""
        invalid_resume = {
            "header": {
                "name": "John Doe",
                "title": "Software Engineer",
                "email": "invalid-email",
                "phone": "+1 (555) 123-4567",
                "location": "San Francisco, CA"
            },
            "expertise": {
                "summary": "Too short"
            }
        }
        
        response = client.post("/api/preview", json=invalid_resume)
        
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False
        assert "error" in data["html"].lower()
        assert data["errors"] is not None


class TestExportEndpoint:
    """Test the /api/export endpoint"""
    
    def test_invalid_data_blocks_export(self):
        """Test that invalid data blocks export with 422 status"""
        invalid_resume = {
            "header": {
                "name": "John Doe",
                "title": "Software Engineer",
                "email": "invalid-email",
                "phone": "+1 (555) 123-4567",
                "location": "San Francisco, CA"
            },
            "expertise": {
                "summary": "Too short"
            }
        }
        
        response = client.post("/api/export", json=invalid_resume)
        
        assert response.status_code == 422
        data = response.json()
        assert "validation failed" in data["detail"]["message"].lower()
        assert "errors" in data["detail"]


class TestHealthEndpoints:
    """Test health and status endpoints"""
    
    def test_root_endpoint(self):
        """Test root endpoint returns API information"""
        response = client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Resume Builder" in data["message"]
    
    def test_health_check_endpoint(self):
        """Test health check endpoint"""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "Indexnine-resume-builder" in data["service"]