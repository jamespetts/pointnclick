#!/usr/bin/env python
# Dependency-free PointClickEngine validator.
# Put this file beside index.html. Typical use:
#   python validator.py testgame/testgame.js
# If no game script is supplied, the validator tries to discover a single
# PointClickEngine.RegisterGame(...) script below the current directory.

from __future__ import print_function

import argparse
import io
import os
import re
import sys

ENGINE_API_VERSION = 1
KNOWN_TEMPLATES = set(['door', 'key', 'map', 'pickup', 'container', 'switch', 'readable', 'device', 'furniture', 'barrier', 'combine', 'openableBox', 'exchange', 'multiRequirement', 'gatekeeper', 'costume', 'toolTarget', 'clueUnlocker', 'distractible'])
GAME_HOOKS = set(['beforeRoomEnter', 'afterRoomEnter', 'beforeRoomExit', 'afterRoomExit', 'beforeTransition', 'afterTransition', 'beforeCommand', 'afterCommand', 'onInventoryChanged', 'beforeCutscene', 'afterCutscene', 'onMenuEnter', 'onMenuExit'])
ROOM_HOOKS = set(['beforeEnter', 'afterEnter', 'beforeExit', 'afterExit'])
TRANSITION_HOOKS = set(['beforeTransition', 'afterTransition'])
LEGACY_HOOKS = set(['onEnter', 'onExit', 'onBeforeEnter', 'onAfterEnter', 'onBeforeExit', 'onAfterExit', 'onBeforeTransition', 'onAfterTransition'])
IMAGE_ROLES = {
    'background':'roomBackground', 'titleBackground':'titleBackground', 'endBackground':'endBackground',
    'image':'overlay', 'animationImage':'overlay', 'closeupImage':'overlay', 'mapImage':'map',
    'icon':'itemIcon', 'worldSprite':'itemWorld', 'sprite':'hotspot', 'closedSprite':'hotspot',
    'openSprite':'hotspot', 'emptySprite':'hotspot', 'fullSprite':'hotspot', 'onSprite':'hotspot', 'offSprite':'hotspot'
}
ROLE_PREFIX = {
    'roomBackground':'rooms/', 'titleBackground':'rooms/', 'endBackground':'rooms/', 'character':'characters/',
    'itemIcon':'objects/', 'itemWorld':'objects/', 'hotspot':'objects/', 'overlay':'objects/', 'map':'objects/',
    'ui':'ui/', 'music':'music/', 'sound':'sounds/'
}
SCRIPT_FIELDS = set(['script', 'blockedScript', 'onOpen', 'onClose', 'onUnlock', 'onLock', 'onTake', 'onEmpty', 'onToggle', 'onOn', 'onOff', 'onRead', 'onUse', 'onCollide', 'onBump', 'onStay', 'onComplete', 'afterDialogueScript', 'blockedAction', 'onWear', 'onRemove'])

class Log(object):
    def __init__(self):
        self.errors = 0
        self.warnings = 0
        self.lines = []

    def _safe(self, value):
        if value is None:
            return 'null'
        return str(value).replace('\n', '\\n').replace('\r', '\\r')

    def add(self, level, code, message, **details):
        level = level.upper()
        code = re.sub(r'[^A-Z0-9_]', '_', code.upper()) or 'GENERAL'
        suffix = ''
        if details:
            suffix = ' | ' + ' '.join([k + '=' + self._safe(details[k]) for k in sorted(details.keys())])
        line = '[PCEVAL][%s][%s] %s%s' % (level, code, message, suffix)
        print(line)
        self.lines.append(line)
        if level == 'ERROR':
            self.errors += 1
        elif level == 'WARN':
            self.warnings += 1

    def info(self, code, message, **details):
        self.add('INFO', code, message, **details)

    def warn(self, code, message, **details):
        self.add('WARN', code, message, **details)

    def error(self, code, message, **details):
        self.add('ERROR', code, message, **details)

    def summary(self):
        self.add('ERROR' if self.errors else 'INFO', 'SUMMARY', 'Validation completed.', errors=self.errors, warnings=self.warnings)

