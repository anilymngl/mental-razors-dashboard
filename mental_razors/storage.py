import os
import json
import uuid
import hashlib
from datetime import datetime, timezone
from typing import Optional
from mental_razors.models import ReviewRecordInput, ReviewRecord
from mental_razors.loader import get_knowledge_version

def get_storage_dir() -> str:
    # 1. MENTAL_RAZORS_DATA_DIR env override
    env_dir = os.environ.get('MENTAL_RAZORS_DATA_DIR')
    if env_dir:
        return env_dir
        
    # 2. macOS Application Support directory
    home = os.path.expanduser('~')
    app_support = os.path.join(home, 'Library', 'Application Support', 'mental-razors')
    
    if os.path.exists(os.path.join(home, 'Library')):
        try:
            os.makedirs(app_support, exist_ok=True)
            # Verify write access by writing/deleting a temporary token
            test_file = os.path.join(app_support, '.write_test')
            with open(test_file, 'w') as f:
                f.write('test')
            os.remove(test_file)
            return app_support
        except Exception:
            pass
            
    # 3. Project-local .local/ folder fallback
    # Loader's project root is parent directory of the current file's directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(current_dir)
    project_local = os.path.join(project_root, '.local')
    os.makedirs(project_local, exist_ok=True)
    return project_local

def record_review(input_data: ReviewRecordInput, content: Optional[str] = None) -> ReviewRecord:
    storage_dir = get_storage_dir()
    os.makedirs(storage_dir, exist_ok=True)
    
    # Generate SHA-256 of the reviewed content or fall back to decision strings
    text_to_hash = content if content else (input_data.decision + (input_data.notes or ""))
    input_hash = hashlib.sha256(text_to_hash.encode('utf-8')).hexdigest()
    
    # Instantiate the complete audit model
    record = ReviewRecord(
        decision_id=input_data.decision_id,
        mode=input_data.mode,
        accepted_findings=input_data.accepted_findings,
        rejected_findings=input_data.rejected_findings,
        decision=input_data.decision,
        notes=input_data.notes,
        review_id=str(uuid.uuid4()),
        created_at=datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
        knowledge_version=get_knowledge_version(),
        input_hash=input_hash,
        schema_version=1
    )
    
    # Append the JSONL record
    history_file = os.path.join(storage_dir, 'reviews.jsonl')
    with open(history_file, 'a', encoding='utf-8') as f:
        f.write(record.model_dump_json() + '\n')
        
    return record
