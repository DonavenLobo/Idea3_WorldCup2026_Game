export default function InvitePage({ params }: { params: { inviteCode: string } }) {
  return (
    <main className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Group invite</p>
          <h1>Join the group before kickoff.</h1>
          <p>
            Invite code <strong>{params.inviteCode}</strong> should deep-link into the mobile app when installed,
            or route new users through card creation first.
          </p>
          <div className="cta-row">
            <a className="button button-primary" href="/download">
              Open the app
            </a>
            <a className="button button-secondary" href="/">
              Learn more
            </a>
          </div>
        </div>
        <div className="preview-card">
          <div className="preview-card-content">
            <div className="preview-rating">11</div>
            <div className="preview-name">Your Squad</div>
            <div className="preview-meta">Group Invite</div>
          </div>
        </div>
      </section>
    </main>
  );
}
