// Text to iCal - Modern Popup Script (2025)

let icalData = null;
let eventData = null;

// DOM Elements
const convertBtn = document.getElementById('convert');
const downloadBtn = document.getElementById('download');
const messageEl = document.getElementById('message');
const previewEl = document.getElementById('preview');

// Convert button handler
convertBtn.addEventListener('click', async () => {
  // Add loading state
  convertBtn.classList.add('loading');
  convertBtn.disabled = true;
  hideMessage();

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tabs[0].id, { action: "convert" });

    if (!response || !response.success) {
      showMessage(response?.error || "An unknown error occurred.", 'error');
    } else {
      icalData = response.icalData;
      eventData = response.eventData;
      showMessage("Event converted successfully!", 'success');
      populatePreview(eventData);
      previewEl.style.display = 'block';
    }
  } catch (error) {
    if (error.message?.includes('Could not establish connection')) {
      showMessage("Unable to connect to the page. Try refreshing the page and clicking the button again.", 'error');
    } else {
      showMessage(`Error: ${error.message}`, 'error');
    }
  } finally {
    // Remove loading state
    convertBtn.classList.remove('loading');
    convertBtn.disabled = false;
  }
});

// Download button handler
downloadBtn.addEventListener('click', () => {
  if (!eventData) return;

  // Add loading state
  downloadBtn.classList.add('loading');
  downloadBtn.disabled = true;

  setTimeout(() => {
    const updatedEventData = {
      title: document.getElementById('title').value,
      startDate: new Date(document.getElementById('startDate').value),
      endDate: new Date(document.getElementById('endDate').value),
      description: document.getElementById('description').value
    };

    const updatedIcalData = generateICalData(updatedEventData);
    downloadICalFile(updatedIcalData);

    showMessage("iCal file downloaded!", 'success');
    downloadBtn.classList.remove('loading');
    downloadBtn.disabled = false;
  }, 300); // Small delay for better UX
});

// Populate preview with event data
function populatePreview(data) {
  document.getElementById('title').value = data.title;
  document.getElementById('startDate').value = formatDateForInput(new Date(data.startDate));
  document.getElementById('endDate').value = formatDateForInput(new Date(data.endDate));
  document.getElementById('description').value = data.description || '';
}

// Format date for datetime-local input
function formatDateForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Generate iCal data
function generateICalData(event) {
  const now = formatDateForICal(new Date());

  // Convert local dates to UTC for iCal
  const startDateUTC = new Date(event.startDate.toUTCString());
  const endDateUTC = new Date(event.endDate.toUTCString());

  const startDate = formatDateForICal(startDateUTC);
  const endDate = formatDateForICal(endDateUTC);

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Text to iCal//Chrome Extension//EN
BEGIN:VEVENT
UID:${now}
DTSTAMP:${now}
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${escapeText(event.title)}
DESCRIPTION:${escapeText(event.description)}
END:VEVENT
END:VCALENDAR`;
}

// Format date for iCal format
function formatDateForICal(date) {
  return date.toISOString().replace(/[-:]/g, '').slice(0, -5) + 'Z';
}

// Escape special characters for iCal
function escapeText(text) {
  if (!text) return '';
  return text
    .replace(/[,;\\]/g, match => '\\' + match)
    .replace(/\n/g, '\\n');
}

// Download iCal file
function downloadICalFile(icalData) {
  const blob = new Blob([icalData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'event.ics';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Show message with animation
function showMessage(text, type = 'success') {
  messageEl.textContent = text;
  messageEl.className = type;
  messageEl.style.display = 'block';

  // Auto-hide success messages after 5 seconds
  if (type === 'success') {
    setTimeout(() => {
      hideMessage();
    }, 5000);
  }
}

// Hide message
function hideMessage() {
  messageEl.style.display = 'none';
  messageEl.textContent = '';
  messageEl.className = '';
}

// Input validation and real-time feedback
const titleInput = document.getElementById('title');
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');

// Validate that end date is after start date
function validateDates() {
  const start = new Date(startDateInput.value);
  const end = new Date(endDateInput.value);

  if (start && end && end < start) {
    endDateInput.setCustomValidity('End date must be after start date');
  } else {
    endDateInput.setCustomValidity('');
  }
}

startDateInput.addEventListener('change', validateDates);
endDateInput.addEventListener('change', validateDates);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + Enter to download
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && previewEl.style.display !== 'none') {
    downloadBtn.click();
  }
  // Esc to close preview
  if (e.key === 'Escape' && previewEl.style.display !== 'none') {
    previewEl.style.display = 'none';
    hideMessage();
  }
});
