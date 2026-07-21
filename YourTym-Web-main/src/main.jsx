import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import LoadingScreen from "./components/LoadingScreen";

// Import MVVM components
import { useAppViewModel } from './viewmodels/index.js';
import { ServiceDataService } from './services/ServiceDataService.js';

// Import Navigation components
import { Navbar, Footer } from './components/Navigation.jsx';

// Import View Pages
import { HomePage } from './views/HomePage.jsx';
import { ServicesPage } from './views/ServicesPage.jsx';
import { PackagesPage } from './views/PackagesPage.jsx';
import { CategoryPackagesPage } from './views/CategoryPackagesPage.jsx';
import { EditPackagePage } from './views/EditPackagePage.jsx';
import { OffersPage } from './views/OffersPage.jsx';
import { CartPage } from './views/CartPage.jsx';
import { ConfirmationPage } from './views/ConfirmationPage.jsx';
import { AddressPage } from './views/AddressPage.jsx';
import { SummaryPage } from './views/SummaryPage.jsx';
import { BookingHistoryPage } from './views/BookingHistoryPage.jsx';
import { LoginPage, SuccessPage } from './views/AuthPages.jsx';
import { ProfilePage } from './views/ProfilePage.jsx';
import { OrderDetailsPage } from './views/OrderDetailsPage.jsx';
import { CompanyPage } from './views/CompanyPages.jsx';
import { getUserToken } from './services/api/tokenStorage.js';
import { getProfile, updateLocation } from './services/api/profileService.js';


