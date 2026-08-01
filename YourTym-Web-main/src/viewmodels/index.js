import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CartItem, User } from '../models/index.js';
import { ServiceDataService } from '../services/ServiceDataService.js';
import { FormatService } from '../services/FormatService.js';
import { cartService } from '../services/api/cartService.js';
import { attachAddressToCart, getAddresses, updateAddress } from '../services/api/addressService.js';
import { getUserToken } from '../services/api/tokenStorage.js';

function firstImage(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return firstImage(value[0]);
  if (typeof value === 'object') return value.img || value.image || value.url || value.secure_url || '';
  return '';
}

function normalizeCartItem(item = {}) {
  const nestedCandidate = item.service
    ?? item.serviceId
    ?? item.Services
    ?? item.package
    ?? item.packageId
    ?? item.Package
    ?? item.serviceDetails
    ?? item.packageDetails
    ?? {};
  const nested = nestedCandidate && typeof nestedCandidate === 'object' ? nestedCandidate : (
    item.serviceDetails && typeof item.serviceDetails === 'object' ? item.serviceDetails
      : item.packageDetails && typeof item.packageDetails === 'object' ? item.packageDetails
        : {}
  );
  const updateField = item.Services !== undefined
    ? 'Services'
    : item.AddOnServices !== undefined
      ? 'AddOnServices'
      : item.packageServices !== undefined
        ? 'packageServices'
        : 'AddOnServices';
  const backendId = (typeof item.serviceId === 'object' ? item.serviceId?._id : item.serviceId)
    ?? (typeof item.packageId === 'object' ? item.packageId?._id : item.packageId)
    ?? (typeof item[updateField] === 'string' ? item[updateField] : null)
    ?? nested._id
    ?? nested.id
    ?? item._id
    ?? item.id;
  const isPackage = Boolean(item.packageId ?? item.package ?? item.Package ?? item.packageServices);
  const location = Array.isArray(nested.location) ? nested.location[0] : nested.location;
  const rawPrice = item.price
    ?? item.discountPrice
    ?? item.sellingPrice
    ?? item.amount
    ?? nested.discountPrice
    ?? nested.sellingPrice
    ?? nested.price
    ?? location?.discountPrice
    ?? 0;
  const original = item.original
    ?? item.originalPrice
    ?? item.mrp
    ?? nested.originalPrice
    ?? location?.originalPrice
    ?? 0;
  const image = firstImage(
    item.image
      ?? item.imageUrl
      ?? item.thumbnail
      ?? nested.image
      ?? nested.images
      ?? nested.media,
  );
  const category = nested.categoryId?.name ?? nested.category?.name ?? nested.mainCategoryId?.name ?? '';
  const subCategory = nested.subCategoryId?.name ?? '';

  return {
    ...item,
    id: item.cartItemId ?? item.id ?? item._id ?? backendId,
    backendId,
    updateField,
    isPackage,
    qty: Math.max(1, Number(item.qty ?? item.quantity ?? 1) || 1),
    name: item.name ?? item.serviceName ?? item.packageName ?? nested.name ?? nested.serviceName ?? nested.packageName ?? nested.title ?? 'Service',
    description: item.description ?? nested.description ?? '',
    duration: Number(item.duration ?? item.timeInMin ?? nested.duration ?? nested.timeInMin ?? 0) || 0,
    price: Number(rawPrice) || 0,
    original: Number(original) || 0,
    image,
    brand: typeof (item.brand ?? nested.brand ?? nested.brands) === 'string'
      ? (item.brand ?? nested.brand ?? nested.brands)
      : '',
    categoryName: category,
    subCategoryName: subCategory,
  };
}

function cartItemsFromResult(result) {
  const items = result?.items
    ?? result?.cartItems
    ?? [...(result?.services ?? []), ...(result?.packages ?? [])];
  return Array.isArray(items) ? items.map(normalizeCartItem) : [];
}

