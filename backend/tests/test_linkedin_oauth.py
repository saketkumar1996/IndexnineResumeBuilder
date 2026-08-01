from fastapi.testclient import TestClient

from api.linkedin import _build_linkedin_auth_payload
from main import app

client = TestClient(app)


def test_build_linkedin_auth_payload_includes_profile_picture():
    payload = _build_linkedin_auth_payload(
        {
            "name": "Asha Rao",
            "email": "asha@example.com",
            "picture": "https://media.example.com/asha.jpg",
        },
        signed_in_at="2026-05-29T05:00:00+00:00",
    )

    assert payload["profile"] == {
        "provider": "linkedin",
        "name": "Asha Rao",
        "email": "asha@example.com",
        "picture": "https://media.example.com/asha.jpg",
        "signedInAt": "2026-05-29T05:00:00+00:00",
    }
    assert payload["resumeData"]["header"]["fullName"] == "Asha Rao"
    assert payload["resumeData"]["header"]["email"] == "asha@example.com"


def test_build_linkedin_auth_payload_accepts_legacy_picture_shape():
    payload = _build_linkedin_auth_payload(
        {
            "given_name": "Asha",
            "family_name": "Rao",
            "email": "asha@example.com",
            "profilePicture": {
                "displayImage~": {
                    "elements": [
                        {"identifiers": [{"identifier": "https://media.example.com/small.jpg"}]},
                        {"identifiers": [{"identifier": "https://media.example.com/large.jpg"}]},
                    ]
                }
            },
        },
        signed_in_at="2026-05-29T05:00:00+00:00",
    )

    assert payload["profile"]["picture"] == "https://media.example.com/large.jpg"
    assert payload["profile"]["name"] == "Asha Rao"


def test_linkedin_callback_error_redirects_to_signin():
    response = client.get(
        "/api/linkedin/callback?error=access_denied&error_description=Denied%20by%20user&state=indexnine-resume",
        follow_redirects=False,
    )

    assert response.status_code == 302
    assert response.headers["location"] == (
        "http://localhost:3000/signin?"
        "linkedin_error=access_denied&"
        "linkedin_error_description=Denied+by+user&"
        "state=indexnine-resume"
    )
