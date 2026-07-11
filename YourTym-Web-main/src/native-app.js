import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

const money = (n) => `Rs. ${Math.max(0, Math.round(n)).toLocaleString('en-IN')}`;
const safe = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fallbackImage = 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1000&q=85';
const coupons = {
  YOURTYM10: { type: 'percent', value: 10, label: '10% off applied' },
  WELCOME20: { type: 'percent', value: 20, label: '20% off applied' },
  SALON50: { type: 'flat', value: 50, label: 'Rs. 50 off applied' },
  PARTY30: { type: 'percent', value: 30, label: '30% party package offer applied' },
};

const img = {
  hero: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1800&q=85',
  womenSalon: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=900&q=85',
  womenSkin: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=85',
  menSalon: 'https://images.unsplash.com/photo-1622287162716-f311baa1a2b8?auto=format&fit=crop&w=900&q=85',
  spaWomen: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=85',
  spaMen: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=900&q=85',
  facialMen: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=900&q=85',
  waxing: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=700&q=85',
  facial: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=700&q=85',
  massage: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=700&q=85',
  hair: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=700&q=85',
  threading: 'https://images.unsplash.com/photo-1633681926035-ec1ac984418a?auto=format&fit=crop&w=700&q=85',
  manicure: 'https://images.unsplash.com/photo-1610992015732-2449b76344bc?auto=format&fit=crop&w=700&q=85',
  pedicure: 'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?auto=format&fit=crop&w=700&q=85',
  haircut: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=700&q=85',
  beard: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=700&q=85',
  detan: 'https://images.unsplash.com/photo-1573461160327-b450ce3d8e7f?auto=format&fit=crop&w=700&q=85',
  cleanup: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=700&q=85',
};

const image = (src, alt, extra = '') => `<img class="${extra}" src="${safe(src || fallbackImage)}" alt="${safe(alt)}" loading="lazy">`;
const make = (prefix, rows) => rows.map((r, i) => ({
  id: `${prefix}-${i}`,
  type: prefix === 'pkg' ? 'package' : 'service',
  name: r[0],
  description: r[1],
  duration: r[2],
  original: r[3],
  price: r[4],
  brand: r[5],
  image: r[6],
  included: r[7] || [r[0]],
}));

