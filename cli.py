#!/usr/bin/env python3
"""
CyberGuard Command Line Interface (CLI)
Provides power users and automated security pipelines with direct terminal commands
for threat scanning, URL forensics, batch processing, model benchmarking, and audit trails.
"""

import sys
import os
import argparse
import json

# Ensure clean UTF-8 output on Windows terminals
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from engine.detector import ScamDetector
from engine.url_inspector import URLInspector
from engine.benchmark import run_full_benchmark
from engine.db import ScanDatabase

# ANSI color codes
CYAN = '\033[96m'
GREEN = '\033[92m'
YELLOW = '\033[93m'
RED = '\033[91m'
MAGENTA = '\033[95m'
BOLD = '\033[1m'
RESET = '\033[0m'


def make_gauge(score: int, length: int = 30) -> str:
    filled = int(round((score / 100.0) * length))
    empty = length - filled
    if score >= 75:
        color = RED
    elif score >= 50:
        color = YELLOW
    elif score >= 25:
        color = YELLOW
    else:
        color = GREEN
    bar = f"{color}[{'#' * filled}{'-' * empty}]{RESET} {score}/100"
    return bar


def print_banner():
    print(f"{CYAN}{BOLD}")
    print("=================================================================")
    print("  CYBERGUARD // SCAM & SPAM DEFENSE SHIELD - TERMINAL CLI        ")
    print("=================================================================")
    print(f"{RESET}")


def cmd_scan(args):
    text = " ".join(args.text).strip()
    if not text:
        print(f"{RED}[!] Error: No text provided to scan.{RESET}")
        return

    print_banner()
    phone = getattr(args, 'phone', '9876543210')
    print(f"[*] Analyzing message for Phone: +91 {phone}...")
    detector = ScamDetector()
    rep = detector.analyze(text, phone_number=phone, context_type=args.type, gemini_api_key=args.gemini_key)

    score = rep['risk_score']
    level = rep['risk_level']
    badge = rep['verdict_badge']
    pred = rep.get('prediction', 'HAM')
    conf = rep.get('confidence', 0.0)
    is_cached = rep.get('retrieved_from_history', False)

    pred_color = RED if pred == 'SPAM' else GREEN
    level_color = RED if score >= 75 else (YELLOW if score >= 50 else GREEN)

    print("\n" + "-" * 65)
    print(f"THREAT ASSESSMENT REPORT:")
    print("-" * 65)
    print(f"Phone Number:  +91 {rep.get('phone_number', phone)}")
    print(f"Prediction:    {pred_color}{BOLD}{pred}{RESET} ({conf:.1f}% Confidence)")
    if is_cached:
        print(f"Inference:     {CYAN}[CACHE HIT] Retrieved from SQLite scan history without re-running model{RESET}")
    else:
        print(f"Inference:     {GREEN}[NEW ML SCAN] Evaluated using TF-IDF + Logistic Regression{RESET}")
    print(f"Risk Score:    {make_gauge(score)}")
    print(f"Risk Level:    {level_color}{BOLD}{level}{RESET} [{badge}]")
    print(f"Summary:       {rep['summary']}")
    print("-" * 65)

    if rep['heuristics']['detected_categories']:
        print(f"\n{YELLOW}[!] Detected Threat Signatures:{RESET}")
        for cat in rep['heuristics']['detected_categories']:
            print(f"  * {cat.replace('_', ' ')}")

    if rep['manipulation_tactics']:
        print(f"\n{MAGENTA}[!] Psychological Manipulation Tactics:{RESET}")
        for tac in rep['manipulation_tactics']:
            print(f"  * {tac}")

    if rep['url_analysis']:
        print(f"\n{CYAN}[*] URL & Domain Forensics:{RESET}")
        for u in rep['url_analysis']:
            u_color = RED if u['risk_score'] >= 40 else GREEN
            print(f"  * {u['url']} -> {u_color}{u['risk_level']} ({u['risk_score']}/100){RESET}")
            for r in u['reasons']:
                print(f"      - {r}")

    if rep.get('email_analysis', {}).get('flags'):
        print(f"\n{RED}[!] Email Header Spoofing Flags:{RESET}")
        for f in rep['email_analysis']['flags']:
            print(f"  * {f}")

    if rep.get('crypto_analysis', {}).get('addresses'):
        print(f"\n{YELLOW}[!] Cryptocurrency Addresses Detected:{RESET}")
        for a in rep['crypto_analysis']['addresses']:
            print(f"  * [{a['type']}] {a['address']}")

    print(f"\n{GREEN}[+] Recommended Protective Actions:{RESET}")
    for rec in rep['recommendations']:
        print(f"  [OK] {rec}")
    print()


def cmd_scan_url(args):
    url = args.url.strip()
    print_banner()
    print(f"[*] Inspecting URL: {url}")
    report = URLInspector.inspect_url(url)

    color = RED if report['risk_score'] >= 40 else GREEN
    print(f"\nNormalized URL: {report['normalized_url']}")
    print(f"Host:           {report['host']}")
    print(f"Risk Level:     {color}{BOLD}{report['risk_level']} ({report['risk_score']}/100){RESET}")
    print(f"Security Flags: {', '.join(report['flags']) if report['flags'] else 'None (Clean)'}")
    print("\nFindings:")
    for r in report['reasons']:
        print(f"  * {r}")
    print()


