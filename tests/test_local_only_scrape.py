"""Local-only refresh must never run remote integration mutations, even with credentials."""
import json
import subprocess
import sys
from types import SimpleNamespace
from scripts import scrape_all_provinces as scraper

def test_local_only_skips_integrations_and_preserves_unselected_cities(tmp_path, monkeypatch):
    data = tmp_path / 'data'
    cities = data / 'cities'
    cities.mkdir(parents=True)
    (cities / 'ankara.json').write_text(json.dumps({'updated_at':'2020-01-01', 'matches':[]}))
    index = data / 'cities.json'
    unchanged = {'ilid':'35','slug':'izmir','matches_count':4,'standings_count':1}
    index.write_text(json.dumps({'updated_at':'2020-01-01','cities':[unchanged]}))
    monkeypatch.setattr(scraper, 'BASE_DIR', tmp_path)
    monkeypatch.setattr(scraper, 'CITIES_DIR', cities)
    monkeypatch.setattr(scraper, 'CITIES_INDEX_JSON', index)
    monkeypatch.setenv('SUPABASE_SERVICE_ROLE_KEY', 'test-present-not-a-secret')
    monkeypatch.setattr(scraper.httpx, 'get', lambda *a, **kw: SimpleNamespace(json=lambda:[{'ilid':'6','url':'https://ankara.voleyboliltemsilciligi.com'}]))
    monkeypatch.setattr(scraper, 'scrape_single_city', lambda c: {'ilid':'6','name':'Ankara','slug':'ankara','status':'Aktif','matches_count':1,'standings_count':0,'data_file':None})
    calls = []
    monkeypatch.setitem(sys.modules, 'scripts.sync_volleybox_matches', SimpleNamespace(main=lambda: calls.append('volleybox')))
    monkeypatch.setattr(subprocess, 'run', lambda *a, **kw: calls.append('subprocess'))
    scraper.main(['--local-only','--stale-only'])
    assert calls == []
    updated = json.loads(index.read_text())
    assert unchanged in updated['cities']
    assert updated['total_matches'] == 5

def test_failed_city_reports_cached_data_without_claiming_success(tmp_path, monkeypatch):
    cities = tmp_path / 'cities'
    cities.mkdir()
    original = {'updated_at':'2020-01-01','matches':[{'id':'x','date':'2026-10-01'}],'standings':{}}
    file = cities / 'ankara.json'
    file.write_text(json.dumps(original))
    monkeypatch.setattr(scraper, 'CITIES_DIR', cities)
    monkeypatch.setattr(scraper.httpx, 'Client', lambda **kw: SimpleNamespace(get=lambda url: SimpleNamespace(status_code=503)))
    result = scraper.scrape_single_city({'ilid':'6','url':'https://ankara.voleyboliltemsilciligi.com'})
    assert result['fetch_status'] == 'cached'
    assert result['fetch_error'] == 'HTTP 503'
    assert 'Önbellek' in result['status']
    assert json.loads(file.read_text()) == original

def test_category_http_error_keeps_previous_complete_snapshot(tmp_path, monkeypatch):
    cities = tmp_path / 'cities'
    cities.mkdir()
    original = {'updated_at':'2020-01-01','matches':[{'id':'x','date':'2026-10-01'}],'standings':{}}
    file = cities / 'ankara.json'
    file.write_text(json.dumps(original))
    monkeypatch.setattr(scraper, 'CITIES_DIR', cities)
    request = scraper.httpx.Request('POST', 'https://ankara.voleyboliltemsilciligi.com/PuanDurumu')
    responses = iter([scraper.httpx.Response(200, text='', request=request), scraper.httpx.Response(503, request=request)])
    client = SimpleNamespace(get=lambda url: scraper.httpx.Response(200, text='', request=request), post=lambda *a, **kw: next(responses))
    monkeypatch.setattr(scraper.httpx, 'Client', lambda **kw: client)
    result = scraper.scrape_single_city({'ilid':'6','url':'https://ankara.voleyboliltemsilciligi.com'})
    assert result['fetch_status'] == 'cached'
    assert 'Kategori okunamadı' in result['fetch_error']
    assert json.loads(file.read_text()) == original
