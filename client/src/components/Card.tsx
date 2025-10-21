import { useState } from 'react';
import type { Card as CardType } from '@set-game/shared';

interface CardProps {
  card: CardType;
  onToggle: (card: CardType, selected: boolean) => void;
  isSelected: boolean;
}

export function Card({ card, onToggle, isSelected }: CardProps) {
  return (
    <div
      className="cursor-pointer transition-transform hover:scale-105"
      onClick={() => onToggle(card, !isSelected)}
    >
      <div
        className={`rounded-lg overflow-hidden border-4 transition-all ${
          isSelected
            ? 'border-teal-500 shadow-xl shadow-teal-500/50'
            : 'border-slate-700 hover:border-slate-500'
        }`}
      >
        <img
          src={`/img/cards/${card}.png`}
          alt={`Card ${card}`}
          className="w-full select-none"
          draggable="false"
        />
      </div>
    </div>
  );
}