class Scanner(object):
    def __init__(self, text):
        self.text = text
        self.n = len(text)

    def skip_string(self, i):
        q = self.text[i]
        i += 1
        esc = False
        while i < self.n:
            c = self.text[i]
            if esc:
                esc = False
            elif c == '\\':
                esc = True
            elif c == q:
                return i + 1
            i += 1
        return i

    def skip_comment(self, i):
        if i + 1 >= self.n or self.text[i] != '/':
            return i
        if self.text[i + 1] == '/':
            j = self.text.find('\n', i + 2)
            return self.n if j < 0 else j + 1
        if self.text[i + 1] == '*':
            j = self.text.find('*/', i + 2)
            return self.n if j < 0 else j + 2
        return i

    def skip_ws(self, i):
        while i < self.n:
            if self.text[i].isspace():
                i += 1
                continue
            j = self.skip_comment(i)
            if j != i:
                i = j
                continue
            return i
        return i

    def matching(self, i):
        pairs = {'{':'}', '[':']', '(':')'}
        if i < 0 or i >= self.n or self.text[i] not in pairs:
            return -1
        opener = self.text[i]
        closer = pairs[opener]
        depth = 0
        while i < self.n:
            c = self.text[i]
            if c in ['\'', '"', '`']:
                i = self.skip_string(i)
                continue
            j = self.skip_comment(i)
            if j != i:
                i = j
                continue
            if c == opener:
                depth += 1
            elif c == closer:
                depth -= 1
                if depth == 0:
                    return i
            i += 1
        return -1

def string_value(src):
    if not src:
        return None
    src = src.strip()
    if len(src) < 2 or src[0] not in ['\'', '"'] or src[-1] != src[0]:
        return None
    return src[1:-1].replace('\\' + src[0], src[0]).replace('\\\\', '\\')

def number_value(src):
    if src is None:
        return None
    try:
        return float(src.strip())
    except Exception:
        return None

def top_entries(obj):
    if not obj or not obj.strip().startswith('{'):
        return []
    text = obj.strip()[1:-1]
    scan = Scanner(text)
    out = []
    i = 0
    while i < len(text):
        i = scan.skip_ws(i)
        if i >= len(text):
            break
        if text[i] == ',':
            i += 1
            continue
        key = None
        if text[i] in ['\'', '"']:
            e = scan.skip_string(i)
            key = string_value(text[i:e])
            i = scan.skip_ws(e)
        else:
            m = re.match(r'[A-Za-z_$][A-Za-z0-9_$-]*', text[i:])
            if not m:
                i += 1
                continue
            key = m.group(0)
            i = scan.skip_ws(i + len(key))
        if i >= len(text) or text[i] != ':':
            i += 1
            continue
        i = scan.skip_ws(i + 1)
        start = i
        if i < len(text) and text[i] in '{[(':
            e = scan.matching(i)
            if e < 0:
                break
            value = text[start:e + 1]
            i = e + 1
        elif i < len(text) and text[i] in ['\'', '"', '`']:
            e = scan.skip_string(i)
            value = text[start:e]
            i = e
        else:
            depth = 0
            while i < len(text):
                c = text[i]
                if c in ['\'', '"', '`']:
                    i = scan.skip_string(i)
                    continue
                j = scan.skip_comment(i)
                if j != i:
                    i = j
                    continue
                if c in '{[(':
                    depth += 1
                elif c in '}])':
                    if depth == 0:
                        break
                    depth -= 1
                elif c == ',' and depth == 0:
                    break
                i += 1
            value = text[start:i].strip()
        out.append((key, value))
        while i < len(text) and text[i] != ',':
            i += 1
        if i < len(text) and text[i] == ',':
            i += 1
    return out

def prop(obj, name):
    for k, v in top_entries(obj):
        if k == name:
            return v
    return None

def sprop(obj, name):
    return string_value(prop(obj, name))

def nprop(obj, name):
    return number_value(prop(obj, name))

def arr_objects(arr):
    if not arr or not arr.strip().startswith('['):
        return []
    text = arr.strip()[1:-1]
    scan = Scanner(text)
    out = []
    i = 0
    index = 0
    while i < len(text):
        i = scan.skip_ws(i)
        if i >= len(text):
            break
        if text[i] == ',':
            i += 1
            continue
        if text[i] == '{':
            e = scan.matching(i)
            if e < 0:
                break
            out.append((index, text[i:e + 1]))
            i = e + 1
        else:
            if text[i] in ['\'', '"', '`']:
                i = scan.skip_string(i)
            else:
                while i < len(text) and text[i] != ',':
                    i += 1
        index += 1
        while i < len(text) and text[i] != ',':
            i += 1
        if i < len(text):
            i += 1
    return out

