#!/usr/bin/env python3
from __future__ import annotations

import re
import sys
from pathlib import Path


FORBIDDEN_NAMES = {
    "solution",
    "evaluator",
    "tests_hidden",
    "fixtures_hidden",
    "source-dossiers",
    "template.yaml",
    "SOLUTION.md",
    "SOLUTION.md.j2",
    "rubric.md",
}

FORBIDDEN_PATTERNS = [
    re.compile(r"AKIA[0-9A-Z]{16}"),
    re.compile(r"sk-[A-Za-z0-9]{20,}"),
    re.compile(r"OPENAI_API_KEY", re.I),
    re.compile(r"PINECONE_API_KEY", re.I),
    re.compile(r"SUPABASE_SERVICE_ROLE", re.I),
    re.compile(r"GITHUB_TOKEN", re.I),
    re.compile(r"BEGIN (RSA|OPENSSH|EC|DSA) PRIVATE KEY"),
    re.compile(r"customer[_-]?source", re.I),
]


def fail(message: str) -> None:
    print(f"safety_scan_failed: {message}", file=sys.stderr)
    raise SystemExit(1)


def main() -> None:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else "generated/main").resolve()
    if not root.exists():
        fail(f"{root} does not exist")

    for path in root.rglob("*"):
        rel = path.relative_to(root)
        parts = set(rel.parts)
        if path.name in FORBIDDEN_NAMES or parts.intersection(FORBIDDEN_NAMES):
            fail(f"forbidden path leaked into generated main: {rel}")
        if path.is_file():
            if path.name.startswith(".env"):
                fail(f"env file leaked into generated main: {rel}")
            text = path.read_text(errors="ignore")
            for pattern in FORBIDDEN_PATTERNS:
                if pattern.search(text):
                    fail(f"secret/private marker leaked in {rel}: {pattern.pattern}")

    print(f"safety scan passed for {root}")


if __name__ == "__main__":
    main()

