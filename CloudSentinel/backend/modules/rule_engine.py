"""
rule_engine.py - Security misconfiguration detection rules
Scans parsed cloud configurations and returns list of findings.
"""

import logging

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Rule definitions
# ---------------------------------------------------------------------------
RULES = [
    # ── Generic Rules ───────────────────────────────────────────────────────
    {
        "id": "GEN-001",
        "title": "Public Storage Access",
        "description": "Storage resource is publicly accessible and may expose sensitive data.",
        "severity": "CRITICAL",
        "service": "generic",
        "provider": "generic",
        "category": "Access Control",
    },
    {
        "id": "GEN-002",
        "title": "Weak Access Permissions",
        "description": "Overly permissive access policy detected.",
        "severity": "HIGH",
        "service": "generic",
        "provider": "generic",
        "category": "Access Control",
    },

    # ── AWS S3 ──────────────────────────────────────────────────────────────
    {
        "id": "S3-001",
        "title": "Public S3 Bucket Access (ACL)",
        "description": "S3 bucket ACL allows public read or write access, exposing data to anyone on the internet.",
        "severity": "CRITICAL",
        "service": "s3",
        "provider": "aws",
        "category": "Access Control",
    },
    {
        "id": "S3-002",
        "title": "Block Public Access Disabled",
        "description": "One or more 'Block Public Access' settings are disabled, allowing potential public exposure.",
        "severity": "CRITICAL",
        "service": "s3",
        "provider": "aws",
        "category": "Access Control",
    },
    {
        "id": "S3-003",
        "title": "S3 Encryption Disabled",
        "description": "Server-side encryption is not enabled for this S3 bucket, leaving data unprotected at rest.",
        "severity": "MEDIUM",
        "service": "s3",
        "provider": "aws",
        "category": "Encryption",
    },
    {
        "id": "S3-004",
        "title": "S3 Versioning Disabled",
        "description": "Versioning is disabled, making it impossible to recover from accidental deletions or overwrites.",
        "severity": "MEDIUM",
        "service": "s3",
        "provider": "aws",
        "category": "Data Protection",
    },
    {
        "id": "S3-005",
        "title": "S3 Access Logging Disabled",
        "description": "Access logging is not enabled, making it difficult to audit or investigate suspicious activity.",
        "severity": "LOW",
        "service": "s3",
        "provider": "aws",
        "category": "Logging",
    },
    {
        "id": "S3-006",
        "title": "Wildcard S3 Bucket Policy (Principal: *)",
        "description": "S3 bucket policy grants unrestricted access to all principals (*), allowing any user to perform actions.",
        "severity": "CRITICAL",
        "service": "s3",
        "provider": "aws",
        "category": "Access Control",
    },

    # ── AWS IAM ─────────────────────────────────────────────────────────────
    {
        "id": "IAM-001",
        "title": "Wildcard IAM Policy (Action: *, Resource: *)",
        "description": "IAM policy grants all actions on all resources — effectively full administrator access. This violates least-privilege.",
        "severity": "CRITICAL",
        "service": "iam",
        "provider": "aws",
        "category": "Access Control",
    },
    {
        "id": "IAM-002",
        "title": "MFA Not Enabled",
        "description": "Multi-Factor Authentication is not enabled for IAM users, increasing risk of account compromise.",
        "severity": "HIGH",
        "service": "iam",
        "provider": "aws",
        "category": "Authentication",
    },
    {
        "id": "IAM-003",
        "title": "Weak Password Policy",
        "description": "Password policy does not enforce complexity, length, or expiration requirements.",
        "severity": "HIGH",
        "service": "iam",
        "provider": "aws",
        "category": "Authentication",
    },
    {
        "id": "IAM-004",
        "title": "Root Account MFA Disabled",
        "description": "MFA is not enabled on the root account, which has unrestricted access to all AWS resources.",
        "severity": "CRITICAL",
        "service": "iam",
        "provider": "aws",
        "category": "Authentication",
    },
    {
        "id": "IAM-005",
        "title": "Access Keys Not Rotated",
        "description": "IAM access keys have not been rotated, increasing risk of compromised credentials being exploited.",
        "severity": "MEDIUM",
        "service": "iam",
        "provider": "aws",
        "category": "Credential Management",
    },

    # ── Azure Storage ────────────────────────────────────────────────────────
    {
        "id": "AZ-001",
        "title": "Azure Blob Public Access Enabled",
        "description": "Azure Storage account allows public blob access, exposing data to anonymous internet users.",
        "severity": "CRITICAL",
        "service": "storage",
        "provider": "azure",
        "category": "Access Control",
    },
    {
        "id": "AZ-002",
        "title": "Azure Storage Encryption Disabled",
        "description": "Blob storage encryption is not enabled, leaving data unprotected at rest.",
        "severity": "HIGH",
        "service": "storage",
        "provider": "azure",
        "category": "Encryption",
    },
    {
        "id": "AZ-003",
        "title": "HTTPS-Only Traffic Not Enforced",
        "description": "Azure Storage account allows HTTP traffic, enabling potential man-in-the-middle attacks.",
        "severity": "HIGH",
        "service": "storage",
        "provider": "azure",
        "category": "Transport Security",
    },
    {
        "id": "AZ-004",
        "title": "Outdated Minimum TLS Version",
        "description": "Minimum TLS version is set below TLS 1.2, allowing use of deprecated and vulnerable protocols.",
        "severity": "MEDIUM",
        "service": "storage",
        "provider": "azure",
        "category": "Transport Security",
    },
    {
        "id": "AZ-005",
        "title": "Azure Soft Delete Disabled",
        "description": "Soft delete is not enabled for blobs, making accidental deletions unrecoverable.",
        "severity": "LOW",
        "service": "storage",
        "provider": "azure",
        "category": "Data Protection",
    },

    # ── GCP Storage ──────────────────────────────────────────────────────────
    {
        "id": "GCP-001",
        "title": "GCP Bucket Publicly Accessible",
        "description": "GCP Storage bucket is accessible by 'allUsers' or 'allAuthenticatedUsers', exposing it publicly.",
        "severity": "CRITICAL",
        "service": "storage",
        "provider": "gcp",
        "category": "Access Control",
    },
    {
        "id": "GCP-002",
        "title": "GCP Uniform Bucket-Level Access Disabled",
        "description": "Object-level ACLs are allowed, increasing complexity and risk of misconfigured permissions.",
        "severity": "MEDIUM",
        "service": "storage",
        "provider": "gcp",
        "category": "Access Control",
    },
    {
        "id": "GCP-003",
        "title": "GCP Bucket Logging Disabled",
        "description": "Access logs are not enabled for this GCP bucket, reducing auditability.",
        "severity": "LOW",
        "service": "storage",
        "provider": "gcp",
        "category": "Logging",
    },
]


