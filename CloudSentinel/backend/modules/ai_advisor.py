"""
ai_advisor.py - Lightweight rule-based AI security advisor.

Answers cloud security questions using a local knowledge base.
No external APIs required — everything runs locally.
"""

import logging
import re
from typing import Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Knowledge Base — keyword patterns → advisory responses
# ---------------------------------------------------------------------------
_KNOWLEDGE_BASE = [
    # Public access
    {
        "keywords": ["public", "bucket", "access", "s3", "blob", "open"],
        "topic": "Public Cloud Storage Access",
        "response": (
            "**Public bucket/storage access** allows anyone on the internet to read (and potentially write) "
            "your stored data. This is one of the most common and dangerous cloud misconfigurations.\n\n"
            "**Risks:**\n"
            "• Data exfiltration — sensitive files can be downloaded by anyone\n"
            "• Data tampering — if write access is also open, attackers can modify or delete data\n"
            "• Compliance violations — public storage violates GDPR, HIPAA, PCI-DSS, and most compliance frameworks\n\n"
            "**Recommendations:**\n"
            "1. Set bucket ACL to `private`\n"
            "2. Enable **Block Public Access** at both the bucket and account level (AWS)\n"
            "3. Remove `allUsers` and `allAuthenticatedUsers` from IAM bindings (GCP)\n"
            "4. Set `allow_blob_public_access` to `false` (Azure)\n"
            "5. Use IAM roles and policies for access control instead of public ACLs\n"
            "6. Enable access logging to monitor who accesses your data"
        ),
    },
    # Encryption
    {
        "keywords": ["encrypt", "encryption", "sse", "kms", "aes", "at rest", "data protection"],
        "topic": "Storage Encryption",
        "response": (
            "**Server-side encryption (SSE)** protects data at rest by encrypting it before writing to disk.\n\n"
            "**Why it matters:**\n"
            "• Without encryption, anyone with physical or logical access to the storage can read the data\n"
            "• Compliance frameworks (HIPAA, PCI-DSS, SOC 2) require encryption at rest\n\n"
            "**Best Practices:**\n"
            "1. Enable default encryption on all storage buckets/accounts\n"
            "2. Use AES-256 at minimum; prefer AWS KMS or Azure Key Vault for key management\n"
            "3. Deny unencrypted uploads via bucket policy (`aws:SecureTransport` condition)\n"
            "4. Rotate encryption keys regularly (at least annually)\n"
            "5. Enable encryption for all services — not just primary storage"
        ),
    },
    # IAM / Permissions
    {
        "keywords": ["iam", "policy", "permission", "wildcard", "least privilege", "role", "access control"],
        "topic": "IAM & Access Control Best Practices",
        "response": (
            "**Identity and Access Management (IAM)** is the foundation of cloud security.\n\n"
            "**Common mistakes:**\n"
            "• Wildcard policies (`Action: *`, `Resource: *`) grant full admin access\n"
            "• Overly permissive roles violate the principle of least privilege\n"
            "• Not using conditions to restrict access by IP, VPC, or MFA\n\n"
            "**Best Practices:**\n"
            "1. Follow the **principle of least privilege** — grant only the permissions needed\n"
            "2. Use AWS IAM Access Analyzer to generate least-privilege policies from actual usage\n"
            "3. Replace `*` actions/resources with specific service actions and ARNs\n"
            "4. Use permission boundaries to limit maximum permissions\n"
            "5. Implement Service Control Policies (SCPs) in AWS Organizations\n"
            "6. Regularly review and audit IAM policies\n"
            "7. Use separate roles for different environments (dev, staging, prod)"
        ),
    },
    # MFA
    {
        "keywords": ["mfa", "multi-factor", "two-factor", "2fa", "authentication", "login"],
        "topic": "Multi-Factor Authentication (MFA)",
        "response": (
            "**Multi-Factor Authentication (MFA)** adds an extra layer of security beyond passwords.\n\n"
            "**Why it's critical:**\n"
            "• Passwords alone are vulnerable to phishing, brute force, and credential stuffing\n"
            "• MFA reduces the risk of account compromise by 99.9% (Microsoft research)\n\n"
            "**Best Practices:**\n"
            "1. Enable MFA for **all** IAM users, especially administrators\n"
            "2. Always enable MFA on the **root account** — this has unrestricted access\n"
            "3. Use hardware MFA tokens for privileged accounts\n"
            "4. Add IAM policies that deny actions unless MFA is present\n"
            "5. Prefer TOTP or FIDO2 over SMS-based MFA"
        ),
    },
    # Password policy
    {
        "keywords": ["password", "policy", "complexity", "strength", "weak password"],
        "topic": "Password Policy",
        "response": (
            "**Strong password policies** prevent brute-force and credential-based attacks.\n\n"
            "**Recommended settings:**\n"
            "• Minimum length: **14 characters**\n"
            "• Require: uppercase, lowercase, numbers, and symbols\n"
            "• Maximum age: **90 days**\n"
            "• Password reuse prevention: remember **last 24 passwords**\n\n"
            "**Additional measures:**\n"
            "1. Combine strong passwords with MFA\n"
            "2. Use a password manager\n"
            "3. Monitor for compromised credentials using AWS Credential Report or similar"
        ),
    },
    # Logging
    {
        "keywords": ["log", "logging", "audit", "monitor", "trail", "cloudtrail", "activity"],
        "topic": "Logging & Monitoring",
        "response": (
            "**Access logging** is essential for security auditing, incident response, and compliance.\n\n"
            "**Why it matters:**\n"
            "• Without logs, you cannot detect or investigate security incidents\n"
            "• Compliance frameworks require audit trails\n\n"
            "**Best Practices:**\n"
            "1. Enable access logging on all storage buckets\n"
            "2. Store logs in a separate, secured bucket\n"
            "3. Enable AWS CloudTrail / Azure Activity Log / GCP Cloud Audit Logs\n"
            "4. Set up log retention policies (minimum 90 days, ideally 1 year)\n"
            "5. Use alerting tools (CloudWatch, Azure Monitor) for real-time anomaly detection\n"
            "6. Protect log files from tampering using immutable storage"
        ),
    },
    # Versioning
    {
        "keywords": ["version", "versioning", "backup", "recovery", "delete", "overwrite"],
        "topic": "Versioning & Data Recovery",
        "response": (
            "**Bucket versioning** allows you to recover from accidental deletions or overwrites.\n\n"
            "**Benefits:**\n"
            "• Protects against accidental `rm` or overwrite of critical data\n"
            "• Enables recovery from ransomware attacks\n"
            "• Required for cross-region replication\n\n"
            "**Best Practices:**\n"
            "1. Enable versioning on all production buckets\n"
            "2. Add lifecycle rules to expire old versions after a defined period to manage costs\n"
            "3. Enable **MFA Delete** to prevent malicious version deletion\n"
            "4. Combine versioning with cross-region replication for disaster recovery"
        ),
    },
    # TLS / HTTPS
    {
        "keywords": ["tls", "https", "ssl", "transport", "man-in-the-middle", "mitm", "secure transfer"],
        "topic": "Transport Layer Security (TLS)",
        "response": (
            "**TLS (Transport Layer Security)** encrypts data in transit, preventing eavesdropping and tampering.\n\n"
            "**Risks of not enforcing TLS:**\n"
            "• Man-in-the-middle (MITM) attacks can intercept data\n"
            "• Credentials and API keys can be stolen in transit\n\n"
            "**Best Practices:**\n"
            "1. Enforce **HTTPS-only** on all storage accounts and endpoints\n"
            "2. Set minimum TLS version to **TLS 1.2** (TLS 1.0 and 1.1 are deprecated)\n"
            "3. Plan migration to TLS 1.3 for better performance and security\n"
            "4. Use HSTS headers on web-facing applications\n"
            "5. Test client application compatibility before upgrading TLS version"
        ),
    },
    # Key rotation
    {
        "keywords": ["key rotation", "access key", "rotate", "credential", "secret"],
        "topic": "Access Key Rotation",
        "response": (
            "**Regular key rotation** limits the window of exposure if credentials are compromised.\n\n"
            "**Best Practices:**\n"
            "1. Rotate access keys every **90 days**\n"
            "2. Create a new key → update applications → deactivate old key → delete old key\n"
            "3. Use AWS Config rules to alert on keys older than 90 days\n"
            "4. Prefer IAM roles over long-lived access keys\n"
            "5. Never embed access keys in source code — use environment variables or secrets managers\n"
            "6. Use AWS Secrets Manager, Azure Key Vault, or GCP Secret Manager"
        ),
    },
    # General best practices
    {
        "keywords": ["best practice", "security", "cloud", "posture", "general", "overview", "recommend"],
        "topic": "Cloud Security Best Practices",
        "response": (
            "**Cloud Security Posture Management (CSPM)** is an ongoing process. Here are the top recommendations:\n\n"
            "1. **Principle of Least Privilege** — grant minimum permissions required\n"
            "2. **Enable MFA** on all accounts, especially root/admin\n"
            "3. **Encrypt everything** — at rest and in transit\n"
            "4. **Enable logging & monitoring** on all services\n"
            "5. **Block public access** by default on all storage\n"
            "6. **Rotate credentials** regularly (every 90 days)\n"
            "7. **Enable versioning** for data recovery\n"
            "8. **Use infrastructure-as-code** to enforce consistent, auditable configs\n"
            "9. **Run regular security scans** and address findings promptly\n"
            "10. **Stay updated** on cloud provider security bulletins"
        ),
    },
    # Risk score
    {
        "keywords": ["risk", "score", "rating", "severity", "critical", "high", "medium", "low"],
        "topic": "Understanding Risk Scores",
        "response": (
            "**CloudSentinel Risk Scoring** works as follows:\n\n"
            "• Start with a perfect score of **100**\n"
            "• Each finding deducts points based on severity:\n"
            "  - **CRITICAL**: −40 points (e.g., public access, wildcard IAM)\n"
            "  - **HIGH**: −25 points (e.g., encryption disabled, MFA off)\n"
            "  - **MEDIUM**: −15 points (e.g., versioning off, outdated TLS)\n"
            "  - **LOW**: −5 points (e.g., logging disabled)\n\n"
            "**Rating thresholds:**\n"
            "• 90–100: 🟢 Secure\n"
            "• 70–89: 🟡 Moderate Risk\n"
            "• 40–69: 🟠 High Risk\n"
            "• 0–39: 🔴 Critical Risk\n\n"
            "Focus on fixing CRITICAL and HIGH issues first to improve your score quickly."
        ),
    },
]

