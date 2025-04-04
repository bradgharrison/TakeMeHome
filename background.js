// Function to normalize a URL to its origin + pathname
function normalizeUrl(urlString) {
  try {
    const url = new URL(urlString);
    // Remove trailing slash from pathname if it's not the root '/'
    let pathname = url.pathname;
    if (pathname !== '/' && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
    return url.origin + pathname;
  } catch (e) {
    // console.error(`Error normalizing URL: ${urlString}`, e);
    return null; // Return null if URL is invalid
  }
}

// Function to focus a specific tab and its window
async function focusTab(tab) {
  try {
    await chrome.windows.update(tab.windowId, { focused: true });
    await chrome.tabs.update(tab.id, { active: true });
    // console.log(`Focused tab ${tab.id} in window ${tab.windowId}`);
  } catch (error) {
    // console.error(`Error focusing tab ${tab.id}:`, error);
    // Handle cases where the tab or window might have been closed
    // between querying and updating.
  }
}

// Listen for the command
chrome.commands.onCommand.addListener(async (command) => {
  // console.log(`Command received: ${command}`);
  if (command === 'goToHomepage') {
    // 1. Get the saved homepage URL
    const data = await chrome.storage.sync.get(['homepageUrl']);
    const homepageUrl = data.homepageUrl;

    // 2. If no URL is saved, do nothing
    if (!homepageUrl) {
      // console.log('Homepage URL not set. Doing nothing.');
      return;
    }

    // 3. Normalize the saved URL
    const normalizedSavedUrl = normalizeUrl(homepageUrl);
    if (!normalizedSavedUrl) {
      // console.error('Saved homepage URL is invalid. Cannot proceed.');
      // Maybe notify the user via a badge or other means? For now, just log.
      return;
    }
    // console.log(`Normalized saved URL: ${normalizedSavedUrl}`);

    // 4. Query all tabs across all windows
    let allTabs = [];
    try {
      allTabs = await chrome.tabs.query({});
    } catch (error) {
      // console.error('Error querying tabs:', error);
      return; // Cannot proceed without tabs list
    }

    // 5. Find matching tabs and prioritize current window
    let matchingTabsCurrentWindow = [];
    let matchingTabsOtherWindows = [];
    const currentWindow = await chrome.windows.getCurrent(); // Get current window info

    for (const tab of allTabs) {
      if (tab.url) {
        const normalizedTabUrl = normalizeUrl(tab.url);
        if (normalizedTabUrl === normalizedSavedUrl) {
          if (tab.windowId === currentWindow.id) {
            matchingTabsCurrentWindow.push(tab);
          } else {
            matchingTabsOtherWindows.push(tab);
          }
        }
      }
    }

    // console.log(`Matches in current window: ${matchingTabsCurrentWindow.length}`);
    // console.log(`Matches in other windows: ${matchingTabsOtherWindows.length}`);

    // 6. Focus or Create Tab
    if (matchingTabsCurrentWindow.length > 0) {
      // Prioritize the first match in the current window
      // console.log('Focusing match in current window.');
      await focusTab(matchingTabsCurrentWindow[0]);
    } else if (matchingTabsOtherWindows.length > 0) {
      // Fallback to the first match in other windows
      // console.log('Focusing match in other window.');
      await focusTab(matchingTabsOtherWindows[0]);
    } else {
      // No matches found, create a new tab
      // console.log('No matching tab found. Creating new tab.');
      try {
        await chrome.tabs.create({ url: homepageUrl, active: true });
      } catch (error) {
        // console.error(`Error creating new tab for ${homepageUrl}:`, error);
      }
    }
  }
});

// Optional: Log when the extension is installed or updated
chrome.runtime.onInstalled.addListener(details => {
  // console.log(`TakeMeHome extension ${details.reason}. Version: ${chrome.runtime.getManifest().version}`);
  // Could potentially set a default URL here if desired, but spec says do nothing if unset.
});
