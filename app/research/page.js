import ResearchClient from './ResearchClient';

export default function ResearchPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        padding: 'clamp(1.5rem, 4vw, 3rem) clamp(1rem, 3vw, 1.5rem)',
      }}
    >
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <header style={{ textAlign: 'center', margin: '0 0 1.75rem 0' }}>
          <h1
            style={{
              fontSize: 'clamp(2rem, 5vw, 2.75rem)',
              fontWeight: 700,
              margin: 0,
            }}
          >
            Research
          </h1>
          <p
            style={{
              margin: '0.5rem auto 0 auto',
              maxWidth: '70ch',
              fontSize: 'clamp(1rem, 2.2vw, 1.1rem)',
              lineHeight: 1.6,
              opacity: 0.85,
            }}
          >
            Notes, experiments, write-ups, and useful things I want to share and showcase.
          </p>
        </header>

        <ResearchClient />
      </div>
    </main>
  );
}
