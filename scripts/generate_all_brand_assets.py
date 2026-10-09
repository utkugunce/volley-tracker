import os
from PIL import Image, ImageDraw, ImageFilter

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_DIR = os.path.join(BASE_DIR, "public")
ICONS_DIR = os.path.join(PUBLIC_DIR, "icons")
os.makedirs(ICONS_DIR, exist_ok=True)

USER_DIR = r"C:\Users\UtkuGünçe-ZerenSporK\.gemini\antigravity\brain\cebdaef4-1b8d-4661-9ec2-f20b42918e3e\.user_uploaded"
IMG1_PATH = os.path.join(USER_DIR, "media_1791531627494_01a56f8f.jpg")
IMG2_PATH = os.path.join(USER_DIR, "media_1791531677556_348457d9.png")

print(f"Reading source images...")
im1 = Image.open(IMG1_PATH).convert("RGBA")
im2 = Image.open(IMG2_PATH).convert("RGBA")

# -------------------------------------------------------------
# 1. GENERATE APP ICONS & FAVICONS (FROM IMAGE 1)
# -------------------------------------------------------------
# Squircle box in Image 1 is x=[167, 857], y=[170, 860] (690x690)
squircle_crop = im1.crop((167, 170, 857, 860))
sw, sh = squircle_crop.size

# A) Squircle with smooth transparent rounded corners
mask = Image.new("L", (sw, sh), 0)
draw = ImageDraw.Draw(mask)
draw.rounded_rectangle([(0, 0), (sw, sh)], radius=150, fill=255)

squircle_alpha = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
squircle_alpha.paste(squircle_crop, (0, 0), mask=mask)

# Save icon-512.png
icon_512 = squircle_alpha.resize((512, 512), Image.Resampling.LANCZOS)
icon_512_path = os.path.join(ICONS_DIR, "icon-512.png")
icon_512.save(icon_512_path, "PNG", optimize=True)
print(f"Saved: {icon_512_path}")

# Save icon-192.png
icon_192 = squircle_alpha.resize((192, 192), Image.Resampling.LANCZOS)
icon_192_path = os.path.join(ICONS_DIR, "icon-192.png")
icon_192.save(icon_192_path, "PNG", optimize=True)
print(f"Saved: {icon_192_path}")

# Save apple-touch-icon (180x180)
apple_icon = squircle_crop.resize((180, 180), Image.Resampling.LANCZOS)
apple_icon_path = os.path.join(PUBLIC_DIR, "apple-touch-icon.png")
apple_icon.save(apple_icon_path, "PNG", optimize=True)
print(f"Saved: {apple_icon_path}")