const women = make('women', [
  ['Waxing', 'Full arms, legs or Rica roll-on waxing', 45, 1199, 699, 'Rica, Plum', img.waxing],
  ['Facial', 'Glow facial with relaxing massage', 60, 1899, 1299, 'Lotus, O3+', img.facial],
  ['Cleanup', 'Deep cleansing and instant radiance', 35, 999, 599, 'Plum, Lotus', img.cleanup],
  ['Bleach & Detan', 'Brightening face, neck and arms care', 40, 1099, 649, 'OxyLife, Lotus', img.detan],
  ['Massage', 'Relaxing head, neck and shoulder therapy', 45, 1299, 799, 'Biotique, Plum', img.massage],
  ['Hair Care', 'Hair spa, wash, blow dry and repair care', 75, 2499, 1599, "L'Oreal, Schwarzkopf", img.hair],
  ['Threading', 'Eyebrows, upper lip and face threading', 25, 499, 249, 'Rica, Plum', img.threading],
  ['Pedicure', 'Luxury foot soak, scrub and polish', 50, 1499, 899, 'Lotus, OPI', img.pedicure],
  ['Manicure', 'Premium nail shaping, scrub and polish', 45, 1299, 799, 'Lotus, OPI', img.manicure],
]);
const men = make('men', [
  ['Haircut', 'Precision haircut by trained stylist', 40, 799, 449, "L'Oreal, Schwarzkopf", img.haircut],
  ['Beard Styling', 'Trim, shape and hot towel finish', 30, 599, 349, "L'Oreal, Beardo", img.beard],
  ['Haircut + Beard Combo', 'Complete grooming with styling', 60, 1199, 699, "L'Oreal, Beardo", img.menSalon],
  ['Hair Spa', 'Scalp care, massage and hair repair', 60, 1699, 999, "L'Oreal, Schwarzkopf", img.hair],
  ['Facial', 'Men skin brightening facial', 55, 1599, 999, 'Lotus, O3+', img.facialMen],
  ['Cleanup', 'Deep cleanse for oily and tired skin', 35, 899, 549, 'Plum, Lotus', img.cleanup],
  ['Massage', 'Head, back and shoulder de-stress', 45, 1299, 799, 'Biotique, Plum', img.spaMen],
  ['Detan', 'Face and neck tan removal', 35, 899, 499, 'OxyLife, Lotus', img.detan],
  ['Pedicure', 'Foot care with soak and massage', 45, 1299, 799, 'Lotus, OPI', img.pedicure],
  ['Manicure', 'Hand care, shape and buff', 35, 999, 599, 'Lotus, OPI', img.manicure],
]);
const subServices = {
  'women-0': make('sub-wax', [
    ['Full Hand Wax', 'Complete arm waxing with Rica or honey wax', 30, 699, 449, 'Rica, Plum', img.waxing],
    ['Half Hand Wax', 'Elbow-down smooth waxing finish', 20, 499, 299, 'Rica, Plum', img.waxing],
    ['Full Leg Wax', 'Full leg waxing with soothing finish', 40, 999, 649, 'Rica, Plum', img.waxing],
    ['Half Leg Wax', 'Knee-down waxing for quick grooming', 25, 699, 399, 'Rica, Plum', img.waxing],
    ['Underarms Wax', 'Gentle underarm waxing with cleanup', 15, 299, 149, 'Rica, Plum', img.waxing],
  ]),
  'women-1': make('sub-facial', [
    ['Cleanup Facial', 'Deep cleanse, scrub, steam and mask', 35, 999, 599, 'Plum, Lotus', img.cleanup],
    ['Fruit Glow Facial', 'Brightening fruit facial for instant glow', 50, 1499, 899, 'Lotus, O3+', img.facial],
    ['O3+ Bridal Facial', 'Premium facial for event-ready radiance', 75, 2999, 1999, 'O3+', img.facial],
    ['Anti Tan Facial', 'Detan facial for dull and sun-tired skin', 55, 1899, 1199, 'Lotus, O3+', img.detan],
  ]),
  'women-2': make('sub-cleanup', [
    ['Classic Cleanup', 'Cleanse, scrub, steam and blackhead care', 30, 799, 449, 'Plum, Lotus', img.cleanup],
    ['Detan Cleanup', 'Cleanup with tan removal pack', 40, 1099, 699, 'OxyLife, Lotus', img.detan],
    ['Hydra Cleanup', 'Hydrating cleanup for dry skin', 45, 1299, 799, 'Plum, Lotus', img.cleanup],
  ]),
  'women-4': make('sub-massage', [
    ['Head Massage', 'Relaxing oil massage for scalp and stress relief', 25, 699, 399, 'Biotique, Plum', img.massage],
    ['Neck Massage', 'Focused neck relaxation for stiffness and fatigue', 25, 799, 449, 'Biotique, Plum', img.massage],
    ['Shoulder Massage', 'Shoulder therapy for tension and desk strain', 30, 899, 549, 'Biotique, Plum', img.massage],
    ['Full Body Massage', 'Complete spa massage with premium oil therapy', 75, 2499, 1599, 'Biotique, Plum', img.spaWomen],
  ]),
  'women-5': make('sub-hair', [
    ['Basic Trim', 'Clean trim for split ends and tidy shape', 30, 699, 399, "L'Oreal, Schwarzkopf", img.hair],
    ['Layer Cut', 'Soft layered haircut with blow dry finish', 50, 1299, 899, "L'Oreal, Schwarzkopf", img.hair],
    ['U-Cut', 'U-shaped haircut for natural length and movement', 45, 999, 699, "L'Oreal, Schwarzkopf", img.hair],
    ['V-Cut', 'V-shaped haircut for sharper layered length', 45, 1099, 749, "L'Oreal, Schwarzkopf", img.hair],
    ['Stylish / Trendy Cut', 'Modern salon haircut with styling finish', 60, 1699, 1199, "L'Oreal, Schwarzkopf", img.hair],
  ]),
  'women-7': make('sub-pedicure', [
    ['Classic Pedicure', 'Foot soak, nail shaping, scrub and massage', 45, 1199, 699, 'Lotus, OPI', img.pedicure],
    ['Spa Pedicure', 'Foot spa with mask, massage and polish', 60, 1699, 999, 'Lotus, OPI', img.pedicure],
    ['Gel Pedicure', 'Pedicure with gel polish finish', 70, 2199, 1399, 'OPI', img.pedicure],
  ]),
  'women-8': make('sub-manicure', [
    ['Classic Manicure', 'Nail shaping, scrub, massage and polish', 40, 999, 599, 'Lotus, OPI', img.manicure],
    ['Spa Manicure', 'Premium hand care with mask and massage', 55, 1499, 899, 'Lotus, OPI', img.manicure],
    ['Gel Manicure', 'Manicure with long-lasting gel polish', 65, 1999, 1299, 'OPI', img.manicure],
  ]),
  'men-4': make('sub-men-facial', [
    ['Oil Control Facial', 'Facial for oily and tired skin', 50, 1499, 899, 'Lotus, O3+', img.facialMen],
    ['Brightening Facial', 'Glow facial with relaxing massage', 55, 1599, 999, 'Lotus, O3+', img.facialMen],
    ['Detan Facial', 'Face and neck tan removal facial', 45, 1299, 799, 'OxyLife, Lotus', img.detan],
  ]),
  'men-6': make('sub-men-massage', [
    ['Head Massage', 'Relaxing scalp massage for quick stress relief', 25, 699, 399, 'Biotique, Plum', img.spaMen],
    ['Neck Massage', 'Targeted neck relaxation therapy', 25, 799, 449, 'Biotique, Plum', img.spaMen],
    ['Shoulder Massage', 'Shoulder pressure-point massage', 30, 899, 549, 'Biotique, Plum', img.spaMen],
    ['Full Body Massage', 'Full body relaxation therapy at home', 75, 2499, 1599, 'Biotique, Plum', img.spaMen],
  ]),
  'men-8': make('sub-men-pedicure', [
    ['Classic Pedicure', 'Foot soak, scrub and nail care', 40, 999, 599, 'Lotus, OPI', img.pedicure],
    ['Spa Pedicure', 'Foot spa with massage and mask', 55, 1499, 899, 'Lotus, OPI', img.pedicure],
  ]),
  'men-9': make('sub-men-manicure', [
    ['Classic Manicure', 'Hand care, shape and buff', 35, 899, 499, 'Lotus, OPI', img.manicure],
    ['Spa Manicure', 'Premium hand care and massage', 45, 1299, 799, 'Lotus, OPI', img.manicure],
  ]),
};
const packages = make('pkg', [
  ['Complete Wax', 'Full body waxing essentials with a smooth honey wax finish', 120, 2499, 1499, 'Rica, Plum', img.waxing, ['Full legs waxing', 'Full arms waxing', 'Underarms', 'Stomach', 'Back']],
  ['Ready To Go', 'Quick grooming set for clean, fresh, everyday confidence', 100, 2999, 1799, 'O3+, Lotus', img.womenSkin, ['Cleanup', 'Threading', 'Half arms waxing', 'Quick hair setting']],
  ['Party Ready', 'Event-ready glow, nails and hair styling in one package', 180, 4999, 2999, "L'Oreal, Lotus", img.facial, ['Facial', 'Manicure', 'Pedicure', 'Hair styling', 'Glow detan']],
  ['Head To Toe', 'Full day luxury salon care from waxing to spa grooming', 240, 6999, 4499, 'Rica, OPI, Plum', img.spaWomen, ['Full body waxing', 'Facial', 'Massage', 'Manicure', 'Pedicure']],
  ['Make Your Own Package', 'Build a custom salon day from waxing, bleach and massage picks', 90, 1999, 999, 'YourTym choice', img.hero, ['Waxing options', 'Bleach options', 'Massage options']],
]);
const packageOptions = [...women.slice(0, 6), women[7], women[8], men[6]];
const allSubServices = Object.values(subServices).flat();
const allItems = [...women, ...men, ...packages, ...allSubServices];

