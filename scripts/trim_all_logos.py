#!/usr/bin/env python3
"""
Tüm yerel takım logolarının (public/logos/*.png) şeffaf kenar boşluklarını
kırpan (autocrop/trim) ve retina ekranlara uygun optimize eden script.
"""

import os
import sys
from pathlib import Path
from PIL import Image


def trim_image(im: Image.Image) -> Image.Image:
    if im.mode not in ("RGBA", "LA"):
        im = im.convert("RGBA")

    alpha = im.split()[-1]
    # 10'dan küçük alpha değerlerini gürültü kabul edip yok say
    bin_alpha = alpha.point(lambda p: 255 if p > 10 else 0)
    bbox = bin_alpha.getbbox()
    if not bbox:
        return im

    w, h = im.size
    bw = bbox[2] - bbox[0]
    bh = bbox[3] - bbox[1]

    # %2 emniyet boşluğu bırak (kenar çizgileri kesilmesin)
    pad_x = max(1, int(bw * 0.02))
    pad_y = max(1, int(bh * 0.02))

    x0 = max(0, bbox[0] - pad_x)
    y0 = max(0, bbox[1] - pad_y)
    x1 = min(w, bbox[2] + pad_x)
    y1 = min(h, bbox[3] + pad_y)

    cropped = im.crop((x0, y0, x1, y1))

    # Retina ekranlar için maksimum kenarı 160px ile sınırla
    max_dim = max(cropped.size)
    if max_dim > 160:
        scale = 160.0 / max_dim
        new_size = (max(1, int(cropped.size[0] * scale)), max(1, int(cropped.size[1] * scale)))
        cropped = cropped.resize(new_size, Image.Resampling.LANCZOS)

    return cropped


def main():
    repo_root = Path(__file__).resolve().parent.parent
    logos_dir = repo_root / "public" / "logos"

    if not logos_dir.exists():
        print(f"HATA: {logos_dir} dizini bulunamadı!", file=sys.stderr)
        sys.exit(1)

    png_files = sorted(list(logos_dir.glob("*.png")))
    print(f"İncelenecek logo sayısı: {len(png_files)}")

    processed_count = 0
    trimmed_count = 0

    for file_path in png_files:
        try:
            with Image.open(file_path) as im:
                orig_size = im.size
                orig_bbox = im.getbbox() if im.mode in ("RGBA", "LA") else None

                trimmed = trim_image(im)

                # Değişiklik olduysa kaydet
                if orig_bbox and (orig_size != trimmed.size or orig_bbox != (0, 0, orig_size[0], orig_size[1])):
                    trimmed.save(file_path, format="PNG", optimize=True)
                    trimmed_count += 1
                elif max(orig_size) > 160:
                    trimmed.save(file_path, format="PNG", optimize=True)
                    trimmed_count += 1

            processed_count += 1
            if processed_count % 100 == 0:
                print(f"  [{processed_count}/{len(png_files)}] İşlendi...")

        except Exception as e:
            print(f"  [UYARI] {file_path.name} işlenirken hata: {e}")

    print(f"\nTamamlandı!")
    print(f"Toplam dosya: {processed_count}")
    print(f"Kenar boşluğu kırpılan / optimize edilen logo sayısı: {trimmed_count}")


if __name__ == "__main__":
    main()
