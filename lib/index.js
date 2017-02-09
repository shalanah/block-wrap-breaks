/**
 * Display result
 */
const displayResult = (paragraph, wrapReturns, resultElem) => {
  let frag = document.createDocumentFragment()
  const text = paragraph.textContent

  // First line
  let firstLine = document.createElement('span')
  firstLine.innerHTML = text[0] !== ' ' ? text[0] + '<br/>' : '-' + '<br/>'
  frag.appendChild(firstLine)

  // Rest of the lines
  for (var j = 0, x = wrapReturns.length; j < x; j++) {
    let show = document.createElement('span')
    const returnPos = wrapReturns[j]
    show.innerHTML = text[returnPos] !== ' ' ? text[returnPos] + '<br/>' : '-' + '<br/>'
    frag.appendChild(show)
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