function App() {
  const cleanPath = () => {
    const p = location.pathname === '/index.html' ? '/' : location.pathname;
    return p.length > 1 ? p.replace(/\/$/, '') : p;
  };
  const [path, setPath] = useState(cleanPath());
  const [cart, setCart] = useState([{ ...women[4], qty: 1 }, { ...women[8], qty: 1 }]);
  const [locationChoice, setLocationChoice] = useState('Allow while using website');
  const [locationOpen, setLocationOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [couponMessage, setCouponMessage] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState(packages[0].id);
  const [selectedServiceId, setSelectedServiceId] = useState(women[0].id);
  const [packageServiceIds, setPackageServiceIds] = useState([packageOptions[0].id, packageOptions[3].id]);
  const [toast, setToast] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [bookingMessage, setBookingMessage] = useState('');
  const [address] = useState({ name: 'Aarohi Sharma', phone: '+91 98765 43210', line: 'B-1204, Orchid Heights', area: 'Sector 145', city: 'Noida', pincode: '201305' });

  const go = (next) => {
    history.pushState({}, '', next);
    setPath(next);
    scrollTo({ top: 0, behavior: 'smooth' });
  };
  const add = (item) => setCart((items) => {
    setToast(`${item.name} added to cart. Cart count updated.`);
    const found = items.find((x) => x.id === item.id);
    return found ? items.map((x) => x.id === item.id ? { ...x, qty: x.qty + 1 } : x) : [...items, { ...item, qty: 1 }];
  });
  const qty = (id, d) => setCart((items) => items.map((x) => x.id === id ? { ...x, qty: x.qty + d } : x).filter((x) => x.qty > 0));
  const remove = (id) => setCart((items) => items.filter((x) => x.id !== id));
  const addCustomPackage = (ids) => {
    const chosen = packageOptions.filter((x) => ids.includes(x.id));
    if (!chosen.length) {
      setToast('Choose at least one service before adding the package.');
      return;
    }
    const total = chosen.reduce((sum, x) => sum + x.price, 0);
    const duration = chosen.reduce((sum, x) => sum + x.duration, 0);
    add({
      id: `custom-package-${ids.slice().sort().join('-')}`,
      type: 'package',
      name: 'Custom YourTym Package',
      description: chosen.map((x) => x.name).join(', '),
      duration,
      original: chosen.reduce((sum, x) => sum + x.original, 0),
      price: Math.round(total * 0.9),
      brand: 'YourTym choice',
      image: img.hero,
      included: chosen.map((x) => x.name),
    });
  };
  const applyCoupon = (code) => {
    const normalized = String(code || '').trim().toUpperCase();
    if (!normalized) {
      setAppliedCoupon('');
      setCouponMessage('Enter a coupon code.');
      return;
    }
    if (!coupons[normalized]) {
      setAppliedCoupon('');
      setCouponMessage('Invalid coupon. Try YOURTYM10, WELCOME20, SALON50 or PARTY30.');
      return;
    }
    setAppliedCoupon(normalized);
    setCouponCode(normalized);
    setCouponMessage(`${coupons[normalized].label}. Only one coupon can be active at a time.`);
  };

  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, x) => sum + x.price * x.qty, 0);
    const duration = cart.reduce((sum, x) => sum + x.duration * x.qty, 0);
    const count = cart.reduce((sum, x) => sum + x.qty, 0);
    const coupon = coupons[appliedCoupon];
    const discount = coupon ? (coupon.type === 'percent' ? subtotal * coupon.value / 100 : coupon.value) : 0;
    return { subtotal, duration, count, discount: Math.min(subtotal, discount), final: Math.max(0, subtotal - Math.min(subtotal, discount)) };
  }, [cart, appliedCoupon]);

  React.useEffect(() => {
    const onPop = () => setPath(cleanPath());
    const onClick = (e) => {
      const nav = e.target.closest('[data-nav]');
      const addBtn = e.target.closest('[data-add]');
      const q = e.target.closest('[data-qty]');
      const rm = e.target.closest('[data-remove]');
      const view = e.target.closest('[data-view-package]');
      const loc = e.target.closest('[data-location]');
      const locToggle = e.target.closest('[data-location-toggle]');
      const apply = e.target.closest('[data-apply-coupon]');
      const couponBtn = e.target.closest('[data-coupon]');
      const viewService = e.target.closest('[data-view-service]');
      const packageToggle = e.target.closest('[data-package-option]');
      const addCustom = e.target.closest('[data-add-custom-package]');
      const slot = e.target.closest('[data-slot]');
      const needSlot = e.target.closest('[data-require-slot]');

      if (!e.target.closest('[data-location-root]')) setLocationOpen(false);
      if (nav) { e.preventDefault(); nav.dataset.nav === 'back' ? history.back() : go(nav.dataset.nav); }
      if (addBtn) { const item = allItems.find((x) => x.id === addBtn.dataset.add); if (item) add(item); }
      if (q) qty(q.dataset.id, Number(q.dataset.qty));
      if (rm) remove(rm.dataset.remove);
      if (view) { setSelectedPackageId(view.dataset.viewPackage); go('/package-details'); }
      if (viewService) { setSelectedServiceId(viewService.dataset.viewService); go('/service-details'); }
      if (packageToggle) setPackageServiceIds((ids) => packageToggle.checked ? [...new Set([...ids, packageToggle.value])] : ids.filter((id) => id !== packageToggle.value));
      if (slot) {
        setSelectedSlot(slot.dataset.slot);
        setBookingMessage('');
      }
      if (needSlot) {
        setBookingMessage('Please select a date and time slot before continuing.');
        setToast('Please select a date and time slot before continuing.');
      }
      if (addCustom) {
        const ids = [...document.querySelectorAll('[data-package-option]:checked')].map((input) => input.value);
        addCustomPackage(ids);
        go('/cart');
      }
      if (locToggle) setLocationOpen((open) => !open);
      if (loc) { setLocationChoice(loc.dataset.location); setLocationOpen(false); }
      if (apply) applyCoupon(document.querySelector('[data-coupon-input]')?.value);
      if (couponBtn) applyCoupon(couponBtn.dataset.coupon);
    };
    const onInput = (e) => {
      if (e.target.matches('[data-booking-date]')) {
        setSelectedDate(e.target.value);
        setSelectedSlot('');
        setBookingMessage('');
      }
      if (e.target.matches('[data-search-input]')) {
        applySearchFilter(e.target.value);
      }
    };
    const onError = (e) => {
      if (e.target.tagName === 'IMG' && e.target.src !== fallbackImage) e.target.src = fallbackImage;
    };
    addEventListener('popstate', onPop);
    document.addEventListener('click', onClick);
    document.addEventListener('input', onInput);
    document.addEventListener('error', onError, true);
    return () => {
      removeEventListener('popstate', onPop);
      document.removeEventListener('click', onClick);
      document.removeEventListener('input', onInput);
      document.removeEventListener('error', onError, true);
    };
  }, []);

  React.useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  const content = route(path, { cart, totals, address, couponCode, appliedCoupon, couponMessage, selectedPackageId, selectedServiceId, packageServiceIds, selectedDate, selectedSlot, bookingMessage });
  return React.createElement('div', {
    dangerouslySetInnerHTML: { __html: layout(content, { count: totals.count, locationChoice, locationOpen, toast }) },
  });
}

