import os
import json
import pytest
from mental_razors.validation import validate_all

def test_compile_and_validate():
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    knowledge_dir = os.path.join(project_root, 'knowledge')
    
    # Assert validation runs successfully
    compiled_razors, compiled_review_modes = validate_all(knowledge_dir)
    assert compiled_razors is not None
    assert compiled_review_modes is not None
    
    # Assert generated files exist
    razors_generated_path = os.path.join(project_root, 'src', 'knowledge', 'razors.generated.json')
    modes_generated_path = os.path.join(project_root, 'src', 'knowledge', 'review-modes.generated.json')
    
    assert os.path.exists(razors_generated_path)
    assert os.path.exists(modes_generated_path)
    
    # Verify contents match
    with open(razors_generated_path, 'r', encoding='utf-8') as f:
        existing_razors = json.load(f)
    with open(modes_generated_path, 'r', encoding='utf-8') as f:
        existing_review_modes = json.load(f)
        
    assert json.dumps(compiled_razors, sort_keys=True) == json.dumps(existing_razors, sort_keys=True)
    assert json.dumps(compiled_review_modes, sort_keys=True) == json.dumps(existing_review_modes, sort_keys=True)
