"""
attack_simulator.py - Cybersecurity extension module for CloudSentinel.
Provides mock/rule-based threat intelligence derived from scan results.
"""

import logging

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Attack-action templates keyed by finding title keywords
# ---------------------------------------------------------------------------
_ATTACK_TEMPLATES = {
    "Public Storage": {
        "actions": [
            "Enumerate bucket contents via unauthenticated API call",
            "Download all exposed objects including sensitive files",
            "Upload malicious payloads (ransomware, crypto-miners)",
            "Search for credentials or API keys in exposed files",
            "Exfiltrate customer PII for identity theft",
        ],
        "mock_files": [
            "customer-data.csv",
            "backup_2025.zip",
            "api_keys.txt",
            "financial_report.pdf",
            "internal_docs.zip",
        ],
    },
    "Public S3": {
        "actions": [
            "List all objects in the S3 bucket (s3:ListBucket)",
            "Download sensitive data (s3:GetObject)",
            "Upload malicious files (s3:PutObject)",
            "Delete critical backups (s3:DeleteObject)",
            "Search for AWS credentials in exposed files",
        ],
        "mock_files": [
            "user_records.csv",
            "db_credentials.json",
            "terraform.tfstate",
            "backup.tar.gz",
            ".env",
        ],
    },
    "Block Public Access": {
        "actions": [
            "Bypass ACL restrictions via direct URL access",
            "Enumerate public objects through bucket policy loopholes",
            "Perform directory listing on the exposed bucket",
        ],
        "mock_files": [
            "config.yaml",
            "deployment_manifest.json",
        ],
    },
    "Encryption": {
        "actions": [
            "Intercept unencrypted data in transit",
            "Read data at rest if physical access is obtained",
            "Exploit lack of envelope encryption to decode stored secrets",
        ],
        "mock_files": [
            "secrets.enc (now readable)",
            "ssl_private_key.pem",
        ],
    },
    "Wildcard": {
        "actions": [
            "Assume any IAM role in the account",
            "Escalate privileges to administrator",
            "Access all cloud services without restriction",
            "Create backdoor IAM users for persistence",
            "Disable CloudTrail logging to cover tracks",
        ],
        "mock_files": [
            "iam_credentials.json",
            "root_access_key.txt",
            "service_account_token.json",
        ],
    },
    "MFA": {
        "actions": [
            "Brute-force login without second-factor challenge",
            "Perform credential-stuffing attacks",
            "Hijack sessions after phishing credentials",
        ],
        "mock_files": [
            "session_tokens.log",
        ],
    },
    "Password": {
        "actions": [
            "Crack weak passwords via dictionary attack",
            "Spray commonly used passwords across accounts",
            "Exploit password reuse from leaked credential databases",
        ],
        "mock_files": [
            "user_hashes.db",
            "leaked_passwords.txt",
        ],
    },
    "Root Account": {
        "actions": [
            "Compromise the root account with stolen credentials",
            "Gain unrestricted access to all resources",
            "Modify billing and organizational settings",
        ],
        "mock_files": [
            "root_mfa_recovery_codes.txt",
        ],
    },
    "Access Keys": {
        "actions": [
            "Use stale access keys that may have been leaked",
            "Scan public GitHub repos for committed keys",
            "Pivot into other AWS services using the keys",
        ],
        "mock_files": [
            ".aws/credentials",
            "access_key_backup.csv",
        ],
    },
    "Azure Blob": {
        "actions": [
            "Enumerate blobs in publicly accessible containers",
            "Download sensitive Azure Storage objects",
            "Upload malicious content to writable containers",
        ],
        "mock_files": [
            "azure_backup.vhd",
            "connection_strings.json",
            "customer_records.parquet",
        ],
    },
    "HTTPS": {
        "actions": [
            "Perform man-in-the-middle attack on HTTP traffic",
            "Intercept authentication tokens in plaintext",
            "Inject malicious responses via HTTP downgrade",
        ],
        "mock_files": [
            "auth_token.txt (captured)",
        ],
    },
    "TLS": {
        "actions": [
            "Exploit POODLE/BEAST vulnerabilities on TLS 1.0",
            "Downgrade connection to weak cipher suites",
        ],
        "mock_files": [],
    },
    "GCP Bucket": {
        "actions": [
            "Access GCS objects as allUsers (no auth required)",
            "Download all bucket contents via gsutil",
            "Enumerate IAM bindings to find further access",
        ],
        "mock_files": [
            "service_account.json",
            "gcp_project_config.yaml",
            "data_export.csv",
        ],
    },
    "Logging Disabled": {
        "actions": [
            "Perform malicious operations without audit trail",
            "Cover tracks of data exfiltration",
            "Maintain persistence undetected",
        ],
        "mock_files": [],
    },
    "Soft Delete": {
        "actions": [
            "Permanently delete data with no recovery option",
            "Execute ransomware attack destroying backups",
        ],
        "mock_files": [],
    },
    "Versioning": {
        "actions": [
            "Overwrite critical files with malicious versions",
            "Delete data with no rollback capability",
        ],
        "mock_files": [],
    },
    "Weak Access": {
        "actions": [
            "Access resources with overly permissive permissions",
            "Escalate from read-only to admin via misconfigured roles",
            "Exfiltrate data by abusing broad access policies",
        ],
        "mock_files": [
            "admin_panel_export.csv",
            "audit_log.json",
        ],
    },
}

