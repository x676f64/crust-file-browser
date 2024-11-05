import React, { useState, useEffect, useRef } from 'react';
import { getSearchHistory } from '../services/db';

const AddressInput = ({ value, onChange, onSubmit, loading }) => {
  const [history, setHistory] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const loadHistory = async () => {
      const addresses = await getSearchHistory();
      setHistory(addresses || []); // Add fallback for empty history
    };
    loadHistory();
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredAddresses = history.filter(addr => 
    addr.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <div ref={wrapperRef} className="relative w-full sm:w-3/4">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        placeholder="Enter Crust Network address"
        className="w-full px-4 py-2 rounded-lg bg-stone-800 border border-stone-700 
                  focus:outline-none focus:border-stone-500"
      />
      
      {showSuggestions && filteredAddresses.length > 0 && (
        <div className="absolute w-full mt-1 bg-stone-800 rounded-lg shadow-lg border border-stone-700 z-50">
          {filteredAddresses.map((addr, index) => (
            <button
              key={index}
              onClick={() => {
                onChange(addr);
                setShowSuggestions(false);
                onSubmit();
              }}
              className="w-full px-4 py-2 text-left text-sm text-stone-300 
                        hover:bg-stone-700 first:rounded-t-lg last:rounded-b-lg
                        truncate"
            >
              {addr}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export { AddressInput };