# B) Maskable Icon (Full bleed solid navy with safe zone padding)
# PWA maskable safe zone is 80%, so emblem should occupy 80% or less of the canvas
maskable = Image.new("RGBA", (512, 512), (14, 31, 52, 255))
# Resize squircle content slightly to fit inside safe zone (approx 410x410)
scaled_content = squircle_crop.resize((410, 410), Image.Resampling.LANCZOS)
offset = ((512 - 410) // 2, (512 - 410) // 2)
maskable.paste(scaled_content, offset)
maskable_path = os.path.join(ICONS_DIR, "icon-maskable-512.png")
maskable.convert("RGB").save(maskable_path, "PNG", optimize=True)
print(f"Saved: {maskable_path}")

# C) Multi-Resolution Favicon (.ico)
favicon_sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
favicon_imgs = [squircle_alpha.resize(s, Image.Resampling.LANCZOS) for s in favicon_sizes]
favicon_path = os.path.join(PUBLIC_DIR, "favicon.ico")
favicon_imgs[0].save(
    favicon_path,
    format="ICO",
    sizes=favicon_sizes,
    append_images=favicon_imgs[1:]
)
print(f"Saved: {favicon_path}")

# -------------------------------------------------------------
# 2. GENERATE HORIZONTAL LOGOS & EMBLEM (FROM IMAGE 2)
# -------------------------------------------------------------
w2, h2 = im2.size

# A) Transparent Light-Theme Logo
im_light = Image.new("RGBA", (w2, h2), (0, 0, 0, 0))
pix_in = im2.load()
pix_light = im_light.load()

for y in range(h2):
    for x in range(w2):
        r, g, b, a = pix_in[x, y]
        avg = (r + g + b) / 3
        if avg > 248:
            pix_light[x, y] = (255, 255, 255, 0)
        elif avg > 235:
            alpha = int(255 * (1 - (avg - 235) / 13))
            pix_light[x, y] = (r, g, b, alpha)
        else:
            pix_light[x, y] = (r, g, b, 255)

bbox_light = im_light.getbbox()
logo_light = im_light.crop(bbox_light)
logo_light_path = os.path.join(PUBLIC_DIR, "logo-light.png")
logo_light.save(logo_light_path, "PNG", optimize=True)
print(f"Saved: {logo_light_path}")

# B) Transparent Dark-Theme Logo (White ALTYAPI, Teal VOLEYBOL, Slate Subtitle)
im_dark = Image.new("RGBA", (w2, h2), (0, 0, 0, 0))
pix_dark = im_dark.load()

for y in range(h2):
    for x in range(w2):
        r, g, b, a = pix_in[x, y]
        avg = (r + g + b) / 3
        if avg > 248:
            pix_dark[x, y] = (255, 255, 255, 0)
        elif avg > 235:
            alpha = int(255 * (1 - (avg - 235) / 13))
            pix_dark[x, y] = (r, g, b, alpha)
        else:
            # Check text area
            if x > 440 and r < 70 and g < 70 and b < 90:
                if y > 380:
                    pix_dark[x, y] = (203, 213, 225, 255) # slate-300
                else:
                    pix_dark[x, y] = (255, 255, 255, 255) # pure white
            else:
                pix_dark[x, y] = (r, g, b, 255)

bbox_dark = im_dark.getbbox()
logo_dark = im_dark.crop(bbox_dark)
logo_dark_path = os.path.join(PUBLIC_DIR, "logo-dark.png")
logo_dark.save(logo_dark_path, "PNG", optimize=True)
print(f"Saved: {logo_dark_path}")

# Standard logo.png points to the dark-mode one (matches site canvas)
logo_main_path = os.path.join(PUBLIC_DIR, "logo.png")
logo_dark.save(logo_main_path, "PNG", optimize=True)
print(f"Saved: {logo_main_path}")

# C) Standalone Transparent Emblem Mark
# Emblem bounding box is x=[73, 435], y=[116, 461]
emblem = im_dark.crop((73, 116, 435, 461))
# trim
emblem_box = emblem.getbbox()
emblem = emblem.crop(emblem_box)
emblem_path = os.path.join(PUBLIC_DIR, "logo-mark.png")
emblem.save(emblem_path, "PNG", optimize=True)
print(f"Saved: {emblem_path}")

# Also save high-res emblem in icons/
emblem_512 = emblem.resize((512, 512), Image.Resampling.LANCZOS)
emblem_512_path = os.path.join(ICONS_DIR, "logo-mark-512.png")
emblem_512.save(emblem_512_path, "PNG", optimize=True)
print(f"Saved: {emblem_512_path}")

# D) Create a crisp vector SVG wrapper for public/icon.svg
# Embed high quality PNG as data URI in icon.svg for 100% fidelity
import base64
with open(icon_512_path, "rb") as f:
    b64_icon = base64.b64encode(f.read()).decode("utf-8")

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <image href="data:image/png;base64,{b64_icon}" width="512" height="512"/>
</svg>
'''
with open(os.path.join(PUBLIC_DIR, "icon.svg"), "w", encoding="utf-8") as f:
    f.write(svg_content)
print(f"Saved: {os.path.join(PUBLIC_DIR, 'icon.svg')}")

with open(os.path.join(PUBLIC_DIR, "apple-icon.svg"), "w", encoding="utf-8") as f:
    f.write(svg_content)
print(f"Saved: {os.path.join(PUBLIC_DIR, 'apple-icon.svg')}")

# E) Also update Next.js App Router segment files in src/app/
APP_DIR = os.path.join(BASE_DIR, "src", "app")
if os.path.exists(APP_DIR):
    import shutil
    shutil.copyfile(favicon_path, os.path.join(APP_DIR, "favicon.ico"))
    shutil.copyfile(os.path.join(PUBLIC_DIR, "icon.svg"), os.path.join(APP_DIR, "icon.svg"))
    shutil.copyfile(os.path.join(PUBLIC_DIR, "apple-icon.svg"), os.path.join(APP_DIR, "apple-icon.svg"))
    print(f"Updated App Router icons in: {APP_DIR}")

print("All brand assets generated successfully!")
