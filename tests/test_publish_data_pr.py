import json
import os
import subprocess
import sys
from pathlib import Path
import pytest
from scripts.publish_data_pr import publish


def git(repo, *args):
    return subprocess.run(['git', '-C', str(repo), *args], check=True, text=True, capture_output=True).stdout.strip()


@pytest.fixture
def repository(tmp_path, monkeypatch):
    remote = tmp_path / 'origin.git'
    repo = tmp_path / 'work'
    subprocess.run(['git', 'init', '--bare', str(remote)], check=True, capture_output=True)
    subprocess.run(['git', 'init', '-b', 'main', str(repo)], check=True, capture_output=True)
    (repo / 'data').mkdir()
    (repo / 'data/cities.json').write_text('{"value":1}')
    git(repo, 'add', '.')
    git(repo, '-c', 'user.name=test', '-c', 'user.email=test@example.com', 'commit', '-m', 'base')
    git(repo, 'remote', 'add', 'origin', str(remote))
    git(repo, 'push', '-u', 'origin', 'main')
    tools = tmp_path / 'bin'
    tools.mkdir()
    fake_gh = tools / 'gh'
    fake_gh.write_text('''#!/usr/bin/env python3
import json,os,sys
with open(os.environ['FAKE_GH_LOG'],'a') as f: f.write(json.dumps(sys.argv[1:])+'\\n')
if sys.argv[1:3] == ['pr','create']: print('https://github.com/acme/test/pull/1')
elif sys.argv[1:3] == ['pr','list']: print(os.environ.get('FAKE_GH_PR_LIST', '[]'))
''')
    fake_gh.chmod(0o755)
    fake_gh_cmd = tools / 'gh.cmd'
    fake_gh_cmd.write_text(f'@"{sys.executable}" "%~dp0gh" %*\r\n')
    log = tmp_path / 'gh.jsonl'
    monkeypatch.setenv('PATH', str(tools) + os.pathsep + os.environ['PATH'])
    monkeypatch.setenv('FAKE_GH_LOG', str(log))
    monkeypatch.setenv('GITHUB_REPOSITORY', 'acme/test')
    monkeypatch.setenv('GITHUB_RUN_ID', '12345')
    monkeypatch.setenv('GITHUB_RUN_ATTEMPT', '2')
    monkeypatch.chdir(repo)
    return repo, remote, log


def test_data_pr_never_updates_main_and_dispatches_exact_branch(repository):
    repo, remote, log = repository
    before = git(remote, 'rev-parse', 'refs/heads/main')
    (repo / 'data/cities.json').write_text('{"value":2}')
    branch = publish()
    assert branch == 'automation/tvf-data-12345-2'
    assert git(remote, 'rev-parse', 'refs/heads/main') == before
    assert git(remote, 'show', f'refs/heads/{branch}:data/cities.json') == '{"value":2}'
    calls = [json.loads(line) for line in log.read_text().splitlines()]
    assert calls[0][:2] == ['pr', 'create']
    assert calls[0][calls[0].index('--base') + 1] == 'main'
    assert calls[1] == ['workflow', 'run', 'ci.yml', '--repo', 'acme/test', '--ref', branch]


def test_no_changes_produces_no_pr(repository):
    _, _, log = repository
    assert publish() is None
    assert not log.exists()


def test_unrelated_source_changes_are_rejected_before_publish(repository):
    repo, remote, log = repository
    before = git(remote, 'rev-parse', 'refs/heads/main')
    (repo / 'app.py').write_text('unexpected')
    with pytest.raises(RuntimeError, match='non-data'):
        publish()
    assert git(remote, 'rev-parse', 'refs/heads/main') == before
    assert not log.exists()


def test_generated_city_allowlist_can_accompany_data(repository):
    repo, _, _ = repository
    (repo / 'src/utils').mkdir(parents=True)
    (repo / 'src/utils/citySlugs.ts').write_text('export const CITY_SLUGS = [];')
    assert publish() == 'automation/tvf-data-12345-2'


def test_closes_superseded_automation_prs(repository, monkeypatch):
    repo, _, log = repository
    monkeypatch.setenv(
        'FAKE_GH_PR_LIST',
        json.dumps([
            {'number': 70, 'headRefName': 'automation/tvf-data-11111-1'},
            {'number': 71, 'headRefName': 'feat/other'},
            {'number': 72, 'headRefName': 'automation/tvf-data-12345-2'},
        ]),
    )
    (repo / 'data/cities.json').write_text('{"value":3}')
    branch = publish()
    assert branch == 'automation/tvf-data-12345-2'
    calls = [json.loads(line) for line in log.read_text().splitlines()]
    assert calls[0][:2] == ['pr', 'create']
    assert calls[1] == ['workflow', 'run', 'ci.yml', '--repo', 'acme/test', '--ref', branch]
    assert calls[2][:2] == ['pr', 'list']
    close_calls = [c for c in calls if c[:2] == ['pr', 'close']]
    assert len(close_calls) == 1
    assert close_calls[0][:3] == ['pr', 'close', '70']
    assert '--delete-branch' in close_calls[0]
