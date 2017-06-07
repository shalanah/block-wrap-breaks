// TODO: Turn into one big constructor

/**
 * Gets chrome version
 * @returns {Int}
 */
const getChromeVersion = () => {     
  const raw = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);
  return raw ? parseInt(raw[2], 10) : undefined;
}

/**
 * Determines whether or not browser is Chrome v59 or greater
 * @returns {Bool}
 */
const isChrome59OrGreater = () => {
  const v = getChromeVersion()
  return v ? v >= 59 : undefined
}

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

/**
 * Determines whether or not browser is Safari 10 and greater
 * @returns {Bool}
 */
const isSafari10OrGreater = () => {
  if (isSafari()) {
    const ua = navigator.userAgent
    const versionEx = /Version\/([\d|\.]+)/g
    const [, version] = versionEx.exec(ua)
    console.log(Number(version) >= 10)
    return Number(version) >= 10
  }
  else return false
  
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
const getWrapIndex = (rangeIndex, elemIndex, charCount, strLength, wrapCase) => {
  let wrapPosition
    
  // TODO: Explain or document this further
  if (wrapCase === 'FF') {
    // FF:
    if (rangeIndex === 0) return // Skip collapsed selections
    if (rangeIndex === 1 && elemIndex === 0) return // Skip first char in block
    wrapPosition = 'wrapChar'
  } else if (wrapCase === 'hybrid') {
    // Safari > 10
    // Chrome > 59
    if (rangeIndex === 0 && elemIndex === 0) return // Skip first char in block
     if (strLength - 1 < charCount + rangeIndex) return // Make sure wrapIndex exists for beforeWrap
    if (rangeIndex <= 1) {
      wrapPosition = 'beforeWrap'
    } else {
      wrapPosition = 'wrapChar'
    }
  } else {
    // All the rest...
    // Chrome < 59, Safari < 10, IE:
    if (rangeIndex === 0 && elemIndex === 0) return // Skip first char in block
    if (strLength - 1 < charCount + rangeIndex) return // Make sure wrapIndex exists for beforeWrap
    wrapPosition = 'beforeWrap' 
  }
  
  // RangeIndex is ONE past our selected char
  // Return wrap index
  switch (wrapPosition) {
    case 'beforeWrap':
      return charCount + rangeIndex
    case 'wrapChar':
      return charCount + rangeIndex - 1
    default:
      return
  } 
}

/**
 * Analyzes browser to return wrap case
 * @returns {String}
 */
const getWrapCase = () => {
  if (isFirefox()) return 'FF'
  if (isSafari10OrGreater() || isChrome59OrGreater()) return 'hybrid'
  return
}

/**
 * Selects each char to find start of each line wrap
 * @returns {Array}
 */
const getWrapReturns = (block) => {
  // Browser case
  const wrapCase = getWrapCase()
  
  // Helper vars
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
        const wrapIndex = getWrapIndex(i, elemIndex, charCount, strLength, wrapCase)
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