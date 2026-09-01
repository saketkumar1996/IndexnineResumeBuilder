import uuid

from fastapi.testclient import TestClient

from core.db import init_db
from core.passwords import hash_password, verify_password
from main import app

init_db()
client = TestClient(app)


def test_hash_password_verifies_and_is_not_plaintext():
    stored = hash_password("correct horse")
    assert stored != "correct horse"
    assert verify_password("correct horse", stored)
    assert not verify_password("wrong password", stored)


def test_register_login_me_and_logout():
    email = f"custom-{uuid.uuid4().hex[:10]}@example.com"
    password = "password1"

    register = client.post("/api/auth/register", json={"name": "Ada Lovelace", "email": email, "password": password})
    assert register.status_code == 200, register.text
    body = register.json()
    assert body["email"] == email
    assert body["name"] == "Ada Lovelace"
    assert body["provider"] == "local"
    assert "password_hash" not in body
    assert client.cookies.get("indexnine_session")

    me = client.get("/api/auth/me")
    assert me.status_code == 200
    assert me.json()["email"] == email

    client.post("/api/auth/logout")
    assert client.get("/api/auth/me").status_code == 401

    bad = client.post("/api/auth/login", json={"email": email, "password": "wrong-password"})
    assert bad.status_code == 401

    login = client.post("/api/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200
    assert login.json()["email"] == email
    assert client.get("/api/auth/me").status_code == 200


def test_register_rejects_duplicate_email():
    payload = {
        "name": "Grace Hopper",
        "email": f"hopper-{uuid.uuid4().hex[:10]}@example.com",
        "password": "password1",
    }
    first = client.post("/api/auth/register", json=payload)
    assert first.status_code == 200, first.text
    duplicate = client.post("/api/auth/register", json=payload)
    assert duplicate.status_code == 409


def test_register_rejects_short_password_and_invalid_email():
    short = client.post("/api/auth/register", json={"email": "ok@example.com", "password": "short"})
    assert short.status_code == 400
    invalid = client.post("/api/auth/register", json={"email": "not-an-email", "password": "password1"})
    assert invalid.status_code == 400


def test_linkedin_oauth_routes_are_removed():
    assert client.get("/api/linkedin/auth").status_code == 404
    assert client.get("/api/linkedin/callback").status_code == 404
