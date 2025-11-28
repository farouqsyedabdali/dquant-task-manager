import { useState } from 'react';
import useThemeStore from '../stores/themeStore';
import { lightPalettes, darkPalettes } from '../config/colorPalettes';

const ColorPaletteTester = () => {
  const { theme, setTheme, setLightPalette, setDarkPalette, lightPalette, darkPalette } = useThemeStore();
  const [selectedPalette, setSelectedPalette] = useState(null);

  // Apply palette temporarily for preview (without saving)
  const previewPalette = (palette) => {
    const root = document.documentElement;
    Object.entries(palette.colors).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    setSelectedPalette(palette.id);
  };

  // Apply and save palette permanently
  const applyPalette = (palette) => {
    if (theme === 'dark') {
      setDarkPalette(palette.id);
    } else {
      setLightPalette(palette.id);
    }
    setSelectedPalette(palette.id);
  };

  const currentPalettes = theme === 'dark' ? darkPalettes : lightPalettes;

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            🎨 Color Palette Tester
          </h1>
          <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
            Test and preview different color palettes for your application. Changes are applied in real-time.
          </p>
        </div>

        {/* Theme Mode Toggle */}
        <div
          className="card mb-8 p-6"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border-default)',
            borderWidth: 1,
          }}
        >
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Theme Mode
          </h2>
          <div className="flex space-x-4">
            <button
              onClick={() => setTheme('light')}
              className="flex-1 py-4 px-6 rounded-lg border-2 transition-all duration-200"
              style={
                theme === 'light'
                  ? {
                      backgroundColor: 'var(--color-primary)',
                      borderColor: 'var(--color-primary)',
                      color: '#ffffff',
                    }
                  : {
                      backgroundColor: 'var(--color-bg-tertiary)',
                      borderColor: 'var(--color-border-default)',
                      color: 'var(--color-text-primary)',
                    }
              }
            >
              <div className="text-center">
                <div className="text-3xl mb-2">☀️</div>
                <div className="font-semibold">Light Mode</div>
              </div>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className="flex-1 py-4 px-6 rounded-lg border-2 transition-all duration-200"
              style={
                theme === 'dark'
                  ? {
                      backgroundColor: 'var(--color-primary)',
                      borderColor: 'var(--color-primary)',
                      color: '#ffffff',
                    }
                  : {
                      backgroundColor: 'var(--color-bg-tertiary)',
                      borderColor: 'var(--color-border-default)',
                      color: 'var(--color-text-primary)',
                    }
              }
            >
              <div className="text-center">
                <div className="text-3xl mb-2">🌙</div>
                <div className="font-semibold">Dark Mode</div>
              </div>
            </button>
          </div>
        </div>

        {/* Current Palette Info */}
        <div
          className="card mb-8 p-6"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border-default)',
            borderWidth: 1,
          }}
        >
          <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Currently Active: {theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Selected Palette: <strong>{theme === 'dark' ? darkPalette : lightPalette}</strong>
          </p>
        </div>

        {/* Palette Grid */}
        <div
          className="card p-6"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border-default)',
            borderWidth: 1,
          }}
        >
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>
            {theme === 'dark' ? '🌙 Dark Mode Palettes' : '☀️ Light Mode Palettes'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentPalettes.map((palette) => {
              const isActive = theme === 'dark' ? darkPalette === palette.id : lightPalette === palette.id;
              
              return (
                <div
                  key={palette.id}
                  className="rounded-lg p-5 border-2 transition-all duration-200 cursor-pointer hover:scale-[1.02]"
                  style={
                    isActive
                      ? {
                          backgroundColor: 'var(--color-primary)',
                          borderColor: 'var(--color-primary)',
                          color: '#ffffff',
                        }
                      : {
                          backgroundColor: 'var(--color-bg-tertiary)',
                          borderColor: 'var(--color-border-default)',
                          color: 'var(--color-text-primary)',
                        }
                  }
                  onClick={() => applyPalette(palette)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold">{palette.name}</h3>
                    {isActive && <div className="text-2xl">✓</div>}
                  </div>
                  <p
                    className="text-sm mb-4"
                    style={
                      isActive
                        ? { color: 'rgba(255, 255, 255, 0.9)' }
                        : { color: 'var(--color-text-secondary)' }
                    }
                  >
                    {palette.description}
                  </p>
                  
                  {/* Color Swatches */}
                  <div className="grid grid-cols-5 gap-2 mb-4">
                    {Object.entries(palette.colors)
                      .slice(0, 10)
                      .map(([key, value]) => (
                        <div
                          key={key}
                          className="aspect-square rounded border"
                          style={{
                            backgroundColor: value,
                            borderColor: isActive ? '#ffffff' : 'var(--color-border-default)',
                          }}
                          title={key}
                        />
                      ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        previewPalette(palette);
                      }}
                      className="flex-1 py-2 px-3 rounded text-sm font-medium transition-colors"
                      style={
                        isActive
                          ? {
                              backgroundColor: 'rgba(255, 255, 255, 0.2)',
                              color: '#ffffff',
                            }
                          : {
                              backgroundColor: 'var(--color-bg-quaternary)',
                              color: 'var(--color-text-primary)',
                            }
                      }
                    >
                      Preview
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        applyPalette(palette);
                      }}
                      className="flex-1 py-2 px-3 rounded text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: 'var(--color-primary)',
                        color: '#ffffff',
                      }}
                    >
                      {isActive ? 'Active' : 'Apply'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sample UI Elements */}
        <div
          className="card mt-8 p-6"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border-default)',
            borderWidth: 1,
          }}
        >
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>
            Sample UI Elements
          </h2>
          <div className="space-y-4">
            <div className="flex space-x-4">
              <button
                className="px-4 py-2 rounded font-medium"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: '#ffffff',
                }}
              >
                Primary Button
              </button>
              <button
                className="px-4 py-2 rounded font-medium border"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-primary)',
                }}
              >
                Secondary Button
              </button>
            </div>
            <div
              className="p-4 rounded border"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-border-default)',
              }}
            >
              <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Sample Card
              </h3>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                This is a sample card with secondary text color.
              </p>
              <p className="text-sm mt-2" style={{ color: 'var(--color-text-tertiary)' }}>
                Tertiary text for less important information.
              </p>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div
          className="card mt-8 p-6"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border-default)',
            borderWidth: 1,
          }}
        >
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            💡 How to Use
          </h3>
          <ul className="list-disc list-inside space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
            <li>Click on any palette card to apply it immediately</li>
            <li>Use "Preview" to temporarily test a palette without saving</li>
            <li>Use "Apply" to save the palette as your preference</li>
            <li>Your selections are automatically saved and will persist across sessions</li>
            <li>You can set different palettes for Light and Dark modes</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ColorPaletteTester;