# Fallback template
_DEFAULT_TEMPLATE = {
    "actions": [
        "Exploit the detected misconfiguration",
        "Attempt lateral movement within the environment",
        "Search for additional attack surfaces",
    ],
    "mock_files": ["unknown_asset.bin"],
}


def _match_template(title: str) -> dict:
    """Find the best matching attack template for a finding title."""
    title_lower = title.lower()
    for keyword, template in _ATTACK_TEMPLATES.items():
        if keyword.lower() in title_lower:
            return template
    return _DEFAULT_TEMPLATE


# ---------------------------------------------------------------------------
# 1. Attack Simulation
# ---------------------------------------------------------------------------
def simulate_attacks(findings: list) -> list:
    """
    For each finding, return possible attacker actions and mock exposed files.
    """
    results = []
    for f in findings:
        title = f.get("title", "Unknown")
        tmpl = _match_template(title)
        results.append({
            "finding": title,
            "severity": f.get("severity", "MEDIUM"),
            "rule_id": f.get("id", ""),
            "actions": tmpl["actions"],
            "mock_files": tmpl["mock_files"],
        })
    return results


# ---------------------------------------------------------------------------
# 2. Attack Path Builder
# ---------------------------------------------------------------------------
_PATH_CHAINS = {
    "CRITICAL": [
        {"step": "Initial Access", "detail": "Exploit publicly accessible resource", "risk": "CRITICAL"},
        {"step": "Discovery", "detail": "Enumerate all accessible objects and metadata", "risk": "HIGH"},
        {"step": "Credential Harvesting", "detail": "Locate credentials, API keys, or tokens in exposed files", "risk": "CRITICAL"},
        {"step": "Lateral Movement", "detail": "Use harvested credentials to access internal cloud services", "risk": "CRITICAL"},
        {"step": "Privilege Escalation", "detail": "Escalate to admin or root level access", "risk": "CRITICAL"},
        {"step": "Full Compromise", "detail": "Gain unrestricted control over the cloud environment", "risk": "CRITICAL"},
    ],
    "HIGH": [
        {"step": "Initial Access", "detail": "Exploit weak access controls or authentication gaps", "risk": "HIGH"},
        {"step": "Discovery", "detail": "Enumerate available services and permissions", "risk": "MEDIUM"},
        {"step": "Data Exfiltration", "detail": "Download sensitive data using overpermissive policies", "risk": "HIGH"},
        {"step": "Persistence", "detail": "Create backdoor user or service account", "risk": "HIGH"},
    ],
    "MEDIUM": [
        {"step": "Reconnaissance", "detail": "Identify unprotected data stores or weak configurations", "risk": "MEDIUM"},
        {"step": "Data Access", "detail": "Read unencrypted or unprotected data", "risk": "MEDIUM"},
        {"step": "Information Gathering", "detail": "Collect infrastructure details for future attacks", "risk": "LOW"},
    ],
    "LOW": [
        {"step": "Reconnaissance", "detail": "Identify gaps in logging or monitoring", "risk": "LOW"},
        {"step": "Stealth Operations", "detail": "Perform actions that go undetected", "risk": "MEDIUM"},
    ],
}


