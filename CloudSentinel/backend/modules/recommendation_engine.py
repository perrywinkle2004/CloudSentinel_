"""
recommendation_engine.py - Maps rule IDs to detailed fix recommendations.
"""

RECOMMENDATIONS = {
    "GEN-001": {
        "title": "Disable Public Access",
        "steps": [
            "Review configuration settings for public access flags.",
            "Set public access parameters to false and restrict ACLs.",
            "Verify through identity policies."
        ],
        "config_example": '{\n  "public_access": false,\n  "acl": "private",\n  "allow_public": false\n}',
        "cli_example": "# Ensure access settings are updated via provider CLI",
        "reference": "https://owasp.org/www-project-top-10/",
    },
    "GEN-002": {
        "title": "Restrict Wildcard Privileges",
        "steps": [
            "Identify overly permissive values (e.g., '*').",
            "Apply least-privilege principles to roles and policies.",
            "Limit access to required actions and resources only."
        ],
        "config_example": '{\n  "permissions": ["read", "write"],\n  "role": "restricted",\n  "allow_all_users": false\n}',
        "cli_example": "# Apply specific permissions and role values via provider CLI",
        "reference": "https://owasp.org/www-project-top-10/",
    },
    "S3-001": {
        "title": "Remove Public ACL from S3 Bucket",
        "steps": [
            "Set the bucket ACL to 'private' instead of 'public-read' or 'public-read-write'.",
            "Review all objects inside the bucket and set their ACL to 'private' as well.",
            "Enable 'Block Public Access' settings at both the bucket and account level.",
        ],
        "config_example": '{\n  "acl": "private"\n}',
        "cli_example": "aws s3api put-bucket-acl --bucket BUCKET_NAME --acl private",
        "reference": "https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-overview.html",
    },
    "S3-002": {
        "title": "Enable S3 Block Public Access",
        "steps": [
            "Navigate to S3 → Bucket → Permissions → Block Public Access.",
            "Enable all four Block Public Access settings.",
            "Apply the same settings at the AWS account level for defense-in-depth.",
        ],
        "config_example": '{\n  "block_public_acls": true,\n  "block_public_policy": true,\n  "ignore_public_acls": true,\n  "restrict_public_buckets": true\n}',
        "cli_example": "aws s3api put-public-access-block --bucket BUCKET_NAME \\\n  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true",
        "reference": "https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html",
    },
    "S3-003": {
        "title": "Enable S3 Server-Side Encryption",
        "steps": [
            "Enable default encryption on the bucket using AES-256 or AWS KMS.",
            "Set a bucket policy to deny unencrypted uploads (aws:SecureTransport).",
            "Consider using SSE-KMS for enhanced key management and auditability.",
        ],
        "config_example": '{\n  "encryption": {\n    "enabled": true,\n    "type": "AES256"\n  }\n}',
        "cli_example": 'aws s3api put-bucket-encryption --bucket BUCKET_NAME \\\n  --server-side-encryption-configuration \'{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}\'',
        "reference": "https://docs.aws.amazon.com/AmazonS3/latest/userguide/serv-side-encryption.html",
    },
    "S3-004": {
        "title": "Enable S3 Versioning",
        "steps": [
            "Enable versioning on the S3 bucket.",
            "Configure lifecycle rules to expire old versions to manage costs.",
            "Enable MFA Delete to prevent accidental or malicious version deletion.",
        ],
        "config_example": '{\n  "versioning": true\n}',
        "cli_example": "aws s3api put-bucket-versioning --bucket BUCKET_NAME \\\n  --versioning-configuration Status=Enabled",
        "reference": "https://docs.aws.amazon.com/AmazonS3/latest/userguide/Versioning.html",
    },
    "S3-005": {
        "title": "Enable S3 Access Logging",
        "steps": [
            "Create a separate S3 bucket to store access logs.",
            "Enable server access logging on the target bucket.",
            "Set up log retention policies to manage storage costs.",
        ],
        "config_example": '{\n  "logging": {\n    "enabled": true,\n    "target_bucket": "my-access-logs-bucket"\n  }\n}',
        "cli_example": "aws s3api put-bucket-logging --bucket BUCKET_NAME \\\n  --bucket-logging-status '{\"LoggingEnabled\":{\"TargetBucket\":\"LOG_BUCKET\",\"TargetPrefix\":\"logs/\"}}'",
        "reference": "https://docs.aws.amazon.com/AmazonS3/latest/userguide/ServerLogs.html",
    },
    "S3-006": {
        "title": "Remove Wildcard Principal from S3 Bucket Policy",
        "steps": [
            "Review and remove any policy statements with 'Principal: *' and Effect: Allow.",
            "Replace wildcard principals with specific IAM roles or users.",
            "Use condition keys to restrict access further (e.g., aws:SourceVpc).",
        ],
        "config_example": '{\n  "Statement": [{\n    "Effect": "Allow",\n    "Principal": {"AWS": "arn:aws:iam::ACCOUNT:role/MyRole"},\n    "Action": "s3:GetObject",\n    "Resource": "arn:aws:s3:::BUCKET/*"\n  }]\n}',
        "cli_example": "aws s3api put-bucket-policy --bucket BUCKET_NAME --policy file://secure-policy.json",
        "reference": "https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucket-policies.html",
    },
    "IAM-001": {
        "title": "Replace Wildcard IAM Policy with Least-Privilege Policy",
        "steps": [
            "Identify exactly which AWS services and actions the role/user requires.",
            "Replace 'Action: *' and 'Resource: *' with specific actions and ARNs.",
            "Use IAM Access Analyzer to generate least-privilege policies from actual usage.",
            "Enable AWS Organizations SCPs to enforce permission boundaries.",
        ],
        "config_example": '{\n  "Statement": [{\n    "Effect": "Allow",\n    "Action": ["s3:GetObject", "s3:PutObject"],\n    "Resource": "arn:aws:s3:::my-bucket/*"\n  }]\n}',
        "cli_example": "aws iam put-role-policy --role-name ROLE_NAME \\\n  --policy-name LeastPrivilegePolicy --policy-document file://policy.json",
        "reference": "https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html",
    },
    "IAM-002": {
        "title": "Enable MFA for IAM Users",
        "steps": [
            "Require MFA for all IAM users using a conditional policy.",
            "Add a policy that denies all actions unless MFA is present.",
            "Use hardware MFA tokens for privileged users.",
        ],
        "config_example": '{\n  "mfa_enabled": true\n}',
        "cli_example": "aws iam enable-mfa-device --user-name USER --serial-number MFA_ARN --authentication-code1 CODE1 --authentication-code2 CODE2",
        "reference": "https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_mfa.html",
    },
    "IAM-003": {
        "title": "Enforce Strong Password Policy",
        "steps": [
            "Set minimum password length to at least 14 characters.",
            "Require uppercase, lowercase, numbers, and special characters.",
            "Set maximum password age to 90 days.",
            "Prevent password reuse (at least last 24 passwords).",
        ],
        "config_example": '{\n  "minimum_length": 14,\n  "require_uppercase": true,\n  "require_lowercase": true,\n  "require_numbers": true,\n  "require_symbols": true,\n  "max_password_age": 90,\n  "password_reuse_prevention": 24\n}',
        "cli_example": "aws iam update-account-password-policy --minimum-password-length 14 --require-uppercase-characters --require-lowercase-characters --require-numbers --require-symbols --max-password-age 90 --password-reuse-prevention 24",
        "reference": "https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_passwords_account-policy.html",
    },
    "IAM-004": {
        "title": "Enable MFA on Root Account",
        "steps": [
            "Log in to AWS Console as root user.",
            "Go to IAM → Security credentials.",
            "Assign a virtual or hardware MFA device to the root account.",
            "Avoid using the root account for daily operations.",
        ],
        "config_example": '{\n  "root_account_mfa": true\n}',
        "cli_example": "# Root MFA must be configured via the AWS Console. Use hardware MFA for root accounts.",
        "reference": "https://docs.aws.amazon.com/IAM/latest/UserGuide/id_root-user.html",
    },
    "IAM-005": {
        "title": "Rotate IAM Access Keys Regularly",
        "steps": [
            "Create a new access key for the IAM user.",
            "Update all applications using the old key to use the new one.",
            "Deactivate and then delete the old access key.",
            "Set up AWS Config rules to alert on keys older than 90 days.",
        ],
        "config_example": '{\n  "access_keys_rotated": true\n}',
        "cli_example": "aws iam create-access-key --user-name USERNAME\naws iam delete-access-key --user-name USERNAME --access-key-id OLD_KEY_ID",
        "reference": "https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html",
    },
    "AZ-001": {
        "title": "Disable Azure Blob Public Access",
        "steps": [
            "Set 'allowBlobPublicAccess' to false on the storage account.",
            "Review all containers and change their access level to 'Private'.",
            "Use Azure AD authentication instead of shared-access keys.",
        ],
        "config_example": '{\n  "allow_blob_public_access": false\n}',
        "cli_example": "az storage account update --name ACCOUNT_NAME --resource-group RG_NAME --allow-blob-public-access false",
        "reference": "https://docs.microsoft.com/azure/storage/blobs/anonymous-read-access-configure",
    },
    "AZ-002": {
        "title": "Enable Azure Storage Encryption",
        "steps": [
            "Enable Azure Storage encryption for blob, file, table, and queue services.",
            "Consider using customer-managed keys (CMK) stored in Azure Key Vault.",
            "Verify encryption status using Azure Security Center.",
        ],
        "config_example": '{\n  "encryption": {\n    "services": {\n      "blob": {"enabled": true}\n    }\n  }\n}',
        "cli_example": "az storage account update --name ACCOUNT_NAME --resource-group RG_NAME --encryption-services blob",
        "reference": "https://docs.microsoft.com/azure/storage/common/storage-service-encryption",
    },
    "AZ-003": {
        "title": "Enforce HTTPS-Only Traffic on Azure Storage",
        "steps": [
            "Enable 'Secure transfer required' on the storage account.",
            "Update any client applications to use HTTPS endpoints.",
            "Use Azure Policy to enforce HTTPS-only across all storage accounts.",
        ],
        "config_example": '{\n  "https_only": true\n}',
        "cli_example": "az storage account update --name ACCOUNT_NAME --resource-group RG_NAME --https-only true",
        "reference": "https://docs.microsoft.com/azure/storage/common/storage-require-secure-transfer",
    },
    "AZ-004": {
        "title": "Upgrade Minimum TLS Version to 1.2",
        "steps": [
            "Set the minimum TLS version to TLS 1.2 on the storage account.",
            "Test that all client applications support TLS 1.2.",
            "Plan migration to TLS 1.3 where supported.",
        ],
        "config_example": '{\n  "minimum_tls_version": "TLS1_2"\n}',
        "cli_example": "az storage account update --name ACCOUNT_NAME --resource-group RG_NAME --min-tls-version TLS1_2",
        "reference": "https://docs.microsoft.com/azure/storage/common/transport-layer-security-configure-minimum-version",
    },
    "AZ-005": {
        "title": "Enable Azure Blob Soft Delete",
        "steps": [
            "Enable soft delete for blobs with a retention period of at least 7 days.",
            "Also enable soft delete for containers.",
            "Test recovery of soft-deleted blobs in a non-production environment.",
        ],
        "config_example": '{\n  "soft_delete": {\n    "enabled": true,\n    "retention_days": 7\n  }\n}',
        "cli_example": "az storage blob service-properties delete-policy update --account-name ACCOUNT_NAME --enable true --days-retained 7",
        "reference": "https://docs.microsoft.com/azure/storage/blobs/soft-delete-blob-overview",
    },
    "GCP-001": {
        "title": "Remove Public IAM Bindings from GCP Bucket",
        "steps": [
            "Remove 'allUsers' and 'allAuthenticatedUsers' from all bucket IAM bindings.",
            "Grant access only to specific service accounts or user accounts.",
            "Enable VPC Service Controls to prevent data exfiltration.",
        ],
        "config_example": '{\n  "iam_bindings": [{\n    "role": "roles/storage.objectViewer",\n    "members": ["serviceAccount:my-sa@project.iam.gserviceaccount.com"]\n  }]\n}',
        "cli_example": "gsutil iam ch -d allUsers gs://BUCKET_NAME\ngsutil iam ch -d allAuthenticatedUsers gs://BUCKET_NAME",
        "reference": "https://cloud.google.com/storage/docs/access-control/iam",
    },
    "GCP-002": {
        "title": "Enable Uniform Bucket-Level Access on GCP",
        "steps": [
            "Enable uniform bucket-level access to disable object-level ACLs.",
            "Migrate any existing object ACLs to IAM policies before enabling.",
        ],
        "config_example": '{\n  "uniform_bucket_level_access": true\n}',
        "cli_example": "gsutil ubla set on gs://BUCKET_NAME",
        "reference": "https://cloud.google.com/storage/docs/uniform-bucket-level-access",
    },
    "GCP-003": {
        "title": "Enable GCP Bucket Access Logging",
        "steps": [
            "Create a separate logging bucket in the same region.",
            "Enable access logs on the target bucket.",
            "Set up log sink to export logs to BigQuery for analysis.",
        ],
        "config_example": '{\n  "logging": {\n    "enabled": true,\n    "log_bucket": "my-access-logs"\n  }\n}',
        "cli_example": "gsutil logging set on -b gs://LOG_BUCKET gs://BUCKET_NAME",
        "reference": "https://cloud.google.com/storage/docs/access-logs",
    },
}


def get_recommendations(findings: list) -> list:
    """
    Given a list of finding dicts (each with an 'id' key),
    attach recommendation data to each finding.
    """
    enriched = []
    for finding in findings:
        rule_id = finding.get("id")
        rec = RECOMMENDATIONS.get(rule_id, {
            "title": "Review and remediate this misconfiguration",
            "steps": ["Consult your cloud provider's security best practices documentation."],
            "config_example": "",
            "cli_example": "",
            "reference": "",
        })
        enriched.append({**finding, "recommendation": rec})
    return enriched
