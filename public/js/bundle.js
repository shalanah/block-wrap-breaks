"use strict";

// TODO: Turn into one big constructor

/**
 * Determines whether or not browser is Firefox
 * @returns {Bool}
 */
var isFireFox = function isFireFox() {
  return navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
};

var detectNewLine = function detectNewLine(top, bottom, currentTop, currentBottom) {
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

  /*
    Compare overlapping heights - to tell if char is on the same line or not
  */
  var currentHeight = currentBottom - currentTop;
  var height = bottom - top;

  if (currentHeight >= height) {
    // Current range has same or bigger font, must be a new line
    return true;
  } else if (currentTop > bottom) {
    // Doesn't overlap height of last range at all, must be a new line
    return true;
  }

  // Find overlap
  var overlap = currentBottom > bottom ? bottom - currentTop : currentBottom - currentTop;
  // If % overlap is less than half we are on a new line (lowest line-height allowed will be .5)
  return overlap / (currentBottom - currentTop) < .5;
};

/**
 * Get text elems that have no children elements
 * @returns {Array}
 */
var getTextElems = function getTextElems(block) {
  var inlineElems = block.getElementsByTagName("*");
  var textElems = [];
  for (var i = 0, x = inlineElems.length; i < x; i++) {
    if (inlineElems[i].getElementsByTagName("*").length < 1) {
      textElems.push(inlineElems[i]);
    }
  }
  // Return textElems if there are any... or just return block
  return textElems.length > 0 ? textElems : [block];
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
  var countChars = 0; // help with indicies
  var fontSize = void 0;
  var bottom = void 0;

  // Loop through textElems
  textElems.map(function (elem, elemIndex) {
    // Helper vars
    var textNode = elem.firstChild; // get text node
    var text = elem.innerHTML;

    // First start selection
    if (elemIndex === 0) {
      range.setStart(textNode, 0);
    }

    // Select one char at a time and compare top bounds value 
    // FF has issues with consistent bottom values
    for (var i = 0, len = text.length; i <= len; i++) {
      // End of range
      range.setEnd(textNode, i);

      // Range bounds
      var rangeBounds = range.getClientRects();

      // Range top
      // - FF doesn't have a range for collapsed so undefined
      var rangeTop = rangeBounds.length > 0 ? rangeBounds[rangeBounds.length - 1].top : undefined;
      var rangeBottom = rangeBounds.length > 0 ? rangeBounds[rangeBounds.length - 1].bottom : undefined;

      // Detecting new lines
      if (detectNewLine(top, bottom, rangeTop, rangeBottom)) {
        if (isFireFox()) {
          // Firefox: finds first char in new line (more expected)
          if (i !== 0) {
            // Ignore edges of spans... empty selections
            top = rangeTop;
            bottom = rangeBottom;
            if (!(i === 1 && elemIndex === 0)) {
              // Add if not first char in block
              wrapReturns.push(countChars + i - 1); // Add this char since [i - 1] gives us the start of a new line (FF only)
            }
          }
        } else {
          // Chrome, Safari, IE: finds last char in line
          top = rangeTop;
          bottom = rangeBottom;
          if (!(i === 0 && elemIndex === 0) && // Add if not first char in block
          strLength - 1 >= countChars + i // Check for good measure
          ) {
              wrapReturns.push(countChars + i); // Add next char [i] since [i - 1] gives us the end of the line and we want to add the first char of each line
            }
        }
      }
      // Move range start over one
      range.setStart(textNode, i);
    }
    countChars += text.length;
  });
  return wrapReturns;
};
/**
 * Display result
 */
var displayResult = function displayResult(paragraph, wrapReturns, resultElem) {
  var frag = document.createDocumentFragment();
  var text = paragraph.textContent;

  // First line
  var firstLine = document.createElement('span');
  firstLine.innerHTML = text[0] !== ' ' ? text[0] + '<br/>' : '-' + '<br/>';
  frag.appendChild(firstLine);

  // Rest of the lines
  for (var j = 0, x = wrapReturns.length; j < x; j++) {
    var show = document.createElement('span');
    var returnPos = wrapReturns[j];
    show.innerHTML = text[returnPos] !== ' ' ? text[returnPos] + '<br/>' : '-' + '<br/>';
    frag.appendChild(show);
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