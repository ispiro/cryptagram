goog.provide('cryptagram.extension');

goog.require('cryptagram.RemoteLog');
goog.require('goog.dom');
goog.require('goog.net.XhrIo');


cryptagram.extension.settings = [['save_passwords','true'],
                                 ['hide_passwords','true'],
                                 ['auto_decrypt','true'],
                                 ['album_passwords','true'],
                                 ['user_study','false']];

cryptagram.extension.encoderURL = 'http://cryptagr.am';
//cryptagram.extension.encoderURL = 'http://localhost:8888';

cryptagram.extension.lastCheck = '';

cryptagram.extension.onInstall =  function() {
  cryptagram.RemoteLog.simpleLog('INSTALL_CONSENT');
  chrome.tabs.create({
    url: 'welcome.html'
  });
  console.log("Extension Installed");
}

cryptagram.extension.onUpdate = function() {
  // Only ask for consent if not already asked (if someone has said no, then
  // obey request).
  if (localStorage['user_study'] != 'false' &&
      localStorage['user_study'] != 'true') {
    cryptagram.RemoteLog.simpleLog('UPDATE_CONSENT');
    chrome.tabs.create({
      url: 'welcome.html'
    });
  }
  console.log("Extension Updated");
}

cryptagram.extension.getVersion = function() {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", chrome.extension.getURL("manifest.json"), false);
  var resp = "";
  xhr.send();
  resp = JSON.parse(xhr.responseText);
  return resp['version'];

  // NOTE(tierney): This should work, but I found it was unreliably compiled by
  // closure.
  // var details = chrome.app.getDetails();
  // return details.version;
}

cryptagram.extension.init = function() {

  // Create a context menu which will only show up for images and link the menu
  // item to getClickHandler.
  cryptagram.extension.contextMenuID = chrome.contextMenus.create({
    'title' : 'Decrypt Image',
    'type' : 'normal',
    'contexts' : ['image'],
    'onclick' : cryptagram.extension.getClickHandler()
  });

  for (var i = 0; i < cryptagram.extension.settings.length; i++) {
    var setting = cryptagram.extension.settings[i][0];
    if (!localStorage[setting]) {
      localStorage[setting] = cryptagram.extension.settings[i][1];
    }
  }

  chrome.tabs.onUpdated.addListener(function(tabId, info, tab) {
    if (info['status'] == 'complete') {

      // If we're on the encoder page, send a special request to tell
      // injected content to set the localStorage variable. This way,
      // the user won't have to agree/disagree to terms again.
      if (tab.url.indexOf(cryptagram.extension.encoderURL) == 0) {
        chrome.tabs.sendMessage(
            tabId,{'setUserStudy': 1, 'storage': localStorage}, null);
      }

      if (localStorage['auto_decrypt'] == 'true') {
        chrome.tabs.sendMessage(
            tabId,
            {'autoDecrypt': tab.url, 'storage': localStorage}, null);
      }
    }
  });

  chrome.browserAction.setPopup({'popup':"popup.html"});

  // Check if the version has changed (installed or updated extension) and react
  // appropriately.
  var currVersion = cryptagram.extension.getVersion();
  var prevVersion = window.localStorage.getItem('version');
  if (currVersion != prevVersion) {
    // Check if we just installed this extension.
    if (typeof prevVersion == undefined) {
      cryptagram.extension.onInstall();
    } else {
      cryptagram.extension.onUpdate();
    }
    window.localStorage.setItem('version', currVersion);
  }

//chrome.browserAction.onClicked.addListener(function(tab) {
//  chrome.tabs.create({url:chrome.extension.getURL("encoder.html")});
//});
};

cryptagram.extension.decode = function() {
  chrome.tabs.getSelected(null, function(tab) {
    chrome.tabs.sendMessage(
            tab.id,
            { 'autoDecrypt': tab.url, 
              'storage': localStorage, 
              'forceDecrypt':'1'}, null);
      });
}

cryptagram.extension.showEncoder = function() {


  chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.sendRequest(tab.id, {'showEncoder':1});
  });
};


// Sends the decodeURL message request to the current tabIndex
cryptagram.extension.getClickHandler = function() {

  return function(info, tab) {
    chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.sendMessage(tab.id, {'decryptURL':info['srcUrl'], 'storage': localStorage}, function(response) {
        if (response['outcome'] == 'success') {
          localStorage[response.id] = response['password'];
          if(response['album'] != null) {
            localStorage[response['album']] = response['password'];
          }
        };
      });
    });
  };
};


cryptagram.extension.sendDebugReport = function() {
  chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.sendMessage(tab.id, {'sendDebugReport': 1}, null);
  });
};


/**
 * @param {function(*)} sendResponse Takes an argument that can be serialized as
 *     JSON.
 */
cryptagram.extension.proxyContentScript = function(sendResponse) {
  var url = 'http://localhost:2012/compile?id=cryptagram&mode=SIMPLE&pretty-print=true';
  goog.net.XhrIo.send(url, function(e) {
    var xhr = /** @type {goog.net.XhrIo} */ (e.target);
    sendResponse(xhr.getResponseText());
  });
};


/**
 * @param {Object} request JSON sent by sender.
 * @param {MessageSender} sender has a 'tab' property if sent from a content
 *     script.
 * @param {function(*)} sendResponse Call this to send a response to the
 *     request (which must be JSON).
 */
cryptagram.extension.onRequest = function(request, sender, sendResponse) {
  if (request['proxyContentScript'] == true) {
    cryptagram.extension.proxyContentScript(sendResponse);
  }
};


chrome.extension.onRequest.addListener(cryptagram.extension.onRequest);


goog.exportSymbol('cryptagram.extension.settings', cryptagram.extension.settings);
goog.exportSymbol('cryptagram.extension.showEncoder', cryptagram.extension.showEncoder);


cryptagram.extension.init();
