import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.check_site import validate_site


class SiteIntegrityTests(unittest.TestCase):
    def make_site(self, files, catalog_ids=("task-a",)):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        root = Path(temporary.name)
        docs = root / "docs"
        docs.mkdir()
        for relative_path, contents in files.items():
            path = docs / relative_path
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(contents, encoding="utf-8")

        catalog = docs / "assets" / "task-catalog.js"
        catalog.parent.mkdir(parents=True, exist_ok=True)
        task_rows = "\n".join(
            f"{{ id: '{task_id}', title: 'Task', required: true, phase: 'test' }},"
            for task_id in catalog_ids
        )
        catalog.write_text(f"export const GUIDE_TASKS = [\n{task_rows}\n]\n", encoding="utf-8")
        return docs, catalog

    def test_accepts_a_complete_site_graph(self):
        docs, catalog = self.make_site(
            {
                "_sidebar.md": "- [Guide](/guide.md)\n",
                "guide.md": (
                    "# Guide\n\n"
                    "- [ ] <span data-task-id=\"task-a\" data-task-phase=\"test\" "
                    "data-task-required=\"true\"></span> Task\n\n"
                    "[More](more.md)\n"
                ),
                "more.md": "# More\n",
            }
        )

        self.assertEqual(validate_site(docs, catalog), [])

    def test_rejects_duplicate_task_ids(self):
        marker = '<span data-task-id="task-a" data-task-phase="test"></span>'
        docs, catalog = self.make_site(
            {"_sidebar.md": "- [Guide](/guide.md)\n", "guide.md": f"{marker}\n{marker}\n"}
        )

        self.assertIn("duplicate task id 'task-a'", "\n".join(validate_site(docs, catalog)))

    def test_rejects_missing_sidebar_and_internal_markdown_targets(self):
        docs, catalog = self.make_site(
            {
                "_sidebar.md": "- [Missing](/missing.md)\n- [Guide](/guide.md)\n",
                "guide.md": (
                    '<span data-task-id="task-a" data-task-phase="test"></span>\n'
                    "[Also missing](also-missing.md)\n"
                ),
            }
        )

        errors = "\n".join(validate_site(docs, catalog))
        self.assertIn("_sidebar.md: missing target '/missing.md'", errors)
        self.assertIn("guide.md: missing target 'also-missing.md'", errors)

    def test_rejects_catalog_tasks_without_markdown_markers(self):
        docs, catalog = self.make_site(
            {"_sidebar.md": "- [Guide](/guide.md)\n", "guide.md": "# Guide\n"},
            catalog_ids=("task-a", "task-b"),
        )

        errors = "\n".join(validate_site(docs, catalog))
        self.assertIn("catalog task 'task-a' has no Markdown marker", errors)
        self.assertIn("catalog task 'task-b' has no Markdown marker", errors)

    def test_rejects_dashboard_references_to_unknown_tasks(self):
        docs, catalog = self.make_site(
            {
                "_sidebar.md": "- [Guide](/guide.md)\n",
                "guide.md": (
                    '<span data-task-id="task-a" data-task-phase="test"></span>\n'
                    '<span data-progress-task-id="not-in-catalog"></span>\n'
                ),
            }
        )

        self.assertIn(
            "dashboard references unknown task 'not-in-catalog'",
            "\n".join(validate_site(docs, catalog)),
        )

    def test_ignores_task_examples_in_internal_design_documents(self):
        docs, catalog = self.make_site(
            {
                "_sidebar.md": "- [Guide](/guide.md)\n",
                "guide.md": '<span data-task-id="task-a" data-task-phase="test"></span>\n',
                "superpowers/specs/design.md": (
                    '<span data-task-id="EXAMPLE" data-task-phase="example"></span>\n'
                ),
            }
        )

        self.assertEqual(validate_site(docs, catalog), [])

    def test_rejects_non_rooted_sidebar_routes(self):
        docs, catalog = self.make_site(
            {
                "_sidebar.md": "- [Guide](folder/guide.md)\n",
                "folder/guide.md": '<span data-task-id="task-a"></span>\n',
            }
        )

        self.assertIn(
            "_sidebar.md: Docsify route 'folder/guide.md' must start with '/'",
            "\n".join(validate_site(docs, catalog)),
        )


if __name__ == "__main__":
    unittest.main()
