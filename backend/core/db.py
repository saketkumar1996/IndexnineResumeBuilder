import json
import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional


DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
SQLITE_PATH = Path(os.getenv("SQLITE_PATH", "indexnine_resume_builder.db"))


def _is_postgres() -> bool:
    return DATABASE_URL.startswith("postgres://") or DATABASE_URL.startswith("postgresql://")


def _connect():
    if _is_postgres():
        import psycopg
        from psycopg.rows import dict_row

        return psycopg.connect(DATABASE_URL, row_factory=dict_row)

    conn = sqlite3.connect(SQLITE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@contextmanager
def get_db():
    conn = _connect()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def _placeholder() -> str:
    return "%s" if _is_postgres() else "?"


def _row_to_dict(row: Any) -> Optional[Dict[str, Any]]:
    if row is None:
        return None
    return dict(row)


def _execute(conn, sql: str, params: Iterable[Any] = ()):
    cur = conn.cursor()
    cur.execute(sql, tuple(params))
    return cur


def _fetchone(conn, sql: str, params: Iterable[Any] = ()) -> Optional[Dict[str, Any]]:
    return _row_to_dict(_execute(conn, sql, params).fetchone())


def _fetchall(conn, sql: str, params: Iterable[Any] = ()) -> List[Dict[str, Any]]:
    return [dict(row) for row in _execute(conn, sql, params).fetchall()]


def _json_load(value: Any, fallback: Any = None) -> Any:
    if value is None:
        return fallback
    if isinstance(value, (dict, list)):
        return value
    try:
        return json.loads(value)
    except (TypeError, json.JSONDecodeError):
        return fallback


def _json_dump(value: Any) -> str:
    return json.dumps(value, separators=(",", ":"), ensure_ascii=False)


def _json_param(value: Any) -> Any:
    if _is_postgres():
        from psycopg.types.json import Jsonb

        return Jsonb(value)
    return _json_dump(value)


def init_db():
    with get_db() as conn:
        if _is_postgres():
            _execute(conn, """
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    linkedin_sub TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL DEFAULT '',
                    email TEXT NOT NULL DEFAULT '',
                    picture TEXT NOT NULL DEFAULT '',
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            """)
            _execute(conn, """
                CREATE TABLE IF NOT EXISTS resumes (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    title TEXT NOT NULL DEFAULT 'Untitled Resume',
                    template_id TEXT NOT NULL DEFAULT 'indexnine',
                    data_json JSONB NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            """)
            _execute(conn, """
                CREATE TABLE IF NOT EXISTS resume_versions (
                    id SERIAL PRIMARY KEY,
                    resume_id INTEGER NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    version_number INTEGER NOT NULL,
                    label TEXT NOT NULL DEFAULT '',
                    data_json JSONB NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    UNIQUE(resume_id, version_number)
                )
            """)
            _execute(conn, """
                CREATE TABLE IF NOT EXISTS cover_letters (
                    id SERIAL PRIMARY KEY,
                    resume_id INTEGER NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    job_description TEXT NOT NULL,
                    content TEXT NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            """)
        else:
            _execute(conn, """
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    linkedin_sub TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL DEFAULT '',
                    email TEXT NOT NULL DEFAULT '',
                    picture TEXT NOT NULL DEFAULT '',
                    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            """)
            _execute(conn, """
                CREATE TABLE IF NOT EXISTS resumes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    title TEXT NOT NULL DEFAULT 'Untitled Resume',
                    template_id TEXT NOT NULL DEFAULT 'indexnine',
                    data_json TEXT NOT NULL,
                    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            """)
            _execute(conn, """
                CREATE TABLE IF NOT EXISTS resume_versions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    resume_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    version_number INTEGER NOT NULL,
                    label TEXT NOT NULL DEFAULT '',
                    data_json TEXT NOT NULL,
                    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(resume_id, version_number),
                    FOREIGN KEY(resume_id) REFERENCES resumes(id) ON DELETE CASCADE,
                    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            """)
            _execute(conn, """
                CREATE TABLE IF NOT EXISTS cover_letters (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    resume_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    job_description TEXT NOT NULL,
                    content TEXT NOT NULL,
                    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(resume_id) REFERENCES resumes(id) ON DELETE CASCADE,
                    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            """)


def upsert_linkedin_user(profile: Dict[str, Any]) -> Dict[str, Any]:
    sub = str(profile.get("sub") or profile.get("id") or profile.get("email") or "").strip()
    if not sub:
        raise ValueError("LinkedIn profile did not include a stable identity.")

    name = profile.get("name") or f"{profile.get('given_name', '')} {profile.get('family_name', '')}".strip()
    email = profile.get("email") or ""
    picture = profile.get("picture") or profile.get("pictureUrl") or ""
    p = _placeholder()

    with get_db() as conn:
        existing = _fetchone(conn, f"SELECT * FROM users WHERE linkedin_sub = {p}", [sub])
        if existing:
            _execute(
                conn,
                f"UPDATE users SET name = {p}, email = {p}, picture = {p}, updated_at = CURRENT_TIMESTAMP WHERE id = {p}",
                [name, email, picture, existing["id"]],
            )
            return get_user_by_id(int(existing["id"]), conn=conn)

        cur = _execute(
            conn,
            f"INSERT INTO users (linkedin_sub, name, email, picture) VALUES ({p}, {p}, {p}, {p})",
            [sub, name, email, picture],
        )
        user_id = getattr(cur, "lastrowid", None)
        if _is_postgres():
            row = _fetchone(conn, "SELECT currval(pg_get_serial_sequence('users','id')) AS id")
            user_id = row["id"]
        return get_user_by_id(int(user_id), conn=conn)


def get_user_by_id(user_id: int, conn=None) -> Optional[Dict[str, Any]]:
    p = _placeholder()
    if conn is not None:
        return _fetchone(conn, f"SELECT * FROM users WHERE id = {p}", [user_id])
    with get_db() as db:
        return _fetchone(db, f"SELECT * FROM users WHERE id = {p}", [user_id])


def list_resumes(user_id: int) -> List[Dict[str, Any]]:
    p = _placeholder()
    with get_db() as conn:
        rows = _fetchall(conn, f"SELECT * FROM resumes WHERE user_id = {p} ORDER BY updated_at DESC", [user_id])
    for row in rows:
        row["data"] = _json_load(row.pop("data_json"), {})
    return rows


def create_resume(user_id: int, title: str, template_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    p = _placeholder()
    with get_db() as conn:
        cur = _execute(
            conn,
            f"INSERT INTO resumes (user_id, title, template_id, data_json) VALUES ({p}, {p}, {p}, {p})",
            [user_id, title or "Untitled Resume", template_id or "indexnine", _json_param(data)],
        )
        resume_id = getattr(cur, "lastrowid", None)
        if _is_postgres():
            row = _fetchone(conn, "SELECT currval(pg_get_serial_sequence('resumes','id')) AS id")
            resume_id = row["id"]
        return get_resume(user_id, int(resume_id), conn=conn)


def get_resume(user_id: int, resume_id: int, conn=None) -> Optional[Dict[str, Any]]:
    p = _placeholder()
    sql = f"SELECT * FROM resumes WHERE user_id = {p} AND id = {p}"
    params = [user_id, resume_id]
    row = _fetchone(conn, sql, params) if conn is not None else None
    if conn is None:
        with get_db() as db:
            row = _fetchone(db, sql, params)
    if row:
        row["data"] = _json_load(row.pop("data_json"), {})
    return row


def update_resume(user_id: int, resume_id: int, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    current = get_resume(user_id, resume_id)
    if not current:
        return None

    title = updates.get("title", current["title"])
    template_id = updates.get("templateId", updates.get("template_id", current["template_id"]))
    data = updates.get("data", current["data"])
    p = _placeholder()
    with get_db() as conn:
        _execute(
            conn,
            f"UPDATE resumes SET title = {p}, template_id = {p}, data_json = {p}, updated_at = CURRENT_TIMESTAMP WHERE user_id = {p} AND id = {p}",
            [title, template_id, _json_param(data), user_id, resume_id],
        )
        return get_resume(user_id, resume_id, conn=conn)


def delete_resume(user_id: int, resume_id: int) -> bool:
    p = _placeholder()
    with get_db() as conn:
        cur = _execute(conn, f"DELETE FROM resumes WHERE user_id = {p} AND id = {p}", [user_id, resume_id])
        return cur.rowcount > 0


def create_resume_version(user_id: int, resume_id: int, label: str = "") -> Optional[Dict[str, Any]]:
    resume = get_resume(user_id, resume_id)
    if not resume:
        return None
    p = _placeholder()
    with get_db() as conn:
        latest = _fetchone(
            conn,
            f"SELECT COALESCE(MAX(version_number), 0) AS version_number FROM resume_versions WHERE user_id = {p} AND resume_id = {p}",
            [user_id, resume_id],
        )
        version_number = int(latest["version_number"]) + 1
        cur = _execute(
            conn,
            f"INSERT INTO resume_versions (resume_id, user_id, version_number, label, data_json) VALUES ({p}, {p}, {p}, {p}, {p})",
            [resume_id, user_id, version_number, label or f"Version {version_number}", _json_param(resume["data"])],
        )
        version_id = getattr(cur, "lastrowid", None)
        if _is_postgres():
            row = _fetchone(conn, "SELECT currval(pg_get_serial_sequence('resume_versions','id')) AS id")
            version_id = row["id"]
        return get_resume_version(user_id, resume_id, int(version_id), conn=conn)


def list_resume_versions(user_id: int, resume_id: int) -> List[Dict[str, Any]]:
    p = _placeholder()
    with get_db() as conn:
        rows = _fetchall(
            conn,
            f"SELECT * FROM resume_versions WHERE user_id = {p} AND resume_id = {p} ORDER BY version_number DESC",
            [user_id, resume_id],
        )
    for row in rows:
        row["data"] = _json_load(row.pop("data_json"), {})
    return rows


def get_resume_version(user_id: int, resume_id: int, version_id: int, conn=None) -> Optional[Dict[str, Any]]:
    p = _placeholder()
    sql = f"SELECT * FROM resume_versions WHERE user_id = {p} AND resume_id = {p} AND id = {p}"
    params = [user_id, resume_id, version_id]
    row = _fetchone(conn, sql, params) if conn is not None else None
    if conn is None:
        with get_db() as db:
            row = _fetchone(db, sql, params)
    if row:
        row["data"] = _json_load(row.pop("data_json"), {})
    return row


def restore_resume_version(user_id: int, resume_id: int, version_id: int) -> Optional[Dict[str, Any]]:
    version = get_resume_version(user_id, resume_id, version_id)
    if not version:
        return None
    return update_resume(user_id, resume_id, {"data": version["data"]})


def create_cover_letter(user_id: int, resume_id: int, job_description: str, content: str) -> Dict[str, Any]:
    p = _placeholder()
    with get_db() as conn:
        cur = _execute(
            conn,
            f"INSERT INTO cover_letters (resume_id, user_id, job_description, content) VALUES ({p}, {p}, {p}, {p})",
            [resume_id, user_id, job_description, content],
        )
        letter_id = getattr(cur, "lastrowid", None)
        if _is_postgres():
            row = _fetchone(conn, "SELECT currval(pg_get_serial_sequence('cover_letters','id')) AS id")
            letter_id = row["id"]
        return _fetchone(conn, f"SELECT * FROM cover_letters WHERE id = {p}", [letter_id])
