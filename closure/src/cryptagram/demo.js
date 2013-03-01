goog.provide('cryptagram.demo');

goog.require('goog.debug.Console');
goog.require('goog.debug.Logger');
goog.require('goog.dom');
goog.require('goog.events.FileDropHandler');
goog.require('goog.events.EventType');
goog.require('goog.ui.ProgressBar');
goog.require('goog.ui.Dialog');

goog.require('cryptagram.container');
goog.require('cryptagram.decoder');
goog.require('cryptagram.cipher');
goog.require('cryptagram.codec.bacchant');
goog.require('cryptagram.loader');
goog.require('cryptagram.RemoteLog');
goog.require('cryptagram.encoder');

/**
 * This class demonstrates some of the core functionality of cryptagram.
 * @constructor
 */
cryptagram.demo = function () {

  document.body.innerHTML = "<div id=main></div>";

  var logconsole = new goog.debug.Console();
  logconsole.setCapturing(true);

  this.remoteLog = new cryptagram.RemoteLog();
  
  // Max Zip Size = 10 MB
  this.maxZipSize = 10000000;
};

cryptagram.demo.prototype.logger = goog.debug.Logger.getLogger('cryptagram.demo');


/**
 * Shows the decryption demo.
 */
cryptagram.demo.prototype.showDemo = function () {

  var self = this;
  goog.dom.getElement('main').innerHTML =
      cryptagram.templates.decryptDemo({image: 'images/secret.jpg', id: '1'});

  goog.dom.getElement('main').innerHTML +=
      cryptagram.templates.decryptDemo({image: 'images/secret2.jpg', id: '2'});

  var button1 = goog.dom.getElement('button1');

  var container1 = new cryptagram.container(goog.dom.getElement('image1'));
  goog.events.listen(button1, goog.events.EventType.CLICK, function() {
    self.demoDecrypt(container1, button1, 'cryptagram');
  }, false, this);

  var button2 = goog.dom.getElement('button2');
  var container2 = new cryptagram.container(goog.dom.getElement('image2'));
  goog.events.listen(button2, goog.events.EventType.CLICK, function() {
    self.demoDecrypt(container2, button2, 'cryptagram');
  }, false, this);

};

/**
 * Checks localStorage to see if the user has consented to the
 * user study or not. If undefined, show the dialog.
 */
cryptagram.demo.prototype.checkConsent = function() {

  if (typeof localStorage['user_study'] != 'undefined') {
    if (localStorage['user_study'] == 'true') {
      this.remoteLog.setCapturing(true);
    }
  } else {
    this.showConsentDialog();
  }
}



/**
 * Shows the encryptor.
 */
cryptagram.demo.prototype.showEncrypt = function () {
  var self = this;
  self.downloadifyId = 0;
  goog.dom.getElement('main').innerHTML = cryptagram.templates.encrypt();

  var selector = goog.dom.getElement('file_selector');
  goog.events.listen(selector, goog.events.EventType.CHANGE, function (e) {
      self.encryptFiles(e.target.files);
  }, false, self);

  var dropZone = goog.dom.getElement('drop_zone');
  var handler = new goog.events.FileDropHandler(dropZone, true);

  goog.events.listen(
    handler, goog.events.FileDropHandler.EventType.DROP,
    function (e) {
      var files = e.getBrowserEvent().dataTransfer.files;
      self.encryptFiles(files);
    });

  // Check with a timeout so injected extension content has a
  // chance to set the localStorage variable (if installed).
  setTimeout(function() { self.checkConsent(); }, 500);
};


/**
 * Shows the decryptor.
 */
cryptagram.demo.prototype.showDecrypt = function () {
  var self = this;
  goog.dom.getElement('main').innerHTML = cryptagram.templates.decrypt();

  var selector = goog.dom.getElement('file_selector');
  goog.events.listen(selector, goog.events.EventType.CHANGE, function (e) {
    self.decryptFiles(e.target.files);
  }, false, self);

  var dropZone = goog.dom.getElement('drop_zone');
  var handler = new goog.events.FileDropHandler(dropZone, true);

  goog.events.listen(
    handler, goog.events.FileDropHandler.EventType.DROP,
    function (e) {
      var files = e.getBrowserEvent().dataTransfer.files;
      self.decryptFiles(files);
    });
};



/**
 * Runs decryption on the loaded image, replacing it with the
 * decrypted image. If the image is already decrypted, it reverts
 * to the original.
 */
cryptagram.demo.prototype.demoDecrypt = function (container, button, password) {

  if (container.decrypted) {
    container.decrypted = false;
    button.value = 'Decrypt';
    container.revertSrc();
  } else {
    var self = this;
    var password = 'cryptagram';
    var loader = new cryptagram.loader(container);
    var decoder = new cryptagram.decoder(container, {password: password});

    loader.getImageData(container.getSrc(), function (data) {
      decoder.decodeData(data, null, function (result) {
        container.setSrc(result);
      });
    });

    container.decrypted = true;
    button.value = 'Reset';
  }
};


