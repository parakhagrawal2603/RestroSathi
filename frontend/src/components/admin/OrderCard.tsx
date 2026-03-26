import React from 'react';
import { 
  User, Phone, Clock, ShoppingBag, 
  ChevronRight, Calendar, AlertCircle, Eye
} from 'lucide-react';

interface OrderCardProps {
  order: any;
  onView: (order: any) => void;
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'pending': return 'bg-yellow-100 border-yellow-400 text-yellow-700';
    case 'preparing': return 'bg-blue-100 border-blue-400 text-blue-700';
    case 'ready': return 'bg-green-100 border-green-400 text-green-700';
    case 'served': return 'bg-gray-100 border-gray-400 text-gray-700';
    default: return 'bg-white border-slate-100 text-slate-400';
  }
}

export default function OrderCard({ order, onView }: OrderCardProps) {
  const items = order.items || [];
  const totalAmount = items.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0);

  return (
    <div 
      onClick={() => onView(order)}
      className={`group flex flex-col rounded-[2.5rem] border transition-all hover:shadow-2xl overflow-hidden bg-white cursor-pointer ${
        getStatusStyle(order.status).split(' ').slice(0, 2).join(' ')
      } ${
        order.status === 'ready' ? 'border-2 border-green-600 animate-pulse' : 'border-slate-100 shadow-sm'
      }`}
    >
      {/* Header */}
      <div className="p-6 border-b border-white/50 flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg ring-4 ring-white/50">
            {order.tableNumber}
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase text-slate-500/70 tracking-widest leading-none">Table</p>
            <p className="text-lg font-bold text-slate-800 tracking-tight truncate max-w-[150px]">
              {order.customer?.name || 'Guest'}
            </p>
            {order.customer?.phone ? (
              <a 
                href={`tel:${order.customer.phone}`}
                className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-indigo-600 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Phone className="w-3 h-3 text-indigo-500" />
                {order.customer.phone}
              </a>
            ) : (
              <p className="text-[10px] font-bold text-slate-300">Phone: N/A</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
           <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border bg-white/90`}>
            {order.status}
          </span>
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
            <Clock className="w-3 h-3" />
            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="p-6 flex-1">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5" /> Order Recap
          </p>
          <span className="text-xs font-black text-slate-900">₹{totalAmount}</span>
        </div>
        <ul className="space-y-2.5">
          {items.slice(0, 3).map((item: any, idx: number) => (
            <li key={idx} className="flex justify-between items-center text-xs font-bold text-slate-700 bg-white/50 p-2 rounded-xl border border-white/50">
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 bg-slate-900 text-white rounded-lg flex items-center justify-center text-[9px]">{item.quantity}</span>
                <span className="truncate max-w-[150px]">{item.name || item.menuItem?.name || 'Item'}</span>
              </span>
              <span className="text-[10px] text-slate-400">₹{item.price * item.quantity}</span>
            </li>
          ))}
          {items.length > 3 && (
            <li className="text-[10px] font-black text-indigo-600 uppercase tracking-widest pl-2">
              +{items.length - 3} more products...
            </li>
          )}
        </ul>
      </div>

      {/* Actions */}
      <div className="p-4 px-6 bg-slate-50/50 rounded-b-[2.5rem] border-t border-white/50 flex flex-col">
        <button 
          onClick={(e) => { e.stopPropagation(); onView(order); }}
          className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-200 active:scale-95"
        >
          <Eye className="w-4 h-4" /> View Full Order
        </button>
      </div>
    </div>
  );
}
