async function fetchWikipediaArticle(title, callback) {
   const url = new URL('https://en.wikipedia.org/w/api.php');
   url.searchParams.set('action', 'query');
   url.searchParams.set('format', 'json');
   url.searchParams.set('prop', 'extracts');
   url.searchParams.set('exintro', true); // Get only the introduction
   url.searchParams.set('explaintext', true); // Get plain text
   url.searchParams.set('titles', title);
   url.searchParams.set('origin', '*'); // Bypass CORS issues
   try {
      const response = await fetch(url.toString());
      if (! response.ok)
         throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      const pages = data.query.pages;
      const pageId = Object.keys(pages)[0];
      callback(pages[pageId].extract);
   } catch (error) { callback(null); }
}