const logo = `<button class="logo" data-nav="/"><span>YOUR</span><b>TYM</b></button>`;
const back = `<button class="back-button" data-nav="back">Back</button>`;
const title = (t, a = 'YourTym curated') => `<div class="mb-5 flex items-end justify-between gap-4"><div><p class="eyebrow">${a}</p><h2 class="section-title">${t}</h2></div></div>`;

function nav({ count, locationChoice, locationOpen }) {
  const links = [['Home', '/'], ['Women Services', '/women-services'], ['Men Services', '/men-services'], ['Packages', '/packages'], ['Offers', '/offers'], ['Booking History', '/booking-history']];
  const options = ['Allow once', 'Allow while using website', "Don't allow"];
  return `<header class="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur"><nav class="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 lg:px-6">${logo}<div class="location-wrap hidden md:block" data-location-root><button class="location-button" type="button" data-location-toggle>Noida, Sector 145 <span>${safe(locationChoice)}</span></button><div class="location-menu ${locationOpen ? 'open' : ''}">${options.map((option) => `<button data-location="${safe(option)}">${safe(option)}</button>`).join('')}</div></div><label class="hidden min-w-56 flex-1 items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 md:flex"><span>Search</span><input class="w-full outline-none" data-search-input placeholder='Search for "Facial"'></label><div class="hidden items-center gap-1 lg:flex">${links.map(([l, u]) => `<button class="nav-link" data-nav="${u}">${l}</button>`).join('')}</div><button class="icon-button relative" data-nav="/cart">Cart${count ? `<span class="cart-badge">${count}</span>` : ''}</button><button class="primary-button hidden sm:inline-flex" data-nav="/login">Login / Signup</button></nav></header>`;
}
const footer = `<footer class="footer"><div>${logo}<p>Premium salon, spa and grooming bookings for every schedule.</p></div><div><button data-nav="/women-services">Women Services</button><button data-nav="/men-services">Men Services</button><button data-nav="/offers">Offers</button><button data-nav="/booking-history">Booking History</button></div></footer>`;
function layout(content, state) {
  return `${nav(state)}${state.toast ? `<div class="toast">Added to Cart <span>OK</span><small>${safe(state.toast)}</small></div>` : ''}<main class="page-shell animate-in">${content}</main>${footer}`;
}
function applySearchFilter(value) {
  const query = String(value || '').trim().toLowerCase();
  const cards = [...document.querySelectorAll('[data-search-card]')];
  let visible = 0;
  cards.forEach((card) => {
    const haystack = String(card.dataset.searchText || '').toLowerCase();
    const show = !query || haystack.includes(query);
    card.classList.toggle('hidden', !show);
    if (show) visible += 1;
  });
  document.querySelectorAll('[data-search-empty]').forEach((node) => {
    node.classList.toggle('hidden', !query || visible > 0);
  });
}

