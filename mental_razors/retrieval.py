import re
import unicodedata
from typing import List, Set, Dict, Any, Tuple
from mental_razors.models import RazorCandidate, EvidenceCandidate
from mental_razors.loader import get_razors, load_knowledge

STOP_WORDS = {
    'the', 'a', 'an', 'and', 'or', 'but', 'if', 'then', 'else', 'when', 'where',
    'why', 'how', 'what', 'who', 'which', 'this', 'that', 'these', 'those',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'to', 'for', 'of', 'in', 'on', 'at', 'by', 'with',
    'from', 'up', 'down', 'about', 'over', 'under', 'again', 'further',
    'then', 'once', 'here', 'there', 'all', 'any', 'both', 'each', 'few',
    'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
    'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will',
    'just', 'should', 'now', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
    'my', 'your', 'his', 'her', 'its', 'our', 'their', 'them', 'me', 'us',
    'him', 'himself', 'herself', 'itself', 'themselves', 'ourselves', 'yourselves',
    'hasn', 'haven', 'hadn', 'doesn', 'don', 'didn', 'won', 'wouldn', 'shouldn',
    'could', 'couldn', 'must', 'mustn', 'would', 'shall', 'may', 'might',
    'am', 'are', 'was', 'were'
}

FIELD_WEIGHTS = {
    'title': 5.0,
    'tags': 4.0,
    'trigger_conditions': 3.0,
    'indicators': 2.0,
    'principle': 1.0,
    'examples': 0.5
}

def tokenize(text: str) -> List[str]:
    if not text:
        return []
    normalized = unicodedata.normalize("NFKC", text).casefold()
    tokens = re.findall(r"\b[^\W_]+\b", normalized, flags=re.UNICODE)
    
    stemmed = []
    for t in tokens:
        if t in STOP_WORDS:
            continue
        # Light stemming for suffix variations
        for suffix in ('edly', 'ingly', 'ly', 'ed', 'ing', 'es', 's'):
            if t.endswith(suffix) and len(t) - len(suffix) >= 3:
                t = t[:-len(suffix)]
                break
        stemmed.append(t)
    return stemmed

def split_sentences(text: str) -> List[Tuple[str, int, int]]:
    """
    Split text into sentences, tracking their start and end character offsets.
    """
    sentences = []
    # Simple regex splitting on sentence endings, keeping track of offsets
    for m in re.finditer(r'[^.!?\n\r]+[.!?\n\r]*', text):
        sentence_text = m.group(0)
        start = m.start()
        end = m.end()
        # Trim whitespace but keep original indexes matching the trim
        stripped = sentence_text.strip()
        if stripped:
            # Adjust offsets for leading/trailing spaces
            l_offset = len(sentence_text) - len(sentence_text.lstrip())
            r_offset = len(sentence_text) - len(sentence_text.rstrip())
            sentences.append((stripped, start + l_offset, end - r_offset))
    return sentences

def score_razor(razor: Dict[str, Any], query_tokens: Set[str], prioritize: List[str]) -> float:
    score = 0.0
    if not query_tokens:
        return score
        
    # Helper to calculate token frequency score in a string list
    def calculate_field_score(texts: List[str], weight: float) -> float:
        field_score = 0.0
        for text in texts:
            tokens = tokenize(text)
            for token in tokens:
                if token in query_tokens:
                    field_score += weight
        return field_score

    # Score fields
    score += calculate_field_score([razor.get('title', '')], FIELD_WEIGHTS['title'])
    score += calculate_field_score(razor.get('tags', []), FIELD_WEIGHTS['tags'])
    score += calculate_field_score(razor.get('trigger_conditions', []), FIELD_WEIGHTS['trigger_conditions'])
    score += calculate_field_score(razor.get('indicators', []), FIELD_WEIGHTS['indicators'])
    score += calculate_field_score([razor.get('principle', '')], FIELD_WEIGHTS['principle'])
    
    examples_texts = []
    for ex in razor.get('examples', []):
        examples_texts.append(f"{ex.get('title', '')} {ex.get('context', '')} {ex.get('blindspot', '')} {ex.get('consequence', '')} {ex.get('learning', '')}")
    score += calculate_field_score(examples_texts, FIELD_WEIGHTS['examples'])
    
    # Priority boost
    if razor.get('id') in prioritize:
        score += 2.0  # Priority weight boost
        
    return score

def extract_evidence(content: str, razor: Dict[str, Any]) -> List[EvidenceCandidate]:
    evidence_candidates = []
    sentences = split_sentences(content)
    
    triggers = razor.get('trigger_conditions', []) + razor.get('indicators', [])
    if not triggers:
        return []
        
    for sentence, start, end in sentences:
        sentence_tokens = set(tokenize(sentence))
        if not sentence_tokens:
            continue
            
        matched_signals = []
        for trigger in triggers:
            trigger_tokens = set(tokenize(trigger))
            if not trigger_tokens:
                continue
                
            intersection = sentence_tokens.intersection(trigger_tokens)
            # Match condition: at least 2 tokens overlap OR 30% of trigger tokens overlap
            overlap_ratio = len(intersection) / len(trigger_tokens)
            if len(intersection) >= 2 or (len(intersection) >= 1 and overlap_ratio >= 0.3):
                matched_signals.append(trigger)
                
        if matched_signals:
            evidence_candidates.append(EvidenceCandidate(
                quote=sentence,
                start=start,
                end=end,
                matched_signals=matched_signals
            ))
            
    return evidence_candidates

def retrieve_candidates(content: str, mode_id: str = "quick-check", max_candidates: int = 5) -> List[RazorCandidate]:
    # 1. Load active modes and priority weights
    _, modes_data, _ = load_knowledge()
    modes = modes_data.get('modes', [])
    mode = next((m for m in modes if m.get('id') == mode_id), None)
    
    prioritize = []
    mode_max = max_candidates
    if mode:
        prioritize = mode.get('prioritize', [])
        mode_max = min(max_candidates, mode.get('max_candidates', max_candidates))
        
    # 2. Tokenize input content
    content_tokens = set(tokenize(content))
    
    # 3. Retrieve all razors and score them
    razors = get_razors()
    scored_candidates = []
    
    for r in razors:
        score = score_razor(r, content_tokens, prioritize)
        # Even if token score is 0, we can check if any evidence matches.
        # But to be clean, let's calculate evidence first.
        evidence = extract_evidence(content, r)
        
        # If the query had tokens, we prioritize matching score.
        # If there are no tokens in content, we rank based on evidence quantity.
        if content_tokens:
            effective_score = score
        else:
            effective_score = float(len(evidence))
            
        # We only keep candidate if it has some matched evidence, OR if score > 0 (even if no explicit sentence triggers)
        # To respect the user constraint "Each stored finding must point to evidence",
        # the candidates returned should preferably have evidence. But let's return it as candidate if either score > 0 or has evidence.
        if score > 0 or evidence:
            scored_candidates.append((r, effective_score, evidence))
            
    # Sort candidates: those with evidence first (descending), then by score (descending)
    scored_candidates.sort(key=lambda x: (len(x[2]) > 0, x[1]), reverse=True)
    
    # Take top-k candidates
    candidates = []
    for r, score, evidence in scored_candidates[:mode_max]:
        candidates.append(RazorCandidate(
            razor_id=r.get('id'),
            title=r.get('title'),
            retrieval_score=score,
            evidence=evidence,
            diagnostic_questions=r.get('diagnostic_questions', []),
            false_positive_conditions=r.get('false_positive_conditions', [])
        ))
        
    return candidates
