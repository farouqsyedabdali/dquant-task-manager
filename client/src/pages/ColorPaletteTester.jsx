import { useState } from 'react';
import useThemeStore from '../stores/themeStore';

const ColorPaletteTester = () => {
  const { theme, setTheme } = useThemeStore();
  const [selectedPalette, setSelectedPalette] = useState(null);

  // Color palettes for Light Mode
  const lightPalettes = [
    {
      id: 'light-1',
      name: 'Classic Light (Current)',
      description: 'Clean white with subtle grays',
      colors: {
        '--color-bg-primary': '#ffffff',
        '--color-bg-secondary': '#f9fafb',
        '--color-bg-tertiary': '#f3f4f6',
        '--color-bg-quaternary': '#e5e7eb',
        '--color-text-primary': '#111827',
        '--color-text-secondary': '#6b7280',
        '--color-text-tertiary': '#9ca3af',
        '--color-border-default': '#e5e7eb',
        '--color-border-light': '#d1d5db',
        '--color-primary': '#6366f1',
        '--color-primary-hover': '#4f46e5',
      }
    },
    {
      id: 'light-2',
      name: 'Warm Cream',
      description: 'Soft cream backgrounds with warm tones',
      colors: {
        '--color-bg-primary': '#fefdfb',
        '--color-bg-secondary': '#faf8f5',
        '--color-bg-tertiary': '#f5f2ed',
        '--color-bg-quaternary': '#ebe7e0',
        '--color-text-primary': '#1a1614',
        '--color-text-secondary': '#6b6560',
        '--color-text-tertiary': '#9c9690',
        '--color-border-default': '#e5dfd5',
        '--color-border-light': '#d4cdc0',
        '--color-primary': '#d97706',
        '--color-primary-hover': '#b45309',
      }
    },
    {
      id: 'light-3',
      name: 'Cool Blue',
      description: 'Professional blue-tinted backgrounds',
      colors: {
        '--color-bg-primary': '#f8fafc',
        '--color-bg-secondary': '#f1f5f9',
        '--color-bg-tertiary': '#e2e8f0',
        '--color-bg-quaternary': '#cbd5e1',
        '--color-text-primary': '#0f172a',
        '--color-text-secondary': '#475569',
        '--color-text-tertiary': '#94a3b8',
        '--color-border-default': '#e2e8f0',
        '--color-border-light': '#cbd5e1',
        '--color-primary': '#0ea5e9',
        '--color-primary-hover': '#0284c7',
      }
    },
    {
      id: 'light-4',
      name: 'Soft Purple',
      description: 'Elegant purple-tinted workspace',
      colors: {
        '--color-bg-primary': '#faf5ff',
        '--color-bg-secondary': '#f5f3ff',
        '--color-bg-tertiary': '#ede9fe',
        '--color-bg-quaternary': '#ddd6fe',
        '--color-text-primary': '#1e1b4b',
        '--color-text-secondary': '#6366f1',
        '--color-text-tertiary': '#a78bfa',
        '--color-border-default': '#e9d5ff',
        '--color-border-light': '#d8b4fe',
        '--color-primary': '#8b5cf6',
        '--color-primary-hover': '#7c3aed',
      }
    },
    {
      id: 'light-5',
      name: 'Mint Fresh',
      description: 'Refreshing green-tinted interface',
      colors: {
        '--color-bg-primary': '#f0fdf4',
        '--color-bg-secondary': '#dcfce7',
        '--color-bg-tertiary': '#bbf7d0',
        '--color-bg-quaternary': '#86efac',
        '--color-text-primary': '#14532d',
        '--color-text-secondary': '#166534',
        '--color-text-tertiary': '#22c55e',
        '--color-border-default': '#bbf7d0',
        '--color-border-light': '#86efac',
        '--color-primary': '#10b981',
        '--color-primary-hover': '#059669',
      }
    },
    {
      id: 'light-6',
      name: 'Monochrome Light',
      description: 'Pure grayscale, high contrast',
      colors: {
        '--color-bg-primary': '#ffffff',
        '--color-bg-secondary': '#fafafa',
        '--color-bg-tertiary': '#f4f4f5',
        '--color-bg-quaternary': '#e4e4e7',
        '--color-text-primary': '#09090b',
        '--color-text-secondary': '#52525b',
        '--color-text-tertiary': '#a1a1aa',
        '--color-border-default': '#e4e4e7',
        '--color-border-light': '#d4d4d8',
        '--color-primary': '#18181b',
        '--color-primary-hover': '#27272a',
      }
    },
    {
      id: 'light-7',
      name: 'Sunset Orange',
      description: 'Energetic orange-tinted workspace',
      colors: {
        '--color-bg-primary': '#fff7ed',
        '--color-bg-secondary': '#ffedd5',
        '--color-bg-tertiary': '#fed7aa',
        '--color-bg-quaternary': '#fdba74',
        '--color-text-primary': '#7c2d12',
        '--color-text-secondary': '#9a3412',
        '--color-text-tertiary': '#ea580c',
        '--color-border-default': '#fed7aa',
        '--color-border-light': '#fdba74',
        '--color-primary': '#f97316',
        '--color-primary-hover': '#ea580c',
      }
    },
    {
      id: 'light-8',
      name: 'Rose Garden',
      description: 'Soft pink-tinted elegance',
      colors: {
        '--color-bg-primary': '#fff1f2',
        '--color-bg-secondary': '#ffe4e6',
        '--color-bg-tertiary': '#fecdd3',
        '--color-bg-quaternary': '#fda4af',
        '--color-text-primary': '#881337',
        '--color-text-secondary': '#9f1239',
        '--color-text-tertiary': '#e11d48',
        '--color-border-default': '#fecdd3',
        '--color-border-light': '#fda4af',
        '--color-primary': '#f43f5e',
        '--color-primary-hover': '#e11d48',
      }
    },
    {
      id: 'light-9',
      name: 'Ocean Breeze',
      description: 'Calm teal and cyan tones',
      colors: {
        '--color-bg-primary': '#ecfeff',
        '--color-bg-secondary': '#cffafe',
        '--color-bg-tertiary': '#a5f3fc',
        '--color-bg-quaternary': '#67e8f9',
        '--color-text-primary': '#164e63',
        '--color-text-secondary': '#155e75',
        '--color-text-tertiary': '#0891b2',
        '--color-border-default': '#a5f3fc',
        '--color-border-light': '#67e8f9',
        '--color-primary': '#06b6d4',
        '--color-primary-hover': '#0891b2',
      }
    },
    {
      id: 'light-10',
      name: 'Lavender Dream',
      description: 'Soft lavender workspace',
      colors: {
        '--color-bg-primary': '#faf5ff',
        '--color-bg-secondary': '#f3e8ff',
        '--color-bg-tertiary': '#e9d5ff',
        '--color-bg-quaternary': '#d8b4fe',
        '--color-text-primary': '#581c87',
        '--color-text-secondary': '#6b21a8',
        '--color-text-tertiary': '#9333ea',
        '--color-border-default': '#e9d5ff',
        '--color-border-light': '#d8b4fe',
        '--color-primary': '#a855f7',
        '--color-primary-hover': '#9333ea',
      }
    },
  ];

  // Color palettes for Dark Mode
  const darkPalettes = [
    {
      id: 'dark-1',
      name: 'Pure Black (Current)',
      description: 'Deep black with subtle grays',
      colors: {
        '--color-bg-primary': '#0a0a0a',
        '--color-bg-secondary': '#141414',
        '--color-bg-tertiary': '#1a1a1a',
        '--color-bg-quaternary': '#242424',
        '--color-text-primary': '#ffffff',
        '--color-text-secondary': '#b3b3b3',
        '--color-text-tertiary': '#808080',
        '--color-border-default': '#2a2a2a',
        '--color-border-light': '#333333',
        '--color-primary': '#6366f1',
        '--color-primary-hover': '#818cf8',
      }
    },
    {
      id: 'dark-2',
      name: 'Slate Gray',
      description: 'Professional slate backgrounds',
      colors: {
        '--color-bg-primary': '#0f172a',
        '--color-bg-secondary': '#1e293b',
        '--color-bg-tertiary': '#334155',
        '--color-bg-quaternary': '#475569',
        '--color-text-primary': '#f8fafc',
        '--color-text-secondary': '#cbd5e1',
        '--color-text-tertiary': '#94a3b8',
        '--color-border-default': '#334155',
        '--color-border-light': '#475569',
        '--color-primary': '#38bdf8',
        '--color-primary-hover': '#0ea5e9',
      }
    },
    {
      id: 'dark-3',
      name: 'Midnight Blue',
      description: 'Deep blue darkness',
      colors: {
        '--color-bg-primary': '#0c1222',
        '--color-bg-secondary': '#111827',
        '--color-bg-tertiary': '#1f2937',
        '--color-bg-quaternary': '#374151',
        '--color-text-primary': '#f9fafb',
        '--color-text-secondary': '#d1d5db',
        '--color-text-tertiary': '#9ca3af',
        '--color-border-default': '#1f2937',
        '--color-border-light': '#374151',
        '--color-primary': '#3b82f6',
        '--color-primary-hover': '#2563eb',
      }
    },
    {
      id: 'dark-4',
      name: 'Forest Night',
      description: 'Dark green-tinted ambiance',
      colors: {
        '--color-bg-primary': '#0a120f',
        '--color-bg-secondary': '#14211a',
        '--color-bg-tertiary': '#1e2f25',
        '--color-bg-quaternary': '#2d4a38',
        '--color-text-primary': '#ecfdf5',
        '--color-text-secondary': '#a7f3d0',
        '--color-text-tertiary': '#6ee7b7',
        '--color-border-default': '#1e2f25',
        '--color-border-light': '#2d4a38',
        '--color-primary': '#10b981',
        '--color-primary-hover': '#34d399',
      }
    },
    {
      id: 'dark-5',
      name: 'Purple Haze',
      description: 'Rich purple darkness',
      colors: {
        '--color-bg-primary': '#1e1b4b',
        '--color-bg-secondary': '#312e81',
        '--color-bg-tertiary': '#3730a3',
        '--color-bg-quaternary': '#4338ca',
        '--color-text-primary': '#f5f3ff',
        '--color-text-secondary': '#ddd6fe',
        '--color-text-tertiary': '#c4b5fd',
        '--color-border-default': '#3730a3',
        '--color-border-light': '#4338ca',
        '--color-primary': '#8b5cf6',
        '--color-primary-hover': '#a78bfa',
      }
    },
    {
      id: 'dark-6',
      name: 'Charcoal',
      description: 'Warm charcoal tones',
      colors: {
        '--color-bg-primary': '#1c1917',
        '--color-bg-secondary': '#292524',
        '--color-bg-tertiary': '#44403c',
        '--color-bg-quaternary': '#57534e',
        '--color-text-primary': '#fafaf9',
        '--color-text-secondary': '#d6d3d1',
        '--color-text-tertiary': '#a8a29e',
        '--color-border-default': '#44403c',
        '--color-border-light': '#57534e',
        '--color-primary': '#f97316',
        '--color-primary-hover': '#fb923c',
      }
    },
    {
      id: 'dark-7',
      name: 'Deep Ocean',
      description: 'Dark teal depths',
      colors: {
        '--color-bg-primary': '#042f2e',
        '--color-bg-secondary': '#134e4a',
        '--color-bg-tertiary': '#115e59',
        '--color-bg-quaternary': '#0f766e',
        '--color-text-primary': '#f0fdfa',
        '--color-text-secondary': '#99f6e4',
        '--color-text-tertiary': '#5eead4',
        '--color-border-default': '#115e59',
        '--color-border-light': '#0f766e',
        '--color-primary': '#14b8a6',
        '--color-primary-hover': '#2dd4bf',
      }
    },
    {
      id: 'dark-8',
      name: 'Crimson Night',
      description: 'Dark red ambiance',
      colors: {
        '--color-bg-primary': '#1a0a0e',
        '--color-bg-secondary': '#2d1519',
        '--color-bg-tertiary': '#3f1f24',
        '--color-bg-quaternary': '#5c2a30',
        '--color-text-primary': '#fff1f2',
        '--color-text-secondary': '#fecdd3',
        '--color-text-tertiary': '#fda4af',
        '--color-border-default': '#3f1f24',
        '--color-border-light': '#5c2a30',
        '--color-primary': '#f43f5e',
        '--color-primary-hover': '#fb7185',
      }
    },
    {
      id: 'dark-9',
      name: 'Amber Glow',
      description: 'Warm amber darkness',
      colors: {
        '--color-bg-primary': '#1c1410',
        '--color-bg-secondary': '#2c1f1a',
        '--color-bg-tertiary': '#3d2b23',
        '--color-bg-quaternary': '#52362c',
        '--color-text-primary': '#fffbeb',
        '--color-text-secondary': '#fde68a',
        '--color-text-tertiary': '#fcd34d',
        '--color-border-default': '#3d2b23',
        '--color-border-light': '#52362c',
        '--color-primary': '#f59e0b',
        '--color-primary-hover': '#fbbf24',
      }
    },
    {
      id: 'dark-10',
      name: 'Monochrome Dark',
      description: 'Pure grayscale darkness',
      colors: {
        '--color-bg-primary': '#000000',
        '--color-bg-secondary': '#0a0a0a',
        '--color-bg-tertiary': '#171717',
        '--color-bg-quaternary': '#262626',
        '--color-text-primary': '#fafafa',
        '--color-text-secondary': '#d4d4d4',
        '--color-text-tertiary': '#a3a3a3',
        '--color-border-default': '#171717',
        '--color-border-light': '#262626',
        '--color-primary': '#ffffff',
        '--color-primary-hover': '#e5e5e5',
      }
    },
  ];

  const applyPalette = (palette) => {
    const root = document.documentElement;
    Object.entries(palette.colors).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    setSelectedPalette(palette.id);
  };

  const resetToDefault = () => {
    const root = document.documentElement;
    // Remove inline styles to revert to CSS defaults
    Object.keys(lightPalettes[0].colors).forEach((key) => {
      root.style.removeProperty(key);
    });
    setSelectedPalette(null);
  };

  const palettes = theme === 'dark' ? darkPalettes : lightPalettes;

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Color Palette Tester
          </h1>
          <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
            Choose your perfect color scheme for {theme === 'dark' ? 'Dark' : 'Light'} Mode
          </p>
        </div>

        {/* Theme Switcher */}
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() => setTheme('light')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              theme === 'light'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            ☀️ Light Mode
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              theme === 'dark'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🌙 Dark Mode
          </button>
          <button
            onClick={resetToDefault}
            className="px-6 py-3 rounded-lg font-medium transition-all bg-red-600 text-white hover:bg-red-700"
          >
            🔄 Reset to Default
          </button>
        </div>

        {/* Preview Card */}
        <div className="mb-8 p-6 rounded-xl border-2" style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border-default)'
        }}>
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Live Preview
          </h2>
          <div className="space-y-4">
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
              <p className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Primary Text
              </p>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Secondary text for descriptions and labels
              </p>
              <p className="text-sm mt-2" style={{ color: 'var(--color-text-tertiary)' }}>
                Tertiary text for subtle information
              </p>
            </div>
            <div className="flex gap-3">
              <button
                className="px-4 py-2 rounded-lg font-medium text-white transition-all"
                style={{ backgroundColor: 'var(--color-primary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                }}
              >
                Primary Button
              </button>
              <button
                className="px-4 py-2 rounded-lg font-medium border-2 transition-all"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-primary)'
                }}
              >
                Secondary Button
              </button>
            </div>
          </div>
        </div>

        {/* Palette Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {palettes.map((palette) => (
            <div
              key={palette.id}
              className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                selectedPalette === palette.id
                  ? 'ring-4 ring-indigo-500 ring-opacity-50'
                  : ''
              }`}
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderColor: selectedPalette === palette.id ? '#6366f1' : 'var(--color-border-default)'
              }}
              onClick={() => applyPalette(palette)}
            >
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                {palette.name}
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                {palette.description}
              </p>

              {/* Color Swatches */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div
                    className="w-12 h-12 rounded-lg border"
                    style={{ backgroundColor: palette.colors['--color-bg-primary'] }}
                    title="Background Primary"
                  />
                  <div
                    className="w-12 h-12 rounded-lg border"
                    style={{ backgroundColor: palette.colors['--color-bg-secondary'] }}
                    title="Background Secondary"
                  />
                  <div
                    className="w-12 h-12 rounded-lg border"
                    style={{ backgroundColor: palette.colors['--color-bg-tertiary'] }}
                    title="Background Tertiary"
                  />
                  <div
                    className="w-12 h-12 rounded-lg border"
                    style={{ backgroundColor: palette.colors['--color-primary'] }}
                    title="Primary Color"
                  />
                </div>
                <div className="flex gap-2">
                  <div
                    className="w-12 h-12 rounded-lg border flex items-center justify-center text-xs font-bold"
                    style={{
                      backgroundColor: palette.colors['--color-bg-secondary'],
                      color: palette.colors['--color-text-primary']
                    }}
                  >
                    Aa
                  </div>
                  <div
                    className="w-12 h-12 rounded-lg border flex items-center justify-center text-xs font-bold"
                    style={{
                      backgroundColor: palette.colors['--color-bg-secondary'],
                      color: palette.colors['--color-text-secondary']
                    }}
                  >
                    Aa
                  </div>
                  <div
                    className="w-12 h-12 rounded-lg border flex items-center justify-center text-xs font-bold"
                    style={{
                      backgroundColor: palette.colors['--color-bg-secondary'],
                      color: palette.colors['--color-text-tertiary']
                    }}
                  >
                    Aa
                  </div>
                </div>
              </div>

              {selectedPalette === palette.id && (
                <div className="mt-4 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg text-center">
                  ✓ Currently Applied
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-12 p-6 rounded-xl border-2" style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border-default)'
        }}>
          <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
            📝 How to Apply Your Chosen Palette
          </h3>
          <ol className="list-decimal list-inside space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
            <li>Click on any palette card to preview it</li>
            <li>Check the live preview at the top to see how it looks</li>
            <li>Once you find one you like, copy the color values below</li>
            <li>Update your <code className="px-2 py-1 rounded" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>client/src/index.css</code> file</li>
            <li>Replace the values in either <code className="px-2 py-1 rounded" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>:root</code> (light mode) or <code className="px-2 py-1 rounded" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>.dark</code> (dark mode)</li>
          </ol>
        </div>

        {/* Selected Palette CSS */}
        {selectedPalette && (
          <div className="mt-8 p-6 rounded-xl border-2" style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border-default)'
          }}>
            <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              📋 CSS Code for Selected Palette
            </h3>
            <pre className="p-4 rounded-lg overflow-x-auto text-sm" style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-primary)'
            }}>
              <code>
{`${theme === 'dark' ? '.dark {' : ':root {'}
${Object.entries(palettes.find(p => p.id === selectedPalette)?.colors || {})
  .map(([key, value]) => `  ${key}: ${value};`)
  .join('\n')}
}`}
              </code>
            </pre>
            <button
              onClick={() => {
                const code = `${theme === 'dark' ? '.dark {' : ':root {'}\n${Object.entries(palettes.find(p => p.id === selectedPalette)?.colors || {})
                  .map(([key, value]) => `  ${key}: ${value};`)
                  .join('\n')}\n}`;
                navigator.clipboard.writeText(code);
                alert('CSS code copied to clipboard!');
              }}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
            >
              📋 Copy CSS Code
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ColorPaletteTester;