def arr_strings(arr):
    if not arr:
        return []
    vals = []
    scan = Scanner(arr)
    i = 0
    while i < len(arr):
        if arr[i] in ['\'', '"']:
            e = scan.skip_string(i)
            val = string_value(arr[i:e])
            if val is not None:
                vals.append(val)
            i = e
        else:
            i += 1
    return vals

def extract_game(text, log):
    p = text.find('PointClickEngine.RegisterGame')
    if p < 0:
        log.error('REGISTER_GAME_MISSING', 'Game script does not call PointClickEngine.RegisterGame().')
        return None
    paren = text.find('(', p)
    e = Scanner(text).matching(paren)
    if paren < 0 or e < 0:
        log.error('REGISTER_GAME_INVALID', 'RegisterGame call has unbalanced parentheses.')
        return None
    arg = text[paren + 1:e].strip()
    if not arg.startswith('{'):
        log.error('REGISTER_GAME_INVALID', 'RegisterGame argument is not an object literal.')
        return None
    end = Scanner(arg).matching(0)
    if end < 0:
        log.error('REGISTER_GAME_INVALID', 'Game object has unbalanced braces.')
        return None
    return arg[:end + 1]

def normal_asset(path, role):
    if not path:
        return None, 'empty'
    if path.startswith('data:'):
        return None, 'data-uri'
    if re.match(r'^(https?:)?//', path):
        return None, 'remote-url'
    if '\\' in path or '..' in path or path.startswith('/'):
        return None, 'unsafe-relative-path'
    prefix = ROLE_PREFIX.get(role)
    if prefix:
        if path.startswith(prefix):
            return path, None
        if '/' in path:
            return None, 'wrong-canonical-directory'
        return prefix + path, None
    return path, None

def check_asset(log, base, asset_root, path, role, where, exists):
    if not path:
        return
    normal, error = normal_asset(path, role)
    if error:
        log.error('ASSET_PATH_INVALID', 'Asset path is not allowed.', where=where, path=path, reason=error)
        return
    if role in ['roomBackground', 'titleBackground', 'endBackground', 'character', 'itemIcon', 'itemWorld', 'hotspot', 'overlay', 'map', 'ui']:
        if not normal.lower().endswith('.png'):
            log.error('ASSET_IMAGE_EXTENSION', 'Image asset must be a .png file.', where=where, path=path)
    if exists:
        full = os.path.join(base, asset_root or '', normal)
        if not os.path.exists(full):
            log.warn('ASSET_FILE_MISSING', 'Asset file was not found.', where=where, path=normal)

def normal_asset_root(path):
    if path is None:
        return None, None
    value = path.strip().replace('\\', '/')
    if not value or value == '.':
        return '', None
    if re.match(r'^(https?:)?//', value) or value.startswith('/') or '..' in value:
        return None, 'unsafe-relative-path'
    value = value.strip('/')
    if value:
        value += '/'
    return value, None

def infer_asset_root(script_path, engine_path):
    base = os.path.dirname(os.path.abspath(engine_path or '.'))
    script_dir = os.path.dirname(os.path.abspath(script_path or '.'))
    try:
        rel = os.path.relpath(script_dir, base).replace('\\', '/')
    except Exception:
        return ''
    if rel == '.':
        return ''
    if rel.startswith('../') or rel == '..':
        return ''
    return rel.strip('/') + '/'

def validate_script(log, scripts, name, where, required=False, template_ok=True):
    if not name:
        return
    if name.startswith('template:'):
        if not template_ok:
            log.error('SCRIPT_REF_TEMPLATE_NOT_ALLOWED', 'Template action is not allowed here.', where=where, script=name)
            return
        parts = name[len('template:'):].split('.')
        if len(parts) != 2 or parts[0] not in KNOWN_TEMPLATES:
            log.error('TEMPLATE_ACTION_INVALID', 'Template action reference is invalid.', where=where, script=name)
        return
    if name not in scripts:
        if required:
            log.error('SCRIPT_REF_MISSING', 'Referenced script is not defined in game.scripts.', where=where, script=name)
        else:
            log.warn('SCRIPT_REF_MISSING', 'Referenced script is not defined in game.scripts.', where=where, script=name)

