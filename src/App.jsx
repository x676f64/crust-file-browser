import React, { useState, useEffect, useRef, useCallback } from 'react';
import { saveFile, getAllFiles, getSearchHistory, addToHistory } from './services/db';
import { fetchFiles as apiFetchFiles, GATEWAY_URL } from './services/api';
import { getFileInfo, getFileContent } from './services/proxy';
import { Alert } from '@/components/ui/alert';
import { AddressInput } from '@/components/input'
import { AddressHistory } from '@/components/history'
import { FilePreview } from '@/components/preview'
import { DocumentIcon, PhotoIcon, CodeBracketIcon, DocumentTextIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const TIMEOUT = 10000;




const FileCard = ({ file }) => {
  const [contentType, setContentType] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const fetchContentType = async () => {
    try {
      const info = await getFileInfo(file.cid);
      if (info) {
        setContentType(info.contentType);
      }
    } catch (error) {
      console.error('Error fetching content type:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContentType();
  }, [file.cid]);

  const handleClick = () => {
    window.open(`${GATEWAY_URL}/${file.cid}`, '_blank');
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatSize = (sizeInBytes) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = parseInt(sizeInBytes);
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  return (
    <div 
      onClick={handleClick}
      className="bg-stone-800 rounded-lg p-4 shadow-lg hover:bg-stone-700 
                 transition-colors duration-200 cursor-pointer group"
    >
      <FilePreview 
        file={file} 
        contentType={contentType} 
        onRefresh={fetchContentType}
      />
      
      <div className="space-y-1 mt-2">
        <div className="text-stone-200 text-sm truncate font-mono">
          {file.cid}
        </div>
        <div className="flex justify-between text-stone-400 text-xs">
          <span>{formatSize(file.file_size)}</span>
          <span>{file.replicas} replicas</span>
        </div>
        <div className="text-stone-500 text-xs">
          {formatDate(file.block_timestamp)}
        </div>
        {contentType && (
          <div className="text-stone-400 text-xs truncate">
            {contentType}
          </div>
        )}
        {file.memo && (
          <div className="text-stone-400 text-xs truncate">
            {file.memo}
          </div>
        )}
      </div>
    </div>
  );
};


const App = () => {
  const [address, setAddress] = useState(() => {
    return localStorage.getItem('lastAddress') || '';
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
  const observer = useRef();
  const lastFileElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  const fetchPageFiles = async (addr, pageNum) => {
    try {
      const response = await apiFetchFiles(addr, pageNum);
      
      if (pageNum === 0) {
        setTotalCount(response.data.count);
      }
      
      if (!response.data.list) {
        setHasMore(false);
        return [];
      }
      
      // Store files in IndexedDB
      for (const file of response.data.list) {
        await saveFile(file.cid, file);
      }
      
      return response.data.list;
    } catch (error) {
      console.error('Error fetching files:', error);
      setError('Error fetching files. Please try again.');
      return [];
    }
  };

  useEffect(() => {
    if (!address || !hasMore) return;
    
    const loadMore = async () => {
      setLoading(true);
      try {
        const newFiles = await fetchPageFiles(address, page);
        setFiles(prev => [...prev, ...newFiles]);
        setHasMore(newFiles.length > 0);
      } catch (error) {
        console.error('Error loading more files:', error);
        setError('Error loading more files. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadMore();
  }, [address, page]);

  // Load initial address from localStorage
  useEffect(() => {
    const savedAddress = localStorage.getItem('lastAddress');
    if (savedAddress) {
      setAddress(savedAddress);
      setFiles([]);
      setPage(0);
      setHasMore(true);
      setError(null);
      setTotalCount(0);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (address.trim()) {
      localStorage.setItem('lastAddress', address.trim());
      await addToHistory(address.trim());
      setFiles([]);
      setPage(0);
      setHasMore(true);
      setError(null);
      setTotalCount(0);
    }
  };

{/* Update the main App return statement */}

return (
  <div className="min-h-screen bg-stone-900 text-stone-100">
    {/* Sticky header */}
    <div className="fixed top-0 left-0 right-0 z-50 bg-stone-900/95 backdrop-blur-sm border-b border-stone-800 shadow-lg">
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4 text-center">Crust File Browser</h1>
        
        <form onSubmit={handleSubmit} className="mb-2">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <AddressInput
              value={address}
              onChange={setAddress}
              onSubmit={() => handleSubmit({ preventDefault: () => {} })}
              loading={loading && page === 0}
            />
            <button
              type="submit"
              disabled={loading && page === 0}
              className="w-full sm:w-auto px-6 py-2 bg-stone-700 rounded-lg hover:bg-stone-600
                        transition-colors duration-200 disabled:opacity-50 whitespace-nowrap"
            >
              {loading && page === 0 ? 'Loading...' : 'Fetch Files'}
            </button>
          </div>
        </form>

        {totalCount > 0 && (
          <div className="text-sm text-stone-400">
            Found {totalCount.toLocaleString()} files. Showing {files.length.toLocaleString()} so far.
          </div>
        )}

        <div className="flex justify-between items-center text-sm">
          <AddressHistory 
            onSelect={(addr) => {
              setAddress(addr);
              handleSubmit({ preventDefault: () => {} });
            }}
          />
          
        </div>

        {error && (
          <Alert className="mt-4 bg-red-900/20 text-red-400 border border-red-900">
            {error}
          </Alert>
        )}
      </div>
    </div>

    {/* Main content - adjusted to account for fixed header */}
    <div className="pt-48"> {/* Adjust this value based on your header height */}
      {/* Loading indicator */}
      {loading && (
        <div className="fixed bottom-4 right-4 bg-stone-800 rounded-lg p-3 shadow-lg flex items-center gap-3">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-stone-400"></div>
          <span className="text-stone-400 text-sm">Loading more files...</span>
        </div>
      )}

      {/* Grid container - now full width */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {files.map((file, index) => (
            <div
              key={`${file.cid}-${file.block_timestamp}-${index}`}
              ref={index === files.length - 1 ? lastFileElementRef : null}
            >
              <FileCard file={file} />
            </div>
          ))}
        </div>

        {!loading && files.length === 0 && (
          <div className="text-center text-stone-400 mt-8">
            No files found. Enter an address to start browsing.
          </div>
        )}

        {!hasMore && files.length > 0 && (
          <div className="text-center text-stone-400 mt-8">
            All files loaded.
          </div>
        )}
      </div>
    </div>
  </div>
);
};

export default App;