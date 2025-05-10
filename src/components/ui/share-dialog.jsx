import React, { useState } from 'react';
import { Copy, Share2, Check, X } from 'lucide-react';

const ShareDialog = ({ isOpen, onClose, razor }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !razor) return null;

  const shareText = `Mental Razor: ${razor.title}\n\n"${razor.principle}"\n\nLearn more about mental models at: https://mentalrazors.yourwebsite.com`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(`"${razor.principle}"\n\n`);
    const url = encodeURIComponent('https://mentalrazors.yourwebsite.com');
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="h-5 w-5" />
        </button>
        
        <h3 className="text-xl font-medium mb-4 dark:text-white flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Share this Mental Razor
        </h3>
        
        <div className="mb-4">
          <div className="font-medium mb-1 dark:text-gray-300">Title</div>
          <div className="text-lg dark:text-white">{razor.title}</div>
        </div>
        
        <div className="mb-4">
          <div className="font-medium mb-1 dark:text-gray-300">Principle</div>
          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded dark:text-white italic">
            "{razor.principle}"
          </div>
        </div>
        
        <div className="flex flex-col gap-4 mt-6">
          <button
            onClick={copyToClipboard}
            className="flex items-center justify-center gap-2 w-full py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-500" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy to clipboard
              </>
            )}
          </button>
          
          <button
            onClick={shareToTwitter}
            className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
            Share on Twitter
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareDialog; 