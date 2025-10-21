import type { Card as CardType } from '@set-game/shared';
import { Card } from './Card';

interface GameBoardProps {
  cards: CardType[];
  selectedCards: Set<CardType>;
  onCardToggle: (card: CardType, selected: boolean) => void;
}

export function GameBoard({ cards, selectedCards, onCardToggle }: GameBoardProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {cards.map((card) => (
        <Card
          key={card}
          card={card}
          isSelected={selectedCards.has(card)}
          onToggle={onCardToggle}
        />
      ))}
    </div>
  );
}
