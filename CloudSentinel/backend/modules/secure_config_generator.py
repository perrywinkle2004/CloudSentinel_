"""
secure_config_generator.py - Generates a hardened version of a scanned configuration.

Takes the original config dict and the list of findings, then applies the
recommended secure values for every detected misconfiguration.
"""

import copy
import json
import logging

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Secure-fix transforms keyed by rule ID
# Each value is a callable:  fix(config) -> list[str]   (returns change descriptions)
# ---------------------------------------------------------------------------

def _fix_gen_001(cfg):
    """Disable generic public access fields."""
    changes = []
    if cfg.get("public_access") is True or str(cfg.get("public_access", "")).lower() == "true":
        cfg["public_access"] = False
        changes.append("Set public_access to false")

    if cfg.get("allow_public") is True or str(cfg.get("allow_public", "")).lower() == "true":
        cfg["allow_public"] = False
        changes.append("Set allow_public to false")

    if "public-read" in str(cfg.get("acl", "")).lower():
        cfg["acl"] = "private"
        changes.append("Set acl to private to remove public access")

    return changes


def _fix_gen_002(cfg):
    """Restrict generic weak privileges."""
    changes = []
    
    perms = str(cfg.get("permissions", "")).lower()
    if perms == "*":
        cfg["permissions"] = ["read", "write"]
        changes.append("Replaced wildcard permissions with restricted array elements")

    role = str(cfg.get("role", "")).lower()
    if role == "admin":
        cfg["role"] = "restricted"
        changes.append("Changed role from 'admin' to 'restricted'")

    policy = str(cfg.get("policy", "")).lower()
    if policy == "*":
        cfg["policy"] = "restricted-policy"
        changes.append("Replaced wildcard policy with a restricted policy name")

    iam_pol = str(cfg.get("iam_policy", "")).lower()
    if iam_pol == "wildcard":
        cfg["iam_policy"] = "restricted-policy"
        changes.append("Replaced wildcard iam_policy with a restricted policy name")

    allow_all = cfg.get("allow_all_users")
    if allow_all is True or str(allow_all).lower() == "true":
        cfg["allow_all_users"] = False
        changes.append("Disabled allow_all_users")

    return changes


def _fix_s3_001(cfg):
    """Set ACL to private."""
    changes = []
    original_acl = cfg.get("acl", "public-read")
    if original_acl != "private":
        cfg["acl"] = "private"
        changes.append("Set bucket ACL to 'private' (was '{}')".format(original_acl))
    return changes


def _fix_s3_002(cfg):
    """Enable all Block Public Access settings."""
    fields = ["block_public_acls", "block_public_policy",
              "ignore_public_acls", "restrict_public_buckets"]
    changes = []
    for f in fields:
        if not cfg.get(f, False):
            cfg[f] = True
            changes.append(f"Enabled '{f}'")
    return changes


def _fix_s3_003(cfg):
    """Enable server-side encryption."""
    enc = cfg.get("encryption", {})
    changes = []
    if not enc.get("enabled", False):
        cfg["encryption"] = {"enabled": True, "type": "AES256"}
        changes.append("Enabled server-side encryption (AES256)")
    return changes


def _fix_s3_004(cfg):
    """Enable versioning."""
    changes = []
    if not cfg.get("versioning", False):
        cfg["versioning"] = True
        changes.append("Enabled bucket versioning")
    return changes


def _fix_s3_005(cfg):
    """Enable access logging."""
    log = cfg.get("logging", {})
    changes = []
    if not log.get("enabled", False):
        cfg["logging"] = {"enabled": True, "target_bucket": "access-logs-bucket"}
        changes.append("Enabled access logging")
    return changes


def _fix_s3_006(cfg):
    """Remove wildcard principal from bucket policy."""
    policy = cfg.get("policy", {})
    stmts = policy.get("Statement", [])
    changes = []
    new_stmts = []
    for stmt in stmts:
        if stmt.get("Principal") == "*" and stmt.get("Effect") == "Allow":
            changes.append("Removed wildcard principal (*) statement from bucket policy")
            continue
        new_stmts.append(stmt)
    if changes:
        cfg["policy"] = {**policy, "Statement": new_stmts}
    return changes


def _fix_iam_001(cfg):
    """Replace wildcard IAM policy."""
    doc = cfg.get("policy_document", {})
    changes = []
    new_stmts = []
    for stmt in doc.get("Statement", []):
        if stmt.get("Action") in ["*", ["*"]] and stmt.get("Resource") in ["*", ["*"]]:
            new_stmts.append({
                "Effect": "Allow",
                "Action": ["s3:GetObject", "s3:PutObject"],
                "Resource": "arn:aws:s3:::my-bucket/*",
            })
            changes.append("Replaced wildcard IAM policy (Action:*, Resource:*) with least-privilege example")
        else:
            new_stmts.append(stmt)
    if changes:
        cfg["policy_document"] = {**doc, "Statement": new_stmts}
    return changes


def _fix_iam_002(cfg):
    """Enable MFA."""
    changes = []
    if not cfg.get("mfa_enabled", True):
        cfg["mfa_enabled"] = True
        changes.append("Enabled Multi-Factor Authentication")
    return changes


