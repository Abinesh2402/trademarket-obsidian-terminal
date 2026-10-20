# 🛡️ CYBERGUARD // Universal Scam & Spam Detection System

An enterprise-grade, multi-vector **Scam, Spam, Phishing, and Fraud Detection System** powered by **Machine Learning (TF-IDF + Logistic Regression)**, **10-Digit Indian Mobile Phone Validation**, **SQLite Deduplication Caching & Audit History**, **Heuristic Threat Pattern Analysis**, and **URL Forensics**.

---

## ⚡ Highlights & Key Features

- **📱 Indian Mobile Number Validation**:
  - Validates 10-digit Indian mobile numbers starting with 6, 7, 8, or 9 (`^[6-9]\d{9}$`).
  - Automatically handles and cleans prefixes (+91, 0), spaces, and hyphens.
- **⚡ SQLite Deduplication Cache**:
  - Automatically checks if the same phone number has previously submitted the exact same message.
  - When a duplicate submission occurs, it retrieves the previously saved prediction, confidence, and timestamp from SQLite without re-running the ML model.
- **🎯 TF-IDF Vectorizer + Logistic Regression Engine (98.55% Accuracy)**:
  - Trained on 5,574 verified messages.
  - Classifies new messages as **HAM** (Legitimate) or **SPAM** with exact confidence score.
- **📜 Scan Audit History & Telemetry**:
  - All scans persist in SQLite (`scans.db`) with phone number, message, prediction (HAM/SPAM), confidence score, and timestamp.
  - Interactive Scan History modal in the web dashboard allows searching, filtering, and 1-click re-testing.
  - Includes safe, automatic database schema migration for existing databases.
- **🔗 Forensic URL & Link Inspector**:
  - Analyzes deceptive subdomains, punycode homographs (`xn--`), raw IP hosts (`http://192.168.1.1/login`), credential masquerading (`@` routing), URL shorteners (`bit.ly`, `tinyurl`), and high-risk abuse TLDs (`.xyz`, `.top`, `.click`).
- **🔍 Real-Time Text Red Flag Highlighter**:
  - Visually marks and classifies urgency triggers, direct credential harvesting requests, lottery bait, and malicious links directly in the message text.
- **🔌 Comprehensive REST API & CLI**:
  - Endpoints for single scan with phone validation (`/api/scan`), audit history (`/api/history`), batch inspection (`/api/batch-scan`), and CLI tool (`cli.py`).

---

## 📊 Model Evaluation Benchmark

Evaluated on stratified out-of-sample test split:

| Metric | Score | Details |
| :--- | :--- | :--- |
| **Accuracy** | **98.55%** | Overall correct classifications |
| **Precision (Spam)** | **98.33%** | Virtually zero false positives on legitimate messages |
| **Recall (Spam)** | **90.08%** | Catch rate for malicious messages |
| **F1-Score** | **94.02%** | Harmonic mean of precision and recall |
| **ROC-AUC** | **99.37%** | Separability between benign and threat vectors |

---

## 🚀 Quick Start

### 1. Launch the Web Application
Simply run the batch file:
```cmd
run.bat
```
or via PowerShell:
```powershell
.\run.ps1
```
or via Python:
```bash
python app.py
```
Open your browser at: **`http://localhost:5000`**

### 2. Run Automated Test Suite
Run all unit and API integration tests:
```bash
python -m unittest discover tests
```
*(All 19 test cases validate Indian phone validation, deduplication caching, ML inference, URL spoofing, and API health)*

### 3. Run via CLI
```bash
python cli.py scan "USPS: Your package is on hold. Pay $1.99 redelivery fee at http://192.168.1.15/parcel" --phone 9876543210
```

---

## 📡 REST API Documentation

### 1. Classify Message with Phone Number
**Endpoint:** `POST /api/scan`

**Request:**
```bash
curl -X POST http://localhost:5000/api/scan \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "9876543210",
    "message": "CHASE ALERT: Your account has been suspended! Verify your credentials at http://chase-verify.xyz/login within 24 hours.",
    "type": "message"
  }'
```

**Response:**
```json
{
  "success": true,
  "phone_number": "9876543210",
  "prediction": "SPAM",
  "confidence": 98.33,
  "retrieved_from_history": false,
  "data": {
    "risk_score": 88,
    "risk_level": "CRITICAL SCAM",
    "verdict_badge": "DANGEROUS FRAUD",
    "is_scam": true,
    "is_spam": true,
    "summary": "Flagged as high-threat...",
    "recommendations": [
      "DO NOT click any links, open attachments, or call provided phone numbers.",
      "Never share Passwords, 2FA codes, Seed Phrases, or OTPs under any circumstances."
    ]
  }
}
```

*Note: If the same `phone_number` submits the exact same `message` again, `retrieved_from_history` will be `true`, and the result is retrieved directly from SQLite history without re-running the ML model.*

### 2. Fetch Scan History
**Endpoint:** `GET /api/history?limit=50`

**Response:**
```json
{
  "success": true,
  "history": [
    {
      "id": 1,
      "phone_number": "9876543210",
      "message": "CHASE ALERT: Your account has been suspended...",
      "prediction": "SPAM",
      "confidence": 98.33,
      "scan_timestamp": "2026-10-20 12:45:10",
      "risk_score": 88,
      "risk_level": "CRITICAL SCAM"
    }
  ],
  "stats": {
    "total_scanned": 1,
    "avg_risk_score": 88.0,
    "scam_count": 1,
    "spam_count": 1,
    "safe_count": 0
  }
}
```

---

## 📁 Project Structure

```
trademarket/
├── app.py                      # Flask Server & REST API endpoints
├── cli.py                      # Terminal Command Line Interface
├── train.py                    # Entrypoint to train and benchmark models
├── run.bat                     # 1-click Windows runner script
├── run.ps1                     # PowerShell runner script
├── README.md                   # Complete documentation
├── scans.db                    # SQLite scan audit database
│
├── dataset/                    # Dataset storage
│   ├── SMSSpamCollection       # 5,574 labeled SMS samples
│   └── readme                  # Dataset citation and details
│
├── models/                     # Serialized ML artifacts
│   ├── tfidf_vectorizer.joblib # Trained TF-IDF vectorizer
│   ├── log_reg_model.joblib    # Trained Logistic Regression model
│   ├── nb_model.joblib         # Multinomial Naive Bayes classifier
│   └── metadata.json           # Benchmark metrics and training specifications
│
├── engine/                     # Core Threat Analysis Engines
│   ├── __init__.py             # Package exports
│   ├── detector.py             # Unified threat detection orchestrator
│   ├── validator.py            # Indian mobile number validation (10 digits)
│   ├── db.py                   # SQLite database, safe migration, and history cache
│   ├── heuristics.py           # Pattern, urgency & social engineering rule engine
│   ├── url_inspector.py        # Forensic URL, domain & phishing link scanner
│   ├── email_inspector.py      # Email header & display name spoofing inspector
│   ├── crypto_inspector.py     # Cryptocurrency address & Web3 drainer inspector
│   ├── gemini_analyzer.py      # Google Gemini AI deep reasoning integration
│   └── trainer.py              # ML training and evaluation pipeline
│
├── templates/
│   └── index.html              # Security Operations Center Web Dashboard
│
└── tests/                      # Automated test suite
    ├── test_detector.py        # 10 unit tests for ML, URLs & heuristics
    └── test_api.py             # 9 API integration tests (phone validation & caching)
```
