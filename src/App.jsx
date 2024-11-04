import React, { useState, useEffect, useRef, useCallback } from 'react';
import { saveFile, getAllFiles, getSearchHistory, addToHistory } from './services/db';
import { fetchFiles as apiFetchFiles, GATEWAY_URL } from './services/api';
import { getFileInfo, getFileContent } from './services/proxy';
import { Alert } from '@/components/ui/alert';
import { DocumentIcon, PhotoIcon, CodeBracketIcon, DocumentTextIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const FilePreview = ({ file, contentType, onRefresh }) => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const loadContent = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!contentType) return;
      
      const response = await getFileContent(file.cid);
      if (response) {
        // For text content, convert ArrayBuffer to text
        if (contentType.startsWith('text/') || 
            contentType.includes('json') ||
            contentType.includes('javascript')) {
          const text = new TextDecoder().decode(response.data);
          setContent({ type: 'text', data: text });
        }
        // For images, convert to base64
        else if (contentType.startsWith('image/')) {
          const base64 = btoa(
            new Uint8Array(response.data)
              .reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
          setContent({ type: 'image', data: `data:${contentType};base64,${base64}` });
        }
      }
    } catch (error) {
      console.error('Error loading preview:', error);
      setError('Failed to load preview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, [file.cid, contentType]);

  const handleRefresh = (e) => {
    e.stopPropagation(); // Prevent card click
    loadContent();
    if (onRefresh) onRefresh();
  };

  if (loading) {
    return (
      <div className="w-full h-40 bg-stone-900 rounded-md flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-400"></div>
      </div>
    );
  }

  const RefreshButton = () => (
    <button 
      onClick={handleRefresh}
      className="absolute top-2 right-2 p-1 rounded-full bg-stone-800/80 hover:bg-stone-700
                 transition-colors duration-200 group"
    >
      <ArrowPathIcon className="w-4 h-4 text-stone-400 group-hover:text-stone-200" />
    </button>
  );

  if (error) {
    return (
      <div className="w-full h-40 bg-stone-900 rounded-md flex items-center justify-center relative">
        <span className="text-stone-400 text-sm">{error}</span>
        <RefreshButton />
      </div>
    );
  }

  if (!content) {
    const IconComponent = contentType?.startsWith('image/') ? PhotoIcon :
                         contentType?.startsWith('text/') ? DocumentTextIcon :
                         contentType?.includes('json') || contentType?.includes('javascript') ? CodeBracketIcon :
                         DocumentIcon;

    return (
      <div className="w-full h-40 bg-stone-900 rounded-md flex flex-col items-center justify-center relative">
        <IconComponent className="w-12 h-12 text-stone-400 mb-2" />
        <span className="text-stone-400 text-xs">{contentType || 'Unknown type'}</span>
        <RefreshButton />
      </div>
    );
  }

  if (content.type === 'image') {
    return (
      <div className="w-full h-40 bg-stone-900 rounded-md overflow-hidden flex items-center justify-center relative">
        <img 
          src={content.data} 
          alt="Preview"
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <RefreshButton />
      </div>
    );
  }

  if (content.type === 'text') {
    return (
      <div className="w-full h-40 bg-stone-900 rounded-md p-2 overflow-hidden relative">
        <pre className="text-stone-400 text-xs font-mono overflow-hidden">
          {content.data.slice(0, 500)}
          {content.data.length > 500 && '...'}
        </pre>
        <RefreshButton />
      </div>
    );
  }

  return null;
};

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
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-stone-400 text-sm hover:text-stone-300 focus:outline-none"
      >
        Recent Addresses
      </button>
      
      {open && (
        <div className="absolute top-full left-0 mt-1 w-full max-h-48 overflow-y-auto 
                      bg-stone-800 rounded-lg shadow-lg z-10">
          {history.map((addr, index) => (
            <button
              key={index}
              onClick={() => {
                onSelect(addr);
                setOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-stone-300 hover:bg-stone-700
                         truncate block"
            >
              {addr}
            </button>
          ))}
        </div>
      )}
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

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Crust File Browser</h1>
        
        <form onSubmit={handleSubmit} className="mb-2">
          <div className="flex gap-4">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter Crust Network address"
              className="flex-1 px-4 py-2 rounded-lg bg-stone-800 border border-stone-700 
                         focus:outline-none focus:border-stone-500"
            />
            <button
              type="submit"
              disabled={loading && page === 0}
              className="px-6 py-2 bg-stone-700 rounded-lg hover:bg-stone-600 
                       transition-colors duration-200 disabled:opacity-50"
            >
              {loading && page === 0 ? 'Loading...' : 'Fetch Files'}
            </button>
          </div>
        </form>

        <AddressHistory 
          onSelect={(addr) => {
            setAddress(addr);
            handleSubmit({ preventDefault: () => {} });
          }} 
        />

        {error && (
          <Alert className="mb-4 bg-red-900/20 text-red-400 border border-red-900">
            {error}
          </Alert>
        )}

        {totalCount > 0 && (
          <div className="text-stone-400 mb-4">
            Found {totalCount.toLocaleString()} files. Showing {files.length.toLocaleString()} so far.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {files.map((file, index) => (
            <div
              key={file.cid}
              ref={index === files.length - 1 ? lastFileElementRef : null}
            >
              <FileCard file={file} />
            </div>
          ))}
        </div>

        {loading && (
          <div className="text-center mt-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-400 mx-auto"></div>
          </div>
        )}

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
  );
};

export default App;