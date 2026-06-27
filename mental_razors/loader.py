import hashlib
import os
from typing import Tuple, Dict, Any, List
import yaml

_cached_razors = None
_cached_modes = None
_cached_version = None

def get_project_root() -> str:
    # This file lives in project_root/mental_razors/loader.py
    current_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.dirname(current_dir)

def calculate_sha256(file_path: str) -> str:
    sha256 = hashlib.sha256()
    with open(file_path, 'rb') as f:
        while chunk := f.read(8192):
            sha256.update(chunk)
    return sha256.hexdigest()

def load_knowledge(force_reload: bool = False) -> Tuple[Dict[str, Any], Dict[str, Any], str]:
    global _cached_razors, _cached_modes, _cached_version
    
    if not force_reload and _cached_razors is not None:
        return _cached_razors, _cached_modes, _cached_version
        
    root = get_project_root()
    razors_path = os.path.join(root, 'knowledge', 'razors.yaml')
    modes_path = os.path.join(root, 'knowledge', 'review-modes.yaml')
    
    if not os.path.exists(razors_path) or not os.path.exists(modes_path):
        raise FileNotFoundError(f"Knowledge files not found in {os.path.join(root, 'knowledge')}")
        
    version_hash = calculate_sha256(razors_path)
    
    with open(razors_path, 'r', encoding='utf-8') as f:
        razors_data = yaml.safe_load(f)
        
    with open(modes_path, 'r', encoding='utf-8') as f:
        modes_data = yaml.safe_load(f)
        
    _cached_razors = razors_data
    _cached_modes = modes_data
    _cached_version = version_hash
    
    return razors_data, modes_data, version_hash

def get_razors() -> List[Dict[str, Any]]:
    razors_data, _, _ = load_knowledge()
    return razors_data.get('razors', [])

def get_categories() -> List[Dict[str, Any]]:
    razors_data, _, _ = load_knowledge()
    return razors_data.get('categories', [])

def get_review_modes() -> List[Dict[str, Any]]:
    _, modes_data, _ = load_knowledge()
    return modes_data.get('modes', [])

def get_knowledge_version() -> str:
    _, _, version_hash = load_knowledge()
    return version_hash
