// DOM Elements
const form = document.getElementById('shortenForm');
const urlInput = document.getElementById('url');
const customCodeInput = document.getElementById('customCode');
const buttonText = document.getElementById('buttonText');
const buttonSpinner = document.getElementById('buttonSpinner');
const resultDiv = document.getElementById('result');
const errorDiv = document.getElementById('error');
const shortUrlInput = document.getElementById('shortUrl');
const originalUrlLink = document.getElementById('originalUrl');
const statsLink = document.getElementById('statsLink');
const copyBtn = document.getElementById('copyBtn');
const loadLinksBtn = document.getElementById('loadLinksBtn');
const recentLinksDiv = document.getElementById('recentLinks');

// Form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Hide previous results/errors
    resultDiv.classList.add('hidden');
    errorDiv.classList.add('hidden');
    
    // Show loading state
    buttonText.textContent = 'Creating...';
    buttonSpinner.classList.remove('hidden');
    
    const url = urlInput.value.trim();
    const customCode = customCodeInput.value.trim();
    
    try {
        const response = await fetch('/api/shorten', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url, customCode }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Show success result
            shortUrlInput.value = data.shortUrl;
            originalUrlLink.href = data.originalUrl;
            originalUrlLink.textContent = data.originalUrl;
            statsLink.href = `/stats.html?code=${data.shortCode}`;
            resultDiv.classList.remove('hidden');
            
            // Clear form
            urlInput.value = '';
            customCodeInput.value = '';
        } else {
            // Show error
            showError(data.error || 'Failed to create shortlink');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Network error. Please try again.');
    } finally {
        // Reset button state
        buttonText.textContent = 'Shorten URL';
        buttonSpinner.classList.add('hidden');
    }
});

// Copy to clipboard
copyBtn.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(shortUrlInput.value);
        
        // Visual feedback
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✅ Copied!';
        copyBtn.style.background = '#059669';
        
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.background = '';
        }, 2000);
    } catch (error) {
        console.error('Failed to copy:', error);
        
        // Fallback: select the text
        shortUrlInput.select();
        document.execCommand('copy');
        
        copyBtn.textContent = '✅ Copied!';
        setTimeout(() => {
            copyBtn.textContent = '📋 Copy';
        }, 2000);
    }
});

// Load recent links
loadLinksBtn.addEventListener('click', async () => {
    loadLinksBtn.textContent = 'Loading...';
    loadLinksBtn.disabled = true;
    
    try {
        const response = await fetch('/api/links');
        const links = await response.json();
        
        if (links.length === 0) {
            recentLinksDiv.innerHTML = '<p style="color: #64748b;">No links created yet.</p>';
        } else {
            recentLinksDiv.innerHTML = links.map(link => `
                <div class="link-item">
                    <div class="link-code">/${link.short_code}</div>
                    <div class="link-original">${escapeHtml(link.original_url)}</div>
                    <div class="link-stats">
                        <span>👆 ${link.clicks} clicks</span>
                        <span>📅 ${formatDate(link.created_at)}</span>
                    </div>
                </div>
            `).join('');
        }
        
        recentLinksDiv.classList.remove('hidden');
    } catch (error) {
        console.error('Error loading links:', error);
        showError('Failed to load recent links');
    } finally {
        loadLinksBtn.textContent = 'Refresh Links';
        loadLinksBtn.disabled = false;
    }
});

// Utility functions
function showError(message) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
}

// Auto-update domain prefix
window.addEventListener('load', () => {
    const domainPrefix = document.querySelector('.domain-prefix');
    if (domainPrefix) {
        domainPrefix.textContent = `${window.location.host}/`;
    }
});
