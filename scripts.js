let width = 1000, height = 400;

let svg = d3.select("svg")
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("viewBox", "0 0 " + width + " " + height)

linksSample = "https://chi-loong.github.io/CSC3007/assignments/links-sample.json"
casesSampe = "https://chi-loong.github.io/CSC3007/assignments/cases-sample.json"

// Load external data
Promise.all([d3.json(linksSample), d3.json(casesSampe)]).then(data => {

    // Data preprocessing
    data[0].forEach(e => {
        e.source = e.infector;
        e.target = e.infectee;
    });

    // Scales
    genderDomain = ["male", "female"]
    vaccinatedDomain = ["yes (2 doses)", "partial (1 dose)", "no"]
    ageDomain = [10, 20, 30, 40, 50, 60, 70]

    let genderScale = d3.scaleOrdinal()
        .domain(genderDomain)
        .range(["RoyalBlue", "Violet"]);

    let vaccinatedScale = d3.scaleOrdinal()
        .domain(vaccinatedDomain)
        .range(d3.schemeTableau10);

    let ageScale = d3.scaleThreshold()
        .domain(ageDomain)
        .range(d3.schemeReds[8]);

    // build the arrow.
    svg.append("svg:defs").selectAll("marker")
        .data(["end"])      // Different link/path types can be defined here
        .enter().append("svg:marker")    // This section adds in the arrows
        .attr("id", String)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 0)
        .attr("refY", 0)
        .attr("markerWidth", 50)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("svg:path")
        .attr("d", "M0,-5L10,0L0,5");

    // The line
    var linkpath = svg.append("svg:g").selectAll("path.link")
        .data(data[0])
        .enter().append("svg:path")
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("class", function (d) { return "link " + d.type; });

    // The arrow
    var markerPath = svg.append("svg:g").selectAll("linkpath.marker")
        .data(data[0])
        .enter().append("svg:path")
        .attr("fill", "none")
        .attr("class", function (d) { return "marker_only " + d.type; })
        .attr("marker-end", function (d) { return "url(#end)"; });

    // Nodes and Simulation
    let node = svg.append("g")
        .attr("id", "nodes")
        .selectAll("g")
        .data(data[1])
        .enter()
        .append("g")

    let circle = node
        .append("circle")
        .attr("r", 10)
        .on("mouseover", (event, d) => {
            d3.select(".tooltip")
                .text(`Age: ${d.age}
                Gender: ${d.gender}
                Date: ${d.date}
                Nationality: ${d.nationality}
                Occupation: ${d.occupation}
                Vaccinated: ${d.vaccinated}`)
                .style("left", (event.pageX) + "px")
                .style("top", (event.pageY) + "px")
                .style("visibility", "visible");;
            d3.select(event.currentTarget)
                .classed("node selected", true);
            linkpath
                .classed("node selected", e => { return (e.source.id == d.id || e.target.id == d.id) });
        })
        .on("mouseout", (event, d) => {
            d3.select(".tooltip")
                .text("")
                .style("visibility", "hidden");;
            d3.select(event.currentTarget)
                .classed("node selected", false);
            linkpath
                .classed("node selected", false);
        })
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    icon_width = 15;
    icon_height = 15;

    let image = node.append("image")
        .attr("xlink:href", d => {
            if (d.gender == "male") return "gender-male.svg"; else return "gender-female.svg";
        })
        .attr("width", icon_width)
        .attr("height", icon_height)
        .attr("pointer-events", "none");

    let simulation = d3.forceSimulation()
        .nodes(data[1])
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("link", d3.forceLink(data[0])
            .id(d => d.id)
            .distance(40)
            .strength(0.2)
        )
        .force("charge", d3.forceManyBody().strength(-15))
        .force("collide", d3.forceCollide().strength(0.1).radius(15))
        .on("tick", d => {
            node
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);

            circle
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);

            image
                .attr("x", d => d.x - icon_width / 2)
                .attr("y", d => d.y - icon_height / 2);

            linkpath.attr("d", function (d) {
                var dx = d.target.x - d.source.x,
                    dy = d.target.y - d.source.y,
                    dr = Math.sqrt(dx * dx + dy * dy);
                return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
            });

            // Some math from stack overflow
            markerPath.attr("d", function (d) {
                var dx = d.target.x - d.source.x,
                    dy = d.target.y - d.source.y,
                    dr = Math.sqrt(dx * dx + dy * dy);
                var endX = (d.target.x + d.source.x) / 2;
                var endY = (d.target.y + d.source.y) / 2;
                var len = dr - ((dr / 2) * Math.sqrt(3));
                endX = endX + (dy * len / dr);
                endY = endY + (-dx * len / dr);
                return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + endX + "," + endY;
            });
        });

    // Radio on change
    $('input[type=radio][name=radio]').change(function () {
        if (this.value == 1) {
            drawLegend(genderScale, genderDomain, "gender");
        }
        else if (this.value == 2) {
            drawLegend(vaccinatedScale, vaccinatedDomain, "vaccinated");
        }
        else {
            drawLegend(ageScale, ageDomain, "age");
        }
    });

    // Page on load
    if ($('#r1').is(':checked')) {
        drawLegend(genderScale, genderDomain, "gender");
    }
    else if ($('#r2').is(':checked')) {
        drawLegend(vaccinatedScale, vaccinatedDomain, "vaccinated");
    }
    else {
        drawLegend(ageScale, ageDomain, "age");
    }

    // Legend & Node fill
    function drawLegend(scale, domain, key) {
        node
            .style("fill", d => { return scale(d[key]) })

        d3.select("#legend").remove();
        var legend = svg.append("svg")
            .append("g")
            .attr("id", "legend");

        var legenditem = legend.selectAll(".legenditem")
            .data(d3.range(domain.length))
            .enter()
            .append("g")
            .attr("class", "legenditem")
            .attr("transform", function (d, i) { return "translate(0," + i * 20 + ")"; });

        legenditem.append("rect")
            .attr("x", 50)
            .attr("y", 0)
            .attr("width", 15)
            .attr("height", 15)
            .style("fill", function (d, i) { return scale(domain[i]); });

        legenditem.append("text")
            .attr("x", 75)
            .attr("y", 10)
            .style("text-anchor", "start")
            .style("font-size", "10px")
            .style("font-family", "Helvetica, sans-serif")
            .text(function (d, i) { return domain[i]; });
    }

    // Drag
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    //Zoom
    var zoom = d3.zoom()
        .scaleExtent([1, 5])
        .translateExtent([[0, 0], [width, height]])
        .on('zoom', handleZoom);
    d3.select('svg')
        .call(zoom);

    function handleZoom(e) {
        node
            .attr('transform', e.transform);
        markerPath
            .attr('transform', e.transform);
        linkpath
            .attr('transform', e.transform);
    }
})