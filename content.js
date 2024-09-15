chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "convert") {
      try {
        const selectedText = window.getSelection().toString();
        if (!selectedText) {
          throw new Error("No text selected. Please highlight some text and try again.");
        }
        const eventData = parseSelectedText(selectedText);
        const icalData = generateICalData(eventData);
        sendResponse({success: true, icalData: icalData, eventData: eventData});
      } catch (error) {
        console.error('Error processing selection:', error);
        sendResponse({success: false, error: error.message});
      }
    }
    return true; // Indicates that the response is sent asynchronously
  });

// We don't need to import chrono here as it's already included via the content_scripts in manifest.json

function parseSelectedText(text) {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) {
        throw new Error("No valid text selected.");
    }
  
    const fullText = lines.join(' '); // Join with space instead of newline
    const dateTime = extractDateTimeFromContent(fullText);
  
    if (!dateTime) {
        throw new Error("No valid date and time found in the selected text. Please include a clear date and time.");
    }
  
    // Use the first non-empty line as the title
    const title = lines.find(line => line.trim() !== '') || 'Untitled Event';
    
    // Use all lines except the title as the description
    const description = lines.filter(line => line.trim() !== title).join('\n');
  
    return {
        title,
        startDate: dateTime.startDate,
        endDate: dateTime.endDate,
        description
    };
}

function extractDateTimeFromContent(content) {
  const results = chrono.parse(content);

  if (results.length > 0) {
    const startDate = results[0].start.date();
    let endDate;

    if (results[0].end) {
      endDate = results[0].end.date();
    } else if (results.length > 1) {
      endDate = results[1].start.date();
    } else {
      endDate = new Date(startDate.getTime() + 3600000);
    }

    // Return local dates without conversion
    return { startDate, endDate };
  }

  return null;
}

function generateICalData(event) {
  const now = new Date().toISOString().replace(/[-:.]/g, '');
  const startDate = event.startDate.toISOString().replace(/[-:.]/g, '');
  const endDate = event.endDate.toISOString().replace(/[-:.]/g, '');
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Your Company//Your Product//EN
BEGIN:VEVENT
UID:${now}
DTSTAMP:${now}
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${event.title}
DESCRIPTION:${event.description}
END:VEVENT
END:VCALENDAR`;
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
}

function showNotification(title, message) {
    chrome.runtime.sendMessage({
      action: "showNotification",
      title: title,
      message: message
    });
  }