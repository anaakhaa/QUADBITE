import { useState } from 'react';
import { Minus, Plus, X } from 'lucide-react';
import { formatINR } from '../data/campusData';
import { Dish, DishOption } from '../types/quadbite';
import { ResilientImage } from './ResilientImage';

interface DishModalProps {
  dish: Dish | null;
  onClose: () => void;
  onAddToCart: (dish: Dish, option: DishOption, quantity: number, note: string) => void;
}

export function DishModal({ dish, onClose, onAddToCart }: DishModalProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');

  if (!dish) {
    return null;
  }

  const activeOption =
    dish.options.find((opt) => opt.id === selectedOptionId) || dish.options[0];
  const unitPrice = Math.max(0, dish.price + activeOption.priceDelta);
  const regularUnitPrice = Math.max(0, dish.regularPrice + activeOption.priceDelta);
  const lineTotal = unitPrice * quantity;
  const lineSavings = Math.max(0, (regularUnitPrice - unitPrice) * quantity);

  const handleConfirm = () => {
    onAddToCart(dish, activeOption, quantity, note.trim());
    setSelectedOptionId('');
    setQuantity(1);
    setNote('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dish-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg overflow-hidden max-h-[92vh] flex flex-col">
        <div className="relative aspect-16/9 w-full bg-slate-100 shrink-0">
          <ResilientImage
            src={dish.imagePath}
            alt={dish.imageAlt}
            fallbackLabel={dish.name}
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dish details"
            className="absolute top-3 right-3 p-2 bg-white/90 text-slate-800 hover:bg-white rounded-lg border border-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-slate-200">
          <p className="text-xs font-medium text-slate-500">
            {dish.kitchenName} · {dish.prepMinutes}m prep · {dish.calories} cal
          </p>
          <h3
            id="dish-modal-title"
            className="font-display text-xl font-bold text-slate-900 mt-1"
          >
            {dish.name}
          </h3>
          <p className="text-xs font-mono tabular-nums text-slate-600 mt-1">
            Student Price:{' '}
            <strong className="text-slate-900">{formatINR(unitPrice)}</strong>{' '}
            <span className="line-through text-slate-400">
              {formatINR(regularUnitPrice)}
            </span>{' '}
            {lineSavings > 0 && (
              <span className="font-sans text-blue-700 font-medium">
                · Save {formatINR(lineSavings)}
              </span>
            )}
          </p>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          <p className="text-sm text-slate-600 leading-relaxed">{dish.description}</p>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2.5">
              Select Style or Portion
            </label>
            <div className="space-y-2">
              {dish.options.map((opt) => {
                const isSelected = opt.id === activeOption.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedOptionId(opt.id)}
                    className={`w-full px-4 py-3 text-sm rounded-lg border flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-blue-700 bg-blue-50/60 text-slate-900 font-semibold'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className="font-mono tabular-nums text-xs text-slate-600">
                      {opt.priceDelta === 0
                        ? 'Included'
                        : opt.priceDelta > 0
                        ? `+${formatINR(opt.priceDelta)}`
                        : `-${formatINR(Math.abs(opt.priceDelta))}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor="dish-note-input"
              className="block text-sm font-semibold text-slate-900 mb-2"
            >
              Study Spot or Kitchen Note
            </label>
            <input
              id="dish-note-input"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Less spicy, drop at AI Lab 2 corridor"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-700"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-4">
            <div className="inline-flex items-center border border-slate-300 rounded-lg bg-slate-50">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="p-2.5 text-slate-700 hover:text-slate-900 cursor-pointer"
              >
                <Minus className="w-4 h-4" aria-hidden="true" />
              </button>
              <span className="px-3 text-sm font-mono font-semibold text-slate-900 tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                aria-label="Increase quantity"
                className="p-2.5 text-slate-700 hover:text-slate-900 cursor-pointer"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 py-3 px-5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors font-mono tabular-nums cursor-pointer"
            >
              Add to Bag · {formatINR(lineTotal)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
