export function onOpen(): void {
  SpreadsheetApp.getUi()
    .createMenu('📍 Test Penu')
    .addItem('Test Item', 'testFunction')
    .addToUi();
}

export function testFunction(): void {
  SpreadsheetApp.getUi().alert("Test function triggered!");
}


