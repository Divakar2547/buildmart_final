import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight, Truck, Calendar } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../components/common';

const CATEGORY_IMAGES = {
  'Cement': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=100&q=80',
  'Steel': 'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=100&q=80',
  'Tools': 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=100&q=80',
};

// Delivery date: 3–6 business days from today
function getDeliveryRange() {
  const today = new Date();
  const addBusinessDays = (date, days) => {
    let d = new Date(date);
    let added = 0;
    while (added < days) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0 && d.getDay() !== 6) added++;
    }
    return d;
  };
  const fmt = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return `${fmt(addBusinessDays(today, 3))} – ${fmt(addBusinessDays(today, 6))}`;
}

// Shipping: free above ₹5000, else based on total
function getShipping(total) {
  if (total >= 5000) return 0;
  if (total >= 2000) return 149;
  if (total >= 500) return 299;
  return 399;
}

export default function CartPage() {
  const { cart, cartLoading, updateQuantity, removeFromCart } = useCart();
  const items = cart.items || [];
  const itemCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const subtotal = items.reduce((sum, item) => {
    return sum + ((Number(item.product?.price ?? item.price ?? 0)) * (Number(item.quantity) || 0));
  }, 0);

  const shipping = getShipping(subtotal);
  const deliveryRange = getDeliveryRange();
  const tax = Math.round(subtotal * 0.18);
  const grandTotal = subtotal + shipping + tax;

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <ShoppingCart size={64} className="text-steel-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-black mb-2">Your cart is empty</h2>
        <p className="text-steel-600 mb-8">Browse our products and add items to get started</p>
        <Link to="/products" className="btn-primary inline-flex items-center gap-2">
          Start Shopping <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-black mb-8">Shopping Cart ({itemCount} items)</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const product = item.product;
            if (!product) return null;
            const price = Number(product.price ?? item.price ?? 0);
            const imageUrl = product.images?.[0]?.url || CATEGORY_IMAGES[product.category] || '';
            return (
              <div key={item._id} className="card p-4 flex gap-4">
                <Link to={`/products/${product._id}`} className="w-20 h-20 rounded-xl overflow-hidden bg-steel-200 flex-shrink-0">
                  <img
                    src={imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=100&q=80'; }}
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2">
                    <div className="min-w-0">
                      <Link to={`/products/${product._id}`} className="font-semibold text-black hover:text-primary-600 transition-colors text-sm line-clamp-2">
                        {product.name}
                      </Link>
                      <p className="text-xs text-steel-600 mt-0.5">{product.category} • {product.brand}</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item._id)}
                      className="text-steel-500 hover:text-red-500 transition-colors flex-shrink-0 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-steel-300 rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item._id, item.quantity - 1)}
                        disabled={cartLoading}
                        className="px-2.5 py-1.5 hover:bg-steel-200 transition-colors text-black"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="px-3 py-1.5 text-sm font-semibold text-black min-w-[36px] text-center bg-steel-100">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item._id, item.quantity + 1)}
                        disabled={cartLoading || item.quantity >= product.stock}
                        className="px-2.5 py-1.5 hover:bg-steel-200 transition-colors text-black disabled:opacity-40"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary-600">{formatPrice(price * item.quantity)}</p>
                      <p className="text-xs text-steel-600">{formatPrice(price)} / {product.unit}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h2 className="font-bold text-black text-lg mb-5">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-steel-700">
                <span>Items Total</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-steel-700">
                <span>Shipping</span>
                {shipping === 0 ? (
                  <span className="text-green-600 font-medium">FREE</span>
                ) : (
                  <span>{formatPrice(shipping)}</span>
                )}
              </div>
              <div className="flex justify-between text-steel-700">
                <span>GST (18%)</span>
                <span>{formatPrice(tax)}</span>
              </div>
              {shipping === 0 && (
                <p className="text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-lg flex items-center gap-1">
                  🎉 You saved on shipping!
                </p>
              )}
              <div className="border-t border-steel-300 pt-3 flex justify-between font-bold text-black">
                <span>Total</span>
                <span className="text-lg text-primary-600">{formatPrice(grandTotal)}</span>
              </div>
            </div>

            {/* Delivery Date */}
            <div className="mt-4 p-3 rounded-lg flex items-center gap-2" style={{ backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}>
              <Calendar size={15} style={{ color: '#f59e0b', flexShrink: 0 }} />
              <div>
                <p className="text-xs font-semibold" style={{ color: '#f59e0b' }}>Estimated Delivery</p>
                <p className="text-xs text-steel-700">{deliveryRange}</p>
              </div>
            </div>

            {/* Shipping tiers */}
            <div className="mt-3 text-xs text-steel-600 space-y-1">
              {subtotal < 5000 && (
                <p className="flex items-center gap-1">
                  <Truck size={12} /> Add {formatPrice(5000 - subtotal)} more for <span className="text-green-600 font-medium">FREE shipping</span>
                </p>
              )}
              {subtotal < 2000 && (
                <p>Orders ₹2,000–₹4,999 → ₹149 shipping</p>
              )}
            </div>
            <Link to="/checkout" className="btn-primary w-full flex items-center justify-center gap-2 mt-5">
              Proceed to Checkout <ArrowRight size={18} />
            </Link>
            <Link to="/products" className="btn-secondary w-full flex items-center justify-center mt-3 text-sm">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
