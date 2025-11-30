function onFormSubmit(){
  const activeForm = FormApp.getActiveForm();
  const spreadSheet = SpreadsheetApp.openByUrl('enter your google from url here');
  const sheet = spreadSheet.getSheetByName("Robotics Schedule");
  const lastResponse = activeForm.getResponses().slice(-1)[0];
  //must create an immutable sheet
  //instead of determing the week, just put week ending ...
  
  //test if there is nothing in the sheet
  if(sheet.getLastRow() == 1){
    createScheduleTemplate(sheet, 0);
    let formResponses = activeForm.getResponses();
    for (let response of formResponses){
      let timeStamp = response.getTimestamp().toString();
      const itemResponses = response.getItemResponses();
      const title = itemResponses[0].getResponse();
      const day = itemResponses[1].getResponse();
      const time = itemResponses[2].getResponse();
      let dayCol = determineDayColumn(day, sheet);
      let timeRow = determineTimeSlotRow(time, sheet);
      enterValue(timeRow, dayCol, sheet, title);
    }
  }
  let timeStamp = new Date(lastResponse.getTimestamp().toString());
  const date = Utilities.formatDate(timeStamp, Session.getScriptTimeZone(), "MMMM dd YYYY");
  Logger.log(date);
  let title = lastResponse.getItemResponses()[0].getResponse();
  let day = lastResponse.getItemResponses()[1].getResponse();
  let time = lastResponse.getItemResponses()[2].getResponse();
  let dayCol = determineDayColumn(day, sheet);
  let timeRow = determineTimeSlotRow(time, sheet);
  let IS_SLOT_FREE = isSlotFree(timeRow, dayCol, sheet);
  if(IS_SLOT_FREE){
    enterValue(timeRow, dayCol, sheet, title);
    createEmail();
    createCalendarEvent(title, date, time);
  }else{
    //bad news email telling recipient that that time can not be accomodated
    createEmail();
  }
}

function createCalendarEvent(ageGroup, date, time){
  const calendar = CalendarApp.getDefaultCalendar();
  const start = new Date(date + " " + time); 
  const end = new Date(date + " " + time); 
  // Add 1 hours directly to the date object
  end.setHours(end.getHours() + 1);

  let event  = calendar.createEvent(
    ageGroup+' robotics', 
    start,
    end
  )
  Logger.log('Event created: '+event.getTitle());
}

function createScheduleTemplate(ss, week){
  const startRow = ss.getLastRow();
  const startCol = 1;
  
  // Define schedule parameters
  const dayHeader = ['Day','Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const startHour = 9;
  const endHour = 14;
  const weekLabel = 'Week ending: '; 
  const numRows = (endHour - startHour + 1) + 2; // extra 2 for header rows: days, and week
  const numCols = Number(dayHeader.length);
  
  // Set up header row (days of the week)
  if(startRow == 1){
    const headerRange = ss.getRange(startRow+1, startCol, 1, numCols);
    headerRange.setValues([dayHeader]);
    headerRange.setBackground('#4A86E8');
    headerRange.setFontColor('white');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
  }
   
  // Set up week label row (merged across all columns)
  const weekLabelRange = ss.getRange(startRow + 1, startCol, 1, numCols);
  weekLabelRange.merge();
  weekLabelRange.setValue(weekLabel);
  weekLabelRange.setBackground('#4A86E8');
  weekLabelRange.setFontWeight('bold');
  weekLabelRange.setHorizontalAlignment('center');
  
  // Create time slots
  let currentRow = startRow + 2;
  for (let hour = startHour; hour <= endHour; hour++) {
    const timeString = hour + ':00';
    ss.getRange(currentRow, startCol).setValue(timeString);
    currentRow++;
  }
 
  // Apply borders to the entire schedule
  const scheduleRange = ss.getRange(startRow, startCol, numRows, numCols);
  scheduleRange.setBorder(true, true, true, true, true, true);
   
  // Set up the tour tab
  let tourRange = ss.getRange(startRow+2, 5, numRows-2, 1);
  tourRange.merge();
  tourRange.setValue("TOUR");
  tourRange.setHorizontalAlignment("center");
  tourRange.setVerticalAlignment("middle");
}

function createEmail(){
  MailApp.sendEmail(
    "enter an email here", 
    "Lesson plan Scheduled!", 
    "Hello, this is the email body. Your lesson plan was succesffuly scheduled for xxx");
}

function createWhatsappMessage(){
}

//logic is that once i have the day/column i can then get the row based on where the 
//last column overall is, in addition to using the time slot value
//with this i can hopefully eliminate determineWeek
function determineDayColumn(day, ss){
  const range = ss.getRange(1, 1, 1, 6).getDisplayValues().flat();
  const dayResolved = range.find(item => item.startsWith(day));
  const dayColumn = range.indexOf(dayResolved) + 1;
  return dayColumn;
}

function determineTimeSlotRow(time, ss){
  //to determine time slot row, since there can be many 9:00s for example
  //you have to determine where the last row is and base it off of that
  //thus you can search for '9:00' within a given range, where the range is based
  //on the lastRowColumn
  let lastRow = ss.getLastRow();
  let startRow = lastRow-5;
  const range = ss.getRange(startRow, 1, 5, 1).getDisplayValues().flat();
  const foundRow = (range.indexOf(time))+startRow;
  return foundRow;
}

function isSlotFree(row, col, ss){
  let cell = ss.getRange(row, col, 1, 1).getDisplayValues().flat()[0];
  if (cell.length <= 0){
    return true;
  }
  return false;
}

function isSheetEmpty(ss){
  if(ss.getLastRow() == 1){
    return true;
  }
  return false;
}

function enterValue(row, col, ss, data){
  //this could be expanded so that if the time is 2 hours it can 
  //extend the range and merge the cells.
  const range = ss.getRange(row, col);
  range.setValue(data);
}

