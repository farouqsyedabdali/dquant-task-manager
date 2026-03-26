import { Link } from 'react-router-dom';
import useThemeLogo from '../../hooks/useThemeLogo';
import UserProfileDropdown from '../common/UserProfileDropdown';

export default function AIDashboardHeader() {
  const tialzLogo = useThemeLogo();

  return (
    <header
      className="shrink-0 z-30 flex items-center justify-between gap-3 px-4 sm:px-6 h-16 border-b backdrop-blur-md"
      style={{
        borderColor: 'var(--color-border-default)',
        backgroundColor: 'color-mix(in srgb, var(--color-bg-primary) 88%, transparent)',
      }}
    >
      <Link
        to="/app/welcome"
        className="flex items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
      >
        <img
          src={tialzLogo}
          alt="TIALZ Logo"
          className="h-10 sm:h-11 w-auto object-contain max-h-[44px]"
        />
      </Link>

      <UserProfileDropdown />
    </header>
  );
}
