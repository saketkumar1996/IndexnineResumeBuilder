from core.resume_normalizer import normalize_resume_input


def test_normalize_resume_input_accepts_frontend_shape():
    normalized = normalize_resume_input({
        "header": {
            "fullName": "Asha Rao",
            "designation": "Senior Engineer",
            "email": "asha@example.com",
            "phone": "+1 555 111 2222",
            "location": "Pune",
        },
        "expertise": {
            "summary": " ".join(["experienced"] * 85),
            "bulletPoints": [],
        },
        "skills": {"skills": "React, FastAPI, Postgres"},
        "experiences": [
            {
                "company": "Indexnine",
                "title": "Senior Engineer",
                "location": "Pune",
                "startDate": "Apr 2024",
                "endDate": "Present",
            }
        ],
        "projects": [
            {
                "name": "Resume Builder",
                "description": "SaaS resume builder",
                "technologies": "React, FastAPI",
            }
        ],
        "education": [
            {
                "institution": "University",
                "degree": "B.E.",
                "location": "Computer Science",
                "startYear": "2016",
                "endYear": "2020",
            }
        ],
        "awards": [],
    })

    assert normalized["header"]["name"] == "Asha Rao"
    assert normalized["header"]["title"] == "Senior Engineer"
    assert normalized["experience"][0]["position"] == "Senior Engineer"
    assert normalized["experience"][0]["start_date"] == "APR 2024"
    assert normalized["projects"][0]["start_date"] == "JAN 2024"
    assert normalized["education"][0]["graduation_date"] == "MAY 2020"


def test_date_normalizes_numeric_and_full_month_formats():
    normalized = normalize_resume_input({
        "experiences": [
            {"startDate": "April 2024", "endDate": "current"},
            {"startDate": "04/2023", "endDate": "2023-12"},
        ]
    })

    assert normalized["experience"][0]["start_date"] == "APR 2024"
    assert normalized["experience"][0]["end_date"] == "Present"
    assert normalized["experience"][1]["start_date"] == "APR 2023"
    assert normalized["experience"][1]["end_date"] == "DEC 2023"
