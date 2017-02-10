const displayChar = (entity) => {
  let elem = document.createElement('span')
  elem.textContent = entity
  if (elem.innerHTML.length === 1 && elem.textContent === ' ') {
    elem.innerHTML = '-<br/>'
  } else {
    elem.textContent = elem.innerHTML
  }
  elem.innerHTML = elem.innerHTML + '<br/>'
  return elem
}

/**
 * Display result
 */
const displayResult = (paragraph, wrapReturns, resultElem) => {
  let frag = document.createDocumentFragment()
  const text = paragraph.textContent
  frag.appendChild(displayChar(text[0]))

  // Rest of the lines
  for (var j = 0, x = wrapReturns.length; j < x; j++) {
    const returnPos = wrapReturns[j]
    frag.appendChild(displayChar(text[returnPos]))
  }
  resultElem.appendChild(frag)
}

/**
 * Loop through paragraphs
 */
var findExampleWrapCharacters = () => {
  // Loop through each example pair
  var examples = document.getElementsByClassName('example')
  for (var i = 0, x = examples.length; i < x; i++) {
    const example = examples[i]

    // Get wrap returns
    const paragraph = example.getElementsByClassName('text')[0]
    const wrapReturns = getWrapReturns(paragraph)

    // Display wrap returns
    const result = example.getElementsByClassName('result')[0]

    displayResult(paragraph, wrapReturns, result)
  }
}

// Let font load first then loop
// TODO: find a better way to do this
setTimeout(function () {
  findExampleWrapCharacters()
}, 2000);