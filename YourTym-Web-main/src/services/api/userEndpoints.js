import { USER_API_PATH } from './apiConfig.js';

function requiredSegment(value, name) {
  if (value === undefined || value === null || value === '') {
    throw new TypeError(`${name} is required.`);
  }

  return encodeURIComponent(String(value));
}

function userPath(path = '') {
  if (!path) return USER_API_PATH;
  return `${USER_API_PATH}${path.startsWith('/') ? path : `/${path}`}`;
}

// These are host-agnostic paths. Eight requests in the supplied collection use
// conflicting or unresolved hosts; they need backend confirmation before use.
export const userEndpoints = Object.freeze({
  auth: Object.freeze({
    loginWithPhone: userPath('/loginWithPhone'),
    verifyOtp: (verificationUserId) => userPath(`/${requiredSegment(verificationUserId, 'verificationUserId')}`),
    registration: userPath('/registration'),
    resendOtp: (verificationUserId) => userPath(`/resendOtp/${requiredSegment(verificationUserId, 'verificationUserId')}`),
    socialLogin: userPath('/socialLogin'),
  }),
  profile: Object.freeze({
    updateLocation: userPath('/updateLocation'),
    get: userPath('/getProfile'),
    update: userPath('/updateProfile'),
  }),
  catalog: Object.freeze({
    services: userPath('/Category/allServices'),
    packages: userPath('/Category/allPackges'),
    categories: userPath('/Category/allCategory'),
    search: userPath('/Category/search'),
    mostSearched: userPath('/most-searched'),
    frequentlyAddedServices: userPath('/frequently-added-services'),
    freeServices: userPath('/getFreeServices'),
  }),
  promotions: Object.freeze({
    offers: userPath('/Offer/listOffer'),
    coupons: userPath('/Coupan/listCoupan'),
  }),
  locations: Object.freeze({
    cities: userPath('/city/cities'),
    city: (cityId) => userPath(`/city/cities/${requiredSegment(cityId, 'cityId')}`),
    areas: userPath('/area/areas'),
    area: (areaId) => userPath(`/area/areas/${requiredSegment(areaId, 'areaId')}`),
    areasByCity: (cityId) => userPath(`/areas/city/${requiredSegment(cityId, 'cityId')}`),
  }),
  addresses: Object.freeze({
    create: userPath('/address/new'),
    update: (addressId) => userPath(`/address/${requiredSegment(addressId, 'addressId')}`),
    getById: (addressId) => userPath(`/address/${requiredSegment(addressId, 'addressId')}`),
    remove: (addressId) => userPath(`/address/${requiredSegment(addressId, 'addressId')}`),
    list: userPath('/getAddress'),
  }),
  favorites: Object.freeze({
    add: (bookingId) => userPath(`/FavouriteBooking/addFavouriteBooking/${requiredSegment(bookingId, 'bookingId')}`),
    list: userPath('/FavouriteBooking/listFavouriteBooking'),
  }),
  wallet: Object.freeze({
    add: userPath('/wallet/addWallet'),
    remove: userPath('/wallet/removeWallet'),
    get: userPath('/wallet/getwallet'),
    transactions: userPath('/wallet/allTransactionUser'),
    creditTransactions: userPath('/wallet/allcreditTransactionUser'),
    debitTransactions: userPath('/wallet/allDebitTransactionUser'),
  }),
  testimonials: Object.freeze({
    list: userPath('/testimonial'),
    getById: (testimonialId) => userPath(`/testimonial/${requiredSegment(testimonialId, 'testimonialId')}`),
  }),
  cart: Object.freeze({
    addSingleService: userPath('/Cart/addToCartSingleService'),
    addNormalPackage: userPath('/Cart/addToCartPackageNormal'),
    addCustomPackage: userPath('/Cart/addToCartPackageCustomise'),
    updateCustomPackage: userPath('/updateCustomizePackageInCart'),
    addEditedPackage: userPath('/Cart/addToCartPackageEdit'),
    updateEditedPackage: userPath('/updateCartPackageEdit'),
    updateServiceQuantity: userPath('/Cart/updateQuantity'),
    updatePackageQuantity: userPath('/Cart/packages/updateQuantity'),
    get: userPath('/getCart'),
    removeService: userPath('/Cart/remove-from-cart'),
    removePackage: userPath('/Cart/remove-package-from-cart'),
    addService: userPath('/Cart/add-service'),
    provideTip: userPath('/Cart/provideTip'),
    removeTip: userPath('/Cart/removeTipFromCart'),
    applyCoupon: userPath('/Cart/applyCoupan'),
    removeCoupon: userPath('/Cart/removeCouponFromCart'),
    addFreeService: userPath('/Cart/addFreeServiceToCart'),
    addSuggestion: userPath('/Cart/addSuggestionToCart'),
    applyWallet: userPath('/Cart/applyWallet'),
    addAddress: (addressId) => userPath(`/Cart/addAdressToCart/${requiredSegment(addressId, 'addressId')}`),
    addDateAndTime: userPath('/Cart/addDateAndTimeToCart'),
    updateOrderDateAndTime: userPath('/Cart/updateDateAndTimeByOrderId'),
  }),
  orders: Object.freeze({
    checkout: userPath('/Cart/checkout'),
    place: (orderCode) => userPath(`/Cart/placeOrder/${requiredSegment(orderCode, 'orderCode')}`),
    repeat: (orderId) => userPath(`/Cart/repeatOrder/${requiredSegment(orderId, 'orderId')}`),
    cancel: (orderCode) => userPath(`/Cart/cancelOrder/${requiredSegment(orderCode, 'orderCode')}`),
    ongoing: userPath('/getOngoingOrders'),
    completed: userPath('/getCompleteOrders'),
    bookedPartners: userPath('/getBookedPartners'),
    getById: (orderId) => userPath(`/getOrder/${requiredSegment(orderId, 'orderId')}`),
    remove: (orderCode) => userPath(`/Cart/orders/${requiredSegment(orderCode, 'orderCode')}`),
    withNewServices: userPath('/order/withNewServices'),
    updateNewServicePayment: userPath('/order/updateNewServicePaymentStatus'),
    reportIssue: (orderId) => userPath(`/orders/${requiredSegment(orderId, 'orderId')}/reportIssue`),
    issueReports: (orderId) => userPath(`/orders/${requiredSegment(orderId, 'orderId')}/reportIssue`),
  }),
  ratings: Object.freeze({
    create: userPath('/rating/ratings'),
    list: userPath('/getAllRatings'),
    listForUser: userPath('/getRatingsByTypeUser'),
    getById: (ratingId) => userPath(`/rating/${requiredSegment(ratingId, 'ratingId')}`),
    comment: (ratingId) => userPath(`/comment/${requiredSegment(ratingId, 'ratingId')}`),
    rateMainCategory: userPath('/rating/maincategoryRating'),
    mainCategoryRatings: (mainCategoryId) => userPath(`/allRatingsForMainCategory/${requiredSegment(mainCategoryId, 'mainCategoryId')}`),
    allMainCategoryCounts: userPath('/rating-mainAllCategoryRatings'),
    mainCategoryCounts: (mainCategoryId) => userPath(`/rating-mainCategoryRatings/${requiredSegment(mainCategoryId, 'mainCategoryId')}`),
  }),
  banners: Object.freeze({
    static: userPath('/Banner/all/staticBanner'),
  }),
  slots: Object.freeze({
    list: userPath('/slot'),
    byMainCategory: (mainCategoryId) => userPath(`/slot/main-category/${requiredSegment(mainCategoryId, 'mainCategoryId')}`),
    getById: (slotId) => userPath(`/slot/${requiredSegment(slotId, 'slotId')}`),
    byPartner: (partnerId) => userPath(`/slot/byPartner/${requiredSegment(partnerId, 'partnerId')}`),
  }),
  tickets: Object.freeze({
    create: userPath('/ticket/createTicket'),
    list: userPath('/ticket/listTicket'),
    getById: (ticketId) => userPath(`/ticket/${requiredSegment(ticketId, 'ticketId')}`),
    reply: (ticketId) => userPath(`/replyOnTicket/${requiredSegment(ticketId, 'ticketId')}`),
  }),
  notifications: Object.freeze({
    markAsRead: (notificationId) => userPath(`/notifications/${requiredSegment(notificationId, 'notificationId')}`),
    markAllAsRead: userPath('/notifications/markAll/read'),
    forUser: (userId) => userPath(`/notifications/user/${requiredSegment(userId, 'userId')}`),
    list: userPath('/notifications/user'),
  }),
  plans: Object.freeze({
    list: userPath('/plans'),
    getById: (planId) => userPath(`/plans/${requiredSegment(planId, 'planId')}`),
    purchase: userPath('/buy-plan/add'),
    userPlans: userPath('/buy-plan'),
    userPlan: (userPlanId) => userPath(`/buy-plan/${requiredSegment(userPlanId, 'userPlanId')}`),
    updateUserPlan: (userPlanId) => userPath(`/buy-plan/${requiredSegment(userPlanId, 'userPlanId')}`),
    removeUserPlan: (userPlanId) => userPath(`/buy-plan/${requiredSegment(userPlanId, 'userPlanId')}`),
  }),
  cards: Object.freeze({
    create: userPath('/card-details/add'),
    list: userPath('/card-details'),
    update: (cardId) => userPath(`/card-details/${requiredSegment(cardId, 'cardId')}`),
    remove: (cardId) => userPath(`/card-details/${requiredSegment(cardId, 'cardId')}`),
  }),
});

export default userEndpoints;
