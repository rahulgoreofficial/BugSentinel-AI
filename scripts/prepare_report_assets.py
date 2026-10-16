import shutil
from pathlib import Path

docs_assets = Path("docs/assets")
docs_assets.mkdir(parents=True, exist_ok=True)

# Defect evidence from data/artifacts
defect_img = Path("data/artifacts/run_0a7d49ac/invalid_email_is_rejected_attempt_1.png")
if defect_img.exists():
    shutil.copy2(defect_img, docs_assets / "defect_evidence.png")
    print("Copied defect_evidence.png")

# Screenshots from brain directory if present
brain_dir = Path(r"C:\Users\Rahul Gore\.gemini\antigravity-ide\brain\20e21f4e-3895-4050-b25a-5dc6de2fb41f")
if brain_dir.exists():
    for f in brain_dir.glob("operational_dashboard_*.png"):
        shutil.copy2(f, docs_assets / "dashboard.png")
        print("Copied dashboard.png")
        break
    for f in brain_dir.glob("landing_hero_*.png"):
        shutil.copy2(f, docs_assets / "landing_hero.png")
        print("Copied landing_hero.png")
        break
    for f in brain_dir.glob("drawer_console_logs_*.png"):
        shutil.copy2(f, docs_assets / "drawer_evidence.png")
        print("Copied drawer_evidence.png")
        break

print("Assets in docs/assets:", [p.name for p in docs_assets.iterdir()])
