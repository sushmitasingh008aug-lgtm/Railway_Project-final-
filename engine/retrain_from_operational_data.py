"""Build a point-in-time ML table from operational source datasets.

This script intentionally refuses to promote a champion model when the derived
future-event label is too sparse or lacks enough positives in the final temporal
holdout. The supplied 12K demo data is synthetic and is for application testing,
not evidence of real Indian Railways predictive performance.

Expected source directory contains:
  03_assets.xlsx
  04_failure_event_history.xlsx
  05_defect_history.xlsx
  06_maintenance_tasks.xlsx
  08_train_movements.xlsx
  19_inspections.xlsx
  20_maintenance_history.xlsx
"""
from __future__ import annotations

import argparse
import json
import os
from datetime import datetime
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.metrics import (
    average_precision_score,
    brier_score_loss,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier


def load_inputs(data_dir: Path):
    assets = pd.read_excel(data_dir / "03_assets.xlsx")
    failures = pd.read_excel(data_dir / "04_failure_event_history.xlsx")
    trains = pd.read_excel(data_dir / "08_train_movements.xlsx")
    return assets, failures, trains


def nearest_asset_map(assets: pd.DataFrame, failures: pd.DataFrame) -> pd.Series:
    assets = assets.copy()
    failures = failures.copy()
    assets["chainage_km"] = pd.to_numeric(assets["chainage_km"], errors="coerce").fillna(0)
    failures["chainage_km"] = pd.to_numeric(failures["chainage_km"], errors="coerce").fillna(0)
    output = pd.Series(index=failures.index, dtype="object")
    for (section, department), fg in failures.groupby(["section_id", "head"], sort=False):
        ag = assets[(assets.section_id == section) & (assets.department == department)]
        if ag.empty:
            ag = assets[assets.section_id == section]
        if ag.empty:
            continue
        a_chain = ag.chainage_km.to_numpy()
        a_ids = ag.asset_id.to_numpy()
        q = fg.chainage_km.to_numpy()
        nearest = np.abs(q[:, None] - a_chain[None, :]).argmin(axis=1)
        output.loc[fg.index] = a_ids[nearest]
    return output


def build_point_in_time_table(data_dir: Path) -> pd.DataFrame:
    assets, failures, trains = load_inputs(data_dir)
    failures = failures.copy()
    failures["failure_start"] = pd.to_datetime(failures["failure_start"], errors="coerce")
    failures = failures.dropna(subset=["failure_start"])
    failures["asset_id"] = nearest_asset_map(assets, failures)
    failures = failures.dropna(subset=["asset_id"]).sort_values(["asset_id", "failure_start"])

    # Future label: next failure on the same matched asset within 30 days.
    failures["next_failure"] = failures.groupby("asset_id")["failure_start"].shift(-1)
    delta_days = (failures["next_failure"] - failures["failure_start"]).dt.total_seconds() / 86400.0
    failures["future_critical_event_30d"] = delta_days.between(0, 30, inclusive="both").astype(int)
    failures["days_since_last_failure"] = (
        failures["failure_start"] - failures.groupby("asset_id")["failure_start"].shift(1)
    ).dt.total_seconds().div(86400).fillna(365).clip(0, 365)

    # Point-in-time rolling failure counts. Only prior records are counted.
    for days in (7, 30, 90, 180, 365):
        result = np.zeros(len(failures), dtype=int)
        for _, idx in failures.groupby("asset_id", sort=False).groups.items():
            times = failures.loc[idx, "failure_start"].to_numpy(dtype="datetime64[ns]")
            idx_array = np.asarray(list(idx), dtype=int)
            for j, current in enumerate(times):
                lower = current - np.timedelta64(days, "D")
                result[idx_array[j]] = int(((times[:j] >= lower) & (times[:j] < current)).sum())
        failures[f"failures_{days}d"] = result

    asset_idx = assets.set_index("asset_id")
    for col in ["asset_importance", "asset_age_years", "condition_score", "health_index", "last_maintenance_date"]:
        failures[col] = failures.asset_id.map(asset_idx[col])
    failures["last_maintenance_date"] = pd.to_datetime(failures["last_maintenance_date"], errors="coerce")
    failures["days_since_last_maintenance"] = (
        failures["failure_start"] - failures["last_maintenance_date"]
    ).dt.total_seconds().div(86400).clip(lower=0)
    failures["inspection_score"] = failures["condition_score"]
    failures["defects_30d"] = failures["failures_30d"]
    failures["failure_duration_30d"] = failures["failures_30d"] * failures["failure_duration_min"]
    failures["failure_duration_90d"] = failures["failures_90d"] * failures["failure_duration_min"]
    failures["repeat_failure_flag"] = (failures["failures_90d"] >= 2).astype(int)
    failures["failure_recurrence_rate"] = failures["failures_90d"] / failures["failures_365d"].clip(lower=1)

    trains = trains.copy()
    trains["entry_time"] = pd.to_datetime(trains["entry_time"], errors="coerce")
    trains["date"] = trains["entry_time"].dt.floor("D")
    daily = trains.groupby(["section_id", "date"])[["is_passenger", "is_goods"]].sum().reset_index()
    failures["date"] = failures["failure_start"].dt.floor("D")
    failures = failures.merge(daily, on=["section_id", "date"], how="left")
    failures[["is_passenger", "is_goods"]] = failures[["is_passenger", "is_goods"]].fillna(0)
    failures["passenger_train_count"] = failures["is_passenger"].astype(int)
    failures["goods_train_count"] = failures["is_goods"].astype(int)
    failures["traffic_density"] = pd.cut(
        failures["passenger_train_count"] + failures["goods_train_count"],
        [-1, 0, 3, 999], labels=["Low", "Medium", "High"],
    ).astype(str)

    table = failures[
        [
            "failure_start", "asset_id", "section_id", "head", "failure_type",
            "asset_importance", "asset_age_years", "condition_score", "inspection_score",
            "health_index", "days_since_last_maintenance", "days_since_last_failure",
            "defects_30d", "failures_7d", "failures_30d", "failures_90d",
            "failures_180d", "failures_365d", "failure_duration_30d",
            "failure_duration_90d", "repeat_failure_flag", "failure_recurrence_rate",
            "passenger_train_count", "goods_train_count", "traffic_density",
            "future_critical_event_30d",
        ]
    ].rename(
        columns={
            "failure_start": "record_date",
            "head": "department",
            "failure_type": "task_type",
            "asset_age_years": "asset_age",
        }
    )
    table["record_date"] = pd.to_datetime(table["record_date"]).dt.strftime("%Y-%m-%d")
    return table.reset_index(drop=True)


def benchmark(table: pd.DataFrame):
    target = "future_critical_event_30d"
    features = [c for c in table.columns if c not in {"record_date", "asset_id", "section_id", target}]
    categorical = ["department", "traffic_density", "task_type"]
    numeric = [c for c in features if c not in categorical]

    X, y = table[features], table[target].astype(int)
    n = len(table)
    train_end, val_end = int(n * 0.65), int(n * 0.85)
    X_train, y_train = X.iloc[:train_end], y.iloc[:train_end]
    X_test, y_test = X.iloc[val_end:], y.iloc[val_end:]

    positives = int(y_test.sum())
    if positives < 10:
        return {
            "status": "RETRAINING_NOT_PROMOTED",
            "reason": f"Final temporal holdout has only {positives} positive labels; at least 10 are required for a meaningful demo benchmark.",
            "feature_names": features,
            "training_rows": n,
            "positive_rate": float(y.mean()),
        }

    prep = ColumnTransformer(
        [("num", "passthrough", numeric), ("cat", OneHotEncoder(handle_unknown="ignore"), categorical)]
    )
    models = {
        "HistGradientBoosting": HistGradientBoostingClassifier(max_iter=120, max_depth=7, learning_rate=0.08, random_state=42),
        "XGBoost": XGBClassifier(n_estimators=140, max_depth=5, learning_rate=0.07, subsample=0.85, colsample_bytree=0.9, eval_metric="logloss", random_state=42, n_jobs=4),
        "LightGBM": LGBMClassifier(n_estimators=140, max_depth=7, num_leaves=31, learning_rate=0.07, verbosity=-1, random_state=42, n_jobs=4),
        "Random Forest": RandomForestClassifier(n_estimators=100, max_depth=9, min_samples_leaf=4, random_state=42, n_jobs=-1, class_weight="balanced_subsample"),
    }

    rows, fitted = [], {}
    for name, estimator in models.items():
        pipe = Pipeline([("prep", prep), ("model", estimator)])
        pipe.fit(X_train, y_train)
        probability = pipe.predict_proba(X_test)[:, 1]
        prediction = (probability >= 0.5).astype(int)
        pr_auc = average_precision_score(y_test, probability)
        recall = recall_score(y_test, prediction, zero_division=0)
        f1 = f1_score(y_test, prediction, zero_division=0)
        row = {
            "model_name": name,
            "PR_AUC": float(pr_auc),
            "ROC_AUC": float(roc_auc_score(y_test, probability)),
            "Recall": float(recall),
            "Precision": float(precision_score(y_test, prediction, zero_division=0)),
            "F1_Score": float(f1),
            "Brier_Score": float(brier_score_loss(y_test, probability)),
            "composite_score": float(0.40 * pr_auc + 0.35 * recall + 0.25 * f1),
        }
        rows.append(row)
        fitted[name] = pipe

    rows.sort(key=lambda r: r["composite_score"], reverse=True)
    return {
        "status": "PROMOTED",
        "feature_names": features,
        "training_rows": n,
        "positive_rate": float(y.mean()),
        "champion_model": rows[0]["model_name"],
        "champion_metrics": rows[0],
        "benchmark_comparison": rows,
        "model": fitted[rows[0]["model_name"]],
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", required=True)
    parser.add_argument("--output-dir", default="engine/model_registry")
    parser.add_argument("--model-version", default="v3.0-12k")
    args = parser.parse_args()

    data_dir = Path(args.data_dir)
    out = Path(args.output_dir)
    out.mkdir(parents=True, exist_ok=True)
    table = build_point_in_time_table(data_dir)
    table.to_csv(out / "historical_ml_dataset.csv", index=False)
    result = benchmark(table)

    metadata = {k: v for k, v in result.items() if k != "model"}
    metadata.update({
        "model_version": args.model_version,
        "trained_at": datetime.now().isoformat(timespec="seconds"),
        "evaluation_protocol": "Temporal 65/20/15",
        "target_variable": "future_critical_event_30d",
        "data_note": "Synthetic application-validation data; not real railway operational performance.",
    })
    (out / "ml_model_meta.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    if result["status"] == "PROMOTED":
        joblib.dump(result["model"], out / "ml_risk_model.pkl")
        print(f"PROMOTED {result['champion_model']}")
    else:
        print("RETRAINING_NOT_PROMOTED")
        print(result["reason"])


if __name__ == "__main__":
    main()
