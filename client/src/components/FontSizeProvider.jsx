import { useEffect } from 'react';
import useFontSizeStore from '../context/fontSizeStore';

const FontSizeProvider = ({ children }) => {
  const { fontSize } = useFontSizeStore();

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove existing font size classes
    root.classList.remove('font-small', 'font-medium', 'font-large');
    
    // Add current font size class
    root.classList.add(`font-${fontSize}`);
    
    // Apply comprehensive CSS custom properties
    const style = document.documentElement.style;
    
    if (fontSize === 'small') {
      // Small font size settings
      style.setProperty('--font-size-base', '14px');
      style.setProperty('--font-size-sm', '12px');
      style.setProperty('--font-size-lg', '16px');
      style.setProperty('--font-size-xl', '18px');
      style.setProperty('--font-size-2xl', '20px');
      style.setProperty('--font-size-3xl', '24px');
      style.setProperty('--font-size-4xl', '28px');
      style.setProperty('--font-size-5xl', '32px');
      
      // Spacing
      style.setProperty('--spacing-1', '0.25rem');
      style.setProperty('--spacing-2', '0.5rem');
      style.setProperty('--spacing-3', '0.75rem');
      style.setProperty('--spacing-4', '1rem');
      style.setProperty('--spacing-5', '1.25rem');
      style.setProperty('--spacing-6', '1.5rem');
      style.setProperty('--spacing-8', '2rem');
      style.setProperty('--spacing-10', '2.5rem');
      style.setProperty('--spacing-12', '3rem');
      
      // Component sizes
      style.setProperty('--btn-height', '2rem');
      style.setProperty('--btn-height-sm', '1.5rem');
      style.setProperty('--btn-height-lg', '2.5rem');
      style.setProperty('--input-height', '2rem');
      style.setProperty('--input-height-sm', '1.5rem');
      style.setProperty('--input-height-lg', '2.5rem');
      style.setProperty('--card-padding', '1rem');
      style.setProperty('--card-padding-lg', '1.5rem');
      
    } else if (fontSize === 'large') {
      // Large font size settings
      style.setProperty('--font-size-base', '18px');
      style.setProperty('--font-size-sm', '16px');
      style.setProperty('--font-size-lg', '20px');
      style.setProperty('--font-size-xl', '22px');
      style.setProperty('--font-size-2xl', '24px');
      style.setProperty('--font-size-3xl', '28px');
      style.setProperty('--font-size-4xl', '32px');
      style.setProperty('--font-size-5xl', '36px');
      
      // Spacing
      style.setProperty('--spacing-1', '0.5rem');
      style.setProperty('--spacing-2', '0.75rem');
      style.setProperty('--spacing-3', '1rem');
      style.setProperty('--spacing-4', '1.25rem');
      style.setProperty('--spacing-5', '1.5rem');
      style.setProperty('--spacing-6', '1.75rem');
      style.setProperty('--spacing-8', '2.5rem');
      style.setProperty('--spacing-10', '3rem');
      style.setProperty('--spacing-12', '3.5rem');
      
      // Component sizes
      style.setProperty('--btn-height', '3rem');
      style.setProperty('--btn-height-sm', '2.5rem');
      style.setProperty('--btn-height-lg', '3.5rem');
      style.setProperty('--input-height', '3rem');
      style.setProperty('--input-height-sm', '2.5rem');
      style.setProperty('--input-height-lg', '3.5rem');
      style.setProperty('--card-padding', '2rem');
      style.setProperty('--card-padding-lg', '2.5rem');
      
    } else {
      // Medium font size settings (default)
      style.setProperty('--font-size-base', '16px');
      style.setProperty('--font-size-sm', '14px');
      style.setProperty('--font-size-lg', '18px');
      style.setProperty('--font-size-xl', '20px');
      style.setProperty('--font-size-2xl', '22px');
      style.setProperty('--font-size-3xl', '26px');
      style.setProperty('--font-size-4xl', '30px');
      style.setProperty('--font-size-5xl', '34px');
      
      // Spacing
      style.setProperty('--spacing-1', '0.375rem');
      style.setProperty('--spacing-2', '0.625rem');
      style.setProperty('--spacing-3', '0.875rem');
      style.setProperty('--spacing-4', '1.125rem');
      style.setProperty('--spacing-5', '1.375rem');
      style.setProperty('--spacing-6', '1.625rem');
      style.setProperty('--spacing-8', '2.25rem');
      style.setProperty('--spacing-10', '2.75rem');
      style.setProperty('--spacing-12', '3.25rem');
      
      // Component sizes
      style.setProperty('--btn-height', '2.5rem');
      style.setProperty('--btn-height-sm', '2rem');
      style.setProperty('--btn-height-lg', '3rem');
      style.setProperty('--input-height', '2.5rem');
      style.setProperty('--input-height-sm', '2rem');
      style.setProperty('--input-height-lg', '3rem');
      style.setProperty('--card-padding', '1.5rem');
      style.setProperty('--card-padding-lg', '2rem');
    }
    
  }, [fontSize]);

  return children;
};

export default FontSizeProvider;
