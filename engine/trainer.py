"""
Model Training and Persistence Pipeline
Trains an ensemble of TF-IDF + Logistic Regression and Naive Bayes on the SMS Spam dataset,
evaluates precision, recall, F1, and saves the trained artifact with performance metadata.
"""

import os
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import classification_report, accuracy_score, precision_score, recall_score, f1_score, roc_auc_score


def train_and_save_model(data_path: str = 'dataset/SMSSpamCollection', models_dir: str = 'models'):
    os.makedirs(models_dir, exist_ok=True)

    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found at {data_path}")

    print(f"[*] Loading SMS Spam dataset from {data_path}...")
    df = pd.read_csv(data_path, sep='\t', header=None, names=['label', 'message'], quoting=3)
    df = df.dropna().drop_duplicates()
    
    # Target encoding: ham -> 0, spam -> 1
    df['target'] = df['label'].map({'ham': 0, 'spam': 1})
    print(f"[*] Total unique samples: {len(df)} (Ham: {(df['target'] == 0).sum()}, Spam: {(df['target'] == 1).sum()})")

    X_train, X_test, y_train, y_test = train_test_split(
        df['message'], df['target'], test_size=0.20, random_state=42, stratify=df['target']
    )

    print("[*] Vectorizing text using TF-IDF (unigrams + bigrams)...")
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        sublinear_tf=True,
        max_features=5000,
        stop_words='english'
    )
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)

    # 1. Train Calibrated Logistic Regression
    print("[*] Training Logistic Regression model with class balancing...")
    log_reg = LogisticRegression(class_weight='balanced', C=2.0, max_iter=1000, random_state=42)
    log_reg.fit(X_train_vec, y_train)

    # 2. Train Multinomial Naive Bayes
    print("[*] Training Multinomial Naive Bayes classifier...")
    nb_clf = MultinomialNB(alpha=0.1)
    nb_clf.fit(X_train_vec, y_train)

    # Evaluate ensemble prediction: average probability
    y_test_prob_lr = log_reg.predict_proba(X_test_vec)[:, 1]
    y_test_prob_nb = nb_clf.predict_proba(X_test_vec)[:, 1]
    y_test_prob_ensemble = 0.55 * y_test_prob_lr + 0.45 * y_test_prob_nb
    y_pred_ensemble = (y_test_prob_ensemble >= 0.5).astype(int)

    acc = accuracy_score(y_test, y_pred_ensemble)
    prec = precision_score(y_test, y_pred_ensemble)
    rec = recall_score(y_test, y_pred_ensemble)
    f1 = f1_score(y_test, y_pred_ensemble)
    roc_auc = roc_auc_score(y_test, y_test_prob_ensemble)

    print("\n" + "=" * 50)
    print("           MODEL EVALUATION BENCHMARK")
    print("=" * 50)
    print(f"Accuracy:  {acc * 100:.2f}%")
    print(f"Precision: {prec * 100:.2f}%")
    print(f"Recall:    {rec * 100:.2f}%")
    print(f"F1 Score:  {f1 * 100:.2f}%")
    print(f"ROC-AUC:   {roc_auc * 100:.2f}%")
    print("=" * 50)
    print("\nDetailed Classification Report:")
    print(classification_report(y_test, y_pred_ensemble, target_names=['Ham (Legit)', 'Spam / Scam']))

    # Perform 5-fold cross validation
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(log_reg, vectorizer.transform(df['message']), df['target'], cv=cv, scoring='f1')
    print(f"[*] 5-Fold Cross-Validation Mean F1: {cv_scores.mean() * 100:.2f}% (+/- {cv_scores.std() * 100:.2f}%)")

    # Serialize artifacts
    print(f"[*] Saving model artifacts to '{models_dir}'...")
    joblib.dump(vectorizer, os.path.join(models_dir, 'tfidf_vectorizer.joblib'))
    joblib.dump(log_reg, os.path.join(models_dir, 'log_reg_model.joblib'))
    joblib.dump(nb_clf, os.path.join(models_dir, 'nb_model.joblib'))

    metadata = {
        'model_name': 'Hybrid LogisticRegression + MultinomialNB Ensemble',
        'vectorizer': 'TF-IDF (1,2-grams, sublinear_tf=True, 5000 features)',
        'accuracy': round(acc, 4),
        'precision': round(prec, 4),
        'recall': round(rec, 4),
        'f1_score': round(f1, 4),
        'roc_auc': round(roc_auc, 4),
        'cv_mean_f1': round(float(cv_scores.mean()), 4),
        'samples_trained': len(X_train),
        'samples_evaluated': len(X_test),
        'dataset': 'UCI SMS Spam Collection (5574 messages)'
    }

    with open(os.path.join(models_dir, 'metadata.json'), 'w') as f:
        json.dump(metadata, f, indent=2)

    print("[OK] Model training and serialization complete!")
    return metadata


if __name__ == '__main__':
    train_and_save_model()
