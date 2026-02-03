class MapVis {
    constructor(parentElement, geoData, covidData, usaData) {
        this.parentElement = parentElement;
        this.covidData = covidData;
        this.usaData = usaData;
        this.geoData = geoData;
        this.selectedCategory = 'absCases';

        this.initVis();
    }

    initVis() {
        const vis = this;

        vis.margin = { top: 20, right: 40, bottom: 30, left: 40 };
        const container = document.getElementById(vis.parentElement);
        vis.width = container.getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = container.getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        vis.svg = d3.select("#" + vis.parentElement)
            .append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr('transform', `translate(${vis.margin.left}, ${vis.margin.top})`);

        vis.tooltip = d3.select("#" + vis.parentElement)
            .append('div')
            .attr('class', "tooltip")
            .style('opacity', 0);

        vis.path = d3.geoPath();

        vis.viewpoint = { width: 975, height: 610 };
        vis.zoom = Math.min(vis.width / vis.viewpoint.width, (vis.height * 0.85) / vis.viewpoint.height);

        const scaledWidth = vis.viewpoint.width * vis.zoom;
        const scaledHeight = vis.viewpoint.height * vis.zoom;
        const offsetX = (vis.width - scaledWidth) / 2;
        const offsetY = (vis.height * 0.85 - scaledHeight) / 2;

        vis.map = vis.svg.append("g")
            .attr("class", "states")
            .attr('transform', `translate(${offsetX}, ${offsetY}) scale(${vis.zoom})`);

        vis.colorScale = d3.scaleSequential()
            .interpolator(d3.interpolateGreens);

        vis.states = vis.map.selectAll(".state")
            .data(topojson.feature(vis.geoData, vis.geoData.objects.states).features)
            .enter()
            .append("path")
            .attr("class", "state")
            .attr("fill", "transparent")
            .attr("d", vis.path);

        vis.legend = vis.svg.append("g")
            .attr("class", "legendLinear")
            .attr("transform", `translate(${(vis.width - vis.width / 3) / 2}, ${vis.height * 0.88})`);

        vis.legendScale = d3.scaleLinear()
            .range([0, vis.width / 3]);

        vis.legendColor = d3.scaleSequential()
            .interpolator(d3.interpolateGreens)
            .domain(vis.legendScale.domain());

        vis.legend.append("defs")
            .append("linearGradient")
            .attr("id", "legend-gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%")
            .selectAll("stop")
            .data(vis.legendColor.ticks().map((t, i, n) => ({
                offset: `${100 * i / n.length}%`,
                color: vis.legendColor(t)
            })))
            .enter()
            .append("stop")
            .attr("offset", d => d.offset)
            .attr("stop-color", d => d.color);

        vis.legendRect = vis.legend.append("rect")
            .attr("width", vis.width / 3)
            .attr("height", vis.height / 25)
            .style("fill", "url(#legend-gradient)");

        vis.legendAxisGroup = vis.legend.append("g")
            .attr("class", "legend-axis")
            .attr("transform", `translate(0, ${vis.height / 25})`);

        vis.wrangleData(selectedCategory);
    }

    wrangleData(selectedCategory) {
        const vis = this;
        vis.selectedCategory = selectedCategory;

        vis.stateInfo = DataUtils.aggregateByState(vis.covidData, vis.usaData, selectedTimeRange);

        vis.colorScale.domain([0, d3.max(vis.stateInfo, d => d[vis.selectedCategory])]);
        vis.legendScale.domain([0, d3.max(vis.stateInfo, d => d[vis.selectedCategory])]);

        vis.updateVis();
    }

    updateVis() {
        const vis = this;
        const stateColorMap = new Map(vis.stateInfo.map(d => [d.state, d]));

        const legendAxis = d3.axisBottom(vis.legendScale)
            .tickSize(6)
            .ticks(3)
            .tickFormat(d => DataUtils.formatNumber(d));

        vis.legendAxisGroup.call(legendAxis);

        vis.states
            .attr("fill", d => {
                const info = stateColorMap.get(d.properties.name);
                return info ? vis.colorScale(info[vis.selectedCategory]) : "#FFF";
            })
            .attr('stroke-width', '1px')
            .attr('stroke', 'black');

        vis.states
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .attr('stroke-width', '2px')
                    .attr('fill', '#c95151');

                const info = stateColorMap.get(d.properties.name);
                if (info) {
                    vis.tooltip
                        .style("opacity", 1)
                        .html(`
                            <div style="border: 1px solid #9e9e9e; border-radius: 5px; background: #f5f5f5; padding: 10px">
                                <h3 style="margin: 0 0 8px 0">${info.state}</h3>
                                <p>Population: ${info.population.toLocaleString()}</p>
                                <p>Cases: ${info.absCases.toLocaleString()}</p>
                                <p>Deaths: ${info.absDeaths.toLocaleString()}</p>
                                <p>Cases (per capita): ${info.relCases.toFixed(2)}%</p>
                                <p>Deaths (per capita): ${info.relDeaths.toFixed(3)}%</p>
                            </div>
                        `)
                        .style("left", (event.pageX - 120) + "px")
                        .style("top", (event.pageY - 180) + "px");
                }
            })
            .on('mouseout', function(event, d) {
                d3.select(this)
                    .attr('stroke-width', '1px')
                    .attr("fill", () => {
                        const info = stateColorMap.get(d.properties.name);
                        return info ? vis.colorScale(info[vis.selectedCategory]) : "#FFF";
                    });

                vis.tooltip.style("opacity", 0);
            });
    }
}
