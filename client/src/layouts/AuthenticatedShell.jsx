import Header from '../components/layout/Header';
import AssistantPanel from '../components/tasks/AssistantPanel';
import { useAssistantStore } from '../stores/assistantStore';

/**
 * Authenticated layout: header + scrollable main + optional AI assistant overlay.
 */
export default function AuthenticatedShell({ children }) {
  const isAssistantOpen = useAssistantStore((s) => s.isOpen);
  const closeAssistant = useAssistantStore((s) => s.close);
  const assistantWidth = 'clamp(300px, 30vw, 360px)';

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
