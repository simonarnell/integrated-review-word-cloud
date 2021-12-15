document.addEventListener("DOMContentLoaded", function() {
    document.getElementById('docs').addEventListener("change", drawWordCloud);
    drawWordCloud()
})

async function drawWordCloud() {
    d3.select("svg").remove()
    const docSelection = document.getElementById('docs')
    const url = docSelection.options[docSelection.selectedIndex].dataset.url
    const pdf = await pdfjsLib.getDocument(url).promise
    let texts = []
    for (let i = 1; i<= pdf.numPages; i++) {
        let page = await pdf.getPage(i)
        let content = await page.getTextContent()
        texts.push(content.items.map(s => s.str).join(' '))
    }
    stopwords = new Set("i,me,my,myself,we,us,our,ours,ourselves,you,your,yours,yourself,yourselves,he,him,his,himself,she,her,hers,herself,it,its,itself,they,them,their,theirs,themselves,what,which,who,whom,whose,this,that,these,those,am,is,are,was,were,be,been,being,have,has,had,having,do,does,did,doing,will,would,should,can,could,ought,i'm,you're,he's,she's,it's,we're,they're,i've,you've,we've,they've,i'd,you'd,he'd,she'd,we'd,they'd,i'll,you'll,he'll,she'll,we'll,they'll,isn't,aren't,wasn't,weren't,hasn't,haven't,hadn't,doesn't,don't,didn't,won't,wouldn't,shan't,shouldn't,can't,cannot,couldn't,mustn't,let's,that's,who's,what's,here's,there's,when's,where's,why's,how's,a,an,the,and,but,if,or,because,as,until,while,of,at,by,for,with,about,against,between,into,through,during,before,after,above,below,to,from,up,upon,down,in,out,on,off,over,under,again,further,then,once,here,there,when,where,why,how,all,any,both,each,few,more,most,other,some,such,no,nor,not,only,own,same,so,than,too,very,say,says,said,shall,areas,around,range,adopt,back,well,others,using,good,one,two,three,four,five,six,seven,eight,nine,ten,already,bring,face,place,first,second,third,fourth,fifth,sixth,seventh,eighth,ninth,tenth,also,work,ensure,within,like,time,drive,area,sets,coming,much,findings".split(","))
    words = texts.join(' ').split(/[\s.]+/g)
    .map(w => w.replace(/^[“‘"\-—()\[\]{}]+/g, ""))
    .map(w => w.replace(/[;:.!?()\[\]{},"'’”\-—]+$/g, ""))
    .map(w => w.replace(/['’]s$/g, ""))
    .map(w => w.replace(/^[0-9A-Za-z]{1,3}$/g, ""))
    .map(w => w.replace(/^[•–]$/g, ""))
    .map(w => w.replace(/^£[0-9]+$/g, ""))
    .map(w => w.replace(/^[0-9]+%$/g, ""))
    .map(w => w.substring(0, 30))
    .map(w => w.toLowerCase())
    .filter(w => w && !stopwords.has(w))
    data = d3.rollups(words, group => group.length, w => w)
        .filter(([text, value]) => value > 2)
        .sort(([, a], [, b]) => d3.descending(a, b))
        .map(([text, value]) => ({text, value}))
    var layout = d3.layout.cloud()
        layout.size([window.innerWidth, window.innerHeight])
        .words(data)
        .padding(4)
        .rotate(() => ~~(Math.random() * 4) * 45 - 45)
        .font("Helvetica")
        .fontSize(d => Math.sqrt(d.value))
        .on("end", function(words) {
            d3.select("body").append("svg")
            .attr("width", layout.size()[0])
            .attr("height", layout.size()[1])
            .append("g")
            .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
            .selectAll("text")
            .data(data)
            .enter().append("text")
            .style("font-size", d => d.size + "px")
            .style("font-family", layout.font())
            .attr("class", () => { 
                const colours = ["red", "white", "blue"]
                return colours[Math.floor(Math.random() * colours.length)]
            })
            .attr("transform", d => {
                return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
            })
            .text(d => d.text);
        })
        .start();     
}