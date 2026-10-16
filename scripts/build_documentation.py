"""
BugSentinel AI - PDF Documentation Generator
Renders docs/source/BugSentinel_AI_Project_Report.html into a publication-grade
PDF using Playwright Chromium with embedded base64 assets and headers/footers.
"""

from __future__ import annotations

import base64
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT_DIR = Path(__file__).resolve().parent.parent
DOCS_DIR = ROOT_DIR / "docs"
SOURCE_DIR = DOCS_DIR / "source"
ASSETS_DIR = DOCS_DIR / "assets"
HTML_PATH = SOURCE_DIR / "BugSentinel_AI_Project_Report.html"
PDF_PATH = DOCS_DIR / "BugSentinel_AI_Project_Report.pdf"


def get_base64_data_uri(file_path: Path) -> str:
    """Read an image file and return its base64 data URI."""
    if not file_path.exists():
        return ""
    suffix = file_path.suffix.lower().replace(".", "")
    mime = "image/png" if suffix == "png" else "image/jpeg"
    with open(file_path, "rb") as f:
        encoded = base64.b64encode(f.read()).decode("utf-8")
    return f"data:{mime};base64,{encoded}"


def main() -> None:
    print(f"Reading HTML source from {HTML_PATH}...")
    with open(HTML_PATH, "r", encoding="utf-8") as f:
        html_content = f.read()

    # Embed assets as base64 to ensure self-contained rendering
    print("Embedding base64 image assets...")
    img_dashboard = get_base64_data_uri(ASSETS_DIR / "dashboard.png")
    img_defect = get_base64_data_uri(ASSETS_DIR / "defect_evidence.png")

    if img_dashboard:
        html_content = html_content.replace("../assets/dashboard.png", img_dashboard)
    if img_defect:
        html_content = html_content.replace("../assets/defect_evidence.png", img_defect)

    temp_html_path = SOURCE_DIR / "_temp_render.html"
    with open(temp_html_path, "w", encoding="utf-8") as f:
        f.write(html_content)

    print("Launching Playwright Chromium for PDF generation...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f"file:///{temp_html_path.resolve().as_posix()}", wait_until="networkidle")

        header_template = """
        <div style="font-size: 7pt; font-family: 'Inter', -apple-system, sans-serif; color: #94a3b8; width: 100%; padding: 0 16mm; display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px;">
          <span>BugSentinel AI — Comprehensive Project Report & Technical Architecture</span>
          <span>v0.1.0</span>
        </div>
        """

        footer_template = """
        <div style="font-size: 7pt; font-family: 'Inter', -apple-system, sans-serif; color: #94a3b8; width: 100%; padding: 0 16mm; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 3px;">
          <span>https://github.com/rahulgoreofficial/BugSentinel-AI</span>
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
        """

        print(f"Rendering PDF to {PDF_PATH}...")
        page.pdf(
            path=str(PDF_PATH),
            format="A4",
            print_background=True,
            display_header_footer=True,
            header_template=header_template,
            footer_template=footer_template,
            margin={
                "top": "18mm",
                "bottom": "18mm",
                "left": "15mm",
                "right": "15mm",
            },
        )
        browser.close()

    if temp_html_path.exists():
        temp_html_path.unlink()

    pdf_size = os.path.getsize(PDF_PATH)
    print("=" * 70)
    print(f"SUCCESS: PDF Report Generated: {PDF_PATH}")
    print(f"File Size: {pdf_size:,} bytes ({pdf_size / (1024*1024):.2f} MB)")
    print("=" * 70)


if __name__ == "__main__":
    main()
