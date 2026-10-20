"""
Comparative Machine Learning Benchmark & Feature Explainability Engine
Compares 5 machine learning models (MultinomialNB, ComplementNB, LogisticRegression,
Calibrated LinearSVC, and Random Forest) on the SMS spam corpus.
Computes confusion matrices, ROC-AUC, cross-validation metrics, and extracts
top informative features for explainable AI.
"""

import os
import json
import numpy as np
import pandas as pd
from typing import Dict, Any, List

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB, ComplementNB
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix
)


def run_full_benchmark(data_path: str = 'dataset/SMSSpamCollection', output_path: str = 'models/benchmark_report.json') -> Dict[str, Any]:
    """Runs rigorous comparative benchmark across multiple algorithms."""
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found at {data_path}")

    print("[*] Loading dataset for comparative benchmark...")
    df = pd.read_csv(data_path, sep='\t', header=None, names=['label', 'message'], quoting=3)
    df = df.dropna().drop_duplicates()
    df['target'] = df['label'].map({'ham': 0, 'spam': 1})

    X_train, X_test, y_train, y_test = train_test_split(
        df['message'], df['target'], test_size=0.20, random_state=42, stratify=df['target']
    )

    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        sublinear_tf=True,
        max_features=5000,
        stop_words='english'
    )
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)

    # Models to benchmark
    models = {
        'Multinomial Naive Bayes': MultinomialNB(alpha=0.1),
        'Complement Naive Bayes': ComplementNB(alpha=0.1),
        'Logistic Regression': LogisticRegression(class_weight='balanced', C=2.0, max_iter=1000, random_state=42),
        'Calibrated Linear SVC': CalibratedClassifierCV(LinearSVC(class_weight='balanced', random_state=42, dual=False)),
        'Random Forest (100 Trees)': RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced')
    }

    results = {}
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    for name, clf in models.items():
        print(f"[*] Training and evaluating: {name}...")
        clf.fit(X_train_vec, y_train)

        # Predictions
        y_pred = clf.predict(X_test_vec)
        
        # Probabilities
        if hasattr(clf, 'predict_proba'):
            y_prob = clf.predict_proba(X_test_vec)[:, 1]
            auc = float(roc_auc_score(y_test, y_prob))
        else:
            auc = 0.0

        # Metrics
        acc = float(accuracy_score(y_test, y_pred))
        prec = float(precision_score(y_test, y_pred, zero_division=0))
        rec = float(recall_score(y_test, y_pred, zero_division=0))
        f1 = float(f1_score(y_test, y_pred, zero_division=0))

        # Confusion Matrix
        cm = confusion_matrix(y_test, y_pred)
        tn, fp, fn, tp = cm.ravel()

        # 5-fold CV F1
        cv_scores = cross_val_score(clf, X_train_vec, y_train, cv=cv, scoring='f1')
        cv_f1 = float(cv_scores.mean())
        cv_std = float(cv_scores.std())

        results[name] = {
            'accuracy': round(acc * 100, 2),
            'precision': round(prec * 100, 2),
            'recall': round(rec * 100, 2),
            'f1_score': round(f1 * 100, 2),
            'roc_auc': round(auc * 100, 2),
            'cv_mean_f1': round(cv_f1 * 100, 2),
            'cv_std_f1': round(cv_std * 100, 2),
            'confusion_matrix': {
                'true_negative': int(tn),
                'false_positive': int(fp),
                'false_negative': int(fn),
                'true_positive': int(tp)
            }
        }

    # Extract Top Informative Features (Explainability) using Logistic Regression coefficients
    lr_model = models['Logistic Regression']
    feature_names = np.array(vectorizer.get_feature_names_out())
    coefs = lr_model.coef_[0]

    top_spam_indices = np.argsort(coefs)[-25:][::-1]
    top_ham_indices = np.argsort(coefs)[:25]

    top_spam_features = [
        {'word': str(feature_names[i]), 'weight': round(float(coefs[i]), 3)}
        for i in top_spam_indices
    ]
    top_ham_features = [
        {'word': str(feature_names[i]), 'weight': round(float(coefs[i]), 3)}
        for i in top_ham_indices
    ]

    report = {
        'dataset_info': {
            'total_samples': len(df),
            'ham_count': int((df['target'] == 0).sum()),
            'spam_count': int((df['target'] == 1).sum()),
            'vocabulary_size': len(feature_names)
        },
        'models_benchmark': results,
        'explainability': {
            'top_spam_indicators': top_spam_features,
            'top_ham_indicators': top_ham_features
        }
    }

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w') as f:
        json.dump(report, f, indent=2)

    print(f"[OK] Full benchmark report saved to {output_path}")
    return report


if __name__ == '__main__':
    run_full_benchmark()
