export async function fetchText(file) {
  try {
    const response = await fetch(file);
    return await response.text();
  } catch (error) {
    console.error(`Failed to get text from file ${file}:`, error);
  }
}

export function debounce(callback, delay) {
  let timeoutId = null;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      callback(...args);
    }, delay);
  };
}
