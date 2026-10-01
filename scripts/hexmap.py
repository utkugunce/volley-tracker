import re
import os

CANVAS = [
    "#050810", "#070b14", "#070d19", "#080c14", "#080f24", "#090d16",
    "#0a1226", "#0b1220", "#121212", "#12141a", "#1e1b4b", "#0f172a", "#020617"
]
MUTED = [
    "#0b1325", "#0c1630", "#0d1424", "#0d1628", "#0d172a", "#0e1627", "#181a20"
]
PANEL = [
    "#1e222d", "#1e293b", "#121f3d", "#162342", "#172547", "#18233c",
    "#1b2a4d", "#1b2b52", "#242936", "#252a38"
]
LINE = [
    "#2a2e3d", "#334155", "#374151", "#475569"
]

M = {}
for h in CANVAS: M[h] = ("canvas", "canvas")
for h in MUTED:  M[h] = ("surface-muted", "surface-muted")
for h in PANEL:  M[h] = ("panel", "panel")
for h in LINE:   M[h] = ("line", "line")

M.update({
    "#94a3b8": ("slate-400", "ink-2"),
    "#64748b": ("slate-600", "ink-3"),
    "#f1f5f9": ("ink", "ink"),
    "#f8fafc": ("ink", "ink"),
    "#cbd5e1": ("slate-200", "slate-200"),
    "#e2e8f0": ("slate-200", "slate-200"),
    "#ffffff": ("white", "white"),
    "#3b82f6": ("selected", "selected"),
    "#38bdf8": ("blue-400", "blue-400"),
    "#ef4444": ("live", "live"),
    "#dc2626": ("live", "live"),
    "#f59e0b": ("warn", "warn"),
    "#fbbf24": ("warn", "warn"),
})

rx = re.compile(
    r"\b((?:[a-z0-9\-\[\]=&>_]+:)*)(bg|text|border|border-[trblxy]|ring|from|via|to|divide|fill|stroke|outline|decoration|placeholder|accent|caret)-\[(#[0-9a-fA-F]{6})\](/\d+)?"
)

def sub(m):
    pre, p, h, op = m.group(1), m.group(2), m.group(3).lower(), m.group(4) or ""
    if h not in M:
        return m.group(0)
    tok = M[h][1] if p in ("text", "placeholder") else M[h][0]
    return f"{pre}{p}-{tok}{op}"

changed_files = 0
for root, _, fs in os.walk("src"):
    if "__tests__" in root:
        continue
    for f in fs:
        if f.endswith((".tsx", ".ts")):
            if f in ("groupStatus.ts", "groupStatus.test.ts"):
                continue
            p = os.path.join(root, f)
            with open(p, "r", encoding="utf-8") as file:
                s = file.read()
            n = rx.sub(sub, s)
            if n != s:
                with open(p, "w", encoding="utf-8") as file:
                    file.write(n)
                changed_files += 1
                print(f"Updated: {p}")

print(f"Total updated files: {changed_files}")
