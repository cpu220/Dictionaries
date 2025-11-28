import { Card } from '../database/types';

export interface AnswerResult {
  card: Card;
  nextDue: number;
}

export class Scheduler {
  // Ratings: 1=Again, 2=Hard, 3=Good, 4=Easy
  
  answerCard(card: Card, rating: number): Card {
    const now = Date.now();
    const dayMillis = 24 * 60 * 60 * 1000;
    
    // Clone card to avoid mutation side effects before saving
    const nextCard = { ...card };
    nextCard.reps += 1;

    if (rating === 1) {
      nextCard.lapses += 1;
    }

    // New Card Logic
    if (nextCard.queue === 0) {
      nextCard.type = 1; // Learning
      nextCard.queue = 1;
      
      if (rating === 1) {
        // Again: 1min step
        nextCard.due = now + 60 * 1000;
        nextCard.interval = 0;
      } else if (rating === 2) {
        // Hard: 6min step
        nextCard.due = now + 6 * 60 * 1000;
        nextCard.interval = 0;
      } else if (rating === 3) {
        // Good: 10min step
        nextCard.due = now + 10 * 60 * 1000;
        nextCard.interval = 0;
      } else if (rating === 4) {
        // Easy: Graduate to Review (4 days)
        nextCard.type = 2;
        nextCard.queue = 2;
        nextCard.interval = 4;
        nextCard.due = now + 4 * dayMillis;
      }
      return nextCard;
    }

    // Learning Card Logic (Simplified)
    if (nextCard.queue === 1) {
      if (rating === 1) {
        // Reset to first step
        nextCard.due = now + 60 * 1000;
      } else if (rating >= 3) {
        // Graduate
        nextCard.type = 2;
        nextCard.queue = 2;
        nextCard.interval = 1;
        nextCard.due = now + dayMillis;
      } else {
        // Repeat step
        nextCard.due = now + 10 * 60 * 1000;
      }
      return nextCard;
    }

    // Review Card Logic (SM-2)
    if (nextCard.queue === 2) {
      if (rating === 1) {
        // Lapse
        nextCard.queue = 3; // Relearning (simplified to just reset interval for now)
        nextCard.interval = 1;
        nextCard.factor = Math.max(1300, nextCard.factor - 200);
        nextCard.due = now + dayMillis;
      } else {
        // Success
        let ease = 0;
        if (rating === 2) ease = -150;
        else if (rating === 3) ease = 0;
        else if (rating === 4) ease = 150;

        nextCard.factor = Math.max(1300, nextCard.factor + ease);
        
        // Interval calculation
        if (nextCard.interval === 0) nextCard.interval = 1;
        else if (nextCard.interval === 1) nextCard.interval = 6; // Anki default jump
        else {
          let modifier = 1;
          if (rating === 2) modifier = 1.2;
          else if (rating === 3) modifier = nextCard.factor / 1000;
          else if (rating === 4) modifier = (nextCard.factor / 1000) * 1.3;
          
          nextCard.interval = Math.ceil(nextCard.interval * modifier);
        }
        
        nextCard.due = now + nextCard.interval * dayMillis;
      }
      return nextCard;
    }

    return nextCard;
  }
}
