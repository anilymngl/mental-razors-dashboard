import stem from 'wink-porter2-stemmer';

// A basic list of English stop words
// This list can be expanded. tiny-tfidf also has its own default list.
export const stopWords = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
  'any', 'are', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below',
  'between', 'both', 'but', 'by', 'can', 'did', 'do', 'does', 'doing', 'don',
  'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'has', 'have',
  'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how',
  'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more',
  'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'o', 'of', 'off', 'on',
  'once', 'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  's', 'same', 'she', 'should', 'so', 'some', 'such', 't', 'than', 'that', 'the',
  'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this',
  'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we',
  'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'will',
  'with', 'you', 'your', 'yours', 'yourself', 'yourselves'
]);

export const stemWord = stem;

export const preprocessText = (text) => {
  if (!text || typeof text !== 'string') {
    return '';
  }
  // Simple regex tokenizer: extract words (sequences of alphanumeric characters)
  const tokens = text.toLowerCase().match(/\b[a-z0-9]+\b/g) || []; 
  const filteredTokens = tokens.filter(token => !stopWords.has(token));
  // Stemming with wink-porter2-stemmer
  const stemmedTokens = filteredTokens.map(token => stemWord(token));
  return stemmedTokens.join(' ');
};

// New function to get processed search tokens (stemmed, non-stopwords)
export const getProcessedSearchTokens = (query) => {
  if (!query || typeof query !== 'string') {
    return [];
  }
  const tokens = query.toLowerCase().match(/\b[a-z0-9]+\b/g) || [];
  const filteredTokens = tokens.filter(token => !stopWords.has(token));
  return filteredTokens.map(token => stemWord(token));
}; 