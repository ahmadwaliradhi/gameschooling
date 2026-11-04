import { Link, createFileRoute } from "@tanstack/react-router";
import { Email, LegalPage, List, OPERATOR, Section } from "@/components/legal-page";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms of Use · GameSchooling" }] }),
  component: Terms,
});

function Terms() {
  return (
    <LegalPage title="Terms of Use">
      <p>
        These terms are an agreement between you and {OPERATOR}, which runs GameSchooling at
        gameschooling.web.id. By signing in or using the Demo, you accept them. If you do not accept them, do
        not use GameSchooling.
      </p>

      <Section title="Who may use it">
        <List>
          <li>Only adults aged 18 or older may sign in as a Parent.</li>
          <li>
            A Child uses GameSchooling only on a Parent's device and under that Parent's supervision. You may
            add only Children you are the parent or legal guardian of.
          </li>
          <li>
            You are responsible for your Google account, for who uses your device, and for any PIN you set. A
            Family may have several Parents, and each one has the same control over the Family.
          </li>
        </List>
      </Section>

      <Section title="What GameSchooling is, and what it is not">
        <p>
          GameSchooling turns a Parent's Plan into Quests and checks a Child's Proofs with AI models. Quests,
          covers, Verdicts and Digests are generated automatically and can be wrong, unsuitable or incomplete.
          Every Quest passes a safety check before a Child sees it, and two models must agree before Points
          are paid, but no check is perfect.
        </p>
        <List>
          <li>
            You stay in charge. Review Quests, change any Verdict you disagree with, and decide which Rewards
            you actually give.
          </li>
          <li>
            GameSchooling is a learning game. It is not a school, a grading or certification service, or
            professional educational, medical or psychological advice.
          </li>
          <li>Points and Rewards have no cash value and cannot be exchanged with us for anything.</li>
        </List>
      </Section>

      <Section title="Your content">
        <p>
          You own what you and your Children put in: Plans, photos, recordings and answers. You give us
          permission to store and process it, including sending it to the AI providers named in the{" "}
          <Link to="/privacy" className="underline underline-offset-2">
            Privacy Policy
          </Link>
          , only to run GameSchooling for your Family. Do not upload anything you do not have the right to
          share, or photos that show other people's children.
        </p>
      </Section>

      <Section title="Acceptable use">
        <p>Do not:</p>
        <List>
          <li>try to get Quests or covers that are violent, sexual, hateful or otherwise harmful;</li>
          <li>try to reach another Family's data, or break, overload or reverse-engineer the service;</li>
          <li>use the service to harm, track or shame a Child;</li>
          <li>put real personal information into the shared Demo Family, which anyone can see.</li>
        </List>
        <p>We may suspend or close a Family that breaks these rules.</p>
      </Section>

      <Section title="AI models and attribution">
        <p>
          GameSchooling is built with Muse Spark Open, run on Baseten, and also uses Meta's Muse Wonder, Muse
          Spark 1.3, Muse Image, SAM 3.1 and Muse Voice Transcribe. These models belong to their owners and
          are used under their licenses. GameSchooling is not made, endorsed or sponsored by Meta or Baseten.
        </p>
      </Section>

      <Section title="Availability and changes">
        <p>
          We provide GameSchooling as it is and as available. We may change, pause or stop features, including
          which models are used. If we change these terms in a way that matters, we will update the date at
          the top and email Parents before the change takes effect. Using GameSchooling after that means you
          accept the new terms.
        </p>
      </Section>

      <Section title="Liability">
        <p>
          To the extent Indonesian law allows, {OPERATOR} is not liable for indirect or consequential loss, or
          for decisions made on the basis of generated content. Nothing in these terms limits liability that
          cannot be limited by law.
        </p>
      </Section>

      <Section title="Ending use">
        <p>
          You can stop using GameSchooling at any time and ask us to delete your Family by emailing <Email />.
        </p>
      </Section>

      <Section title="Governing law">
        <p>
          These terms are governed by the laws of the Republic of Indonesia. We will first try to settle any
          dispute with you directly. If that fails, the dispute goes to the competent courts of Indonesia.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about these terms: <Email />.
        </p>
      </Section>
    </LegalPage>
  );
}
