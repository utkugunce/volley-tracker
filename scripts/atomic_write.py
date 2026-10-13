"""
scripts/atomic_write.py

Atomik JSON Yazımı ve Bütünlük Koruması (Görev 7).

Veriyi doğrudan hedef dosyaya yazmak yerine:
1. .tmp uzantılı geçici dosyaya yazar
2. Dosyanın geçerli JSON olduğunu (json.load) ve boş olmadığını doğrular
3. min_keys parametresi verilmişse kök anahtarları teyit eder
4. os.replace() ile hedef dosyayı atomik olarak günceller.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any


def atomic_write_json(
    target_path: str | Path,
    data: Any,
    indent: int | None = 2,
    ensure_ascii: bool = False,
    min_keys: list[str] | None = None,
) -> None:
    target = Path(target_path).resolve()
    target.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = target.with_suffix(f"{target.suffix}.tmp")

    try:
        with open(tmp_path, "w", encoding="utf-8") as f:
            if indent is not None:
                json.dump(data, f, indent=indent, ensure_ascii=ensure_ascii)
            else:
                json.dump(data, f, separators=(",", ":"), ensure_ascii=ensure_ascii)

        # Doğrulama: Geçerli JSON mu?
        with open(tmp_path, "r", encoding="utf-8") as f:
            verified = json.load(f)

        if min_keys and isinstance(verified, dict):
            for k in min_keys:
                if k not in verified:
                    raise ValueError(f"Doğrulama hatası: '{k}' anahtarı eksik ({target.name})")

        # Atomik yer değiştirme
        os.replace(tmp_path, target)
    except Exception as err:
        if tmp_path.exists():
            try:
                tmp_path.unlink()
            except OSError:
                pass
        raise RuntimeError(f"Atomik yazma başarısız ({target}): {err}") from err
