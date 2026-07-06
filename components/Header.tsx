"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  MessageCircle,
  AlignRight,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SideDrawer from "./SideDrawer";
import NotificationBell from "./NotificationBell";
import { getAdminSession, logout } from "@/app/actions/auth";
import { usePathname } from "next/navigation";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSideDrawerOpen, setIsSideDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const pathname = usePathname();

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Services", href: "/services" },
    { name: "View Products", href: "/view-products" },
    { name: "Order Now", href: "/marketplace" },
    { name: "About us", href: "/#about" },
    { name: "Contact", href: "/contact" },
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const admin = await getAdminSession();
      setIsAdminLoggedIn(!!admin && admin.role === "admin");
    };
    checkLoginStatus();
  }, [pathname]);

  const handleLogout = async () => { await logout(); };

  return (
    <>
      <header className="absolute top-0 left-0 right-0 z-50 w-full">

        {/* Top bar — dark teal from logo ribbon */}
        <div className="bg-[#023E4A] text-white py-2 px-[2rem] border-b border-[#D4A017]/30 animate-slideDown">
          <div className="container mx-auto flex flex-wrap items-center justify-center md:justify-between">
            <div className="hidden md:flex items-center text-[12px] space-x-6 animate-fadeInLeft text-cyan-100">
              <span>24/7 Professional Consulting Services</span>
              <span className="text-[#D4A017]">vertexconsultancy84@gmail.com</span>
            </div>
            <div className="flex items-center space-x-4 animate-fadeInRight">
              <div className="flex space-x-4">
                <Facebook className="w-4 h-4 text-[#18a0fb] cursor-pointer hover:scale-110 transition-transform" />
                <Twitter className="w-4 h-4 text-[#1da1f2] cursor-pointer hover:scale-110 transition-transform" />
                <Instagram className="w-4 h-4 text-[#e1306c] cursor-pointer hover:scale-110 transition-transform" />
                <Youtube className="w-4 h-4 text-[#ff0000] cursor-pointer hover:scale-110 transition-transform" />
                <a href="https://wa.me/250784761274" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4 text-[#25D366] cursor-pointer hover:scale-110 transition-transform" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Main nav */}
        <nav
          className={`top-0 left-0 right-0 z-40 transition-all duration-200 animate-slideDown px-[2rem] ${
            scrolled
              ? "bg-[#023E4A] fixed shadow-lg shadow-cyan-900/40 border-b border-[#D4A017]/20"
              : "bg-transparent"
          }`}
        >
          <div className="container mx-auto">
            <div className="flex justify-between items-center py-4">

              {/* Logo */}
              <Link href="/" className="flex items-center gap-2 animate-fadeInLeft animation-delay-300">
                <span className="text-[16px] font-bold tracking-widest text-white hover:text-[#D4A017] transition-colors uppercase">
                  VERTEX CONSULTING
                </span>
                <span className="hidden sm:block text-[10px] font-semibold text-[#D4A017] tracking-widest uppercase border-l border-[#D4A017]/40 pl-2">
                  LTD
                </span>
              </Link>

              {/* Desktop nav links */}
              <div className="hidden lg:flex items-center space-x-8 animate-fadeInUp animation-delay-500">
                {navigation.map((item, index) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-white hover:text-[#D4A017] text-[15px] font-medium transition-colors animate-fadeInUp relative group"
                    style={{ animationDelay: `${600 + index * 100}ms` }}
                  >
                    {item.name}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#D4A017] group-hover:w-full transition-all duration-200" />
                  </Link>
                ))}
                {isAdminLoggedIn && (
                  <Link
                    href="/dashboard"
                    className="text-white hover:text-[#D4A017] text-[15px] font-medium transition-colors relative group"
                  >
                    Dashboard
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#D4A017] group-hover:w-full transition-all duration-200" />
                  </Link>
                )}
              </div>

              {/* CTA + drawer */}
              <div className="flex items-center gap-3 animate-fadeInRight animation-delay-700">
                {/* Notification bell — for logged-in users, hidden on the public home page */}
                {pathname !== "/" && <NotificationBell />}
                {isAdminLoggedIn ? (
                  <Button
                    onClick={handleLogout}
                    className="hidden lg:flex items-center gap-2 rounded-full text-sm px-5 py-1.5 h-auto min-h-0 font-semibold bg-[#D4A017] hover:bg-[#b8880f] text-[#023E4A] border-0 transition-all hover:scale-105"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </Button>
                ) : (
                  <Link href="/login">
                    <Button className="hidden lg:flex rounded-full text-sm px-5 py-1.5 h-auto min-h-0 font-semibold bg-[#D4A017] hover:bg-[#b8880f] text-[#023E4A] border-0 transition-all hover:scale-105">
                      Login / Sign Up
                    </Button>
                  </Link>
                )}

                <button onClick={() => setIsSideDrawerOpen(true)} className="hidden lg:block">
                  <AlignRight className="w-6 h-6 text-white cursor-pointer hover:text-[#D4A017] transition-colors" />
                </button>

                <button className="lg:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                  {isMenuOpen
                    ? <X className="w-6 h-6 hover:text-[#D4A017] transition-colors" />
                    : <Menu className="w-6 h-6 hover:text-[#D4A017] transition-colors" />
                  }
                </button>
              </div>
            </div>

            {/* Mobile menu */}
            {isMenuOpen && (
              <div className="lg:hidden py-4 border-t border-[#D4A017]/30 bg-[#023E4A] animate-slideDown rounded-b-xl">
                <div className="flex flex-col space-y-4 px-2">
                  {navigation.map((item, index) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="text-white hover:text-[#D4A017] transition-colors text-[16px] font-medium animate-fadeInLeft"
                      style={{ animationDelay: `${index * 100}ms` }}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                  {isAdminLoggedIn && (
                    <Link
                      href="/dashboard"
                      className="text-white hover:text-[#D4A017] transition-colors text-[16px] font-medium animate-fadeInLeft"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                  )}
                  {isAdminLoggedIn ? (
                    <Button onClick={handleLogout} className="text-[#023E4A] bg-[#D4A017] hover:bg-[#b8880f] w-fit font-semibold rounded-full px-5">
                      Logout
                    </Button>
                  ) : (
                    <Link href="/login">
                      <Button className="text-[#023E4A] bg-[#D4A017] hover:bg-[#b8880f] w-fit font-semibold rounded-full px-5">
                        Login / Sign Up
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </nav>
      </header>

      <SideDrawer isOpen={isSideDrawerOpen} onClose={() => setIsSideDrawerOpen(false)} />
    </>
  );
}