def build_attack_path(findings: list) -> list:
    """
    Build an ordered escalation chain based on highest severity finding.
    """
    if not findings:
        return [{"step": "No Vulnerabilities", "detail": "No attack path — configuration appears secure", "risk": "NONE"}]

    severity_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    worst = min(findings, key=lambda f: severity_order.get(f.get("severity", "LOW"), 3))
    worst_sev = worst.get("severity", "MEDIUM")

    chain = _PATH_CHAINS.get(worst_sev, _PATH_CHAINS["MEDIUM"])
    return chain


# ---------------------------------------------------------------------------
# 3. Exposure Prediction
# ---------------------------------------------------------------------------
_KEYWORD_EXPOSURE = {
    "customer": ["Customer PII (Names, Emails, Addresses)", "Payment Information", "Account Credentials"],
    "user": ["User Profiles", "Authentication Tokens", "Session Data"],
    "financial": ["Financial Statements", "Transaction Records", "Tax Documents"],
    "finance": ["Financial Statements", "Transaction Records", "Tax Documents"],
    "backup": ["Database Dumps", "System Configurations", "Encryption Keys"],
    "log": ["Access Logs", "Audit Trails", "Error Traces with Stack Info"],
    "data": ["Mixed Sensitive Data", "Internal Reports", "Analytics Datasets"],
    "config": ["Infrastructure Configurations", "Environment Variables", "API Keys"],
    "secret": ["API Keys", "Database Passwords", "Service Account Credentials"],
    "key": ["SSH Keys", "TLS Certificates", "Encryption Keys"],
    "admin": ["Admin Credentials", "System Configuration", "User Management Data"],
    "internal": ["Internal Documents", "Company Communications", "Strategic Plans"],
    "public": ["Publicly Leaked Data", "Exposed Customer Records", "Media Assets"],
    "storage": ["General Cloud Storage", "Archived Documents", "Media Files"],
}

_SERVICE_EXPOSURE = {
    "s3": ["S3 Object Data", "Static Website Assets", "Application Backups"],
    "iam": ["IAM Policies", "Role Definitions", "Service Account Keys"],
    "storage": ["Blob/Object Storage Data", "VM Disk Snapshots", "Container Images"],
}


def predict_exposure(config_summary: dict) -> list:
    """
    Predict possible data exposure categories based on resource names and service type.
    """
    predictions = set()

    # Check bucket / resource names for keywords
    name_fields = ["bucket_name", "account_name", "policy_name"]
    for field in name_fields:
        name = str(config_summary.get(field, "")).lower()
        for keyword, exposures in _KEYWORD_EXPOSURE.items():
            if keyword in name:
                predictions.update(exposures)

    # Service-based predictions
    service = str(config_summary.get("service", "")).lower()
    if service in _SERVICE_EXPOSURE:
        predictions.update(_SERVICE_EXPOSURE[service])

    # Always add generic predictions if we have findings context
    if not predictions:
        predictions.update([
            "General Cloud Data",
            "Configuration Files",
            "Application Logs",
            "Potential Credentials",
        ])

    return sorted(predictions)


# ---------------------------------------------------------------------------
# 4. Security Drift Timeline
# ---------------------------------------------------------------------------
def generate_security_timeline(findings: list) -> list:
    """
    Generate a simulated timeline showing how misconfigurations might have appeared.
    """
    if not findings:
        return [
            {"day": 1, "event": "Resource created with secure defaults", "severity": "secure"},
            {"day": 30, "event": "No configuration changes detected", "severity": "secure"},
        ]

    severity_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    sorted_findings = sorted(findings, key=lambda f: severity_order.get(f.get("severity", "LOW"), 3), reverse=True)

    timeline = [
        {"day": 1, "event": "Resource created with secure defaults", "severity": "secure"},
    ]

    day = 3
    for i, f in enumerate(sorted_findings):
        sev = f.get("severity", "MEDIUM").lower()
        title = f.get("title", "Unknown change")

        if sev == "low":
            timeline.append({"day": day, "event": f"{title} — monitoring gap introduced", "severity": "low"})
        elif sev == "medium":
            timeline.append({"day": day, "event": f"{title} — security control weakened", "severity": "medium"})
        elif sev == "high":
            timeline.append({"day": day, "event": f"{title} — significant security regression", "severity": "high"})
        else:
            timeline.append({"day": day, "event": f"{title} — critical exposure created", "severity": "critical"})

        day += (5 + i * 3)

    timeline.append({
        "day": day + 2,
        "event": "⚠ Security Drift Alert — configuration has degraded significantly",
        "severity": "alert",
    })

    return timeline


