# 02c — Araçlar: sabit-hex → token dönüştürücü ve WCAG kontrast (Ek C)

> `02-kabuk-appshell-header-nav-pwa.md` aşamasının ek dosyası (özgün rapor Ek C.1 + C.2, birebir). Python 3 gerekir. Betik repo kökünden çalıştırılır; `src/**/*.ts(x)` içinde (`__tests__` hariç) sabit-hex Tailwind sınıflarını (`bg-[#1E222D]` vb.) token sınıflarına çevirir. Satır içi hex'lere (SVG, canvas, `groupStatus.ts`) dokunmaz; çalıştırdıktan sonra `git diff --stat src/utils/groupStatus.ts` boş olmalı.

Kullanım:
```bash
# repo kökünde: kodu hexmap.py olarak kaydet
python3 hexmap.py && git diff --stat    # ~36–39 dosya beklenir
```
Sonra 02–08'deki **elle** anlam düzeltmelerini uygula (betik bağlama kördür: ör. Kadınlar 2. Lig'de `text-primary → text-ink-2` türü dönüşümleri görsel gözden geçirme ister).

## C.1 Sabit-hex → token dönüştürücü (Python 3; repo kökünde çalıştır; kaynak: `/workspace/volley-theme/hexmap.py`)
```python
import re, os
CANVAS=["#050810","#070b14","#070d19","#080c14","#080f24","#090d16","#0a1226","#0b1220","#121212","#12141a","#1e1b4b","#0f172a","#020617"]
MUTED=["#0b1325","#0c1630","#0d1424","#0d1628","#0d172a","#0e1627","#181a20"]
PANEL=["#1e222d","#1e293b","#121f3d","#162342","#172547","#18233c","#1b2a4d","#1b2b52","#242936","#252a38"]
LINE=["#2a2e3d","#334155","#374151","#475569"]
M={}
for h in CANVAS: M[h]=("canvas","canvas")
for h in MUTED:  M[h]=("surface-muted","surface-muted")
for h in PANEL:  M[h]=("panel","panel")
for h in LINE:   M[h]=("line","line")
M.update({"#94a3b8":("slate-400","ink-2"),"#64748b":("slate-600","ink-3"),"#f1f5f9":("ink","ink"),"#f8fafc":("ink","ink"),
 "#cbd5e1":("slate-200","slate-200"),"#e2e8f0":("slate-200","slate-200"),"#ffffff":("white","white"),
 "#3b82f6":("selected","selected"),"#38bdf8":("blue-400","blue-400"),"#ef4444":("live","live"),"#dc2626":("live","live"),
 "#f59e0b":("warn","warn"),"#fbbf24":("warn","warn")})
rx=re.compile(r"\b((?:[a-z0-9\-\[\]=&>_]+:)*)(bg|text|border|border-[trblxy]|ring|from|via|to|divide|fill|stroke|outline|decoration|placeholder|accent|caret)-\[(#[0-9a-fA-F]{6})\](/\d+)?")
def sub(m):
    pre,p,h,op=m.group(1),m.group(2),m.group(3).lower(),m.group(4) or ""
    if h not in M: return m.group(0)
    tok=M[h][1] if p in ("text","placeholder") else M[h][0]
    return f"{pre}{p}-{tok}{op}"
for root,_,fs in os.walk("src"):
    if "__tests__" in root: continue
    for f in fs:
        if f.endswith((".tsx",".ts")):
            p=os.path.join(root,f); s=open(p).read(); n=rx.sub(sub,s)
            if n!=s: open(p,"w").write(n)
```
Sonra `git diff --stat` (~36–39 dosya beklenir) ve §11'deki **elle** düzeltmeler. Betik `text-[#94A3B8] → text-ink-2`, `bg-[#1E222D] → bg-panel` vb. dönüşümleri yapar; `groupStatus.ts` içindeki satır içi hex'lere dokunmaz.

## C.2 WCAG kontrast
```python
def lum(h):
    h=h.lstrip('#'); r,g,b=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    f=lambda c: c/12.92 if c<=0.03928 else ((c+0.055)/1.055)**2.4
    return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)
def cr(a,b):
    la,lb=sorted((lum(a),lum(b)),reverse=True); return (la+0.05)/(lb+0.05)
print(round(cr('#2DD4C0','#07131F'),2))   # 10.06
print(round(cr('#032320','#2DD4C0'),2))   # 8.92
print(round(cr('#FFFFFF','#2A63BD'),2))   # 5.80
```
Kontrol çiftleri: `ink/canvas` 16.99, `ink-2/surface` 8.97, `ink-3/surface` 6.60, `primary/surface` 8.87, `live/surface` 6.13, `done/surface` 10.46, `selected-text/surface` 7.76, `warn/surface` 10.27, `rank-mid/surface` 7.18, `orchid/surface` 7.14, `form-loss/surface` 7.61; dolgu üstü: `primary-fg/primary` 8.92, `live-fg/live` 6.77, `done-fg/done` 9.89, `#2B1D00/warn` 10.23, `white/selected-strong` 5.80, `#2A0B3A/orchid` 7.53, `white/#9333B8` 6.17, `white/#C42D49` 5.50.


---
Ana aşama dosyasına dön: `02-kabuk-appshell-header-nav-pwa.md`
