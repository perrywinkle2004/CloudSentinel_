"""
risk_engine.py - Calculates security risk score from findings.
"""

SEVERITY_PENALTY = {
    "CRITICAL": 40,
    "HIGH": 25,
    "MEDIUM": 15,
    "LOW": 5,
}

RATING_THRESHOLDS = [
    (90, "Critical Risk", "red"),
    (70, "High Risk", "orange"),
    (40, "Moderate Risk", "yellow"),
    (0,  "Secure", "green"),
]


def calculate_score(findings: list) -> dict:
    """
    Given a list of finding dicts (each having a 'severity' key),
    return a score summary dict.
    """
    score = 0
    counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}

    for finding in findings:
        sev = finding.get("severity", "LOW").upper()
        penalty = SEVERITY_PENALTY.get(sev, 5)
        score += penalty
        counts[sev] = counts.get(sev, 0) + 1

    # Cap score at 100
    score = min(score, 100)

    # Determine rating
    rating, color = "Secure", "green"
    for threshold, label, clr in RATING_THRESHOLDS:
        if score >= threshold:
            rating, color = label, clr
            break

    return {
        "score": score,
        "rating": rating,
        "color": color,
        "counts": counts,
        "total_issues": len(findings),
    }
