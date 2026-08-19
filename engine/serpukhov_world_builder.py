"""
Tencent Hunyuan3D-WorldClaw: Serpukhov World Builder & Asset Synthesizer
Builds, validates, and exports the full 3D digital twin of Serpukhov based on the masterplan.
"""

import os
import json
from pathlib import Path
from layout_agent import WorldClawLayoutAgent

def build_serpukhov_world():
    agent = WorldClawLayoutAgent()
    prompt = (
        "Инфографика генерального плана: Завод крупноузловой сборки BYD (SKD) в Серпухове, "
        "электрохаб Витязь с 11 ультрабыстрыми ЭЗС 240 кВт, телемедицинский контроль, "
        "фабрика-кухня, агропромышленный комплекс на тепле ТЭЦ и научно-технологический кластер Кибердеревня."
    )

    world_spec = agent.plan_world_layout(prompt, city_name="Серпухов")

    # Сохранение в public/data/ для мгновенной загрузки веб-интерфейсом
    output_dir = Path(__file__).resolve().parent.parent / "public" / "data"
    output_dir.mkdir(parents=True, exist_ok=True)
    out_file = output_dir / "serpukhov_worldclaw.json"

    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(world_spec, f, indent=2, ensure_ascii=False)

    print(f"✅ [WorldClaw Builder] Serpukhov 3D World compiled successfully to: {out_file}")
    return world_spec

if __name__ == "__main__":
    build_serpukhov_world()
