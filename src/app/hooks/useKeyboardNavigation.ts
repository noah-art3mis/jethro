import { useEffect } from 'react';
import { TextSegment } from '../utils/textManager';

// Define Suggestion interface directly in the hook file
// Ideally, this would be in a shared types.ts file
export interface Suggestion {
    original: string;
    rewritten: string;
    lineStart: number;
    lineEnd: number;
}

interface UseKeyboardNavigationProps {
  isActive: boolean;
  suggestions: Suggestion[];
  selectedSuggestion: number;
  setSelectedSuggestion: React.Dispatch<React.SetStateAction<number>>;
  acceptSuggestion: (suggestion: Suggestion) => void;
  cursorPosition: number;
  setCursorPosition: React.Dispatch<React.SetStateAction<number>>;
  segments: TextSegment[];
  onSegmentSelect: (segmentId: string, text: string) => void;
}

export function useKeyboardNavigation({
  isActive,
  suggestions,
  selectedSuggestion,
  setSelectedSuggestion,
  acceptSuggestion,
  cursorPosition,
  setCursorPosition,
  segments,
  onSegmentSelect,
}: UseKeyboardNavigationProps) {
  useEffect(() => {
    if (!isActive || !segments) { // Added !segments check for robustness
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ensure segments is not empty and cursorPosition is valid before accessing segments[cursorPosition]
      const currentSegment = segments.length > 0 && cursorPosition >= 0 && cursorPosition < segments.length
                             ? segments[cursorPosition]
                             : null;

      if (isActive && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { // Check isActive for edit mode actions
        if (currentSegment) {
          e.preventDefault();
          const aiSuggestion = `AI suggestion for: "${currentSegment.working.substring(0, 50)}..."`;
          const newText = e.key === 'ArrowLeft' ? currentSegment.original : aiSuggestion;
          onSegmentSelect(currentSegment.id, newText);
          // Only move to next segment on ArrowRight if not at the end
          if (e.key === 'ArrowRight' && cursorPosition < segments.length - 1) {
             setCursorPosition(prev => prev + 1);
          }
          // ArrowLeft does not change cursor position here, it just selects original
        }
      } else if (isActive && e.key === 'ArrowUp') { // Check isActive for edit mode actions
        e.preventDefault();
        if (cursorPosition > 0) {
          setCursorPosition(prev => prev - 1);
        }
      } else if (isActive && e.key === 'ArrowDown') { // Check isActive for edit mode actions
        e.preventDefault();
        if (cursorPosition < segments.length - 1) {
          setCursorPosition(prev => prev + 1);
        }
      } else if (e.key === 'Tab' && suggestions && suggestions.length > 0) { // Check suggestions exists
        e.preventDefault();
        setSelectedSuggestion(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'Enter' && selectedSuggestion !== -1 && suggestions && suggestions[selectedSuggestion]) { // Check suggestions exists
        e.preventDefault();
        acceptSuggestion(suggestions[selectedSuggestion]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isActive,
    suggestions,
    selectedSuggestion,
    setSelectedSuggestion,
    acceptSuggestion,
    cursorPosition,
    setCursorPosition,
    segments,
    onSegmentSelect,
  ]);
}
