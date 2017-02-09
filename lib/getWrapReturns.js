// TODO: Turn into one big constructor

/**
 * Determines whether or not browser is Firefox
 * @returns {Bool}
 */
const isFireFox = () => (
  navigator.userAgent.toLowerCase().indexOf('firefox') > -1
)

/**
 * Determines whether or not a selection is on a new line
 * @returns {Bool}
 */
const isStartOfLine = (top, bottom, currentTop, currentBottom) => {
  /*
    Quick comparisions
    - Only let first character of a paragraph through, and when currentTop > top
  */
  if (currentBottom === undefined || currentTop === undefined) {
    // Don't have a rect for this selection... nothing to compare
    return false
  } else if (top === undefined) {
    // If top is undefined, we are on our first char (new line)
    return true
  } else if (top >= currentTop) {
    // Current top must exceed top value to be a new line
    return false
  }
  
  /*
    Compare overlapping heights - to tell if char is on the same line or not
  */
  const currentHeight = currentBottom - currentTop
  const height = bottom - top
  
  if (currentHeight >= height) {
    // Current range has same or bigger font, must be a new line
    return true
  } else if (currentTop > bottom) {
    // Doesn't overlap height of last range at all, must be a new line
    return true
  }
  
  // Find overlap
  const overlap = currentBottom > bottom ? bottom - currentTop : currentBottom - currentTop
  // If % overlap is less than half we are on a new line (lowest line-height allowed will be .5)
  return overlap / (currentBottom - currentTop) < .5
}

/**
 * Get text elems that have no children elements
 * @returns {Array}
 */
const getTextElems = (block) => {
  const inlineElems = block.getElementsByTagName("*")
  let textElems = []
  for (var i = 0, x = inlineElems.length; i < x; i++) {
    if (inlineElems[i].getElementsByTagName("*").length < 1) { 
      textElems.push(inlineElems[i])
    }
  }
  // Return textElems if there are any... or just return block
  return textElems.length > 0 ? textElems : [ block ]
}

/**
 * Handles browser differences and returns the index of the character in the first line of text
 * - Does not included first line
 * @returns {Number}
 */
const getWrapIndex = (selectionIndex, elemIndex, charCount, strLength) => {
  if (isFireFox()) {
    // Firefox:
    // - Finds FIRST char in new line
    // - selectionIndex === 0 is skipped since collapsed selections rects aren't defined by FF
    if (!(selectionIndex === 1 && elemIndex === 0)) { // Skip first char in block
      return charCount + selectionIndex - 1
    }
  } else {
    // Chrome, Safari, IE: 
    // - Finds LAST char in line
    if ( !(selectionIndex === 0 && elemIndex === 0) && strLength - 1 >= charCount + i) { // Skip first char in block, make sure wrapIndex exists
      return charCount + selectionIndex
    } 
  }
  return
}

/**
 * Selects each char to find start of each line wrap
 * @returns {Array}
 */
const getWrapReturns = (block) => {
  const textElems = getTextElems(block)
  const strLength = block.textContent.length
  let wrapReturns = []

  // Remove current selections
  let sel = window.getSelection()
  sel.removeAllRanges()
  
  // Init our range that we will use for selecting each char in a block of text
  let range = document.createRange()

  let top // used to tell when we are on a new line
  let charCount = 0 // help with indices
  let bottom // used to tell when we are on a new line

  // Loop through textElems
  textElems.map((elem, elemIndex) => {
    // Helper vars
    const textNode = elem.firstChild // get text node
    const text = elem.innerHTML

    // First range start
    if (elemIndex === 0) {
      range.setStart(textNode, 0)
    }

    // Select one char at a time
    for (var i = 0, len = text.length; i <= len; i++) {
      // Set end of range
      range.setEnd(textNode, i)

      // Range bounds
      // Range rects - FF doesn't have a range for collapsed selection is undefined
      const rangeBounds = range.getClientRects()
      const currentTop = rangeBounds.length > 0 ? rangeBounds[rangeBounds.length - 1].top : undefined
      const currentBottom = rangeBounds.length > 0 ? rangeBounds[rangeBounds.length - 1].bottom : undefined

      // Detecting start of line
      if (isStartOfLine(top, bottom, currentTop, currentBottom)) {
        const wrapIndex = getWrapIndex(i, elemIndex, charCount, strLength)
        // Add wrap index
        if (wrapIndex !== undefined) wrapReturns.push(firstLineIndex) 
      }
      
      // Move range start over one
      range.setStart(textNode, i)
      
      // Set next top/bottom
      top = currentTop
      bottom = currentBottom
    }
    // Keep track of characters
    charCount += text.length
  })
  return wrapReturns
}