export interface ProductImage {
  id?: string;
  url: string;
  publicId?: string;
  alt?: string;
  order?: number;
}

export interface ProductCount {
  reviews?: number;
  orderItems?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: "USER" | "ADMIN";
  createdAt: string;
  updatedAt: string;
  addresses?: Address[];
  wishlist?: WishlistItem[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  descriptionShort?: string;
  price: number;
  discountPrice?: number;
  stock: number;
  stockQuantity?: number;
  images: any[];
  video?: string;
  thumbnail?: string;
  color?: string;
  sizes?: string[];
  material?: string;
  weight?: string;
  careInstructions?: string;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isOnSale?: boolean;
  isSale?: boolean;
  saleEndDate?: string;
  rating: number;
  reviewCount: number;
  averageRating?: number;
  _count?: ProductCount;
  categoryId: string;
  category?: Category;
  brandId?: string;
  brand?: Brand;
  gender?: string;
  ageGroup?: string;
  tags?: string[];
  reviews?: Review[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  parent?: Category;
  children?: Category[];
  products?: Product[];
  createdAt: string;
  updatedAt: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  products?: Product[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id?: string;
  productId: string;
  product: Product;
  quantity: number;
  size?: string;
  color?: string;
  savedForLater: boolean;
  createdAt?: string;
}

export interface Cart {
  id: string;
  userId?: string;
  items: CartItem[];
  subtotal: number;
  total: number;
  discount: number;
  shipping: number;
  couponId?: string;
  coupon?: Coupon;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  user?: User;
  items: OrderItem[];
  status: OrderStatus;
  subtotal: number;
  shipping?: number;
  shippingFee?: number;
  discount: number;
  tax: number;
  total: number;
  couponId?: string;
  coupon?: Coupon;
  paymentMethod?: string;
  paymentStatus: PaymentStatus;
  paymentReference?: string;
  shippingAddress: Address;
  billingAddress?: Address;
  deliveryMethod: string;
  trackingNumber?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product?: Product;
  name?: string;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
  image?: string;
  createdAt: string;
}

export type OrderStatus = "PENDING" | "PAID" | "PROCESSING" | "PACKED" | "SHIPPED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED" | "RETURNED" | "REFUNDED" | "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "pending" | "completed" | "failed" | "refunded";

export interface Review {
  id: string;
  userId: string;
  user?: User;
  productId: string;
  product?: Product;
  rating: number;
  comment: string;
  images?: string[];
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  userId?: string;
  label?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode?: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderAmount?: number;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  link?: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  product: Product;
  createdAt: string;
}

export interface Subscriber {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface ProductFilters {
  category?: string;
  brand?: string;
  gender?: string;
  ageGroup?: string;
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  colors?: string[];
  isOnSale?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface CreateReviewInput {
  productId: string;
  rating: number;
  comment: string;
  images?: string[];
}

export interface CreateOrderInput {
  items: { productId: string; quantity: number; size?: string; color?: string }[];
  shippingAddress: Address;
  billingAddress?: Address;
  deliveryMethod: string;
  couponCode?: string;
  note?: string;
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  ordersByStatus: { status: string; count: number }[];
  revenueByMonth: { month: string; revenue: number }[];
  recentOrders: Order[];
  topProducts: Product[];
}

export interface SalesData {
  date: string;
  revenue: number;
  orders: number;
}

export interface NewsletterInput {
  email: string;
}

export interface ContactInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface PasswordChangeInput {
  currentPassword: string;
  newPassword: string;
}

export interface ProfileUpdateInput {
  name?: string;
  phone?: string;
  avatar?: string;
}