/**
 * @param{Array} files
 * @private
 */
cryptagram.demo.prototype.decryptFiles = function (files) {
  this.files = files;
  this.decoder = new cryptagram.decoder();
  this.showDecryptDialog();
  this.decoder.queueFiles(files);
};


/**
 * @param{Array} files
 * @private
 */
cryptagram.demo.prototype.encryptFiles = function (files) {
  this.encoder = new cryptagram.encoder();
  this.showEncodeDialog();
  this.encoder.queueFiles(files);
  this.files = files;
};

cryptagram.demo.prototype.showEncodeDialog = function () {
  var self = this;
  self.frames = {};
  var dialog = new goog.ui.Dialog(null, false);

  dialog.setContent(cryptagram.templates.encodeDialog());
  dialog.setTitle('Cryptagram');
  dialog.setButtonSet(goog.ui.Dialog.ButtonSet.OK_CANCEL);
  dialog.setDisposeOnHide(true);
  self.dialog = dialog;
  goog.events.listen(this.encoder, 'IMAGE_LOADED', function (event) {
  
    var frame = goog.dom.createDom('div', {'class': goog.getCssName('frame')});
    frame.appendChild(event.image);
    goog.dom.getElement('thumbs').appendChild(frame);
    self.frames[event.image.file] = frame;
    if (event.remaining <= 0) {
      dialog.getButtonSet().setAllButtonsEnabled(true);
    }
  }, false, this);

  goog.events.listen(dialog, goog.ui.Dialog.EventType.SELECT, function (e) {
    if (e.key == 'ok') {

      var password = goog.dom.getElement('password').value;
      if (password == '') {
        return;
      }
      e.stopPropagation();
      e.preventDefault();
      var quality = goog.dom.getElement('quality').value;
      var maxSize = goog.dom.getElement('maxSize').value;
      dialog.getButtonSet().setAllButtonsEnabled(false);
      self.showProgress();
      self.encoder.startEncoding({password: password,
                                  quality: quality,
                                  maxSize: maxSize});
    }
  }, false, this);

  dialog.setVisible(true);
  dialog.getButtonSet().setAllButtonsEnabled(false);
  
  dialog.getButtonElement().innerHTML += "<input type=button value='Switch to Decoder' id='switchButton' style='float: right'>";
  var switchButton = document.getElementById("switchButton");
  goog.events.listenOnce(switchButton, goog.events.EventType.CLICK, function(e) {
    dialog.exitDocument();
    self.decryptFiles(self.files);
  });

  
  var quality = goog.dom.getElement('quality');
  var warning = goog.dom.getElement('warning');
  var tips = ['Sharper image but smaller width and height', '',
              'Fuzzier image allows for bigger width and height'];
  quality.onchange = function() {
      warning.innerHTML = tips[quality.selectedIndex];
  }
  
  goog.dom.getElement('password').focus();
};

cryptagram.demo.prototype.showProgress = function () {
  var self = this;

  self.zip = new JSZip();
  self.zipSize = 0;
  self.status = "";
  self.images = self.zip.folder('images');
  self.imageCount = 0;
  self.imageList = [];
  self.remaining = [];

  goog.dom.getElement('left').innerHTML = cryptagram.templates.progress();

  var previousImage;
  goog.events.listen(this.encoder, 'ENCODE_START', function (event) {
    if (previousImage) {
      goog.dom.getElement('preview').removeChild(previousImage);
    }
    previousImage = event.image;
    goog.dom.getElement('status').innerHTML = 'Encoding <b> ' +
      event.image.file + '</b>';
    goog.dom.getElement('preview').appendChild(event.image);

  }, false, this);

  goog.events.listen(this.encoder, 'IMAGE_DONE', function (event) {
    
    var idx = event.image.src.indexOf(',');
    var dat = event.image.src.substring(idx + 1);
    var bin = window.atob(dat);
  
    if (self.zipSize + bin.length > self.maxZipSize) {
      self.logger.info("Exceeded max zip size.");
      goog.events.removeAll(self.encoder);
      self.encoder.cancel();
      self.showDownloadDialog();
      self.dialog.exitDocument();
      return;
    }

    self.zipSize += bin.length;
    self.imageCount++;
    self.imageList.push(event.image.file);
    var frame = self.frames[event.image.file];
    if (frame.firstChild) {
      frame.removeChild(frame.firstChild);
    }
    frame.appendChild(event.image);
    
    self.images.file(event.image.file,
                     bin,
                     { base64: false, binary: true });
                         
    self.remaining = event.remaining;
    if (event.remaining.length == 0) {
      goog.events.removeAll(self.encoder);
      self.showDownloadDialog();
      self.dialog.exitDocument();
      return;
    }
  }, false, this);
};

