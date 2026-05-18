import { LegalPage } from "@/components/legal-page"

export const metadata = {
  title: "Cookie Policy | Shoutr",
  description: "How Shoutr uses cookies and similar technologies",
}

export default function CookiePolicyPage() {
  return (
    <LegalPage title="Cookie Policy">
      <p className="lead text-muted-foreground">
        Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
      </p>

      <h2>Overview</h2>
      <p>
        Shoutr uses cookies and browser storage to operate the service and, with your consent, to remember optional
        preferences. We do not use advertising or third-party analytics cookies on this application.
      </p>

      <h2>What you can choose</h2>
      <ul>
        <li>
          <strong>Essential</strong> — always active. Required for sign-in and wallet authentication.
        </li>
        <li>
          <strong>Preferences (functional)</strong> — optional. Remembers UI choices such as mobile sidebar state and
          theme. You can refuse these and still use Shoutr.
        </li>
      </ul>

      <h2>Cookies and storage we use</h2>
      <table className="w-full text-sm border-collapse not-prose">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2 pr-4 font-semibold">Name</th>
            <th className="py-2 pr-4 font-semibold">Type</th>
            <th className="py-2 pr-4 font-semibold">Purpose</th>
            <th className="py-2 font-semibold">Max. duration</th>
          </tr>
        </thead>
        <tbody className="text-muted-foreground">
          <tr className="border-b">
            <td className="py-3 pr-4 font-mono text-xs">auth_token</td>
            <td className="py-3 pr-4">Essential (HTTP cookie)</td>
            <td className="py-3 pr-4">Keeps you signed in after wallet login</td>
            <td className="py-3">7 days</td>
          </tr>
          <tr className="border-b">
            <td className="py-3 pr-4 font-mono text-xs">siwe_nonce</td>
            <td className="py-3 pr-4">Essential (HTTP cookie)</td>
            <td className="py-3 pr-4">Temporary nonce for Sign-In with Ethereum (prevents replay attacks)</td>
            <td className="py-3">10 minutes</td>
          </tr>
          <tr className="border-b">
            <td className="py-3 pr-4 font-mono text-xs">sidebar:state</td>
            <td className="py-3 pr-4">Preferences (HTTP cookie)</td>
            <td className="py-3 pr-4">Remembers whether the mobile navigation drawer was open</td>
            <td className="py-3">7 days</td>
          </tr>
          <tr className="border-b">
            <td className="py-3 pr-4 font-mono text-xs">theme</td>
            <td className="py-3 pr-4">Preferences (local storage)</td>
            <td className="py-3 pr-4">Stores light / dark / system theme choice</td>
            <td className="py-3">Until cleared</td>
          </tr>
          <tr>
            <td className="py-3 pr-4 font-mono text-xs">shoutr_cookie_consent</td>
            <td className="py-3 pr-4">Essential (local storage)</td>
            <td className="py-3 pr-4">Records your cookie consent choice and version</td>
            <td className="py-3">Until cleared</td>
          </tr>
        </tbody>
      </table>

      <h2>Third parties</h2>
      <p>
        Embedded content (for example YouTube or Vimeo previews in shouts) may set their own cookies if you interact
        with those embeds. Those providers are responsible for their own notices and policies.
      </p>

      <h2>Changing your choice</h2>
      <p>
        Use the cookie banner when it appears, or open <strong>Settings → Cookie preferences</strong> in the app to
        update functional cookies at any time. You can also clear cookies in your browser settings.
      </p>

      <h2>Legal basis (EEA / UK / Switzerland)</h2>
      <p>
        Essential cookies are used based on our legitimate interest in providing a secure, functioning service and, where
        applicable, to perform our contract with you. Preference cookies are used only with your consent, which you may
        withdraw at any time without affecting essential features.
      </p>
    </LegalPage>
  )
}
