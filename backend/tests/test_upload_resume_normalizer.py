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
