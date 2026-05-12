import AssistantPanel from './AssistantPanel';

/**
 * Legacy full-screen modal wrapper — prefer AuthenticatedShell + AssistantPanel rail/sheet.
 */
const AIModal = ({ isOpen, onClose, onAction }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden />
      <div className="absolute inset-0 flex items-end sm:items-center justify-center p-3 sm:p-4 pointer-events-none">
        <div className="pointer-events-auto w-full flex justify-center max-w-3xl">
          <AssistantPanel layout="modal" onClose={onClose} onAction={onAction} />
        </div>
      </div>
    </div>
  );
};

export default AIModal;
