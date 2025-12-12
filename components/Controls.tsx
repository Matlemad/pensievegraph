'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { GraphMode, AVAILABLE_CATEGORIES, Graph3D } from '@/lib/types';

interface ControlsProps {
  mode: GraphMode;
  onModeChange: (mode: GraphMode) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSelect?: (nodeId: string) => void;
  graph?: Graph3D | null;
}

export default function Controls({
  mode,
  onModeChange,
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  onSearchSelect,
  graph,
}: ControlsProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Memoized suggestions based on search query
  const suggestions = useMemo(() => {
    if (!graph?.nodes || !searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return graph.nodes
        .filter((node) => {
          return (
          node.label.toLowerCase().includes(query) ||
          node.id.toLowerCase().includes(query)
          );
        })
      .slice(0, 10); // Limit to 10 suggestions
  }, [graph?.nodes, searchQuery]);

  // Update dropdown position when input is focused or suggestions change
  useEffect(() => {
    if (inputRef.current && showSuggestions) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [showSuggestions, searchQuery, suggestions.length]);

  // Update suggestions visibility when searchQuery or suggestions change
  useEffect(() => {
    const shouldShow = searchQuery.length > 0 && suggestions.length > 0;
    if (shouldShow) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [searchQuery, suggestions.length]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        searchRef.current &&
        !searchRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showSuggestions]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[highlightedIndex].id);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleSelectSuggestion = (nodeId: string) => {
    const node = graph?.nodes.find((n) => n.id === nodeId);
    if (node) {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
      onSearchChange(node.label);
      // Small delay to ensure state is updated before calling onSearchSelect
      setTimeout(() => {
        onSearchSelect?.(nodeId);
      }, 0);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onSearchChange(value);
    setHighlightedIndex(-1);
  };

  const handleInputFocus = () => {
    if (searchQuery.length > 0 && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className="bg-gray-900/90 backdrop-blur-sm border-b border-gray-800 p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Logo */}
        <div className="flex items-center mr-4">
          <img 
            src="/PensieveGraphLogo.webp" 
            alt="Pensieve Graph" 
            className="h-8 w-auto"
          />
        </div>
        {/* Mode Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs sm:text-sm font-medium text-gray-300 shrink-0">Mode:</label>
          <select
            value={mode}
            onChange={(e) => onModeChange(e.target.value as GraphMode)}
            className="flex-1 sm:flex-none px-2 sm:px-3 py-1.5 bg-gray-800 text-gray-200 rounded text-xs sm:text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:min-w-[200px]"
          >
            <option value="stack_integration">Stack & Integration</option>
            <option value="affiliation">Affiliation</option>
            <option value="funding_received">Funding Received</option>
          </select>
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs sm:text-sm font-medium text-gray-300 shrink-0">Category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="flex-1 sm:flex-none px-2 sm:px-3 py-1.5 bg-gray-800 text-gray-200 rounded text-xs sm:text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:min-w-[200px]"
          >
            <option value="">All Categories</option>
            {AVAILABLE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Search with Autocomplete */}
        <div className="flex items-center gap-2 w-full sm:w-auto" ref={searchRef}>
          <label className="text-xs sm:text-sm font-medium text-gray-300 shrink-0">Search:</label>
          <div className="flex-1 sm:flex-none relative sm:min-w-[200px]">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onKeyDown={handleKeyDown}
              placeholder="Project name..."
              className="w-full px-2 sm:px-3 py-1.5 bg-gray-800 text-gray-200 rounded text-xs sm:text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {/* Autocomplete Suggestions - rendered in portal to avoid overflow issues */}
            {showSuggestions && suggestions.length > 0 && typeof window !== 'undefined' && createPortal(
              <div
                ref={dropdownRef}
                className="fixed z-[9999] bg-gray-800 border border-gray-700 rounded shadow-xl max-h-60 overflow-auto"
                style={{
                  top: `${dropdownPosition.top}px`,
                  left: `${dropdownPosition.left}px`,
                  width: `${dropdownPosition.width}px`,
                }}
              >
                {suggestions.map((node, index) => (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(node.id)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`w-full text-left px-3 py-2 text-xs sm:text-sm text-gray-200 hover:bg-gray-700 transition-colors ${
                      index === highlightedIndex ? 'bg-gray-700' : ''
                    }`}
                  >
                    <div className="font-medium">{node.label}</div>
                    <div className="text-xs text-gray-400">{node.kind}</div>
                  </button>
                ))}
              </div>,
              document.body
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
