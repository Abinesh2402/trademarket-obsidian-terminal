"""
Unified Scam and Spam Threat Detection Engine
Combines Machine Learning probabilities, Heuristic rule evaluation,
URL forensics, Email header forensics, Crypto/Web3 inspection,
and Gemini AI deep analysis into a comprehensive security verdict.
Supports phone number validation, deduplication caching, and audit logging.
"""

import os
import json
import joblib
from typing import Dict, Any, Optional, List

from .heuristics import HeuristicEngine
from .url_inspector import URLInspector
from .email_inspector import EmailInspector
from .crypto_inspector import CryptoInspector
from .gemini_analyzer import GeminiAnalyzer
from .db import ScanDatabase
from .validator import validate_indian_mobile


class ScamDetector:
    """Unified threat detection engine with history retrieval and ML inference."""

    def __init__(self, models_dir: str = 'models', db_path: str = 'scans.db'):
        self.models_dir = models_dir
        self.db = ScanDatabase(db_path=db_path)
        self.vectorizer = None
        self.log_reg = None
        self.nb_clf = None
        self.metadata = {}
        self.is_ml_loaded = False
        self._load_models()

    def _load_models(self):
        try:
            vec_path = os.path.join(self.models_dir, 'tfidf_vectorizer.joblib')
            lr_path = os.path.join(self.models_dir, 'log_reg_model.joblib')
            nb_path = os.path.join(self.models_dir, 'nb_model.joblib')
            meta_path = os.path.join(self.models_dir, 'metadata.json')

            if os.path.exists(vec_path) and os.path.exists(lr_path) and os.path.exists(nb_path):
                self.vectorizer = joblib.load(vec_path)
                self.log_reg = joblib.load(lr_path)
                self.nb_clf = joblib.load(nb_path)
                if os.path.exists(meta_path):
                    with open(meta_path, 'r') as f:
                        self.metadata = json.load(f)
                self.is_ml_loaded = True
        except Exception as e:
            print(f"[!] Warning: Could not load ML models ({e}). Falling back to heuristic engine.")
            self.is_ml_loaded = False

    def predict_ml(self, text: str) -> Dict[str, Any]:
        """Calculates ML model prediction and probability using TF-IDF and Logistic Regression."""
        if not self.is_ml_loaded or not text.strip():
            return {
                'ml_available': False,
                'spam_probability': 0.0,
                'ham_probability': 1.0,
                'prob_logistic_regression': 0.0,
                'prob_naive_bayes': 0.0,
                'ml_score': 0,
                'prediction': 'UNKNOWN',
                'confidence': 0.0
            }

        try:
            vec = self.vectorizer.transform([text])
            # Logistic Regression probabilities [P(HAM), P(SPAM)]
            lr_probs = self.log_reg.predict_proba(vec)[0]
            prob_lr_ham = float(lr_probs[0])
            prob_lr_spam = float(lr_probs[1])

            # Primary Logistic Regression prediction & confidence
            if prob_lr_spam >= 0.50:
                prediction = "SPAM"
                confidence = round(prob_lr_spam * 100, 2)
            else:
                prediction = "HAM"
                confidence = round(prob_lr_ham * 100, 2)

            # Secondary Naive Bayes probability for ensemble telemetry
            prob_nb = float(self.nb_clf.predict_proba(vec)[0][1])
            ensemble_prob = 0.55 * prob_lr_spam + 0.45 * prob_nb
            ml_score = int(round(ensemble_prob * 100))

            return {
                'ml_available': True,
                'prediction': prediction,
                'confidence': confidence,
                'spam_probability': round(prob_lr_spam, 4),
                'ham_probability': round(prob_lr_ham, 4),
                'prob_logistic_regression': round(prob_lr_spam, 4),
                'prob_naive_bayes': round(prob_nb, 4),
                'ml_score': ml_score
            }
        except Exception as e:
            return {
                'ml_available': False,
                'error': str(e),
                'spam_probability': 0.0,
                'ham_probability': 0.0,
                'ml_score': 0,
                'prediction': 'ERROR',
                'confidence': 0.0
            }

    def analyze(self, text: str, phone_number: Optional[str] = None, context_type: str = "general",
                gemini_api_key: Optional[str] = None, save_to_db: bool = True) -> Dict[str, Any]:
        """
        Comprehensive multi-vector threat assessment of input text.
        If the same phone number submits the same message again, retrieves the
        previously saved prediction instead of running the model again.
        """
        cleaned_text = (text or "").strip()
        cleaned_phone = (phone_number or "").strip()

        # Sanitize phone number if provided
        if cleaned_phone:
            is_valid, norm_phone, _ = validate_indian_mobile(cleaned_phone)
            if is_valid:
                cleaned_phone = norm_phone

        if not cleaned_text:
            return {
                'risk_score': 0,
                'risk_level': 'SAFE',
                'verdict_badge': 'EMPTY_INPUT',
                'prediction': 'HAM',
                'confidence': 100.0,
                'is_scam': False,
                'is_spam': False,
                'retrieved_from_history': False,
                'cached': False,
                'phone_number': cleaned_phone or 'N/A',
                'summary': 'No text provided for inspection.',
                'highlights': [],
                'recommendations': []
            }

        # -------------------------------------------------------------
        # 1. HISTORY CACHE CHECK
        # When the same phone number submits the same message again,
        # retrieve the previously saved prediction instead of re-running.
        # -------------------------------------------------------------
        if cleaned_phone and cleaned_phone != 'N/A':
            previous_scan = self.db.find_previous_scan(cleaned_phone, cleaned_text)
            if previous_scan:
                return {
                    'text': cleaned_text,
                    'message': cleaned_text,
                    'phone_number': cleaned_phone,
                    'prediction': previous_scan['prediction'],
                    'confidence': previous_scan['confidence'],
                    'retrieved_from_history': True,
                    'cached': True,
                    'previous_scan_timestamp': previous_scan['scan_timestamp'],
                    'scan_timestamp': previous_scan['scan_timestamp'],
                    'risk_score': previous_scan['risk_score'],
                    'risk_level': previous_scan['risk_level'],
                    'verdict_badge': previous_scan['verdict_badge'],
                    'is_scam': previous_scan['is_scam'],
                    'is_spam': previous_scan['is_spam'],
                    'summary': f"Retrieved from previous scan history for +91 {cleaned_phone} (Scanned on {previous_scan['scan_timestamp']}).",
                    'ml_analysis': {
                        'ml_available': True,
                        'prediction': previous_scan['prediction'],
                        'confidence': previous_scan['confidence'],
                        'spam_probability': previous_scan['confidence'] / 100.0 if previous_scan['prediction'] == 'SPAM' else (100.0 - previous_scan['confidence']) / 100.0,
                        'prob_logistic_regression': previous_scan['confidence'] / 100.0 if previous_scan['prediction'] == 'SPAM' else (100.0 - previous_scan['confidence']) / 100.0,
                        'prob_naive_bayes': previous_scan['confidence'] / 100.0 if previous_scan['prediction'] == 'SPAM' else (100.0 - previous_scan['confidence']) / 100.0,
                        'ml_score': previous_scan['risk_score'],
                        'source': 'sqlite_history_cache'
                    },
                    'heuristics': {
                        'heuristic_score': 0,
                        'detected_categories': previous_scan.get('categories', []),
                        'matched_rules': [],
                        'manipulation_tactics': previous_scan.get('manipulation_tactics', []),
                        'highlights': []
                    },
                    'url_analysis': [{'url': u, 'risk_score': 0, 'risk_level': 'LOGGED', 'flags': [], 'reasons': []} for u in previous_scan.get('urls_found', [])],
                    'email_analysis': {'is_email_format': False, 'flags': [], 'reasons': []},
                    'crypto_analysis': {'has_crypto': bool(previous_scan.get('crypto_found')), 'addresses': [{'address': a, 'type': 'Crypto'} for a in previous_scan.get('crypto_found', [])]},
                    'ai_analysis': {'available': previous_scan.get('ai_used', False)},
                    'manipulation_tactics': previous_scan.get('manipulation_tactics', []),
                    'recommendations': [
                        f"Previously classified as {previous_scan['prediction']} ({previous_scan['confidence']}% confidence).",
                        f"Retrieved from SQLite audit trail (Timestamp: {previous_scan['scan_timestamp']}) without re-running the ML model."
                    ]
                }

        # -------------------------------------------------------------
        # 2. NEW MESSAGE INFERENCE
        # Run existing trained TF-IDF vectorizer + Logistic Regression model
        # -------------------------------------------------------------
        ml_results = self.predict_ml(cleaned_text)
        prediction = ml_results.get('prediction', 'HAM')
        confidence = ml_results.get('confidence', 50.0)
        ml_score = ml_results.get('ml_score', 0)

        # Run Heuristic Engine
        heuristics = HeuristicEngine.analyze(cleaned_text)

        # Run URL Inspector
        url_results = URLInspector.inspect_all(cleaned_text)
        max_url_risk = max([u['risk_score'] for u in url_results], default=0)

        # Run Email Forensic Inspector
        email_results = EmailInspector.inspect(cleaned_text)
        email_risk = email_results.get('risk_score', 0) if email_results.get('is_email_format') else 0

        # Run Crypto Threat Inspector
        crypto_results = CryptoInspector.inspect(cleaned_text)
        crypto_risk = crypto_results.get('risk_score', 0) if crypto_results.get('has_crypto') else 0

        # Run Gemini AI Analyzer (if requested / key available)
        gemini = GeminiAnalyzer(api_key=gemini_api_key)
        ai_results = {}
        if gemini.is_configured():
            ai_results = gemini.analyze(cleaned_text, context_type=context_type)

        # Synthesize Unified Threat Score (0 - 100)
        h_score = heuristics['heuristic_score']
        max_specialized_risk = max(max_url_risk, email_risk, crypto_risk)

        if ai_results.get('available'):
            ai_score = ai_results.get('ai_risk_score', 50)
            composite_score = (0.40 * ai_score) + (0.30 * ml_score) + (0.15 * h_score) + (0.15 * max_specialized_risk)
        else:
            composite_score = (0.45 * ml_score) + (0.30 * h_score) + (0.25 * max_specialized_risk)

        # Safety floors for critical danger patterns
        has_critical_url = any(u['risk_score'] >= 70 for u in url_results)
        has_direct_creds = 'CREDENTIAL_HARVESTING' in heuristics['detected_categories']
        has_crypto_trap = 'INVESTMENT_CRYPTO_PONZI' in heuristics['detected_categories'] or 'CRYPTO_DOUBLING_FRAUD' in crypto_results.get('flags', [])
        has_email_spoof = any('SPOOF' in f or 'FAIL' in f for f in email_results.get('flags', []))

        if has_direct_creds or has_critical_url or has_crypto_trap or has_email_spoof:
            composite_score = max(composite_score, 82.0)
        elif h_score >= 60 or ml_score >= 80 or max_specialized_risk >= 60:
            composite_score = max(composite_score, 72.0)

        final_score = int(min(100, max(0, round(composite_score))))

        # If ML predicted SPAM, ensure verdict reflects SPAM
        if prediction == "SPAM" and final_score < 50:
            final_score = 55

        # Determine Risk Level and Verdict Badge
        if final_score >= 75:
            risk_level = "CRITICAL SCAM"
            verdict_badge = "DANGEROUS FRAUD"
            is_scam = True
            is_spam = True
        elif final_score >= 50 or prediction == "SPAM":
            risk_level = "HIGH RISK SPAM"
            verdict_badge = "SPAM"
            is_scam = False
            is_spam = True
        elif final_score >= 25:
            risk_level = "SUSPICIOUS"
            verdict_badge = "CAUTION ADVISED"
            is_scam = False
            is_spam = False
        else:
            risk_level = "SAFE"
            verdict_badge = "HAM (LEGITIMATE)"
            is_scam = False
            is_spam = False

        # Recommendations
        recommendations: List[str] = []
        if is_scam or final_score >= 60:
            recommendations.append("DO NOT click any links, open attachments, or call provided phone numbers.")
            recommendations.append("Never share Passwords, 2FA codes, Seed Phrases, or OTPs under any circumstances.")
            recommendations.append("Block this sender and report unsolicited SMS to carrier shortcode 1909 / 7726.")
        elif is_spam:
            recommendations.append("Treat with caution: unsolicited promotional message with high-pressure marketing.")
            recommendations.append("Do not reply 'STOP' if sender is unknown as it confirms an active number.")
        elif risk_level == "SUSPICIOUS":
            recommendations.append("Verify sender identity through official customer service channels.")
        else:
            recommendations.append("Message appears benign and passed machine learning and heuristic checks.")

        if email_results.get('flags'):
            recommendations.append("Email sender headers show domain mismatch or failed SPF/DKIM verification.")

        if crypto_results.get('addresses'):
            recommendations.append("Never send cryptocurrency to unverified private addresses promising returns.")

        if ai_results.get('available') and ai_results.get('victim_action_plan'):
            recommendations.extend(ai_results['victim_action_plan'][:3])

        recommendations = list(dict.fromkeys(recommendations))

        # Executive Summary
        if ai_results.get('available') and ai_results.get('executive_summary'):
            summary = ai_results['executive_summary']
        elif is_scam:
            summary = f"Flagged as high-threat {', '.join(heuristics['detected_categories']) or 'Fraud'}. Displays deceptive tactics and elevated risk."
        elif is_spam:
            summary = "Classified as SPAM by TF-IDF + Logistic Regression model and heuristic triggers."
        elif risk_level == "SUSPICIOUS":
            summary = "Contains unverified links or marketing keywords that warrant caution."
        else:
            summary = "Communication classified as HAM (Legitimate) by Logistic Regression model."

        # Merge manipulation tactics
        manipulation_tactics = set(heuristics['manipulation_tactics'])
        if ai_results.get('available') and ai_results.get('psychological_triggers'):
            manipulation_tactics.update(ai_results['psychological_triggers'])
        if crypto_results.get('flags'):
            manipulation_tactics.add('Web3 / Cryptocurrency Lure')

        report = {
            'text': cleaned_text,
            'message': cleaned_text,
            'phone_number': cleaned_phone or 'N/A',
            'prediction': prediction,
            'confidence': confidence,
            'risk_score': final_score,
            'risk_level': risk_level,
            'verdict_badge': verdict_badge,
            'is_scam': is_scam,
            'is_spam': is_spam,
            'retrieved_from_history': False,
            'cached': False,
            'summary': summary,
            'ml_analysis': ml_results,
            'heuristics': heuristics,
            'url_analysis': url_results,
            'email_analysis': email_results,
            'crypto_analysis': crypto_results,
            'ai_analysis': ai_results,
            'manipulation_tactics': sorted(list(manipulation_tactics)),
            'recommendations': recommendations
        }

        # Auto-persist to SQLite audit database
        if save_to_db:
            try:
                self.db.save_scan(report, phone_number=cleaned_phone, input_type=context_type)
            except Exception as e:
                print(f"[!] Warning: Could not log scan to database: {e}")

        return report
