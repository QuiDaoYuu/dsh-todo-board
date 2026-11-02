/* Todo board — Client half.
 *
 * Renders a full page behind a `sidebar.panellist` entry and keeps its data in
 * the Host file exposed at /dsh-todo-board/data (with a localStorage mirror so
 * a failed request can never lose the board).
 */
window.__ModuleLoader__.load({
  id: 'dsh-todo-board',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } = React;

    const NS = 'dsh-todo-board';
    const PANEL_ID = 'dsh-todo-board';
    const API = '/dsh-todo-board/data';
    const LS_KEY = 'dsh-todo-board:cache';

    /* ------------------------------------------------------------------ i18n */

    const zh = {
      'app.title': '待办看板',
      'view.all': '全部项目',
      'view.allHint': '汇总所有项目的待办',
      'rail.projects': '项目',
      'rail.tags': '标签',
      'rail.newProject': '新建项目',
      'rail.noTags': '还没有标签。在待办里添加标签后会出现在这里。',
      'project.name': '项目名称',
      'project.default': '我的待办',
      'project.create': '创建项目',
      'project.rename': '重命名项目',
      'project.renameAction': '重命名',
      'project.delete': '删除项目',
      'project.deleteConfirm': '删除项目“{name}”及其中 {count} 条待办？此操作无法撤销。',
      'project.duplicate': '已存在同名项目',
      'project.empty': '请输入项目名称',
      'col.todo': '待办',
      'col.doing': '进行中',
      'col.done': '已完成',
      'col.add': '在此列新建待办',
      'search.placeholder': '搜索标题、备注或标签…',
      'search.clear': '清除搜索',
      'quick.placeholder': '快速添加待办，按回车保存',
      'quick.target': '添加到',
      'filters.active': '筛选：',
      'filters.clear': '清除筛选',
      'task.new': '新建待办',
      'task.edit': '编辑待办',
      'task.title': '标题',
      'task.titlePlaceholder': '要做什么？',
      'task.note': '备注',
      'task.notePlaceholder': '补充说明、链接或验收标准（可选）',
      'task.tags': '标签',
      'task.tagsPlaceholder': '输入标签后按回车',
      'task.status': '状态',
      'task.project': '所属项目',
      'task.save': '保存',
      'task.create': '创建',
      'task.cancel': '取消',
      'task.delete': '删除',
      'task.deleteConfirm': '确认删除',
      'task.editAction': '编辑',
      'task.markDone': '标记为已完成',
      'task.markUndone': '标记为未完成',
      'task.emptyTitle': '这条待办还没有标题',
      'empty.title': '还没有待办',
      'empty.hint': '在上方输入框写下第一件要做的事，按回车即可添加。',
      'empty.filtered': '没有匹配的待办',
      'empty.filteredHint': '换一个关键词，或清除标签筛选后再看看。',
      'empty.column': '这一列是空的',
      'empty.noProject': '还没有项目',
      'empty.noProjectHint': '先建一个项目，待办都挂在项目下面。',
      'save.saving': '保存中…',
      'save.saved': '已保存',
      'save.error': '保存失败，点击重试',
      'save.local': '仅保存在本机缓存',
      'stats.subtitle': '{doing} 进行中 · {todo} 待办 · {done} 已完成',
      'count.open': '{n} 条未完成',
      'tag.filterHint': '点击标签筛选同类待办',
      'menu.openProject': '只看这个项目',
      'menu.newTaskHere': '在此新建待办',
      'menu.moveTo': '移到「{column}」',
      'menu.filterTag': '按此标签筛选',
      'menu.unfilterTag': '取消这个标签',
      'menu.newProject': '新建项目',
      'common.close': '关闭',
    };

    const en = {
      'app.title': 'Todo Board',
      'view.all': 'All projects',
      'view.allHint': 'Every todo, across projects',
      'rail.projects': 'Projects',
      'rail.tags': 'Tags',
      'rail.newProject': 'New project',
      'rail.noTags': 'No tags yet. Tags you add to todos show up here.',
      'project.name': 'Project name',
      'project.default': 'My todos',
      'project.create': 'Create project',
      'project.rename': 'Rename project',
      'project.renameAction': 'Rename',
      'project.delete': 'Delete project',
      'project.deleteConfirm': 'Delete “{name}” and its {count} todos? This cannot be undone.',
      'project.duplicate': 'A project with this name already exists',
      'project.empty': 'Enter a project name',
      'col.todo': 'To do',
      'col.doing': 'In progress',
      'col.done': 'Done',
      'col.add': 'Add a todo in this column',
      'search.placeholder': 'Search titles, notes or tags…',
      'search.clear': 'Clear search',
      'quick.placeholder': 'Quick add a todo, press Enter',
      'quick.target': 'Add to',
      'filters.active': 'Filters:',
      'filters.clear': 'Clear filters',
      'task.new': 'New todo',
      'task.edit': 'Edit todo',
      'task.title': 'Title',
      'task.titlePlaceholder': 'What needs doing?',
      'task.note': 'Notes',
      'task.notePlaceholder': 'Details, links or acceptance criteria (optional)',
      'task.tags': 'Tags',
      'task.tagsPlaceholder': 'Type a tag, press Enter',
      'task.status': 'Status',
      'task.project': 'Project',
      'task.save': 'Save',
      'task.create': 'Create',
      'task.cancel': 'Cancel',
      'task.delete': 'Delete',
      'task.deleteConfirm': 'Confirm delete',
      'task.editAction': 'Edit',
      'task.markDone': 'Mark as done',
      'task.markUndone': 'Mark as not done',
      'task.emptyTitle': 'Untitled todo',
      'empty.title': 'No todos yet',
      'empty.hint': 'Write the first thing you need to do in the box above and press Enter.',
      'empty.filtered': 'Nothing matches',
      'empty.filteredHint': 'Try another keyword, or clear the tag filters.',
      'empty.column': 'Nothing here',
      'empty.noProject': 'No projects yet',
      'empty.noProjectHint': 'Create a project first — every todo belongs to one.',
      'save.saving': 'Saving…',
      'save.saved': 'Saved',
      'save.error': 'Save failed — click to retry',
      'save.local': 'Kept in local cache only',
      'stats.subtitle': '{doing} in progress · {todo} to do · {done} done',
      'count.open': '{n} open',
      'tag.filterHint': 'Click a tag to show its todos',
      'menu.openProject': 'Show only this project',
      'menu.newTaskHere': 'New todo here',
      'menu.moveTo': 'Move to “{column}”',
      'menu.filterTag': 'Filter by this tag',
      'menu.unfilterTag': 'Remove this tag filter',
      'menu.newProject': 'New project',
      'common.close': 'Close',
    };

    let boundT = (key) => key;
    function tr(key, vars) {
      let text = boundT(key);
      if (text == null) text = key;
      if (vars) {
        for (const name of Object.keys(vars)) {
          text = text.split('{' + name + '}').join(String(vars[name]));
        }
      }
      return text;
    }

    /* --------------------------------------------------------------- helpers */

    function uid() {
      return 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    }

    function hashHue(text) {
      let hash = 0;
      for (let i = 0; i < text.length; i += 1) {
        hash = (hash * 31 + text.charCodeAt(i)) | 0;
      }
      const palette = [212, 262, 168, 32, 340, 188, 96, 12, 292, 138];
      return palette[Math.abs(hash) % palette.length];
    }

    function str(value, fallback) {
      return typeof value === 'string' ? value : fallback === undefined ? '' : fallback;
    }

    function normalize(raw) {
      const out = { version: 1, projects: [], tasks: [] };
      if (!raw || typeof raw !== 'object') return out;
      const projectIds = new Set();
      if (Array.isArray(raw.projects)) {
        for (const row of raw.projects) {
          if (!row || typeof row !== 'object') continue;
          const id = str(row.id).trim();
          if (!id || projectIds.has(id)) continue;
          projectIds.add(id);
          out.projects.push({
            id,
            name: str(row.name).trim() || id,
            color: str(row.color),
            createdAt: Number(row.createdAt) || Date.now(),
          });
        }
      }
      const taskIds = new Set();
      if (Array.isArray(raw.tasks)) {
        for (const row of raw.tasks) {
          if (!row || typeof row !== 'object') continue;
          const id = str(row.id).trim();
          const projectId = str(row.projectId);
          if (!id || taskIds.has(id) || !projectIds.has(projectId)) continue;
          taskIds.add(id);
          const status = ['todo', 'doing', 'done'].indexOf(row.status) >= 0 ? row.status : 'todo';
          const tags = Array.isArray(row.tags)
            ? Array.from(new Set(row.tags.map((tag) => str(tag).trim()).filter(Boolean))).slice(0, 32)
            : [];
          out.tasks.push({
            id,
            projectId,
            title: str(row.title).slice(0, 500),
            note: str(row.note).slice(0, 20000),
            tags,
            status,
            createdAt: Number(row.createdAt) || Date.now(),
            updatedAt: Number(row.updatedAt) || Date.now(),
            doneAt: Number(row.doneAt) || 0,
          });
        }
      }
      return out;
    }

    function readCache() {
      try {
        const raw = window.localStorage.getItem(LS_KEY);
        return raw ? normalize(JSON.parse(raw)) : null;
      } catch {
        return null;
      }
    }

    function writeCache(data) {
      try {
        window.localStorage.setItem(LS_KEY, JSON.stringify(data));
      } catch {
        /* storage disabled — the Host copy is still the source of truth */
      }
    }

    async function loadBoard() {
      const response = await fetch(API, { cache: 'no-store', credentials: 'same-origin' });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const payload = await response.json();
      if (!payload || payload.ok === false) throw new Error((payload && payload.error) || 'bad response');
      return normalize(payload.data);
    }

    async function saveBoard(data) {
      const response = await fetch(API, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ data }),
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const payload = await response.json();
      if (!payload || payload.ok === false) throw new Error((payload && payload.error) || 'bad response');
      return payload;
    }

    function highlight(text, needle) {
      const value = String(text == null ? '' : text);
      if (!needle) return value;
      const lowerValue = value.toLowerCase();
      const lowerNeedle = needle.toLowerCase();
      if (!lowerNeedle) return value;
      const out = [];
      let cursor = 0;
      let key = 0;
      for (;;) {
        const at = lowerValue.indexOf(lowerNeedle, cursor);
        if (at < 0) {
          if (cursor < value.length) out.push(value.slice(cursor));
          break;
        }
        if (at > cursor) out.push(value.slice(cursor, at));
        out.push(h('mark', { key: 'm' + key, className: 'tb-hit' }, value.slice(at, at + lowerNeedle.length)));
        key += 1;
        cursor = at + lowerNeedle.length;
      }
      return out;
    }

    /* ----------------------------------------------------------------- icons */

    function Svg(props) {
      return h(
        'svg',
        Object.assign(
          {
            width: props.size || 16,
            height: props.size || 16,
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: 1.7,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            'aria-hidden': 'true',
            focusable: 'false',
          },
          props.extra || null,
        ),
        props.children,
      );
    }

    function IconBoard(props) {
      return h(
        Svg,
        { size: props.size || 18 },
        h('rect', { key: 'a', x: 3.5, y: 4.5, width: 17, height: 15, rx: 3.4 }),
        h('path', { key: 'b', d: 'M8.6 9.2l1.5 1.5 2.6-2.9' }),
        h('path', { key: 'c', d: 'M14.6 9.6h4' }),
        h('path', { key: 'd', d: 'M8.6 14.6l1.5 1.5 2.6-2.9' }),
        h('path', { key: 'e', d: 'M14.6 15h4' }),
      );
    }

    function IconSearch(props) {
      return h(
        Svg,
        { size: props.size || 15 },
        h('circle', { key: 'a', cx: 11, cy: 11, r: 6.4 }),
        h('path', { key: 'b', d: 'M15.8 15.8l3.6 3.6' }),
      );
    }

    function IconPlus(props) {
      return h(Svg, { size: props.size || 15 }, h('path', { key: 'a', d: 'M12 5.5v13M5.5 12h13' }));
    }

    function IconX(props) {
      return h(Svg, { size: props.size || 14 }, h('path', { key: 'a', d: 'M6.5 6.5l11 11M17.5 6.5l-11 11' }));
    }

    function IconPencil(props) {
      return h(
        Svg,
        { size: props.size || 14 },
        h('path', { key: 'a', d: 'M4.8 19.2l.6-3.6L15.9 5.1a2 2 0 012.8 0l.2.2a2 2 0 010 2.8L8.4 18.6l-3.6.6z' }),
      );
    }

    function IconTrash(props) {
      return h(
        Svg,
        { size: props.size || 14 },
        h('path', { key: 'a', d: 'M4.5 7h15' }),
        h('path', { key: 'b', d: 'M9.5 7V5.2c0-.7.6-1.2 1.2-1.2h2.6c.7 0 1.2.5 1.2 1.2V7' }),
        h('path', { key: 'c', d: 'M6.6 7l.8 11.4c.1.9.8 1.6 1.7 1.6h5.8c.9 0 1.6-.7 1.7-1.6L17.4 7' }),
        h('path', { key: 'd', d: 'M10.4 11v5.2M13.6 11v5.2' }),
      );
    }

    function IconCheck(props) {
      return h(Svg, { size: props.size || 12 }, h('path', { key: 'a', d: 'M5 12.6l4.2 4.2L19 7' }));
    }

    function IconArrow(props) {
      return h(
        Svg,
        { size: props.size || 13 },
        h('path', { key: 'a', d: 'M5 12h13' }),
        h('path', { key: 'b', d: 'M12.5 6.2L18.3 12l-5.8 5.8' }),
      );
    }

    function IconInbox(props) {
      return h(
        Svg,
        { size: props.size || 22 },
        h('path', { key: 'a', d: 'M3.8 13.4h4.3l1.5 2.4h4.8l1.5-2.4h4.3' }),
        h('path', {
          key: 'b',
          d: 'M3.8 13.4l1.9-7.1c.2-.8 1-1.4 1.8-1.4h9c.8 0 1.6.6 1.8 1.4l1.9 7.1v4.1c0 1-.8 1.9-1.9 1.9H5.7c-1 0-1.9-.8-1.9-1.9v-4.1z',
        }),
      );
    }

    /* ------------------------------------------------------------- fragments */

    function TagPill(props) {
      const tag = props.tag;
      const style = { '--h': String(hashHue(tag)) };
      const children = [h('span', { key: 'n' }, props.label === undefined ? tag : props.label)];
      if (props.count !== undefined && props.count !== null) {
        children.push(h('em', { key: 'c', className: 'tb-tag-count' }, String(props.count)));
      }
      if (props.onRemove) {
        children.push(
          h(
            'button',
            {
              key: 'x',
              type: 'button',
              'aria-label': tr('common.close'),
              onClick: (event) => {
                event.stopPropagation();
                props.onRemove(tag);
              },
            },
            h(IconX, { size: 11 }),
          ),
        );
      }
      if (props.onClick) {
        return h(
          'button',
          {
            type: 'button',
            className: 'tb-tag' + (props.active ? ' is-on' : ''),
            style,
            title: props.title || tag,
            onClick: (event) => {
              event.stopPropagation();
              props.onClick(tag);
            },
            onContextMenu: props.onContextMenu
              ? (event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  props.onContextMenu(event, tag);
                }
              : undefined,
          },
          children,
        );
      }
      return h('span', { className: 'tb-tag' + (props.active ? ' is-on' : ''), style }, children);
    }

    /* ----------------------------------------------------------- context menu */

    function ContextMenu(props) {
      const menu = props.menu;
      const ref = useRef(null);
      const [pos, setPos] = useState({ x: menu.x, y: menu.y });

      useLayoutEffect(() => {
        const node = ref.current;
        if (!node) return;
        const rect = node.getBoundingClientRect();
        const pad = 8;
        const maxX = Math.max(pad, window.innerWidth - rect.width - pad);
        const maxY = Math.max(pad, window.innerHeight - rect.height - pad);
        setPos({
          x: Math.min(Math.max(pad, menu.x), maxX),
          y: Math.min(Math.max(pad, menu.y), maxY),
        });
      }, [menu]);

      useEffect(() => {
        const onDown = (event) => {
          if (ref.current && ref.current.contains(event.target)) return;
          props.onClose();
        };
        const onKey = (event) => {
          if (event.key === 'Escape') {
            event.stopPropagation();
            props.onClose();
          }
        };
        window.addEventListener('pointerdown', onDown, true);
        window.addEventListener('keydown', onKey, true);
        window.addEventListener('resize', props.onClose);
        window.addEventListener('blur', props.onClose);
        return () => {
          window.removeEventListener('pointerdown', onDown, true);
          window.removeEventListener('keydown', onKey, true);
          window.removeEventListener('resize', props.onClose);
          window.removeEventListener('blur', props.onClose);
        };
      }, [props.onClose]);

      return h(
        'div',
        {
          className: 'tb-menu-layer',
          onContextMenu: (event) => event.preventDefault(),
        },
        h(
          'div',
          {
            ref,
            className: 'tb-menu',
            role: 'menu',
            'aria-label': menu.label || '',
            style: { left: pos.x + 'px', top: pos.y + 'px' },
          },
          menu.title
            ? h('div', { className: 'tb-menu-title' }, menu.title)
            : null,
          menu.items.map((item, index) =>
            item.sep
              ? h('div', { key: 'sep' + index, className: 'tb-menu-sep' })
              : h(
                  'button',
                  {
                    key: item.id || 'item' + index,
                    type: 'button',
                    role: 'menuitem',
                    className:
                      'tb-menu-item' + (item.danger ? ' is-danger' : '') + (item.active ? ' is-active' : ''),
                    disabled: !!item.disabled,
                    onClick: () => {
                      props.onClose();
                      if (item.onSelect) item.onSelect();
                    },
                  },
                  h('span', { className: 'tb-menu-icon' }, item.icon ? h(item.icon, { size: 14 }) : null),
                  h('span', { className: 'tb-menu-label' }, item.label),
                  item.hint ? h('span', { className: 'tb-menu-hint' }, item.hint) : null,
                ),
          ),
        ),
      );
    }

    function SaveStatus(props) {
      const state = props.state;
      const label =
        state === 'saving'
          ? tr('save.saving')
          : state === 'error'
            ? tr('save.error')
            : state === 'local'
              ? tr('save.local')
              : tr('save.saved');
      return h(
        'span',
        {
          className: 'tb-save' + (state === 'error' ? ' is-error' : ''),
          role: state === 'error' ? 'button' : undefined,
          tabIndex: state === 'error' ? 0 : undefined,
          title: state === 'error' ? tr('save.error') : label,
          onClick: state === 'error' ? props.onRetry : undefined,
          onKeyDown:
            state === 'error'
              ? (event) => {
                  if (event.key === 'Enter' || event.key === ' ') props.onRetry();
                }
              : undefined,
        },
        state === 'saving'
          ? h('span', { className: 'tb-spin', 'aria-hidden': 'true' })
          : h('span', { className: 'tb-dot', 'aria-hidden': 'true' }),
        label,
      );
    }

    /* ------------------------------------------------------------- tag input */

    function TagInput(props) {
      const [draft, setDraft] = useState('');
      const tags = props.tags;
      const suggestions = props.suggestions.filter((tag) => tags.indexOf(tag) < 0).slice(0, 8);

      const commit = (raw) => {
        const parts = String(raw)
          .split(/[,，、;；\s]+/)
          .map((part) => part.trim())
          .filter(Boolean);
        if (!parts.length) return;
        const next = tags.slice();
        for (const part of parts) {
          if (next.indexOf(part) < 0 && next.length < 32) next.push(part);
        }
        props.onChange(next);
        setDraft('');
      };

      return h(
        'div',
        null,
        h(
          'div',
          { className: 'tb-taginput' },
          tags.map((tag) =>
            h(TagPill, {
              key: tag,
              tag,
              onRemove: (value) => props.onChange(tags.filter((item) => item !== value)),
            }),
          ),
          h('input', {
            value: draft,
            placeholder: tr('task.tagsPlaceholder'),
            'aria-label': tr('task.tags'),
            onChange: (event) => setDraft(event.target.value),
            onKeyDown: (event) => {
              if (event.key === 'Enter' || event.key === ',' || event.key === '，') {
                event.preventDefault();
                commit(draft);
              } else if (event.key === 'Backspace' && !draft && tags.length) {
                props.onChange(tags.slice(0, -1));
              }
            },
            onBlur: () => commit(draft),
          }),
        ),
        suggestions.length
          ? h(
              'div',
              { className: 'tb-suggest' },
              suggestions.map((tag) =>
                h(TagPill, { key: tag, tag, onClick: () => props.onChange(tags.concat(tag)) }),
              ),
            )
          : null,
      );
    }

    /* ------------------------------------------------------------------ card */

    function TaskCard(props) {
      const task = props.task;
      const dragRef = useRef(false);
      const done = task.status === 'done';

      const stop = (event) => {
        event.stopPropagation();
      };

      return h(
        'article',
        {
          className:
            'tb-card' + (done ? ' is-done' : '') + (props.dragging ? ' is-drag' : ''),
          draggable: true,
          tabIndex: 0,
          role: 'button',
          'aria-label': task.title || tr('task.emptyTitle'),
          onDragStart: (event) => {
            dragRef.current = true;
            try {
              event.dataTransfer.setData('text/plain', task.id);
              event.dataTransfer.effectAllowed = 'move';
            } catch {
              /* some browsers refuse during synthetic drags */
            }
            props.onDragStart(task.id);
          },
          onDragEnd: () => {
            dragRef.current = false;
            props.onDragEnd();
          },
          onClick: () => props.onEdit(task),
          onContextMenu: (event) => {
            if (!props.onMenu) return;
            event.preventDefault();
            event.stopPropagation();
            props.onMenu(event, task);
          },
          onKeyDown: (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              props.onEdit(task);
            }
          },
        },
        h(
          'div',
          { className: 'tb-card-top' },
          h(
            'button',
            {
              type: 'button',
              className: 'tb-check' + (done ? ' is-on' : ''),
              title: done ? tr('task.markUndone') : tr('task.markDone'),
              'aria-label': done ? tr('task.markUndone') : tr('task.markDone'),
              'aria-pressed': done ? 'true' : 'false',
              onClick: (event) => {
                stop(event);
                props.onToggle(task);
              },
            },
            h(IconCheck, { size: 11 }),
          ),
          h('div', { className: 'tb-card-title' }, highlight(task.title || tr('task.emptyTitle'), props.query)),
          h(
            'div',
            { className: 'tb-card-acts' },
            h(
              'button',
              {
                type: 'button',
                className: 'tb-icon-btn',
                title: tr('task.editAction'),
                'aria-label': tr('task.editAction'),
                onClick: (event) => {
                  stop(event);
                  props.onEdit(task);
                },
              },
              h(IconPencil),
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'tb-icon-btn is-danger',
                title: tr('task.delete'),
                'aria-label': tr('task.delete'),
                onClick: (event) => {
                  stop(event);
                  props.onDelete(task);
                },
              },
              h(IconTrash),
            ),
          ),
        ),
        task.note
          ? h('p', { className: 'tb-card-note' }, highlight(task.note, props.query))
          : null,
        (task.tags.length || task.projectName) &&
          h(
            'div',
            { className: 'tb-card-foot' },
            props.showProject && task.projectName
              ? h(
                  'span',
                  { className: 'tb-card-proj' },
                  h('span', {
                    className: 'tb-nav-dot',
                    style: { background: 'hsl(' + hashHue(task.projectName) + ' 58% 52%)' },
                  }),
                  h('span', null, task.projectName),
                )
              : null,
            task.tags.map((tag) =>
              h(TagPill, {
                key: tag,
                tag,
                onClick: props.onTagClick,
                active: props.activeTags.indexOf(tag) >= 0,
              }),
            ),
          ),
      );
    }

    /* ---------------------------------------------------------------- column */

    function Column(props) {
      const [over, setOver] = useState(false);
      const list = props.tasks;
      return h(
        'section',
        {
          className: 'tb-col' + (over ? ' is-over' : ''),
          onDragEnter: (event) => {
            if (event.dataTransfer && Array.prototype.indexOf.call(event.dataTransfer.types, 'text/plain') >= 0) {
              setOver(true);
            }
          },
          onDragOver: (event) => {
            event.preventDefault();
            if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
          },
          onDragLeave: (event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setOver(false);
          },
          onDrop: (event) => {
            event.preventDefault();
            setOver(false);
            let id = '';
            try {
              id = event.dataTransfer.getData('text/plain');
            } catch {
              id = '';
            }
            if (id) props.onDrop(id, props.status);
          },
          onContextMenu: (event) => {
            if (!props.onMenu) return;
            event.preventDefault();
            event.stopPropagation();
            props.onMenu(event, props.status);
          },
        },
        h(
          'header',
          { className: 'tb-col-head' },
          h(
            'div',
            { className: 'tb-col-title' },
            props.label,
            h('span', { className: 'tb-col-count' }, String(list.length)),
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'tb-icon-btn',
              title: tr('col.add'),
              'aria-label': tr('col.add'),
              onClick: () => props.onAdd(props.status),
            },
            h(IconPlus),
          ),
        ),
        h(
          'div',
          { className: 'tb-col-body' },
          list.length
            ? list.map((task) =>
                h(TaskCard, {
                  key: task.id,
                  task,
                  query: props.query,
                  showProject: props.showProject,
                  activeTags: props.activeTags,
                  dragging: props.dragId === task.id,
                  onEdit: props.onEdit,
                  onDelete: props.onDelete,
                  onToggle: props.onToggle,
                  onTagClick: props.onTagClick,
                  onMenu: props.onTaskMenu,
                  onDragStart: props.onDragStart,
                  onDragEnd: props.onDragEnd,
                }),
              )
            : h('p', { className: 'tb-col-empty' }, tr('empty.column')),
        ),
      );
    }

    /* ---------------------------------------------------------------- dialog */

    function TaskDialog(props) {
      const draft = props.draft;
      const [title, setTitle] = useState(draft.title);
      const [note, setNote] = useState(draft.note);
      const [tags, setTags] = useState(draft.tags);
      const [status, setStatus] = useState(draft.status);
      const [projectId, setProjectId] = useState(draft.projectId);
      const [confirming, setConfirming] = useState(false);
      const titleRef = useRef(null);

      useEffect(() => {
        if (titleRef.current) titleRef.current.focus();
      }, []);

      useEffect(() => {
        const onKey = (event) => {
          if (event.key === 'Escape') {
            event.stopPropagation();
            props.onClose();
          }
          if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
            event.preventDefault();
            submit();
          }
        };
        window.addEventListener('keydown', onKey, true);
        return () => window.removeEventListener('keydown', onKey, true);
      });

      const submit = () => {
        const clean = title.trim();
        if (!clean) return;
        props.onSubmit({
          id: draft.id,
          title: clean,
          note: note.trim(),
          tags,
          status,
          projectId,
          createdAt: draft.createdAt,
        });
      };

      return h(
        'div',
        {
          className: 'tb-mask',
          onMouseDown: (event) => {
            if (event.target === event.currentTarget) props.onClose();
          },
        },
        h(
          'div',
          { className: 'tb-dialog', role: 'dialog', 'aria-modal': 'true', 'aria-label': draft.id ? tr('task.edit') : tr('task.new') },
          h(
            'header',
            { className: 'tb-dialog-head' },
            h('h2', null, draft.id ? tr('task.edit') : tr('task.new')),
            h(
              'button',
              {
                type: 'button',
                className: 'tb-icon-btn',
                title: tr('common.close'),
                'aria-label': tr('common.close'),
                onClick: props.onClose,
              },
              h(IconX, { size: 15 }),
            ),
          ),
          h(
            'div',
            { className: 'tb-dialog-body' },
            h(
              'div',
              { className: 'tb-field' },
              h('label', { htmlFor: 'tb-f-title' }, tr('task.title')),
              h('input', {
                id: 'tb-f-title',
                ref: titleRef,
                className: 'tb-input',
                value: title,
                placeholder: tr('task.titlePlaceholder'),
                onChange: (event) => setTitle(event.target.value),
                onKeyDown: (event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    submit();
                  }
                },
              }),
            ),
            h(
              'div',
              { className: 'tb-field' },
              h('label', { htmlFor: 'tb-f-note' }, tr('task.note')),
              h('textarea', {
                id: 'tb-f-note',
                className: 'tb-textarea',
                value: note,
                placeholder: tr('task.notePlaceholder'),
                onChange: (event) => setNote(event.target.value),
              }),
            ),
            h(
              'div',
              { className: 'tb-field' },
              h('label', null, tr('task.tags')),
              h(TagInput, { tags, onChange: setTags, suggestions: props.tagSuggestions }),
            ),
            h(
              'div',
              { className: 'tb-field' },
              h('label', null, tr('task.status')),
              h(
                'div',
                { className: 'tb-seg', role: 'group' },
                ['todo', 'doing', 'done'].map((value) =>
                  h(
                    'button',
                    {
                      key: value,
                      type: 'button',
                      className: status === value ? 'is-on' : '',
                      'aria-pressed': status === value ? 'true' : 'false',
                      onClick: () => setStatus(value),
                    },
                    tr('col.' + value),
                  ),
                ),
              ),
            ),
            h(
              'div',
              { className: 'tb-field' },
              h('label', { htmlFor: 'tb-f-project' }, tr('task.project')),
              h(
                'select',
                {
                  id: 'tb-f-project',
                  className: 'tb-select',
                  value: projectId,
                  onChange: (event) => setProjectId(event.target.value),
                },
                props.projects.map((project) => h('option', { key: project.id, value: project.id }, project.name)),
              ),
            ),
          ),
          h(
            'footer',
            { className: 'tb-dialog-foot' },
            draft.id
              ? h(
                  'button',
                  {
                    type: 'button',
                    className: 'tb-btn' + (confirming ? ' tb-btn-danger' : ''),
                    onClick: () => {
                      if (!confirming) {
                        setConfirming(true);
                        return;
                      }
                      props.onDelete(draft.id);
                    },
                  },
                  h(IconTrash),
                  confirming ? tr('task.deleteConfirm') : tr('task.delete'),
                )
              : null,
            h('span', { className: 'tb-spacer' }),
            h('button', { type: 'button', className: 'tb-btn', onClick: props.onClose }, tr('task.cancel')),
            h(
              'button',
              {
                type: 'button',
                className: 'tb-btn tb-btn-primary',
                disabled: !title.trim(),
                onClick: submit,
              },
              draft.id ? tr('task.save') : tr('task.create'),
            ),
          ),
        ),
      );
    }

    function ProjectDialog(props) {
      const [name, setName] = useState(props.name || '');
      const [error, setError] = useState('');
      const inputRef = useRef(null);

      useEffect(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, []);

      const submit = () => {
        const clean = name.trim();
        if (!clean) {
          setError(tr('project.empty'));
          return;
        }
        const duplicate = props.projects.some(
          (project) =>
            project.id !== props.id && project.name.toLowerCase() === clean.toLowerCase(),
        );
        if (duplicate) {
          setError(tr('project.duplicate'));
          return;
        }
        props.onSubmit(clean);
      };

      return h(
        'div',
        {
          className: 'tb-mask',
          onMouseDown: (event) => {
            if (event.target === event.currentTarget) props.onClose();
          },
        },
        h(
          'div',
          { className: 'tb-dialog tb-dialog-sm', role: 'dialog', 'aria-modal': 'true' },
          h(
            'header',
            { className: 'tb-dialog-head' },
            h('h2', null, props.id ? tr('project.rename') : tr('project.create')),
            h(
              'button',
              {
                type: 'button',
                className: 'tb-icon-btn',
                title: tr('common.close'),
                'aria-label': tr('common.close'),
                onClick: props.onClose,
              },
              h(IconX, { size: 15 }),
            ),
          ),
          h(
            'div',
            { className: 'tb-dialog-body' },
            h(
              'div',
              { className: 'tb-field' },
              h('label', { htmlFor: 'tb-f-pname' }, tr('project.name')),
              h('input', {
                id: 'tb-f-pname',
                ref: inputRef,
                className: 'tb-input',
                value: name,
                placeholder: tr('project.name'),
                onChange: (event) => {
                  setName(event.target.value);
                  setError('');
                },
                onKeyDown: (event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    submit();
                  }
                },
              }),
              error ? h('p', { className: 'tb-error' }, error) : null,
            ),
          ),
          h(
            'footer',
            { className: 'tb-dialog-foot' },
            h('span', { className: 'tb-spacer' }),
            h('button', { type: 'button', className: 'tb-btn', onClick: props.onClose }, tr('task.cancel')),
            h(
              'button',
              { type: 'button', className: 'tb-btn tb-btn-primary', onClick: submit },
              props.id ? tr('task.save') : tr('project.create'),
            ),
          ),
        ),
      );
    }

    /* ----------------------------------------------------------------- shell */

    function Board() {
      const [data, setData] = useState(null);
      const [error, setError] = useState('');
      const [offline, setOffline] = useState(false);
      const [view, setView] = useState('all');
      const [query, setQuery] = useState('');
      const [activeTags, setActiveTags] = useState([]);
      const [editor, setEditor] = useState(null);
      const [projectEditor, setProjectEditor] = useState(null);
      const [quick, setQuick] = useState('');
      const [quickProject, setQuickProject] = useState('');
      const [saveState, setSaveState] = useState('saved');
      const [dragId, setDragId] = useState('');
      const hydrated = useRef(false);
      const queue = useRef(null);

      const applyLoaded = useCallback((next) => {
        if (!next.projects.length) {
          const seeded = { version: 1, projects: [], tasks: [] };
          const now = Date.now();
          seeded.projects.push({ id: uid(), name: tr('project.default'), color: '', createdAt: now });
          setData(seeded);
          setQuickProject(seeded.projects[0].id);
          return;
        }
        setData(next);
        setQuickProject((current) =>
          next.projects.some((project) => project.id === current) ? current : next.projects[0].id,
        );
      }, []);

      const reload = useCallback(() => {
        setError('');
        loadBoard()
          .then((next) => {
            writeCache(next);
            setOffline(false);
            applyLoaded(next);
          })
          .catch((cause) => {
            const cached = readCache();
            if (cached) {
              applyLoaded(cached);
              setOffline(true);
              setSaveState('local');
            } else {
              setError(String((cause && cause.message) || cause));
            }
          });
      }, [applyLoaded]);

      useEffect(() => {
        reload();
      }, [reload]);

      // Persist on every change, debounced; the cache write is immediate.
      useEffect(() => {
        if (!data) return;
        writeCache(data);
        if (!hydrated.current) {
          hydrated.current = true;
          return;
        }
        setSaveState('saving');
        if (queue.current) clearTimeout(queue.current);
        queue.current = setTimeout(() => {
          queue.current = null;
          saveBoard(data)
            .then(() => {
              setSaveState('saved');
              setOffline(false);
            })
            .catch(() => setSaveState(offline ? 'local' : 'error'));
        }, 320);
        return () => {
          if (queue.current) {
            clearTimeout(queue.current);
            queue.current = null;
          }
        };
      }, [data, offline]);

      const retrySave = useCallback(() => {
        if (!data) return;
        setSaveState('saving');
        saveBoard(data)
          .then(() => setSaveState('saved'))
          .catch(() => setSaveState('error'));
      }, [data]);

      const projects = (data && data.projects) || [];
      const tasks = (data && data.tasks) || [];

      const projectNameById = useMemo(() => {
        const map = {};
        for (const project of projects) map[project.id] = project.name;
        return map;
      }, [projects]);

      const tagStats = useMemo(() => {
        const counts = {};
        for (const task of tasks) {
          for (const tag of task.tags) counts[tag] = (counts[tag] || 0) + 1;
        }
        return Object.keys(counts)
          .map((tag) => ({ tag, count: counts[tag] }))
          .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
      }, [tasks]);

      const scoped = useMemo(
        () => (view === 'all' ? tasks : tasks.filter((task) => task.projectId === view)),
        [tasks, view],
      );

      const visible = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return scoped.filter((task) => {
          if (activeTags.length && !activeTags.every((tag) => task.tags.indexOf(tag) >= 0)) return false;
          if (!needle) return true;
          const haystack = (task.title + '\n' + task.note + '\n' + task.tags.join(' ')).toLowerCase();
          return haystack.indexOf(needle) >= 0;
        });
      }, [scoped, activeTags, query]);

      const columns = useMemo(() => {
        const buckets = { todo: [], doing: [], done: [] };
        for (const task of visible) {
          (buckets[task.status] || buckets.todo).push(task);
        }
        buckets.todo.sort((a, b) => a.createdAt - b.createdAt);
        buckets.doing.sort((a, b) => a.createdAt - b.createdAt);
        buckets.done.sort((a, b) => (b.doneAt || b.updatedAt) - (a.doneAt || a.updatedAt));
        for (const key of ['todo', 'doing', 'done']) {
          buckets[key] = buckets[key].map((task) =>
            Object.assign({}, task, { projectName: projectNameById[task.projectId] || '' }),
          );
        }
        return buckets;
      }, [visible, projectNameById]);

      const stats = useMemo(() => {
        let todo = 0;
        let doing = 0;
        let done = 0;
        for (const task of scoped) {
          if (task.status === 'done') done += 1;
          else if (task.status === 'doing') doing += 1;
          else todo += 1;
        }
        return { todo, doing, done };
      }, [scoped]);

      const viewName = view === 'all' ? tr('view.all') : projectNameById[view] || tr('view.all');

      /* --------------------------------------------------------- mutations */

      const createTask = useCallback((payload) => {
        const now = Date.now();
        const task = {
          id: uid(),
          projectId: payload.projectId,
          title: payload.title,
          note: payload.note || '',
          tags: payload.tags || [],
          status: payload.status || 'todo',
          createdAt: now,
          updatedAt: now,
          doneAt: payload.status === 'done' ? now : 0,
        };
        setData((prev) => (prev ? Object.assign({}, prev, { tasks: prev.tasks.concat(task) }) : prev));
        return task;
      }, []);

      const updateTask = useCallback((id, patch) => {
        setData((prev) =>
          prev
            ? Object.assign({}, prev, {
                tasks: prev.tasks.map((task) =>
                  task.id === id ? Object.assign({}, task, patch, { updatedAt: Date.now() }) : task,
                ),
              })
            : prev,
        );
      }, []);

      const deleteTask = useCallback((id) => {
        setData((prev) => (prev ? Object.assign({}, prev, { tasks: prev.tasks.filter((t) => t.id !== id) }) : prev));
      }, []);

      const moveTask = useCallback(
        (id, status) => {
          const task = tasks.find((item) => item.id === id);
          if (!task || task.status === status) return;
          updateTask(id, {
            status,
            doneAt: status === 'done' ? Date.now() : 0,
          });
        },
        [tasks, updateTask],
      );

      const toggleTask = useCallback(
        (task) => {
          if (task.status === 'done') updateTask(task.id, { status: 'todo', doneAt: 0 });
          else updateTask(task.id, { status: 'done', doneAt: Date.now() });
        },
        [updateTask],
      );

      const createProject = useCallback((name) => {
        const project = { id: uid(), name, color: '', createdAt: Date.now() };
        setData((prev) => (prev ? Object.assign({}, prev, { projects: prev.projects.concat(project) }) : prev));
        setView(project.id);
        setProjectEditor(null);
        return project;
      }, []);

      const renameProject = useCallback((id, name) => {
        setData((prev) =>
          prev
            ? Object.assign({}, prev, {
                projects: prev.projects.map((project) =>
                  project.id === id ? Object.assign({}, project, { name }) : project,
                ),
              })
            : prev,
        );
        setProjectEditor(null);
      }, []);

      const removeProject = useCallback(
        (id) => {
          const project = projects.find((item) => item.id === id);
          const count = tasks.filter((task) => task.projectId === id).length;
          if (!project) return;
          if (count > 0) {
            const ok = window.confirm(
              tr('project.deleteConfirm', { name: project.name, count: String(count) }),
            );
            if (!ok) return;
          }
          setData((prev) =>
            prev
              ? Object.assign({}, prev, {
                  projects: prev.projects.filter((item) => item.id !== id),
                  tasks: prev.tasks.filter((task) => task.projectId !== id),
                })
              : prev,
          );
          if (view === id) setView('all');
        },
        [projects, tasks, view],
      );

      /* ------------------------------------------------------------ handlers */

      const openEditor = useCallback(
        (task) => {
          setEditor({
            id: task.id,
            title: task.title,
            note: task.note,
            tags: task.tags.slice(),
            status: task.status,
            projectId: task.projectId,
            createdAt: task.createdAt,
          });
        },
        [],
      );

      const openNew = useCallback(
        (status) => {
          const fallback = view !== 'all' ? view : quickProject || (projects[0] && projects[0].id) || '';
          if (!fallback) {
            setEditor(null);
            setProjectEditor({ id: '', name: '' });
            return;
          }
          setEditor({
            id: '',
            title: '',
            note: '',
            tags: activeTags.slice(),
            status: status || 'todo',
            projectId: fallback,
            createdAt: 0,
          });
        },
        [view, quickProject, projects, activeTags],
      );

      const submitEditor = useCallback(
        (draft) => {
          if (draft.id) {
            updateTask(draft.id, {
              title: draft.title,
              note: draft.note,
              tags: draft.tags,
              status: draft.status,
              projectId: draft.projectId,
              doneAt: draft.status === 'done' ? Date.now() : 0,
            });
          } else {
            createTask(draft);
          }
          setEditor(null);
        },
        [createTask, updateTask],
      );

      const quickAdd = useCallback(() => {
        const title = quick.trim();
        if (!title) return;
        const target =
          view !== 'all' ? view : quickProject || (projects[0] && projects[0].id) || '';
        if (!target) {
          setProjectEditor({ id: '', name: '' });
          return;
        }
        createTask({ title, projectId: target, tags: activeTags.slice(), status: 'todo' });
        setQuick('');
      }, [quick, view, quickProject, projects, activeTags, createTask]);

      const toggleTag = useCallback((tag) => {
        setActiveTags((prev) => (prev.indexOf(tag) >= 0 ? prev.filter((item) => item !== tag) : prev.concat(tag)));
      }, []);

      const clearFilters = useCallback(() => {
        setActiveTags([]);
        setQuery('');
      }, []);

      const [menu, setMenu] = useState(null);
      const closeMenu = useCallback(() => setMenu(null), []);
      const openMenu = useCallback((event, items, title) => {
        if (!items || !items.length) return;
        const x = event && typeof event.clientX === 'number' ? event.clientX : 24;
        const y = event && typeof event.clientY === 'number' ? event.clientY : 24;
        setMenu({ x, y, items, title: title || '' });
      }, []);

      const projectMenu = useCallback(
        (event, project) => {
          const items = [];
          if (project) {
            items.push({
              id: 'open',
              label: tr('menu.openProject'),
              icon: IconArrow,
              onSelect: () => setView(project.id),
            });
            items.push({
              id: 'new',
              label: tr('menu.newTaskHere'),
              icon: IconPlus,
              onSelect: () => {
                setView(project.id);
                openNew('todo');
              },
            });
            items.push({ sep: true });
            items.push({
              id: 'rename',
              label: tr('project.renameAction'),
              icon: IconPencil,
              onSelect: () => setProjectEditor({ id: project.id, name: project.name }),
            });
            items.push({
              id: 'delete',
              label: tr('project.delete'),
              icon: IconTrash,
              danger: true,
              onSelect: () => removeProject(project.id),
            });
          } else {
            items.push({ id: 'newTask', label: tr('task.new'), icon: IconPlus, onSelect: () => openNew('todo') });
            items.push({
              id: 'newProject',
              label: tr('menu.newProject'),
              icon: IconPlus,
              onSelect: () => setProjectEditor({ id: '', name: '' }),
            });
          }
          openMenu(event, items, project ? project.name : tr('view.all'));
        },
        [openMenu, openNew, removeProject],
      );

      const cardMenu = useCallback(
        (event, task) => {
          const items = [
            { id: 'edit', label: tr('task.editAction'), icon: IconPencil, onSelect: () => openEditor(task) },
            {
              id: 'toggle',
              label: task.status === 'done' ? tr('task.markUndone') : tr('task.markDone'),
              icon: IconCheck,
              onSelect: () => toggleTask(task),
            },
            { sep: true },
          ];
          for (const status of ['todo', 'doing', 'done']) {
            if (status === task.status) continue;
            items.push({
              id: 'move-' + status,
              label: tr('menu.moveTo', { column: tr('col.' + status) }),
              icon: IconArrow,
              onSelect: () => moveTask(task.id, status),
            });
          }
          items.push({ sep: true });
          items.push({
            id: 'delete',
            label: tr('task.delete'),
            icon: IconTrash,
            danger: true,
            onSelect: () => deleteTask(task.id),
          });
          openMenu(event, items, task.title);
        },
        [openMenu, openEditor, toggleTask, moveTask, deleteTask],
      );

      const tagMenu = useCallback(
        (event, tag) => {
          const on = activeTags.indexOf(tag) >= 0;
          const items = [
            {
              id: 'filter',
              label: on ? tr('menu.unfilterTag') : tr('menu.filterTag'),
              icon: IconSearch,
              active: on,
              onSelect: () => toggleTag(tag),
            },
          ];
          if (activeTags.length || query.trim()) {
            items.push({ sep: true });
            items.push({ id: 'clear', label: tr('filters.clear'), icon: IconX, onSelect: clearFilters });
          }
          openMenu(event, items, tag);
        },
        [openMenu, activeTags, query, toggleTag, clearFilters],
      );

      const columnMenu = useCallback(
        (event, status) => {
          openMenu(
            event,
            [{ id: 'add', label: tr('menu.newTaskHere'), icon: IconPlus, onSelect: () => openNew(status) }],
            tr('col.' + status),
          );
        },
        [openMenu, openNew],
      );

      const boardMenu = useCallback(
        (event) => {
          const items = [
            { id: 'newTask', label: tr('task.new'), icon: IconPlus, onSelect: () => openNew('todo') },
            {
              id: 'newProject',
              label: tr('menu.newProject'),
              icon: IconPlus,
              onSelect: () => setProjectEditor({ id: '', name: '' }),
            },
          ];
          if (activeTags.length || query.trim()) {
            items.push({ sep: true });
            items.push({ id: 'clear', label: tr('filters.clear'), icon: IconX, onSelect: clearFilters });
          }
          openMenu(event, items, '');
        },
        [openMenu, openNew, activeTags, query, clearFilters],
      );

      const tagSuggestions = useMemo(() => tagStats.map((row) => row.tag), [tagStats]);

      /* --------------------------------------------------------------- views */

      if (error && !data) {
        return h(
          'div',
          { className: 'tb-page' },
          h('style', null, CSS),
          h(
            'div',
            { className: 'tb-empty' },
            h('div', { className: 'tb-empty-icon' }, h(IconInbox)),
            h('b', null, 'Todo board could not load'),
            h('p', null, error),
            h('button', { type: 'button', className: 'tb-btn', onClick: reload }, 'Retry'),
          ),
        );
      }

      if (!data) {
        return h(
          'div',
          { className: 'tb-page' },
          h('style', null, CSS),
          h('div', { className: 'tb-loading' }, h('span', { className: 'tb-spin' }), tr('save.saving')),
        );
      }

      const showProjectBadge = view === 'all';
      const noMatch = visible.length === 0;
      const filtered = query.trim() || activeTags.length;

      return h(
        'div',
        { className: 'tb-page' },
        h('style', null, CSS),

        h(
          'header',
          { className: 'tb-head' },
          h(
            'div',
            { className: 'tb-brand' },
            h('span', { className: 'tb-brand-icon' }, h(IconBoard, { size: 19 })),
            h(
              'div',
              { className: 'tb-brand-text' },
              h('h1', null, tr('app.title')),
              h(
                'p',
                null,
                viewName +
                  ' · ' +
                  tr('stats.subtitle', {
                    doing: String(stats.doing),
                    todo: String(stats.todo),
                    done: String(stats.done),
                  }),
              ),
            ),
          ),
          h(
            'div',
            { className: 'tb-search' },
            h(IconSearch),
            h('input', {
              value: query,
              placeholder: tr('search.placeholder'),
              'aria-label': tr('search.placeholder'),
              onChange: (event) => setQuery(event.target.value),
              onKeyDown: (event) => {
                if (event.key === 'Escape') setQuery('');
              },
            }),
            query
              ? h(
                  'button',
                  {
                    type: 'button',
                    className: 'tb-search-clear',
                    title: tr('search.clear'),
                    'aria-label': tr('search.clear'),
                    onClick: () => setQuery(''),
                  },
                  h(IconX, { size: 13 }),
                )
              : null,
          ),
          h(SaveStatus, { state: saveState, onRetry: retrySave }),
        ),

        h(
          'div',
          { className: 'tb-body' },
          h(
            'aside',
            { className: 'tb-rail' },
            h(
              'div',
              { className: 'tb-rail-section' },
              h('h2', { className: 'tb-rail-h' }, tr('rail.projects')),
              h(
                'nav',
                { className: 'tb-nav' },
                h(
                  'div',
                  {
                    className: 'tb-nav-row',
                    onContextMenu: (event) => projectMenu(event, null),
                  },
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'tb-nav-item' + (view === 'all' ? ' is-on' : ''),
                      title: tr('view.allHint'),
                      onClick: () => setView('all'),
                    },
                    h('span', { className: 'tb-nav-dot' }),
                    h('span', { className: 'tb-nav-name' }, tr('view.all')),
                    h('span', { className: 'tb-nav-count' }, String(tasks.filter((t) => t.status !== 'done').length)),
                  ),
                ),
                projects.map((project) => {
                  const open = tasks.filter((t) => t.projectId === project.id && t.status !== 'done').length;
                  return h(
                    'div',
                    {
                      key: project.id,
                      className: 'tb-nav-row',
                      onContextMenu: (event) => projectMenu(event, project),
                    },
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'tb-nav-item' + (view === project.id ? ' is-on' : ''),
                        title: project.name,
                        onClick: () => setView(project.id),
                      },
                      h('span', {
                        className: 'tb-nav-dot',
                        style: { background: 'hsl(' + hashHue(project.name) + ' 56% 52%)' },
                      }),
                      h('span', { className: 'tb-nav-name' }, project.name),
                      h('span', { className: 'tb-nav-count' }, String(open)),
                    ),
                    h(
                      'div',
                      { className: 'tb-nav-actions' },
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'tb-icon-btn',
                          title: tr('project.renameAction'),
                          'aria-label': tr('project.renameAction'),
                          onClick: () => setProjectEditor({ id: project.id, name: project.name }),
                        },
                        h(IconPencil, { size: 13 }),
                      ),
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'tb-icon-btn is-danger',
                          title: tr('project.delete'),
                          'aria-label': tr('project.delete'),
                          onClick: () => removeProject(project.id),
                        },
                        h(IconTrash, { size: 13 }),
                      ),
                    ),
                  );
                }),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'tb-ghost-btn',
                    onClick: () => setProjectEditor({ id: '', name: '' }),
                  },
                  h(IconPlus, { size: 14 }),
                  tr('rail.newProject'),
                ),
              ),
            ),
            h(
              'div',
              { className: 'tb-rail-section' },
              h('h2', { className: 'tb-rail-h' }, tr('rail.tags')),
              tagStats.length
                ? h(
                    'div',
                    { className: 'tb-tagcloud', title: tr('tag.filterHint') },
                    tagStats.map((row) =>
                      h(TagPill, {
                        key: row.tag,
                        tag: row.tag,
                        count: row.count,
                        active: activeTags.indexOf(row.tag) >= 0,
                        onClick: toggleTag,
                        onContextMenu: tagMenu,
                      }),
                    ),
                  )
                : h('p', { className: 'tb-rail-hint' }, tr('rail.noTags')),
            ),
          ),

          h(
            'div',
            { className: 'tb-main' },
            h(
              'div',
              { className: 'tb-toolbar' },
              h(
                'div',
                { className: 'tb-quick' },
                h(
                  'label',
                  { className: 'tb-quick-wrap' },
                  h(IconPlus, { size: 15 }),
                  h('input', {
                    value: quick,
                    placeholder: tr('quick.placeholder'),
                    'aria-label': tr('quick.placeholder'),
                    onChange: (event) => setQuick(event.target.value),
                    onKeyDown: (event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        quickAdd();
                      }
                    },
                  }),
                ),
                view === 'all' && projects.length > 1
                  ? h(
                      'select',
                      {
                        className: 'tb-select',
                        value: quickProject,
                        'aria-label': tr('quick.target'),
                        onChange: (event) => setQuickProject(event.target.value),
                      },
                      projects.map((project) => h('option', { key: project.id, value: project.id }, project.name)),
                    )
                  : null,
                h(
                  'button',
                  { type: 'button', className: 'tb-btn tb-btn-primary', disabled: !quick.trim(), onClick: quickAdd },
                  tr('task.create'),
                ),
              ),
            ),

            (query || activeTags.length > 0) &&
              h(
                'div',
                { className: 'tb-filters' },
                h('span', null, tr('filters.active')),
                query ? h('span', { className: 'tb-filter-chip' }, '“' + query + '”') : null,
                activeTags.map((tag) =>
                  h(TagPill, { key: tag, tag, active: true, onClick: toggleTag }),
                ),
                h(
                  'button',
                  { type: 'button', className: 'tb-linkbtn', onClick: clearFilters },
                  tr('filters.clear'),
                ),
              ),

            noMatch
              ? h(
                  'div',
                  { className: 'tb-empty' },
                  h('div', { className: 'tb-empty-icon' }, h(IconInbox)),
                  h(
                    'b',
                    null,
                    projects.length === 0
                      ? tr('empty.noProject')
                      : filtered
                        ? tr('empty.filtered')
                        : tr('empty.title'),
                  ),
                  h(
                    'p',
                    null,
                    projects.length === 0
                      ? tr('empty.noProjectHint')
                      : filtered
                        ? tr('empty.filteredHint')
                        : tr('empty.hint'),
                  ),
                  projects.length === 0
                    ? h(
                        'button',
                        {
                          type: 'button',
                          className: 'tb-btn tb-btn-primary',
                          onClick: () => setProjectEditor({ id: '', name: '' }),
                        },
                        h(IconPlus, { size: 15 }),
                        tr('menu.newProject'),
                      )
                    : filtered
                      ? h('button', { type: 'button', className: 'tb-btn', onClick: clearFilters }, tr('filters.clear'))
                      : h(
                          'button',
                          {
                            type: 'button',
                            className: 'tb-btn tb-btn-primary',
                            onClick: () => openNew('todo'),
                          },
                          h(IconPlus, { size: 15 }),
                          tr('task.new'),
                        ),
                )
              : h(
                  'div',
                  {
                    className: 'tb-board',
                    onContextMenu: (event) => {
                      if (event.target !== event.currentTarget) return;
                      event.preventDefault();
                      boardMenu(event);
                    },
                  },
                  ['todo', 'doing', 'done'].map((status) =>
                    h(Column, {
                      key: status,
                      status,
                      label: tr('col.' + status),
                      tasks: columns[status],
                      query: query.trim(),
                      showProject: showProjectBadge,
                      activeTags,
                      dragId,
                      onAdd: openNew,
                      onEdit: openEditor,
                      onDelete: deleteTask,
                      onToggle: toggleTask,
                      onTagClick: toggleTag,
                      onMenu: columnMenu,
                      onTaskMenu: cardMenu,
                      onDrop: moveTask,
                      onDragStart: setDragId,
                      onDragEnd: () => setDragId(''),
                    }),
                  ),
                ),
          ),
        ),

        editor
          ? h(TaskDialog, {
              draft: editor,
              projects,
              tagSuggestions,
              onSubmit: submitEditor,
              onClose: () => setEditor(null),
              onDelete: (id) => {
                deleteTask(id);
                setEditor(null);
              },
            })
          : null,

        projectEditor
          ? h(ProjectDialog, {
              id: projectEditor.id,
              name: projectEditor.name,
              projects,
              onSubmit: (name) => {
                if (projectEditor.id) renameProject(projectEditor.id, name);
                else createProject(name);
              },
              onClose: () => setProjectEditor(null),
            })
          : null,

        menu ? h(ContextMenu, { menu, onClose: closeMenu }) : null,
      );
    }

    /* -------------------------------------------------------------------- css */

    const CSS = `
.tb-page {
  --tb-line: var(--dsw-alias-border-l1, rgba(127,127,127,.22));
  --tb-line-strong: var(--dsw-alias-border-l2, rgba(127,127,127,.42));
  --tb-fg: var(--dsw-alias-label-primary, currentColor);
  --tb-mute: var(--dsw-alias-label-secondary, color-mix(in srgb, currentColor 62%, transparent));
  --tb-bg: var(--dsw-alias-bg-base, canvas);
  --tb-accent: var(--dsw-alias-brand-primary, #4d6bfe);
  --tb-solid: #4353c9;
  --tb-solid-hover: #4f60d8;
  --tb-danger: var(--dsw-alias-state-error-primary, #d14343);
  --tb-ok: var(--dsw-alias-state-success-primary, #1f9d55);
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--tb-bg);
  color: var(--tb-fg);
  font: inherit;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
.tb-page *, .tb-page *::before, .tb-page *::after { box-sizing: border-box; }
.tb-page button { font-family: inherit; }
.tb-page ::-webkit-scrollbar { width: 10px; height: 10px; }
.tb-page ::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--tb-fg) 16%, transparent);
  border-radius: 999px;
  border: 3px solid transparent;
  background-clip: content-box;
}
.tb-page ::-webkit-scrollbar-thumb:hover { background: color-mix(in srgb, var(--tb-fg) 26%, transparent); background-clip: content-box; }
.tb-page ::-webkit-scrollbar-track { background: transparent; }

/* ---- header ---- */
.tb-head {
  display: flex; align-items: center; gap: 14px; flex: none;
  padding: 13px 20px; border-bottom: 1px solid var(--tb-line);
}
.tb-brand { display: flex; align-items: center; gap: 10px; min-width: 0; }
.tb-brand-icon {
  width: 34px; height: 34px; flex: none; border-radius: 10px;
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--tb-accent);
  border: 1px solid color-mix(in srgb, var(--tb-accent) 28%, var(--tb-line));
  background: color-mix(in srgb, var(--tb-accent) 11%, transparent);
}
.tb-brand-text { min-width: 0; }
.tb-brand-text h1 { margin: 0; font-size: 1.04em; font-weight: 600; letter-spacing: .01em; white-space: nowrap; }
.tb-brand-text p {
  margin: 1px 0 0; font-size: .8em; color: var(--tb-mute);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 42vw;
}

.tb-search { position: relative; flex: 1; min-width: 130px; max-width: 380px; margin-left: auto; }
.tb-search > svg { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: var(--tb-mute); pointer-events: none; }
.tb-search input {
  width: 100%; font: inherit; font-size: .88em; color: var(--tb-fg);
  background: color-mix(in srgb, var(--tb-fg) 6%, var(--tb-bg));
  border: 1px solid var(--tb-line); border-radius: 9px;
  padding: 8px 30px 8px 33px; outline: none;
}
.tb-search input::placeholder { color: var(--tb-mute); }
.tb-search input:focus {
  border-color: color-mix(in srgb, var(--tb-accent) 62%, var(--tb-line));
  background: var(--tb-bg);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--tb-accent) 15%, transparent);
}
.tb-search-clear {
  position: absolute; right: 5px; top: 50%; transform: translateY(-50%);
  border: 0; background: transparent; color: var(--tb-mute);
  padding: 3px; border-radius: 50%; display: inline-flex; cursor: pointer;
}
.tb-search-clear:hover { color: var(--tb-fg); background: color-mix(in srgb, var(--tb-fg) 12%, transparent); }

.tb-save { display: inline-flex; align-items: center; gap: 5px; font-size: .78em; color: var(--tb-mute); white-space: nowrap; flex: none; }
.tb-save.is-error { color: var(--tb-danger); cursor: pointer; text-decoration: underline; text-underline-offset: 2px; }
.tb-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; opacity: .55; }
.tb-spin {
  width: 11px; height: 11px; border-radius: 50%; flex: none;
  border: 1.6px solid color-mix(in srgb, currentColor 28%, transparent);
  border-top-color: currentColor; animation: tb-spin .7s linear infinite;
}
@keyframes tb-spin { to { transform: rotate(360deg); } }

/* ---- body ---- */
.tb-body { flex: 1; min-height: 0; display: flex; }

.tb-rail {
  width: 234px; flex: none; overflow-y: auto; overflow-x: hidden;
  border-right: 1px solid var(--tb-line);
  padding: 14px 12px 26px; display: flex; flex-direction: column; gap: 22px;
}
.tb-rail-section { min-width: 0; }
.tb-rail-h {
  display: flex; align-items: center; gap: 6px; margin: 0 0 8px; padding: 0 6px;
  font-size: .72em; font-weight: 600; letter-spacing: .09em; text-transform: uppercase;
  color: var(--tb-mute);
}
.tb-rail-hint { margin: 0; padding: 0 6px; font-size: .8em; line-height: 1.6; color: var(--tb-mute); }

.tb-nav { display: flex; flex-direction: column; gap: 2px; }
.tb-nav-row { display: flex; align-items: center; border-radius: 9px; }
.tb-nav-row:hover { background: color-mix(in srgb, var(--tb-fg) 6%, transparent); }
.tb-nav-item {
  display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;
  padding: 7px 8px 7px 9px; border: 1px solid transparent; border-radius: 9px;
  background: transparent; color: var(--tb-fg); font: inherit; font-size: .89em;
  text-align: left; cursor: pointer;
}
.tb-nav-item.is-on {
  background: color-mix(in srgb, var(--tb-accent) 13%, transparent);
  border-color: color-mix(in srgb, var(--tb-accent) 26%, transparent);
  font-weight: 600;
}
.tb-nav-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tb-nav-count { font-size: .84em; color: var(--tb-mute); font-variant-numeric: tabular-nums; }
.tb-nav-item.is-on .tb-nav-count { color: var(--tb-fg); }
.tb-nav-dot { width: 8px; height: 8px; border-radius: 50%; flex: none; background: var(--tb-accent); }
.tb-nav-actions { display: flex; gap: 1px; padding-right: 4px; opacity: 0; transition: opacity .12s; }
.tb-nav-row:hover .tb-nav-actions, .tb-nav-row:focus-within .tb-nav-actions { opacity: 1; }

.tb-icon-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 24px; height: 24px; padding: 0; border: 0; border-radius: 7px;
  background: transparent; color: var(--tb-mute); cursor: pointer; flex: none;
}
.tb-icon-btn:hover { background: color-mix(in srgb, var(--tb-fg) 12%, transparent); color: var(--tb-fg); }
.tb-icon-btn.is-danger:hover { color: var(--tb-danger); background: color-mix(in srgb, var(--tb-danger) 14%, transparent); }

.tb-ghost-btn {
  display: flex; align-items: center; gap: 6px; width: 100%;
  margin-top: 5px; padding: 7px 9px; border-radius: 9px;
  border: 1px dashed var(--tb-line); background: transparent;
  color: var(--tb-mute); font: inherit; font-size: .85em; cursor: pointer;
}
.tb-ghost-btn:hover {
  color: var(--tb-fg); border-color: var(--tb-line-strong);
  background: color-mix(in srgb, var(--tb-fg) 5%, transparent);
}

.tb-tagcloud { display: flex; flex-wrap: wrap; gap: 5px; padding: 0 2px; }

/* ---- tags ---- */
.tb-tag {
  --h: 220;
  display: inline-flex; align-items: center; gap: 4px; max-width: 100%;
  padding: 1px 8px; border-radius: 999px; font-size: .77em; line-height: 1.65;
  border: 1px solid color-mix(in srgb, hsl(var(--h) 60% 50%) 30%, var(--tb-line));
  background: color-mix(in srgb, hsl(var(--h) 60% 50%) 13%, var(--tb-bg));
  color: color-mix(in srgb, hsl(var(--h) 66% 44%) 56%, var(--tb-fg));
  font-family: inherit; cursor: default;
}
.tb-tag > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tb-tag-count { font-style: normal; font-size: .92em; opacity: .68; font-variant-numeric: tabular-nums; }
button.tb-tag { cursor: pointer; }
button.tb-tag:hover { border-color: color-mix(in srgb, hsl(var(--h) 60% 50%) 58%, var(--tb-line)); }
.tb-tag.is-on {
  background: hsl(var(--h) 50% 41%);
  border-color: hsl(var(--h) 50% 37%);
  color: #fff;
}
.tb-tag.is-on .tb-tag-count { color: rgba(255,255,255,.82); }
.tb-tag.is-on:hover { background: hsl(var(--h) 50% 36%); }

/* ---- toolbar ---- */
.tb-main { flex: 1; min-width: 0; display: flex; flex-direction: column; min-height: 0; }
.tb-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; padding: 12px 20px 0; flex: none; }
.tb-quick { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 240px; }
.tb-quick-wrap {
  position: relative; display: flex; align-items: center; flex: 1; min-width: 0;
}
.tb-quick-wrap > svg { position: absolute; left: 11px; color: var(--tb-mute); pointer-events: none; }
.tb-quick-wrap input {
  width: 100%; font: inherit; font-size: .9em; color: var(--tb-fg);
  background: color-mix(in srgb, var(--tb-fg) 5%, var(--tb-bg));
  border: 1px solid var(--tb-line); border-radius: 9px;
  padding: 8px 11px 8px 32px; outline: none;
}
.tb-quick-wrap input::placeholder { color: var(--tb-mute); }
.tb-quick-wrap input:focus {
  border-color: color-mix(in srgb, var(--tb-accent) 62%, var(--tb-line));
  background: var(--tb-bg);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--tb-accent) 14%, transparent);
}
.tb-select {
  font: inherit; font-size: .86em; padding: 8px 10px; max-width: 160px;
  border-radius: 9px; border: 1px solid var(--tb-line);
  background: color-mix(in srgb, var(--tb-fg) 5%, var(--tb-bg));
  color: var(--tb-fg); outline: none;
}
.tb-select:focus { border-color: color-mix(in srgb, var(--tb-accent) 62%, var(--tb-line)); }

.tb-btn {
  display: inline-flex; align-items: center; gap: 6px;
  font: inherit; font-size: .87em; padding: 8px 13px; border-radius: 9px;
  border: 1px solid var(--tb-line);
  background: color-mix(in srgb, var(--tb-fg) 5%, var(--tb-bg));
  color: var(--tb-fg); cursor: pointer; white-space: nowrap;
  transition: background .12s, border-color .12s;
}
.tb-btn:hover:not(:disabled) {
  background: color-mix(in srgb, var(--tb-fg) 10%, var(--tb-bg));
  border-color: var(--tb-line-strong);
}
.tb-btn:disabled { opacity: .45; cursor: not-allowed; }
.tb-btn-primary {
  background: var(--tb-solid); border-color: var(--tb-solid);
  color: #fff; font-weight: 600;
}
.tb-btn-primary:hover:not(:disabled) { background: var(--tb-solid-hover); border-color: var(--tb-solid-hover); }
.tb-btn-danger {
  color: var(--tb-danger); border-color: color-mix(in srgb, var(--tb-danger) 42%, transparent);
  background: transparent;
}
.tb-btn-danger:hover:not(:disabled) {
  background: color-mix(in srgb, var(--tb-danger) 12%, transparent);
  border-color: var(--tb-danger);
}
.tb-linkbtn {
  border: 0; background: transparent; color: var(--tb-accent);
  font: inherit; font-size: .92em; cursor: pointer; padding: 2px 4px; border-radius: 6px;
}
.tb-linkbtn:hover { background: color-mix(in srgb, var(--tb-accent) 12%, transparent); }

.tb-filters {
  display: flex; flex-wrap: wrap; align-items: center; gap: 6px;
  padding: 10px 20px 0; flex: none; font-size: .82em; color: var(--tb-mute);
}
.tb-filter-chip {
  padding: 1px 8px; border-radius: 999px;
  background: color-mix(in srgb, var(--tb-fg) 9%, transparent); color: var(--tb-fg);
  max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* ---- board ---- */
.tb-board {
  flex: 1; min-height: 0; display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(228px, 1fr);
  grid-template-rows: minmax(0, 1fr);
  gap: 14px; padding: 14px 20px 18px; overflow-x: auto; overflow-y: hidden;
}
.tb-col {
  display: flex; flex-direction: column; min-height: 0; overflow: hidden;
  border: 1px solid var(--tb-line); border-radius: 14px;
  background: color-mix(in srgb, var(--tb-fg) 4%, var(--tb-bg));
  transition: border-color .12s, background .12s;
}
.tb-col.is-over {
  border-color: color-mix(in srgb, var(--tb-accent) 55%, var(--tb-line));
  background: color-mix(in srgb, var(--tb-accent) 7%, var(--tb-bg));
}
.tb-col-head {
  display: flex; align-items: center; gap: 8px; flex: none;
  padding: 9px 10px 9px 13px; border-bottom: 1px solid var(--tb-line);
}
.tb-col-title {
  display: flex; align-items: center; gap: 7px; min-width: 0;
  font-size: .84em; font-weight: 600; letter-spacing: .02em;
}
.tb-col-count {
  padding: 0 7px; border-radius: 999px; font-size: .86em; font-weight: 500;
  background: color-mix(in srgb, var(--tb-fg) 10%, transparent);
  color: var(--tb-mute); font-variant-numeric: tabular-nums;
}
.tb-col-head .tb-icon-btn { margin-left: auto; }
.tb-col-body {
  flex: 1; min-height: 54px; overflow-y: auto;
  padding: 9px; display: flex; flex-direction: column; gap: 8px;
}
.tb-col-empty { margin: 6px 2px; font-size: .8em; color: var(--tb-mute); text-align: center; }

/* ---- cards ---- */
.tb-card {
  position: relative; display: flex; flex-direction: column; gap: 6px;
  padding: 10px 11px; border-radius: 11px;
  border: 1px solid var(--tb-line); background: var(--tb-bg);
  cursor: grab; outline: none;
  transition: border-color .12s, box-shadow .12s;
}
.tb-card:hover { border-color: var(--tb-line-strong); box-shadow: 0 2px 10px color-mix(in srgb, #000 8%, transparent); }
.tb-card:focus-visible { border-color: var(--tb-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--tb-accent) 20%, transparent); }
.tb-card:active { cursor: grabbing; }
.tb-card.is-drag { opacity: .42; }
.tb-card-top { display: flex; align-items: flex-start; gap: 7px; }
.tb-check {
  width: 16px; height: 16px; margin-top: 1px; flex: none; padding: 0;
  border-radius: 5px; border: 1.5px solid var(--tb-line-strong);
  background: transparent; color: transparent; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
}
.tb-check:hover { border-color: var(--tb-ok); color: color-mix(in srgb, var(--tb-ok) 45%, transparent); }
.tb-check.is-on { background: var(--tb-ok); border-color: var(--tb-ok); color: #fff; }
.tb-card-title { flex: 1; min-width: 0; font-size: .91em; line-height: 1.45; overflow-wrap: anywhere; }
.tb-card.is-done .tb-card-title { color: var(--tb-mute); text-decoration: line-through; text-decoration-thickness: 1px; }
.tb-card-note {
  margin: 0; font-size: .81em; line-height: 1.5; color: var(--tb-mute);
  overflow-wrap: anywhere; white-space: pre-wrap;
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
}
.tb-card-foot { display: flex; flex-wrap: wrap; align-items: center; gap: 5px; }
.tb-card-acts { display: flex; gap: 1px; margin-left: auto; opacity: 0; transition: opacity .12s; }
.tb-card:hover .tb-card-acts, .tb-card:focus-within .tb-card-acts { opacity: 1; }
.tb-card-proj {
  display: inline-flex; align-items: center; gap: 5px; padding: 1px 7px 1px 6px;
  border-radius: 999px; font-size: .74em; color: var(--tb-mute);
  background: color-mix(in srgb, var(--tb-fg) 8%, transparent); max-width: 100%;
}
.tb-card-proj > span:last-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tb-card-proj .tb-nav-dot { width: 6px; height: 6px; }
mark.tb-hit {
  background: color-mix(in srgb, var(--tb-accent) 26%, transparent);
  color: inherit; border-radius: 3px; padding: 0 1px;
}

/* ---- empty / loading ---- */
.tb-empty {
  flex: 1; min-height: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 9px;
  padding: 40px 24px; text-align: center; color: var(--tb-mute);
}
.tb-empty-icon {
  width: 46px; height: 46px; border-radius: 13px; margin-bottom: 2px;
  display: flex; align-items: center; justify-content: center;
  border: 1px dashed var(--tb-line-strong); color: var(--tb-mute);
}
.tb-empty b { color: var(--tb-fg); font-size: .95em; font-weight: 600; }
.tb-empty p { margin: 0; font-size: .84em; max-width: 340px; line-height: 1.65; }
.tb-empty .tb-btn { margin-top: 6px; }
.tb-loading {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
  color: var(--tb-mute); font-size: .88em;
}

/* ---- context menu ---- */
.tb-menu-layer { position: fixed; inset: 0; z-index: 1400; }
.tb-menu {
  position: fixed; min-width: 186px; max-width: 288px;
  padding: 5px; border-radius: 11px;
  border: 1px solid var(--tb-line-strong);
  background: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-base, Canvas));
  box-shadow: 0 16px 44px color-mix(in srgb, #000 42%, transparent);
  animation: tb-menu-in .1s ease-out;
}
@keyframes tb-menu-in { from { opacity: 0; transform: translateY(-3px) scale(.985); } to { opacity: 1; transform: none; } }
.tb-menu-title {
  padding: 5px 9px 6px; font-size: .74em; color: var(--tb-mute);
  max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.tb-menu-item {
  display: flex; align-items: center; gap: 8px; width: 100%;
  padding: 7px 9px; border: 0; border-radius: 7px;
  background: transparent; color: var(--tb-fg);
  font: inherit; font-size: .86em; text-align: left; cursor: pointer;
}
.tb-menu-item:hover:not(:disabled) { background: color-mix(in srgb, var(--tb-fg) 9%, transparent); }
.tb-menu-item:disabled { opacity: .45; cursor: default; }
.tb-menu-item.is-danger { color: var(--tb-danger); }
.tb-menu-item.is-danger:hover:not(:disabled) { background: color-mix(in srgb, var(--tb-danger) 13%, transparent); }
.tb-menu-item.is-active { background: color-mix(in srgb, var(--tb-accent) 14%, transparent); }
.tb-menu-icon { display: inline-flex; width: 16px; justify-content: center; color: var(--tb-mute); flex: none; }
.tb-menu-item.is-danger .tb-menu-icon { color: inherit; }
.tb-menu-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tb-menu-hint { font-size: .84em; color: var(--tb-mute); }
.tb-menu-sep { height: 1px; margin: 4px 6px; background: var(--tb-line); }

/* ---- dialog ---- */
.tb-mask {
  position: fixed; inset: 0; z-index: 1200;
  display: flex; align-items: center; justify-content: center; padding: 24px;
  background: color-mix(in srgb, #000 44%, transparent);
  backdrop-filter: blur(3px);
  animation: tb-fade .12s ease-out;
}
@keyframes tb-fade { from { opacity: 0; } to { opacity: 1; } }
.tb-dialog {
  width: min(580px, 100%); max-height: min(86vh, 780px);
  display: flex; flex-direction: column; overflow: hidden;
  border-radius: 16px; border: 1px solid var(--tb-line-strong);
  background: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-base, Canvas));
  box-shadow: 0 28px 80px color-mix(in srgb, #000 40%, transparent);
  animation: tb-pop .14s ease-out;
}
.tb-dialog-sm { width: min(420px, 100%); }
@keyframes tb-pop { from { transform: translateY(6px) scale(.99); opacity: .6; } to { transform: none; opacity: 1; } }
.tb-dialog-head { display: flex; align-items: center; gap: 8px; flex: none; padding: 13px 16px; border-bottom: 1px solid var(--tb-line); }
.tb-dialog-head h2 { margin: 0; flex: 1; font-size: .96em; font-weight: 600; }
.tb-dialog-body { padding: 15px 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 13px; }
.tb-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.tb-field > label { font-size: .78em; font-weight: 600; color: var(--tb-mute); letter-spacing: .02em; }
.tb-input, .tb-textarea {
  width: 100%; font: inherit; font-size: .9em; padding: 8px 11px;
  border-radius: 9px; border: 1px solid var(--tb-line);
  background: color-mix(in srgb, var(--tb-fg) 4%, var(--tb-bg));
  color: var(--tb-fg); outline: none;
}
.tb-input:focus, .tb-textarea:focus {
  border-color: color-mix(in srgb, var(--tb-accent) 62%, var(--tb-line));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--tb-accent) 14%, transparent);
}
.tb-textarea { min-height: 92px; resize: vertical; line-height: 1.55; }
.tb-seg {
  display: inline-flex; gap: 2px; padding: 3px; align-self: flex-start;
  border-radius: 9px; border: 1px solid var(--tb-line);
  background: color-mix(in srgb, var(--tb-fg) 6%, transparent);
}
.tb-seg button {
  font: inherit; font-size: .83em; padding: 5px 12px; border-radius: 7px;
  border: 0; background: transparent; color: var(--tb-mute); cursor: pointer;
}
.tb-seg button:hover { color: var(--tb-fg); }
.tb-seg button.is-on {
  background: var(--tb-bg); color: var(--tb-fg); font-weight: 600;
  box-shadow: 0 1px 3px color-mix(in srgb, #000 16%, transparent);
}
.tb-taginput {
  display: flex; flex-wrap: wrap; align-items: center; gap: 5px;
  padding: 6px 7px; border-radius: 9px; border: 1px solid var(--tb-line);
  background: color-mix(in srgb, var(--tb-fg) 4%, var(--tb-bg));
}
.tb-taginput:focus-within {
  border-color: color-mix(in srgb, var(--tb-accent) 62%, var(--tb-line));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--tb-accent) 14%, transparent);
}
.tb-taginput input {
  flex: 1; min-width: 110px; border: 0; background: transparent;
  font: inherit; font-size: .87em; color: var(--tb-fg); outline: none; padding: 3px 2px;
}
.tb-taginput .tb-tag { cursor: default; }
.tb-taginput .tb-tag button {
  border: 0; background: transparent; color: inherit; cursor: pointer;
  padding: 0; display: inline-flex; opacity: .7;
}
.tb-taginput .tb-tag button:hover { opacity: 1; }
.tb-suggest { display: flex; flex-wrap: wrap; gap: 5px; }
.tb-error { margin: 0; font-size: .8em; color: var(--tb-danger); }
.tb-dialog-foot {
  display: flex; align-items: center; gap: 8px; flex: none;
  padding: 11px 16px; border-top: 1px solid var(--tb-line);
  background: color-mix(in srgb, var(--tb-fg) 3%, transparent);
}
.tb-spacer { flex: 1; }

/* ---- narrow viewports ---- */
@media (max-width: 860px) {
  .tb-head { flex-wrap: wrap; padding: 12px 14px; gap: 10px; }
  .tb-search { order: 3; max-width: none; margin-left: 0; flex-basis: 100%; }
  .tb-body { flex-direction: column; }
  .tb-rail {
    width: auto; flex-direction: row; gap: 16px; overflow-x: auto; overflow-y: hidden;
    border-right: 0; border-bottom: 1px solid var(--tb-line);
    padding: 10px 12px; max-height: 132px;
  }
  .tb-rail-section { min-width: 190px; flex: none; }
  .tb-rail-section + .tb-rail-section { border-left: 1px solid var(--tb-line); padding-left: 16px; }
  .tb-board { padding: 12px 14px 16px; }
  .tb-toolbar, .tb-filters { padding-left: 14px; padding-right: 14px; }
}
`;

    /* ------------------------------------------------------------------ apply */

    function PanelIcon(props) {
      return h(IconBoard, { size: props.size || 16 });
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        const disposeLocale = ctx.locale.register(NS, { zh, en });
        ctx.effect(() => disposeLocale, 'dsh-todo-board: locale');
        boundT = ctx.locale.bind(NS);

        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register(
            {
              name: 'sidebar.panellist',
              id: PANEL_ID,
              order: 20,
              label: ctx.locale.resolveText
                ? ctx.locale.resolveText({ zh: '待办看板', en: 'Todo Board' })
                : '待办看板',
            },
            PanelIcon,
          ),
        );

        ctx.slots.inject('main', () =>
          ctx.slots.register(
            {
              name: 'main',
              key: PANEL_ID,
            },
            Board,
          ),
        );
      },
    };
  },
});
