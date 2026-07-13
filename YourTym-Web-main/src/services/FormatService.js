export class FormatService {
  static formatPrice(value) {
    return `₹${value.toLocaleString('en-IN')}`;
  }

  static calculateTotals(cart) {
    return cart.reduce(
      (acc, item) => ({
        price: acc.price + item.price * item.qty,
        duration: acc.duration + (Number(item.duration) || 0) * (Number(item.qty) || 0),
        count: acc.count + item.qty,
      }),
      { price: 0, duration: 0, count: 0 }
    );
  }
}
