import pytest
from mental_razors.validation import run_semantic_checks

def get_valid_data():
    razors_data = {
        "schema_version": 1,
        "categories": [
            {"id": "category-a", "label": "Category A", "order": 10}
        ],
        "razors": [
            {
                "id": "razor-1",
                "category_id": "category-a",
                "title": "Razor 1",
                "tags": ["tag1"],
                "provenance": {"type": "original"},
                "principle": "Principle A",
                "pattern": "Pattern A",
                "trigger_conditions": ["Trigger A"],
                "false_positive_conditions": ["False Positive A"],
                "diagnostic_questions": ["Question A"],
                "recommended_actions": ["Action A"],
                "indicators": ["Indicator A"],
                "applications": ["App A"],
                "examples": [
                    {
                        "title": "Example A",
                        "context": "Context A",
                        "blindspot": "Blindspot A",
                        "consequence": "Consequence A",
                        "learning": "Learning A"
                    }
                ]
            }
        ]
    }
    review_modes_data = {
        "schema_version": 1,
        "modes": [
            {
                "id": "mode-1",
                "label": "Mode 1",
                "max_candidates": 3,
                "prioritize": ["razor-1"]
            }
        ]
    }
    return razors_data, review_modes_data

def test_valid_semantic_checks():
    r, m = get_valid_data()
    # Should not raise any error
    run_semantic_checks(r, m)

def test_duplicate_category_id():
    r, m = get_valid_data()
    r["categories"].append({"id": "category-a", "label": "Another", "order": 20})
    with pytest.raises(ValueError, match="Duplicate category ID: category-a"):
        run_semantic_checks(r, m)

def test_duplicate_razor_id():
    r, m = get_valid_data()
    r["razors"].append({
        "id": "razor-1",
        "category_id": "category-a",
        "title": "Another Razor",
        "tags": [],
        "provenance": {"type": "original"},
        "principle": "B",
        "pattern": "B",
        "trigger_conditions": ["T"],
        "false_positive_conditions": ["F"],
        "diagnostic_questions": ["Q"],
        "recommended_actions": ["A"],
        "indicators": [],
        "applications": [],
        "examples": []
    })
    with pytest.raises(ValueError, match="Duplicate razor ID: razor-1"):
        run_semantic_checks(r, m)

def test_undefined_category_id():
    r, m = get_valid_data()
    r["razors"][0]["category_id"] = "non-existent-category"
    with pytest.raises(ValueError, match="references undefined category_id: 'non-existent-category'"):
        run_semantic_checks(r, m)

def test_missing_diagnostic_questions():
    r, m = get_valid_data()
    r["razors"][0]["diagnostic_questions"] = []
    with pytest.raises(ValueError, match="must have at least one diagnostic question"):
        run_semantic_checks(r, m)

def test_missing_false_positive_conditions():
    r, m = get_valid_data()
    r["razors"][0]["false_positive_conditions"] = []
    with pytest.raises(ValueError, match="must have at least one false positive condition"):
        run_semantic_checks(r, m)

def test_undefined_prioritize_razor():
    r, m = get_valid_data()
    m["modes"][0]["prioritize"] = ["non-existent-razor"]
    with pytest.raises(ValueError, match="references undefined razor ID in prioritize: 'non-existent-razor'"):
        run_semantic_checks(r, m)
