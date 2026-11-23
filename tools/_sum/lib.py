import json, os, sys
ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
FILE = os.path.join(ROOT, 'seed', 'summaries.json')
_data = {}
def S(lid, overview, concepts, defs, example, review):
    assert lid not in _data, lid
    assert len(concepts) >= 2 and len(review) >= 1, lid
    c = {'overview': overview, 'concepts': concepts, 'definitions': [{'term': t, 'meaning': m} for t, m in defs], 'review': review}
    if example: c['example'] = example
    _data[lid] = {'status': 'draft', 'content': c, 'model': 'claude', 'updatedAt': '2026-11-23T00:00:00.000Z'}
def save():
    cur = json.load(open(FILE, encoding='utf-8'))
    for k, v in _data.items():
        if cur.get(k, {}).get('status') == 'approved': continue
        cur[k] = v
    json.dump(dict(sorted(cur.items())), open(FILE, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    open(FILE, 'a').write('\n')
    print(f'saved {len(_data)} → total {len(cur)}')