def _fix_iam_003(cfg):
    """Enforce strong password policy."""
    changes = []
    secure = {
        "minimum_length": 14,
        "require_uppercase": True,
        "require_lowercase": True,
        "require_numbers": True,
        "require_symbols": True,
        "max_password_age": 90,
        "password_reuse_prevention": 24,
    }
    cfg["password_policy"] = secure
    changes.append("Enforced strong password policy (min 14 chars, complexity, 90-day expiry)")
    return changes


def _fix_iam_004(cfg):
    """Enable root account MFA."""
    changes = []
    if not cfg.get("root_account_mfa", True):
        cfg["root_account_mfa"] = True
        changes.append("Enabled MFA on root account")
    return changes


def _fix_iam_005(cfg):
    """Mark access keys as rotated."""
    changes = []
    if not cfg.get("access_keys_rotated", True):
        cfg["access_keys_rotated"] = True
        changes.append("Marked access keys as rotated (set rotation policy)")
    return changes


def _fix_az_001(cfg):
    changes = []
    if cfg.get("allow_blob_public_access", False):
        cfg["allow_blob_public_access"] = False
        changes.append("Disabled public blob access")
    return changes


def _fix_az_002(cfg):
    changes = []
    enc = cfg.get("encryption", {}).get("services", {}).get("blob", {})
    if not enc.get("enabled", False):
        cfg.setdefault("encryption", {}).setdefault("services", {})["blob"] = {"enabled": True}
        changes.append("Enabled Azure blob encryption")
    return changes


def _fix_az_003(cfg):
    changes = []
    if not cfg.get("https_only", True):
        cfg["https_only"] = True
        changes.append("Enforced HTTPS-only traffic")
    return changes


def _fix_az_004(cfg):
    changes = []
    tls = cfg.get("minimum_tls_version", "TLS1_2")
    if tls in ("TLS1_0", "TLS1_1"):
        cfg["minimum_tls_version"] = "TLS1_2"
        changes.append(f"Upgraded minimum TLS version from {tls} to TLS1_2")
    return changes


def _fix_az_005(cfg):
    changes = []
    if not cfg.get("soft_delete", {}).get("enabled", True):
        cfg["soft_delete"] = {"enabled": True, "retention_days": 7}
        changes.append("Enabled soft delete with 7-day retention")
    return changes


def _fix_gcp_001(cfg):
    changes = []
    bindings = cfg.get("iam_bindings", [])
    new_bindings = []
    for b in bindings:
        members = [m for m in b.get("members", [])
                   if m not in ("allUsers", "allAuthenticatedUsers")]
        if not members:
            members = ["serviceAccount:secure-sa@project.iam.gserviceaccount.com"]
        new_bindings.append({**b, "members": members})
        if len(members) != len(b.get("members", [])):
            changes.append("Removed allUsers/allAuthenticatedUsers from IAM bindings")
    cfg["iam_bindings"] = new_bindings
    return changes


def _fix_gcp_002(cfg):
    changes = []
    if not cfg.get("uniform_bucket_level_access", True):
        cfg["uniform_bucket_level_access"] = True
        changes.append("Enabled uniform bucket-level access")
    return changes


def _fix_gcp_003(cfg):
    changes = []
    if not cfg.get("logging", {}).get("enabled", True):
        cfg["logging"] = {"enabled": True, "log_bucket": "access-logs"}
        changes.append("Enabled GCP bucket access logging")
    return changes


# Dispatch map
_FIX_MAP = {
    "GEN-001": _fix_gen_001, "GEN-002": _fix_gen_002,
    "S3-001": _fix_s3_001, "S3-002": _fix_s3_002, "S3-003": _fix_s3_003,
    "S3-004": _fix_s3_004, "S3-005": _fix_s3_005, "S3-006": _fix_s3_006,
    "IAM-001": _fix_iam_001, "IAM-002": _fix_iam_002, "IAM-003": _fix_iam_003,
    "IAM-004": _fix_iam_004, "IAM-005": _fix_iam_005,
    "AZ-001": _fix_az_001, "AZ-002": _fix_az_002, "AZ-003": _fix_az_003,
    "AZ-004": _fix_az_004, "AZ-005": _fix_az_005,
    "GCP-001": _fix_gcp_001, "GCP-002": _fix_gcp_002, "GCP-003": _fix_gcp_003,
}


def generate_secure_config(original_config: dict, findings: list) -> dict:
    """
    Given the original configuration and the list of findings,
    produce a hardened config and a summary of changes.
    """
    secure = copy.deepcopy(original_config)
    all_changes = []

    for finding in findings:
        rule_id = finding.get("id", "")
        fixer = _FIX_MAP.get(rule_id)
        if fixer:
            changes = fixer(secure)
            all_changes.extend(changes)

    logger.info("Generated secure config with %d changes", len(all_changes))
    return {
        "original_config": original_config,
        "secure_config": secure,
        "changes": all_changes,
        "total_changes": len(all_changes),
    }
