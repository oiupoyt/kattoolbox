import ToolLayout from "@/components/ToolLayout";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <ToolLayout
      title="Privacy Policy"
      description="Information on data processing, third-party advertising cookies, and local execution."
      showSideAds={false}
    >
      <div className="space-y-6 text-xs text-gray-400 leading-relaxed font-mono">
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-200">1. Client-Side Data Handling</h2>
          <p>
            kattoolbox operates on a zero-knowledge architecture. All file processing—including image compression, EXIF metadata stripping, PDF manipulation, redaction, and code formatting—executes strictly within your local web browser using client-side JavaScript, WebAssembly, and HTML5 Canvas.
          </p>
          <p>
            Files uploaded to these utilities are never transmitted across the network, stored on remote servers, or collected by us.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-200">2. Third-Party Advertising and Cookies</h2>
          <p>
            We use third-party advertising partners, including Google AdSense, to serve advertisements when you visit our website. These companies may use cookies and web beacons to collect non-personally identifiable information (such as your browser type, device type, IP address, and interaction history) to provide relevant advertisements about goods and services of interest to you.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-gray-400">
            <li>
              Google&#39;s use of advertising cookies enables it and its partners to serve ads based on visits to this site and/or other sites on the Internet.
            </li>
            <li>
              Users may opt out of personalized advertising by visiting{" "}
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white underline"
              >
                Google Ads Settings
              </a>{" "}
              or by visiting{" "}
              <a
                href="https://www.aboutads.info"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white underline"
              >
                aboutads.info
              </a>
              .
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-200">3. Log Files &amp; Hosting</h2>
          <p>
            Our hosting provider (Vercel) automatically logs standard server access requests (e.g., HTTP status codes, user-agent strings, and requesting timestamps) strictly for performance monitoring and DDoS prevention. No personal identity information is recorded or stored by our applications.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-200">4. Contact &amp; Updates</h2>
          <p>
            This policy was last updated in September 2026. If you have questions regarding privacy or local data execution, you can view the open-source repository at{" "}
            <a
              href="https://github.com/oiupoyt/kattoolbox"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white underline"
            >
              github.com/oiupoyt/kattoolbox
            </a>
            .
          </p>
        </section>

        <div className="pt-4 border-t border-[#1a1a1a]">
          <Link href="/" className="text-gray-300 hover:text-white transition-colors">
            ← Return to utilities index
          </Link>
        </div>
      </div>
    </ToolLayout>
  );
}
