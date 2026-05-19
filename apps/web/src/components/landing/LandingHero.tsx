export function LandingHero() {
  return (
    <main className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Daily trivia. Match bounties. Fan cards.</p>
          <h1>Your World Cup alter ego.</h1>
          <p>
            Create a personalized footballer card, compete in spoiler-safe daily trivia, unlock card upgrades, and
            bring your group into the tournament.
          </p>
          <div className="cta-row">
            <a className="button button-primary" href="/download">
              Create your card
            </a>
            <a className="button button-secondary" href="/invite/demo">
              Preview invite
            </a>
          </div>
        </div>
        <div className="preview-card">
          <div className="preview-card-content">
            <div className="preview-rating">74</div>
            <div className="preview-name">Rookie</div>
            <div className="preview-meta">USA / Gold soon</div>
          </div>
        </div>
      </section>
    </main>
  );
}