def _check_generic(config: dict) -> list:
    """Run generic checks that apply universally across providers/services."""
    findings = []

    # GEN-001: Detect generic public access patterns
    pub_access = config.get("public_access", False)
    allow_pub = config.get("allow_public", False)
    acl_val = str(config.get("acl", "")).lower()
    
    if pub_access is True or allow_pub is True or "public-read" in acl_val:
        findings.append("GEN-001")

    # GEN-002: Detect generic weak permissive access patterns
    perms = str(config.get("permissions", "")).lower()
    role = str(config.get("role", "")).lower()
    policy = str(config.get("policy", "")).lower()
    iam_pol = str(config.get("iam_policy", "")).lower()
    allow_all = config.get("allow_all_users", False)

    if (perms == "*" or 
        role == "admin" or 
        policy == "*" or 
        iam_pol == "wildcard" or 
        allow_all is True):
        findings.append("GEN-002")

    return findings


def _check_s3(config: dict) -> list:
    """Run AWS S3 rules against config."""
    findings = []

    # S3-001: Public ACL — also check simplified 'public_access' field
    acl = config.get("acl", "")
    public_access = config.get("public_access", config.get("publicAccess", None))
    if "public" in str(acl).lower() or public_access is True:
        findings.append("S3-001")

    # S3-002: Block Public Access
    bpa_fields = ["block_public_acls", "block_public_policy",
                  "ignore_public_acls", "restrict_public_buckets"]
    if any(not config.get(f, True) for f in bpa_fields):
        findings.append("S3-002")

    # S3-003: Encryption — also check simplified 'encryption_enabled' field
    enc = config.get("encryption", {})
    enc_enabled_flat = config.get("encryption_enabled", config.get("encryptionEnabled", None))
    if enc_enabled_flat is not None:
        # Simplified flat boolean field takes precedence
        if not enc_enabled_flat:
            findings.append("S3-003")
    elif not enc.get("enabled", False):
        findings.append("S3-003")

    # S3-004: Versioning — also check 'versioning_enabled'
    ver = config.get("versioning", config.get("versioning_enabled", True))
    if not ver:
        findings.append("S3-004")

    # S3-005: Logging — also check 'logging_enabled'
    log = config.get("logging", {})
    log_enabled_flat = config.get("logging_enabled", None)
    if log_enabled_flat is not None:
        if not log_enabled_flat:
            findings.append("S3-005")
    elif not log.get("enabled", True):
        findings.append("S3-005")

    # S3-006: Wildcard policy principal
    policy = config.get("policy", {})
    for stmt in policy.get("Statement", []):
        principal = stmt.get("Principal", "")
        action = stmt.get("Action", "")
        if principal == "*" and stmt.get("Effect") == "Allow":
            if "s3:*" in str(action) or action == "*":
                findings.append("S3-006")
                break

    return findings


