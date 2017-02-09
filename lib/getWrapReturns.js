// TODO: Turn into one big constructor

/**
 * Determines whether or not browser is Firefox
 * @returns {Bool}
 */
const isFireFox = () => (
  navigator.userAgent.toLowerCase().indexOf('firefox') > -1
)

const detectNewLine = (top, bottom, currentTop, currentBottom) => {
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
  let countChars = 0 // help with indicies
  let fontSize
  let bottom

  // Loop through textElems
  textElems.map((elem, elemIndex) => {
    // Helper vars
    const textNode = elem.firstChild // get text node
    const text = elem.innerHTML

    // First start selection
    if (elemIndex === 0) {
      range.setStart(textNode, 0)
    }

    // Select one char at a time and compare top bounds value 
    // FF has issues with consistent bottom values
    for (var i = 0, len = text.length; i <= len; i++) {
      // End of range
      range.setEnd(textNode, i)

      // Range bounds
      const rangeBounds = range.getClientRects()

      // Range top
      // - FF doesn't have a range for collapsed so undefined
      const rangeTop = rangeBounds.length > 0 ? rangeBounds[rangeBounds.length - 1].top : undefined
      const rangeBottom = rangeBounds.length > 0 ? rangeBounds[rangeBounds.length - 1].bottom : undefined

      // Detecting new lines
      if (detectNewLine(top, bottom, rangeTop, rangeBottom)) {
        if (isFireFox()) {
          // Firefox: finds first char in new line (more expected)
          if (i !== 0) { // Ignore edges of spans... empty selections
            top = rangeTop
            bottom = rangeBottom
            if (!(i === 1 && elemIndex === 0)) { // Add if not first char in block
              wrapReturns.push(countChars + i - 1) // Add this char since [i - 1] gives us the start of a new line (FF only)
            }
          }
        } else {
          // Chrome, Safari, IE: finds last char in line
          top = rangeTop
          bottom = rangeBottom
          if (
            !(i === 0 && elemIndex === 0) && // Add if not first char in block
            strLength - 1 >= countChars + i // Check for good measure
          ) {
            wrapReturns.push(countChars + i) // Add next char [i] since [i - 1] gives us the end of the line and we want to add the first char of each line
          }
        }
      }
      // Move range start over one
      range.setStart(textNode, i)
    }
    countChars += text.length
  })
  return wrapReturns
}