import ThoughtsClient from './ThoughtsClient';

export default function ThoughtsPage() {
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
            Thoughts
          </h1>
          <p
            style={{
              margin: '0.5rem auto 0 auto',
              maxWidth: '60ch',
              fontSize: 'clamp(1rem, 2.2vw, 1.1rem)',
              lineHeight: 1.6,

              //ffasdad
              opacity: 0.85,
            }}
          >
            We all have thoughts. and these are mine. Things that I find interesting and worthy to talk about.
          </p>
        </header>


        

        <ThoughtsClient />
      </div>
    </main>
  );

}
