"""
Heuristic and Pattern Threat Intelligence Engine
Detects psychological coercion, financial lures, brand impersonation,
credential harvesting, and suspicious communication characteristics.
"""

import re
from typing import List, Dict, Any, Tuple

# Categories of threat heuristics with regex patterns and risk weights
THREAT_PATTERNS = {
    'URGENCY_COERCION': [
        (r'\b(immediate(ly)? action (required|needed)|urgent(ly)? (reply|action|respond))\b', 30, 'Critical Urgency Pressure'),
        (r'\b(within 24 hours|within 12 hours|within \d+ (hours|mins|minutes))\b', 25, 'Artificial Deadline / Time Lock'),
        (r'\b(account (will be|has been|is) (suspended|locked|terminated|blocked|disabled|frozen))\b', 35, 'Account Freeze Threat'),
        (r'\b(final (notice|warning)|legal action|law enforcement|warrant for your arrest)\b', 35, 'Coercive Authority Threat'),
        (r'\b(act now|do not ignore|immediate response required|last chance)\b', 20, 'High-Pressure Call to Action')
    ],
    'FINANCIAL_LOTTERY_LURE': [
        (r'\b(you (have )?won|selected to receive|congratulations you|claim your (prize|reward|cash))\b', 35, 'Unsolicited Lottery / Prize Claim'),
        (r'\b(free (entry|ticket|gift|iphone|laptop|voucher|membership|bonus))\b', 25, 'Free Giveaway Bait'),
        (r'\b(\$\s?\d{3,}(,\d{3})*|\£\s?\d{3,}|\€\s?\d{3,})\s*(cash|prize|reward|bonus|won|credited)\b', 30, 'Large Cash Sum Bait'),
        (r'\b(guaranteed (cash|returns?|profit|income|payout)|risk[\s-]free)\b', 35, 'Deceptive Guaranteed Financial Return'),
        (r'\b(inheritance|unclaimed funds?|beneficiary|western union|moneygram)\b', 35, 'Classic Advance-Fee / 419 Lure')
    ],
    'INVESTMENT_CRYPTO_PONZI': [
        (r'\b(double your (crypto|btc|eth|bitcoin|money|funds)|send \d+(\.\d+)?\s*(btc|eth|crypto|coins?).*?get \d+(\.\d+)?)\b', 45, 'Crypto Doubling Trap'),
        (r'\b(vip (crypto )?giveaway|crypto giveaway|100%\s*guaranteed (profit|returns?)|guaranteed (returns?|profit))\b', 40, 'Guaranteed Profit / High-Yield Trap'),
        (r'\b(pump and dump|insider trading signals?|vip signals? group|100x gem)\b', 30, 'Manipulative Pump Scheme'),
        (r'\b(passive income \d+%\s*(daily|weekly|hourly)|automated trading bot guaranteed)\b', 35, 'High-Yield Investment Fraud (HYIP)'),
        (r'\b(connect wallet to claim|airdrop allocation eligible|mint for free now)\b', 30, 'Malicious Web3 Drainer Bait')
    ],
    'CREDENTIAL_HARVESTING': [
        (r'\b(enter your (password|pin|otp|seed phrase|private key|ssn|social security))\b', 50, 'Direct Credential Request'),
        (r'\b(share (your )?(otp|one-time code|2fa|verification code))\b', 50, '2FA / OTP Theft Attempt'),
        (r'\b(verify your (identity|account|credentials|security details|billing info))\b', 35, 'Phishing Identity Request'),
        (r'\b(click (the |this )?link to (restore|unlock|verify|confirm))\b', 30, 'Action-Gated Phishing Vector')
    ],
    'DELIVERY_SERVICE_SMISHING': [
        (r'\b(usps|fedex|dhl|ups|royal mail)\s*[:\-]?\s*(parcel|package|delivery|shipment)\b', 35, 'Courier Brand Impersonation'),
        (r'\b(delivery (failed|pending|on hold)|incorrect address|reschedule delivery)\b', 25, 'Fake Delivery Exception'),
        (r'\b(pay (a )?(\$\d+(\.\d{2})?|\£\d+|\€\d+)?\s*(fee|redelivery fee|customs duty))\b', 35, 'Micro-Fee Redelivery Phishing')
    ],
    'TECH_SUPPORT_INVOICE': [
        (r'\b(geek squad|mcafee|norton|microsoft support|apple care)\b', 30, 'Support / Security Brand Spoof'),
        (r'\b(invoice (attached|processed|charged)|charged \$\d+(\.\d{2})? to your card)\b', 30, 'Fake Invoice Scare'),
        (r'\b(call (our )?(toll[\s-]free )?(customer support|helpdesk) (at|on) \+?\d[\d\s\-]{7,})\b', 35, 'Callback Trap')
    ]
}

