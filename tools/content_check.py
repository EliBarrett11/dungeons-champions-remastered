#!/usr/bin/env python3
"""M1 content check (T-009; docs/IMPLEMENTATION/ROADMAP.md, M1 acceptance item 7).

FAILS (exit code 1) on:
  - invalid JSON in any *.json file under docs/;
  - a schema in docs/COMBAT/schemas/ that is not a valid Draft 2020-12 JSON Schema;
  - a template or example that fails validation against its applicable schema
    (or a mapped template/example that is missing, since it cannot be validated).

WARNS, without failing (exit code 0), on content-data issues:
  - missing cross-file references (effect IDs used by abilities; ability and Feat IDs used by
    Champions);
  - ability resolution windows that are not in the effect schema's timing.window enum;
  - templates/examples with no applicable-schema mapping.
  The nine missing IDs and two `attack_commit` mismatches documented in OPEN_QUESTIONS.md are
  labelled KNOWN; anything else is labelled UNEXPECTED and is always printed, never suppressed.

Requires Python 3 and the `jsonschema` package (Draft 2020-12 support, version 4 or later).
Exit code 2 means the check could not run (for example, jsonschema is not installed).

Usage: python3 tools/content_check.py [--root REPOSITORY_ROOT]
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

try:
    from jsonschema import Draft202012Validator
    from jsonschema.exceptions import SchemaError
except ImportError:  # pragma: no cover - depends on the environment
    print("content-check: cannot run: the Python 'jsonschema' package (version 4 or later) is required", file=sys.stderr)
    sys.exit(2)

SCHEMAS_DIR = Path("docs/COMBAT/schemas")

# Applicable schema for each template and example (roadmap M1 acceptance item 7).
APPLICABLE_SCHEMAS: dict[str, str] = {
    "docs/COMBAT/templates/ability-template.json": "ability.schema.json",
    "docs/COMBAT/examples/rogue_critical_passive.json": "ability.schema.json",
    "docs/COMBAT/examples/storm_vanguard.json": "ability.schema.json",
    "docs/COMBAT/templates/champion-combat-template.json": "champion-combat.schema.json",
    "docs/COMBAT/templates/effect-template.json": "effect.schema.json",
}

# Known content-data issues documented in docs/OPEN_QUESTIONS.md ("Schema and content-data issues").
KNOWN_MISSING_IDS = {
    "apply_stagger_on_hit",
    "rogue_resource_on_critical",
    "example_basic_attack",
    "example_passive",
    "example_ultimate",
    "example_feat_a",
    "example_feat_b",
    "example_feat_c",
    "example_feat_d",
}
KNOWN_WINDOW_MISMATCHES = {
    ("docs/COMBAT/templates/ability-template.json", "attack_commit"),
    ("docs/COMBAT/examples/storm_vanguard.json", "attack_commit"),
}


class Report:
    def __init__(self) -> None:
        self.failures: list[str] = []
        self.known: list[str] = []
        self.unexpected: list[str] = []

    def warn(self, known: bool, message: str) -> None:
        (self.known if known else self.unexpected).append(message)


def load_json_files(root: Path, report: Report) -> dict[str, object]:
    documents: dict[str, object] = {}
    for path in sorted((root / "docs").rglob("*.json")):
        relative = path.relative_to(root).as_posix()
        try:
            documents[relative] = json.loads(path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError) as error:
            report.failures.append(f"invalid JSON: {relative}: {error}")
    return documents


def check_schemas(documents: dict[str, object], report: Report) -> dict[str, Draft202012Validator]:
    validators: dict[str, Draft202012Validator] = {}
    prefix = SCHEMAS_DIR.as_posix() + "/"
    for relative, schema in documents.items():
        if not relative.startswith(prefix):
            continue
        name = relative[len(prefix):]
        try:
            Draft202012Validator.check_schema(schema)
            validators[name] = Draft202012Validator(schema)
        except SchemaError as error:
            report.failures.append(f"invalid Draft 2020-12 schema: {relative}: {error.message}")
    return validators


def check_instances(root: Path, documents: dict[str, object], validators: dict[str, Draft202012Validator], report: Report) -> None:
    for relative, schema_name in APPLICABLE_SCHEMAS.items():
        if not (root / relative).exists():
            report.failures.append(f"missing template/example: {relative} (expected to validate against {schema_name})")
            continue
        if relative not in documents:
            continue  # already reported as invalid JSON
        validator = validators.get(schema_name)
        if validator is None:
            report.failures.append(f"cannot validate {relative}: schema {schema_name} is missing or invalid")
            continue
        errors = sorted(validator.iter_errors(documents[relative]), key=lambda e: [str(p) for p in e.absolute_path])
        for error in errors:
            location = "/".join(str(p) for p in error.absolute_path) or "<root>"
            report.failures.append(f"schema validation failed: {relative} against {schema_name}: {location}: {error.message}")

    for relative in documents:
        is_content = relative.startswith("docs/COMBAT/templates/") or relative.startswith("docs/COMBAT/examples/")
        if is_content and relative not in APPLICABLE_SCHEMAS:
            report.warn(False, f"no applicable-schema mapping for {relative}; it was not validated")


def as_dict(value: object) -> dict:
    return value if isinstance(value, dict) else {}


def check_references(documents: dict[str, object], report: Report) -> None:
    def instances_of(schema_name: str) -> list[tuple[str, dict]]:
        return [(f, as_dict(documents[f])) for f, s in APPLICABLE_SCHEMAS.items() if s == schema_name and f in documents]

    abilities = instances_of("ability.schema.json")
    effects = instances_of("effect.schema.json")
    champions = instances_of("champion-combat.schema.json")
    ability_ids = {doc.get("id") for _, doc in abilities}
    effect_ids = {doc.get("id") for _, doc in effects}

    for relative, doc in abilities:
        referenced = list(doc.get("effects", [])) + [as_dict(rule).get("effect_id") for rule in doc.get("trigger_rules", [])]
        for effect_id in dict.fromkeys(referenced):  # unique, in first-seen order
            if effect_id not in effect_ids:
                known = effect_id in KNOWN_MISSING_IDS
                report.warn(known, f"{'KNOWN' if known else 'UNEXPECTED'} missing effect reference: {relative} -> {effect_id}")

    for relative, doc in champions:
        referenced = list(as_dict(doc.get("abilities")).values())
        referenced += [option for milestone in doc.get("feats", []) for option in as_dict(milestone).get("options", [])]
        for ability_id in dict.fromkeys(referenced):
            if ability_id not in ability_ids:
                known = ability_id in KNOWN_MISSING_IDS
                report.warn(known, f"{'KNOWN' if known else 'UNEXPECTED'} missing ability/Feat reference: {relative} -> {ability_id}")

    effect_schema = as_dict(documents.get((SCHEMAS_DIR / "effect.schema.json").as_posix()))
    windows = set(
        as_dict(as_dict(as_dict(as_dict(effect_schema.get("properties")).get("timing")).get("properties")).get("window")).get("enum", [])
    )
    for relative, doc in abilities:
        window = as_dict(doc.get("timing")).get("resolution_window")
        if window is not None and window not in windows:
            known = (relative, window) in KNOWN_WINDOW_MISMATCHES
            report.warn(
                known,
                f"{'KNOWN' if known else 'UNEXPECTED'} resolution-window mismatch: {relative} uses {window!r}, "
                "which is not in effect.schema.json timing.window",
            )


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="M1 content check (T-009).")
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parent.parent, help="repository root")
    args = parser.parse_args(argv)
    root: Path = args.root.resolve()

    report = Report()
    documents = load_json_files(root, report)
    validators = check_schemas(documents, report)
    check_instances(root, documents, validators, report)
    check_references(documents, report)

    print(f"content-check: {len(documents)} JSON file(s) parsed under {root / 'docs'}")
    print(f"\nSchema-validation failures ({len(report.failures)}):")
    for line in report.failures or ["none"]:
        print(f"  {line}")
    print(f"\nKnown content-data warnings ({len(report.known)}) - documented in docs/OPEN_QUESTIONS.md, not failures:")
    for line in report.known or ["none"]:
        print(f"  {line}")
    print(f"\nUnexpected content-data warnings ({len(report.unexpected)}) - not failures under T-009, but need attention:")
    for line in report.unexpected or ["none"]:
        print(f"  {line}")

    passed = not report.failures
    print(f"\nRESULT: {'PASS' if passed else 'FAIL'} ({len(report.failures)} failure(s), "
          f"{len(report.known)} known warning(s), {len(report.unexpected)} unexpected warning(s))")
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
