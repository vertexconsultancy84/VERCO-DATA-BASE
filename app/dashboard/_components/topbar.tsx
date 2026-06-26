"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/contacts", label: "Contacts" },
  { href: "/dashboard/create-user", label: "Create User" },
];

export default function TopBar() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 w-full bg-white shadow z-50">
      <nav className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "text-gray-700 hover:text-blue-600 transition-colors",
                pathname === link.href ? "text-blue-600 font-semibold" : "font-medium"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
