import { Link, createFileRoute } from "@tanstack/react-router";
import { Email, LegalPage, List, OPERATOR, Section } from "@/components/legal-page";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy · GameSchooling" }] }),
  component: Privacy,
});

function Privacy() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        GameSchooling is run by {OPERATOR}. This policy says what we collect, why, who processes it, and what
        you can ask us to do with it. It covers the website at gameschooling.web.id. We follow Indonesia's
        Personal Data Protection Law (Law No. 27 of 2022).
      </p>

      <Section title="Who uses GameSchooling">
        <p>
          A Family has two kinds of member. A <strong>Parent</strong> is an adult who signs in with Google and
          manages the Family. A <strong>Child</strong> has no account. A Child plays on a Parent's device,
          optionally behind a 4-digit PIN the Parent sets. Parents must be 18 or older. By adding a Child, a
          Parent consents, as the Child's parent or legal guardian, to that Child's data being processed as
          this policy describes.
        </p>
      </Section>

      <Section title="What we collect">
        <List>
          <li>
            <strong>Parent account:</strong> your name, email address and profile picture from Google, plus
            the sign-in session (with the IP address and browser it came from).
          </li>
          <li>
            <strong>Child details:</strong> a nickname and a birth year. We never ask for a Child's full name,
            photo of their face, school or address. If a PIN is set, we keep only a scrambled (hashed) form of
            it.
          </li>
          <li>
            <strong>Plans:</strong> the free text a Parent writes about what a Child should learn, what to
            avoid, and which Rewards they can earn.
          </li>
          <li>
            <strong>Proofs:</strong> what a Child submits for a Quest. Photos (including worksheet photos) are
            stored. Voice recordings are turned into text and the text is stored; the audio itself is not
            kept. Typed answers are stored.
          </li>
          <li>
            <strong>Activity:</strong> Quests, Verdicts, Points, Rewards given, Consequences, Streaks and
            weekly Digests, plus which Parent decided what.
          </li>
          <li>
            <strong>Model log:</strong> for each AI model call, a short summary of the input, the output,
            token counts, cost and timing. Parents can see this log.
          </li>
        </List>
        <p>
          We do not use advertising, analytics or tracking tools, and we do not sell or rent personal data.
        </p>
      </Section>

      <Section title="Why we use it">
        <List>
          <li>To sign Parents in and keep each Family's data separate from every other Family.</li>
          <li>To turn a Plan into Quests, check Proofs, keep the Points balance and write Digests.</li>
          <li>To keep content safe for children: every Quest passes a separate safety check first.</li>
          <li>To find and fix errors, and to keep the cost of the service under control.</li>
        </List>
        <p>
          Our legal bases are your consent (and, for a Child, the Parent's consent) and the need to provide
          the service you asked for.
        </p>
      </Section>

      <Section title="AI models and who processes your data">
        <p>
          GameSchooling relies on AI models. When a model call is needed, the relevant data is sent to the
          provider that runs it. Prompts carry the Child's age and the Plan. They never carry a Child's
          nickname or a Parent's name.
        </p>
        <List>
          <li>
            <strong>Meta Model API:</strong> Muse Wonder (planning and Digests), Muse Spark 1.3 (writing
            Quests, checking Proofs, safety checks, reading worksheets), Muse Image (Quest covers), SAM 3.1
            (finding objects in photos) and Muse Voice Transcribe (turning recordings into text). We use
            Meta's standard mode. Meta states that content in this mode is not used to train its models.
          </li>
          <li>
            <strong>Baseten:</strong> runs Muse Spark Open, which gives an independent second opinion on each
            Proof.
          </li>
          <li>
            <strong>Cloudflare:</strong> hosts the app, the database and stored photos.
          </li>
          <li>
            <strong>Google:</strong> handles Parent sign-in.
          </li>
        </List>
        <p>
          Some of these providers process data outside Indonesia. We use them only to provide the service, and
          each one handles data under its own terms and security measures.
        </p>
      </Section>

      <Section title="Cookies">
        <p>
          We set only the cookies the app needs to work: one keeps a Parent signed in, and one remembers for 4
          hours that a Child unlocked their PIN on this device. There are no advertising or analytics cookies.
        </p>
      </Section>

      <Section title="How long we keep it">
        <p>
          We keep a Family's data while the Family uses GameSchooling. When a Parent removes a Child, that
          Child's details, Plan, Quests, Proofs, Verdicts and Points are deleted from the database; the photo
          files themselves are deleted when you ask us to (see Your rights). Family invites expire after 7
          days. The Demo Family is shared and rebuilt every night, so do not enter real information into it.
        </p>
      </Section>

      <Section title="Your rights">
        <p>
          You can ask us to show you the data we hold about you or your Child, correct it, send you a copy,
          stop processing it, or delete it, including your whole Family and its stored photos. You can also
          withdraw consent at any time. Email <Email /> from the address you sign in with. We answer within 3
          × 24 hours, as Indonesian law requires, and complete deletion within 30 days.
        </p>
      </Section>

      <Section title="Security">
        <p>
          Data travels over HTTPS. Every request is checked so a Parent can reach only their own Family. PINs
          are stored hashed. If a breach affects your data, we will tell you and the authorities as the law
          requires.
        </p>
      </Section>

      <Section title="Changes and contact">
        <p>
          If we change this policy, we will update the date at the top. If the change matters, we will email
          Parents before it takes effect. Questions or requests: <Email />. See also our{" "}
          <Link to="/terms" className="underline underline-offset-2">
            Terms of Use
          </Link>
          .
        </p>
      </Section>
    </LegalPage>
  );
}
