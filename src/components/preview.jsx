import React, { useState, useEffect, useRef, useCallback } from 'react';

const FilePreview = ({ file, contentType, onRefresh }) => {
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
  
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  
    const loadContent = useCallback(async (retry = 0) => {
      setLoading(true);
      setError(null);
  
      try {
        if (!contentType) return;
  
        // For images, try direct loading first
        if (contentType.startsWith('image/')) {
          const img = new Image();
          const imageUrl = `https://gw.crustgw.work/ipfs/${file.cid}`;
          
          const imagePromise = new Promise((resolve, reject) => {
            img.onload = () => resolve(imageUrl);
            img.onerror = () => reject(new Error('Image load failed'));
            img.src = imageUrl;
          });
  
          try {
            const url = await Promise.race([
              imagePromise,
              delay(TIMEOUT).then(() => {
                throw new Error('Image load timeout');
              })
            ]);
            setContent({ type: 'image', data: url });
            setLoading(false);
            return;
          } catch (imageError) {
            console.warn('Direct image load failed, falling back to proxy:', imageError);
          }
        }
  
        // Fallback to proxy approach
        const response = await axios.get(`https://gw.crustgw.work/ipfs/${file.cid}`, {
          responseType: 'arraybuffer',
          timeout: TIMEOUT,
          headers: {
            'Range': 'bytes=0-524288' // Limit to 512KB for preview
          }
        });
  
        if (contentType.startsWith('text/') || 
            contentType.includes('json') ||
            contentType.includes('javascript')) {
          const text = new TextDecoder().decode(response.data);
          setContent({ type: 'text', data: text });
        } else if (contentType.startsWith('image/')) {
          const base64 = btoa(
            new Uint8Array(response.data)
              .reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
          setContent({ type: 'image', data: `data:${contentType};base64,${base64}` });
        }
      } catch (error) {
        console.error('Error loading preview:', error);
        
        // Implement retry logic
        if (retry < MAX_RETRIES) {
          setRetryCount(retry + 1);
          await delay(RETRY_DELAY * (retry + 1)); // Exponential backoff
          return loadContent(retry + 1);
        }
        
        setError(`Failed to load preview (${error.message})`);
      } finally {
        setLoading(false);
      }
    }, [file.cid, contentType]);
  
    useEffect(() => {
      loadContent();
    }, [loadContent]);
  
    const handleRefresh = async (e) => {
      e.stopPropagation();
      setRetryCount(0);
      await loadContent();
      if (onRefresh) onRefresh();
    };
  
    const RefreshButton = () => (
      <button 
        onClick={handleRefresh}
        className="absolute top-2 right-2 p-1 rounded-full bg-stone-800/80 hover:bg-stone-700
                   transition-colors duration-200 group"
        title={retryCount > 0 ? `Retried ${retryCount} times` : 'Refresh preview'}
      >
        <ArrowPathIcon 
          className={`w-4 h-4 text-stone-400 group-hover:text-stone-200 
                      ${loading ? 'animate-spin' : ''}`}
        />
      </button>
    );
  
    if (loading) {
      return (
        <div className="w-full h-40 bg-stone-900 rounded-md flex items-center justify-center relative">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-400"></div>
            {retryCount > 0 && (
              <div className="text-stone-400 text-xs mt-2">
                Retry {retryCount}/{MAX_RETRIES}
              </div>
            )}
          </div>
          <RefreshButton />
        </div>
      );
    }
  
    if (error) {
      return (
        <div className="w-full h-40 bg-stone-900 rounded-md flex flex-col items-center justify-center relative">
          <span className="text-stone-400 text-sm text-center px-4">{error}</span>
          {retryCount > 0 && (
            <span className="text-stone-500 text-xs mt-1">
              Failed after {retryCount} retries
            </span>
          )}
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
        <div className="w-full h-40 bg-stone-900 rounded-md overflow-hidden flex items-center justify-center relative group">
          <img 
            src={content.data} 
            alt="Preview"
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          <RefreshButton />
        </div>
      );
    }
  
    if (content.type === 'text') {
      return (
        <div className="w-full h-40 bg-stone-900 rounded-md p-2 overflow-hidden relative group">
          <pre className="text-stone-400 text-xs font-mono overflow-hidden">
            {content.data.slice(0, 500)}
            {content.data.length > 500 && '...'}
          </pre>
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          <RefreshButton />
        </div>
      );
    }
  
    return null;
  };

  export {FilePreview};