function serviceCard(s) {
  const hasDetails = Boolean(subServices[s.id]?.length);
  const searchText = [s.name, s.description, s.brand, ...(subServices[s.id] || []).map((x) => `${x.name} ${x.description}`)].join(' ');
  return `<article class="service-card" data-search-card data-search-text="${safe(searchText)}">${image(s.image, s.name)}<div class="p-4"><div class="mb-2 flex items-start justify-between gap-3"><h3>${safe(s.name)}</h3><span class="rating">Star 4.9</span></div><p>${safe(s.description)}</p><p class="brand">Brands: ${safe(s.brand)}</p><div class="mt-4 flex items-center justify-between gap-3"><div><span class="price">${money(s.price)}</span><span class="old-price">${money(s.original)}</span><p class="duration">${s.duration} min</p></div><div class="card-actions"><button class="outline-button small" data-view-service="${s.id}">${hasDetails ? 'View options' : 'View details'}</button><button class="add-button" data-add="${s.id}">Add</button></div></div></div></article>`;
}
function packageCard(p) {
  const searchText = [p.name, p.description, p.brand, ...(p.included || [])].join(' ');
  return `<article class="package-card" data-search-card data-search-text="${safe(searchText)}">${image(p.image, p.name)}<div class="p-5"><div class="label">PACKAGE</div><h3>${safe(p.name)}</h3><p>${safe(p.description)}</p><div class="my-4 flex items-center justify-between"><span class="duration">${p.duration} min</span><span><b>${money(p.price)}</b> <s>${money(p.original)}</s></span></div><div class="flex flex-wrap gap-2"><button class="secondary-button small" data-view-package="${p.id}">View Details</button><button class="outline-button small" data-nav="/edit-package">Edit Package</button><button class="add-button" data-add="${p.id}">Add to Cart</button></div></div></article>`;
}
function pageHero(kicker, h, text, source) {
  return `<section class="page-hero"><div><p class="eyebrow">${kicker}</p><h1>${h}</h1><p>${text}</p></div>${image(source, h)}</section>`;
}
function offersStrip() {
  return `<div class="offers-strip"><div><p class="eyebrow">Only this week</p><h2>Book any package and get a free threading add-on</h2></div><button class="primary-button" data-nav="/packages">Explore Packages</button></div>`;
}
function cartList(cart) {
  if (!cart.length) {
    return `<div class="panel empty-cart"><h2>Your cart is empty</h2><p>Browse premium salon services and add your favourites to continue booking.</p><button class="primary-button" data-nav="/women-services">Browse services</button></div>`;
  }
  return `<div class="panel"><h2>Cart</h2>${cart.map((x) => `<div class="cart-row"><div class="cart-main">${image(x.image, x.name, 'cart-thumb')}<div><h3>${safe(x.name)}</h3><p>${x.duration} min per unit · ${safe(x.brand || 'YourTym package')}</p><p>Unit price: <b>${money(x.price)}</b></p><div class="qty"><button data-id="${x.id}" data-qty="-1">-</button><span>${x.qty}</span><button data-id="${x.id}" data-qty="1">+</button></div><button class="remove-button" data-remove="${x.id}">Remove</button></div></div><div class="cart-price"><b>${money(x.price * x.qty)}</b><span>${x.duration * x.qty} min</span></div></div>`).join('')}</div>`;
}
function availableSlots(date) {
  if (!date) return ['10:00 AM', '12:30 PM', '3:00 PM', '5:30 PM', '7:00 PM'];
  const day = new Date(`${date}T00:00:00`).getDay();
  return day === 0 ? ['11:00 AM', '1:30 PM', '4:00 PM'] : ['10:00 AM', '12:30 PM', '3:00 PM', '5:30 PM', '7:00 PM'];
}
function priceSummary(t, label, next, couponCode, appliedCoupon, couponMessage, disabled = false, blockReason = '') {
  const actionAttr = disabled ? (blockReason === 'slot' ? 'data-require-slot' : '') : `data-nav="${next}"`;
  return `<aside class="summary-card sticky-card"><h3>Price Breakdown</h3><div class="coupon-box"><label>Coupon code</label><div><input data-coupon-input value="${safe(couponCode || '')}" placeholder="YOURTYM10"><button class="outline-button small" data-apply-coupon>Apply</button></div>${couponMessage ? `<p class="${appliedCoupon ? 'coupon-success' : 'coupon-error'}">${safe(couponMessage)}</p>` : ''}</div><p>Subtotal <span>${money(t.subtotal)}</span></p><p>Discount ${appliedCoupon ? `(${safe(appliedCoupon)})` : ''}<span class="text-orange-600">-${money(t.discount)}</span></p><hr><p class="total">Final price <span>${money(t.final)}</span></p><p>Total duration <span>${t.duration} min</span></p><button class="primary-button w-full justify-center ${disabled ? 'disabled-button' : ''}" ${actionAttr}>${label}</button></aside>`;
}
function packageDetails(id) {
  const pkg = packages.find((p) => p.id === id) || packages[0];
  const savings = pkg.original - pkg.price;
  return `${back}<section class="section checkout-grid"><div class="panel package-detail">${image(pkg.image, pkg.name)}<p class="eyebrow">Package details</p><h1>${safe(pkg.name)}</h1><p>${safe(pkg.description)}</p><h3>Included services</h3><ul>${pkg.included.map((item) => `<li>${safe(item)}</li>`).join('')}</ul></div><aside class="summary-card sticky-card"><h3>Price Breakdown</h3><p>Original price <span>${money(pkg.original)}</span></p><p>Package discount <span class="text-orange-600">-${money(savings)}</span></p><hr><p class="total">Discounted price <span>${money(pkg.price)}</span></p><p>Total duration <span>${pkg.duration} min</span></p><button class="outline-button w-full justify-center" data-nav="/edit-package">Edit Package</button><button class="primary-button w-full justify-center mt-3" data-add="${pkg.id}">Add to Cart</button></aside></section>`;
}
function serviceDetails(id) {
  const service = [...women, ...men].find((x) => x.id === id) || women[0];
  const options = subServices[service.id] || [service];
  const optionTotal = options.reduce((sum, x) => sum + x.price, 0);
  return `${back}<section class="section"><div class="service-detail-head">${image(service.image, service.name)}<div><p class="eyebrow">Service details</p><h1>${safe(service.name)}</h1><p>${safe(service.description)}</p><div class="detail-breakdown"><p>Starting price <span>${money(Math.min(...options.map((x) => x.price)))}</span></p><p>Available options <span>${options.length}</span></p><p>Full option value <span>${money(optionTotal)}</span></p></div></div></div><div class="subservice-list">${options.map((x) => `<article class="subservice-row" data-search-card data-search-text="${safe(`${x.name} ${x.description} ${x.brand}`)}"><div>${image(x.image, x.name, 'option-thumb')}<span><h3>${safe(x.name)}</h3><p>${safe(x.description)}</p><small>${x.duration} min - ${safe(x.brand)}</small></span></div><div><b>${money(x.price)}</b><s>${money(x.original)}</s><button class="add-button small" data-add="${x.id}">Add to Cart</button></div></article>`).join('')}<p class="empty-search" data-search-empty hidden>No matching services found. Try a different search.</p></div></section>`;
}
function editPackage(selectedIds) {
  const chosen = packageOptions.filter((x) => selectedIds.includes(x.id));
  const subtotal = chosen.reduce((sum, x) => sum + x.price, 0);
  const duration = chosen.reduce((sum, x) => sum + x.duration, 0);
  const packageTotal = Math.round(subtotal * 0.9);
  return `${back}<section class="section checkout-grid"><div>${title('Edit Package')}<div class="custom-panel"><h3>Choose services</h3><div class="edit-list">${packageOptions.map((x) => `<label class="check-row"><input type="checkbox" data-package-option value="${x.id}" ${selectedIds.includes(x.id) ? 'checked' : ''}><span><b>${safe(x.name)}</b><small>${safe(x.description)}</small></span><em>${money(x.price)}</em></label>`).join('')}</div></div></div><aside class="summary-card sticky-card"><h3>Selected Summary</h3>${chosen.length ? chosen.map((x) => `<p>${safe(x.name)}<span>${money(x.price)}</span></p>`).join('') : '<p>No services selected<span>Rs. 0</span></p>'}<hr><p>Services subtotal <span>${money(subtotal)}</span></p><p>Package saving <span class="text-orange-600">-${money(subtotal - packageTotal)}</span></p><p>Total duration <span>${duration} min</span></p><p class="total">Package total <span>${money(packageTotal)}</span></p><button class="primary-button w-full justify-center ${chosen.length ? '' : 'disabled-button'}" ${chosen.length ? 'data-add-custom-package' : ''}>Continue booking</button></aside></section>`;
}

