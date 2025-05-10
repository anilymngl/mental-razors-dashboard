import React from 'react';
import { stemWord } from '../utils/nlpUtils.js';

// Helper function to generate term variations (e.g., plural forms)
// This is a simplified approach and can be expanded.
const getTermVariations = (term) => {
  const variations = [term];
  const lowerTerm = term.toLowerCase();

  // Try simple plural by adding 's'
  if (!lowerTerm.endsWith('s')) {
    variations.push(term + 's');
  }

  // Try simple plural by adding 'es' for terms ending in 's', 'x', 'z', 'sh', 'ch'
  if (/[sxz]$/.test(lowerTerm) || /(sh|ch)$/.test(lowerTerm)) {
    if (!lowerTerm.endsWith('es')) { // Avoid adding 'es' if it already ends like that
        variations.push(term + 'es');
    }
  }
  
  // Handle common multi-word terms by trying to pluralize the last word
  // This is very basic and might need more sophisticated logic for general cases.
  const words = term.split(' ');
  if (words.length > 1) {
    const lastWord = words[words.length - 1];
    const firstPart = words.slice(0, -1).join(' ');
    
    if (!lastWord.toLowerCase().endsWith('s')) {
      variations.push(`${firstPart} ${lastWord}s`);
    }
    if (/[sxz]$/.test(lastWord.toLowerCase()) || /(sh|ch)$/.test(lastWord.toLowerCase())) {
       if (!lastWord.toLowerCase().endsWith('es')) {
        variations.push(`${firstPart} ${lastWord}es`);
       }
    }
  }

  // Return unique variations to avoid issues if term itself is already plural, etc.
  return Array.from(new Set(variations));
};

// Custom TooltipWrapper component using Tailwind classes
const TooltipWrapper = ({ term, definition, children }) => {
  const triggerStyle = {
    textDecoration: 'underline',
    textDecorationStyle: 'dotted',
    cursor: 'help',
    position: 'relative',
  };

  // Positioning and base styling for the tooltip content
  // Initial visibility and opacity will be handled by Tailwind classes directly on the element
  const tooltipPositioningStyle = {
    width: '200px', 
    textAlign: 'left',
    borderRadius: '0.25rem',
    padding: '0.5rem',
    position: 'absolute',
    zIndex: '50', 
    bottom: '125%', 
    left: '50%',
    marginLeft: '-100px',
    transition: 'opacity 0.3s, visibility 0.3s', // Added visibility to transition
  };

  return (
    <span style={triggerStyle} className="custom-tooltip-trigger text-blue-600 dark:text-blue-400">
      {children}
      <span 
        style={tooltipPositioningStyle} 
        className="custom-tooltip-content invisible opacity-0 bg-gray-800 text-white dark:bg-gray-100 dark:text-gray-900 shadow-lg"
      >
        <strong className="font-semibold mb-1 block">{term}</strong>
        {definition}
      </span>
    </span>
  );
};

export const highlightGlossaryTerms = (text, glossaryData) => {
  if (!text || typeof text !== 'string' || !glossaryData || glossaryData.length === 0) {
    return [text]; // Return as array for consistency
  }

  let parts = [text];

  glossaryData.forEach(glossaryItem => {
    const originalTermDisplay = glossaryItem.term; // Term to display in tooltip
    const definition = glossaryItem.definition;
    
    // Generate variations of the term for matching (e.g., singular, plural)
    const termVariations = getTermVariations(glossaryItem.term);
    
    // Create a regex pattern that matches any of the variations
    const pattern = termVariations
      .map(variation => variation.replace(/[.*+?^${}()|[\\\]\\]/g, '\\$&')) // Escape regex special chars for each variation. CORRECTED escaping for characters like ( ) [ ] etc.
      .join('|'); // Join variations with OR
    
    const regex = new RegExp(`\\b(${pattern})\\b`, 'gi'); // Whole word, case-insensitive

    let newParts = [];
    parts.forEach(part => {
      if (typeof part === 'string') {
        let lastIndex = 0;
        let match;
        while ((match = regex.exec(part)) !== null) {
          if (match.index > lastIndex) {
            newParts.push(part.substring(lastIndex, match.index));
          }
          // match[1] will contain the actual text that was matched (e.g., "cognitive bias" or "cognitive biases")
          // originalTermDisplay is the canonical term from glossaryData (e.g., "Cognitive Bias")
          newParts.push(
            <TooltipWrapper key={`${originalTermDisplay}-${match.index}`} term={originalTermDisplay} definition={definition}>
              {match[1]}
            </TooltipWrapper>
          );
          lastIndex = regex.lastIndex;
        }
        if (lastIndex < part.length) {
          newParts.push(part.substring(lastIndex));
        }
      } else {
        newParts.push(part); // It's already a React component (TooltipWrapper)
      }
    });
    parts = newParts;
  });

  // Filter out any empty strings that might result from splitting
  return parts.filter(part => part !== '' || (typeof part !== 'string'));
};

// New function to highlight search terms within content that may already include TooltipWrappers
export const applySearchHighlight = (contentParts, processedSearchTokens) => {
  if (!processedSearchTokens || processedSearchTokens.length === 0) {
    return contentParts; // No search terms to highlight
  }

  // Import stemWord and stopWords here if they are not globally available
  // For now, assuming stemWord is available (e.g. imported in the calling component or this file)
  // We need stemWord from nlpUtils.js to stem words from the content for comparison
  // For simplicity, this example won't import directly but relies on it being available
  // In a real scenario: import { stemWord } from './nlpUtils'; 

  const highlightTextSegment = (textSegment) => {
    if (typeof textSegment !== 'string' || !textSegment.trim()) {
      return [textSegment];
    }
    const result = [];
    // Regex to split by word boundaries, keeping delimiters (spaces, punctuation)
    const wordsAndDelimiters = textSegment.split(/(\b|\s+|[^\w\s]+)/g).filter(part => part.length > 0);

    wordsAndDelimiters.forEach(wordPart => {
      // Check if the part is likely a word (alphanumeric)
      if (/^[a-zA-Z0-9]+$/.test(wordPart)) {
        const stemmedWord = stemWord(wordPart.toLowerCase()); // Assuming stemWord is in scope
        if (processedSearchTokens.includes(stemmedWord)) {
          result.push(<mark key={Math.random()} className="bg-yellow-200 dark:bg-yellow-600/70 px-0.5 rounded">{wordPart}</mark>);
        } else {
          result.push(wordPart);
        }
      } else {
        // It's a delimiter (space, punctuation), push as is
        result.push(wordPart);
      }
    });
    return result;
  };

  const newContentParts = [];
  contentParts.forEach((part, index) => {
    if (typeof part === 'string') {
      newContentParts.push(...highlightTextSegment(part));
    } else if (React.isValidElement(part) && part.type === TooltipWrapper) {
      // It's our TooltipWrapper, highlight its children (which should be a string)
      const originalChildren = part.props.children;
      const highlightedChildren = highlightTextSegment(originalChildren);
      
      // Clone the TooltipWrapper with new, highlighted children
      // Need to ensure unique key for the new element if map is used later
      newContentParts.push(React.cloneElement(part, { key: `tooltip-${index}-highlighted`, children: highlightedChildren }));
    } else {
      newContentParts.push(part); // It's some other React element or non-string, pass through
    }
  });

  return newContentParts;
}; 