def cmd_batch(args):
    path = args.file
    if not os.path.exists(path):
        print(f"{RED}[!] Error: File '{path}' does not exist.{RESET}")
        return

    print_banner()
    print(f"[*] Reading batch file: {path}...")
    detector = ScamDetector()

    lines = []
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            l = line.strip()
            if l:
                lines.append(l)

    print(f"[*] Processing {len(lines)} messages...\n")
    scams = 0
    spams = 0
    safes = 0

    print(f"{'#':<4} | {'Risk':<5} | {'Verdict':<18} | {'Snippet'}")
    print("-" * 70)

    for i, line in enumerate(lines[:100], 1):
        rep = detector.analyze(line, save_to_db=False)
        score = rep['risk_score']
        if rep['is_scam']:
            scams += 1
            c = RED
        elif rep['is_spam']:
            spams += 1
            c = YELLOW
        else:
            safes += 1
            c = GREEN

        snippet = (line[:40] + '...') if len(line) > 40 else line
        print(f"{i:<4} | {c}{score:<5}{RESET} | {c}{rep['verdict_badge']:<18}{RESET} | {snippet}")

    print("-" * 70)
    print(f"\nBATCH RESULTS: Total={len(lines)}, Scams={scams}, Spam={spams}, Clean={safes}\n")


def cmd_benchmark(args):
    print_banner()
    report = run_full_benchmark()
    models = report['models_benchmark']

    print(f"\n{'Model Algorithm':<28} | {'Accuracy':<9} | {'Precision':<10} | {'Recall':<8} | {'F1-Score':<9} | {'ROC-AUC'}")
    print("=" * 80)
    for name, m in models.items():
        print(f"{name:<28} | {m['accuracy']:<8}% | {m['precision']:<9}% | {m['recall']:<7}% | {m['f1_score']:<8}% | {m['roc_auc']}%")
    print("=" * 80 + "\n")


def cmd_explain(args):
    report_path = 'models/benchmark_report.json'
    if not os.path.exists(report_path):
        run_full_benchmark()

    with open(report_path, 'r') as f:
        data = json.load(f)

    exp = data.get('explainability', {})
    print_banner()
    print(f"{RED}{BOLD}TOP SPAM / FRAUD INDICATOR KEYWORDS (Highest Positive Model Weights):{RESET}")
    print(f"{'Rank':<5} | {'Token / Phrase':<20} | {'Weight (Log-Odds)'}")
    print("-" * 45)
    for i, item in enumerate(exp.get('top_spam_indicators', [])[:15], 1):
        print(f"{i:<5} | {item['word']:<20} | {RED}+{item['weight']}{RESET}")

    print(f"\n{GREEN}{BOLD}TOP LEGITIMATE / HAM INDICATOR KEYWORDS (Negative Model Weights):{RESET}")
    print(f"{'Rank':<5} | {'Token / Phrase':<20} | {'Weight (Log-Odds)'}")
    print("-" * 45)
    for i, item in enumerate(exp.get('top_ham_indicators', [])[:15], 1):
        print(f"{i:<5} | {item['word']:<20} | {GREEN}{item['weight']}{RESET}")
    print()


def cmd_history(args):
    db = ScanDatabase()
    scans = db.get_recent_scans(limit=args.limit)
    print_banner()
    print(f"[*] Showing last {len(scans)} audit scan records:\n")
    print(f"{'ID':<4} | {'Time':<19} | {'Score':<5} | {'Verdict':<18} | {'Text Snippet'}")
    print("-" * 75)
    for s in scans:
        c = RED if s['risk_score'] >= 75 else (YELLOW if s['risk_score'] >= 50 else GREEN)
        time_str = s['created_at'][:19]
        snippet = (s['text'][:35] + '...') if len(s['text']) > 35 else s['text']
        print(f"{s['id']:<4} | {time_str:<19} | {c}{s['risk_score']:<5}{RESET} | {c}{s['verdict_badge']:<18}{RESET} | {snippet}")
    print("-" * 75)
    stats = db.get_stats()
    print(f"Stats: Total Scans={stats['total_scanned']}, Avg Risk={stats['avg_risk_score']}/100, Scams={stats['scam_count']}, Clean={stats['safe_count']}\n")


def main():
    parser = argparse.ArgumentParser(description="CyberGuard Scam and Spam Threat Detection CLI")
    subparsers = parser.add_subparsers(dest="command", help="Available subcommands")

    # scan
    p_scan = subparsers.add_parser("scan", help="Scan a message or text")
    p_scan.add_argument("text", nargs="+", help="Message text to analyze")
    p_scan.add_argument("--phone", default="9876543210", help="10-digit Indian mobile number")
    p_scan.add_argument("--type", default="general", help="Input type (message, url, crypto, email)")
    p_scan.add_argument("--gemini-key", default=None, help="Optional Gemini API Key")
    p_scan.set_defaults(func=cmd_scan)

    # scan-url
    p_url = subparsers.add_parser("scan-url", help="Inspect a URL or domain link")
    p_url.add_argument("url", help="URL to inspect")
    p_url.set_defaults(func=cmd_scan_url)

    # batch
    p_batch = subparsers.add_parser("batch", help="Scan a batch file (one message per line)")
    p_batch.add_argument("file", help="Path to text/csv file")
    p_batch.set_defaults(func=cmd_batch)

    # benchmark
    p_bench = subparsers.add_parser("benchmark", help="Run comparative ML model benchmarks")
    p_bench.set_defaults(func=cmd_benchmark)

    # explain
    p_exp = subparsers.add_parser("explain", help="Show top informative spam vs ham feature weights")
    p_exp.set_defaults(func=cmd_explain)

    # history
    p_hist = subparsers.add_parser("history", help="View recent scan audit history from database")
    p_hist.add_argument("--limit", type=int, default=15, help="Number of records to show")
    p_hist.set_defaults(func=cmd_history)

    args = parser.parse_args()
    if not args.command:
        parser.print_help()
    else:
        args.func(args)


if __name__ == '__main__':
    main()
