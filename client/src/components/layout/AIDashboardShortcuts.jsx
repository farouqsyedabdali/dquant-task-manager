import { useNavigate } from 'react-router-dom';
import { FaUsers, FaProjectDiagram } from 'react-icons/fa';
import CalendarIcon from '../icons/CalendarIcon';
import useAuthStore from '../../context/authStore';
import IconButton from '../common/IconButton';

function ContactsGlyph({ className = 'w-4 h-4', size }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

/**
 * Same destinations and rules as main Header nav: Employees only for company admins (not personal accounts).
 */
export default function AIDashboardShortcuts({ onViewTasks, size = 'md' }) {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuthStore();
  const isPersonalAccount = user?.isPersonal || false;
  const showEmployees = isAdmin() && !isPersonalAccount;

  return (
    <div className="w-full flex flex-wrap justify-center items-center gap-2">
      <IconButton label="View my tasks" variant="secondary" size={size} onClick={onViewTasks} />
      <IconButton label="Calendar" icon={<CalendarIcon />} variant="secondary" size={size} onClick={() => navigate('/app/calendar')} />
      <IconButton label="Contacts" icon={<ContactsGlyph />} variant="secondary" size={size} onClick={() => navigate('/app/contacts')} />
      <IconButton label="Projects and Events" icon={<FaProjectDiagram />} variant="secondary" size={size} onClick={() => navigate('/app/projects')} />
      {showEmployees && (
        <IconButton label="Employees" icon={<FaUsers />} variant="secondary" size={size} onClick={() => navigate('/app/employees')} />
      )}
    </div>
  );
}
