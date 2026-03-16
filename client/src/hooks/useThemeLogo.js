import useThemeStore from '../stores/themeStore';
import lightModeLogo from '../assets/no-bg-lightmode-tialz-logo.png';
import darkModeLogo from '../assets/no-bg-darkmode-tialz-logo.png';
import tialzFavicon from '../assets/tialz-favicon.png';

export { lightModeLogo, darkModeLogo, tialzFavicon };

export const getThemeLogo = (theme) => (
  theme === 'dark' ? darkModeLogo : lightModeLogo
);

const useThemeLogo = () => {
  const theme = useThemeStore((state) => state.theme);

  return getThemeLogo(theme);
};

export default useThemeLogo;
