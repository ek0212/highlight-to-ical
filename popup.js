let icalData = null;
let eventData = null;

document.getElementById('convert').addEventListener('click', () => {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {action: "convert"}, (response) => {
      if (chrome.runtime.lastError) {
        showMessage("Error: Unable to communicate with the page. Try refreshing the page and clicking the button again.", true);
      } else if (!response || !response.success) {
        showMessage("Error: " + (response ? response.error : "Unknown error occurred."), true);
      } else {
        icalData = response.icalData;
        eventData = response.eventData;
        showMessage("Conversion successful!", false);
        populatePreview(eventData);
        document.getElementById('preview').style.display = 'block';
      }
    });
  });
});

document.getElementById('download').addEventListener('click', () => {
  if (eventData) {
    const updatedEventData = {
      title: document.getElementById('title').value,
      startDate: new Date(document.getElementById('startDate').value),
      endDate: new Date(document.getElementById('endDate').value),
      description: document.getElementById('description').value
    };
    const updatedIcalData = generateICalData(updatedEventData);
    downloadICalFile(updatedIcalData);
  }
});

function showMessage(message, isError) {
  const messageElement = document.getElementById('message');
  messageElement.textContent = message;
  messageElement.className = isError ? 'error' : 'success';
}

function populatePreview(data) {
  document.getElementById('title').value = data.title;
  document.getElementById('startDate').value = formatDateForInput(new Date(data.startDate));
  document.getElementById('endDate').value = formatDateForInput(new Date(data.endDate));
  document.getElementById('description').value = data.description;
}

function formatDateForInput(date) {
  return date.toLocaleString('sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(' ', 'T');
}

function generateICalData(event) {
  const now = formatDateForICal(new Date());
  
  // Convert local dates to UTC for iCal
  const startDateUTC = new Date(event.startDate.toUTCString());
  const endDateUTC = new Date(event.endDate.toUTCString());
  
  const startDate = formatDateForICal(startDateUTC);
  const endDate = formatDateForICal(endDateUTC);
  
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Your Company//Your Product//EN
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

function formatDateForICal(date) {
  return date.toISOString().replace(/[-:]/g, '').slice(0, -5) + 'Z';
}

function escapeText(text) {
  return text.replace(/[,;\\]/g, match => '\\' + match)
             .replace(/\n/g, '\\n');
}

function downloadICalFile(icalData) {
  const blob = new Blob([icalData], {type: 'text/calendar;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'event.ics';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}