function route(path, { cart, totals, address, couponCode, appliedCoupon, couponMessage, selectedPackageId, selectedServiceId, packageServiceIds, selectedDate, selectedSlot, bookingMessage }) {
  if (path === '/women-services') return back + pageHero('Salon for Women', 'Women Services', 'Waxing, facial, cleanup, bleach, massage, hair care, threading, pedicure and manicure with premium brands.', img.womenSalon) + `<section class="section"><div class="service-grid">${women.map(serviceCard).join('')}</div><p class="empty-search" data-search-empty hidden>No matching services found. Try another search.</p></section>`;
  if (path === '/men-services') return back + pageHero('Salon for Men', 'Men Services', 'Haircut, beard styling, combos, spa, facial, cleanup, massage, detan, pedicure and manicure.', img.menSalon) + `<section class="section"><div class="service-grid">${men.map(serviceCard).join('')}</div><p class="empty-search" data-search-empty hidden>No matching services found. Try another search.</p></section>`;
  if (path === '/packages') return back + pageHero('Premium bundles', 'Packages', 'Save more with complete salon bundles and customizable service packs.', img.spaWomen) + `<section class="section"><div class="package-grid">${packages.map(packageCard).join('')}</div><p class="empty-search" data-search-empty hidden>No matching packages found. Try another search.</p></section>`;
  if (path === '/package-details') return packageDetails(selectedPackageId);
  if (path === '/service-details') return serviceDetails(selectedServiceId);
  if (path === '/edit-package') return editPackage(packageServiceIds);
  if (path === '/offers') return back + pageHero('Limited time', 'Offers', 'Discount banners, coupon cards, limited time offers and package deals.', img.womenSkin) + `<section class="section">${offersStrip()}<div class="offer-grid">${['YOURTYM10', 'WELCOME20', 'SALON50', 'PARTY30'].map((c, i) => `<article class="coupon"><h3>${c}</h3><p>${i === 0 ? '10% off your updated cart subtotal.' : i === 1 ? '20% off your first premium booking.' : i === 2 ? 'Flat Rs. 50 discount on salon services.' : '30% off party-ready package bookings.'}</p><button class="outline-button" data-coupon="${c}">Apply Coupon</button></article>`).join('')}</div></section>`;
  if (path === '/cart') return back + `<section class="section checkout-grid">${cartList(cart)}${priceSummary(totals, 'Proceed to checkout', '/confirmation', couponCode, appliedCoupon, couponMessage, !cart.length)}</section>`;
  if (path === '/confirmation') return back + `<section class="section checkout-grid"><div>${title('Service Confirmation')}${cartList(cart)}<div class="panel mt-5"><h3>Select date & time</h3><input class="field" type="date" data-booking-date min="2026-06-13" value="${safe(selectedDate || '')}"><div class="slot-grid">${availableSlots(selectedDate).map((s) => `<button class="${selectedSlot === s ? 'selected-slot' : ''}" data-slot="${safe(s)}">${safe(s)}</button>`).join('')}</div>${bookingMessage ? `<p class="coupon-error">${safe(bookingMessage)}</p>` : ''}</div></div>${priceSummary(totals, 'Confirm booking', '/address', couponCode, appliedCoupon, couponMessage, !cart.length || !selectedDate || !selectedSlot, 'slot')}</section>`;
  if (path === '/address') return back + `<section class="section checkout-grid"><div class="panel"><h2>Address</h2><div class="form-grid">${['Full Name', 'Phone Number', 'House/Flat No.', 'Street', 'Area', 'City', 'Pincode'].map((f, i) => `<label>${f}<input value="${safe(Object.values(address)[i] || '')}"></label>`).join('')}</div><button class="primary-button mt-5" data-nav="/summary">Save Address</button></div>${priceSummary(totals, 'Continue', '/summary', couponCode, appliedCoupon, couponMessage)}</section>`;
  if (path === '/summary') return back + `<section class="section checkout-grid"><div class="panel"><h2>Booking Summary</h2><div class="info-box"><h3>Customer details</h3><p>${safe(address.name)} · ${safe(address.phone)}</p><p>${safe(address.line)}, ${safe(address.area)}, ${safe(address.city)} - ${safe(address.pincode)}</p></div><div class="info-box"><h3>Appointment</h3><p>Date <span>${safe(selectedDate || 'Not selected')}</span></p><p>Time slot <span>${safe(selectedSlot || 'Not selected')}</span></p></div><div class="info-box"><h3>Services booked</h3>${cart.map((x) => `<p>${safe(x.name)} x ${x.qty}<span>${money(x.price * x.qty)}</span></p>`).join('')}</div></div>${priceSummary(totals, 'Confirm booking', '/success', couponCode, appliedCoupon, couponMessage)}</section>`;
  if (path === '/booking-history') return back + `<section class="section">${title('Booking History')}<div class="history-tools"><label>Search<input placeholder="Search booking"></label><button>Filter by date</button></div><div class="booking-grid">${[['YT-1669297452', '12 Jun 2026, 5:30 PM', 'Head massage, Manicure', 7396, 'Pending'], ['YT-1669221640', '04 Jun 2026, 11:00 AM', 'Ready To Go Package', 1799, 'Completed'], ['YT-1669012788', '28 May 2026, 3:00 PM', 'Haircut + Beard Combo', 699, 'Cancelled']].map((b) => `<article class="booking-card"><h3>${b[0]}</h3><p>${b[1]}</p><p>${b[2]}</p><b>${money(b[3])}</b><span class="status ${b[4].toLowerCase()}">${b[4]}</span><button class="outline-button">View details</button></article>`).join('')}</div></section>`;
  if (path === '/login') return back + `<section class="auth-section"><div class="auth-card">${logo}<h1>Login / Signup</h1><p>Continue with your phone number and verify with OTP.</p><label>Phone number<input value="+91 "></label><label>OTP verification<input placeholder="Enter 6 digit OTP"></label><label>Profile name<input placeholder="Your name"></label><button class="primary-button w-full justify-center">Continue</button></div></section>`;
  if (path === '/success') return `<section class="success"><div><h1>Booking Confirmed</h1><p>YourTym professional details and slot confirmation have been sent to your phone.</p><button class="primary-button" data-nav="/booking-history">View Booking History</button></div></section>`;
  return `<section class="hero">${image(img.hero, 'Luxury salon service')}<div class="hero-overlay"></div><div class="hero-content"><p class="eyebrow">Premium salon at your doorstep</p><h1>YourTym</h1><p>Book curated hair, skin, massage and grooming services delivered by trained beauty professionals.</p><div class="flex flex-wrap gap-3"><button class="primary-button" data-nav="/women-services">Book Women Services</button><button class="secondary-button" data-nav="/men-services">Explore Men Services</button></div></div></section><section class="section">${title('Service Categories')}<div class="masonry-grid">${[['Salon For Women', img.womenSalon, '/women-services'], ['Women Skin & Hair Care', img.womenSkin, '/women-services'], ['Spa For Men', img.spaMen, '/men-services'], ['Spa For Women', img.spaWomen, '/women-services'], ['Salon For Men', img.menSalon, '/men-services'], ['Mens Skin & Hair Care', img.facialMen, '/men-services']].map((c, i) => `<button class="image-tile ${i === 1 || i === 3 ? 'md:row-span-2' : ''}" data-nav="${c[2]}">${image(c[1], c[0])}<span>${c[0]}</span></button>`).join('')}</div></section><section class="section two-col"><div>${title('Popular Services')}<div class="service-grid">${[women[1], women[5], men[0], men[4]].map(serviceCard).join('')}</div></div><aside class="promise-panel"><h3>YT Promise</h3><p>4.5+ rated beauticians</p><p>Luxury salon experience</p><p>Branded products only</p><p>Transparent pricing</p></aside></section><section class="section">${title('Featured Packages')}<div class="package-grid">${packages.slice(0, 3).map(packageCard).join('')}</div></section><section class="section">${offersStrip()}</section><section class="section entry-grid"><button class="entry-card" data-nav="/women-services">${image(img.womenSalon, 'For Women')}<span>For Women</span></button><button class="entry-card" data-nav="/men-services">${image(img.menSalon, 'For Men')}<span>For Men</span></button></section><section class="section">${title('Reviews')}<div class="review-grid">${['Beautiful service and spotless setup.', 'The facial felt premium and unhurried.', 'Booked for my parents. Very professional.'].map((r, i) => `<article class="review"><div>Star Star Star Star Star</div><p>${r}</p><b>${['Riya M.', 'Mehak A.', 'Kabir S.'][i]}</b></article>`).join('')}</div></section>`;
}

createRoot(document.getElementById('root')).render(React.createElement(App));
