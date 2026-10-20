"""
Indian Mobile Phone Number & Input Validation Utilities
Validates 10-digit Indian mobile numbers (starting with 6, 7, 8, or 9).
Handles stripping of prefixes (+91, 91, 0) and formatting characters.
"""

import re
from typing import Tuple, Optional

# Indian mobile regex: exactly 10 digits starting with 6, 7, 8, or 9
INDIAN_MOBILE_REGEX = re.compile(r'^[6-9]\d{9}$')


def validate_indian_mobile(phone_input: str) -> Tuple[bool, str, Optional[str]]:
    """
    Validates and normalizes an Indian mobile phone number.
    Returns: (is_valid, normalized_10_digit_number, error_message)
    """
    if not phone_input or not str(phone_input).strip():
        return False, "", "Phone number is required."

    raw = str(phone_input).strip()
    
    # Remove common formatting characters: spaces, hyphens, parentheses, dots, plus signs
    cleaned = re.sub(r'[\s\+\-\(\)\.]+', '', raw)

    # Handle +91 or 91 country code prefix (12 digits)
    if len(cleaned) == 12 and cleaned.startswith('91'):
        cleaned = cleaned[2:]
    # Handle leading 0 prefix (11 digits)
    elif len(cleaned) == 11 and cleaned.startswith('0'):
        cleaned = cleaned[1:]

    # Must contain only digits
    if not cleaned.isdigit():
        return False, cleaned, "Phone number must contain digits only."

    # Validate 10 digits
    if len(cleaned) != 10:
        return False, cleaned, f"Phone number must be exactly 10 digits (got {len(cleaned)} digits)."

    # Validate Indian mobile starting digit (6, 7, 8, or 9)
    if not INDIAN_MOBILE_REGEX.match(cleaned):
        return False, cleaned, f"Invalid Indian mobile number. Must start with 6, 7, 8, or 9 (got '{cleaned[0]}')."

    return True, cleaned, None
