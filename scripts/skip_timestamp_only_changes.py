#!/usr/bin/env python3
"""
Yalnızca zaman damgası değişen veri dosyalarını geri alır (commit gürültüsünü önler).

Neden?
  `scrape-sync.yml` her çalışmada (30 dk) tüm `data/**/*.json` dosyalarını yeniden
  yazar; içerik aynı olsa bile `updated_at`, `volleybox_sync_updated_at` ve
  `guncellenme_zamani` alanları değiştiği için git her seferinde ~30 dosyada fark
  görür ve büyük JSON dosyalarının yeni bir sürümünü commit'ler.

Ne yapar?
  `data/` altındaki, çalışma ağacında değişmiş (modified) `.json` dosyalarını
  HEAD sürümü ile karşılaştırır. Zaman damgası alanları hariç içerik birebir aynıysa
  dosyayı HEAD haline döndürür (`git checkout HEAD -- <dosya>`), böylece commit'e girmez.

  - İçerik gerçekten değiştiyse dosyaya DOKUNMAZ (yeni zaman damgasıyla commit'lenir).
  - "Heartbeat" dosyaları (`HEARTBEAT_FILES`: `check_data_freshness.py` ile 24 saat
    sınırı denetlenen `cities.json` ve `kadinlar_2_lig.json`) için HEAD'deki zaman
    damgası heartbeat süresinden (varsayılan 12 saat) eskiyse dosyaya DOKUNMAZ;
    böylece içerik değişmese de bu dosyalar en geç 12 saatte bir tazelenir ve
    CI'daki freshness kontrolü hiçbir zaman bayat veriyle karşılaşmaz.
  - Yeni (untracked) dosyalara, silinmiş dosyalara ve .json olmayanlara dokunmaz.

Kullanım:
  python scripts/skip_timestamp_only_changes.py [--heartbeat-hours 12] [--dry-run]
"""
import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable, List, Optional

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from scripts.data_freshness import parse_timestamp  # noqa: E402

# Her çalışmada değişen, içerik taşımayan alanlar (herhangi bir derinlikte).
VOLATILE_KEYS = frozenset({"updated_at", "volleybox_sync_updated_at", "guncellenme_zamani"})
DEFAULT_HEARTBEAT_HOURS = 12.0
# `scripts/check_data_freshness.py` (24 saat sınırı) bu dosyaları denetler; yalnızca bunlar heartbeat ister.
HEARTBEAT_FILES = frozenset({"data/cities.json", "data/kadinlar_2_lig.json"})


def strip_volatile(obj: Any) -> Any:
    """Zaman damgası alanlarını (her derinlikte) çıkarılmış kopya döndürür."""
    if isinstance(obj, dict):
        return {k: strip_volatile(v) for k, v in obj.items() if k not in VOLATILE_KEYS}
    if isinstance(obj, list):
        return [strip_volatile(v) for v in obj]
    return obj


def newest_timestamp(payload: Any) -> Optional[datetime]:
    """Üst düzey ve `metadata` altındaki zaman damgası alanlarının en yenisi."""
    if not isinstance(payload, dict):
        return None
    holders = [payload]
    if isinstance(payload.get("metadata"), dict):
        holders.append(payload["metadata"])
    stamps: List[datetime] = []
    for holder in holders:
        for key in VOLATILE_KEYS:
            parsed = parse_timestamp(holder.get(key))
            if parsed is not None:
                stamps.append(parsed)
    return max(stamps) if stamps else None