def validate_templates(log, obj, where):
    raw = []
    for field in ['template', 'templateId', 'kind']:
        val = sprop(obj, field)
        if val:
            raw += re.split(r'[\s,]+', val)
    raw += arr_strings(prop(obj, 'templates'))
    for name in raw:
        if name and name not in KNOWN_TEMPLATES:
            log.error('TEMPLATE_UNKNOWN', 'Unknown template name.', where=where, template=name)

def validate_images(log, base, asset_root, obj, where, default_role, exists):
    for field, role in IMAGE_ROLES.items():
        path = sprop(obj, field)
        if not path:
            continue
        use_role = role
        if field == 'image' and default_role in ['character', 'map', 'endBackground']:
            use_role = default_role
        if field in ['sprite', 'closedSprite', 'openSprite', 'emptySprite', 'fullSprite', 'onSprite', 'offSprite']:
            use_role = default_role
        check_asset(log, base, asset_root, path, use_role, where + '.' + field, exists)

def validate_point(log, obj, field, where):
    val = prop(obj, field)
    if not val:
        return
    if not val.strip().startswith('{'):
        log.warn('POINT_INVALID', 'Point field is not an object.', where=where)
        return
    if nprop(val, 'x') is None or nprop(val, 'y') is None:
        log.warn('POINT_INVALID', 'Point field needs numeric x and y.', where=where)

def validate_interactions(log, scripts, obj, where):
    interactions = prop(obj, 'interactions')
    if not interactions or not interactions.strip().startswith('{'):
        return
    for verb, val in top_entries(interactions):
        validate_script(log, scripts, string_value(val), where + '.interactions.' + verb, False, True)

def validate_getters(log, scripts, obj, where):
    for field in ['propertyGetters', 'getters', 'nonConstPropertyGetters', 'mutablePropertyGetters']:
        getters = prop(obj, field)
        if getters and getters.strip().startswith('{'):
            for name, val in top_entries(getters):
                validate_script(log, scripts, string_value(val), where + '.' + field + '.' + name, False, False)

def validate_script_fields(log, scripts, obj, where):
    for field in SCRIPT_FIELDS:
        validate_script(log, scripts, sprop(obj, field), where + '.' + field, False, False)
    acs = prop(obj, 'animationCompleteScripts')
    if acs and acs.strip().startswith('{'):
        for anim, val in top_entries(acs):
            validate_script(log, scripts, string_value(val), where + '.animationCompleteScripts.' + anim, False, False)

def object_ids_from_rooms(rooms):
    ids = set()
    for room_id, room in rooms.items():
        for idx, hot in arr_objects(prop(room, 'hotspots')):
            hid = sprop(hot, 'id')
            if hid:
                ids.add(hid)
    return ids

def validate_dialogue(log, game, scripts, item_ids):
    trees = prop(game, 'dialogueTrees')
    if not trees or not trees.strip().startswith('{'):
        return
    for tree_id, tree in top_entries(trees):
        nodes = prop(tree, 'nodes')
        if not nodes or not nodes.strip().startswith('{'):
            log.warn('DIALOGUE_NODES_MISSING', 'Dialogue tree has no nodes object.', where='dialogueTrees.' + tree_id)
            continue
        node_ids = set([k for k, v in top_entries(nodes)])
        start = sprop(tree, 'start') or 'start'
        if start not in node_ids:
            log.warn('DIALOGUE_START_MISSING', 'Dialogue start node does not exist.', where='dialogueTrees.' + tree_id, start=start)
        for node_id, node in top_entries(nodes):
            for idx, choice in arr_objects(prop(node, 'choices')):
                where = 'dialogueTrees.' + tree_id + '.nodes.' + node_id + '.choices[' + str(idx) + ']'
                nxt = sprop(choice, 'next')
                if nxt and nxt not in node_ids:
                    log.warn('DIALOGUE_NEXT_MISSING', 'Dialogue choice next node does not exist.', where=where, next=nxt)
                validate_script(log, scripts, sprop(choice, 'script'), where + '.script', False, False)
                for field in ['actions', 'action', 'preActions', 'preAction', 'postResponseActions', 'postResponseAction', 'conditions', 'condition', 'showIf']:
                    value = prop(choice, field)
                    objs = []
                    if value and value.strip().startswith('{'):
                        objs = [value]
                    elif value and value.strip().startswith('['):
                        objs = [o for i, o in arr_objects(value)]
                    for obj in objs:
                        validate_script(log, scripts, sprop(obj, 'script'), where + '.' + field + '.script', False, False)
                        for item_field in ['addItem', 'removeItem', 'hasItem', 'missingItem']:
                            item = sprop(obj, item_field)
                            if item and item not in item_ids:
                                log.warn('ITEM_REF_MISSING', 'Dialogue references a missing item.', where=where + '.' + field + '.' + item_field, itemId=item)

