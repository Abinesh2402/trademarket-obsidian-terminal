"""
Email Header & MIME Forensic Inspector
Detects display name spoofing, header mismatches, SPF/DKIM/DMARC authentication failures,
suspicious Return-Path routing, and hidden sender tricks in raw email text or headers.
"""

import re
from typing import Dict, Any, List

EMAIL_REGEX = re.compile(r'[\w\.-]+@[\w\.-]+\.\w+')
DISPLAY_NAME_REGEX = re.compile(r'(?:"?([^"<]+)"?\s*)?<([^>]+)>')

KNOWN_BRANDS = [
    'paypal', 'apple', 'amazon', 'netflix', 'microsoft', 'google',
    'chase', 'wellsfargo', 'bankofamerica', 'citibank', 'usps', 'fedex',
    'dhl', 'ups', 'meta', 'facebook', 'instagram', 'binance', 'coinbase'
]


class EmailInspector:
    """Forensic analyzer for email headers and message provenance."""

    @classmethod
    def inspect(cls, raw_email_text: str) -> Dict[str, Any]:
        flags: List[str] = []
        reasons: List[str] = []
        risk_score = 0

        # Extract headers if present
        headers = cls._parse_headers(raw_email_text)
        from_header = headers.get('from', '')
        reply_to = headers.get('reply-to', '')
        return_path = headers.get('return-path', '')
        auth_results = headers.get('authentication-results', '') + ' ' + headers.get('received-spf', '')

        # 1. Display Name Spoofing Check
        from_display, from_addr = cls._extract_display_and_email(from_header)
        from_domain = from_addr.split('@')[-1].lower() if '@' in from_addr else ''

        if from_display:
            display_lower = from_display.lower()
            for brand in KNOWN_BRANDS:
                if brand in display_lower and brand not in from_domain:
                    flags.append(f'DISPLAY_NAME_SPOOF_{brand.upper()}')
                    risk_score += 45
                    reasons.append(
                        f'Sender display name claims to be "{from_display}", but actual sender domain is "@{from_domain}".'
                    )
                    break

        # 2. Reply-To / Return-Path Mismatch
        if reply_to:
            _, reply_addr = cls._extract_display_and_email(reply_to)
            reply_domain = reply_addr.split('@')[-1].lower() if '@' in reply_addr else ''
            if from_domain and reply_domain and from_domain != reply_domain:
                flags.append('REPLY_TO_DOMAIN_MISMATCH')
                risk_score += 30
                reasons.append(
                    f'Replies are secretly routed to a different domain (@{reply_domain}) than the sender (@{from_domain}).'
                )

        if return_path:
            _, return_addr = cls._extract_display_and_email(return_path)
            return_domain = return_addr.split('@')[-1].lower() if '@' in return_addr else ''
            if from_domain and return_domain and from_domain != return_domain:
                flags.append('RETURN_PATH_MISMATCH')
                risk_score += 25
                reasons.append(
                    f'Return-Path (@{return_domain}) does not match From address (@{from_domain}).'
                )

        # 3. SPF / DKIM / DMARC Failures
        auth_lower = auth_results.lower()
        if 'spf=fail' in auth_lower or 'spf=softfail' in auth_lower:
            flags.append('SPF_AUTH_FAILED')
            risk_score += 35
            reasons.append('SPF (Sender Policy Framework) authentication failed: server is not authorized to send email for this domain.')

        if 'dkim=fail' in auth_lower:
            flags.append('DKIM_SIGNATURE_FAILED')
            risk_score += 35
            reasons.append('DKIM cryptographic signature verification failed: email may have been altered or forged in transit.')

        if 'dmarc=fail' in auth_lower:
            flags.append('DMARC_POLICY_FAILED')
            risk_score += 40
            reasons.append('DMARC alignment check failed: sender identity cannot be validated.')

        # 4. Free Webmail Domain Impersonating Organization
        free_providers = {'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'protonmail.com'}
        if from_domain in free_providers:
            # If subject or body claims to be from a financial or official institution
            subject = headers.get('subject', '').lower()
            official_keywords = ['invoice', 'account suspension', 'security alert', 'support desk', 'billing update']
            if any(kw in subject for kw in official_keywords):
                flags.append('FREE_WEBMAIL_OFFICIAL_IMPERSONATION')
                risk_score += 30
                reasons.append(f'Official notification sent from free webmail address (@{from_domain}).')

        risk_score = min(100, risk_score)

        if risk_score >= 60:
            level = 'CRITICAL SPOOFING'
        elif risk_score >= 30:
            level = 'SUSPICIOUS'
        else:
            level = 'NORMAL / PASS'

        return {
            'is_email_format': bool(from_header or headers),
            'risk_score': risk_score,
            'risk_level': level,
            'headers_extracted': {
                'from': from_header,
                'from_display': from_display,
                'from_email': from_addr,
                'from_domain': from_domain,
                'reply_to': reply_to,
                'return_path': return_path,
                'subject': headers.get('subject', '')
            },
            'flags': flags,
            'reasons': reasons
        }

    @staticmethod
    def _parse_headers(text: str) -> Dict[str, str]:
        headers = {}
        lines = text.splitlines()
        current_key = None

        for line in lines:
            if not line.strip():
                # End of header section in standard RFC 822 format
                break
            if line[0] in ' \t' and current_key:
                # Continuation header
                headers[current_key] += ' ' + line.strip()
            elif ':' in line:
                parts = line.split(':', 1)
                key = parts[0].strip().lower()
                val = parts[1].strip()
                headers[key] = val
                current_key = key

        return headers

    @staticmethod
    def _extract_display_and_email(header_val: str):
        if not header_val:
            return '', ''
        match = DISPLAY_NAME_REGEX.search(header_val)
        if match:
            display = (match.group(1) or '').strip()
            addr = (match.group(2) or '').strip()
            return display, addr
        # Fallback to direct email regex
        email_match = EMAIL_REGEX.search(header_val)
        if email_match:
            return '', email_match.group(0)
        return '', header_val.strip()
