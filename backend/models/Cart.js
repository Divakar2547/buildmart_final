const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    default: 1
  },
  price: {
    type: Number,
    required: true
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  totalAmount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

cartSchema.pre('save', function(next) {
  this.items = (this.items || []).filter(item => item && item.product);

  this.items.forEach(item => {
    const parsedQuantity = Number(item.quantity);
    item.quantity = Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 1;

    const parsedPrice = Number(item.price);
    item.price = Number.isFinite(parsedPrice) ? parsedPrice : 0;
  });

  this.totalAmount = this.items.reduce((total, item) => {
    return total + (Number(item.price) * Number(item.quantity));
  }, 0);

  this.totalAmount = Number.isFinite(this.totalAmount) ? this.totalAmount : 0;
  next();
});

cartSchema.methods.calculateTotal = function() {
  this.totalAmount = this.items.reduce((total, item) => {
    const parsedQuantity = Number(item.quantity);
    const parsedPrice = Number(item.price);
    return total + ((Number.isFinite(parsedPrice) ? parsedPrice : 0) * (Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 1));
  }, 0);
};

module.exports = mongoose.model('Cart', cartSchema);
