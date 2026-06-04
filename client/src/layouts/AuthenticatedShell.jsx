import Header from '../components/layout/Header';
import AssistantPanel from '../components/tasks/AssistantPanel';
import { useAssistantStore } from '../stores/assistantStore';

/**
 * Authenticated layout: header + scrollable main + optional AI assistant overlay.
 */
export default function AuthenticatedShell({ children }) {
  const isAssistantOpen = useAssistantStore((s) => s.isOpen);
  const closeAssistant = useAssistantStore((s) => s.close);
  const width = useAssistantStore((s) => s.width || 360);
  const setWidth = useAssistantStore((s) => s.setWidth);
  const assistantWidth = `${width}px`;

  const handleMouseDown = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (moveEvent) => {
      const deltaX = startX - moveEvent.clientX;
      const newWidth = startWidth + deltaX;
      // Cap dynamically between 300px and 45vw or 600px
      const maxW = Math.min(600, window.innerWidth * 0.45);
      setWidth(Math.max(300, Math.min(maxW, newWidth)));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <>
      {/* h-screen + overflow-hidden: main scrolls inside; assistant rail stays viewport height */}
      <div
        className="h-[100dvh] min-h-0 flex flex-col overflow-hidden"
        style={{ backgroundColor: 'var(--color-bg-primary)' }}
      >
        <Header />
        <div className="flex flex-1 min-h-0 overflow-hidden pt-16">
          <div
            className="flex-1 min-w-0 min-h-0 overflow-y-auto overflow-x-hidden transition-[padding] duration-200 md:pr-[calc(var(--assistant-width)+12px)]"
            style={{
              '--assistant-width': isAssistantOpen ? assistantWidth : '0px',
            }}
          >
            {children}
          </div>
          {isAssistantOpen && (
            <aside
              className="hidden md:flex fixed right-0 top-16 bottom-0 z-40 flex-col border-l min-h-0 overflow-hidden shadow-2xl"
              style={{
                width: assistantWidth,
                borderColor: 'var(--color-border-default)',
                backgroundColor: 'var(--color-bg-secondary)',
              }}
              aria-label="AI Assistant"
            >
              {/* Resizable drag handle on the left edge */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-500/20 active:bg-indigo-500/40 transition-colors z-50 flex items-center justify-center"
                onMouseDown={handleMouseDown}
                title="Drag to resize panel"
              >
                <div className="w-[1px] h-8 bg-neutral-400 opacity-50 rounded-full" />
              </div>
              <AssistantPanel layout="rail" onClose={closeAssistant} />
            </aside>
          )}
        </div>
      </div>

      {/* Mobile: bottom sheet */}
      {isAssistantOpen && (
        <div className="md:hidden fixed inset-0 z-[45] flex flex-col justify-end pointer-events-none">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 pointer-events-auto"
            aria-label="Close assistant"
            onClick={closeAssistant}
          />
          <div
            className="relative z-10 h-[85dvh] max-h-[92dvh] rounded-t-2xl border-t flex flex-col min-h-0 overflow-hidden shadow-2xl pointer-events-auto mx-0"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border-default)',
            }}
          >
            <AssistantPanel layout="sheet" onClose={closeAssistant} />
          </div>
        </div>
      )}
    </>
  );
}
