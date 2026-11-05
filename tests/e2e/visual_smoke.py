"""Run explicitly after starting the production server; never scrapes or mutates remote data."""
import os
import re
from pathlib import Path
import pytest
from playwright.sync_api import sync_playwright

BASE = os.environ.get("E2E_BASE_URL", "http://127.0.0.1:3000")
ARTIFACTS = Path(os.environ.get("E2E_ARTIFACTS", "/tmp/volley-e2e"))

@pytest.fixture(scope="module")
def browser():
    with sync_playwright() as p:
        executable = os.environ.get("CHROMIUM_PATH")
        b = p.chromium.launch(executable_path=executable, args=["--no-sandbox"])
        yield b
        b.close()

@pytest.mark.parametrize("width,height", [(390, 844), (1440, 1000), (320, 740)])
@pytest.mark.parametrize("theme", ["light", "dark"])
def test_pages_and_match_keyboard(browser, width, height, theme):
    page = browser.new_page(viewport={"width": width, "height": height}, color_scheme=theme, has_touch=width < 1024, is_mobile=width < 1024)
    failures = []
    page.on("pageerror", lambda error: failures.append(str(error)))
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    try:
        for path in ["/", "/fikstur/afyon", "/puan-durumu/afyon"]:
            response = page.goto(BASE + path)
            assert response.status == 200
            page.locator("main").wait_for()
            page.wait_for_timeout(1200)  # hydration and view transitions
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), path
            page.screenshot(path=str(ARTIFACTS / f"{width}-{theme}-{path.replace('/', '_') or 'home'}.png"), full_page=True)
            if path == "/":
                assert page.get_by_role("heading", name=re.compile("Günün Maç Programı & Skorlar", re.I)).count() == 1
                row = page.locator('[role="button"][aria-label*=" – "]').first
                if row.count():
                    row.focus()
                    row.press("Enter")
                    if width < 1024:
                        dialog = page.get_by_role("dialog", name="Maç Detayı")
                        dialog.wait_for(state="visible")
                        assert dialog.evaluate("el => el.contains(document.activeElement)")
                        page.keyboard.press("Escape")
                        dialog.wait_for(state="hidden")
            if path == "/puan-durumu/afyon":
                assert page.get_by_role("table").count() > 0
        contrast = page.evaluate(r"""() => {
          const rgb = value => value.match(/[\d.]+/g).slice(0, 3).map(Number);
          const luminance = channels => channels.map(c => { const s=c/255; return s<=0.04045 ? s/12.92 : ((s+0.055)/1.055)**2.4; }).reduce((v,c,i) => v+c*[0.2126,0.7152,0.0722][i],0);
          const probe = document.createElement('span'); document.body.append(probe);
          const results = [];
          for (const ink of ['--ink', '--ink-2', '--ink-3']) for (const surface of ['--canvas','--surface','--surface-raised']) {
            probe.style.color=`var(${ink})`; probe.style.backgroundColor=`var(${surface})`;
            const styles=getComputedStyle(probe);
            const a=luminance(rgb(styles.color)), b=luminance(rgb(styles.backgroundColor));
            results.push({ink,surface,ratio:(Math.max(a,b)+0.05)/(Math.min(a,b)+0.05)});
          }
          probe.remove(); return results;
        }""")
        assert all(item['ratio'] >= 4.5 for item in contrast), contrast
        page.evaluate("document.body.style.zoom = '2'")
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        page.screenshot(path=str(ARTIFACTS / f"{width}-{theme}-zoom.png"))
        assert not failures, failures
    finally:
        page.close()
