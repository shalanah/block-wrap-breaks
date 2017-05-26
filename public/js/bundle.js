'use strict';

// TODO: Turn into one big constructor

/**
 * Determines whether or not browser is Firefox
 * @returns {Bool}
 */
var isFirefox = function isFirefox() {
  return navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
};

/**
 * Determines whether or not browser is Safari
 * @returns {Bool}
 */
var isSafari = function isSafari() {
  return navigator.userAgent.indexOf('Safari') !== -1 && navigator.userAgent.indexOf('Chrome') === -1;
};

var isSafari10OrGreater = function isSafari10OrGreater() {
  var ua = navigator.userAgent;
  return isSafari() && ua.substr(ua.lastIndexOf('Version/') + 8, 2) === '10';
};

/**
 * Determines whether or not a selection is on a new line
 * @returns {Bool}
 */
var isStartOfLine = function isStartOfLine(top, bottom, currentTop, currentBottom) {
  /*
    Quick comparisions
    - Only let first character of a paragraph through, and when currentTop > top
  */
  if (currentBottom === undefined || currentTop === undefined) {
    // Don't have a rect for this selection... nothing to compare
    return false;
  } else if (top === undefined) {
    // If top is undefined, we are on our first char (new line)
    return true;
  } else if (top >= currentTop) {
    // Current top must exceed top value to be a new line
    return false;
  }

  // Doesn't overlap height of last range at all, must be a new line
  if (currentTop > bottom) {
    return true;
  }

  // Find overlap
  var overlap = currentBottom > bottom ? bottom - currentTop : currentBottom - currentTop;
  // If % overlap is less than half we are on a new line (lowest line-height allowed will be .5)
  return overlap / (currentBottom - currentTop) < 0.5;
};

/**
 * Get text elems that have no children elements
 * @returns {Array}
 */
var getTextElems = function getTextElems(block) {
  var inlineElems = block.getElementsByTagName('*');
  var textElems = [];
  for (var i = 0, x = inlineElems.length; i < x; i++) {
    if (inlineElems[i].getElementsByTagName('*').length < 1) {
      textElems.push(inlineElems[i]);
    }
  }
  // Return textElems if there are any... or just return block
  return textElems.length > 0 ? textElems : [block];
};

/**
 * Handles browser differences and returns the index of the character in the first line of text
 * - Does not included first line
 * @returns {Number}
 */
var getWrapIndex = function getWrapIndex(rangeIndex, elemIndex, charCount, strLength) {
  var wrapPosition = void 0;

  // TODO: explain this further
  if (isFirefox()) {
    // FF:
    if (rangeIndex === 0) return; // Skip collapsed selections
    if (rangeIndex === 1 && elemIndex === 0) return; // Skip first char in block
    wrapPosition = 'wrapChar';
  } else if (isSafari10OrGreater()) {
    // Safari > 10
    if (rangeIndex === 0 && elemIndex === 0) return; // Skip first char in block
    if (strLength - 1 < charCount + rangeIndex) return; // Make sure wrapIndex exists for beforeWrap
    if (rangeIndex === 1) {
      wrapPosition = 'wrapChar';
    } else {
      wrapPosition = 'beforeWrap';
    }
  } else {
    // Chrome, Safari < 10, IE:
    if (rangeIndex === 0 && elemIndex === 0) return; // Skip first char in block
    if (strLength - 1 < charCount + rangeIndex) return; // Make sure wrapIndex exists for beforeWrap
    wrapPosition = 'beforeWrap';
  }

  // rangeIndex is ONE past our selected char
  switch (wrapPosition) {
    case 'beforeWrap':
      // Keeping rangeIndex means we are now returning our wrapChar index
      return charCount + rangeIndex;
    case 'wrapChar':
      // Subtracting one gives us our wrapChar index
      return charCount + rangeIndex - 1;
    default:
      return;
  }
};

/**
 * Selects each char to find start of each line wrap
 * @returns {Array}
 */
var getWrapReturns = function getWrapReturns(block) {
  var textElems = getTextElems(block);
  var strLength = block.textContent.length;
  var wrapReturns = [];

  // Remove current selections
  var sel = window.getSelection();
  sel.removeAllRanges();

  // Init our range that we will use for selecting each char in a block of text
  var range = document.createRange();

  var top = void 0; // used to tell when we are on a new line
  var charCount = 0; // help with indices
  var bottom = void 0; // used to tell when we are on a new line

  // Loop through textElems
  textElems.forEach(function (elem, elemIndex) {
    // Helper vars
    var textNode = elem.firstChild; // get text node
    var text = elem.textContent;

    // First range start
    if (elemIndex === 0) range.setStart(textNode, 0);

    // Select one char at a time
    for (var i = 0, len = text.length; i <= len; i++) {
      // Set end of range
      range.setEnd(textNode, i);

      // Range bounds 
      // Range rects - FF doesn't have a range for some collapsed selections is undefined
      var rangeBounds = range.getClientRects();
      var currentTop = rangeBounds.length > 0 ? rangeBounds[rangeBounds.length - 1].top : undefined;
      var currentBottom = rangeBounds.length > 0 ? rangeBounds[rangeBounds.length - 1].bottom : undefined;

      // Detecting start of line 
      if (isStartOfLine(top, bottom, currentTop, currentBottom)) {
        // Add wrap index (only skips adding first char in paragraph)
        var wrapIndex = getWrapIndex(i, elemIndex, charCount, strLength);
        if (wrapIndex !== undefined) wrapReturns.push(wrapIndex);

        // Set next top/bottom
        top = currentTop;
        bottom = currentBottom;
      }
      // Move range start over one
      range.setStart(textNode, i);
    }
    // Keep track of characters
    charCount += text.length;
  });
  return wrapReturns;
};
var displayChar = function displayChar(entity) {
  var elem = document.createElement('span');
  elem.textContent = entity;
  if (elem.innerHTML.length === 1 && elem.textContent === ' ') {
    elem.innerHTML = '-';
  } else {
    elem.textContent = elem.innerHTML;
  }
  elem.innerHTML = elem.innerHTML + '<br/>';
  return elem;
};

/**
 * Display result
 */
var displayResult = function displayResult(paragraph, wrapReturns, resultElem) {
  var frag = document.createDocumentFragment();
  var text = paragraph.textContent;
  frag.appendChild(displayChar(text[0]));

  // Rest of the lines
  for (var j = 0, x = wrapReturns.length; j < x; j++) {
    var returnPos = wrapReturns[j];
    frag.appendChild(displayChar(text[returnPos]));
  }
  resultElem.appendChild(frag);
};

/**
 * Loop through paragraphs
 */
var findExampleWrapCharacters = function findExampleWrapCharacters() {
  // Loop through each example pair
  var examples = document.getElementsByClassName('example');
  for (var i = 0, x = examples.length; i < x; i++) {
    var example = examples[i];

    // Get wrap returns
    var paragraph = example.getElementsByClassName('text')[0];
    var wrapReturns = getWrapReturns(paragraph);

    // Display wrap returns
    var result = example.getElementsByClassName('result')[0];

    displayResult(paragraph, wrapReturns, result);
  }
};

// Let font load first then loop
// TODO: find a better way to do this
setTimeout(function () {
  findExampleWrapCharacters();
}, 2000);