# ---------------------------------------------------------------------------
# 5. Attacker View Simulation
# ---------------------------------------------------------------------------
_ATTACKER_VIEW_FILES = {
    "s3": [
        {"name": "customers.csv", "size": "2.4 MB", "type": "file", "sensitive": True},
        {"name": "financial_report_2025.pdf", "size": "890 KB", "type": "file", "sensitive": True},
        {"name": "backup.tar.gz", "size": "156 MB", "type": "file", "sensitive": True},
        {"name": "terraform.tfstate", "size": "45 KB", "type": "file", "sensitive": True},
        {"name": ".env", "size": "1.2 KB", "type": "file", "sensitive": True},
        {"name": "logs/", "size": "--", "type": "directory", "sensitive": False},
        {"name": "logs/access.log", "size": "12 MB", "type": "file", "sensitive": False},
        {"name": "logs/error.log", "size": "3.1 MB", "type": "file", "sensitive": False},
        {"name": "static/", "size": "--", "type": "directory", "sensitive": False},
        {"name": "static/logo.png", "size": "24 KB", "type": "file", "sensitive": False},
    ],
    "iam": [
        {"name": "iam_policy_export.json", "size": "18 KB", "type": "file", "sensitive": True},
        {"name": "root_access_keys.csv", "size": "450 B", "type": "file", "sensitive": True},
        {"name": "service_accounts/", "size": "--", "type": "directory", "sensitive": True},
        {"name": "service_accounts/deploy-bot.json", "size": "2.1 KB", "type": "file", "sensitive": True},
        {"name": "service_accounts/ci-runner.json", "size": "1.8 KB", "type": "file", "sensitive": True},
        {"name": "role_definitions.yaml", "size": "8 KB", "type": "file", "sensitive": False},
    ],
    "storage": [
        {"name": "vm-snapshots/", "size": "--", "type": "directory", "sensitive": True},
        {"name": "vm-snapshots/prod-db-snap.vhd", "size": "4.2 GB", "type": "file", "sensitive": True},
        {"name": "connection_strings.json", "size": "2 KB", "type": "file", "sensitive": True},
        {"name": "blob-data/", "size": "--", "type": "directory", "sensitive": False},
        {"name": "blob-data/reports.xlsx", "size": "340 KB", "type": "file", "sensitive": True},
        {"name": "blob-data/public_images/", "size": "--", "type": "directory", "sensitive": False},
    ],
}

_DEFAULT_FILES = [
    {"name": "data.csv", "size": "1.5 MB", "type": "file", "sensitive": True},
    {"name": "config.json", "size": "4 KB", "type": "file", "sensitive": True},
    {"name": "README.md", "size": "2 KB", "type": "file", "sensitive": False},
]


def simulate_attacker_view(config_summary: dict, findings: list) -> dict:
    """
    Simulate what an attacker would see if they accessed the misconfigured resource.
    """
    service = str(config_summary.get("service", "")).lower()
    provider = str(config_summary.get("provider", "unknown")).upper()
    bucket_name = config_summary.get(
        "bucket_name",
        config_summary.get("account_name",
                           config_summary.get("policy_name", "target-resource"))
    )

    files = _ATTACKER_VIEW_FILES.get(service, _DEFAULT_FILES)

    has_critical = any(f.get("severity") == "CRITICAL" for f in findings)

    return {
        "resource_name": bucket_name,
        "provider": provider,
        "access_level": "PUBLIC READ/WRITE" if has_critical else "PUBLIC READ",
        "files": files,
        "total_sensitive": sum(1 for f in files if f.get("sensitive")),
        "total_files": len([f for f in files if f["type"] == "file"]),
    }
