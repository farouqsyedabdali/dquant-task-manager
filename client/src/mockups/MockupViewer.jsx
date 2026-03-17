import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { MOCKUPS, getMockupByPath, getCategories } from './index';

/**
 * Mockup Viewer – Browse and view design mockups
 * Route: /mockups (list) and /mockups/:mockupPath (view mockup)
 */
function MockupList() {
  const navigate = useNavigate();
  const categories = getCategories();

  const featuredMockup = MOCKUPS.find((m) => m.path === 'landing-page');
  const otherMockups = MOCKUPS.filter((m) => m.path !== 'landing-page');

  return (
    <div
      className="min-h-screen p-8"
      style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
    >
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Design Mockups</h1>
        <p className="mb-10" style={{ color: 'var(--color-text-secondary)' }}>
          Click any mockup to preview. Functional forms, modals, and interactions.
        </p>

        {/* Featured: Landing Page */}
        {featuredMockup && (
          <div className="mb-12">
            <h2 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
              Featured
            </h2>
            <button
              onClick={() => navigate(`/mockups/${featuredMockup.path}`)}
              className="w-full text-left p-8 rounded-2xl border-2 transition-all hover:shadow-xl hover:scale-[1.01]"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-primary)',
              }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-medium px-2 py-1 rounded" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                    Full page
                  </span>
                  <h2 className="text-2xl font-bold mt-3 mb-2">{featuredMockup.label}</h2>
                  <p className="text-base" style={{ color: 'var(--color-text-secondary)' }}>
                    {featuredMockup.description}
                  </p>
                </div>
                <span className="text-3xl opacity-70">→</span>
              </div>
            </button>
          </div>
        )}

        {/* All mockups by category */}
        {categories.filter((c) => c !== 'Landing' || !featuredMockup).map((category) => {
          const items = (category === 'Landing' && featuredMockup ? otherMockups : MOCKUPS).filter(
            (m) => m.category === category
          );
          if (items.length === 0) return null;
          return (
            <div key={category} className="mb-10">
              <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
                {category}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {items.map((mockup) => (
                  <button
                    key={mockup.id}
                    onClick={() => navigate(`/mockups/${mockup.path}`)}
                    className="w-full text-left p-6 rounded-xl border transition-all hover:shadow-md hover:scale-[1.01]"
                    style={{
                      backgroundColor: 'var(--color-bg-secondary)',
                      borderColor: 'var(--color-border-default)',
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold mb-1">{mockup.label}</h3>
                        <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                          {mockup.description}
                        </p>
                      </div>
                      <span className="text-xl opacity-50">→</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MockupPreview() {
  const { mockupPath } = useParams();
  const navigate = useNavigate();
  const mockup = getMockupByPath(mockupPath);
  const Component = mockup?.component;

  if (!mockup || !Component) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-8"
        style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
      >
        <h1 className="text-2xl font-bold mb-4">Mockup not found</h1>
        <button
          onClick={() => navigate('/mockups')}
          className="px-4 py-2 rounded-lg"
          style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
        >
          Back to mockups
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Floating back button - minimal footprint, doesn't cover mockup content */}
      <button
        onClick={() => navigate('/mockups')}
        className="fixed top-4 left-4 z-[100] flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm shadow-lg transition-all hover:scale-105"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          color: 'var(--color-text-primary)',
          borderWidth: 1,
          borderColor: 'var(--color-border-default)',
        }}
      >
        ← Back
      </button>

      {/* Mockup content - full viewport, no padding */}
      <div className="mockup-content">
        <Component />
      </div>
    </div>
  );
}

export default function MockupViewer() {
  return (
    <Routes>
      <Route index element={<MockupList />} />
      <Route path=":mockupPath" element={<MockupPreview />} />
    </Routes>
  );
}
