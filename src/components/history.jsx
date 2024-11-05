import React, { useState, useEffect } from 'react';

const AddressHistory = ({ onSelect }) => {
    const [history, setHistory] = useState([]);
    const [open, setOpen] = useState(false);
  
    useEffect(() => {
      const loadHistory = async () => {
        const addresses = await getSearchHistory();
        setHistory(addresses);
      };
      loadHistory();
    }, []);
  
    if (history.length === 0) return null;
  
    return (
      <div className="relative h-6"> {/* Fixed height container */}
        <button
          onClick={() => setOpen(!open)}
          className="text-stone-400 text-sm hover:text-stone-300 focus:outline-none"
        >
          Recent Addresses
        </button>
        
        {open && (
          <div className="absolute top-6 left-0 mt-1 w-48 
                        bg-stone-800 rounded-lg shadow-lg z-50"> {/* Fixed width, higher z-index */}
            {history.map((addr, index) => (
              <button
                key={index}
                onClick={() => {
                  onSelect(addr);
                  setOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-stone-300 
                          hover:bg-stone-700 first:rounded-t-lg last:rounded-b-lg"
              >
                {addr}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

export { AddressHistory };