export const siteConfig = {
  name: "Tolumak",
  description: "Premium fashion for the modern individual. Discover curated collections of clothing, shoes, bags, and accessories.",
  url: "https://tolumak.com",
  ogImage: "https://tolumak.com/og.jpg",
  links: { instagram: "https://instagram.com/tolumak", twitter: "https://twitter.com/tolumak", facebook: "https://facebook.com/tolumak" },
};

export const navLinks = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Men", href: "/shop?gender=male" },
  { label: "Women", href: "/shop?gender=female" },
  { label: "Kids", href: "/shop?gender=kids" },
  { label: "Shoes", href: "/shop?category=shoes" },
  { label: "Bags", href: "/shop?category=bags" },
  { label: "Sale", href: "/shop?sale=true" },
];

export const categories = [
  { name: "Clothing", slug: "clothing", image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500" },
  { name: "Shoes", slug: "shoes", image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500" },
  { name: "Bags", slug: "bags", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500" },
  { name: "Accessories", slug: "accessories", image: "https://images.unsplash.com/photo-1611921986308-c1a43c5b1c5a?w=500" },
  { name: "Jewelry", slug: "jewelry", image: "https://images.unsplash.com/photo-1515562141589-677acb0d1fb6?w=500" },
  { name: "Sportswear", slug: "sportswear", image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500" },
];

export const footerLinks = {
  quickLinks: [
    { label: "About Us", href: "/about" },
    { label: "Contact Us", href: "/contact" },
    { label: "Careers", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Gift Cards", href: "#" },
  ],
  customerService: [
    { label: "Help & FAQ", href: "/faq" },
    { label: "Shipping Info", href: "#" },
    { label: "Returns & Exchanges", href: "/return-policy" },
    { label: "Order Tracking", href: "/order-tracking" },
    { label: "Size Guide", href: "#" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms & Conditions", href: "/terms-conditions" },
    { label: "Return Policy", href: "/return-policy" },
  ],
};

export const genders = [
  { label: "Male", value: "MALE" },
  { label: "Female", value: "FEMALE" },
  { label: "Kids", value: "KIDS" },
  { label: "Unisex", value: "UNISEX" },
];

export const ageGroups = [
  { label: "Adults", value: "ADULT" },
  { label: "Children", value: "CHILDREN" },
];

export const sizes = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];

export const shoeSizes = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"];

export const colors = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Gray", hex: "#808080" },
  { name: "Red", hex: "#FF0000" },
  { name: "Blue", hex: "#0000FF" },
  { name: "Green", hex: "#008000" },
  { name: "Yellow", hex: "#FFFF00" },
  { name: "Pink", hex: "#FFC0CB" },
  { name: "Purple", hex: "#800080" },
  { name: "Orange", hex: "#FFA500" },
  { name: "Brown", hex: "#A52A2A" },
  { name: "Navy", hex: "#000080" },
  { name: "Beige", hex: "#F5F5DC" },
  { name: "Gold", hex: "#FFD700" },
  { name: "Silver", hex: "#C0C0C0" },
];

export const orderStatuses = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
  "REFUNDED",
];

/** Keep shipping rules in sync with backend/src/modules/orders/shipping.ts */
export const FREE_SHIPPING_THRESHOLD = 50_000;

export const deliveryMethods = [
  { id: "standard", name: "Standard Delivery", price: 1500, days: "5-7 business days" },
  { id: "express", name: "Express Delivery", price: 3500, days: "1-2 business days" },
  { id: "pickup", name: "Store Pickup", price: 0, days: "Same day" },
];

/** Compute shipping fee the same way the API does */
export function calculateShippingFee(deliveryMethodId: string, subtotal: number): number {
  if (deliveryMethodId === "pickup") return 0;
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  const method = deliveryMethods.find((d) => d.id === deliveryMethodId);
  return method?.price ?? deliveryMethods[0].price;
}

/** Bank transfer is currently the only supported payment method */
export const paymentMethods = [
  {
    id: "bank_transfer",
    name: "Bank Transfer",
    description: "Pay via direct bank transfer. Use your order number as the payment reference.",
  },
];

export const bankTransferDetails = {
  bankName: "GTBank",
  accountName: "Tolumak Fashion Store",
  accountNumber: "0123456789",
  note: "Transfer the exact order total and use your order number as the transfer reference. Orders are processed after payment is confirmed.",
};

export const sortOptions = [
  { label: "Latest", value: "latest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Best Sellers", value: "best_sellers" },
  { label: "Highest Rated", value: "highest_rated" },
];

export const whyChooseUs = [
  { title: "Free Shipping", description: "Free shipping on orders above ₦50,000", icon: "Truck" },
  { title: "Secure Payment", description: "100% secure payment processing", icon: "Shield" },
  { title: "Easy Returns", description: "30-day hassle-free return policy", icon: "RefreshCw" },
  { title: "24/7 Support", description: "Round-the-clock customer support", icon: "Headphones" },
];
