export class Service {
  constructor(id, name, description, duration, original, price, brand, image) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.duration = duration;
    this.original = original;
    this.price = price;
    this.brand = brand;
    this.image = image;
  }
}

export class Package {
  constructor(id, name, description, duration, original, price, image) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.duration = duration;
    this.original = original;
    this.price = price;
    this.image = image;
  }
}

export class CartItem {
  constructor(item, qty = 1) {
    this.id = item.id;
    this.name = item.name;
    this.description = item.description;
    this.duration = item.duration;
    this.original = item.original;
    this.price = item.price;
    this.brand = item.brand || undefined;
    this.image = item.image;
    this.qty = qty;
  }
}

export class User {
  constructor(name = '', phone = '', line = '', street = '', area = '', city = '', pincode = '') {
    this.name = name;
    this.phone = phone;
    this.line = line;
    this.street = street;
    this.area = area;
    this.city = city;
    this.pincode = pincode;
  }
}

export class Booking {
  constructor(id, date, time, services, total, status = 'Pending') {
    this.id = id;
    this.date = date;
    this.time = time;
    this.services = services;
    this.total = total;
    this.status = status;
  }
}
