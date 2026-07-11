import { Service, Package } from '../models/index.js';
import { images } from '../models/constants.js';

function toService(item, i) {
  return new Service(
    `${item[0].toLowerCase().replaceAll(' ', '-')}-${i}`,
    item[0],
    item[1],
    item[2],
    item[3],
    item[4],
    item[5],
    item[6]
  );
}

export class ServiceDataService {
  static getWomenServices() {
    const rawData = [
      ['Waxing', 'Full arms, legs or Rica roll-on waxing', 45, 1199, 699, 'Rica, Plum', images.waxing],
      ['Facial', 'Glow facial with relaxing massage', 60, 1899, 1299, 'Lotus, O3+', images.facial],
      ['Cleanup', 'Deep cleansing and instant radiance', 35, 999, 599, 'Plum, Lotus', images.cleanup],
      ['Bleach & Detan', 'Brightening face, neck and arms care', 40, 1099, 649, 'OxyLife, Lotus', images.detan],
      ['Massage', 'Relaxing head, neck and shoulder therapy', 45, 1299, 799, 'Biotique, Plum', images.massage],
      ['Hair Care', 'Hair spa, wash, blow dry and repair care', 75, 2499, 1599, "L'Oreal, Schwarzkopf", images.hair],
      ['Threading', 'Eyebrows, upper lip and face threading', 25, 499, 249, 'Rica, Plum', images.threading],
      ['Pedicure', 'Luxury foot soak, scrub and polish', 50, 1499, 899, 'Lotus, OPI', images.pedicure],
      ['Manicure', 'Premium nail shaping, scrub and polish', 45, 1299, 799, 'Lotus, OPI', images.manicure],
    ];
    return rawData.map(toService);
  }

  static getMenServices() {
    const rawData = [
      ['Haircut', 'Precision haircut by trained stylist', 40, 799, 449, "L'Oreal, Schwarzkopf", images.haircut],
      ['Beard Styling', 'Trim, shape and hot towel finish', 30, 599, 349, "L'Oreal, Beardo", images.beard],
      ['Haircut + Beard Combo', 'Complete grooming with styling', 60, 1199, 699, "L'Oreal, Beardo", images.menSalon],
      ['Hair Spa', 'Scalp care, massage and hair repair', 60, 1699, 999, "L'Oreal, Schwarzkopf", images.hair],
      ['Facial', 'Men skin brightening facial', 55, 1599, 999, 'Lotus, O3+', images.facialMen],
      ['Cleanup', 'Deep cleanse for oily and tired skin', 35, 899, 549, 'Plum, Lotus', images.cleanup],
      ['Massage', 'Head, back and shoulder de-stress', 45, 1299, 799, 'Biotique, Plum', images.spaMen],
      ['Detan', 'Face and neck tan removal', 35, 899, 499, 'OxyLife, Lotus', images.detan],
      ['Pedicure', 'Foot care with soak and massage', 45, 1299, 799, 'Lotus, OPI', images.pedicure],
      ['Manicure', 'Hand care, shape and buff', 35, 999, 599, 'Lotus, OPI', images.manicure],
    ];
    return rawData.map(toService);
  }

  static getPackages() {
    const womenServices = this.getWomenServices();
    const rawData = [
      ['Complete Wax', 'Full legs, full arms, underarms, stomach, back and honey wax finish', 120, 2499, 1499, images.waxing],
      ['Ready To Go', 'Cleanup, threading, half arms waxing and quick hair setting', 100, 2999, 1799, images.womenSkin],
      ['Party Ready', 'Facial, manicure, pedicure, hair styling and glow detan', 180, 4999, 2999, images.facial],
      ['Head To Toe', 'Full body waxing, facial, massage, manicure and pedicure', 240, 6999, 4499, images.spaWomen],
      ['Make Your Own Package', 'Build a custom salon day from waxing, bleach and massage picks', 90, 1999, 999, images.hero],
    ];
    return rawData.map((p, i) => new Package(
      `pkg-${i}`,
      p[0],
      p[1],
      p[2],
      p[3],
      p[4],
      p[5]
    ));
  }

  static getHomeCategories() {
    return [
      ['Salon For Women', images.womenSalon, '/women-services'],
      ['Women Skin & Hair Care', images.womenSkin, '/women-services'],
      ['Spa For Men', images.spaMen, '/men-services'],
      ['Spa For Women', images.spaWomen, '/women-services'],
      ['Salon For Men', images.menSalon, '/men-services'],
      ['Mens Skin & Hair Care', images.facialMen, '/men-services'],
    ];
  }

  static getBookingHistory() {
    return [
      ['YT-1669297452', '12 Jun 2026, 5:30 PM', 'Head massage, Manicure', 7396, 'Pending'],
      ['YT-1669221640', '04 Jun 2026, 11:00 AM', 'Ready To Go Package', 1799, 'Completed'],
      ['YT-1669012788', '28 May 2026, 3:00 PM', 'Haircut + Beard Combo', 699, 'Cancelled'],
    ];
  }

  static getOffers() {
    return ['YTNEW20', 'GLOW499', 'PARTY30', 'MENCARE'];
  }

  static getTimeSlots() {
    return ['10:00 AM', '12:30 PM', '3:00 PM', '5:30 PM', '7:00 PM'];
  }

  static getReviews() {
    return [
      { text: 'Beautiful service and spotless setup.', author: 'Riya M.' },
      { text: 'The facial felt premium and unhurried.', author: 'Mehak A.' },
      { text: 'Booked for my parents. Very professional.', author: 'Kabir S.' },
    ];
  }
}