cryptagram.demo.prototype.showDownloadDialog = function () {

  var self = this;
  var dialog = new goog.ui.Dialog(null, false);
  
  dialog.setContent(cryptagram.templates.downloadDialog(
    {images:self.imageList, id:self.downloadifyId, skipped:self.remaining}));
  dialog.setTitle('Cryptagram');
  dialog.setModal(false);
  dialog.setDisposeOnHide(true);
  dialog.setButtonSet(null);
  dialog.setVisible(true);

  var zip = self.zip.generate();
  this.downloadify = Downloadify.create('downloadify' + self.downloadifyId, {
    filename: "encrypted.zip",
    data: zip,
    onError: function (){
      alert('Nothing to save.');
    },
    onComplete: function() {
      dialog.exitDocument();
    },
    dataType: 'base64',
    swf: 'media/downloadify.swf',
    downloadImage: 'images/download.png',
    width: 100,
    height: 30,
    transparent: false,
    append: false,
    enabled: true
  });
  self.downloadifyId++;
};



/**
 * Shows the consent dialog.
 */
cryptagram.demo.prototype.showConsentDialog = function () {
  var self = this;

  var dialog = new goog.ui.Dialog(null, false);
  dialog.setContent(cryptagram.templates.consentDialog());
  dialog.setTitle('Cryptagram');
  dialog.setDisposeOnHide(true);

  var bs = new goog.ui.Dialog.ButtonSet();
  bs.set('AGREE', 'I Agree', true);
  bs.set('DISAGREE', 'I Don\'t Agree', false, false);
  dialog.setButtonSet(bs);

  dialog.setDisposeOnHide(true);
  self.dialog = dialog;

  goog.events.listen(dialog, goog.ui.Dialog.EventType.SELECT, function (e) {

    if (e.key == 'AGREE') {
      localStorage['user_study'] = true;
    }
    if (e.key == 'DISAGREE') {
      localStorage['user_study'] = false;
    }
  }, false, this);

  cryptagram.RemoteLog.simpleLog('ENCODER_CONSENT');
  dialog.setVisible(true);
};



cryptagram.demo.prototype.runDecrypt = function (images, password) {

  var self = this;
  for (var i = 0; i < images.length; i++) {
    var image = images[i];
    var container = new cryptagram.container(image);
    var decoder = new cryptagram.decoder(container, {password: password});
    decoder.decodeData(image.src, null, function (result) {    
      this.container.setSrc(result);
      this.container.img.parentElement.href = result;
      this.container.img.parentElement.download = this.container.img.file;
    });
  }
};


cryptagram.demo.prototype.showDecryptDialog = function () {
  var self = this;
  self.images = [];
  var dialog = new goog.ui.Dialog(null, false);

  dialog.setContent(cryptagram.templates.decryptDialog());
  dialog.setTitle('Cryptagram');
  dialog.setButtonSet(goog.ui.Dialog.ButtonSet.OK_CANCEL);
  dialog.setDisposeOnHide(true);
  self.dialog = dialog;
  goog.events.listen(this.decoder, 'IMAGE_LOADED', function (event) {
    var frame = goog.dom.createDom('a', {'class': goog.getCssName('frame'), 'target': '_blank'});
    frame.appendChild(event.image);
    goog.dom.getElement('medium').appendChild(frame);
    self.images.push(event.image);
    if (event.remaining <= 0) {
      dialog.getButtonSet().setAllButtonsEnabled(true);
    }
  }, false, this);

  goog.events.listen(dialog, goog.ui.Dialog.EventType.SELECT, function (e) {
    if (e.key == 'ok') {

      var password = goog.dom.getElement('password').value;
      if (password == '') {
        return;
      }
      e.stopPropagation();
      e.preventDefault();
      dialog.getButtonSet().setAllButtonsEnabled(false);
      self.runDecrypt(self.images, password);
    }
  }, false, this);

  dialog.setVisible(true);
  
  dialog.getButtonElement().innerHTML += "<input type=button value='Switch to Encoder' id='switchButton' style='float: right'>";
  var switchButton = document.getElementById("switchButton");
  goog.events.listenOnce(switchButton, goog.events.EventType.CLICK, function(e) {
    dialog.exitDocument();
    self.encryptFiles(self.files);
  });
  

  dialog.getButtonSet().setAllButtonsEnabled(false);
  goog.dom.getElement('password').focus();
};


goog.exportSymbol('cryptagram.demo', cryptagram.demo);
goog.exportSymbol('cryptagram.demo.prototype.showDecrypt',
                  cryptagram.demo.prototype.showDecrypt);
goog.exportSymbol('cryptagram.demo.prototype.showEncrypt',
                  cryptagram.demo.prototype.showEncrypt);
