"""
API Integration Tests for Scam & Spam Threat Detection Server
Tests Indian phone number validation, SQLite caching, history retrieval, and REST endpoints.
"""

import unittest
import json
import os
from app import app, detector
from engine.db import ScanDatabase
from engine.validator import validate_indian_mobile


class TestDetectionAPI(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        app.testing = True
        cls.client = app.test_client()
        # Use isolated test database so tests do not interfere with scans.db
        cls.test_db_path = 'test_scans.db'
        detector.db = ScanDatabase(db_path=cls.test_db_path)
        detector.db.clear_history()

    @classmethod
    def tearDownClass(cls):
        # Restore production database instance and remove test database
        detector.db = ScanDatabase(db_path='scans.db')
        if os.path.exists('test_scans.db'):
            try:
                os.remove('test_scans.db')
            except Exception:
                pass

    def test_health_endpoint(self):
        resp = self.client.get('/api/health')
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data.decode())
        self.assertEqual(data['status'], 'healthy')
        self.assertEqual(data['ml_engine'], 'online')

    def test_model_info_endpoint(self):
        resp = self.client.get('/api/model-info')
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data.decode())
        self.assertTrue(data['success'])
        self.assertIn('accuracy', data['metadata'])
        self.assertGreaterEqual(data['metadata']['accuracy'], 0.95)

    def test_phone_validation_logic(self):
        # Valid cases
        valid_phones = ['9876543210', '+91 9876543210', '09876543210', '+91-81234-56789', '7012345678', '6234567890']
        for p in valid_phones:
            ok, clean, err = validate_indian_mobile(p)
            self.assertTrue(ok, f"Expected {p} to be valid, got error: {err}")
            self.assertEqual(len(clean), 10)
            self.assertIn(clean[0], '6789')

        # Invalid cases
        invalid_phones = ['5234567890', '1234567890', '98765', '98765432100', 'abcdefghij', '']
        for p in invalid_phones:
            ok, clean, err = validate_indian_mobile(p)
            self.assertFalse(ok, f"Expected {p} to be invalid")

    def test_scan_with_invalid_phone_rejected(self):
        payload = {
            'phone_number': '12345',  # invalid
            'message': 'Your account has been locked.'
        }
        resp = self.client.post('/api/scan', json=payload)
        self.assertEqual(resp.status_code, 400)
        data = json.loads(resp.data.decode())
        self.assertFalse(data['success'])
        self.assertIn('error', data)

    def test_scan_phishing_message_and_prediction(self):
        payload = {
            'phone_number': '9876500001',
            'message': 'CHASE ALERT: Your checking account has been suspended! Verify your credentials at http://security-bank-verify.xyz/login within 24 hours.'
        }
        resp = self.client.post('/api/scan', json=payload)
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data.decode())
        self.assertTrue(data['success'])
        self.assertEqual(data['phone_number'], '9876500001')
        self.assertEqual(data['prediction'], 'SPAM')
        self.assertGreater(data['confidence'], 50.0)
        self.assertFalse(data['retrieved_from_history'])

    def test_scan_safe_message_and_prediction(self):
        payload = {
            'phone_number': '9876500002',
            'message': 'Hi mom, just letting you know I got home safely. Talk to you tomorrow!'
        }
        resp = self.client.post('/api/scan', json=payload)
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data.decode())
        self.assertTrue(data['success'])
        self.assertEqual(data['phone_number'], '9876500002')
        self.assertEqual(data['prediction'], 'HAM')
        self.assertGreater(data['confidence'], 50.0)
        self.assertFalse(data['retrieved_from_history'])

    def test_duplicate_submission_cache_retrieval(self):
        test_phone = '9876599999'
        test_msg = 'Special test alert for deduplication caching verification: Claim your prize now.'

        # 1. First submission -> should run ML model and save to SQLite
        payload = {'phone_number': test_phone, 'message': test_msg}
        resp1 = self.client.post('/api/scan', json=payload)
        self.assertEqual(resp1.status_code, 200)
        data1 = json.loads(resp1.data.decode())
        self.assertTrue(data1['success'])
        self.assertFalse(data1['retrieved_from_history'])
        pred1 = data1['prediction']
        conf1 = data1['confidence']

        # 2. Second submission with SAME phone and SAME message -> MUST retrieve from history
        resp2 = self.client.post('/api/scan', json=payload)
        self.assertEqual(resp2.status_code, 200)
        data2 = json.loads(resp2.data.decode())
        self.assertTrue(data2['success'])
        self.assertTrue(data2['retrieved_from_history'])
        self.assertEqual(data2['prediction'], pred1)
        self.assertEqual(data2['confidence'], conf1)
        self.assertTrue(data2['data']['cached'])

    def test_history_endpoint_contains_phone_and_prediction(self):
        resp = self.client.get('/api/history?limit=10')
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data.decode())
        self.assertTrue(data['success'])
        self.assertIn('history', data)
        self.assertGreater(len(data['history']), 0)

        # Inspect latest record
        latest = data['history'][0]
        self.assertIn('phone_number', latest)
        self.assertIn('prediction', latest)
        self.assertIn('confidence', latest)
        self.assertIn('scan_timestamp', latest)
        self.assertIn(latest['prediction'], ['HAM', 'SPAM'])

    def test_batch_scan(self):
        payload = {
            'phone_number': '9876543210',
            'messages': [
                'Free cash prize! Claim $1,000 now at http://win-now.xyz',
                'Hey, see you tomorrow at school.'
            ]
        }
        resp = self.client.post('/api/batch-scan', json=payload)
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data.decode())
        self.assertTrue(data['success'])
        self.assertEqual(data['metrics']['total_scanned'], 2)
        self.assertGreaterEqual(data['metrics']['scam_count'] + data['metrics']['spam_count'], 1)
        self.assertEqual(data['metrics']['safe_count'], 1)


if __name__ == '__main__':
    unittest.main()
