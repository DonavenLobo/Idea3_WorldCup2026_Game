export default function DownloadPage() {
  return (
    <main className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Download</p>
          <h1>Create your tournament card.</h1>
          <p>
            This page will redirect users to the App Store, Play Store, or a waitlist depending on device and launch
            status.
          </p>
          <div className="cta-row">
            <a className="button button-primary" href={process.env.NEXT_PUBLIC_APP_STORE_URL ?? "#"}>
              App Store
            </a>
            <a className="button button-secondary" href={process.env.NEXT_PUBLIC_PLAY_STORE_URL ?? "#"}>
              Play Store
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
