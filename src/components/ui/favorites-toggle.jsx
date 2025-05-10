import React from 'react';
import { Star } from 'lucide-react';

const FavoritesToggle = ({ showOnlyFavorites, setShowOnlyFavorites }) => {
  return (
    <div className="flex items-center gap-2 dark:text-white">
      <input
        type="checkbox"
        id="favorites-toggle"
        checked={showOnlyFavorites}
        onChange={() => setShowOnlyFavorites(!showOnlyFavorites)}
        className="h-4 w-4"
      />
      <label htmlFor="favorites-toggle" className="flex items-center gap-1">
        <Star className="h-4 w-4 text-yellow-400" />
        Show only favorites
      </label>
    </div>
  );
};

export default FavoritesToggle; 