'use client';

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import {
  Minus, Plus, UtensilsCrossed, ChevronRight, ShoppingBag,
  Info, AlertCircle, ArrowLeft, Leaf, ChevronLeft,
  X, MessageSquare, Phone, User, Hash, Clock, Search, Mic, Circle, Triangle, ShieldCheck
} from 'lucide-react';
import { useSocket } from '@/context/SocketContext';

type ViewState = 'menu' | 'cart' | 'checkout' | 'orders';

export default function CustomerMenu({ params }: { params: { id: string } }) {
  const [view, setView] = useState<ViewState>('menu');
  const [restaurant, setRestaurant] = useState<any>(null);
  const [menu, setMenu] = useState<{ categories: any[], items: any[] }>({ categories: [], items: [] });
  const [cart, setCart] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isInactive, setIsInactive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [placedOrders, setPlacedOrders] = useState<any[]>([]);
  const [restoringOrders, setRestoringOrders] = useState(false);

  // Order Form State
  const [orderForm, setOrderForm] = useState({
    name: '',
    phone: '',
    tableNumber: '',
    instructions: ''
  });

  const { socket } = useSocket();

  useEffect(() => {
    // 0. Reset State on Navigation (Immediate)
    setLoading(true);
    setIsInactive(false);
    setRestaurant(null);
    setMenu({ categories: [], items: [] });
    setCart([]);
    setPlacedOrders([]);

    // 1. Fetch Restaurant Details
    api.get(`/restaurants/${params.id}/public`).then(({ data }) => {
      setRestaurant(data);
      if (data.status === 'inactive') setIsInactive(true);
    }).catch(() => toast.error('Restaurant not found'));

    // 2. Fetch Menu
    api.get(`/menu?restaurantId=${params.id}`).then(({ data }) => {
      setMenu(data);
      setLoading(false);
    }).catch((error) => {
      if (error.response?.status === 403) setIsInactive(true);
      else toast.error('Failed to load menu');
      setLoading(false);
    });

    // 3. Load saved session data (SCOPED TO RESTAURANT ID)
    try {
      // 3.1 Load Filters
      const savedFilters = localStorage.getItem(`restrosathi_filters_${params.id}`);
      if (savedFilters) {
        const { diet, category } = JSON.parse(savedFilters);
        if (diet) setActiveFilter(diet);
        if (category) setActiveCategory(category);
      } else {
        setActiveFilter('all');
        setActiveCategory('');
      }

      // 3.2 Load Order Form (Customer identity can be global, but table/checkout is scoped)
      const savedForm = localStorage.getItem(`restrosathi_checkout_form_${params.id}`);
      if (savedForm) {
        const parsed = JSON.parse(savedForm);
        setOrderForm(parsed);
      } else {
        setOrderForm(prev => ({ ...prev, tableNumber: '', instructions: '' }));
        // Try to pre-fill identity from global storage
        const legacy = localStorage.getItem('restrosathi_customer_identity_v3');
        if (legacy) {
          const parsed = JSON.parse(legacy);
          setOrderForm(prev => ({ ...prev, name: parsed.name || '', phone: parsed.phone || '' }));
        }
      }

      // 3.3 Load Cart
      const savedCart = localStorage.getItem(`restrosathi_cart_${params.id}`);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        if (parsedCart.length > 0) {
          setCart(parsedCart);
          toast.success('Your cart has been restored', { icon: '🛒', duration: 2000 });
        }
      }

      // 3.4 Load Active Orders
      const savedOrders = localStorage.getItem(`restrosathi_active_orders_${params.id}`);
      if (savedOrders) {
        const orderIds = JSON.parse(savedOrders);
        if (orderIds.length > 0) {
          setRestoringOrders(true);
          // Fetch status of these orders using Public API
          Promise.all(orderIds.map((id: string) => {
            return api.get(`/orders/public/${id}`).then(r => r.data).catch(() => null);
          }))
            .then(results => {
              const active = results.filter((o: any) => o && !(o.status === 'served' && o.isPaid));
              setPlacedOrders(active);
              localStorage.setItem(`restrosathi_active_orders_${params.id}`, JSON.stringify(active.map((o: any) => o._id)));
              setRestoringOrders(false);
            })
            .catch(() => setRestoringOrders(false));
        }
      }
    } catch (e) {
      console.error('Failed to load session:', e);
    }
  }, [params.id]);

  // Persistence Effects (SCOPED TO RESTAURANT ID)
  useEffect(() => {
    if (params.id) localStorage.setItem(`restrosathi_cart_${params.id}`, JSON.stringify(cart));
  }, [cart, params.id]);

  useEffect(() => {
    if (params.id) {
      localStorage.setItem(`restrosathi_checkout_form_${params.id}`, JSON.stringify(orderForm));
      // Store identity globally to remember user across scans
      localStorage.setItem('restrosathi_customer_identity_v3', JSON.stringify({ name: orderForm.name, phone: orderForm.phone }));
    }
  }, [orderForm, params.id]);

  useEffect(() => {
    if (params.id) localStorage.setItem(`restrosathi_filters_${params.id}`, JSON.stringify({ diet: activeFilter, category: activeCategory }));
  }, [activeFilter, activeCategory, params.id]);

  useEffect(() => {
    if (socket && params.id) {
      socket.emit('joinRestaurant', params.id);

      socket.on('menuUpdated', (updatedItem: any) => {
        setMenu(prev => ({
          ...prev,
          items: prev.items.map((item: any) =>
            item._id === updatedItem._id ? updatedItem : item
          )
        }));

        // Cart reconciliation
        setCart(prev => {
          const inCart = prev.find(i => i.menuItem === updatedItem._id);
          if (inCart && !updatedItem.isAvailable) {
            toast.error(`${updatedItem.name} is now out of stock.`);
            return prev.filter(i => i.menuItem !== updatedItem._id);
          }
          if (inCart && updatedItem.price !== inCart.price) {
            return prev.map(i => i.menuItem === updatedItem._id ? { ...i, price: updatedItem.price, name: updatedItem.name } : i);
          }
          return prev;
        });
      });

      socket.on('orderUpdated', (updatedOrder: any) => {
        setPlacedOrders(prev => {
          const exists = prev.find(o => o._id === updatedOrder._id);
          if (exists) {
            if (exists.status !== updatedOrder.status) {
              if (updatedOrder.status === 'preparing') toast.success("Your order is being prepared!", { icon: '👨‍🍳' });
              else if (updatedOrder.status === 'ready') toast.success("Your order is ready!", { icon: '✅' });
              else toast.success(`Order #${updatedOrder.orderNumber} is now ${updatedOrder.status}!`, { icon: '🔔' });
            }

            // Cleanup if served and paid
            if (updatedOrder.status === 'served' && updatedOrder.isPaid) {
              const updated = prev.filter(o => o._id !== updatedOrder._id);
              localStorage.setItem('restrosathi_active_orders', JSON.stringify(updated.map(o => o._id)));
              return updated;
            }

            return prev.map(o => o._id === updatedOrder._id ? updatedOrder : o);
          }
          return prev;
        });
      });

      socket.on('orderCreated', (newOrder: any) => {
        // Only track if it matches our table and phone (cross-tab sync)
        if (newOrder.tableNumber === Number(orderForm.tableNumber) && newOrder.customer?.phone === orderForm.phone) {
          setPlacedOrders(prev => {
            if (prev.find(o => o._id === newOrder._id)) return prev;
            const updated = [...prev, newOrder];
            localStorage.setItem('restrosathi_active_orders', JSON.stringify(updated.map(o => o._id)));
            return updated;
          });
        }
      });

      socket.on('orderDeleted', (orderId: string) => {
        setPlacedOrders(prev => prev.filter(o => o._id !== orderId));
      });
    }

    return () => {
      socket?.off('menuUpdated');
      socket?.off('orderUpdated');
      socket?.off('orderDeleted');
    };
  }, [socket, params.id, orderForm.phone, orderForm.tableNumber]);

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItem === item._id);
      if (existing) return prev.map(i => i.menuItem === item._id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { menuItem: item._id, name: item.name, price: item.price, quantity: 1, isVeg: item.isVeg, image: item.image }];
    });
    toast.success('Added to cart', { icon: '😋', duration: 1000 });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.menuItem === id) {
        const newQ = i.quantity + delta;
        return newQ > 0 ? { ...i, quantity: newQ } : null;
      }
      return i;
    }).filter(Boolean) as any[]);
  };

  const totalCart = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderForm.tableNumber) return toast.error('Table Number is required');
    if (!orderForm.phone) return toast.error('Phone Number is required');
    if (orderForm.phone.length < 10) return toast.error('Please enter a valid phone number');

    setSubmitting(true);
    try {
      localStorage.setItem('restrosathi_customer_identity_v3', JSON.stringify({ name: orderForm.name, phone: orderForm.phone }));
      const { data: newOrder } = await api.post('/orders', {
        restaurantId: params.id,
        tableNumber: Number(orderForm.tableNumber),
        customer: { name: orderForm.name, phone: orderForm.phone },
        items: cart,
        instructions: orderForm.instructions
      });

      // Track the new order
      const updatedPlacedOrders = [...placedOrders, newOrder];
      setPlacedOrders(updatedPlacedOrders);
      localStorage.setItem('restrosathi_active_orders', JSON.stringify(updatedPlacedOrders.map(o => o._id)));

      toast.success('Order placed successfully!', { icon: '🔥', duration: 4000 });
      
      // Clear Session (Scoped)
      setCart([]);
      localStorage.removeItem(`restrosathi_cart_${params.id}`);
      localStorage.removeItem(`restrosathi_checkout_form_${params.id}`);
      
      setOrderForm(prev => ({ ...prev, instructions: '' }));
      setView('orders');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = useMemo(() => {
    return menu.items.filter((item: any) => {
      // 1. Category Filter
      if (activeCategory && item.categoryId !== activeCategory) return false;

      // 2. Veg/Non-Veg Filter (Diet Pills)
      if (activeFilter === 'veg' && !item.isVeg) return false;
      if (activeFilter === 'nonveg' && item.isVeg) return false;

      // 3. Search Filter
      if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;

      return true;
    });
  }, [menu.items, activeCategory, activeFilter, searchQuery]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-10 text-center">
      <div className="w-16 h-16 border-[6px] border-slate-50 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Opening Menu</p>
    </div>
  );

  if (isInactive) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-8 text-center animate-in fade-in duration-500">
      <div className="w-24 h-24 bg-rose-50 rounded-[2.5rem] flex items-center justify-center mb-8 rotate-3 shadow-xl shadow-rose-100/50">
        <AlertCircle className="w-12 h-12 text-rose-500" />
      </div>
      <h1 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">Currently Offline</h1>
      <p className="text-slate-400 text-sm font-medium max-w-[240px] leading-relaxed">
        {restaurant?.name || 'This restaurant'} is not taking orders right now.
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100">
      {/* ----------------- MENU VIEW ----------------- */}
      {view === 'menu' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
          {/* Header */}
          <header className="sticky top-0 z-30 bg-white border-b border-slate-50 px-6 py-4 flex justify-between items-center transition-all duration-300">
            <div className="flex flex-col flex-1 min-w-0 mr-4">
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-0.5">Welcome to</span>
              <h1 className="text-xl font-black text-slate-900 break-words leading-tight">{restaurant?.name || 'Restaurant'}</h1>
            </div>
            <button
              onClick={() => itemCount > 0 && setView('cart')}
              className="relative w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 transition-transform active:scale-90"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-in zoom-in">
                  {itemCount}
                </span>
              )}
            </button>
          </header>

          {/* 🔍 Search & Filters Section (Matched to Reference) */}
          <div className="px-5 py-4 space-y-4 bg-white sticky top-[80px] z-20">
            {/* Active Order Tracker */}
            {placedOrders.length > 0 && (
              <button 
                onClick={() => setView('orders')}
                className="w-full bg-indigo-600 p-4 rounded-2xl flex items-center justify-between text-white shadow-xl shadow-indigo-100 animate-in slide-in-from-top-4 duration-500 mb-2"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Active Orders</p>
                    <p className="text-sm font-black">Track your {placedOrders.length > 1 ? 'orders' : 'order'} status</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 opacity-60" />
              </button>
            )}

            {/* Search Bar */}
            <div className="flex items-center bg-[#F2F2F2] rounded-[1.2rem] px-5 py-3.5 transition-all">
              <input
                type="text"
                placeholder="Search for dishes"
                className="bg-transparent flex-1 text-lg font-medium text-slate-700 outline-none placeholder:text-slate-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="w-6 h-6 text-slate-500 font-light" />
            </div>

            {/* Filter Row */}
            <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-1 scroll-smooth">
              {/* Veg Toggle Pill */}
              <button
                onClick={() => setActiveFilter(activeFilter === 'veg' ? 'all' : 'veg')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all shrink-0 shadow-sm ${activeFilter === 'veg' ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 bg-white'
                  }`}
              >
                <div className="w-5 h-5 border-2 border-emerald-600 rounded-md flex items-center justify-center bg-white">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full" />
                </div>
                <div className={`w-8 h-4 rounded-full relative transition-colors ${activeFilter === 'veg' ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${activeFilter === 'veg' ? 'left-4.5' : 'left-0.5'}`} style={{ left: activeFilter === 'veg' ? '18px' : '2px' }} />
                </div>
              </button>

              {/* Non-Veg Toggle Pill */}
              <button
                onClick={() => setActiveFilter(activeFilter === 'nonveg' ? 'all' : 'nonveg')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all shrink-0 shadow-sm ${activeFilter === 'nonveg' ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200 bg-white'
                  }`}
              >
                <div className="w-5 h-5 border-2 border-rose-600 rounded-md flex items-center justify-center bg-white">
                  <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[7px] border-b-rose-600" />
                </div>
                <div className={`w-8 h-4 rounded-full relative transition-colors ${activeFilter === 'nonveg' ? 'bg-rose-500' : 'bg-slate-200'}`}>
                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${activeFilter === 'nonveg' ? 'left-4.5' : 'left-0.5'}`} style={{ left: activeFilter === 'nonveg' ? '18px' : '2px' }} />
                </div>
              </button>
            </div>

            {/* Categories */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pt-2 pb-1 scroll-smooth">
              <button
                onClick={() => setActiveCategory('')}
                className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${!activeCategory
                  ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                  : 'bg-white border-slate-100 text-slate-400'
                  }`}
              >
                All Dishes
              </button>
              {menu.categories.map((c: any) => (
                <button
                  key={c._id}
                  onClick={() => setActiveCategory(c._id)}
                  className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${activeCategory === c._id
                    ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                    : 'bg-white border-slate-100 text-slate-400'
                    }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Items List */}
          <div className="px-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredItems.length === 0 ? (
              <div className="col-span-full py-20 flex flex-col items-center opacity-30">
                <UtensilsCrossed className="w-12 h-12 mb-4" />
                <p className="text-xs font-black uppercase tracking-widest">Nothing found</p>
              </div>
            ) : (
              filteredItems.map((item: any) => (
                <MenuItemCard
                  key={item._id}
                  item={item}
                  cart={cart}
                  onAdd={addToCart}
                  onUpdate={updateQuantity}
                />
              ))
            )}
          </div>

          {/* Sticky Cart Bar (Matched to Reference) */}
          {itemCount > 0 && (
            <div className="fixed bottom-0 left-0 right-0 p-4 pb-8 bg-gradient-to-t from-white via-white/80 to-transparent z-40 pointer-events-none">
              <button
                onClick={() => setView('cart')}
                className="w-full h-14 bg-[#1BA672] rounded-2xl shadow-2xl shadow-emerald-200 flex items-center justify-between px-6 text-white pointer-events-auto transform active:scale-[0.98] transition-all animate-in slide-in-from-bottom duration-500"
              >
                <span className="font-black text-base tracking-tight">
                  {itemCount} {itemCount === 1 ? 'Item' : 'Items'} added
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-base uppercase tracking-wider">View Cart</span>
                  <ChevronRight className="w-5 h-5" />
                </div>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ----------------- ORDERS VIEW ----------------- */}
      {view === 'orders' && (
        <div className="animate-in fade-in slide-in-from-right duration-500 min-h-screen bg-slate-50 flex flex-col pb-10">
          <header className="sticky top-0 z-50 bg-white shadow-sm px-4 py-3 flex items-center justify-between">
            <button onClick={() => setView('menu')} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-900 transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold text-slate-900">Your Orders</h2>
            <div className="w-10" />
          </header>

          {/* Restoring Banner */}
          {restoringOrders && (
            <div className="bg-indigo-50 px-4 py-2 flex items-center justify-center gap-2 border-b border-indigo-100">
              <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Restoring your orders...</span>
            </div>
          )}

          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {placedOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[60vh] text-center opacity-30">
                <ShoppingBag className="w-16 h-16 mb-4" />
                <p className="font-black uppercase tracking-widest text-xs">No active orders</p>
                <button onClick={() => setView('menu')} className="mt-4 text-indigo-600 text-sm font-bold">Browse Menu</button>
              </div>
            ) : (
              placedOrders.map((order: any) => (
                <div key={order._id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in zoom-in duration-300">
                  <div className="p-4 border-b border-slate-50 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order #{order.orderNumber}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                      order.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                      order.status === 'preparing' ? 'bg-indigo-100 text-indigo-600' :
                      order.status === 'ready' ? 'bg-emerald-100 text-emerald-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {order.status}
                    </div>
                  </div>

                  {/* Progress Bar Section */}
                  <div className="px-4 py-8 bg-white border-b border-slate-50">
                    <OrderProgressBar status={order.status} />
                    <p className="text-center text-[11px] font-bold text-slate-500 mt-6 animate-pulse">
                      {order.status === 'pending' && 'Waiting for restaurant confirmation...'}
                      {order.status === 'preparing' && 'Your delicious meal is being prepared! 👨‍🍳'}
                      {order.status === 'ready' && 'Your order is ready! 🍽️'}
                      {order.status === 'served' && 'Hope you enjoy your meal! 😊'}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50/50">
                    <div className="space-y-2">
                       {order.items.map((item: any, idx: number) => (
                         <div key={idx} className="flex justify-between items-center">
                           <span className="text-sm font-medium text-slate-700">{item.quantity}x {item.name}</span>
                           <span className="text-xs text-slate-400">₹{item.price * item.quantity}</span>
                         </div>
                       ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                       <span className="text-sm font-bold text-slate-900">Total Paid</span>
                       <span className="text-lg font-black text-slate-900">₹{order.totalAmount}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="px-4 mt-auto">
             <button 
               onClick={() => setView('menu')}
               className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold transition-all active:scale-95"
             >
               Back to Menu
             </button>
          </div>
        </div>
      )}

      {/* ----------------- CART VIEW ----------------- */}
      {view === 'cart' && (
        <div className="animate-in fade-in slide-in-from-right duration-500 min-h-screen bg-slate-50 flex flex-col">
          <header className="bg-white px-6 pt-4 pb-2 flex items-center gap-4 border-b border-slate-100">
            <button onClick={() => setView('menu')} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Your Cart</h2>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-8 space-y-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[50vh] text-center opacity-30">
                <ShoppingBag className="w-16 h-16 mb-4" />
                <p className="font-black uppercase tracking-widest text-xs">Cart is empty</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.menuItem} className="bg-white rounded-3xl p-4 flex gap-4 border border-slate-100 shadow-sm animate-in zoom-in duration-300">
                  <div className="relative w-20 h-20 bg-slate-100 rounded-2xl overflow-hidden shrink-0">
                    <Image src={item.image || "https://via.placeholder.com/100"} alt="" fill className="object-cover" unoptimized />
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <h4 className="font-black text-slate-800 leading-tight">{item.name}</h4>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{item.isVeg ? 'Veg' : 'Non-Veg'}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-black text-slate-900">₹{item.price * item.quantity}</span>
                      <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-xl">
                        <button onClick={() => updateQuantity(item.menuItem, -1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-400"><Minus className="w-3.5 h-3.5" /></button>
                        <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.menuItem, 1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-900"><Plus className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}

          </div>

          {cart.length > 0 && (
            <div className="bg-white border-t border-slate-100 p-6 flex items-center justify-between sticky bottom-0 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
              <div className="flex flex-col">
                <span className="text-2xl font-black text-indigo-600">₹{totalCart}</span>
              </div>
              <button
                onClick={() => setView('checkout')}
                className="h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-lg shadow-xl shadow-indigo-100 transition-all active:scale-95 flex items-center gap-3 animate-in fade-in slide-in-from-right duration-500 font-sans"
              >
                <ShieldCheck className="w-6 h-6" />
                <span>Proceed</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ----------------- CHECKOUT VIEW ----------------- */}
      {view === 'checkout' && (
        <div className="animate-in fade-in slide-in-from-right duration-500 min-h-screen bg-slate-50 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-50 bg-white shadow-sm px-4 py-3 flex items-center justify-between">
            <button onClick={() => setView('cart')} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-900 transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold text-slate-900">Checkout</h2>
            <div className="w-10" /> {/* Spacer for centering */}
          </header>

          <form onSubmit={placeOrder} className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto">
            {/* Personal Details Section */}
            <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-slate-900" />
                <h3 className="text-sm font-bold text-slate-900">Personal Details</h3>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={orderForm.name}
                    onChange={e => setOrderForm({ ...orderForm, name: e.target.value })}
                    className="w-full bg-gray-100 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-black outline-none transition-all placeholder:text-gray-400 font-medium"
                  />
                </div>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="Phone Number"
                    value={orderForm.phone}
                    onChange={e => setOrderForm({ ...orderForm, phone: e.target.value })}
                    className="w-full bg-gray-100 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-black outline-none transition-all placeholder:text-gray-400 font-medium"
                  />
                  {orderForm.phone && orderForm.phone.length < 10 && (
                    <p className="text-[10px] text-red-500 mt-1 font-medium ml-1">Please enter a valid phone number</p>
                  )}
                </div>
              </div>
            </div>

            {/* Ordering At Section */}
            <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Hash className="w-4 h-4 text-slate-900" />
                <h3 className="text-sm font-bold text-slate-900">Table Number</h3>
              </div>
              <input
                type="number"
                required
                placeholder="Table Number"
                value={orderForm.tableNumber}
                onChange={e => setOrderForm({ ...orderForm, tableNumber: e.target.value })}
                className="w-full bg-gray-100 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-black outline-none transition-all placeholder:text-gray-400 font-medium"
              />
            </div>

            {/* Cooking Notes Section */}
            <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="w-4 h-4 text-slate-900" />
                <h3 className="text-sm font-bold text-slate-900">Cooking Notes (Optional)</h3>
              </div>
              <textarea
                rows={3}
                placeholder="Less spicy, no onion..."
                value={orderForm.instructions}
                onChange={e => setOrderForm({ ...orderForm, instructions: e.target.value })}
                className="w-full bg-gray-100 rounded-xl p-3 text-sm focus:ring-2 focus:ring-black outline-none transition-all placeholder:text-gray-400 font-medium min-h-[100px] resize-none"
              />
            </div>

            {/* Total Payable Section */}
            <div className="bg-white rounded-xl shadow-sm p-5 flex justify-between items-center mt-2">
              <span className="text-base font-bold text-slate-900">Total Payable</span>
              <span className="text-2xl font-black text-slate-900">₹{totalCart}</span>
            </div>

            {/* CTA Button & Footer */}
            <div className="pt-4 pb-12 space-y-3">
              <button
                type="submit"
                disabled={submitting || !orderForm.name || !orderForm.phone || !orderForm.tableNumber || orderForm.phone.length < 10}
                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-full text-lg font-semibold shadow-lg shadow-green-100 transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
              >
                {submitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  "Place Order"
                )}
              </button>
              <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 font-medium tracking-tight">
                <Clock className="w-3.5 h-3.5" />
                Usually ready in 15–20 mins
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function OrderProgressBar({ status }: { status: string }) {
  const steps = ['pending', 'preparing', 'ready', 'served'];
  const currentIndex = steps.indexOf(status);
  
  const getStepColor = (index: number) => {
    if (index > currentIndex) return 'bg-slate-200';
    switch (steps[index]) {
      case 'pending': return 'bg-amber-500';
      case 'preparing': return 'bg-indigo-500';
      case 'ready': return 'bg-emerald-500';
      case 'served': return 'bg-slate-400';
      default: return 'bg-slate-200';
    }
  };

  const getTextColor = (index: number) => {
    if (index > currentIndex) return 'text-slate-300';
    if (index === currentIndex) return 'text-slate-900';
    return 'text-slate-400';
  };

  return (
    <div className="relative flex items-center justify-between w-full max-w-[280px] mx-auto">
      {/* Background Line */}
      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
      
      {/* Progress Line */}
      <div 
        className={`absolute top-1/2 left-0 h-0.5 transition-all duration-700 -translate-y-1/2 z-0 ${getStepColor(currentIndex)}`}
        style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
      />

      {steps.map((step, idx) => {
        const isActive = idx === currentIndex;
        const isCompleted = idx < currentIndex;
        
        return (
          <div key={step} className="relative z-10 flex flex-col items-center">
            {/* Step Circle */}
            <div className={`w-3.5 h-3.5 rounded-full transition-all duration-500 border-4 border-white shadow-sm
              ${getStepColor(idx)}
              ${isActive ? 'scale-125 ring-4 ring-offset-2 ring-opacity-20 ' + getStepColor(idx).replace('bg-', 'ring-') : ''}
              ${isActive ? 'animate-pulse' : ''}
            `} />
            
            {/* Step Label */}
            <span className={`absolute -bottom-6 text-[9px] font-black uppercase tracking-tight whitespace-nowrap transition-colors duration-500 ${getTextColor(idx)}`}>
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function MenuItemCard({ item, cart, onAdd, onUpdate }: any) {
  const cartItem = cart.find((i: any) => i.menuItem === item._id);

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm flex flex-col animate-in zoom-in duration-500 w-full">
      {/* Image Section */}
      <div className="p-2">
        <div className="relative h-28 bg-slate-50 rounded-xl overflow-hidden shadow-inner">
          <Image
            src={item.image || "https://via.placeholder.com/200x200"}
            alt={item.name}
            fill
            unoptimized
            className={`object-cover transition-transform duration-700 ease-out ${!item.isAvailable ? 'grayscale opacity-60' : ''}`}
          />
        </div>
      </div>

      {/* Content Section */}
      <div className="px-3 pb-3 flex flex-col gap-2">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-sm border-2 ${item.isVeg ? 'border-emerald-500 bg-emerald-50' : 'border-rose-500 bg-rose-50'} flex items-center justify-center shrink-0`}>
              <span className={`w-1 h-1 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </span>
            <h3 className="text-sm font-black text-slate-900 leading-tight truncate" title={item.name}>{item.name}</h3>
          </div>
          <span className="text-base font-black text-slate-900 leading-none">₹{item.price}</span>
        </div>

        {/* Availability Info */}
        {!item.isAvailable && (
          <div className="flex items-center gap-1 text-red-500">
            <Info className="w-3 h-3 text-red-500" />
            <span className="text-[10px] font-semibold uppercase">Out of Stock</span>
          </div>
        )}

        {/* Add Button Section */}
        <div className="mt-1">
          {cartItem ? (
            <div className="flex items-center gap-1.5 bg-slate-900 text-white p-1 rounded-xl w-full shadow-lg shadow-slate-200 animate-in slide-in-from-left duration-300">
              <button
                onClick={() => onUpdate(item._id, -1)}
                className="flex-1 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-black text-xs w-3 text-center">{cartItem.quantity}</span>
              <button
                onClick={() => onUpdate(item._id, 1)}
                className="flex-1 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              disabled={!item.isAvailable}
              onClick={() => onAdd(item)}
              className={`w-full py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 shadow-sm border-2 ${item.isAvailable
                ? 'bg-white border-slate-100 hover:border-indigo-600 text-slate-800 hover:text-indigo-600 active:scale-95'
                : 'bg-gray-300 border-transparent text-gray-500 cursor-not-allowed'
                }`}
            >
              {!item.isAvailable ? (
                <>Out of Stock</>
              ) : (
                <><Plus className="w-3.5 h-3.5" /> Add</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
