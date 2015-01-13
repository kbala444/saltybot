//  Display messages to user as notifications
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    if (Notification.permission !== "granted"){
      Notification.requestPermission();
    }

    var notification = new Notification('SaltyBot', {
        icon: 'note.jpg',
        body: request.msg,
    });
});
