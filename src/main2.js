function sortedcountry(selectedData, countries) {

    const totalExport = {};
    for (d of selectedData) {
          totalExport[d.source] = (totalExport[d.source] || 0) + d.value;
    };
    
    const totalImport = {};
    for (d of selectedData) {
        totalImport[d.target] = (totalImport[d.target] || 0) + d.value
    };

    const sortedExport = Object.entries(totalExport)
        .sort((a, b) => b[1] - a[1])
        .map(d => d[0]);
    
    const exportCountries = sortedExport.filter(country => countries.includes(country))

    const sortedImport = Object.entries(totalImport)
        .sort((a, b) => b[1] - a[1])
        .map(d => d[0]);
    
    const importCountries = sortedImport.filter(country => countries.includes(country))
    
    return [exportCountries, importCountries]
}

function updatecountryChart() {
    const year = document.getElementById("selectyear2").value;
    const product = document.getElementById("selectproduct2").value;
    const countryOption = document.getElementById("countryFilter");
    const countries = Array.from(countryOption.selectedOptions).map(d => d.value);
    const selected = tradeData
        .filter(d => d.product === product && String(d.year) === year);

    const {links, nodes} = createLinksandNodes(selected, countries, countries)

    const [exportCountries, importCountries] = sortedcountry(selected, countries);

    // Creating order list to sort countries in descending order based on trade value.
    let orderList = exportCountries.map(d => d+"(Ex)")
        .concat(importCountries.map(d => d + "(Im)"));
    orderList.push("Others(Ex)", "Others(Im)")

    //deleting old container
    let container = document.getElementById("sankeyContainer2");
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
document.getElementById("updateButton2").addEventListener("click", updatecountryChart);