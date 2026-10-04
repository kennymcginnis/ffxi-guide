#!/usr/bin/env python3
"""Validate the published Docsify content graph and task catalog."""

import re
import sys
from collections import Counter
from pathlib import Path
from urllib.parse import unquote, urlsplit

TASK_MARKER = re.compile(r'data-task-id=["\']([^"\']+)["\']')
DASHBOARD_TASK = re.compile(r'data-progress-task-id=["\']([^"\']+)["\']')
CATALOG_TASK = re.compile(r"\bid:\s*['\"]([^'\"]+)['\"]")
MARKDOWN_LINK = re.compile(r"(?<!!)\[[^\]]+\]\(([^)]+)\)")


def _markdown_target_exists(docs_root: Path, source: Path, raw_target: str) -> bool:
    target = raw_target.strip().split(maxsplit=1)[0].strip("<>")
    parts = urlsplit(target)
    if parts.scheme or target.startswith("#"):
        return True

    path_text = unquote(parts.path)
    if not path_text:
        return True
    candidate = docs_root / path_text.lstrip("/") if path_text.startswith("/") else source.parent / path_text
    candidates = [candidate]
    if candidate.suffix == "":
        candidates.extend((candidate.with_suffix(".md"), candidate / "README.md"))
    return any(path.resolve().is_file() for path in candidates)


def validate_site(docs_root: Path, catalog_path: Path) -> list[str]:
    docs_root = Path(docs_root).resolve()
    catalog_path = Path(catalog_path).resolve()
    errors = []

    try:
        catalog_text = catalog_path.read_text(encoding="utf-8")
    except OSError as error:
        return [f"cannot read task catalog: {error}"]

    catalog_ids = CATALOG_TASK.findall(catalog_text)
    for task_id, count in Counter(catalog_ids).items():
        if count > 1:
            errors.append(f"duplicate catalog task id '{task_id}'")
    known_ids = set(catalog_ids)

    markers = []
    dashboard_references = []
    for path in sorted(docs_root.rglob("*.md")):
        text = path.read_text(encoding="utf-8")
        relative = path.relative_to(docs_root)
        is_guide_content = "superpowers" not in relative.parts and "research" not in relative.parts
        if is_guide_content:
            markers.extend(TASK_MARKER.findall(text))
            dashboard_references.extend(DASHBOARD_TASK.findall(text))
        for raw_target in MARKDOWN_LINK.findall(text):
            target = raw_target.strip().split(maxsplit=1)[0].strip("<>")
            if relative.name == "_sidebar.md":
                parts = urlsplit(target)
                if not parts.scheme and not target.startswith(("/", "#")):
                    errors.append(
                        f"_sidebar.md: Docsify route '{target}' must start with '/'"
                    )
            if not _markdown_target_exists(docs_root, path, raw_target):
                errors.append(f"{relative}: missing target '{target}'")

    marker_counts = Counter(markers)
    for task_id, count in marker_counts.items():
        if count > 1:
            errors.append(f"duplicate task id '{task_id}'")
        if task_id not in known_ids:
            errors.append(f"Markdown marker '{task_id}' is missing from the catalog")
    for task_id in catalog_ids:
        if marker_counts[task_id] == 0:
            errors.append(f"catalog task '{task_id}' has no Markdown marker")
    for task_id in dashboard_references:
        if task_id not in known_ids:
            errors.append(f"dashboard references unknown task '{task_id}'")

    return errors


def main() -> int:
    repo_root = Path(__file__).resolve().parents[1]
    docs_root = repo_root / "docs"
    errors = validate_site(docs_root, docs_root / "assets" / "task-catalog.js")
    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        return 1
    print("Site integrity checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
