"""
URL and Link Forensic Inspector
Analyzes URLs, domains, and links for phishing, brand impersonation, deceptive routing,
shorteners, and credential harvesting patterns.
"""

import re
import urllib.parse
from typing import List, Dict, Any

# Well-known URL shortener domains often leveraged in smishing/phishing
SHORTENER_DOMAINS = {
    'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'is.gd', 'buff.ly', 'ow.ly',
    'rb.gy', 'clck.ru', 'cutt.ly', 'shorturl.at', 'bl.ink', 'rebrand.ly'
}

# High-risk / cheap / abuse-heavy TLDs frequently encountered in spam & phishing
SUSPICIOUS_TLDS = {
    'xyz', 'top', 'click', 'loan', 'work', 'icu', 'buzz', 'fit', 'live',
    'link', 'tk', 'ml', 'ga', 'cf', 'gq', 'support', 'rest', 'kim', 'country',
    'stream', 'gdn', 'mom', 'vip', 'quest', 'monster', 'beauty'
}

# High-value targets commonly impersonated
HIGH_VALUE_BRANDS = [
    'paypal', 'apple', 'amazon', 'netflix', 'microsoft', 'google',
    'chase', 'wellsfargo', 'bankofamerica', 'citibank', 'usps', 'fedex',
    'dhl', 'ups', 'binance', 'coinbase', 'metamask', 'trustwallet',
    'kraken', 'facebook', 'instagram', 'whatsapp', 'telegram', 'irs',
    'socialsecurity', 'walmart', 'ebay'
]

# Path / query keywords typical of credential harvesting
CREDENTIAL_KEYWORDS = [
    'login', 'signin', 'sign-in', 'log-in', 'verify', 'verification',
    'secure', 'security', 'account', 'banking', 'authenticate', 'recovery',
    'wallet', 'update', 'password', 'confirm', 'validation', 'suspension',
    'reactivate', 'claim', 'unlock', 'session', 'seedphrase', 'privatekey'
]

URL_REGEX = re.compile(
    r'(?i)\b((?:https?://|www\d{0,3}\.|\b[a-z0-9.\-]+[.][a-z]{2,8}/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:\'\".,<>?«»“”‘’]))'
)

IP_REGEX = re.compile(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d+)?$')


class URLInspector:
    """Forensic scanner for URLs in text or direct input."""

    @staticmethod
    def extract_urls(text: str) -> List[str]:
        """Extract all potential URLs or domains from raw text."""
        if not text:
            return []
        matches = URL_REGEX.findall(text)
        urls = []
        for m in matches:
            url = m[0]
            if url:
                urls.append(url.strip())
        return list(dict.fromkeys(urls))  # deduplicate preserving order

    @classmethod
    def inspect_url(cls, raw_url: str) -> Dict[str, Any]:
        """Performs a thorough security inspection of a single URL."""
        # Normalize URL
        url = raw_url.strip()
        if not url.startswith(('http://', 'https://')):
            url = 'http://' + url

        flags: List[str] = []
        risk_score = 0
        reasons: List[str] = []

        try:
            parsed = urllib.parse.urlparse(url)
            netloc = parsed.netloc.lower()
            path = parsed.path.lower()
            query = parsed.query.lower()
        except Exception:
            return {
                'url': raw_url,
                'risk_score': 85,
                'risk_level': 'SUSPICIOUS',
                'flags': ['MALFORMED_URL'],
                'reasons': ['URL is malformed or intentionally obfuscated to bypass scanners.']
            }

        # Check for '@' symbol in authority (userinfo masquerade e.g. http://paypal.com@evil.com)
        if '@' in raw_url:
            flags.append('CREDENTIAL_MASQUERADE')
            risk_score += 45
            reasons.append('Uses "@" symbol in address, a classic trick to mask the true destination host.')

        # Split host and port
        host_parts = netloc.split(':')
        host = host_parts[0]

        # Check IP address as host
        if IP_REGEX.match(host):
            flags.append('DIRECT_IP_HOST')
            risk_score += 40
            reasons.append(f'Uses raw numeric IP ({host}) instead of an authenticated domain name.')

        # Punycode / IDN homograph attack check
        if 'xn--' in host:
            flags.append('PUNYCODE_HOMOGRAPH')
            risk_score += 35
            reasons.append('Contains Punycode (xn--), frequently used for visual spoofing of legitimate domains.')

        # Subdomain / Domain analysis
        domain_parts = host.split('.')
        tld = domain_parts[-1] if len(domain_parts) > 1 else ''

        # Excessive subdomains (e.g. login.secure.bank.attacker.com)
        if len(domain_parts) >= 4:
            flags.append('EXCESSIVE_SUBDOMAINS')
            risk_score += 25
            reasons.append(f'Unusual number of subdomains ({len(domain_parts)} parts), typical of phishing tunnels.')

        # High-risk TLD
        if tld in SUSPICIOUS_TLDS:
            flags.append(f'SUSPICIOUS_TLD_{tld.upper()}')
            risk_score += 25
            reasons.append(f'Uses suspicious or high-abuse Top-Level Domain (.{tld}).')

        # URL Shortener
        registered_domain = '.'.join(domain_parts[-2:]) if len(domain_parts) >= 2 else host
        if registered_domain in SHORTENER_DOMAINS:
            flags.append('URL_SHORTENER')
            risk_score += 20
            reasons.append(f'Uses URL shortener ({registered_domain}) to conceal actual destination address.')

        # Brand impersonation check
        # If brand name is present anywhere in host or path, but registered domain is not the brand's official domain
        for brand in HIGH_VALUE_BRANDS:
            if brand in host or (brand in path and ('login' in path or 'verify' in path)):
                # If registered domain does NOT equal brand.tld
                if not (registered_domain.startswith(brand + '.') or registered_domain == brand):
                    flags.append(f'BRAND_IMPERSONATION_{brand.upper()}')
                    risk_score += 45
                    reasons.append(f'Appears to impersonate "{brand.upper()}" on an unauthorized host ({host}).')
                    break

        # Credential Harvesting keywords in path/query
        found_cred_keywords = [kw for kw in CREDENTIAL_KEYWORDS if kw in path or kw in query]
        if found_cred_keywords:
            flags.append('CREDENTIAL_HARVESTING_PATH')
            risk_score += min(30, len(found_cred_keywords) * 15)
            reasons.append(f'Path contains high-risk authentication triggers: {", ".join(found_cred_keywords[:4])}.')

        # Protocol check
        if parsed.scheme == 'http':
            flags.append('UNENCRYPTED_HTTP')
            risk_score += 15
            reasons.append('Uses unencrypted HTTP connection instead of modern HTTPS.')

        # Cap score at 100
        risk_score = min(100, risk_score)

        if risk_score >= 65:
            risk_level = 'CRITICAL PHISHING'
        elif risk_score >= 35:
            risk_level = 'SUSPICIOUS'
        else:
            risk_level = 'LOW RISK'

        return {
            'url': raw_url,
            'normalized_url': url,
            'host': host,
            'risk_score': risk_score,
            'risk_level': risk_level,
            'flags': flags,
            'reasons': reasons
        }

    @classmethod
    def inspect_all(cls, text: str) -> List[Dict[str, Any]]:
        """Extract and inspect all URLs present in a given text string."""
        urls = cls.extract_urls(text)
        return [cls.inspect_url(u) for u in urls]
