class BrushVis {
    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;
        this.parseDate = d3.timeParse("%m/%d/%Y");

        this.initVis();
    }

    initVis() {
        const vis = this;

        vis.margin = { top: 20, right: 50, bottom: 20, left: 50 };
        const container = document.getElementById(vis.parentElement);
        vis.width = container.getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = container.getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        vis.svg = d3.select("#" + vis.parentElement)
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", `translate(${vis.margin.left}, ${vis.margin.top})`);

        vis.svg.append("defs")
            .append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", vis.width)
            .attr("height", vis.height);

        vis.svg.append('g')
            .attr('class', 'title')
            .append('text')
            .text('COVID-19 Cases Timeline (drag to filter)')
            .attr('transform', `translate(${vis.width / 2}, 10)`)
            .attr('text-anchor', 'middle')
            .style('font-size', '0.85em');

        vis.x = d3.scaleTime().range([0, vis.width]);
        vis.y = d3.scaleLinear().range([vis.height, 0]);

        vis.xAxisGroup = vis.svg.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", `translate(0, ${vis.height})`);

        vis.yAxisGroup = vis.svg.append("g")
            .attr("class", "axis axis--y");

        vis.pathGroup = vis.svg.append('g').attr('class', 'pathGroup');

        vis.pathOne = vis.pathGroup
            .append('path')
            .attr("class", "pathOne");

        vis.pathTwo = vis.pathGroup
            .append('path')
            .attr("class", "pathTwo");

        vis.area = d3.area()
            .x(d => vis.x(d.date))
            .y0(vis.y(0))
            .y1(d => vis.y(d.newCases));

        vis.brushGroup = vis.svg.append("g")
            .attr("class", "brush");

        vis.brush = d3.brushX()
            .extent([[0, 0], [vis.width, vis.height]])
            .on("brush end", function(event) {
                if (event.selection) {
                    selectedTimeRange = [
                        vis.x.invert(event.selection[0]),
                        vis.x.invert(event.selection[1])
                    ];
                    myDataTable.wrangleData();
                    myMapVis.wrangleData(selectedCategory);
                    myBarVisOne.wrangleData(selectedCategory);
                    myBarVisTwo.wrangleData(selectedCategory);
                }
            });

        vis.wrangleDataStatic();
    }

    wrangleDataStatic() {
        const vis = this;

        const dataByDate = d3.group(vis.data, d => d.submission_date);

        vis.preProcessedData = [];

        dataByDate.forEach((entries, dateStr) => {
            let totalCases = 0;
            let totalDeaths = 0;

            entries.forEach(entry => {
                totalCases += +entry.new_case || 0;
                totalDeaths += +entry.new_death || 0;
            });

            vis.preProcessedData.push({
                date: vis.parseDate(dateStr),
                newCases: totalCases,
                newDeaths: totalDeaths
            });
        });

        vis.preProcessedData.sort((a, b) => a.date - b.date);

        vis.wrangleDataResponsive();
    }

    wrangleDataResponsive() {
        const vis = this;

        vis.dataPathTwo = [];

        if (selectedState) {
            const stateData = vis.data.filter(d =>
                nameConverter.getFullName(d.state) === selectedState
            );

            const dataByDate = d3.group(stateData, d => d.submission_date);

            dataByDate.forEach((entries, dateStr) => {
                let totalCases = 0;
                let totalDeaths = 0;

                entries.forEach(entry => {
                    totalCases += +entry.new_case || 0;
                    totalDeaths += +entry.new_death || 0;
                });

                vis.dataPathTwo.push({
                    date: vis.parseDate(dateStr),
                    newCases: totalCases,
                    newDeaths: totalDeaths
                });
            });

            vis.dataPathTwo.sort((a, b) => a.date - b.date);
        }

        vis.updateVis();
    }

    wrangleData() {
        this.updateVis();
    }

    updateVis() {
        const vis = this;

        vis.x.domain(d3.extent(vis.preProcessedData, d => d.date));
        vis.y.domain(d3.extent(vis.preProcessedData, d => d.newCases));

        vis.xAxisGroup
            .transition()
            .duration(400)
            .call(d3.axisBottom(vis.x));

        vis.yAxisGroup
            .transition()
            .duration(400)
            .call(d3.axisLeft(vis.y).ticks(5).tickFormat(d => DataUtils.formatNumber(d)));

        vis.pathOne.datum(vis.preProcessedData)
            .transition()
            .duration(400)
            .attr("d", vis.area)
            .attr("fill", "#428A8D")
            .attr("stroke", "#136D70")
            .attr("clip-path", "url(#clip)");

        vis.pathTwo.datum(vis.dataPathTwo)
            .transition()
            .duration(400)
            .attr("d", vis.area)
            .attr('fill', 'rgba(200, 60, 60, 0.5)')
            .attr("stroke", "#8B0000")
            .attr("clip-path", "url(#clip)");

        vis.brushGroup.call(vis.brush);
    }
}