export function useNavigationViewModel() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const sync = () => setPath(window.location.pathname);
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  const navigate = (next) => {
    window.history.pushState({}, '', next);
    setPath(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return [path, navigate];
}

export function useCartViewModel() {
  const [cart, setCart] = useState([]);
  const pendingAdds = useRef(new Set());
  const pendingUpdates = useRef(new Set());
  const cartAddressReady = useRef(false);
  const [cartError, setCartError] = useState('');
  const [authVersion, setAuthVersion] = useState(0);

  useEffect(() => {
    const syncAuthentication = () => {
      cartAddressReady.current = false;
      setAuthVersion((version) => version + 1);
    };
    window.addEventListener('auth-changed', syncAuthentication);
    return () => window.removeEventListener('auth-changed', syncAuthentication);
  }, []);

  useEffect(() => {
    let active = true;
    if (!getUserToken()) {
      setCart([]);
      setCartError('');
      return () => { active = false; };
    }
    cartService.get()
      .then((result) => { if (active) setCart(cartItemsFromResult(result)); })
      .catch((error) => { if (active) setCartError(error.message); });
    return () => { active = false; };
  }, [authVersion]);

  const repairCartAddress = async () => {
    if (cartAddressReady.current) return;

    const result = await getAddresses();
    const addresses = Array.isArray(result?.addresses) ? result.addresses : [];
    const storedId = typeof window !== 'undefined' ? window.localStorage?.getItem('selectedAddressId') : '';
    const address = addresses.find((entry) => String(entry.id) === String(storedId)) || addresses[0];

    if (!address?.id) {
      throw new Error('Add and select an address before adding items to your cart.');
    }

    const houseType = address.houseType === 'Other' ? 'Other' : 'home';
    if (address.houseType !== 'home' && address.houseType !== 'Other') {
      await updateAddress(address.id, { ...address, houseType });
    }
    await attachAddressToCart(address.id);
    if (typeof window !== 'undefined') {
      window.localStorage?.setItem('selectedAddressId', String(address.id));
      window.localStorage?.setItem('selectedAddressHouseType', houseType);
    }
    cartAddressReady.current = true;
  };

  const addItem = async (item) => {
    if (!getUserToken()) {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('authReturnPath', window.location.pathname);
        window.history.pushState({}, '', '/login');
        window.dispatchEvent(new Event('popstate'));
      }
      return false;
    }
    if (!item?.id || pendingAdds.current.has(item.id)) return;
    const backendId = item.packageId ?? item.id;
    if (!/^[a-f\d]{24}$/i.test(String(backendId))) {
      setCartError('This item has no valid backend ID and cannot be added yet.');
      return;
    }
    pendingAdds.current.add(item.id);
    const sendAddRequest = async () => {
      if (item.isPackage) {
        if (/custom|edit/i.test(String(item.packageType || ''))) return cartService.addCustomPackage(backendId, 1);
        return cartService.addPackage(backendId, 1);
      }
      return cartService.addService(backendId, 1);
    };
    try {
      try {
        await sendAddRequest();
      } catch (error) {
        if (!/houseType/i.test(String(error?.message || ''))) throw error;
        cartAddressReady.current = false;
        await repairCartAddress();
        await sendAddRequest();
      }
    } catch (error) {
      const message = error.message || 'Unable to add this item to cart.';
      setCartError(message);
      if (typeof window !== 'undefined' && typeof window.alert === 'function') window.alert(message);
      return;
    } finally { pendingAdds.current.delete(item.id); }
    // Reload the canonical cart after a successful add. The backend may merge
    // an existing package instead of creating another line item; appending the
    // clicked card locally used to create duplicate/zero-priced rows.
    try {
      const result = await cartService.get();
      setCart(cartItemsFromResult(result));
    } catch {
      const localItem = normalizeCartItem(item);
      setCart((items) => {
        const backendId = String(localItem.backendId ?? localItem.id);
        const existing = items.find((entry) => String(entry.backendId ?? entry.id) === backendId);
        return existing
          ? items.map((entry) => entry === existing ? { ...entry, qty: entry.qty + 1 } : entry)
          : [...items, new CartItem(localItem, 1)];
      });
    }
    return true;
  };

  const updateQty = async (id, delta) => {
    const item = cart.find((entry) => entry.id === id);
    if (!item || pendingUpdates.current.has(id)) return;
    const quantity = Math.min(99, Math.max(0, item.qty + delta));
    if (quantity === item.qty) return;

    pendingUpdates.current.add(id);
    try {
      const backendId = item.backendId ?? id;
      if (quantity === 0) {
        if (item.isPackage) await cartService.removePackage(backendId);
        else await cartService.removeService(backendId, item.updateField === 'packageServices');
        setCart((items) => items.filter((entry) => entry.id !== id));
      } else {
        if (item.isPackage) await cartService.updatePackage(backendId, quantity);
        else await cartService.updateService(backendId, quantity, item.updateField);
        setCart((items) => items.map((entry) => entry.id === id ? { ...entry, qty: quantity } : entry));
      }
    } catch (error) {
      setCartError(error.message || 'Unable to update quantity.');
    } finally {
      pendingUpdates.current.delete(id);
    }
  };

  const totals = useMemo(
    () => FormatService.calculateTotals(cart),
    [cart]
  );

  return { cart, addItem, updateQty, totals, cartError };
}

export function useAddressViewModel() {
  const [address, setAddress] = useState(new User());

  const updateAddress = (field, value) => {
    setAddress((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return { address, setAddress, updateAddress };
}

export function useAppViewModel() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [path, navigate] = useNavigationViewModel();
  const { cart, addItem, updateQty, totals, cartError } = useCartViewModel();
  const { address, setAddress } = useAddressViewModel();

  const go = (next) => {
    setMobileOpen(false);
    navigate(next);
  };

  return {
    path,
    navigate,
    go,
    mobileOpen,
    setMobileOpen,
    cart,
    addItem,
    updateQty,
    totals,
    cartError,
    address,
    setAddress,
  };
}