# Regex to detect suspicious phone numbers (toll numbers, shortcodes, international lures)
SHORTCODE_REGEX = re.compile(r'\b(text|txt|send|sms)\s+[a-z0-9]+\s+(to|at)\s+(\d{4,6})\b', re.IGNORECASE)
PHONE_REGEX = re.compile(r'(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b')


class HeuristicEngine:
    """Evaluates text against established threat heuristics and manipulation tactics."""

    @classmethod
    def analyze(cls, text: str) -> Dict[str, Any]:
        if not text or not text.strip():
            return {
                'heuristic_score': 0,
                'detected_categories': [],
                'matched_rules': [],
                'manipulation_tactics': [],
                'highlights': [],
                'metadata': {'char_count': 0, 'uppercase_ratio': 0.0, 'digit_ratio': 0.0}
            }

        text_lower = text.lower()
        score = 0
        detected_categories = set()
        matched_rules = []
        highlights = []
        manipulation_tactics = set()

        # Iterate pattern definitions
        for category, patterns in THREAT_PATTERNS.items():
            for pattern_str, weight, description in patterns:
                matches = list(re.finditer(pattern_str, text, re.IGNORECASE))
                if matches:
                    detected_categories.add(category)
                    score += weight
                    matched_rules.append({
                        'category': category,
                        'description': description,
                        'weight': weight,
                        'occurrences': len(matches)
                    })

                    # Map to psychological tactics
                    if category == 'URGENCY_COERCION':
                        manipulation_tactics.add('Artificial Urgency / Panic Induction')
                    elif category == 'FINANCIAL_LOTTERY_LURE':
                        manipulation_tactics.add('Greed / Financial Incentive Exploitation')
                    elif category == 'INVESTMENT_CRYPTO_PONZI':
                        manipulation_tactics.add('FOMO (Fear of Missing Out) / Unrealistic Gains')
                    elif category == 'CREDENTIAL_HARVESTING':
                        manipulation_tactics.add('Credential Theft / Deceptive Gatekeeping')
                    elif category == 'DELIVERY_SERVICE_SMISHING':
                        manipulation_tactics.add('Curiosity / Delivery Service Spoofing')
                    elif category == 'TECH_SUPPORT_INVOICE':
                        manipulation_tactics.add('Authority Impersonation / False Loss Panic')

                    for m in matches:
                        highlights.append({
                            'start': m.start(),
                            'end': m.end(),
                            'text': m.group(0),
                            'category': category,
                            'reason': description,
                            'severity': 'critical' if weight >= 35 else 'warning'
                        })

        # Check for Shortcode SMS prompts ("Text WIN to 87121")
        shortcode_matches = list(SHORTCODE_REGEX.finditer(text))
        if shortcode_matches:
            score += 30
            detected_categories.add('SMS_PREMIUM_SHORTCODE')
            manipulation_tactics.add('Premium Rate SMS Solicitation')
            for sm in shortcode_matches:
                highlights.append({
                    'start': sm.start(),
                    'end': sm.end(),
                    'text': sm.group(0),
                    'category': 'SMS_PREMIUM_SHORTCODE',
                    'reason': 'Premium SMS shortcode prompt typical of mobile billing scams',
                    'severity': 'critical'
                })

        # Stylistic heuristics (uppercase shouting, digit ratio, punctuation abuse)
        letters = [c for c in text if c.isalpha()]
        upper_letters = [c for c in text if c.isupper()]
        digits = [c for c in text if c.isdigit()]
        exclamations = text.count('!')

        uppercase_ratio = len(upper_letters) / max(1, len(letters))
        digit_ratio = len(digits) / max(1, len(text))

        if uppercase_ratio > 0.45 and len(letters) > 15:
            score += 15
            matched_rules.append({
                'category': 'STYLISTIC_AGGRESSION',
                'description': 'Excessive capitalization (shouting effect)',
                'weight': 15,
                'occurrences': 1
            })
            manipulation_tactics.add('Aggressive Stylistic Urgency')

        if exclamations >= 3:
            score += 10
            matched_rules.append({
                'category': 'PUNCTUATION_ABUSE',
                'description': f'Multiple exclamation marks ({exclamations}) used for sensationalism',
                'weight': 10,
                'occurrences': exclamations
            })

        # Cap score at 100
        heuristic_score = min(100, score)

        # Sort highlights by start position
        highlights.sort(key=lambda x: x['start'])

        return {
            'heuristic_score': heuristic_score,
            'detected_categories': sorted(list(detected_categories)),
            'matched_rules': matched_rules,
            'manipulation_tactics': sorted(list(manipulation_tactics)),
            'highlights': highlights,
            'metadata': {
                'char_count': len(text),
                'uppercase_ratio': round(uppercase_ratio, 3),
                'digit_ratio': round(digit_ratio, 3),
                'exclamation_count': exclamations
            }
        }