def _check_iam(config: dict) -> list:
    """Run AWS IAM rules against config."""
    findings = []

    # IAM-001: Wildcard policy
    doc = config.get("policy_document", {})
    for stmt in doc.get("Statement", []):
        if (stmt.get("Effect") == "Allow" and
                stmt.get("Action") in ["*", ["*"]] and
                stmt.get("Resource") in ["*", ["*"]]):
            findings.append("IAM-001")
            break

    # IAM-002: MFA
    if not config.get("mfa_enabled", True):
        findings.append("IAM-002")

    # IAM-003: Weak password policy
    pp = config.get("password_policy", {})
    weak = (
        pp.get("minimum_length", 99) < 12 or
        not pp.get("require_uppercase", True) or
        not pp.get("require_numbers", True) or
        not pp.get("require_symbols", True)
    )
    if weak:
        findings.append("IAM-003")

    # IAM-004: Root MFA
    if not config.get("root_account_mfa", True):
        findings.append("IAM-004")

    # IAM-005: Key rotation
    if not config.get("access_keys_rotated", True):
        findings.append("IAM-005")

    return findings


def _check_azure_storage(config: dict) -> list:
    """Run Azure Storage rules against config."""
    findings = []

    if config.get("allow_blob_public_access", False):
        findings.append("AZ-001")

    enc = config.get("encryption", {}).get("services", {}).get("blob", {})
    if not enc.get("enabled", False):
        findings.append("AZ-002")

    if not config.get("https_only", True):
        findings.append("AZ-003")

    tls = config.get("minimum_tls_version", "TLS1_2")
    if tls in ["TLS1_0", "TLS1_1"]:
        findings.append("AZ-004")

    soft = config.get("soft_delete", {})
    if not soft.get("enabled", True):
        findings.append("AZ-005")

    return findings


def _check_gcp_storage(config: dict) -> list:
    """Run GCP Storage rules against config."""
    findings = []

    iam = config.get("iam_bindings", [])
    for binding in iam:
        members = binding.get("members", [])
        if "allUsers" in members or "allAuthenticatedUsers" in members:
            findings.append("GCP-001")
            break

    if not config.get("uniform_bucket_level_access", True):
        findings.append("GCP-002")

    if not config.get("logging", {}).get("enabled", True):
        findings.append("GCP-003")

    return findings


# Dispatch map
_CHECKER_MAP = {
    ("aws", "s3"): _check_s3,
    ("aws", "iam"): _check_iam,
    ("azure", "storage"): _check_azure_storage,
    ("gcp", "storage"): _check_gcp_storage,
}

# Auto-detect provider from service name when provider is not specified
_SERVICE_TO_PROVIDER = {
    "s3": "aws",
    "iam": "aws",
    "ec2": "aws",
    "rds": "aws",
    "lambda": "aws",
}

# Build lookup by rule id
_RULE_BY_ID = {r["id"]: r for r in RULES}


def run_rules(config: dict) -> list:
    """
    Run applicable rules against a parsed configuration dict.
    Returns a list of matched rule dicts (with id, title, severity, etc.).
    """
    provider = str(config.get("provider", "")).lower().strip()
    service = str(config.get("service", "")).lower().strip()

    # Auto-detect provider from service name if not specified
    if not provider and service:
        provider = _SERVICE_TO_PROVIDER.get(service, "")
        if provider:
            logger.info("Auto-detected provider=%s from service=%s", provider, service)
            config["provider"] = provider

    logger.info("Running rules for provider=%s service=%s", provider, service)

    # 1. Always run generic rules regardless of provider/service
    matched_ids = _check_generic(config)

    # 2. Add provider-specific rules if valid checker exists
    checker = _CHECKER_MAP.get((provider, service))
    if checker:
        matched_ids.extend(checker(config))
    else:
        logger.warning("No specific checker found for %s/%s, proceeding with generic only", provider, service)

    results = []
    for rid in matched_ids:
        rule = _RULE_BY_ID.get(rid)
        if rule:
            results.append(rule.copy())

    logger.info("Found %d findings", len(results))
    return results
