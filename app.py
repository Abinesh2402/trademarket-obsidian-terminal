"""
Scam and Spam Threat Detection System - Web Server & REST API
Serves interactive security operations dashboard and public REST API endpoints.
Includes 10-digit Indian mobile validation, SQLite audit history, and deduplication cache.
"""

import os
import json
from flask import Flask, request, jsonify, render_template
from engine.detector import ScamDetector
from engine.url_inspector import URLInspector
from engine.validator import validate_indian_mobile

app = Flask(__name__)
detector = ScamDetector(models_dir='models', db_path='scans.db')


@app.route('/')
def index():
    model_meta = detector.metadata or {}
    history = detector.db.get_recent_scans(limit=30)
    stats = detector.db.get_stats()
    return render_template('index.html', model_meta=model_meta, history=history, stats=stats)


@app.route('/api/scan', methods=['POST'])
def api_scan():
    """
    Scan a message with 10-digit Indian phone number validation.
    If the same phone number submits the same message again, retrieves the
    previously saved prediction instead of running the model again.
    """
    data = request.get_json(silent=True) or {}
    text = (data.get('message') or data.get('text') or '').strip()
    phone_raw = (data.get('phone_number') or '').strip()
    context_type = data.get('type', 'general')
    gemini_key = data.get('gemini_api_key', '').strip() or None

    # 1. Validate Phone Number (10 digits, Indian mobile)
    is_valid_phone, clean_phone, phone_error = validate_indian_mobile(phone_raw)
    if not is_valid_phone:
        return jsonify({
            'success': False,
            'error': phone_error or 'Please enter a valid 10-digit Indian mobile number.'
        }), 400

    # 2. Validate Message Field
    if not text:
        return jsonify({
            'success': False,
            'error': 'SMS message text is required.'
        }), 400

    # 3. Analyze / Retrieve from History Cache
    report = detector.analyze(
        text=text,
        phone_number=clean_phone,
        context_type=context_type,
        gemini_api_key=gemini_key
    )

    return jsonify({
        'success': True,
        'data': report,
        'prediction': report.get('prediction', 'HAM'),
        'confidence': report.get('confidence', 0.0),
        'phone_number': clean_phone,
        'retrieved_from_history': report.get('retrieved_from_history', False)
    })


@app.route('/api/history', methods=['GET'])
def api_history():
    """Returns recent scan history records including phone numbers and timestamps."""
    limit = int(request.args.get('limit', 50))
    records = detector.db.get_recent_scans(limit=limit)
    stats = detector.db.get_stats()
    return jsonify({
        'success': True,
        'history': records,
        'stats': stats
    })


@app.route('/api/history/clear', methods=['POST'])
def api_history_clear():
    """Purges scan history records."""
    detector.db.clear_history()
    return jsonify({
        'success': True,
        'message': 'Scan history cleared successfully.'
    })


@app.route('/api/batch-scan', methods=['POST'])
def api_batch_scan():
    """Scan multiple messages in batch and return aggregate metrics."""
    data = request.get_json(silent=True) or {}
    messages = data.get('messages', [])
    default_phone = data.get('phone_number', '9876543210')
    gemini_key = data.get('gemini_api_key', '').strip() or None

    if not messages or not isinstance(messages, list):
        return jsonify({
            'success': False,
            'error': 'A list of messages is required.'
        }), 400

    results = []
    scam_count = 0
    spam_count = 0
    safe_count = 0
    total_score = 0

    for msg in messages[:50]:  # Limit batch to 50 for performance
        text = str(msg).strip()
        if not text:
            continue
        rep = detector.analyze(text=text, phone_number=default_phone, gemini_api_key=gemini_key)
        results.append(rep)
        total_score += rep['risk_score']
        if rep['is_scam']:
            scam_count += 1
        elif rep['is_spam']:
            spam_count += 1
        else:
            safe_count += 1

    total = len(results)
    avg_score = round(total_score / max(1, total), 1)

    return jsonify({
        'success': True,
        'metrics': {
            'total_scanned': total,
            'scam_count': scam_count,
            'spam_count': spam_count,
            'safe_count': safe_count,
            'avg_risk_score': avg_score
        },
        'results': results
    })


@app.route('/api/model-info', methods=['GET'])
def api_model_info():
    """Returns trained model performance metrics and dataset specifications."""
    return jsonify({
        'success': True,
        'model_loaded': detector.is_ml_loaded,
        'metadata': detector.metadata
    })


@app.route('/api/health', methods=['GET'])
def api_health():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'ml_engine': 'online' if detector.is_ml_loaded else 'offline',
        'version': '1.1.0'
    })


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"[*] Starting Scam & Spam Threat Detection Server on http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
