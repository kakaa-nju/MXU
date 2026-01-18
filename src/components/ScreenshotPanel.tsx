import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Monitor, ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';

export function ScreenshotPanel() {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);

  const handleRefresh = async (e?: React.MouseEvent) => {
    // 阻止事件冒泡，避免触发折叠
    e?.stopPropagation();
    setIsRefreshing(true);
    // TODO: 实现截图刷新逻辑
    await new Promise((resolve) => setTimeout(resolve, 500));
    setScreenshotUrl((prev) => prev);
    setIsRefreshing(false);
  };

  return (
    <div className="bg-bg-secondary rounded-lg border border-border">
      {/* 标题栏（可点击折叠） */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={clsx(
          'w-full flex items-center justify-between px-3 py-2 hover:bg-bg-hover transition-colors',
          isCollapsed ? 'rounded-lg' : 'rounded-t-lg border-b border-border'
        )}
      >
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-text-secondary" />
          <span className="text-sm font-medium text-text-primary">
            {t('screenshot.title')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* 刷新按钮 */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={clsx(
              'p-1 rounded-md transition-colors',
              isRefreshing
                ? 'text-text-muted cursor-not-allowed'
                : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
            )}
            title={t('screenshot.refresh')}
          >
            <RefreshCw
              className={clsx('w-3.5 h-3.5', isRefreshing && 'animate-spin')}
            />
          </button>
          {isCollapsed ? (
            <ChevronDown className="w-4 h-4 text-text-muted" />
          ) : (
            <ChevronUp className="w-4 h-4 text-text-muted" />
          )}
        </div>
      </button>

      {/* 可折叠内容 */}
      {!isCollapsed && (
        <div className="p-3">
          {/* 截图区域 */}
          <div className="aspect-video bg-bg-tertiary rounded-md flex items-center justify-center">
            {screenshotUrl ? (
              <img
                src={screenshotUrl}
                alt="Screenshot"
                className="w-full h-full object-contain rounded-md"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-text-muted">
                <Monitor className="w-10 h-10 opacity-30" />
                <span className="text-xs">{t('screenshot.noScreenshot')}</span>
                <button
                  onClick={() => handleRefresh()}
                  className="text-xs text-accent hover:underline"
                >
                  {t('screenshot.clickToRefresh')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
