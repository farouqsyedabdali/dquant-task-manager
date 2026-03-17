import { useState } from 'react';

/**
 * Contact / Employee card revamp – cleaner list item design
 */
const ContactCardRevamped = () => {
  const [selected, setSelected] = useState(null);

  const contacts = [
    { name: 'Sarah Kim', email: 'sarah@company.com', tasks: 3, type: 'employee' },
    { name: 'Marcus Chen', email: 'marcus@external.com', tasks: 1, type: 'contact' },
    { name: 'Jess Taylor', email: 'jess@company.com', tasks: 5, type: 'employee' },
  ];

  return (
    <div
      className="min-h-screen p-8"
      style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
    >
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Contacts (revamped)</h1>

        <div className="space-y-2">
          {contacts.map((c, i) => (
            <div
              key={i}
              onClick={() => setSelected(selected === i ? null : i)}
              className="flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all"
              style={{
                backgroundColor: selected === i ? 'var(--color-bg-tertiary)' : 'var(--color-bg-secondary)',
                borderColor: selected === i ? 'var(--color-primary)' : 'var(--color-border-default)',
              }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
                style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
              >
                {c.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{c.name}</div>
                <div className="text-sm truncate" style={{ color: 'var(--color-text-tertiary)' }}>{c.email}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                  {c.tasks} tasks
                </span>
                <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: c.type === 'employee' ? 'var(--color-primary)' : 'var(--color-accent)', color: 'white', opacity: 0.9 }}>
                  {c.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContactCardRevamped;
