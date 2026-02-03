import { Link } from 'react-router-dom';

const TestStaging = () => {
    return (
        <div
            className="min-h-screen flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-bg-primary)' }}
        >
            <div
                className="max-w-2xl w-full mx-4 p-8 rounded-lg shadow-lg border"
                style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderColor: 'var(--color-border-default)'
                }}
            >
                {/* Warning Banner */}
                <div
                    className="mb-6 p-4 rounded-lg border-2"
                    style={{
                        backgroundColor: 'rgba(234, 179, 8, 0.1)',
                        borderColor: '#eab308'
                    }}
                >
                    <h1
                        className="text-3xl font-bold mb-2"
                        style={{ color: '#eab308' }}
                    >
                        ⚠️ STAGING ENVIRONMENT
                    </h1>
                    <p
                        className="text-lg"
                        style={{ color: 'var(--color-text-secondary)' }}
                    >
                        This page should <strong>ONLY</strong> appear on the staging website.
                    </p>
                </div>

                {/* Main Content */}
                <div className="space-y-6">
                    <div>
                        <h2
                            className="text-2xl font-semibold mb-3"
                            style={{ color: 'var(--color-text-primary)' }}
                        >
                            🧪 Staging Test Page
                        </h2>
                        <p
                            className="text-base mb-4"
                            style={{ color: 'var(--color-text-secondary)' }}
                        >
                            If you can see this page, you are on the <strong>staging environment</strong>.
                        </p>
                        <p
                            className="text-base mb-4"
                            style={{ color: 'var(--color-text-secondary)' }}
                        >
                            This page exists to verify that the staging deployment is working correctly
                            and is separate from the production environment.
                        </p>
                    </div>

                    {/* Test Instructions */}
                    <div
                        className="p-4 rounded-lg"
                        style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                    >
                        <h3
                            className="text-lg font-semibold mb-2"
                            style={{ color: 'var(--color-text-primary)' }}
                        >
                            ✅ Test Instructions:
                        </h3>
                        <ol
                            className="list-decimal list-inside space-y-2 text-sm"
                            style={{ color: 'var(--color-text-secondary)' }}
                        >
                            <li>You are currently viewing the staging site</li>
                            <li>Click the link below to visit the production site</li>
                            <li>Try accessing <code>/test-staging</code> on production</li>
                            <li>It should show a 404 error or redirect (not this page)</li>
                        </ol>
                    </div>

                    {/* Link to Production */}
                    <div className="flex flex-col gap-4">
                        <a
                            href="https://tialz.com/test-staging"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 hover:opacity-90"
                            style={{ backgroundColor: '#3b82f6' }}
                        >
                            🔗 Check Production Site (tialz.com)
                        </a>

                        <p
                            className="text-xs text-center"
                            style={{ color: 'var(--color-text-tertiary)' }}
                        >
                            If this page appears on tialz.com, the staging setup is NOT working correctly.
                        </p>

                        <Link
                            to="/dashboard"
                            className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold transition-all duration-200 border"
                            style={{
                                color: 'var(--color-text-primary)',
                                borderColor: 'var(--color-border-default)',
                                backgroundColor: 'transparent'
                            }}
                        >
                            ← Back to Dashboard
                        </Link>
                    </div>
                </div>

                {/* Environment Info */}
                <div
                    className="mt-6 pt-6 border-t text-xs"
                    style={{
                        borderColor: 'var(--color-border-default)',
                        color: 'var(--color-text-tertiary)'
                    }}
                >
                    <p><strong>Environment:</strong> {import.meta.env.MODE}</p>
                    <p><strong>API URL:</strong> {import.meta.env.VITE_API_URL}</p>
                    <p><strong>Current URL:</strong> {window.location.href}</p>
                </div>
            </div>
        </div>
    );
};

export default TestStaging;
