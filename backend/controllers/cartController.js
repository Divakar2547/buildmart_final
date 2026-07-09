const Cart = require('../models/Cart');
const Product = require('../models/Product');

exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart) {
      return res.json({ success: true, cart: { items: [], totalAmount: 0 } });
    }

    // If any items have a null product (deleted), clean them up in background
    const hasOrphans = cart.items.some(item => !item.product || !item.product._id);
    if (hasOrphans) {
      await Cart.findByIdAndUpdate(cart._id, {
        $pull: { items: { product: null } }
      });
      // Return fresh populated cart after cleanup
      const cleaned = await Cart.findById(cart._id).populate('items.product');
      return res.json({ success: true, cart: cleaned });
    }

    res.json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient stock' });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    cart.items = (cart.items || []).filter(item => item && item.product);
    for (const item of cart.items) {
      const itemPrice = Number(item.price);
      if (!Number.isFinite(itemPrice)) {
        const productDoc = await Product.findById(item.product);
        item.price = Number.isFinite(Number(productDoc?.price ?? productDoc?.originalPrice ?? 0))
          ? Number(productDoc.price ?? productDoc.originalPrice ?? 0)
          : 0;
      }
    }

    const normalizedProductId = productId.toString();
    const existingItem = cart.items.find(item => {
      const itemProductId = item.product?.toString?.();
      return itemProductId && itemProductId === normalizedProductId;
    });

    const safePrice = Number.isFinite(Number(product.price)) ? Number(product.price) : 0;
    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.price = safePrice;
    } else {
      cart.items.push({ product: productId, quantity, price: safePrice });
    }

    cart.calculateTotal();
    await cart.save();
    await cart.populate('items.product');
    res.json({ success: true, cart, message: 'Added to cart' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    if (quantity <= 0) {
      cart.items.pull(itemId);
    } else {
      item.quantity = quantity;
    }

    cart.calculateTotal();
    await cart.save();
    await cart.populate('items.product');
    res.json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    cart.items.pull(req.params.itemId);
    cart.calculateTotal();
    await cart.save();
    await cart.populate('items.product');
    res.json({ success: true, cart, message: 'Item removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { items: [], totalAmount: 0 }
    );
    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
