/**
 * Mockup registry – add new mockups here
 * Format: { id, path, label, description, component, category }
 */
import LandingPageFull from './LandingPageFull';
import LandingHeroCentered from './LandingHeroCentered';
import LandingFeaturesFirst from './LandingFeaturesFirst';
import LandingMinimal from './LandingMinimal';
import LoginPageFull from './LoginPageFull';
import DashboardFull from './DashboardFull';
import DashboardCurrentImproved from './DashboardCurrentImproved';
import DashboardKanban from './DashboardKanban';
import TaskModalFull from './TaskModalFull';
import ProjectsPageFull from './ProjectsPageFull';
import AIChatFull from './AIChatFull';
import SettingsPageFull from './SettingsPageFull';
import OnboardingFlow from './OnboardingFlow';
import FeatureCards from './FeatureCards';
import EmptyStateVariations from './EmptyStateVariations';
import SocialProofSection from './SocialProofSection';
import ModalDesignA from './ModalDesignA';
import TaskInvitationRevamped from './TaskInvitationRevamped';
import DashboardFiltersSimplified from './DashboardFiltersSimplified';
import EmptySearchState from './EmptySearchState';
import AIActionsImproved from './AIActionsImproved';
import SignupOptionsRevamped from './SignupOptionsRevamped';
import NotFoundPage from './NotFoundPage';
import MobileNav from './MobileNav';
import ToastNotification from './ToastNotification';
import ContactCardRevamped from './ContactCardRevamped';
import BulkActionsBar from './BulkActionsBar';

export const MOCKUPS = [
  // Landing & auth
  { id: 'landing-page-full', path: 'landing-page', label: 'Landing Page', description: 'Discord-style: hero + product mockup, alternating features, theme-aware', component: LandingPageFull, category: 'Landing' },
  { id: 'landing-hero-centered', path: 'landing-hero-centered', label: 'Landing: Hero Centered', description: 'Full-viewport hero, CTA-first', component: LandingHeroCentered, category: 'Landing' },
  { id: 'landing-features-first', path: 'landing-features-first', label: 'Landing: Features First', description: 'Feature cards before auth', component: LandingFeaturesFirst, category: 'Landing' },
  { id: 'landing-minimal', path: 'landing-minimal', label: 'Landing: Minimal', description: 'Bold typography, lots of whitespace', component: LandingMinimal, category: 'Landing' },
  { id: 'login-page-full', path: 'login-page', label: 'Login / Sign Up Page', description: 'Full auth form with tabs, Google, validation', component: LoginPageFull, category: 'Auth' },
  // App pages
  { id: 'dashboard-full', path: 'dashboard', label: 'Dashboard', description: 'Full dashboard: stats, filters, task cards, detail modal', component: DashboardFull, category: 'App' },
  { id: 'dashboard-current-improved', path: 'dashboard-current-improved', label: 'Dashboard (as-is + tweaks)', description: 'Current layout with subtle UX improvements', component: DashboardCurrentImproved, category: 'App' },
  { id: 'dashboard-kanban', path: 'dashboard-kanban', label: 'Dashboard: Kanban', description: 'Column-based task layout', component: DashboardKanban, category: 'App' },
  { id: 'task-modal-full', path: 'task-modal', label: 'Task Modal', description: 'Full task edit: details, comments, activity tabs', component: TaskModalFull, category: 'App' },
  { id: 'projects-page-full', path: 'projects', label: 'Projects Page', description: 'Project cards, progress bars, create modal', component: ProjectsPageFull, category: 'App' },
  { id: 'ai-chat-full', path: 'ai-chat', label: 'AI Assistant', description: 'AI chat interface with suggestions', component: AIChatFull, category: 'App' },
  { id: 'settings-page-full', path: 'settings', label: 'Settings Page', description: 'Profile, preferences, toggles', component: SettingsPageFull, category: 'App' },
  { id: 'onboarding-flow', path: 'onboarding', label: 'Onboarding Flow', description: 'First-time user setup steps', component: OnboardingFlow, category: 'App' },
  // Components
  { id: 'feature-cards', path: 'feature-cards', label: 'Feature Cards', description: 'Feature highlight grid', component: FeatureCards, category: 'Components' },
  { id: 'empty-state-variations', path: 'empty-state-variations', label: 'Empty State Variations', description: 'Different empty state designs', component: EmptyStateVariations, category: 'Components' },
  { id: 'social-proof-section', path: 'social-proof-section', label: 'Social Proof Section', description: 'Testimonials and stats', component: SocialProofSection, category: 'Components' },
  { id: 'modal-design-a', path: 'modal-design-a', label: 'Modal Design A', description: 'Alternative modal styling', component: ModalDesignA, category: 'Components' },
  // Revamps & improvements
  { id: 'task-invitation-revamped', path: 'task-invitation-revamped', label: 'Task Invitation Revamped', description: 'Theme-aware invitation page (was dark-only)', component: TaskInvitationRevamped, category: 'Revamps' },
  { id: 'dashboard-filters-simplified', path: 'dashboard-filters-simplified', label: 'Dashboard Filters Simplified', description: 'Presets + expandable advanced filters', component: DashboardFiltersSimplified, category: 'Revamps' },
  { id: 'empty-search-state', path: 'empty-search-state', label: 'Empty Search State', description: 'Better "no results" UX', component: EmptySearchState, category: 'Revamps' },
  { id: 'ai-actions-improved', path: 'ai-actions-improved', label: 'AI Actions Improved', description: 'Paste area fallback + clearer CTAs', component: AIActionsImproved, category: 'Revamps' },
  { id: 'signup-options-revamped', path: 'signup-options-revamped', label: 'Signup Options Revamped', description: 'Clearer Company vs Personal choice', component: SignupOptionsRevamped, category: 'Revamps' },
  { id: 'not-found-page', path: 'not-found-page', label: '404 Not Found', description: 'Friendly error page', component: NotFoundPage, category: 'Revamps' },
  { id: 'mobile-nav', path: 'mobile-nav', label: 'Mobile Navigation', description: 'Hamburger menu, simplified header', component: MobileNav, category: 'Revamps' },
  { id: 'toast-notification', path: 'toast-notification', label: 'Toast Notification', description: 'Consistent feedback design', component: ToastNotification, category: 'Revamps' },
  { id: 'contact-card-revamped', path: 'contact-card-revamped', label: 'Contact Card Revamped', description: 'Improved contact list item', component: ContactCardRevamped, category: 'Revamps' },
  { id: 'bulk-actions-bar', path: 'bulk-actions-bar', label: 'Bulk Actions Bar', description: 'Multi-select and batch actions', component: BulkActionsBar, category: 'Revamps' },
];

export const getMockupByPath = (path) => MOCKUPS.find((m) => m.path === path);

export const getCategories = () => [...new Set(MOCKUPS.map((m) => m.category))];
