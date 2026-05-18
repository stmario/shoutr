import Link from "next/link"
import { LegalPage } from "@/components/legal-page"

export const metadata = {
  title: "Privacy Policy | Shoutr",
  description: "How Shoutr processes personal data",
}

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p className="lead text-muted-foreground">
        Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
      </p>

      <h2>Who we are</h2>
      <p>
        Shoutr is a social platform where users publish shouts, follow others, and message each other. Wallet-based
        sign-in (Sign-In with Ethereum) is used to authenticate accounts.
      </p>

      <h2>Data we process</h2>
      <ul>
        <li>Account data: username, profile information, wallet address, avatar URL, and content you post.</li>
        <li>Usage data: shouts, comments, likes, follows, messages, and in-app notifications.</li>
        <li>Technical data: session cookies required for login (see our Cookie Policy).</li>
      </ul>

      <h2>Why we process it</h2>
      <ul>
        <li>To provide and secure the service (authentication, fraud prevention, moderation features).</li>
        <li>To display your profile and content to other users according to your actions and privacy settings.</li>
        <li>To send in-app notifications you have not disabled in settings.</li>
      </ul>

      <h2>Sharing</h2>
      <p>
        Public profile and shout content are visible to other users as designed. We do not sell personal data. We may
        share data with infrastructure providers that host the application and database, under appropriate agreements.
      </p>

      <h2>Retention</h2>
      <p>
        We keep account and content data while your account exists. Session cookies expire as described in the{" "}
        <Link href="/legal/cookies" className="text-purple-700 hover:underline">
          Cookie Policy
        </Link>
        .
      </p>

      <h2>Your rights</h2>
      <p>
        Depending on your location, you may have rights to access, correct, delete, or restrict processing of your
        personal data, and to withdraw consent for optional cookies. Contact the operator of this Shoutr instance to
        exercise these rights.
      </p>

      <h2>Contact</h2>
      <p>
        For privacy requests, contact the administrator of this Shoutr deployment. If you operate your own instance,
        replace this section with your legal entity details and contact address.
      </p>
    </LegalPage>
  )
}
