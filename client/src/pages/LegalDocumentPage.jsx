import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { termsOfService, privacyPolicy } from '../data/legalDocuments';

const LegalDocumentPage = ({ documentType }) => {
  const [activeSection, setActiveSection] = useState(0);
  const navigate = useNavigate();

  const document = documentType === 'terms' ? termsOfService : privacyPolicy;

  // Scroll to section when clicked from TOC
  const scrollToSection = (index) => {
    setActiveSection(index);
    const element = window.document.getElementById(`section-${index}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [documentType]);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--color-bg-primary)' }}
    >
      {/* Top bar */}
      <div
        className="sticky top-0 z-10 border-b px-6 py-3 flex items-center justify-between"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border-default)',
        }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:opacity-80 transition-opacity"
            style={{ color: 'var(--color-text-secondary)' }}
            aria-label="Go back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1
              className="text-lg font-bold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {document.title}
            </h1>
            <p
              className="text-xs"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              Last updated: {document.lastUpdated}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(documentType === 'terms' ? '/privacy-policy' : '/terms-of-service')}
            className="text-sm px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
            style={{
              color: 'var(--color-primary)',
              backgroundColor: 'var(--color-bg-tertiary)',
            }}
          >
            {documentType === 'terms' ? 'Privacy Policy' : 'Terms of Service'}
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar - Table of Contents (Desktop) */}
        <aside
          className="hidden md:block w-80 border-r sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto flex-shrink-0"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border-default)',
          }}
        >
          <div className="p-6">
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
          <div className="p-6 md:p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
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
                  className="scroll-mt-20"
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
      </div>
    </div>
  );
};

export default LegalDocumentPage;
