import { useState, useEffect } from 'react';
import { termsOfService, privacyPolicy } from '../../data/legalDocuments';

const LegalDocumentModal = ({ isOpen, onClose, documentType }) => {
  const [activeSection, setActiveSection] = useState(0);
  
  const document = documentType === 'terms' ? termsOfService : privacyPolicy;

  // Scroll to section when clicked from TOC
  const scrollToSection = (index) => {
    setActiveSection(index);
    const element = window.document.getElementById(`section-${index}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    window.document.addEventListener('keydown', handleEscape);
    // Prevent body scroll when modal is open
    window.document.body.style.overflow = 'hidden';
    
    return () => {
      window.document.removeEventListener('keydown', handleEscape);
      window.document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-6xl max-h-[90vh] rounded-lg shadow-2xl flex flex-col md:flex-row overflow-hidden"
        style={{
          backgroundColor: 'var(--color-bg-primary)',
          borderColor: 'var(--color-border-default)',
          borderWidth: '1px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Mobile */}
        <div 
          className="md:hidden flex items-center justify-between p-4 border-b"
          style={{ borderColor: 'var(--color-border-default)' }}
        >
          <div>
            <h2 
              className="text-xl font-bold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {document.title}
            </h2>
            <p 
              className="text-xs mt-1"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              Last updated: {document.lastUpdated}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
            aria-label="Close modal"
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Sidebar - Table of Contents (Desktop) */}
        <aside 
          className="hidden md:block w-80 border-r overflow-y-auto"
          style={{ 
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border-default)'
          }}
        >
          <div className="p-6 sticky top-0" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 
                  className="text-xl font-bold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {document.title}
                </h2>
                <p 
                  className="text-xs mt-1"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  Last updated: {document.lastUpdated}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                aria-label="Close modal"
              >
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div 
              className="h-px mb-4"
              style={{ backgroundColor: 'var(--color-border-default)' }}
            />
            
            <h3 
              className="text-sm font-semibold mb-3 uppercase tracking-wider"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              Table of Contents
            </h3>
            
            <nav className="space-y-1">
              {document.sections.map((section, index) => (
                <button
                  key={index}
                  onClick={() => scrollToSection(index)}
                  className="w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-200"
                  style={
                    activeSection === index
                      ? {
                          backgroundColor: 'var(--color-primary)',
                          color: '#ffffff',
                        }
                      : {
                          color: 'var(--color-text-secondary)',
                          backgroundColor: 'transparent',
                        }
                  }
                  onMouseEnter={(e) => {
                    if (activeSection !== index) {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeSection !== index) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {section.title}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-8 max-w-4xl">
            {/* Header for desktop (within content area) */}
            <div className="hidden md:block mb-8">
              <h1 
                className="text-3xl font-bold mb-2"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {document.title}
              </h1>
              <p 
                className="text-sm"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                Last updated: {document.lastUpdated}
              </p>
            </div>

            {/* Sections */}
            <div className="space-y-8">
              {document.sections.map((section, index) => (
                <section 
                  key={index} 
                  id={`section-${index}`}
                  className="scroll-mt-4"
                >
                  <h2 
                    className="text-xl font-bold mb-4"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {section.title}
                  </h2>
                  <div 
                    className="prose prose-sm max-w-none leading-relaxed whitespace-pre-line"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {section.content}
                  </div>
                </section>
              ))}
            </div>

            {/* Footer */}
            <div 
              className="mt-12 pt-6 border-t"
              style={{ borderColor: 'var(--color-border-default)' }}
            >
              <p 
                className="text-sm text-center"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                If you have any questions about this {document.title.toLowerCase()}, please contact us at{' '}
                <a 
                  href={documentType === 'terms' ? 'mailto:legal@tialz.com' : 'mailto:privacy@tialz.com'}
                  className="underline hover:opacity-80 transition-opacity"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {documentType === 'terms' ? 'legal@tialz.com' : 'privacy@tialz.com'}
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Close button - Mobile floating */}
        <button
          onClick={onClose}
          className="md:hidden fixed bottom-6 right-6 p-4 rounded-full shadow-lg transition-transform hover:scale-110"
          style={{ 
            backgroundColor: 'var(--color-primary)',
            color: '#ffffff'
          }}
          aria-label="Close modal"
        >
          <svg 
            className="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default LegalDocumentModal;
