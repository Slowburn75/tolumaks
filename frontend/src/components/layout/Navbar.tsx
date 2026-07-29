"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { useCart } from "@/hooks/useCart";
import { useAuthStore } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";
import { useSiteSettings } from "@/providers/SiteSettingsProvider";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Women", href: "/shop?gender=female" },
  { label: "Men", href: "/shop?gender=male" },
  { label: "Kids", href: "/shop?ageGroup=children" },
  { label: "Shoes", href: "/shop?category=shoes" },
  { label: "Bags", href: "/shop?category=bags" },
  { label: "New In", href: "/shop?isNewArrival=true" },
  { label: "Sale", href: "/shop?sale=true" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { getItemCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { settings } = useSiteSettings();
  const cartCount = getItemCount();
  const overHero = pathname === "/" && !isScrolled && !isSearchOpen;
  const brand = (settings.storeName || "Tolumak").toUpperCase();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const submitSearch = () => {
    const q = searchQuery.trim();
    if (q) window.location.href = "/shop?search=" + encodeURIComponent(q);
  };

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-luxury",
          overHero
            ? "border-transparent bg-transparent text-white"
            : "border-b border-border bg-background/95 text-foreground backdrop-blur-md"
        )}
      >
        <div className="container-page px-5 sm:px-8 lg:px-12 xl:px-16">
          <div className="grid h-14 grid-cols-[1fr_auto_1fr] items-center lg:h-16">
            {/* Left: menu / nav */}
            <div className="flex items-center gap-6">
              <button
                className="lg:hidden -ml-1 p-2"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </button>
              <nav className="hidden items-center gap-7 lg:flex">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      "nav-link-farfetch",
                      overHero && "text-white/85 hover:text-white",
                      item.label === "Sale" && !overHero && "text-muted-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Center: logo — Farfetch style */}
            <Link
              href="/"
              className="font-display text-[1.35rem] font-medium tracking-[0.28em] sm:text-[1.5rem]"
              aria-label={`${brand} home`}
            >
              {brand}
            </Link>

            {/* Right: utilities */}
            <div className="flex items-center justify-end gap-1 sm:gap-2">
              <button
                className={cn("p-2 transition-opacity hover:opacity-60", overHero && "text-white")}
                onClick={() => setIsSearchOpen((v) => !v)}
                aria-label="Search"
              >
                <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </button>
              <Link
                href="/wishlist"
                className={cn(
                  "relative hidden p-2 transition-opacity hover:opacity-60 sm:block",
                  overHero && "text-white"
                )}
                aria-label="Wishlist"
              >
                <Heart className="h-[18px] w-[18px]" strokeWidth={1.5} />
                {wishlistItems.length > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center bg-foreground px-1 text-[9px] text-background">
                    {wishlistItems.length}
                  </span>
                )}
              </Link>
              <CartButton count={cartCount} overHero={overHero} />
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="ml-1 p-1">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={user?.avatar} />
                        <AvatarFallback className="bg-foreground text-[10px] text-background">
                          {user?.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 rounded-none border-border p-0">
                    <DropdownMenuLabel className="px-4 py-3">
                      <p className="text-sm font-medium normal-case tracking-normal">{user?.name}</p>
                      <p className="text-xs font-normal normal-case tracking-normal text-muted-foreground">
                        {user?.email}
                      </p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="px-4 py-2.5 text-xs uppercase tracking-[0.14em]">
                      <Link href="/dashboard">Account</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="px-4 py-2.5 text-xs uppercase tracking-[0.14em]">
                      <Link href="/dashboard/orders">Orders</Link>
                    </DropdownMenuItem>
                    {user?.role === "ADMIN" && (
                      <DropdownMenuItem asChild className="px-4 py-2.5 text-xs uppercase tracking-[0.14em]">
                        <Link href="/admin">Admin</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => logout()}
                      className="px-4 py-2.5 text-xs uppercase tracking-[0.14em] text-destructive"
                    >
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link
                  href="/login"
                  className={cn("p-2 transition-opacity hover:opacity-60", overHero && "text-white")}
                  aria-label="Sign in"
                >
                  <User className="h-[18px] w-[18px]" strokeWidth={1.5} />
                </Link>
              )}
            </div>
          </div>
        </div>

        {isSearchOpen && (
          <div
            className={cn(
              "border-t",
              overHero ? "border-white/15 bg-black/80 text-white backdrop-blur-xl" : "border-border bg-background"
            )}
          >
            <div className="container-page flex items-center gap-3 px-5 py-4 sm:px-8 lg:px-12">
              <Search className="h-4 w-4 shrink-0 opacity-50" strokeWidth={1.5} />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitSearch()}
                placeholder="Search designers, categories, products"
                className={cn(
                  "h-10 border-0 bg-transparent px-0 text-sm tracking-wide shadow-none focus-visible:ring-0",
                  overHero && "text-white placeholder:text-white/45"
                )}
                autoFocus
              />
              <button onClick={() => setIsSearchOpen(false)} aria-label="Close search">
                <X className="h-4 w-4 opacity-50" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        )}
      </header>
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <CartDrawer />
    </>
  );
}

function CartButton({ count, overHero }: { count: number; overHero: boolean }) {
  const { toggleCart } = useCart();
  return (
    <button
      onClick={toggleCart}
      className={cn("relative p-2 transition-opacity hover:opacity-60", overHero && "text-white")}
      aria-label="Open bag"
    >
      <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.5} />
      {count > 0 && (
        <span
          className={cn(
            "absolute right-0.5 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center px-1 text-[9px]",
            overHero ? "bg-white text-black" : "bg-foreground text-background"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
