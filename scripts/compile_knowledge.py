import argparse
import json
import os
import sys

# Ensure project root is in python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from mental_razors.validation import validate_all

def main():
    parser = argparse.ArgumentParser(description="Compile mental razors knowledge layer from YAML to JSON")
    parser.add_argument('--check', action='store_true', help="Check for drift without writing files")
    args = parser.parse_args()

    # Base directories relative to this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    knowledge_dir = os.path.join(project_root, 'knowledge')
    src_knowledge_dir = os.path.join(project_root, 'src', 'knowledge')

    try:
        compiled_razors, compiled_review_modes = validate_all(knowledge_dir)
    except Exception as e:
        print(f"Compilation Failed: {e}", file=sys.stderr)
        sys.exit(1)

    # Output paths
    razors_json_path = os.path.join(src_knowledge_dir, 'razors.generated.json')
    review_modes_json_path = os.path.join(src_knowledge_dir, 'review-modes.generated.json')

    if args.check:
        # Load existing generated files and check for drift
        if not os.path.exists(razors_json_path) or not os.path.exists(review_modes_json_path):
            print("Missing generated JSON files. Drift detected.", file=sys.stderr)
            sys.exit(1)

        try:
            with open(razors_json_path, 'r', encoding='utf-8') as f:
                existing_razors = json.load(f)
            with open(review_modes_json_path, 'r', encoding='utf-8') as f:
                existing_review_modes = json.load(f)
        except Exception as e:
            print(f"Failed to read existing JSON files: {e}", file=sys.stderr)
            sys.exit(1)

        # Compare using dumps
        if json.dumps(compiled_razors, sort_keys=True) != json.dumps(existing_razors, sort_keys=True) or \
           json.dumps(compiled_review_modes, sort_keys=True) != json.dumps(existing_review_modes, sort_keys=True):
            print("Drift detected between YAML knowledge base and generated JSON files.", file=sys.stderr)
            sys.exit(2)

        print("Verification successful. No drift detected.")
    else:
        # Ensure directories exist
        os.makedirs(src_knowledge_dir, exist_ok=True)

        # Write
        with open(razors_json_path, 'w', encoding='utf-8') as f:
            json.dump(compiled_razors, f, indent=2, ensure_ascii=False)
        with open(review_modes_json_path, 'w', encoding='utf-8') as f:
            json.dump(compiled_review_modes, f, indent=2, ensure_ascii=False)

        print("Knowledge compiled successfully to src/knowledge/ directory.")

if __name__ == '__main__':
    main()
