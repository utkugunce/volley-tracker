"""Publish collected data to a new branch; never write directly to main.

GITHUB_TOKEN-created PR events do not start other workflows, so dispatch CI
explicitly on the exact data branch. Requires Actions' PR creation permission.
"""
import os
import re
import subprocess
import tempfile
from pathlib import Path


def run(*args):
    return subprocess.run(args, check=True, text=True, capture_output=True).stdout.strip()


def publish():
    paths = set(run('git', 'diff', '--name-only', '-z', 'HEAD').split('\0'))
    paths.update(run('git', 'ls-files', '--others', '--exclude-standard', '-z').split('\0'))
    paths.discard('')
    if not paths:
        print('No data changes; no branch or PR created.')
        return None
    if any(not (p.startswith('data/') or p == 'src/utils/citySlugs.ts') for p in paths):
        raise RuntimeError('Unexpected non-data changes; refusing to publish.')
    if run('git', 'branch', '--show-current') != 'main':
        raise RuntimeError('The collector must start from main.')
    run_id = os.environ.get('GITHUB_RUN_ID', '')
    attempt = os.environ.get('GITHUB_RUN_ATTEMPT', '1')
    repository = os.environ.get('GITHUB_REPOSITORY', '')
    if not re.fullmatch(r'\d+', run_id) or not re.fullmatch(r'\d+', attempt):
        raise RuntimeError('Missing or invalid workflow run identity.')
    if not re.fullmatch(r'[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+', repository):
        raise RuntimeError('Missing or invalid repository identity.')
    branch = f'automation/tvf-data-{run_id}-{attempt}'
    run('git', 'switch', '-c', branch)
    run('git', 'add', '--', *sorted(paths))
    run('git', '-c', 'user.name=github-actions[bot]', '-c',
        'user.email=41898282+github-actions[bot]@users.noreply.github.com',
        'commit', '-m', 'chore(data): TVF altyapi verilerini yenile')
    run('git', 'push', '--set-upstream', 'origin', branch)
    with tempfile.TemporaryDirectory() as temporary:
        body = Path(temporary) / 'body.md'
        body.write_text('TVF kaynaklarından güncellenen veri snapshotları.\n\n'
                        'CI validation başarılı olduktan sonra birleştirin. '
                        'Supabase aktarımı yalnızca main birleştirmesinden sonra çalışır.\n', encoding='utf-8')
        url = run('gh', 'pr', 'create', '--repo', repository, '--base', 'main',
                  '--head', branch, '--title', 'chore(data): TVF altyapi verilerini yenile',
                  '--body-file', str(body))
    print(url)
    run('gh', 'workflow', 'run', 'ci.yml', '--repo', repository, '--ref', branch)
    return branch


if __name__ == '__main__':
    publish()