def validate_game(game, source_text, script_path, engine_path, log, check_assets, asset_root=None):
    base = os.path.dirname(os.path.abspath(engine_path or '.'))
    if asset_root is None:
        asset_root = infer_asset_root(script_path, engine_path)
        if check_assets and asset_root:
            log.info('ASSET_ROOT_INFERRED', 'Using inferred asset root for asset file checks.', assetRoot=asset_root)
    else:
        normal_root, root_error = normal_asset_root(asset_root)
        if root_error:
            log.error('ASSET_ROOT_INVALID', 'Asset root is not allowed.', assetRoot=asset_root, reason=root_error)
            normal_root = ''
        asset_root = normal_root
        if check_assets:
            log.info('ASSET_ROOT_USED', 'Using explicit asset root for asset file checks.', assetRoot=asset_root)
    game_id = sprop(game, 'id')
    if not game_id:
        log.error('GAME_ID_MISSING', 'Game id is missing.')
    else:
        log.info('GAME_FOUND', 'Registered game found.', gameId=game_id)
    api = nprop(game, 'engineApi')
    if api is None:
        log.warn('ENGINE_API_MISSING', 'Game does not declare engineApi.')
    elif int(api) != ENGINE_API_VERSION:
        log.warn('ENGINE_API_MISMATCH', 'Game engineApi does not match validator expected version.', expected=ENGINE_API_VERSION, actual=int(api))
    for private in ['State', 'Rooms', 'Renderer', 'Templates', 'Movement', 'SaveLoad', 'Inventory', 'Dialogue', 'Hooks']:
        if re.search(r'PointClickEngine\s*\.\s*' + private + r'\b', source_text):
            log.error('PRIVATE_ENGINE_ACCESS', 'Game script references private engine internals.', reference='PointClickEngine.' + private)
    if re.search(r'\bEngine\s*\.', source_text):
        log.error('PRIVATE_ENGINE_ACCESS', 'Game script references private engine internals.', reference='Engine.*')

    rooms_obj = prop(game, 'rooms')
    if not rooms_obj or not rooms_obj.strip().startswith('{'):
        log.error('ROOMS_MISSING', 'Game has no rooms object.')
        return
    rooms = dict(top_entries(rooms_obj))
    room_ids = set(rooms.keys())
    start = sprop(game, 'startRoomId')
    if not start:
        log.error('START_ROOM_MISSING', 'startRoomId is missing.')
    elif start not in room_ids:
        log.error('START_ROOM_UNKNOWN', 'startRoomId does not match a room id.', startRoomId=start)

    scripts_obj = prop(game, 'scripts')
    scripts = set([k for k, v in top_entries(scripts_obj)]) if scripts_obj else set()
    items_obj = prop(game, 'items')
    items = dict(top_entries(items_obj)) if items_obj else {}
    item_ids = set(items.keys())
    sprites_obj = prop(game, 'sprites')
    sprites = dict(top_entries(sprites_obj)) if sprites_obj else {}
    sprite_ids = set(sprites.keys())

    hooks = prop(game, 'hooks')
    if hooks:
        for hook, val in top_entries(hooks):
            if hook not in GAME_HOOKS:
                log.error('HOOK_NAME_INVALID', 'Game hook name is invalid or legacy.', where='game.hooks.' + hook)
            for name in arr_strings(val):
                validate_script(log, scripts, name, 'game.hooks.' + hook, True, False)

    player = prop(game, 'player')
    if player:
        sid = sprop(player, 'spriteId')
        if sid and sid not in sprite_ids:
            log.warn('SPRITE_REF_MISSING', 'Player references a missing sprite.', spriteId=sid)

    for sprite_id, sprite in sprites.items():
        image = sprop(sprite, 'image')
        if image:
            check_asset(log, base, asset_root, image, 'character', 'sprites.' + sprite_id + '.image', check_assets)
        if nprop(sprite, 'frameW') is not None and nprop(sprite, 'frameW') <= 0:
            log.error('SPRITE_FRAME_INVALID', 'Sprite frameW must be positive.', where='sprites.' + sprite_id + '.frameW')
        if nprop(sprite, 'frameH') is not None and nprop(sprite, 'frameH') <= 0:
            log.error('SPRITE_FRAME_INVALID', 'Sprite frameH must be positive.', where='sprites.' + sprite_id + '.frameH')

    room_object_ids = object_ids_from_rooms(rooms)
    for item_id, item in items.items():
        inner = sprop(item, 'id')
        if inner and inner != item_id:
            log.warn('ITEM_ID_MISMATCH', 'Item id does not match its object key.', key=item_id, id=inner)
        validate_templates(log, item, 'items.' + item_id)
        validate_images(log, base, asset_root, item, 'items.' + item_id, 'itemIcon', check_assets)
        validate_interactions(log, scripts, item, 'items.' + item_id)
        validate_getters(log, scripts, item, 'items.' + item_id)
        validate_script_fields(log, scripts, item, 'items.' + item_id)
        for target in arr_strings(prop(item, 'unlocks')):
            if target != '*' and target not in room_object_ids:
                log.warn('UNLOCK_TARGET_UNKNOWN', 'Key unlock target is not a known room object id.', where='items.' + item_id + '.unlocks', target=target)

    seen_objects = {}
    for room_id, room in rooms.items():
        where = 'rooms.' + room_id
        inner = sprop(room, 'id')
        if inner and inner != room_id:
            log.warn('ROOM_ID_MISMATCH', 'Room id does not match its object key.', key=room_id, id=inner)
        bg = sprop(room, 'background')
        if not bg:
            log.warn('ROOM_BACKGROUND_MISSING', 'Room has no background image.', where=where)
        else:
            check_asset(log, base, asset_root, bg, 'roomBackground', where + '.background', check_assets)
        for legacy in LEGACY_HOOKS:
            if prop(room, legacy) is not None:
                log.error('LEGACY_HOOK_USED', 'Legacy room hook is not supported.', where=where + '.' + legacy)
        for hook in ROOM_HOOKS:
            for name in arr_strings(prop(room, hook)):
                validate_script(log, scripts, name, where + '.' + hook, True, False)
        for idx, hot in arr_objects(prop(room, 'hotspots')):
            hwhere = where + '.hotspots[' + str(idx) + ']'
            hid = sprop(hot, 'id')
            if not hid:
                log.warn('OBJECT_ID_MISSING', 'Room object has no id.', where=hwhere)
            elif hid in seen_objects:
                log.error('OBJECT_ID_DUPLICATE', 'Room object id is not globally unique.', objectId=hid, first=seen_objects[hid], second=hwhere)
            else:
                seen_objects[hid] = hwhere
            item = sprop(hot, 'itemId')
            if item and item not in item_ids:
                log.warn('ITEM_REF_MISSING', 'Room object itemId references a missing item.', where=hwhere + '.itemId', itemId=item)
            validate_templates(log, hot, hwhere)
            validate_images(log, base, asset_root, hot, hwhere, 'hotspot', check_assets)
            validate_interactions(log, scripts, hot, hwhere)
            validate_getters(log, scripts, hot, hwhere)
            validate_script_fields(log, scripts, hot, hwhere)
            validate_point(log, hot, 'walkTo', hwhere + '.walkTo')
            validate_point(log, hot, 'walkThroughTo', hwhere + '.walkThroughTo')
        for idx, ch in arr_objects(prop(room, 'characters')):
            cwhere = where + '.characters[' + str(idx) + ']'
            cid = sprop(ch, 'id')
            if not cid:
                log.warn('CHARACTER_ID_MISSING', 'Room character has no id.', where=cwhere)
            sid = sprop(ch, 'spriteId')
            if sid and sid not in sprite_ids:
                log.warn('SPRITE_REF_MISSING', 'Character references a missing sprite.', where=cwhere + '.spriteId', spriteId=sid)
            validate_interactions(log, scripts, ch, cwhere)
            validate_getters(log, scripts, ch, cwhere)
        for idx, zone in arr_objects(prop(room, 'transitionZones')):
            zwhere = where + '.transitionZones[' + str(idx) + ']'
            for legacy in LEGACY_HOOKS:
                if prop(zone, legacy) is not None:
                    log.error('LEGACY_HOOK_USED', 'Legacy transition hook is not supported.', where=zwhere + '.' + legacy)
            target = sprop(zone, 'targetRoomId')
            script = sprop(zone, 'script')
            if target and target not in room_ids:
                log.error('ROOM_REF_MISSING', 'Transition targetRoomId references a missing room.', where=zwhere + '.targetRoomId', targetRoomId=target)
            if not target and not script:
                log.error('TRANSITION_TARGET_MISSING', 'Transition zone needs targetRoomId or script.', where=zwhere)
            validate_script(log, scripts, script, zwhere + '.script', False, False)
            enabled = sprop(zone, 'enabledObjectId')
            if enabled and enabled not in room_object_ids:
                log.warn('OBJECT_REF_MISSING', 'Transition enabledObjectId does not match a known room object.', where=zwhere + '.enabledObjectId', objectId=enabled)
            for hook in TRANSITION_HOOKS:
                for name in arr_strings(prop(zone, hook)):
                    validate_script(log, scripts, name, zwhere + '.' + hook, True, False)
    validate_dialogue(log, game, scripts, item_ids)
    endings = prop(game, 'endings')
    if endings:
        for eid, ending in top_entries(endings):
            validate_images(log, base, asset_root, ending, 'endings.' + eid, 'endBackground', check_assets)
    log.info('STRUCTURE_CHECKED', 'Declarative structure checks completed.', rooms=len(room_ids), items=len(item_ids), scripts=len(scripts))

