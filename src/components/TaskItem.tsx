import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ChevronsUp,
  ChevronsDown,
  Check,
  X,
  Copy,
  Edit3,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { OptionEditor } from './OptionEditor';
import { ContextMenu, useContextMenu, type MenuItem } from './ContextMenu';
import type { SelectedTask } from '@/types/interface';
import clsx from 'clsx';

/** 选项预览标签组件 */
function OptionPreviewTag({ 
  label, 
  value, 
  type 
}: { 
  label: string; 
  value: string; 
  type: 'select' | 'switch' | 'input';
}) {
  // 截断过长的显示值
  const truncateText = (text: string, max: number) => 
    text.length > max ? text.slice(0, max) + '…' : text;
  
  return (
    <span 
      className={clsx(
        'inline-flex items-center gap-1 px-1.5 py-0.5 text-xs rounded',
        'text-text-tertiary',
        'max-w-[140px]'
      )}
      title={`${label}: ${value}`}
    >
      {type === 'switch' ? (
        // Switch 类型：显示选项名 + 状态圆点
        <>
          <span className="truncate">{truncateText(label, 6)}</span>
          <span className={clsx(
            'w-1.5 h-1.5 rounded-full flex-shrink-0',
            value === 'ON' ? 'bg-success/70' : 'bg-text-muted/50'
          )} />
        </>
      ) : (
        // Select/Input 类型：显示选项名: 值
        <>
          <span className="truncate flex-shrink-0">{truncateText(label, 4)}</span>
          <span className="flex-shrink-0">:</span>
          <span className="truncate">{truncateText(value, 6)}</span>
        </>
      )}
    </span>
  );
}

interface TaskItemProps {
  instanceId: string;
  task: SelectedTask;
}

