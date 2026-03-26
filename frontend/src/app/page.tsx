'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  QrCode,
  UtensilsCrossed,
  ChefHat,
  ConciergeBell,
  LayoutDashboard,
  CheckCircle2,
  Clock,
  Smartphone,
  Search,
  Filter,
  ShoppingCart,
  Flame,
  Wallet,
  Phone,
  History,
  Users,
  Download,
  ArrowRight,
  PlusCircle
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-gray-100">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 h-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <UtensilsCrossed className="w-8 h-8 text-black" />
            <span className="text-xl font-bold tracking-tight">RestroSathi</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-black transition-colors">Features</a>
            <a href="#flow" className="hover:text-black transition-colors">How it Works</a>
            <a href="#benefits" className="hover:text-black transition-colors">Benefits</a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-black transition-colors">
              Login
            </Link>
            <Link href="/signup" className="px-5 py-2.5 bg-black text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition-all shadow-sm active:scale-95">
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4 md:px-8 bg-white">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] text-black text-left">
                The Smartest Way to <br className="hidden md:block" /> Run Your Restaurant
              </h1>
              <p className="text-xl text-gray-600 font-medium leading-relaxed max-w-xl text-left">
                A complete QR-based ordering system that keeps your kitchen, staff, and customers in perfect sync. No apps, no hardware, no hassle.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                <Link href="/signup" className="w-full sm:w-auto px-10 py-4 bg-black text-white rounded-lg font-bold text-lg hover:bg-gray-800 transition-all shadow-md active:scale-95 text-center">
                  Get Started Free
                </Link>
                <Link href="/login" className="w-full sm:w-auto px-10 py-4 bg-white text-black border border-gray-200 rounded-lg font-bold text-lg hover:bg-gray-50 transition-all active:scale-95 text-center">
                  Staff Login
                </Link>
              </div>
            </div>
            <div className="relative animate-in fade-in slide-in-from-right-8 duration-1000 delay-200">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-100">
                <Image
                  src="/landing/hero_qr_ordering.png"
                  alt="Modern Restaurant QR Ordering"
                  width={800}
                  height={600}
                  className="w-full h-auto object-cover"
                  priority
                />
              </div>
              {/* Floating Badge */}
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-xl border border-gray-100 hidden md:block">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="text-white w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-lg font-bold">100% Digital</div>
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-widest text-center">Seamless Sync</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="py-24 bg-gray-50 border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-black uppercase">Built for Modern Dining</h2>
              <p className="text-gray-500 font-medium">Everything you need to streamline your operations from table to kitchen.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Feature 1: Customer Experience */}
              <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center mb-6 border border-gray-100 text-black">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-4 uppercase tracking-tight">Orders in Seconds</h3>
                <ul className="space-y-3 text-sm text-gray-600 font-medium">
                  <li className="flex items-center gap-2"><QrCode className="w-4 h-4" /> Scan table QR to start</li>
                  <li className="flex items-center gap-2"><Search className="w-4 h-4" /> Fast category browsing</li>
                  <li className="flex items-center gap-2"><Filter className="w-4 h-4" /> Veg / Non-veg filters</li>
                  <li className="flex items-center gap-2"><PlusCircle className="w-4 h-4" /> Custom cooking notes</li>
                  <li className="flex items-center gap-2"><Clock className="w-4 h-4" /> Real-time order status</li>
                </ul>
              </div>

              {/* Feature 2: Chef Panel */}
              <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center mb-6 border border-gray-100 text-black">
                  <ChefHat className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-4 uppercase tracking-tight">Smart Kitchen</h3>
                <ul className="space-y-3 text-sm text-gray-600 font-medium">
                  <li className="flex items-center gap-2"><Flame className="w-4 h-4" /> Live digital order feed</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> One-tap status updates</li>
                  <li className="flex items-center gap-2"><ConciergeBell className="w-4 h-4" /> Preparation queue</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> No more paper tickets</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Instant kitchen sync</li>
                </ul>
              </div>

              {/* Feature 3: Reception Panel */}
              <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center mb-6 border border-gray-100 text-black">
                  <History className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-4 uppercase tracking-tight">Front Desk Control</h3>
                <ul className="space-y-3 text-sm text-gray-600 font-medium">
                  <li className="flex items-center gap-2"><LayoutDashboard className="w-4 h-4" /> Full table overview</li>
                  <li className="flex items-center gap-2"><Wallet className="w-4 h-4" /> Quick payment logs</li>
                  <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> Customer visibility</li>
                  <li className="flex items-center gap-2"><History className="w-4 h-4" /> Detailed order history</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Automated billing</li>
                </ul>
              </div>

              {/* Feature 4: Admin Hub */}
              <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center mb-6 border border-gray-100 text-black">
                  <LayoutDashboard className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-4 uppercase tracking-tight">Owner Dashboard</h3>
                <ul className="space-y-3 text-sm text-gray-600 font-medium">
                  <li className="flex items-center gap-2"><UtensilsCrossed className="w-4 h-4" /> Easy menu management</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Real-time availability</li>
                  <li className="flex items-center gap-2"><Users className="w-4 h-4" /> Staff access control</li>
                  <li className="flex items-center gap-2"><Download className="w-4 h-4" /> Table QR generator</li>
                  <li className="flex items-center gap-2"><LayoutDashboard className="w-4 h-4" /> Order monitoring</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Product Flow Section */}
        <section id="flow" className="py-24 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl font-bold tracking-tight text-black uppercase">Simple 5-Step Flow</h2>
              <p className="text-gray-500 font-medium">Delightfully easy for both your staff and customers.</p>
            </div>

            <div className="flex flex-col lg:flex-row justify-between items-center gap-8 relative">
              {/* Connector Line (Desktop) */}
              <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gray-100 -z-10 -translate-y-1/2 mx-20" />

              {[
                { icon: QrCode, label: 'Scan QR' },
                { icon: Search, label: 'Browse Menu' },
                { icon: ShoppingCart, label: 'Place Order' },
                { icon: ChefHat, label: 'Kitchen Prepares' },
                { icon: CheckCircle2, label: 'Track Live' }
              ].map((step, idx) => (
                <div key={idx} className="flex flex-col items-center space-y-4 bg-white p-6 relative group">
                  <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <step.icon className="w-8 h-8" />
                  </div>
                  <span className="font-bold text-sm tracking-tight text-black uppercase">{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="py-24 bg-gray-50 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 md:px-8 grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl font-bold tracking-tight text-black leading-tight">
                More Orders. <br />
                Zero Errors.
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {[
                  { title: 'Faster Service', desc: 'Direct routing to kitchen saves minutes on every single order.' },
                  { title: '100% Accuracy', desc: 'Digital ordering means no more messy handwriting or missed items.' },
                  { title: 'Perfect Sync', desc: 'Everyone stays on the same page with instant real-time updates.' },
                  { title: 'Staff Freedom', desc: 'No more running back and forth with paper bills and menus.' }
                ].map((b, i) => (
                  <div key={i} className="space-y-2">
                    <div className="font-bold text-black uppercase tracking-tight flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-black rounded-full" />
                      {b.title}
                    </div>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">{b.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-black rounded-2xl p-10 text-white space-y-8 shadow-2xl">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold">Ready to take your restaurant digital?</h3>
                <p className="text-gray-400 font-medium">Join the fast-growing network of smart restaurants using RestroSathi.</p>
              </div>
              <Link href="/signup" className="flex items-center justify-center gap-2 w-full py-4 bg-white text-black rounded-lg font-bold hover:bg-gray-100 transition-all">
                Start Your Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Enquiry Section */}
        <section id="contact" className="py-24 bg-white">
          <div className="max-w-3xl mx-auto px-4 md:px-8">
            <div className="bg-gray-50 border border-gray-100 rounded-3xl p-8 md:p-12 shadow-sm">
              <div className="text-center mb-10 space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-black">Get Started with RestroSathi</h2>
                <p className="text-gray-500 font-medium">Have questions or want a demo? Send us a message.</p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const name = formData.get('name') as string;
                  const phone = formData.get('phone') as string;
                  const restaurant = formData.get('restaurant') as string;
                  const message = formData.get('message') as string;

                  if (!name || !phone || !message) {
                    alert('Please fill in all required fields.');
                    return;
                  }

                  const whatsappMessage = `Name: ${name}\nPhone: ${phone}\nRestaurant: ${restaurant || 'Not specified'}\nMessage: ${message}`;
                  const encodedMessage = encodeURIComponent(whatsappMessage);
                  window.open(`https://wa.me/917067206094?text=${encodedMessage}`, '_blank');
                }}
                className="space-y-6"
              >
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Name *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="Your Name"
                      className="w-full px-5 py-4 bg-white border border-gray-200 rounded-xl focus:border-black outline-none transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      placeholder="Your Phone"
                      className="w-full px-5 py-4 bg-white border border-gray-200 rounded-xl focus:border-black outline-none transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Restaurant Name</label>
                  <input
                    type="text"
                    name="restaurant"
                    placeholder="Restaurant Name (Optional)"
                    className="w-full px-5 py-4 bg-white border border-gray-200 rounded-xl focus:border-black outline-none transition-all font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Message *</label>
                  <textarea
                    name="message"
                    required
                    rows={4}
                    placeholder="How can we help you?"
                    className="w-full px-5 py-4 bg-white border border-gray-200 rounded-xl focus:border-black outline-none transition-all font-medium resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-5 bg-black text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  Send on WhatsApp
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6 text-black" />
            <span className="text-lg font-bold tracking-tight text-black">RestroSathi</span>
          </div>

          <div className="flex gap-8 text-xs font-bold text-gray-400 uppercase tracking-widest">
            <a href="#" className="hover:text-black transition-colors">Privacy</a>
            <a href="#" className="hover:text-black transition-colors">Terms</a>
            <a href="#" className="hover:text-black transition-colors">Status</a>
          </div>

          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">
            © 2026 RestroSathi Technologies.
          </p>
        </div>
      </footer>
    </div>
  );
}
