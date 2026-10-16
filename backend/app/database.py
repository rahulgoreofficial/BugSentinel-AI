"""SQLite persistence layer for BugSentinel AI test runs and findings."""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Any, Dict, List, Optional

from backend.app.config import settings


def get_db_path(custom_path: Optional[Path | str] = None) -> Path:
    """Resolve database file path."""
    if custom_path:
        return Path(custom_path)
    return settings.DB_PATH


def _ensure_tables(conn: sqlite3.Connection) -> None:
    """Ensure runs and findings tables exist."""
    with conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS runs (
                run_id TEXT PRIMARY KEY,
                target_id TEXT NOT NULL,
                status TEXT NOT NULL,
                started_at TEXT NOT NULL,
                completed_at TEXT,
                duration_ms INTEGER DEFAULT 0,
                total_tests INTEGER DEFAULT 0,
                passed_count INTEGER DEFAULT 0,
                failed_count INTEGER DEFAULT 0,
                flaky_count INTEGER DEFAULT 0,
                error_count INTEGER DEFAULT 0,
                result_json TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS findings (
                finding_id TEXT PRIMARY KEY,
                run_id TEXT NOT NULL,
                scenario_id TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                severity TEXT NOT NULL,
                classification TEXT NOT NULL,
                expected_behavior TEXT NOT NULL,
                actual_behavior TEXT NOT NULL,
                first_attempt_status TEXT NOT NULL,
                verification_attempt_status TEXT,
                reproducible INTEGER NOT NULL DEFAULT 1,
                screenshot_url TEXT,
                logs_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (run_id) REFERENCES runs (run_id) ON DELETE CASCADE
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_runs_started_at ON runs (started_at DESC)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_findings_run_id ON findings (run_id)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_findings_scenario ON findings (scenario_id)"
        )


def get_db_connection(db_path: Optional[Path | str] = None) -> sqlite3.Connection:
    """Create and return a configured SQLite connection with tables ensured."""
    target_path = get_db_path(db_path)
    target_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(target_path), timeout=15.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    _ensure_tables(conn)
    return conn


def init_db(db_path: Optional[Path | str] = None) -> None:
    """Initialize database tables and indexes."""
    conn = get_db_connection(db_path)
    conn.close()


def save_run(run_data: Dict[str, Any], db_path: Optional[Path | str] = None) -> None:
    """Save or update a test run in SQLite."""
    conn = get_db_connection(db_path)
    try:
        with conn:
            result_json = (
                json.dumps(run_data)
                if not isinstance(run_data.get("result_json"), str)
                else run_data["result_json"]
            )
            conn.execute(
                """
                INSERT OR REPLACE INTO runs (
                    run_id, target_id, status, started_at, completed_at,
                    duration_ms, total_tests, passed_count, failed_count,
                    flaky_count, error_count, result_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    run_data["run_id"],
                    run_data.get("target_id", "shopdemo"),
                    run_data["status"],
                    run_data["started_at"],
                    run_data.get("completed_at"),
                    run_data.get("duration_ms", 0),
                    run_data.get("total_tests", 0),
                    run_data.get("passed_count", 0),
                    run_data.get("failed_count", 0),
                    run_data.get("flaky_count", 0),
                    run_data.get("error_count", 0),
                    result_json,
                ),
            )
    finally:
        conn.close()


def get_run(run_id: str, db_path: Optional[Path | str] = None) -> Optional[Dict[str, Any]]:
    """Retrieve a single test run by run_id."""
    conn = get_db_connection(db_path)
    try:
        cursor = conn.execute(
            "SELECT * FROM runs WHERE run_id = ?",
            (run_id,),
        )
        row = cursor.fetchone()
        if not row:
            return None

        # Parse full JSON object for the run
        full_data = json.loads(row["result_json"])
        return full_data
    finally:
        conn.close()


def list_runs(limit: int = 50, db_path: Optional[Path | str] = None) -> List[Dict[str, Any]]:
    """List recent runs with summary statistics."""
    conn = get_db_connection(db_path)
    try:
        cursor = conn.execute(
            """
            SELECT run_id, target_id, status, started_at, completed_at,
                   duration_ms, total_tests, passed_count, failed_count,
                   flaky_count, error_count
            FROM runs
            ORDER BY started_at DESC
            LIMIT ?
            """,
            (limit,),
        )
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


def save_finding(finding_data: Dict[str, Any], db_path: Optional[Path | str] = None) -> None:
    """Save or update a bug finding record."""
    conn = get_db_connection(db_path)
    try:
        logs_val = finding_data.get("logs", [])
        logs_json = json.dumps(logs_val) if not isinstance(logs_val, str) else logs_val
        reproducible_int = 1 if finding_data.get("reproducible", True) else 0

        with conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO findings (
                    finding_id, run_id, scenario_id, title, description,
                    severity, classification, expected_behavior, actual_behavior,
                    first_attempt_status, verification_attempt_status,
                    reproducible, screenshot_url, logs_json, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    finding_data["finding_id"],
                    finding_data["run_id"],
                    finding_data["scenario_id"],
                    finding_data["title"],
                    finding_data.get("description", ""),
                    finding_data["severity"],
                    finding_data["classification"],
                    finding_data["expected_behavior"],
                    finding_data["actual_behavior"],
                    finding_data.get("first_attempt_status", "FAIL"),
                    finding_data.get("verification_attempt_status"),
                    reproducible_int,
                    finding_data.get("screenshot_url"),
                    logs_json,
                    finding_data["created_at"],
                ),
            )
    finally:
        conn.close()


def get_finding(finding_id: str, db_path: Optional[Path | str] = None) -> Optional[Dict[str, Any]]:
    """Retrieve a finding by ID."""
    conn = get_db_connection(db_path)
    try:
        cursor = conn.execute(
            "SELECT * FROM findings WHERE finding_id = ?",
            (finding_id,),
        )
        row = cursor.fetchone()
        if not row:
            return None

        data = dict(row)
        data["reproducible"] = bool(data["reproducible"])
        data["logs"] = json.loads(data["logs_json"]) if data.get("logs_json") else []
        return data
    finally:
        conn.close()


def list_findings(
    run_id: Optional[str] = None,
    limit: int = 50,
    db_path: Optional[Path | str] = None,
) -> List[Dict[str, Any]]:
    """List findings, optionally filtered by run_id."""
    conn = get_db_connection(db_path)
    try:
        if run_id:
            cursor = conn.execute(
                """
                SELECT * FROM findings
                WHERE run_id = ?
                ORDER BY created_at DESC
                LIMIT ?
                """,
                (run_id, limit),
            )
        else:
            cursor = conn.execute(
                """
                SELECT * FROM findings
                ORDER BY created_at DESC
                LIMIT ?
                """,
                (limit,),
            )
        rows = cursor.fetchall()
        results = []
        for r in rows:
            item = dict(r)
            item["reproducible"] = bool(item["reproducible"])
            item["logs"] = json.loads(item["logs_json"]) if item.get("logs_json") else []
            results.append(item)
        return results
    finally:
        conn.close()