def discover_game_scripts():
    candidates = []
    for root, dirs, files in os.walk('.'):
        parts = root.replace('\\', '/').split('/')
        if any([p.startswith('.') for p in parts if p]):
            continue
        for fn in files:
            if not fn.lower().endswith('.js') or fn.lower() == 'games.js':
                continue
            path = os.path.join(root, fn)
            try:
                sample = io.open(path, 'r', encoding='utf-8').read(8192)
            except Exception:
                continue
            if 'PointClickEngine.RegisterGame' in sample:
                candidates.append(path)
    candidates.sort()
    return candidates

def write_report(path, log):
    if not path:
        return
    with io.open(path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(log.lines) + '\n')

def run(argv):
    parser = argparse.ArgumentParser(description='Validate a PointClickEngine game script without external dependencies.')
    parser.add_argument('game_script', nargs='?', help='Game content script, e.g. testgame/testgame.js')
    parser.add_argument('--engine', default='index.html', help='Engine HTML file in the same top directory. Default: index.html')
    parser.add_argument('--check-assets', action='store_true', help='Also check that referenced asset files exist.')
    parser.add_argument('--asset-root', default=None, help='Asset folder relative to the engine file. If omitted, inferred from the game script folder.')
    parser.add_argument('--report', default='', help='Optional path to write the same log output.')
    args = parser.parse_args(argv)
    log = Log()
    if not args.game_script:
        found = discover_game_scripts()
        if len(found) == 1:
            args.game_script = found[0]
            log.info('GAME_SCRIPT_DISCOVERED', 'Using the only discovered game script.', path=args.game_script)
        elif len(found) > 1:
            log.error('GAME_SCRIPT_AMBIGUOUS', 'More than one game script was found. Pass one path explicitly.', candidates=', '.join(found))
            log.summary()
            write_report(args.report, log)
            return 1
        else:
            log.error('GAME_SCRIPT_REQUIRED', 'No game script was supplied and none was discovered. Run: python validator.py testgame/testgame.js')
            log.summary()
            write_report(args.report, log)
            return 1
    if not os.path.exists(args.engine):
        log.warn('ENGINE_FILE_MISSING', 'Engine file was not found beside validator.', path=args.engine)
    if not os.path.exists(args.game_script):
        log.error('GAME_SCRIPT_MISSING', 'Game script file was not found.', path=args.game_script)
        log.summary()
        write_report(args.report, log)
        return 1
    try:
        text = io.open(args.game_script, 'r', encoding='utf-8').read()
    except Exception as err:
        log.error('GAME_SCRIPT_READ_FAILED', 'Game script could not be read as UTF-8.', path=args.game_script, error=err)
        log.summary()
        write_report(args.report, log)
        return 1
    game = extract_game(text, log)
    if game:
        validate_game(game, text, args.game_script, args.engine, log, args.check_assets, args.asset_root)
    log.summary()
    write_report(args.report, log)
    return 1 if log.errors else 0

if __name__ == '__main__':
    sys.exit(run(sys.argv[1:]))
