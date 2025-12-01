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


function selectingtop(selectedData, topN){

    const totalExport = {};
    selectedData.forEach(d => {
        totalExport[d.source] = (totalExport[d.source] || 0) + d.value;
    });
    
    const totalImport = {};
    selectedData.forEach(d => {
        totalImport[d.target] = (totalImport[d.target] || 0) + d.value
    });

    const topExport = new Set(
        Object.entries(totalExport)
        .sort((a, b) => b[1] - a[1])
        .slice(0, topN)
        .map(d => d[0])
    );

    const topImport = new Set(
        Object.entries(totalImport)
        .sort((a, b) => b[1] - a[1])
        .slice(0, topN)
        .map(d => d[0])
    );
    
    return [topExport, topImport]
}

function updateChart() {
    const year = document.getElementById("selectyear").value;
    const product = document.getElementById("selectproduct").value;
    const topN = document.getElementById("selecttopN").value;
    const selected = tradeData
        .filter(d => d.product === product && String(d.year) === year);

    const [topExport, topImport] = selectingtop(selected, topN);

    const selectedLinks = selected.map(d => {
        const source = topExport.has(d.source) ? d.source:"Others";
        const target = topImport.has(d.target) ? d.target:"Others";
        return {source:source + "(Ex)", target:target + "(Im)", value:d.value}
    })

    const integratedLinks = {};
    selectedLinks.forEach(d => {
        const key = d.source + "%" + d.target;
        integratedLinks[key] = (integratedLinks[key] || 0) + d.value;
    });

    const simpleLinks = Object.entries(integratedLinks).map(([key, value]) => {
        const [source, target] = key.split("%");
        return {source:source, target:target, value:value };
    });

    let nodeIds = new Set();
    simpleLinks.forEach(d => {
        nodeIds.add(d.source);
        nodeIds.add(d.target);
        });
    let selectedNodes = Array.from(nodeIds).map(d => ({id: d}));

    
    //deleting old container
    let container = document.getElementById("sankeyContainer");
    container.innerHTML = ""; 


    let sankeyDiagrm = SankeyChart({nodes: selectedNodes, links: simpleLinks}, {
        nodeLabel: d => d.id.replace("(Ex)", "").replace("(Im)", ""),
        nodeSort: (a, b) => {
            const A_Others = a.id === "Others(Ex)" || a.id === "Others(Im)" ;
            const B_Others = b.id === "Others(Ex)" || b.id === "Others(Im)" ;

            if (A_Others && !B_Others) return 1;
            if (!A_Others && B_Others) return -1;

            return d3.ascending(a.id, b.id);
            },
        // AI I asked ChatGPT "Is there a way to color nodes in the SankeyChart function by their id while also assigning a specific color to particular vlues?" and I got an idea to use ... to map nodeGroup, nodeGroups, and color correspondingly.
        nodeGroup: d => d.id.includes("Others") ? "Others": d.id,
        nodeGroups: ["Others", ...selectedNodes.map(d => d.id).filter(id => !id.includes("Others"))],
        colors: ["black", ...d3.schemeTableau10],
        width: 1200,
        height: 800
    });

    container.appendChild(sankeyDiagrm);
}

// Updating by pressing a button
document.getElementById("updateButton").addEventListener("click", updateChart);