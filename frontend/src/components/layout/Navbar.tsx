"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  {
    label: "Men",
    href: "/shop?gender=male",
    image:
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=500&q=80",
    links: ["T-Shirts", "Shorts", "Sneakers", "Bags"],
  },
  {
    label: "Women",
    href: "/shop?gender=female",
    image:
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=500&q=80",
    links: ["Dresses", "Tops", "Yoga", "Accessories"],
  },
  {
    label: "Kids",
    href: "/shop?ageGroup=children",
    image:
      "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=500&q=80",
    links: ["New In", "School", "Playwear", "Shoes"],
  },
  {
    label: "Shoes",
    href: "/shop?category=shoes",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80",
    links: ["Running", "Lifestyle", "Canvas", "Slides"],
  },
  {
    label: "Bags",
    href: "/shop?category=bags",
    image:
      "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=500&q=80",
    links: ["Totes", "Crossbody", "Travel", "Work"],
  },
  {
    label: "New",
    href: "/shop?isNewArrival=true",
    image:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=500&q=80",
    links: ["This Week", "Trending", "Premium Edit", "Gifts"],
  },
  {
    label: "Sale",
    href: "/shop?sale=true",
    image:
      "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=500&q=80",
    links: ["Last Chance", "20% Off", "Best Deals", "Clearance"],
  },
];

const bg = (image: string) => ({ backgroundImage: "url(" + image + ")" });

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
  const brand = settings.storeName?.toUpperCase() || "TOLUMAK";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const submitSearch = () => {
    const query = searchQuery.trim();
    if (query) window.location.href = "/shop?search=" + encodeURIComponent(query);
  };

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          overHero
            ? "border-transparent bg-transparent text-white"
            : "border-b border-border/60 bg-background/80 text-foreground shadow-soft backdrop-blur-2xl"
        )}
      >
        <div className="container-page px-4 sm:px-6 lg:px-8">
          <div className="flex h-[4.5rem] items-center justify-between lg:h-20">
            <button
              className={cn(
                "-ml-2 rounded-full p-2.5 transition-colors lg:hidden",
                overHero ? "hover:bg-white/10" : "hover:bg-secondary"
              )}
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link
              href="/"
              className="font-display text-[1.65rem] font-semibold tracking-[0.02em] lg:text-[1.85rem]"
              aria-label={`${brand} home`}
            >
              {brand}
            </Link>

            <nav className="hidden items-center gap-0.5 lg:flex">
              {navItems.map((item) => (
                <div key={item.label} className="group/item relative py-7">
                  <Link
                    href={item.href}
                    className={cn(
                      "rounded-full px-3.5 py-2 text-[13px] font-medium tracking-wide transition-colors",
                      overHero
                        ? "text-white/88 hover:bg-white/10 hover:text-white"
                        : "text-foreground/70 hover:bg-secondary hover:text-foreground",
                      item.label === "Sale" && (overHero ? "text-amber-200" : "text-gold")
                    )}
                  >
                    {item.label}
                  </Link>
                  <div className="pointer-events-none absolute left-1/2 top-full w-[min(920px,calc(100vw-3rem))] -translate-x-1/2 translate-y-3 opacity-0 transition-all duration-200 group-hover/item:pointer-events-auto group-hover/item:translate-y-0 group-hover/item:opacity-100">
                    <div className="grid grid-cols-[1.15fr_1fr_1fr] gap-6 rounded-3xl border border-border/80 bg-background p-5 text-foreground shadow-glow">
                      <Link
                        href={item.href}
                        className="group relative min-h-[240px] overflow-hidden rounded-2xl bg-muted"
                      >
                        <div
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                          style={bg(item.image)}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                        <div className="absolute bottom-0 p-5 text-white">
                          <p className="text-[11px] uppercase tracking-[0.24em] text-white/70">
                            Featured
                          </p>
                          <h3 className="mt-2 font-display text-3xl font-medium">
                            Shop {item.label}
                          </h3>
                        </div>
                      </Link>
                      <div className="space-y-3 py-2">
                        <p className="eyebrow">Categories</p>
                        {item.links.map((link) => (
                          <Link
                            key={link}
                            href={item.href}
                            className="block text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
                          >
                            {link}
                          </Link>
                        ))}
                      </div>
                      <div className="space-y-3 py-2">
                        <p className="eyebrow">Quick links</p>
                        <Link
                          href="/shop?isNewArrival=true"
                          className="block text-sm font-medium text-foreground/80 hover:text-foreground"
                        >
                          New arrivals
                        </Link>
                        <Link
                          href="/shop?isBestSeller=true"
                          className="block text-sm font-medium text-foreground/80 hover:text-foreground"
                        >
                          Best sellers
                        </Link>
                        <Link
                          href="/shop?sale=true"
                          className="block text-sm font-medium text-foreground/80 hover:text-foreground"
                        >
                          Sale edit
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </nav>

            <div className="flex items-center gap-0.5 sm:gap-1">
              <button
                className={cn(
                  "rounded-full p-2.5 transition-colors",
                  overHero ? "hover:bg-white/10" : "hover:bg-secondary"
                )}
                onClick={() => setIsSearchOpen((v) => !v)}
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>
              <Link
                href="/wishlist"
                className={cn(
                  "relative hidden rounded-full p-2.5 transition-colors sm:block",
                  overHero ? "hover:bg-white/10" : "hover:bg-secondary"
                )}
                aria-label="Wishlist"
              >
                <Heart className="h-5 w-5" />
                {wishlistItems.length > 0 && (
                  <Badge className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full p-0 text-[10px]">
                    {wishlistItems.length}
                  </Badge>
                )}
              </Link>
              <CartButton count={cartCount} overHero={overHero} />
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        "rounded-full p-1 transition-colors",
                        overHero ? "hover:bg-white/10" : "hover:bg-secondary"
                      )}
                    >
                      <Avatar className="h-8 w-8 ring-2 ring-background/40">
                        <AvatarImage src={user?.avatar} />
                        <AvatarFallback className="bg-primary text-[11px] text-primary-foreground">
                          {user?.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1.5 shadow-glow">
                    <DropdownMenuLabel>
                      <p className="font-medium">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/orders">My Orders</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/wishlist">Wishlist</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/profile">Profile</Link>
                    </DropdownMenuItem>
                    {user?.role === "ADMIN" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin">Admin Dashboard</Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => logout()} className="text-destructive">
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      overHero ? "text-white hover:bg-white/10 hover:text-white" : ""
                    )}
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {isSearchOpen && (
          <div className="border-t border-border/60 bg-background/95 text-foreground shadow-soft backdrop-blur-xl">
            <div className="mx-auto max-w-2xl px-4 py-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitSearch()}
                  placeholder="Search dresses, sneakers, bags…"
                  className="h-12 rounded-full border-border/80 bg-secondary/40 pl-12 pr-14 text-base"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2"
                  onClick={() => setIsSearchOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
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
      className={cn(
        "relative rounded-full p-2.5 transition-colors",
        overHero ? "hover:bg-white/10" : "hover:bg-secondary"
      )}
      aria-label="Open cart"
    >
      <ShoppingBag className="h-5 w-5" />
      {count > 0 && (
        <Badge className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full p-0 text-[10px]">
          {count}
        </Badge>
      )}
    </button>
  );
}
