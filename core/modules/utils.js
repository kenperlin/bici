export async function fetchText(file) {
  try {
    const response = await fetch(file);
    return await response.text();
  } catch (error) {
    console.error(`Failed to get text from file ${file}:`, error);
  }
}
