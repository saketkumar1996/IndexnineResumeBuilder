from copy import deepcopy
from typing import Any, Dict, List


MONTHS = {
    "jan": "JAN", "january": "JAN",
    "feb": "FEB", "february": "FEB",
    "mar": "MAR", "march": "MAR",
    "apr": "APR", "april": "APR",
    "may": "MAY",
    "jun": "JUN", "june": "JUN",
    "jul": "JUL", "july": "JUL",
    "aug": "AUG", "august": "AUG",
    "sep": "SEP", "sept": "SEP", "september": "SEP",
    "oct": "OCT", "october": "OCT",
    "nov": "NOV", "november": "NOV",
    "dec": "DEC", "december": "DEC",
}


def _date(value: Any, fallback_month: str = "JAN") -> str:
    raw = str(value or "").strip()
    if not raw:
        return ""
    if raw.lower() == "present":
        return "Present"
    parts = raw.replace("/", " ").replace("-", " ").split()
    if len(parts) >= 2:
        month = MONTHS.get(parts[0].lower(), parts[0].upper()[:3])
        year = parts[-1]
        if year.isdigit() and len(year) == 4:
            return f"{month} {year}"
    if raw.isdigit() and len(raw) == 4:
        return f"{fallback_month} {raw}"
    return raw.upper()


def _non_empty_list(values: Any) -> List[str]:
    if not isinstance(values, list):
        return []
    return [str(v).strip() for v in values if str(v or "").strip()]


def normalize_resume_input(data: Dict[str, Any]) -> Dict[str, Any]:
    """Accept either frontend ResumeData or backend ResumeModel shape."""
    source = deepcopy(data or {})
    header = source.get("header") or {}

    normalized = {
        "header": {
            "name": header.get("name") or header.get("fullName") or "",
            "title": header.get("title") or header.get("designation") or "",
            "email": header.get("email") or "",
            "phone": header.get("phone") or "",
            "location": header.get("location") or "",
        },
        "expertise": source.get("expertise") or {"summary": ""},
        "skills": source.get("skills") or {"skills": ""},
        "experience": [],
        "projects": [],
        "education": [],
        "awards": [],
    }

    experiences = source.get("experience") if "experience" in source else source.get("experiences", [])
    for exp in experiences or []:
        responsibilities = _non_empty_list(exp.get("responsibilities"))
        normalized["experience"].append({
            "company": exp.get("company") or "",
            "position": exp.get("position") or exp.get("title") or "",
            "start_date": _date(exp.get("start_date") or exp.get("startDate")),
            "end_date": _date(exp.get("end_date") or exp.get("endDate")) or None,
            "responsibilities": responsibilities,
        })

    for project in source.get("projects") or []:
        normalized["projects"].append({
            "name": project.get("name") or "",
            "description": project.get("description") or "",
            "technologies": project.get("technologies") or "",
            "start_date": _date(project.get("start_date") or project.get("startDate") or "JAN 2024"),
            "end_date": _date(project.get("end_date") or project.get("endDate")) or None,
        })

    for edu in source.get("education") or []:
        normalized["education"].append({
            "institution": edu.get("institution") or "",
            "degree": edu.get("degree") or "",
            "field_of_study": edu.get("field_of_study") or edu.get("fieldOfStudy") or edu.get("location") or "General",
            "graduation_date": _date(edu.get("graduation_date") or edu.get("graduationDate") or edu.get("endYear"), fallback_month="MAY"),
            "gpa": edu.get("gpa") or None,
        })

    for award in source.get("awards") or []:
        normalized["awards"].append({
            "title": award.get("title") or "",
            "organization": award.get("organization") or "",
            "date": _date(award.get("date") or award.get("year"), fallback_month="JAN"),
            "description": award.get("description") or None,
        })

    return normalized


def resume_text(data: Dict[str, Any]) -> str:
    header = data.get("header", {})
    parts = [
        header.get("fullName") or header.get("name") or "",
        header.get("designation") or header.get("title") or "",
        data.get("expertise", {}).get("summary", ""),
        data.get("skills", {}).get("skills", ""),
    ]
    for exp in data.get("experiences") or data.get("experience") or []:
        parts.extend([
            exp.get("company", ""),
            exp.get("title") or exp.get("position") or "",
            " ".join(_non_empty_list(exp.get("responsibilities"))),
        ])
    for project in data.get("projects") or []:
        parts.extend([
            project.get("name", ""),
            project.get("description", ""),
            project.get("technologies", ""),
            " ".join(_non_empty_list(project.get("responsibilities"))),
        ])
    return "\n".join(str(part) for part in parts if part)
