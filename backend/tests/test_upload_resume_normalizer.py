from api.endpoints import _normalize_uploaded_resume_data


def test_project_bullets_fallback_to_description_and_responsibilities():
    normalized = _normalize_uploaded_resume_data({
        "project": {
            "projectName": "Workflow Platform",
            "techStack": "React, Node.js",
            "bullets": [
                "Built a workflow platform for enterprise operations.",
                "Integrated document-aware task routing and comments.",
            ],
        }
    })

    assert normalized["projects"][0]["name"] == "Workflow Platform"
    assert normalized["projects"][0]["description"] == "Built a workflow platform for enterprise operations."
    assert normalized["projects"][0]["technologies"] == "React, Node.js"
    assert normalized["projects"][0]["responsibilities"] == [
        "Integrated document-aware task routing and comments."
    ]


def test_project_description_keeps_all_responsibilities_when_present():
    normalized = _normalize_uploaded_resume_data({
        "projects": [{
            "name": "Rights Management",
            "description": "Secure document workflow platform.",
            "responsibilities": [
                "Implemented watermarking.",
                "Added audit tracking.",
                "Built export controls.",
            ],
        }]
    })

    assert normalized["projects"][0]["description"] == "Secure document workflow platform."
    assert normalized["projects"][0]["responsibilities"] == [
        "Implemented watermarking.",
        "Added audit tracking.",
    ]


def test_experience_responsibilities_are_limited_to_three():
    normalized = _normalize_uploaded_resume_data({
        "experiences": [{
            "company": "Example Co",
            "title": "Engineer",
            "responsibilities": ["One", "Two", "Three", "Four"],
        }]
    })

    assert normalized["experiences"][0]["responsibilities"] == ["One", "Two", "Three"]


def test_experience_dates_are_normalized_to_month_year():
    normalized = _normalize_uploaded_resume_data({
        "experiences": [
            {"company": "A", "startDate": "April 2024", "endDate": "current"},
            {"company": "B", "startDate": "04/2023", "endDate": "2023-12"},
            {"company": "C", "startDate": "Jan 2021 - Present"},
            {"company": "D", "startDate": "2022-08", "endDate": ""},
        ]
    })

    assert normalized["experiences"][0]["startDate"] == "APR 2024"
    assert normalized["experiences"][0]["endDate"] == "Present"
    assert normalized["experiences"][1]["startDate"] == "APR 2023"
    assert normalized["experiences"][1]["endDate"] == "DEC 2023"
    assert normalized["experiences"][2]["startDate"] == "JAN 2021"
    assert normalized["experiences"][2]["endDate"] == "Present"
    assert normalized["experiences"][3]["startDate"] == "AUG 2022"
    assert normalized["experiences"][3]["endDate"] == ""
