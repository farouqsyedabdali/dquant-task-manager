import { FaExclamationTriangle } from 'react-icons/fa';

const AIWarning = ({ className = "" }) => {
    return (
        <div
            className={`flex items-start space-x-2 text-sm p-3 rounded-lg border transition-all duration-200 ${className}`}
            style={{
                backgroundColor: 'rgba(234, 179, 8, 0.1)', // Yellow/Amber background with low opacity
                borderColor: 'rgba(234, 179, 8, 0.3)',
                color: 'var(--color-primary-light)',
            }}
        >
            <FaExclamationTriangle className="mt-0.5 flex-shrink-0" size={14} style={{ color: '#eab308' }} />
            <p className="leading-tight">
                AI can make mistakes. Please double check the information.
            </p>
        </div>
    );
};

export default AIWarning;
