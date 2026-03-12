# ☁️ CloudSentinel — Cloud Security Posture & Misconfiguration Scanner

> **Educational prototype · Fully local · No real cloud credentials required**

CloudSentinel is a full-stack cybersecurity dashboard that scans cloud configuration files and detects security misconfigurations. It demonstrates Cloud Security Posture Management (CSPM) concepts with a rule-based detection engine, risk scoring, and actionable remediation guidance.

---

## 🎯 Features

| Feature | Details |
|---------|---------|
| **Config Upload** | Drag-and-drop JSON / YAML / TXT files or paste config text |
| **Simulation Mode** | Select provider → service → scenario; auto-generates & scans a sample config |
| **Detection Engine** | 20+ rules covering AWS S3, IAM, Azure Storage, GCP Storage |
| **Risk Scoring** | 0–100 score with severity-weighted penalties (CRITICAL -40, HIGH -25…) |
| **Fix Recommendations** | Step-by-step remediation + copyable config snippets + CLI commands |
| **Security Dashboard** | Pie charts, bar charts, aggregate posture overview |
| **Scan History** | Persistent history via MongoDB (auto-falls back to in-memory) |

---

## 🏗️ Architecture

```
cloudsentinel/
├── backend/               # Python + FastAPI
│   ├── main.py            # App entry point
│   ├── routes/
│   │   ├── scan.py        # POST /api/scan/upload, /simulate, GET /options
│   │   └── history.py     # GET /api/history/
│   ├── modules/
│   │   ├── config_parser.py       # JSON/YAML parser
│   │   ├── rule_engine.py         # 20+ security rules
│   │   ├── risk_engine.py         # Score calculation
│   │   └── recommendation_engine.py  # Fix guidance
│   └── database/
│       └── mongodb.py     # Async Motor client (in-memory fallback)
│
├── frontend/              # React + Vite + TailwindCSS
│   └── src/
│       ├── pages/         # Landing, Dashboard, Scan, Results, History
│       └── components/    # Navbar, AlertCard, RiskMeter
│
├── sample_configs/        # Ready-to-upload test files
└── requirements.txt
```

---

## ⚡ Quick Start

### Prerequisites

- **Python 3.10+**
- **Node.js 18+** and **npm**
- (Optional) **MongoDB** — the app works without it using in-memory storage

---

### 1. Clone / Unzip

```bash
unzip cloudsentinel.zip
cd cloudsentinel
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# Install dependencies
pip install -r ../requirements.txt

# Start the API server
uvicorn main:app --reload --port 8000
```

The API will be available at: **http://localhost:8000**  
Interactive docs: **http://localhost:8000/docs**

### 3. Frontend Setup

Open a **new terminal**:

```bash
cd cloudsentinel/frontend

# Install npm packages
npm install

# Start Vite dev server
npm run dev
```

The app will be available at: **http://localhost:5173**

---

## 🧪 Testing the Scanner

### Option A: Simulation Mode (No File Needed)

1. Open **http://localhost:5173**
2. Click **Scan** in the navbar
3. Choose `AWS` → `S3` → `Public S3 Bucket`
4. Click **Run Scan**

### Option B: Upload Sample Files

Upload any file from `sample_configs/`:

| File | Provider | Expected Findings |
|------|---------|------------------|
| `aws_s3_public.json` | AWS S3 | 5 issues (CRITICAL + HIGH + MEDIUM) |
| `aws_s3_secure.json` | AWS S3 | 0 issues (Score: 100) |
| `aws_iam_weak.json` | AWS IAM | 5 issues (multiple CRITICAL) |
| `azure_storage_weak.json` | Azure Storage | 5 issues |

---

## 🔍 Detection Rules

### AWS S3
| Rule ID | Issue | Severity |
|---------|-------|----------|
| S3-001 | Public Bucket ACL | CRITICAL |
| S3-002 | Block Public Access Disabled | CRITICAL |
| S3-003 | Encryption Disabled | HIGH |
| S3-004 | Versioning Disabled | MEDIUM |
| S3-005 | Access Logging Disabled | LOW |
| S3-006 | Wildcard Policy Principal | CRITICAL |

### AWS IAM
| Rule ID | Issue | Severity |
|---------|-------|----------|
| IAM-001 | Wildcard Action/Resource Policy | CRITICAL |
| IAM-002 | MFA Not Enabled | HIGH |
| IAM-003 | Weak Password Policy | HIGH |
| IAM-004 | Root Account MFA Disabled | CRITICAL |
| IAM-005 | Access Keys Not Rotated | MEDIUM |

### Azure Storage
| Rule ID | Issue | Severity |
|---------|-------|----------|
| AZ-001 | Blob Public Access Enabled | CRITICAL |
| AZ-002 | Encryption Disabled | HIGH |
| AZ-003 | HTTPS Not Enforced | HIGH |
| AZ-004 | TLS < 1.2 | MEDIUM |
| AZ-005 | Soft Delete Disabled | LOW |

### GCP Storage
| Rule ID | Issue | Severity |
|---------|-------|----------|
| GCP-001 | Bucket Publicly Accessible | CRITICAL |
| GCP-002 | Uniform Access Disabled | MEDIUM |
| GCP-003 | Logging Disabled | LOW |

---

## 📊 Risk Score Formula

```
Score = 100
Score -= 40 × (number of CRITICAL findings)
Score -= 25 × (number of HIGH findings)
Score -= 15 × (number of MEDIUM findings)
Score -= 5  × (number of LOW findings)
Score = max(Score, 0)
```

| Score Range | Rating |
|-------------|--------|
| 90–100 | 🟢 Secure |
| 70–89  | 🟡 Moderate Risk |
| 40–69  | 🟠 High Risk |
| 0–39   | 🔴 Critical Risk |

---

## 🌐 API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/scan/upload` | POST | Scan uploaded file or pasted text |
| `/api/scan/simulate` | POST | Scan a simulated scenario |
| `/api/scan/options` | GET | Get available simulation options |
| `/api/history/` | GET | Get scan history |
| `/docs` | GET | Interactive Swagger UI |

---

## 🗜️ Create ZIP Archive

```bash
cd cloudsentinel/..
zip -r cloudsentinel.zip cloudsentinel/ \
  --exclude "cloudsentinel/frontend/node_modules/*" \
  --exclude "cloudsentinel/backend/venv/*" \
  --exclude "cloudsentinel/**/__pycache__/*"
```

---

## 🛡️ Disclaimer

CloudSentinel is an **educational prototype**. It does not connect to real cloud accounts or require any cloud credentials. All configurations are simulated locally for demonstration purposes.
