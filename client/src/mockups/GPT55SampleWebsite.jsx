/**
 * Vision mockup: unified Google-connected workspace — email, calendar, contacts, tasks.
 * Static demo for the mockups viewer (not wired to real APIs).
 */
export default function GPT55SampleWebsite() {
  return (
    <div
      className="min-h-screen w-full overflow-auto"
      style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
    >
      <header
        className="sticky top-0 z-10 border-b px-6 py-4 flex flex-wrap items-center justify-between gap-4"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border-default)',
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden>
            ◈
          </span>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Tialz — AI-native command center</h1>
            <p className="text-sm opacity-80">Vision mockup: one connected workspace</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span
            className="rounded-full px-3 py-1 font-medium"
            style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
          >
            Google connected
          </span>
          <span className="opacity-70">Gmail · Calendar · Contacts</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid gap-6 lg:grid-cols-12">
        <section
          className="lg:col-span-5 rounded-xl border p-5 space-y-4"
          style={{
            borderColor: 'var(--color-border-default)',
            backgroundColor: 'var(--color-bg-secondary)',
          }}
        >
          <h2 className="text-sm font-semibold uppercase tracking-wide opacity-80">Email agent</h2>
          <p className="text-sm opacity-90">
            Incoming mail is classified; actionable threads become tasks without forwarding hacks.
          </p>
          <ul className="space-y-3 text-sm">
            {[
              { from: 'client@acme.com', subj: 'Re: Proposal — need revisions by Fri', tag: 'Actionable' },
              { from: 'news@vendor.io', subj: 'Your weekly digest', tag: 'Skipped' },
              { from: 'lead@startup.co', subj: 'Can we sync Tuesday 3pm?', tag: 'Meeting' },
            ].map((row, i) => (
              <li
                key={i}
                className="rounded-lg border px-3 py-2 flex justify-between gap-2"
                style={{ borderColor: 'var(--color-border-default)' }}
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{row.subj}</div>
                  <div className="opacity-70 truncate">{row.from}</div>
                </div>
                <span className="shrink-0 text-xs font-semibold opacity-90">{row.tag}</span>
              </li>
            ))}
          </ul>
        </section>

        <section
          className="lg:col-span-7 rounded-xl border p-5 space-y-4"
          style={{
            borderColor: 'var(--color-border-default)',
            backgroundColor: 'var(--color-bg-secondary)',
          }}
        >
          <h2 className="text-sm font-semibold uppercase tracking-wide opacity-80">Today</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div
              className="rounded-lg border p-4"
              style={{ borderColor: 'var(--color-border-default)' }}
            >
              <div className="text-xs font-semibold opacity-70 mb-2">Calendar</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <span>10:00 · Standup</span>
                  <span className="opacity-60">30m</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>14:00 · Acme review</span>
                  <span className="opacity-60">1h</span>
                </div>
              </div>
            </div>
            <div
              className="rounded-lg border p-4"
              style={{ borderColor: 'var(--color-border-default)' }}
            >
              <div className="text-xs font-semibold opacity-70 mb-2">Suggested tasks</div>
              <ul className="text-sm space-y-2 opacity-95">
                <li>· Prep slides before Acme review</li>
                <li>· Follow up proposal revisions (due Fri)</li>
                <li>· Confirm Tuesday sync with startup lead</li>
              </ul>
            </div>
          </div>
        </section>

        <section
          className="lg:col-span-12 rounded-xl border p-5 grid gap-4 md:grid-cols-3"
          style={{
            borderColor: 'var(--color-border-default)',
            backgroundColor: 'var(--color-bg-secondary)',
          }}
        >
          <div>
            <h3 className="text-sm font-semibold mb-2 opacity-80">Contacts</h3>
            <p className="text-sm opacity-85 mb-3">Synced from Google; tied to tasks and projects.</p>
            <div className="flex flex-wrap gap-2 text-xs">
              {['Sarah K.', 'Mike R.', 'Priya P.'].map((name) => (
                <span
                  key={name}
                  className="rounded-full px-2 py-1"
                  style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <h3 className="text-sm font-semibold mb-2 opacity-80">Projects & tasks</h3>
            <p className="text-sm opacity-85">
              One surface for priorities: AI proposes updates from email and calendar; you approve or edit
              before anything lands in your real task list.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
