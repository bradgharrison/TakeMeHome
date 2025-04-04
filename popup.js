// Get references to the DOM elements
const homepageInput = document.getElementById('homepage');
const saveButton = document.getElementById('save');
const statusDiv = document.getElementById('status');

// Function to display status messages
function showStatus(message, isError = false, duration = 2000) {
  statusDiv.textContent = message;
  statusDiv.className = isError ? 'visible error' : 'visible'; // Use existing CSS classes
  setTimeout(() => {
    statusDiv.className = ''; // Hide after duration
  }, duration);
}

// Load the saved homepage URL when the popup opens
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(['homepageUrl'], (result) => {
    if (chrome.runtime.lastError) {
      // console.error('Error loading homepage URL:', chrome.runtime.lastError);
      showStatus('Error loading URL', true);
    } else if (result.homepageUrl) {
      homepageInput.value = result.homepageUrl;
    }
  });
});

// Save the homepage URL when the save button is clicked
saveButton.addEventListener('click', () => {
  let url = homepageInput.value.trim();

  if (!url) {
    // Optionally clear storage if the input is empty, or just show a message
    // For now, just show a message and don't save an empty string
    // To clear: chrome.storage.sync.remove('homepageUrl', () => {...});
    showStatus('Please enter a URL.', true);
    return;
  }

  // Prepend https:// if no protocol is present
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
    // Update input field visually as well
    homepageInput.value = url;
  }

  // Save the URL to chrome.storage.sync
  chrome.storage.sync.set({ homepageUrl: url }, () => {
    if (chrome.runtime.lastError) {
      // console.error('Error saving homepage URL:', chrome.runtime.lastError);
      showStatus('Error saving!', true);
    } else {
      // console.log('Homepage URL saved:', url);
      showStatus('Saved!');
    }
  });
});
