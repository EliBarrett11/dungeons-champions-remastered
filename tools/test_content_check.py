#!/usr/bin/env python3
"""Tests for tools/content_check.py (T-009). Run with: python3 tools/test_content_check.py

Each case copies the real docs/ tree into a temporary directory, changes one thing, and runs the
checker against that copy with --root, so the repository itself is never modified.
"""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SCRIPT = REPO / "tools" / "content_check.py"

ABILITY_TEMPLATE = "docs/COMBAT/templates/ability-template.json"
EFFECT_TEMPLATE = "docs/COMBAT/templates/effect-template.json"
STORM = "docs/COMBAT/examples/storm_vanguard.json"
ROGUE = "docs/COMBAT/examples/rogue_critical_passive.json"
ABILITY_SCHEMA = "docs/COMBAT/schemas/ability.schema.json"
ROSTER = "content/roster/champions.json"
ROSTER_SCHEMA = "docs/COMBAT/schemas/roster.schema.json"


def run_checker(root: Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run([sys.executable, "-I", str(SCRIPT), "--root", str(root)], capture_output=True, text=True, check=False)


class ContentCheckTest(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.root = Path(self._tmp.name)
        shutil.copytree(REPO / "docs", self.root / "docs")
        shutil.copytree(REPO / "content", self.root / "content")

    def tearDown(self) -> None:
        self._tmp.cleanup()

    def edit_json(self, relative: str, change) -> None:
        path = self.root / relative
        data = json.loads(path.read_text(encoding="utf-8"))
        change(data)
        path.write_text(json.dumps(data, indent=2), encoding="utf-8")

    def assertPasses(self, result: subprocess.CompletedProcess[str]) -> None:
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("RESULT: PASS", result.stdout)

    def assertFails(self, result: subprocess.CompletedProcess[str], *fragments: str) -> None:
        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertIn("RESULT: FAIL", result.stdout)
        for fragment in fragments:
            self.assertIn(fragment, result.stdout)

    # --- passing case and known warnings ---------------------------------------------------

    def test_real_docs_pass_with_exactly_the_known_warnings(self) -> None:
        result = run_checker(REPO)
        self.assertPasses(result)
        self.assertIn("RESULT: PASS (0 failure(s), 11 known warning(s), 0 unexpected warning(s))", result.stdout)
        for missing in [
            "apply_stagger_on_hit", "rogue_resource_on_critical", "example_basic_attack", "example_passive",
            "example_ultimate", "example_feat_a", "example_feat_b", "example_feat_c", "example_feat_d",
        ]:
            self.assertIn(f"-> {missing}", result.stdout)
        self.assertEqual(result.stdout.count("KNOWN resolution-window mismatch"), 2)

    def test_copy_of_docs_behaves_like_the_real_docs(self) -> None:
        self.assertPasses(run_checker(self.root))

    # --- failures (exit code 1) ---------------------------------------------------------------

    def test_malformed_json_fails(self) -> None:
        (self.root / "docs/PACKAGE_MANIFEST.json").write_text('{"package": "broken",', encoding="utf-8")
        self.assertFails(run_checker(self.root), "invalid JSON: docs/PACKAGE_MANIFEST.json")

    def test_malformed_json_anywhere_under_docs_fails(self) -> None:
        (self.root / "docs/GAMEPLAY/new-data.json").write_text("[1, 2,]", encoding="utf-8")
        self.assertFails(run_checker(self.root), "invalid JSON: docs/GAMEPLAY/new-data.json")

    def test_invalid_schema_fails(self) -> None:
        self.edit_json(ABILITY_SCHEMA, lambda s: s.update({"type": 5}))
        result = run_checker(self.root)
        self.assertFails(result, f"invalid Draft 2020-12 schema: {ABILITY_SCHEMA}")
        # Instances that depend on the broken schema are reported as not validatable.
        self.assertIn(f"cannot validate {STORM}: schema ability.schema.json is missing or invalid", result.stdout)

    def test_schema_invalid_example_fails(self) -> None:
        self.edit_json(STORM, lambda d: d.update({"kind": "banana"}))
        self.assertFails(run_checker(self.root), f"schema validation failed: {STORM} against ability.schema.json: kind:")

    def test_schema_invalid_template_fails(self) -> None:
        self.edit_json(EFFECT_TEMPLATE, lambda d: d.pop("operation"))
        self.assertFails(run_checker(self.root), f"schema validation failed: {EFFECT_TEMPLATE} against effect.schema.json")

    def test_missing_mapped_template_fails(self) -> None:
        (self.root / EFFECT_TEMPLATE).unlink()
        self.assertFails(run_checker(self.root), f"missing template/example: {EFFECT_TEMPLATE}")

    def test_missing_roster_fails(self) -> None:
        (self.root / ROSTER).unlink()
        self.assertFails(run_checker(self.root), f"missing roster: {ROSTER}")

    def test_malformed_roster_json_fails(self) -> None:
        (self.root / ROSTER).write_text('{"format": ', encoding="utf-8")
        self.assertFails(run_checker(self.root), f"invalid JSON: {ROSTER}")

    def test_roster_with_unknown_class_fails(self) -> None:
        self.edit_json(ROSTER, lambda d: d["champions"][0].update({"class": "Half-Orc"}))
        self.assertFails(run_checker(self.root), f"schema validation failed: {ROSTER} against roster.schema.json: champions/0/class:")

    def test_roster_with_wrong_size_fails(self) -> None:
        self.edit_json(ROSTER, lambda d: d["champions"].pop())
        self.assertFails(run_checker(self.root), f"schema validation failed: {ROSTER} against roster.schema.json: champions:")

    def test_roster_with_blank_name_fails(self) -> None:
        self.edit_json(ROSTER, lambda d: d["champions"][3].update({"name": "   "}))
        self.assertFails(run_checker(self.root), f"schema validation failed: {ROSTER} against roster.schema.json: champions/3/name:")

    def test_roster_with_multi_class_field_fails(self) -> None:
        self.edit_json(ROSTER, lambda d: d["champions"][0].update({"secondary_class": "Monk"}))
        self.assertFails(run_checker(self.root), f"schema validation failed: {ROSTER} against roster.schema.json: champions/0:")

    def test_invalid_roster_schema_fails(self) -> None:
        self.edit_json(ROSTER_SCHEMA, lambda s: s.update({"type": 7}))
        result = run_checker(self.root)
        self.assertFails(result, f"invalid Draft 2020-12 schema: {ROSTER_SCHEMA}", f"cannot validate {ROSTER}")

    # --- warnings that must not fail (exit code 0) ---------------------------------------

    def test_unexpected_missing_reference_is_reported_but_does_not_fail(self) -> None:
        self.edit_json(ROGUE, lambda d: d["effects"].append("brand_new_effect"))
        result = run_checker(self.root)
        self.assertPasses(result)
        self.assertIn(f"UNEXPECTED missing effect reference: {ROGUE} -> brand_new_effect", result.stdout)
        self.assertIn("1 unexpected warning(s)", result.stdout)

    def test_unexpected_window_mismatch_is_reported_but_does_not_fail(self) -> None:
        self.edit_json(ROGUE, lambda d: d["timing"].update({"resolution_window": "made_up_window"}))
        result = run_checker(self.root)
        self.assertPasses(result)
        self.assertIn(f"UNEXPECTED resolution-window mismatch: {ROGUE} uses 'made_up_window'", result.stdout)

    def test_known_id_in_an_unexpected_place_is_still_known(self) -> None:
        self.edit_json(ABILITY_TEMPLATE, lambda d: d["effects"].append("apply_stagger_on_hit"))
        result = run_checker(self.root)
        self.assertPasses(result)
        self.assertIn(f"KNOWN missing effect reference: {ABILITY_TEMPLATE} -> apply_stagger_on_hit", result.stdout)

    def test_unmapped_example_is_reported_but_does_not_fail(self) -> None:
        (self.root / "docs/COMBAT/examples/new_example.json").write_text('{"id": "x"}', encoding="utf-8")
        result = run_checker(self.root)
        self.assertPasses(result)
        self.assertIn("no applicable-schema mapping for docs/COMBAT/examples/new_example.json", result.stdout)

    def test_fixing_a_known_issue_removes_its_warning(self) -> None:
        self.edit_json(STORM, lambda d: d["timing"].update({"resolution_window": "action_commit"}))
        result = run_checker(self.root)
        self.assertPasses(result)
        self.assertEqual(result.stdout.count("KNOWN resolution-window mismatch"), 1)


if __name__ == "__main__":
    unittest.main(verbosity=2)
