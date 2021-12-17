const docs = await(await fetch('resources/data/docs.json')).json()
const stopwords = new Set(await(await fetch('resources/data/stopwords.json')).json())

populateDocSelection()
draw()

function populateDocSelection() {
    const docSelection = document.getElementById('docs')
    for(const {id, name, url, defaultSelection = false} of docs) {
        const option = document.createElement('option')
        option.setAttribute('value', id)
        option.dataset.url = url
        option.innerText = name
        if(defaultSelection) {
            option.setAttribute('selected', true)
            const linkEl = document.createElement('link')
            linkEl.setAttribute('rel', 'preload')
            linkEl.setAttribute('href', url)
            linkEl.setAttribute('as', 'fetch')
            linkEl.setAttribute('crossorigin', 'true')
            document.head.appendChild(linkEl)
        }
        docSelection.appendChild(option)
    }
    docSelection.addEventListener('change', draw);
}

async function draw() {
    d3.select('svg').selectAll('*').remove()
    const docSelection = document.getElementById('docs')
    const url = docSelection.options[docSelection.selectedIndex].dataset.url
    const pdf = await pdfjsLib.getDocument(url).promise
    let texts = []
    for (let i = 1; i<= pdf.numPages; i++) {
        let page = await pdf.getPage(i)
        let content = await page.getTextContent()
        texts.push(content.items.map(s => s.str).join(' '))
    }
    const words = texts.join(' ').split(/[\s.]+/g)
        .map(w => w.replace(/^[“‘'\-—()\[\]{}]+/g, ''))
        .map(w => w.replace(/[;:.!?()\[\]{},''’”\-—]+$/g, ''))
        .map(w => w.replace(/['’]s$/g, ''))
        .map(w => w.replace(/^[0-9A-Za-z]{1,3}$/g, ''))
        .map(w => w.replace(/^[•–]$/g, ''))
        .map(w => w.replace(/^£[0-9]+$/g, ''))
        .map(w => w.replace(/^[0-9]+%$/g, ''))
        .map(w => w.substring(0, 30))
        .map(w => w.toLowerCase())
        .filter(w => w && !stopwords.has(w))
    const dataModel = d3.rollups(words, group => group.length, w => w)
        .filter(([text, value]) => value > 2)
        .sort(([, a], [, b]) => d3.descending(a, b))
        .map(([text, value]) => ({text, value}))
    const layout = d3.layout.cloud()
        .size([window.innerWidth, window.innerHeight])
        .words(dataModel)
        .padding(4)
        .rotate(() => ~~(Math.random() * 4) * 45 - 45)
        .font('Helvetica')
        .fontSize(d => Math.sqrt(d.value))
    layout.on('end', function() {
            d3.select('svg')
                .attr('width', layout.size()[0])
                .attr('height', layout.size()[1])
                .append('g')
                .attr('transform', `translate(${layout.size()[0] / 2}, ${layout.size()[1] / 2})`)
                .selectAll('text')
                .data(dataModel)
                .enter().append('text')
                .style('font-size', d => `${d.size}px`)
                .style('font-family', layout.font())
                .attr('class', () => { 
                    const colours = ['red', 'white', 'blue']
                    return colours[Math.floor(Math.random() * colours.length)]
                })
                .attr('transform', d => `translate(${[d.x, d.y]})rotate(${d.rotate})`)
                .text(d => d.text);
    })
    .start();
}