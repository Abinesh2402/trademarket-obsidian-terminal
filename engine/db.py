"""
Persistent Threat Audit Trail & History Storage (SQLite)
Maintains audit logs of scanned communications, forensic findings,
and statistical telemetry for compliance and threat analysis.
Includes safe database migration for existing schemas and cache retrieval.
"""

import sqlite3
import json
import os
from contextlib import contextmanager
from typing import Dict, Any, List, Optional
from datetime import datetime

DB_FILE = 'scans.db'


class ScanDatabase:
    """Manages scan history, safe schema migrations, and cache retrieval."""

    def __init__(self, db_path: str = DB_FILE):
        self.db_path = db_path
        self._init_db()

    @contextmanager
    def _get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()

    def _init_db(self):
        """Initializes database and performs safe migration for existing databases."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            # 1. Ensure table exists
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS scan_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    phone_number TEXT,
                    message TEXT,
                    text TEXT NOT NULL,
                    prediction TEXT,
                    confidence REAL,
                    input_type TEXT DEFAULT 'general',
                    risk_score INTEGER NOT NULL,
                    risk_level TEXT NOT NULL,
                    verdict_badge TEXT NOT NULL,
                    is_scam BOOLEAN NOT NULL,
                    is_spam BOOLEAN NOT NULL,
                    categories TEXT,
                    manipulation_tactics TEXT,
                    urls_found TEXT,
                    crypto_found TEXT,
                    ai_used BOOLEAN DEFAULT 0,
                    summary TEXT
                )
            ''')

            # 2. Safe Schema Migration for existing databases
            cursor.execute("PRAGMA table_info(scan_logs)")
            existing_columns = {row['name'] for row in cursor.fetchall()}

            # Columns to add if missing
            migrations = [
                ('phone_number', 'TEXT'),
                ('message', 'TEXT'),
                ('prediction', 'TEXT'),
                ('confidence', 'REAL'),
                ('input_type', 'TEXT DEFAULT "general"')
            ]

            for col_name, col_type in migrations:
                if col_name not in existing_columns:
                    try:
                        cursor.execute(f"ALTER TABLE scan_logs ADD COLUMN {col_name} {col_type}")
                    except Exception as e:
                        print(f"[*] Migration notice for {col_name}: {e}")

            # 3. Backfill any existing rows where message or prediction is null
            cursor.execute('''
                UPDATE scan_logs
                SET message = text
                WHERE (message IS NULL OR message = '') AND text IS NOT NULL
            ''')
            cursor.execute('''
                UPDATE scan_logs
                SET prediction = CASE WHEN is_spam = 1 THEN 'SPAM' ELSE 'HAM' END
                WHERE prediction IS NULL
            ''')
            cursor.execute('''
                UPDATE scan_logs
                SET confidence = CASE WHEN risk_score >= 50 THEN risk_score ELSE (100 - risk_score) END
                WHERE confidence IS NULL
            ''')
            cursor.execute('''
                UPDATE scan_logs
                SET phone_number = 'N/A'
                WHERE phone_number IS NULL
            ''')

            conn.commit()

    def find_previous_scan(self, phone_number: str, message: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves previously saved prediction when the same phone number
        submits the exact same message again.
        """
        if not phone_number or not message:
            return None

        clean_phone = phone_number.strip()
        clean_msg = message.strip()

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM scan_logs
                WHERE phone_number = ? AND (TRIM(message) = ? OR TRIM(text) = ?)
                ORDER BY id DESC LIMIT 1
            ''', (clean_phone, clean_msg, clean_msg))
            row = cursor.fetchone()

            if not row:
                return None

            return self._row_to_dict(row)

    def save_scan(self, report: Dict[str, Any], phone_number: Optional[str] = None, input_type: str = 'general') -> int:
        """Stores a completed scan report into the database."""
        categories = json.dumps(report.get('heuristics', {}).get('detected_categories', []))
        tactics = json.dumps(report.get('manipulation_tactics', []))
        urls = json.dumps([u.get('url', '') for u in report.get('url_analysis', [])])
        crypto = json.dumps([a.get('address', '') for a in report.get('crypto_analysis', {}).get('addresses', [])])
        ai_used = 1 if report.get('ai_analysis', {}).get('available') else 0

        msg_text = report.get('text', '')
        phone = (phone_number or report.get('phone_number') or 'N/A').strip()
        prediction = report.get('prediction', 'SPAM' if report.get('is_spam') else 'HAM')
        confidence = float(report.get('confidence', report.get('risk_score', 0.0)))

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO scan_logs (
                    phone_number, message, text, prediction, confidence,
                    input_type, risk_score, risk_level, verdict_badge,
                    is_scam, is_spam, categories, manipulation_tactics,
                    urls_found, crypto_found, ai_used, summary
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                phone,
                msg_text,
                msg_text,
                prediction,
                confidence,
                input_type,
                report.get('risk_score', 0),
                report.get('risk_level', 'SAFE'),
                report.get('verdict_badge', 'SAFE'),
                1 if report.get('is_scam') else 0,
                1 if report.get('is_spam') else 0,
                categories,
                tactics,
                urls,
                crypto,
                ai_used,
                report.get('summary', '')
            ))
            conn.commit()
            return cursor.lastrowid

    def get_recent_scans(self, limit: int = 50, filter_level: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieves recent scan records including phone number, prediction, and confidence."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            if filter_level:
                cursor.execute(
                    'SELECT * FROM scan_logs WHERE risk_level = ? ORDER BY id DESC LIMIT ?',
                    (filter_level, limit)
                )
            else:
                cursor.execute(
                    'SELECT * FROM scan_logs ORDER BY id DESC LIMIT ?',
                    (limit,)
                )
            rows = cursor.fetchall()
            return [self._row_to_dict(r) for r in rows]

    def _row_to_dict(self, r: sqlite3.Row) -> Dict[str, Any]:
        """Converts an SQLite row to a structured dictionary."""
        return {
            'id': r['id'],
            'scan_timestamp': r['created_at'],
            'created_at': r['created_at'],
            'phone_number': r['phone_number'] if 'phone_number' in r.keys() and r['phone_number'] else 'N/A',
            'message': r['message'] if 'message' in r.keys() and r['message'] else r['text'],
            'text': r['text'],
            'prediction': r['prediction'] if 'prediction' in r.keys() and r['prediction'] else ('SPAM' if r['is_spam'] else 'HAM'),
            'confidence': float(r['confidence']) if 'confidence' in r.keys() and r['confidence'] is not None else float(r['risk_score']),
            'input_type': r['input_type'] if 'input_type' in r.keys() else 'general',
            'risk_score': r['risk_score'],
            'risk_level': r['risk_level'],
            'verdict_badge': r['verdict_badge'],
            'is_scam': bool(r['is_scam']),
            'is_spam': bool(r['is_spam']),
            'categories': json.loads(r['categories'] or '[]'),
            'manipulation_tactics': json.loads(r['manipulation_tactics'] or '[]'),
            'urls_found': json.loads(r['urls_found'] or '[]'),
            'crypto_found': json.loads(r['crypto_found'] or '[]'),
            'ai_used': bool(r['ai_used']),
            'summary': r['summary']
        }

    def get_stats(self) -> Dict[str, Any]:
        """Calculates global threat statistics across all audit records."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT COUNT(*), AVG(risk_score) FROM scan_logs')
            total, avg_score = cursor.fetchone()

            cursor.execute('SELECT COUNT(*) FROM scan_logs WHERE is_scam = 1')
            scams = cursor.fetchone()[0]

            cursor.execute('SELECT COUNT(*) FROM scan_logs WHERE is_spam = 1 AND is_scam = 0')
            spam = cursor.fetchone()[0]

            cursor.execute('SELECT COUNT(*) FROM scan_logs WHERE is_scam = 0 AND is_spam = 0')
            safe = cursor.fetchone()[0]

            return {
                'total_scanned': total or 0,
                'avg_risk_score': round(avg_score or 0.0, 1),
                'scam_count': scams or 0,
                'spam_count': spam or 0,
                'safe_count': safe or 0
            }

    def clear_history(self):
        """Purges audit log records."""
        with self._get_connection() as conn:
            conn.execute('DELETE FROM scan_logs')
            conn.commit()
