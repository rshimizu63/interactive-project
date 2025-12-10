function parsedata(url) {
    // AI I asked ChatGPT "How can I use await when fetching data with Papa.parse", and got the idea that transform the parsed results into Promise.
    return new Promise((resolve, reject) => {
        Papa.parse(url, {
            download: true,
            header: true,
            dynamicTyping: true,
            complete: ({data}) => resolve(data),
            error: (err) => reject(err)
        });
    });
}

let tradeData;

async function main() {
    tradeData = await parsedata(`data/tradedata.csv`);
    }
main();

// Choosing top N countries to show
function selectingtop(selectedData, topN){

    const totalExport = {};
    for (const d of selectedData){
        totalExport[d.source] = (totalExport[d.source] || 0) + d.value;
    };
    
    const totalImport = {};
    for (const d of selectedData){
        totalImport[d.target] = (totalImport[d.target] || 0) + d.value
    };

    const topExport = Object.entries(totalExport)
        .sort((a, b) => b[1] - a[1])
        .slice(0, topN)
        .map(d => d[0]);

    const topImport = Object.entries(totalImport)
        .sort((a, b) => b[1] - a[1])
        .slice(0, topN)
        .map(d => d[0]);
    
    return [topExport, topImport]
}


function createLinksandNodes(selectedData, excountry, imcountry){
    // Grouping unselected countries under "Others"
    const selectedLinks = selectedData.map(d => {
        const source = excountry.includes(d.source) ? d.source:"Others";
        const target = imcountry.includes(d.target) ? d.target:"Others";
        return {source:source + "(Ex)", target:target + "(Im)", value:d.value}
    })

    // Merging duplicate country entries into one link
    const integratedLinks = {};
    for (const l of selectedLinks){
        const key = l.source + "%" + l.target;
        integratedLinks[key] = (integratedLinks[key] || 0) + l.value;
    };

    const simpleLinks = Object.entries(integratedLinks).map(([key, value]) => {
        const [source, target] = key.split("%");
        return {source:source, target:target, value:value };
        });

    const nodeIds = new Set();
    for (const l of simpleLinks){
        nodeIds.add(l.source);
        nodeIds.add(l.target);
        };
    const selectedNodes = Array.from(nodeIds).map(d => ({id: d}));

    return {links:simpleLinks, nodes:selectedNodes};

}

function updateChart() {
    const year = document.getElementById("selectyear").value;
    const product = document.getElementById("selectproduct").value;
    const topN = document.getElementById("selecttopN").value;
    const selected = tradeData
        .filter(d => d.product === product && String(d.year) === year);

    const [topExport, topImport] = selectingtop(selected, topN);

    const {links, nodes} = createLinksandNodes(selected, topExport, topImport)

    // Creating order list to sort countries in descending order based on trade value.
    let orderList = topExport.map(d => d+"(Ex)")
        .concat(topImport.map(d => d + "(Im)"));
    orderList.push("Others(Ex)", "Others(Im)")

    //deleting old container
    let container = document.getElementById("sankeyContainer");
    container.innerHTML = ""; 

    


    const sankeyDiagrm = SankeyChart({nodes: nodes, links: links}, {
        nodeLabel: d => d.id.replace("(Ex)", "").replace("(Im)", ""),
        nodeSort: (a, b) => {
            return orderList.indexOf(a.id) - orderList.indexOf(b.id);
            },
        // AI I asked ChatGPT "Is there a way to color nodes in the SankeyChart function by their id while also assigning a specific color to particular vlues?" and I got an idea to use ... to map nodeGroup, nodeGroups, and color correspondingly.
        nodeGroup: d => d.id.includes("Others") ? "Others": d.id,
        nodeGroups: ["Others", ...nodes.map(d => d.id).filter(id => !id.includes("Others"))],
        colors: ["black", ...d3.schemeTableau10],
        width: 1200,
        height: 800
    });

    container.appendChild(sankeyDiagrm);
}

// Updating by pressing a button
document.getElementById("updateButton").addEventListener("click", updateChart);

// Updating by pressing an example link
function runexample(exyear, exproduct){
    const year = document.getElementById("selectyear");
    const product = document.getElementById("selectproduct");
    const topN = document.getElementById("selecttopN");

    year.value = exyear;
    product.value = exproduct
    topN.value = 5

    updateChart()
}

document.getElementById("example1").addEventListener("click", ()=>{
    runexample("2024", "Lithium carbonate")
});

document.getElementById("example2").addEventListener("click", ()=>{
    runexample("2020", "Nickel")
});

document.getElementById("example3").addEventListener("click", ()=>{
    runexample("2024", "Nickel")
});