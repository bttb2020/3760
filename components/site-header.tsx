"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

const NAV = [
  { href: "/", label: "首页" },
  { href: "/calendar", label: "游戏日历" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <a className="brand" href="/" onClick={() => setOpen(false)}>
        <span className="brand-mark">3760</span>
        <span className="brand-copy">
          <strong>无尽冬日 · 3760</strong>
          <small>WHITEOUT SURVIVAL</small>
        </span>
      </a>

      <button
        type="button"
        className="menu-button"
        aria-label={open ? "关闭菜单" : "打开菜单"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      <nav className={`main-nav${open ? " is-open" : ""}`} aria-label="主导航">
        {NAV.map((item) => (
          <a key={item.href} href={item.href} onClick={() => setOpen(false)}>
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
