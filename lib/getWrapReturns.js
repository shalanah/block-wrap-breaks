// TODO: Turn into one big constructor

/**
 * Determines whether or not browser is Firefox
 * @returns {Bool}
 */
const isFirefox = () => (
  navigator.userAgent.toLowerCase().indexOf('firefox') > -1
)

/**
 * Determines whether or not browser is Safari
 * @returns {Bool}
 */
const isSafari = () => {
  return (
  navigator.userAgent.indexOf('Safari') !== -1 && navigator.userAgent.indexOf('Chrome') === -1
)}

const isSafari10OrGreater = () => {
  const ua = navigator.userAgent
  return isSafari() && ua.substr(ua.lastIndexOf('Version/') + 8, 2) === '10'
}

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

  // Doesn't overlap height of last range at all, must be a new line
  if (currentTop > bottom) {
    return true
  }

  // Find overlap
  const overlap = currentBottom > bottom ? bottom - currentTop : currentBottom - currentTop
  // If % overlap is less than half we are on a new line (lowest line-height allowed will be .5)
  return overlap / (currentBottom - currentTop) < 0.5
}

/**
 * Get text elems that have no children elements
 * @returns {Array}
 */
const getTextElems = (block) => {
  const inlineElems = block.getElementsByTagName('*')
  let textElems = []
  for (var i = 0, x = inlineElems.length; i < x; i++) {
    if (inlineElems[i].getElementsByTagName('*').length < 1) {
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
const getWrapIndex = (rangeIndex, elemIndex, charCount, strLength) => {
  let wrapPosition
    
  // TODO: explain this further
  if (isFirefox()) {
    // FF:
    if (rangeIndex === 0) return // Skip collapsed selections
    if (rangeIndex === 1 && elemIndex === 0) return // Skip first char in block
    wrapPosition = 'wrapChar'
  } else if (isSafari10OrGreater()) {
    // Safari > 10
    if (rangeIndex === 0 && elemIndex === 0) return // Skip first char in block
     if (strLength - 1 < charCount + rangeIndex) return // Make sure wrapIndex exists for beforeWrap
    if (rangeIndex === 1) {
      wrapPosition = 'wrapChar'
    } else {
      wrapPosition = 'beforeWrap'
    }
  } else {
    // Chrome, Safari < 10, IE:
    if (rangeIndex === 0 && elemIndex === 0) return // Skip first char in block
    if (strLength - 1 < charCount + rangeIndex) return // Make sure wrapIndex exists for beforeWrap
    wrapPosition = 'beforeWrap' 
  }
  
  
  // rangeIndex is ONE past our selected char
  switch (wrapPosition) {
    case 'beforeWrap': // Keeping rangeIndex means we are now returning our wrapChar index
      return charCount + rangeIndex
    case 'wrapChar': // Subtracting one gives us our wrapChar index
      return charCount + rangeIndex - 1
    default:
      return
  }
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
  textElems.forEach((elem, elemIndex) => {
    // Helper vars
    const textNode = elem.firstChild // get text node
    const text = elem.textContent

    // First range start
    if (elemIndex === 0) range.setStart(textNode, 0)

    // Select one char at a time
    for (var i = 0, len = text.length; i <= len; i++) {
      // Set end of range
      range.setEnd(textNode, i)

      // Range bounds 
      // Range rects - FF doesn't have a range for some collapsed selections is undefined
      const rangeBounds = range.getClientRects()
      const currentTop = rangeBounds.length > 0 ? rangeBounds[rangeBounds.length - 1].top : undefined
      const currentBottom = rangeBounds.length > 0 ? rangeBounds[rangeBounds.length - 1].bottom : undefined
  
      // Detecting start of line 
      if (isStartOfLine(top, bottom, currentTop, currentBottom)) {
        // Add wrap index (only skips adding first char in paragraph)
        const wrapIndex = getWrapIndex(i, elemIndex, charCount, strLength)
        if (wrapIndex !== undefined) wrapReturns.push(wrapIndex)

        // Set next top/bottom
        top = currentTop
        bottom = currentBottom
      }
      // Move range start over one
      range.setStart(textNode, i)
    }
    // Keep track of characters
    charCount += text.length
  })
  return wrapReturns
}