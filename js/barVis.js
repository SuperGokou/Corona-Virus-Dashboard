class BarVis {
    constructor(parentElement, covidData, usaData, descending, title) {
        this.parentElement = parentElement;
        this.covidData = covidData;
        this.usaData = usaData;
        this.descending = descending;
        this.title = title;
        this.selectedCategory = 'absCases';

        this.initVis();
    }

    initVis() {
        const vis = this;

        vis.margin = { top: 25, right: 20, bottom: 35, left: 45 };
        const container = document.getElementById(vis.parentElement);
        vis.width = container.getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = container.getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        vis.svg = d3.select("#" + vis.parentElement)
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append('g')
            .attr('transform', `translate(${vis.margin.left}, ${vis.margin.top})`);

        vis.svg.append('g')
            .attr('class', 'title bar-title')
            .append('text')
            .text(vis.title)
            .attr('transform', `translate(${vis.width / 2}, -5)`)
            .attr('text-anchor', 'middle');

        vis.colorScale = d3.scaleSequential()
            .interpolator(d3.interpolateGreens);

        vis.yScale = d3.scaleLinear()
            .range([vis.height, 0]);

        vis.yAxis = d3.axisLeft()
            .scale(vis.yScale)
            .ticks(5)
            .tickFormat(d => DataUtils.formatNumber(d));

        vis.yAxisGroup = vis.svg.append("g")
            .attr("class", "y-axis axis");

        vis.xScale = d3.scaleBand()
            .range([0, vis.width])
            .paddingInner(0.2);

        vis.xAxis = d3.axisBottom()
            .scale(vis.xScale);

        vis.xAxisGroup = vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", `translate(0, ${vis.height})`);

        vis.tooltip = d3.select("body")
            .append('div')
            .attr('class', "tooltip")
            .style('opacity', 0);

        vis.wrangleData(vis.selectedCategory);
    }

    wrangleData(selectedCategory) {
        const vis = this;
        vis.selectedCategory = selectedCategory;

        vis.stateInfo = DataUtils.aggregateByState(vis.covidData, vis.usaData, selectedTimeRange);

        if (vis.descending) {
            vis.stateInfo.sort((a, b) => b[vis.selectedCategory] - a[vis.selectedCategory]);
        } else {
            vis.stateInfo.sort((a, b) => a[vis.selectedCategory] - b[vis.selectedCategory]);
        }

        vis.topTenData = vis.stateInfo.slice(0, 10);
        vis.colorScale.domain([0, d3.max(vis.stateInfo, d => d[vis.selectedCategory])]);

        vis.updateVis();
    }

    updateVis() {
        const vis = this;

        vis.xScale.domain(vis.topTenData.map(d => d.state));
        vis.yScale.domain([0, d3.max(vis.topTenData, d => d[vis.selectedCategory])]);

        vis.xAxisGroup
            .transition()
            .duration(300)
            .call(vis.xAxis)
            .selectAll("text")
            .attr("transform", "rotate(-20)")
            .style("text-anchor", "end");

        vis.yAxisGroup
            .transition()
            .duration(300)
            .call(vis.yAxis);

        const bars = vis.svg.selectAll(".bar")
            .data(vis.topTenData, d => d.state);

        bars.enter()
            .append("rect")
            .attr("class", "bar")
            .merge(bars)
            .on('mouseover', function(event, d) {
                d3.select(this).attr('fill', '#c95151');

                vis.tooltip
                    .style("opacity", 1)
                    .html(`
                        <div style="border: 1px solid #9e9e9e; border-radius: 5px; background: #f5f5f5; padding: 10px">
                            <h3 style="margin: 0 0 8px 0">${d.state}</h3>
                            <p>Population: ${d.population.toLocaleString()}</p>
                            <p>Cases: ${d.absCases.toLocaleString()}</p>
                            <p>Deaths: ${d.absDeaths.toLocaleString()}</p>
                            <p>Cases (per capita): ${d.relCases.toFixed(2)}%</p>
                            <p>Deaths (per capita): ${d.relDeaths.toFixed(3)}%</p>
                        </div>
                    `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 50) + "px");
            })
            .on('mouseout', function(event, d) {
                d3.select(this).attr("fill", vis.colorScale(d[vis.selectedCategory]));
                vis.tooltip.style("opacity", 0);
            })
            .transition()
            .duration(300)
            .attr("x", d => vis.xScale(d.state))
            .attr("y", d => vis.yScale(d[vis.selectedCategory]))
            .attr("width", vis.xScale.bandwidth())
            .attr("height", d => vis.height - vis.yScale(d[vis.selectedCategory]))
            .attr("fill", d => vis.colorScale(d[vis.selectedCategory]))
            .attr("stroke", "#333")
            .attr("stroke-width", "1px");

        bars.exit().remove();
    }
}
