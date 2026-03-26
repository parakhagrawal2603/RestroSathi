import React from 'react';
import Image from 'next/image';
import { 
  Clock, CheckCircle2, XCircle, RotateCcw, 
  Edit3, Trash2
} from 'lucide-react';

interface MenuItemCardProps {
  item: any;
  categoryName: string;
  onToggle: (id: string, mode: 'auto' | 'on' | 'off') => void;
  onEdit?: (item: any) => void;
  onDelete?: (id: string) => void;
  hideActions?: boolean;
}

export default function MenuItemCard({ 
  item, 
  categoryName, 
  onToggle, 
  onEdit = () => {}, 
  onDelete = () => {},
  hideActions = false
}: MenuItemCardProps) {
  const defaultImage = "https://via.placeholder.com/300";
  
  const getModeIcon = () => {
    switch (item.availabilityMode) {
      case 'on': return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'off': return <XCircle className="w-3.5 h-3.5" />;
      default: return <Clock className="w-3.5 h-3.5" />;
    }
  };

  const getModeLabel = () => {
    switch (item.availabilityMode) {
      case 'on': return 'Manual ON';
      case 'off': return 'Manual OFF';
      default: return 'Auto';
    }
  };

  const getModeColor = () => {
    switch (item.availabilityMode) {
      case 'on': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'off': return 'bg-rose-50 text-rose-500 border-rose-200';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  return (
    <div className={`flex flex-col justify-between p-3 sm:p-4 gap-2 bg-white rounded-3xl border transition-all duration-300 shadow-sm hover:shadow-md group min-h-[160px] sm:min-h-[180px] overflow-hidden ${
      !item.isAvailable ? 'bg-slate-50 grayscale-[0.3]' : 'border-slate-100'
    }`}>
      
      {/* Item Image */}
      <div className="relative w-full h-24 sm:h-32 mb-1 sm:mb-2 overflow-hidden rounded-2xl bg-slate-100">
        <Image 
          src={item.image || defaultImage} 
          alt={item.name}
          fill
          unoptimized
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>

      {/* Top Section: Name + Veg Badge */}
      <div className="flex items-start justify-between gap-1 sm:gap-2 overflow-hidden">
        <h3 className="font-semibold text-xs sm:text-lg truncate text-slate-800 uppercase flex-1" title={item.name}>
          {item.name}
        </h3>
        <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 rounded-md text-[8px] sm:text-[9px] font-black uppercase tracking-tight border flex-shrink-0 ${
          item.isVeg ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
        }`}>
          {item.isVeg ? 'Veg' : 'Non-Veg'}
        </span>
      </div>

      {/* Middle Section: Price + Category */}
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <p className="text-sm sm:text-xl font-black text-slate-900 border-b-2 border-slate-900">₹{item.price}</p>
        <span className="text-[10px] sm:text-sm text-slate-500 truncate font-medium bg-slate-100/50 px-2 py-0.5 rounded-lg" title={categoryName}>
          {categoryName}
        </span>
      </div>

      {/* Bottom Section: Time Slots + Toggle */}
      <div className="mt-2 space-y-3">
        {/* Time Slots Row */}
        <div className="flex flex-wrap gap-1">
          {item.timeSlotIds && item.timeSlotIds.length > 0 ? (
            item.timeSlotIds.map((slot: any) => (
              <span 
                key={slot._id} 
                className="text-[8px] sm:text-[9px] font-black text-indigo-500 bg-indigo-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg border border-indigo-100 whitespace-nowrap"
              >
                {slot.name}
              </span>
            ))
          ) : (
            <span className="text-[8px] sm:text-[9px] font-black text-slate-400 bg-slate-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg italic border border-slate-100">
              All Day
            </span>
          )}
        </div>

        {/* Availability Controls Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1">
            <button 
              onClick={() => onToggle(item._id, item.availabilityMode === 'on' ? 'off' : 'on')}
              className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-tight transition-all border shadow-sm ${getModeColor()}`}
            >
              {getModeIcon()}
              {getModeLabel()}
            </button>
            {item.availabilityMode !== 'auto' && (
              <button 
                onClick={() => onToggle(item._id, 'auto')}
                className="p-1.5 rounded-full bg-slate-50 text-slate-400 hover:text-indigo-600 transition-all"
                title="Reset to Auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {!hideActions && (
            <div className="flex gap-1 opacity-10 md:opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => onEdit(item)}
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => onDelete(item._id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