def should_restore(
    old_payload: Any,
    new_payload: Any,
    heartbeat_hours: float = DEFAULT_HEARTBEAT_HOURS,
    now: Optional[datetime] = None,
    needs_heartbeat: bool = True,
) -> bool:
    """True: yeni sürüm yalnızca zaman damgası farkı taşıyor (ve gerekiyorsa eski sürüm yeterince taze)."""
    if strip_volatile(old_payload) != strip_volatile(new_payload):
        return False
    if not needs_heartbeat:
        return True
    old_ts = newest_timestamp(old_payload)
    if old_ts is None:
        return False  # Zaman damgası okunamıyorsa güvenli tarafta kal: yeni sürümü koru
    now = now or datetime.now(timezone.utc)
    age_hours = (now - old_ts).total_seconds() / 3600
    return age_hours < heartbeat_hours


def _git(args: Iterable[str], cwd: Path) -> subprocess.CompletedProcess:
    return subprocess.run(["git", *args], cwd=str(cwd), capture_output=True)


def modified_json_files(repo: Path, data_dir: str = "data") -> List[str]:
    res = _git(["diff", "--name-only", "--diff-filter=M", "-z", "HEAD", "--", data_dir], repo)
    if res.returncode != 0:
        raise RuntimeError(res.stderr.decode("utf-8", "replace"))
    names = [n for n in res.stdout.decode("utf-8").split("\0") if n]
    return [n for n in names if n.endswith(".json")]


def process(repo: Path, heartbeat_hours: float, dry_run: bool = False, data_dir: str = "data") -> dict:
    restored: List[str] = []
    kept_changed: List[str] = []
    kept_heartbeat: List[str] = []
    errors: List[str] = []

    for rel in modified_json_files(repo, data_dir):
        try:
            head = _git(["show", f"HEAD:{rel}"], repo)
            if head.returncode != 0:
                continue
            old_payload = json.loads(head.stdout.decode("utf-8"))
            new_payload = json.loads((repo / rel).read_text(encoding="utf-8"))
        except Exception as exc:  # bozuk/okunamayan JSON: dokunma
            errors.append(f"{rel}: {exc}")
            continue

        if strip_volatile(old_payload) != strip_volatile(new_payload):
            kept_changed.append(rel)
        elif should_restore(old_payload, new_payload, heartbeat_hours, needs_heartbeat=rel in HEARTBEAT_FILES):
            if not dry_run:
                res = _git(["checkout", "HEAD", "--", rel], repo)
                if res.returncode != 0:
                    errors.append(f"{rel}: {res.stderr.decode('utf-8', 'replace')}")
                    continue
            restored.append(rel)
        else:
            kept_heartbeat.append(rel)

    return {
        "restored": restored,
        "kept_changed": kept_changed,
        "kept_heartbeat": kept_heartbeat,
        "errors": errors,
    }


def main(argv: Optional[List[str]] = None) -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description="Yalnızca zaman damgası değişen veri dosyalarını geri al")
    parser.add_argument("--heartbeat-hours", type=float, default=DEFAULT_HEARTBEAT_HOURS,
                        help="cities.json / kadinlar_2_lig.json için HEAD'deki zaman damgası bu süreden eskiyse yenisi yine de commit'lenir (varsayılan: 12)")
    parser.add_argument("--dry-run", action="store_true", help="Dosyalara dokunmadan sadece raporla")
    args = parser.parse_args(argv)

    result = process(BASE_DIR, args.heartbeat_hours, dry_run=args.dry_run)
    prefix = "(kuru çalıştırma) " if args.dry_run else ""
    print(f"{prefix}İçeriği değişen, commit'lenecek : {len(result['kept_changed'])}")
    for f in result["kept_changed"]:
        print(f"   ~ {f}")
    print(f"{prefix}Yalnızca zaman damgası, geri alındı: {len(result['restored'])}")
    print(f"{prefix}Heartbeat nedeniyle korundu       : {len(result['kept_heartbeat'])}")
    for f in result["kept_heartbeat"]:
        print(f"   ♥ {f}")
    for e in result["errors"]:
        print(f"⚠️ {e}")
    # Bu adım yalnızca optimizasyondur; hata durumunda sync'i başarısız etme (dosyalar olduğu gibi commit'lenir).
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
