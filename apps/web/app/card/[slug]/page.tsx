import { PublicCardPreview } from "../../../src/components/card/PublicCardPreview";

export default function PublicCardPage({ params }: { params: { slug: string } }) {
  return (
    <main className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Shared tournament card</p>
          <h1>Think your card clears this?</h1>
          <p>
            This public page should show the simplified teaser card, hide full stats, and push visitors to create
            their own card or join the sender's group.
          </p>
          <div className="cta-row">
            <a className="button button-primary" href="/download">
              Create your tournament card
            </a>
          </div>
        </div>
        <PublicCardPreview slug={params.slug} />
      </section>
    </main>
  );
}
