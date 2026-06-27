import json
import os
from typing import Dict, Any, Tuple
import yaml
import jsonschema

def load_yaml(file_path: str) -> Dict[str, Any]:
    with open(file_path, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)

def load_json(file_path: str) -> Dict[str, Any]:
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def validate_schema(data: Dict[str, Any], schema: Dict[str, Any]) -> None:
    jsonschema.validate(instance=data, schema=schema)

def run_semantic_checks(razors_data: Dict[str, Any], review_modes_data: Dict[str, Any]) -> None:
    # 1. Unique category IDs
    category_ids = set()
    for cat in razors_data.get('categories', []):
        cat_id = cat.get('id')
        if not cat_id:
            raise ValueError("Category is missing an 'id'")
        if cat_id in category_ids:
            raise ValueError(f"Duplicate category ID: {cat_id}")
        category_ids.add(cat_id)

    # 2. Unique razor IDs and field validation
    razor_ids = set()
    for razor in razors_data.get('razors', []):
        r_id = razor.get('id')
        if not r_id:
            raise ValueError("Razor is missing an 'id'")
        if r_id in razor_ids:
            raise ValueError(f"Duplicate razor ID: {r_id}")
        razor_ids.add(r_id)

        # Category mapping validation
        cat_id = razor.get('category_id')
        if cat_id not in category_ids:
            raise ValueError(f"Razor '{r_id}' references undefined category_id: '{cat_id}'")

        # Semantic completeness requirements
        if len(razor.get('diagnostic_questions', [])) < 1:
            raise ValueError(f"Razor '{r_id}' must have at least one diagnostic question.")
        if len(razor.get('false_positive_conditions', [])) < 1:
            raise ValueError(f"Razor '{r_id}' must have at least one false positive condition.")

    # 3. Unique review mode IDs and references
    mode_ids = set()
    for mode in review_modes_data.get('modes', []):
        m_id = mode.get('id')
        if not m_id:
            raise ValueError("Review mode is missing an 'id'")
        if m_id in mode_ids:
            raise ValueError(f"Duplicate review mode ID: {m_id}")
        mode_ids.add(m_id)

        # Reference checks
        for pr_id in mode.get('prioritize', []):
            if pr_id not in razor_ids:
                raise ValueError(f"Review mode '{m_id}' references undefined razor ID in prioritize: '{pr_id}'")

def validate_all(knowledge_dir: str) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    razors_yaml_path = os.path.join(knowledge_dir, 'razors.yaml')
    review_modes_yaml_path = os.path.join(knowledge_dir, 'review-modes.yaml')
    razors_schema_path = os.path.join(knowledge_dir, 'schemas', 'razors.schema.json')
    review_modes_schema_path = os.path.join(knowledge_dir, 'schemas', 'review-modes.schema.json')

    if not os.path.exists(razors_yaml_path):
        raise FileNotFoundError(f"Missing razors.yaml at {razors_yaml_path}")
    if not os.path.exists(review_modes_yaml_path):
        raise FileNotFoundError(f"Missing review-modes.yaml at {review_modes_yaml_path}")
    if not os.path.exists(razors_schema_path):
        raise FileNotFoundError(f"Missing razors.schema.json at {razors_schema_path}")
    if not os.path.exists(review_modes_schema_path):
        raise FileNotFoundError(f"Missing review-modes.schema.json at {review_modes_schema_path}")

    razors_data = load_yaml(razors_yaml_path)
    review_modes_data = load_yaml(review_modes_yaml_path)
    razors_schema = load_json(razors_schema_path)
    review_modes_schema = load_json(review_modes_schema_path)

    # 1. Validation of structural formatting constraints
    validate_schema(razors_data, razors_schema)
    validate_schema(review_modes_data, review_modes_schema)

    # 2. Validation of semantic integrity constraints
    run_semantic_checks(razors_data, review_modes_data)

    return razors_data, review_modes_data
