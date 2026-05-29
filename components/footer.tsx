import { Logo } from "./logo";

const cols = [
  {
    title: "Product",
    links: ["Denial Decoder", "Triage Copilot", "Credentialing Monitor", "Appeal Generator", "Pricing"],
  },
  {
    title: "Resources",
    links: ["Behavioral health CPT cheat sheet", "Telehealth modifier guide", "CAQH playbook", "Blog", "Help center"],
  },
  {
    title: "Company",
    links: ["About", "Security & HIPAA", "Careers", "Contact"],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-stone-50">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm text-stone-600">
              The insurance revenue copilot for therapists. Decode denials,
              triage the next step, and protect your practice revenue —
              without switching EHRs.
            </p>
            <div className="mt-6 flex items-center gap-3 text-xs text-stone-500">
              <span className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-2.5 py-1 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                HIPAA-compliant
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-2.5 py-1 font-medium">
                BAA available
              </span>
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                {c.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-stone-700 hover:text-stone-900"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-stone-200 pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-stone-500">
            © {new Date().getFullYear()} ClaimCompass. Built for therapists who
            bill independently.
          </p>
          <div className="flex items-center gap-5 text-xs text-stone-500">
            <a href="#" className="hover:text-stone-900">Privacy</a>
            <a href="#" className="hover:text-stone-900">Terms</a>
            <a href="#" className="hover:text-stone-900">Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
