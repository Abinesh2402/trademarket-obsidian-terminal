"""
Automated Unit Tests for Scam & Spam Threat Detection System
"""

import unittest
from engine.detector import ScamDetector
from engine.url_inspector import URLInspector
from engine.heuristics import HeuristicEngine


class TestScamDetector(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.detector = ScamDetector()

    def test_legitimate_message(self):
        text = "Hey John, are we still meeting for lunch at 1pm today? Let me know!"
        res = self.detector.analyze(text)
        self.assertLess(res['risk_score'], 30)
        self.assertEqual(res['risk_level'], 'SAFE')
        self.assertFalse(res['is_scam'])
        self.assertFalse(res['is_spam'])

    def test_bank_phishing(self):
        text = "CHASE ALERT: Your checking account has been suspended due to unauthorized activity. Verify your identity immediately at http://chase-security-verify.xyz/login within 24 hours to prevent account closure."
        res = self.detector.analyze(text)
        self.assertGreaterEqual(res['risk_score'], 75)
        self.assertEqual(res['risk_level'], 'CRITICAL SCAM')
        self.assertTrue(res['is_scam'])
        self.assertIn('URGENCY_COERCION', res['heuristics']['detected_categories'])
        self.assertIn('CREDENTIAL_HARVESTING', res['heuristics']['detected_categories'])

    def test_crypto_doubler_scam(self):
        text = "Exclusive Binance VIP giveaway: Send 0.5 BTC to our verified pool and get 1 BTC back instantly! 100% guaranteed profit, act now!"
        res = self.detector.analyze(text)
        self.assertGreaterEqual(res['risk_score'], 75)
        self.assertEqual(res['risk_level'], 'CRITICAL SCAM')
        self.assertTrue(res['is_scam'])
        self.assertIn('INVESTMENT_CRYPTO_PONZI', res['heuristics']['detected_categories'])

    def test_delivery_smishing_with_ip_url(self):
        text = "USPS: Your parcel is on hold due to missing address. Pay $1.99 redelivery fee at http://192.168.1.15/parcel-tracking to avoid return."
        res = self.detector.analyze(text)
        self.assertGreaterEqual(res['risk_score'], 75)
        self.assertEqual(res['risk_level'], 'CRITICAL SCAM')
        self.assertTrue(res['is_scam'])
        self.assertTrue(any(u['risk_score'] >= 40 for u in res['url_analysis']))

    def test_sms_lottery_spam(self):
        text = "Congratulations! You have been selected to receive a free $1,000 Walmart gift card. Text WIN to 87121 to claim your reward."
        res = self.detector.analyze(text)
        self.assertGreaterEqual(res['risk_score'], 50)
        self.assertTrue(res['is_spam'])

    def test_url_inspector_direct_ip(self):
        url = "http://45.33.32.156/secure-login"
        report = URLInspector.inspect_url(url)
        self.assertIn('DIRECT_IP_HOST', report['flags'])
        self.assertGreaterEqual(report['risk_score'], 40)

    def test_url_inspector_suspicious_tld(self):
        url = "https://paypal-account-verification.xyz/restore"
        report = URLInspector.inspect_url(url)
        self.assertTrue(any('SUSPICIOUS_TLD' in f for f in report['flags']))
        self.assertTrue(any('BRAND_IMPERSONATION' in f for f in report['flags']))

    def test_url_masquerade_with_at_symbol(self):
        url = "http://apple.com@malicious-harvesting-site.com/login"
        report = URLInspector.inspect_url(url)
        self.assertIn('CREDENTIAL_MASQUERADE', report['flags'])
        self.assertGreaterEqual(report['risk_score'], 45)

    def test_empty_and_whitespace_input(self):
        res1 = self.detector.analyze("")
        self.assertEqual(res1['risk_score'], 0)
        self.assertEqual(res1['risk_level'], 'SAFE')
        self.assertFalse(res1['is_scam'])

        res2 = self.detector.analyze("   \n\t  ")
        self.assertEqual(res2['risk_score'], 0)
        self.assertEqual(res2['risk_level'], 'SAFE')

    def test_tech_support_invoice_scam(self):
        text = "Geek Squad Support: Invoice attached for your annual renewal of $499.99 charged to your card. If unauthorized, call our toll-free customer support at +1-800-555-0199 immediately."
        res = self.detector.analyze(text)
        self.assertGreaterEqual(res['risk_score'], 60)
        self.assertIn('TECH_SUPPORT_INVOICE', res['heuristics']['detected_categories'])


if __name__ == '__main__':
    unittest.main()

