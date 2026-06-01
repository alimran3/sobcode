import { HiOutlineLocationMarker, HiOutlineClock } from 'react-icons/hi';
import { getMedicineImage, formatCurrency } from '../../utils/helpers';
import { CATEGORY_ICONS } from '../../utils/constants';
import { LocalPharmacy } from '@mui/icons-material';

export default function MedicineCard({ item, onClick }) {
  const medicine = item.medicine || item;
  const store = item.store;
  const hasDiscount = item.discountPercentage > 0;

  return (
    <div
      onClick={onClick}
      className="glass rounded-2xl overflow-hidden card-hover cursor-pointer group"
    >
      {/* Image */}
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-surface-100 to-surface-50 dark:from-surface-800 dark:to-surface-900">
        <img
          src={getMedicineImage(item.imageUrl || medicine.imageUrl)}
          alt={medicine.brandName}
          className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110"
          onError={(e) => { e.target.src = '/placeholder-medicine.png'; }}
        />
        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span className="badge bg-white/80 dark:bg-surface-900/80 backdrop-blur-sm text-surface-700 dark:text-surface-300 text-[10px]">
            {(() => {
              const IconComp = CATEGORY_ICONS[medicine.category];
              return IconComp ? <IconComp sx={{ fontSize: 12 }} /> : '📦';
            })()} {medicine.category}
          </span>
        </div>
        {/* Discount badge */}
        {hasDiscount && (
          <div className="absolute top-3 right-3">
            <span className="badge bg-red-500 text-white text-[10px] shadow-lg">
              -{item.discountPercentage}%
            </span>
          </div>
        )}
        {medicine.prescriptionRequired && (
          <div className="absolute bottom-3 right-3">
            <span className="badge bg-amber-500 text-white text-[10px]">Rx Required</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-display font-bold text-sm text-surface-900 dark:text-white group-hover:text-brand-500 transition-colors line-clamp-2">
          {medicine.brandName} {medicine.strength}
        </h3>
        <p className="text-xs text-surface-500 mt-0.5 truncate">{medicine.genericName}</p>

        {/* Price */}
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-lg font-display font-extrabold text-brand-600 dark:text-brand-400">
            {formatCurrency(hasDiscount ? item.finalPrice || (item.sellingPrice * (1 - item.discountPercentage / 100)) : item.sellingPrice || medicine.standardMrp)}
          </span>
          {hasDiscount && item.sellingPrice && (
            <span className="text-xs text-surface-400 line-through">{formatCurrency(item.sellingPrice)}</span>
          )}
        </div>

        {/* Store info */}
        {store && (
          <div className="mt-3 pt-3 border-t border-surface-100 dark:border-surface-800">
            <p className="text-xs font-medium text-surface-700 dark:text-surface-300 truncate">{store.pharmacyName}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-[10px] text-surface-500">
                <HiOutlineLocationMarker className="w-3 h-3" />
                {store.appAddress?.area || store.appAddress?.upazilla}
              </span>
              {item.stockQuantity !== undefined && (
                <span className={`text-[10px] font-semibold ${item.stockQuantity > 5 ? 'text-emerald-500' : item.stockQuantity > 0 ? 'text-amber-500' : 'text-red-500'}`}>
                  {item.stockQuantity > 5 ? 'In Stock' : item.stockQuantity > 0 ? `Only ${item.stockQuantity} left` : 'Out of Stock'}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}