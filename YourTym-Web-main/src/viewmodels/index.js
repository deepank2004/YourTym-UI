import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CartItem, User } from '../models/index.js';
import { ServiceDataService } from '../services/ServiceDataService.js';
import { FormatService } from '../services/FormatService.js';
import { cartService } from '../services/api/cartService.js';

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
  const [cartError, setCartError] = useState('');
  useEffect(() => { let active = true; cartService.get().then((result) => { const items = result?.items ?? result?.cartItems ?? [...(result?.services ?? []), ...(result?.packages ?? [])]; if (active && Array.isArray(items)) setCart(items.map((item) => ({ ...item, id: item.id ?? item._id ?? item.serviceId ?? item.packageId, qty: item.qty ?? item.quantity ?? 1, price: Number(item.discountPrice ?? item.sellingPrice ?? item.price ?? item.amount ?? 0) }))); }).catch((error) => { if (active) setCartError(error.message); }); return () => { active = false; }; }, []);

  const addItem = async (item) => {
    if (!item?.id || pendingAdds.current.has(item.id)) return;
    const backendId = item.packageId ?? item.id;
    if (!/^[a-f\d]{24}$/i.test(String(backendId))) {
      setCartError('This item has no valid backend ID and cannot be added yet.');
      return;
    }
    pendingAdds.current.add(item.id);
    try { if (item.isPackage) await cartService.addPackage(backendId, 1); else await cartService.addService(backendId, 1); } catch (error) { setCartError(error.message || 'Unable to add this item to cart.'); return; } finally { pendingAdds.current.delete(item.id); }
    setCart((items) => items.some((x) => x.id === item.id) ? items.map((x) => x.id === item.id ? { ...x, qty: x.qty + 1 } : x) : [...items, new CartItem(item, 1)]);
  };

  const updateQty = async (id, delta) => {
    const item = cart.find((entry) => entry.id === id); if (!item) return;
    const quantity = Math.min(99, Math.max(1, item.qty + delta));
    if (quantity !== item.qty) await cartService.updateService(id, quantity);
    setCart((items) => items.map((entry) => entry.id === id ? { ...entry, qty: quantity } : entry));
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
