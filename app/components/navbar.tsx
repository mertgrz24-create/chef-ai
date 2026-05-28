"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full"
      style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #ebebeb" }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <span className="text-lg font-semibold tracking-tight">
          <span style={{ color: "#1a1a1a" }}>Chef</span>
          <span style={{ color: "#ffa51f" }}>AI</span>
        </span>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="text-sm transition-colors hover:text-[#1a1a1a]"
            style={{ color: "#888888" }}
          >
            Features
          </a>
          <a
            href="#pricing"
            className="text-sm transition-colors hover:text-[#1a1a1a]"
            style={{ color: "#888888" }}
          >
            Pricing
          </a>
          <Link
            href="/login"
            className="text-sm transition-colors hover:text-[#1a1a1a]"
            style={{ color: "#888888" }}
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="text-sm px-5 py-2 rounded-full transition-opacity hover:opacity-80"
            style={{ backgroundColor: "#1a1a1a", color: "#ffffff" }}
          >
            Get Started Free
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col justify-center gap-1.5 p-2"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          <span className="block w-6 h-0.5" style={{ backgroundColor: "#1a1a1a" }} />
          <span className="block w-6 h-0.5" style={{ backgroundColor: "#1a1a1a" }} />
          <span className="block w-6 h-0.5" style={{ backgroundColor: "#1a1a1a" }} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="md:hidden flex flex-col gap-2 px-6 py-4"
          style={{ backgroundColor: "#ffffff", borderTop: "1px solid #ebebeb" }}
        >
          <a
            href="#features"
            className="text-sm py-2 transition-colors hover:text-[#1a1a1a]"
            style={{ color: "#888888" }}
          >
            Features
          </a>
          <a
            href="#pricing"
            className="text-sm py-2 transition-colors hover:text-[#1a1a1a]"
            style={{ color: "#888888" }}
          >
            Pricing
          </a>
          <Link
            href="/login"
            className="text-sm py-2 transition-colors hover:text-[#1a1a1a]"
            style={{ color: "#888888" }}
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="text-sm mt-1 px-5 py-2.5 rounded-full text-center transition-opacity hover:opacity-80"
            style={{ backgroundColor: "#1a1a1a", color: "#ffffff" }}
          >
            Get Started Free
          </Link>
        </motion.div>
      )}
    </motion.header>
  );
}