# Pre-build fallback
_FALLBACK_RESPONSE = (
    "I don't have specific advice for that question, but here are general recommendations:\n\n"
    "1. Follow the **principle of least privilege** for all access controls\n"
    "2. **Encrypt** data at rest and in transit\n"
    "3. Enable **MFA** on all accounts\n"
    "4. Enable **logging and monitoring** on all services\n"
    "5. Regularly **rotate credentials** and **review IAM policies**\n\n"
    "Try asking about specific topics like: public access, encryption, IAM policies, "
    "MFA, logging, versioning, TLS, or key rotation."
)


def _score_match(question: str, entry: dict) -> int:
    """Score how well a question matches a knowledge base entry."""
    q_lower = question.lower()
    return sum(1 for kw in entry["keywords"] if kw in q_lower)


def ask_advisor(question: str, scan_context: Optional[dict] = None) -> dict:
    """
    Answer a security question using the local knowledge base.

    Args:
        question: The user's question text
        scan_context: Optional dict with recent scan findings for contextual advice

    Returns:
        dict with 'topic', 'response', and optional 'context_note'
    """
    # Score each KB entry
    scored = [(entry, _score_match(question, entry)) for entry in _KNOWLEDGE_BASE]
    scored.sort(key=lambda x: x[1], reverse=True)

    best, best_score = scored[0]

    if best_score > 0:
        result = {
            "topic": best["topic"],
            "response": best["response"],
        }
    else:
        result = {
            "topic": "General Security Advice",
            "response": _FALLBACK_RESPONSE,
        }

    # Add context from recent scan if available
    if scan_context:
        findings = scan_context.get("findings", [])
        if findings:
            severities = {}
            for f in findings:
                sev = f.get("severity", "LOW")
                severities[sev] = severities.get(sev, 0) + 1

            context_parts = [
                f"\n\n---\n**Based on your latest scan** (score: {scan_context.get('score', 'N/A')}):"
            ]
            for sev in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]:
                count = severities.get(sev, 0)
                if count > 0:
                    context_parts.append(f"• {count} {sev} issue{'s' if count > 1 else ''} detected")

            # Mention relevant findings
            relevant = [f for f in findings
                        if any(kw in (f.get("title", "") + f.get("description", "")).lower()
                               for kw in (best["keywords"] if best_score > 0 else []))]
            if relevant:
                context_parts.append("\n**Related findings in your scan:**")
                for f in relevant[:3]:
                    context_parts.append(f"• [{f.get('severity', '')}] {f.get('title', '')}")

            result["context_note"] = "\n".join(context_parts)

    logger.info("Advisor answered question: %s (topic: %s)", question[:50], result["topic"])
    return result


# Pre-built quick questions for the UI
QUICK_QUESTIONS = [
    "Why is public bucket access risky?",
    "How do I fix a wildcard IAM policy?",
    "What are best practices for cloud storage security?",
    "How does the risk scoring work?",
    "Why should I enable encryption?",
    "What is MFA and why is it important?",
    "How often should I rotate access keys?",
    "Why is TLS important for cloud security?",
]
