const displayChar = (entity) => {
  let elem = document.createElement('span')
  elem.textContent = entity
  if (elem.innerHTML.length === 1 && elem.textContent === ' ') {
    elem.innerHTML = '-'
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
  wrapReturns.forEach(returnPos => frag.appendChild(displayChar(text[returnPos])))

  resultElem.appendChild(frag)
}

/**
 * Loop through paragraphs
 */
var findExampleWrapCharacters = () => {
  // Loop through each example pair
  document.querySelectorAll('.example').forEach((example) => {
    // Get wrap returns
    const [paragraph] = example.querySelectorAll('.text')
    const wrapReturns = getWrapReturns(paragraph)

    // Display wrap returns
    const [result] = example.querySelectorAll('.result')

    displayResult(paragraph, wrapReturns, result)
  });
}

// https://github.com/typekit/webfontloader
WebFont.load({
  google: {
    families: ['Lato:300,400']
  },
  active: findExampleWrapCharacters
);