function App() {
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const timer = setTimeout(() => {
    setLoading(false);
  }, 2000);

  return () => clearTimeout(timer);
}, []);
  // Initialize app viewmodel with all state and business logic
  const {
    path,
    go,
    mobileOpen,
    setMobileOpen,
    cart,
    addItem,
    updateQty,
    totals,
    address,
    setAddress,
  } = useAppViewModel();
  const protectedPaths = ['/cart', '/confirmation', '/address', '/summary', '/booking-history', '/profile', '/success'];
  useEffect(() => { const expire = () => go('/login'); window.addEventListener('auth-expired', expire); return () => window.removeEventListener('auth-expired', expire); }, [go]);
  useEffect(() => { if (protectedPaths.some((route) => path === route || path.startsWith('/order-details/')) && !getUserToken()) { sessionStorage.setItem('authReturnPath', path); go('/login'); } }, [path, go]);
  useEffect(() => { if ((path === '/login' || path === '/otp' || path === '/signup') && getUserToken() && path === '/login') go(sessionStorage.getItem('authReturnPath') || '/'); }, [path, go]);
  useEffect(() => {
    if (!getUserToken() || !navigator.geolocation) return;
    let requestId = 0;
    const refreshLocation = () => {
      const currentRequest = ++requestId;
      sessionStorage.setItem('locationPromptShown', 'true');
      navigator.geolocation.getCurrentPosition(async ({ coords }) => {
        if (currentRequest !== requestId) return;
        const currentLat = Number(coords.latitude.toFixed(6));
        const currentLong = Number(coords.longitude.toFixed(6));
        sessionStorage.setItem('lastLocation', JSON.stringify({ currentLat, currentLong }));
        let label = `Current location (${currentLat}, ${currentLong})`;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${currentLat}&lon=${currentLong}&format=json`, { headers: { Accept: 'application/json' } });
          const place = await response.json();
          const address = place?.address || {};
          const cityName = address.city || address.town || address.village || address.municipality;
          const sectorName = place?.display_name?.match(/Sector\s*[\w-]+/i)?.[0] || address.suburb?.match?.(/Sector\s*[\w-]+/i)?.[0];
          const areaName = sectorName || address.suburb || address.neighbourhood || address.city_district || address.quarter || address.residential || address.road;
          label = [cityName, areaName].filter(Boolean).join(', ') || place?.display_name || label;
        } catch { /* Coordinates remain visible when reverse geocoding is unavailable. */ }
        if (currentRequest !== requestId) return;
        localStorage.setItem('locationLabel', label);
        window.dispatchEvent(new CustomEvent('location-updated', { detail: { label } }));
        try {
          const profile = await getProfile();
          const city = profile.cityId || localStorage.getItem('selectedCityId') || '';
          await updateLocation({ currentLat, currentLong, city });
        } catch (error) {
          console.warn('Unable to update the profile location.', error);
        }
      }, () => {
        const label = 'Location unavailable';
        localStorage.setItem('locationLabel', label);
        window.dispatchEvent(new CustomEvent('location-updated', { detail: { label } }));
      }, { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 });
    };

    const storedLabel = localStorage.getItem('locationLabel');
    if (!(sessionStorage.getItem('locationPromptShown') && storedLabel && storedLabel !== 'Noida, Sector 145')) refreshLocation();
    window.addEventListener('location-refresh', refreshLocation);
    return () => {
      window.removeEventListener('location-refresh', refreshLocation);
    };
  }, [path]);

  // Get data from services
  const womenServices = ServiceDataService.getWomenServices();
  const menServices = ServiceDataService.getMenServices();
  const packages = ServiceDataService.getPackages();

  // Page props for views
  const pageProps = {
    go,
    addItem,
    cart,
    updateQty,
    totals,
    address,
    setAddress,
  };

  // Route to appropriate page based on path
  const page =
    path.startsWith('/women-services') ? (
      <ServicesPage gender="Women" services={womenServices} {...pageProps} />
    ) : path.startsWith('/men-services') ? (
      <ServicesPage gender="Men" services={menServices} {...pageProps} />
    ) : path.startsWith('/main-category/') ? (
      <CategoryPackagesPage {...pageProps} mainCategoryId={decodeURIComponent(path.split('/')[2] || '')} categoryId={decodeURIComponent(path.split('/')[3] || '')} mainCategoryMode />
    ) : path.startsWith('/packages/') ? (
      <CategoryPackagesPage {...pageProps} mainCategoryId={decodeURIComponent(path.split('/')[2] || '')} categoryId={decodeURIComponent(path.split('/')[3] || '')} />
    ) : path === '/packages' ? (
      <PackagesPage {...pageProps} packages={packages} />
    ) : path === '/edit-package' ? (
      <EditPackagePage {...pageProps} />
    ) : path === '/about' ? (
      <CompanyPage type="about" {...pageProps} />
    ) : path === '/privacy' ? (
      <CompanyPage type="privacy" {...pageProps} />
    ) : path === '/terms' ? (
      <CompanyPage type="terms" {...pageProps} />
    ) : path === '/offers' ? (
      <OffersPage {...pageProps} />
    ) : path === '/cart' ? (
      <CartPage {...pageProps} />
    ) : path === '/confirmation' ? (
      <ConfirmationPage {...pageProps} />
    ) : path === '/address' ? (
      <AddressPage {...pageProps} />
    ) : path === '/summary' ? (
      <SummaryPage {...pageProps} />
    ) : path.startsWith('/order-details/') ? (
      <OrderDetailsPage {...pageProps} orderId={path.split('/')[2]} />
    ) : path === '/booking-history' ? (
      <BookingHistoryPage {...pageProps} />
    ) : path === '/login' ? (
      <LoginPage {...pageProps} />
    ) : path === '/otp' ? (
      <LoginPage {...pageProps} step="otp" />
    ) : path === '/signup' ? (
      <LoginPage {...pageProps} step="signup" />
    ) : path === '/profile' ? (
      <ProfilePage {...pageProps} />
    ) : path === '/success' ? (
      <SuccessPage {...pageProps} />
    ) : (
      <HomePage {...pageProps} packages={packages} />
    );

 return (
  <>
    {loading ? (
      <LoadingScreen />
    ) : (
      <div className="min-h-screen bg-white text-neutral-950">
        <Navbar
          go={go}
          totals={totals}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />
        <main className="page-shell">{page}</main>
        <Footer go={go} />
      </div>
    )}
  </>
);
}

createRoot(document.getElementById('root')).render(<App />);
