import React from 'react';
import { glossaryData } from '../glossaryData'; // Assuming glossaryData.js is in src/

const GlossaryPage = () => {
  return (
    <div className="p-4 md:p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800 dark:text-gray-200">Glossary of Terms</h1>
      <div className="space-y-8">
        {glossaryData.map((item, index) => (
          <div key={index} className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <h2 className="text-2xl font-semibold mb-2 text-blue-600 dark:text-blue-400">{item.term}</h2>
            <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300">{item.definition}</p>
          </div>
        ))}
      </div>
      {glossaryData.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400 mt-8">The glossary is currently empty. Terms will be added soon!</p>
      )}
    </div>
  );
};

export default GlossaryPage; 