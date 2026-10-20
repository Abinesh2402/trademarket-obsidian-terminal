"""
Cryptocurrency Address & Web3 Threat Inspector
Detects cryptocurrency wallet addresses, Web3 drainer traps, approval phishing
mechanisms, and fraudulent giveaway deposit solicitations.
"""

import re
from typing import Dict, Any, List

# Crypto Address Regex patterns
BTC_REGEX = re.compile(r'\b(bc1[a-zA-HJ-NP-Z0-9]{25,39}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})\b')
ETH_REGEX = re.compile(r'\b(0x[a-fA-F0-9]{40})\b')
SOL_REGEX = re.compile(r'\b([1-9A-HJ-NP-Za-km-z]{32,44})\b')
TRON_REGEX = re.compile(r'\b(T[A-Za-z1-9]{33})\b')

WEB3_DRAINER_KEYWORDS = [
    'connect wallet', 'claim airdrop', 'setapprovalforall', 'permit2',
    'sign message to claim', 'drainer', 'free mint', 'verify wallet',
    'wallet sync', 'restore seed phrase', 'private key claim'
]


class CryptoInspector:
    """Forensic scanner for cryptocurrency addresses and Web3 exploitation traps."""

    @classmethod
    def inspect(cls, text: str) -> Dict[str, Any]:
        if not text:
            return {'has_crypto': False, 'addresses': [], 'risk_score': 0, 'flags': []}

        flags: List[str] = []
        reasons: List[str] = []
        risk_score = 0
        found_addresses: List[Dict[str, str]] = []

        # Find BTC addresses
        btc_matches = BTC_REGEX.findall(text)
        for btc in btc_matches:
            found_addresses.append({'type': 'Bitcoin (BTC)', 'address': btc})

        # Find ETH / EVM addresses
        eth_matches = ETH_REGEX.findall(text)
        for eth in eth_matches:
            found_addresses.append({'type': 'Ethereum / EVM (ETH)', 'address': eth})

        # Find Tron addresses
        tron_matches = TRON_REGEX.findall(text)
        for tron in tron_matches:
            found_addresses.append({'type': 'Tron (TRX)', 'address': tron})

        # Find Solana (filter out common English words)
        sol_candidates = SOL_REGEX.findall(text)
        for sol in sol_candidates:
            # Solana addresses have high entropy and mix uppercase, lowercase, and numbers
            if (any(c.isdigit() for c in sol) and
                any(c.isupper() for c in sol) and
                any(c.islower() for c in sol) and
                len(sol) >= 32 and
                not sol.startswith(('http', 'bc1', '0x', 'T'))):
                found_addresses.append({'type': 'Solana (SOL)', 'address': sol})

        # Web3 Drainer & Approval Phishing indicators
        text_lower = text.lower()
        found_drainer_words = [w for w in WEB3_DRAINER_KEYWORDS if w in text_lower]

        if found_drainer_words:
            flags.append('WEB3_DRAINER_SIGNATURE')
            risk_score += 45
            reasons.append(f'Contains Web3 signature drainer keywords: {", ".join(found_drainer_words[:3])}.')

        if found_addresses and ('send' in text_lower or 'deposit' in text_lower or 'giveaway' in text_lower):
            flags.append('CRYPTO_DEPOSIT_SOLICITATION')
            risk_score += 40
            reasons.append('Direct request to send cryptocurrency to an unverified private address.')

        if found_addresses and ('double' in text_lower or '2x' in text_lower or '100%' in text_lower):
            flags.append('CRYPTO_DOUBLING_FRAUD')
            risk_score += 55
            reasons.append('Address accompanied by fraudulent "doubling" or guaranteed investment return claims.')

        risk_score = min(100, risk_score)

        return {
            'has_crypto': bool(found_addresses or found_drainer_words),
            'risk_score': risk_score,
            'addresses': found_addresses,
            'flags': flags,
            'reasons': reasons
        }