export function TaskItem({ instanceId, task }: TaskItemProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  
  const {
    projectInterface,
    toggleTaskEnabled,
    toggleTaskExpanded,
    removeTaskFromInstance,
    renameTask,
    duplicateTask,
    moveTaskUp,
    moveTaskDown,
    moveTaskToTop,
    moveTaskToBottom,
    resolveI18nText,
    language,
    getActiveInstance,
    showOptionPreview,
  } = useAppStore();

  const { state: menuState, show: showMenu, hide: hideMenu } = useContextMenu();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const taskDef = projectInterface?.task.find(t => t.name === task.taskName);
  if (!taskDef) return null;

  const langKey = language === 'zh-CN' ? 'zh_cn' : 'en_us';
  const originalLabel = resolveI18nText(taskDef.label, langKey) || taskDef.name;
  const displayName = task.customName || originalLabel;
  const hasOptions = taskDef.option && taskDef.option.length > 0;

  // 生成选项预览信息（最多显示3个）
  const optionPreviews = useMemo(() => {
    if (!hasOptions || !projectInterface?.option) return [];
    
    const previews: { key: string; label: string; value: string; type: 'select' | 'switch' | 'input' }[] = [];
    const maxPreviews = 3;
    
    for (const optionKey of taskDef.option || []) {
      if (previews.length >= maxPreviews) break;
      
      const optionDef = projectInterface.option[optionKey];
      if (!optionDef) continue;
      
      const optionLabel = resolveI18nText(optionDef.label, langKey) || optionKey;
      const optionValue = task.optionValues[optionKey];
      
      if (optionDef.type === 'switch') {
        const isOn = optionValue?.type === 'switch' ? optionValue.value : false;
        previews.push({
          key: optionKey,
          label: optionLabel,
          value: isOn ? 'ON' : 'OFF',
          type: 'switch',
        });
      } else if (optionDef.type === 'input') {
        const inputValues = optionValue?.type === 'input' ? optionValue.values : {};
        // 获取第一个有值的输入项
        const firstInput = optionDef.inputs[0];
        if (firstInput) {
          const inputValue = inputValues[firstInput.name] || firstInput.default || '';
          if (inputValue) {
            previews.push({
              key: optionKey,
              label: optionLabel,
              value: inputValue,
              type: 'input',
            });
          }
        }
      } else {
        // select 类型（默认）
        const caseName = optionValue?.type === 'select' 
          ? optionValue.caseName 
          : optionDef.default_case || optionDef.cases?.[0]?.name || '';
        const selectedCase = optionDef.cases?.find(c => c.name === caseName);
        const caseLabel = selectedCase 
          ? (resolveI18nText(selectedCase.label, langKey) || selectedCase.name)
          : caseName;
        previews.push({
          key: optionKey,
          label: optionLabel,
          value: caseLabel,
          type: 'select',
        });
      }
    }
    
    return previews;
  }, [hasOptions, projectInterface?.option, taskDef.option, task.optionValues, langKey, resolveI18nText]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditName(task.customName || '');
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    renameTask(instanceId, task.id, editName.trim());
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // 右键菜单处理
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const instance = getActiveInstance();
      if (!instance) return;

      const tasks = instance.selectedTasks;
      const taskIndex = tasks.findIndex((t) => t.id === task.id);
      const isFirst = taskIndex === 0;
      const isLast = taskIndex === tasks.length - 1;

      const menuItems: MenuItem[] = [
        {
          id: 'duplicate',
          label: t('contextMenu.duplicateTask'),
          icon: Copy,
          onClick: () => duplicateTask(instanceId, task.id),
        },
        {
          id: 'rename',
          label: t('contextMenu.renameTask'),
          icon: Edit3,
          onClick: () => {
            setEditName(task.customName || '');
            setIsEditing(true);
          },
        },
        { id: 'divider-1', label: '', divider: true },
        {
          id: 'toggle',
          label: task.enabled
            ? t('contextMenu.disableTask')
            : t('contextMenu.enableTask'),
          icon: task.enabled ? ToggleLeft : ToggleRight,
          onClick: () => toggleTaskEnabled(instanceId, task.id),
        },
        ...(hasOptions
          ? [
              {
                id: 'expand',
                label: task.expanded
                  ? t('contextMenu.collapseOptions')
                  : t('contextMenu.expandOptions'),
                icon: task.expanded ? ChevronUp : ChevronDown,
                onClick: () => toggleTaskExpanded(instanceId, task.id),
              },
            ]
          : []),
        { id: 'divider-2', label: '', divider: true },
        {
          id: 'move-up',
          label: t('contextMenu.moveUp'),
          icon: ChevronUp,
          disabled: isFirst,
          onClick: () => moveTaskUp(instanceId, task.id),
        },
        {
          id: 'move-down',
          label: t('contextMenu.moveDown'),
          icon: ChevronDown,
          disabled: isLast,
          onClick: () => moveTaskDown(instanceId, task.id),
        },
        {
          id: 'move-top',
          label: t('contextMenu.moveToTop'),
          icon: ChevronsUp,
          disabled: isFirst,
          onClick: () => moveTaskToTop(instanceId, task.id),
        },
        {
          id: 'move-bottom',
          label: t('contextMenu.moveToBottom'),
          icon: ChevronsDown,
          disabled: isLast,
          onClick: () => moveTaskToBottom(instanceId, task.id),
        },
        { id: 'divider-3', label: '', divider: true },
        {
          id: 'delete',
          label: t('contextMenu.deleteTask'),
          icon: Trash2,
          danger: true,
          onClick: () => removeTaskFromInstance(instanceId, task.id),
        },
      ];

      showMenu(e, menuItems);
    },
    [
      t,
      task,
      instanceId,
      hasOptions,
      getActiveInstance,
      duplicateTask,
      toggleTaskEnabled,
      toggleTaskExpanded,
      moveTaskUp,
      moveTaskDown,
      moveTaskToTop,
      moveTaskToBottom,
      removeTaskFromInstance,
      showMenu,
    ]
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      onContextMenu={handleContextMenu}
      className={clsx(
        'group bg-bg-secondary rounded-lg border border-border overflow-hidden transition-shadow',
        isDragging && 'shadow-lg opacity-50'
      )}
    >
      {/* 任务头部 */}
      <div className="flex items-center gap-2 p-3">
        {/* 拖拽手柄 */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-bg-hover"
        >
          <GripVertical className="w-4 h-4 text-text-muted" />
        </div>

        {/* 启用复选框 */}
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={task.enabled}
            onChange={() => toggleTaskEnabled(instanceId, task.id)}
            className="w-4 h-4 rounded border-border-strong accent-accent"
          />
        </label>

        {/* 任务名称 + 展开区域容器 */}
        <div className="flex-1 flex items-center min-w-0">
          {isEditing ? (
            <div className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSaveEdit}
                placeholder={originalLabel}
                autoFocus
                className={clsx(
                  'flex-1 px-2 py-1 text-sm rounded border border-accent',
                  'bg-bg-primary text-text-primary',
                  'focus:outline-none focus:ring-1 focus:ring-accent/20'
                )}
              />
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSaveEdit();
                }}
                className="p-1 rounded hover:bg-success/10 text-success"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCancelEdit();
                }}
                className="p-1 rounded hover:bg-error/10 text-error"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              {/* 任务名称 */}
              <div 
                className="flex items-center gap-1 min-w-0 cursor-pointer flex-shrink-0"
                onDoubleClick={handleDoubleClick}
                title={t('taskItem.rename')}
              >
                <span
                  className={clsx(
                    'text-sm font-medium truncate',
                    task.enabled ? 'text-text-primary' : 'text-text-muted'
                  )}
                >
                  {displayName}
                </span>
                {task.customName && (
                  <span className="flex-shrink-0 text-xs text-text-muted">
                    ({originalLabel})
                  </span>
                )}
              </div>

              {/* 展开/折叠点击区域（包含选项预览） */}
              {hasOptions && (
                <div
                  onClick={() => toggleTaskExpanded(instanceId, task.id)}
                  className="flex-1 flex items-center cursor-pointer self-stretch min-h-[28px]"
                  title={task.expanded ? t('taskItem.collapse') : t('taskItem.expand')}
                >
                  {/* 选项预览标签 - 未展开时显示 */}
                  {showOptionPreview && !task.expanded && optionPreviews.length > 0 && (
                    <div className="flex-1 flex items-center gap-1.5 mx-2 overflow-hidden">
                      {optionPreviews.map((preview) => (
                        <OptionPreviewTag
                          key={preview.key}
                          label={preview.label}
                          value={preview.value}
                          type={preview.type}
                        />
                      ))}
                    </div>
                  )}
                  {/* 展开/折叠箭头 */}
                  <div className="flex items-center justify-end pl-2 ml-auto">
                    {task.expanded ? (
                      <ChevronDown className="w-4 h-4 text-text-secondary" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-text-secondary" />
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* 删除按钮 - hover 时显示 */}
        {!isEditing && (
          <button
            onClick={() => removeTaskFromInstance(instanceId, task.id)}
            className={clsx(
              'p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity',
              'hover:bg-bg-active'
            )}
            title={t('taskItem.remove')}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 选项面板 */}
      {hasOptions && task.expanded && (
        <div className="border-t border-border bg-bg-tertiary p-3">
          <div className="space-y-3">
            {taskDef.option?.map((optionKey) => (
              <OptionEditor
                key={optionKey}
                instanceId={instanceId}
                taskId={task.id}
                optionKey={optionKey}
                value={task.optionValues[optionKey]}
              />
            ))}
          </div>
        </div>
      )}

      {/* 右键菜单 */}
      {menuState.isOpen && (
        <ContextMenu
          items={menuState.items}
          position={menuState.position}
          onClose={hideMenu}
        />
      )}
    </div>
  );
}
