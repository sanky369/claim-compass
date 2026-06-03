import Link from "next/link";
import { Logo } from "./logo";

const links = [
  { href: "#problem", label: "Problem" },
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/70 bg-stone-50/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" aria-label="ClaimCompass home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-stone-600 transition-colors hover:text-stone-900"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/signin"
            className="hidden text-sm font-medium text-stone-600 hover:text-stone-900 md:block"
          >
            Sign in
          </Link>
          <Link
            href="/signin?next=/demo/denials/new"
            className="inline-flex h-9 items-center justify-center rounded-full bg-stone-900 px-4 text-sm font-medium text-white shadow-sm transition-all hover:bg-stone-800 hover:shadow"
          >
            Decode my denial
          </Link>
        </div>
      </div>
    </header>
  );
}
