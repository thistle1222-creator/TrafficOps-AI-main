from pathlib import Path

paths = [
    Path('backend/requirements.txt'),
    Path('backend/app/main.py'),
    Path('backend/app/models/schemas.py'),
    Path('frontend/src/routes/_app.event-simulator.tsx'),
]

for path in paths:
    text = path.read_text(encoding='utf-8')
    if '<<<<<<< HEAD' not in text:
        print(f'{path}: no conflict markers')
        continue
    out_lines = []
    state = 'normal'
    for line in text.splitlines(keepends=True):
        if state == 'normal':
            if line.startswith('<<<<<<< HEAD'):
                state = 'head'
                continue
            out_lines.append(line)
        elif state == 'head':
            if line.startswith('======='):
                state = 'skip'
                continue
            out_lines.append(line)
        elif state == 'skip':
            if line.startswith('>>>>>>>'):
                state = 'normal'
            continue
    if state != 'normal':
        raise RuntimeError(f'Unclosed conflict in {path}')
    path.write_text(''.join(out_lines), encoding='utf-8')
    print(f'Fixed {path}')
