"""Configuration settings for BugSentinel AI."""

from __future__ import annotations

import os
from pathlib import Path


class Settings:
    """Application settings and filesystem paths."""

    APP_NAME: str = "BugSentinel AI"
    APP_VERSION: str = "0.1.0"
    APP_DESCRIPTION: str = (
        "AI-assisted autonomous web application testing and evidence-based bug detection."
    )

    # Base paths
    # backend/app/config.py -> parent: backend/app -> parent: backend -> parent: project root
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    BACKEND_DIR: Path = BASE_DIR / "backend"
    DATA_DIR: Path = BASE_DIR / "data"
    DB_PATH: Path = DATA_DIR / "bugsentinel.sqlite3"
    ARTIFACTS_DIR: Path = DATA_DIR / "artifacts"
    DEMO_SITE_DIR: Path = BACKEND_DIR / "demo_site"

    # Server settings
    HOST: str = os.getenv("BUGSENTINEL_HOST", "127.0.0.1")
    PORT: int = int(os.getenv("BUGSENTINEL_PORT", "8000"))

    # Automation settings
    HEADLESS: bool = os.getenv("BUGSENTINEL_HEADLESS", "true").lower() in ("true", "1", "yes")
    DEFAULT_TIMEOUT_MS: int = int(os.getenv("BUGSENTINEL_DEFAULT_TIMEOUT_MS", "10000"))
    DEFAULT_TARGET_ID: str = "shopdemo"

    # CORS origins for future Phase 2 frontend
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    @property
    def demo_url(self) -> str:
        """Local URL where ShopDemo is mounted."""
        return f"http://{self.HOST}:{self.PORT}/demo/"

    def ensure_directories(self) -> None:
        """Ensure necessary data and artifact directories exist."""
        self.DATA_DIR.mkdir(parents=True, exist_ok=True)
        self.ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)


settings = Settings()
