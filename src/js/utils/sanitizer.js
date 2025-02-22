// HTML Sanitization Utility
function sanitizeHTML(html) {
    // Create a temporary container
    const container = document.createElement('div');

    // Set the HTML content
    container.innerHTML = html;

    // List of allowed tags
    const allowedTags = [
        'b', 'strong',
        'i', 'em',
        'u',
        's', 'strike',
        'a',
        'code',
        'ul', 'ol', 'li',
        'p',
        'br'
    ];

    // List of allowed attributes
    const allowedAttributes = {
        'a': ['href', 'target', 'rel']  // Allow target and rel attributes for links
    };

    // Function to clean a node
    function cleanNode(node) {
        if (node.nodeType === 3) { // Text node
            return;
        }

        if (node.nodeType === 1) { // Element node
            // Remove node if it's not in allowed tags
            if (!allowedTags.includes(node.tagName.toLowerCase())) {
                while (node.firstChild) {
                    node.parentNode.insertBefore(node.firstChild, node);
                }
                node.parentNode.removeChild(node);
                return;
            }

            // Special handling for links
            if (node.tagName.toLowerCase() === 'a') {
                node.setAttribute('target', '_blank');
                node.setAttribute('rel', 'noopener noreferrer');
            }

            // Remove all attributes except those that are allowed
            const attributes = Array.from(node.attributes);
            attributes.forEach(attr => {
                const tagName = node.tagName.toLowerCase();
                const allowedAttrsForTag = allowedAttributes[tagName] || [];
                if (!allowedAttrsForTag.includes(attr.name)) {
                    node.removeAttribute(attr.name);
                }
            });

            // Clean all child nodes
            Array.from(node.childNodes).forEach(cleanNode);
        }
    }

    // Clean the container
    Array.from(container.childNodes).forEach(cleanNode);

    return container.innerHTML;
}

// Make sanitizeHTML available globally
window.sanitizeHTML = sanitizeHTML; 