async function getFile(url, callback) {
    try {
        const response = await fetch(url);
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
	callback(await response.text());
    } catch (error) { }
}

let loadScript = (url, callback) => {
    const script = document.createElement('script');
    script.src = url;
    script.type = 'text/javascript';
    script.async = true; // Load asynchronously

    script.onload = () => {
        console.log(`${url} loaded successfully.`);
        if (callback) {
            callback();
        }
    };

    script.onerror = () => {
        console.error(`Error loading script: ${url}`);
    };

    document.head.appendChild(script);
}

