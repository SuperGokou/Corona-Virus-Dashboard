/* * * * * * * * * * * * * *
*          MapVis          *
* * * * * * * * * * * * * */

class MapVis {
    constructor(parentElement, geoData, covidData, usaData) {
        this.parentElement = parentElement;
        this.covidData = covidData;
        this.usaData = usaData;
        this.geoData = geoData;
        this.parseDate = d3.timeParse("%m/%d/%Y");

        this.initVis();
    }

    initVis() {
        let vis = this;
        vis.selectedCategory = 'absCases';

        vis.margin = {top: 30, right: 60, bottom: 30, left: 60};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;


        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        // Initialize tooltip
        vis.tooltip = d3.select("#" + vis.parentElement).append('g')
            .attr('class', "tooltip")
            .style('opacity', 1);

        vis.path = d3.geoPath();

        vis.viewpoint = {'width': 975, 'height': 610};
        vis.zoom = vis.width / vis.viewpoint.width;

        vis.map = vis.svg.append("g")
            .attr("class", "states")
            .attr('transform', `scale(${vis.zoom} ${vis.zoom})`);

        vis.colorScale = d3.scaleSequential()
            .interpolator(d3.interpolateGreens);

        vis.states = vis.map.selectAll(".state")
            .data(topojson.feature(vis.geoData, vis.geoData.objects.states).features)
            .enter().append("path")
            .attr("class", "state")
            .attr("fill", "transparent")
            .attr("d", vis.path);

        vis.legend = vis.svg.append("g")
            .attr("class", "legendLinear")
            .attr("transform", `translate(${vis.width/2},${vis.height *0.9})`);

        vis.legendScale = d3.scaleLinear()
            .range([0, vis.width/3]) ;
            //.domain([0, 827000]);

        // Define the color for the legend's gradient
        vis.legendColor = d3.scaleSequential()
            .interpolator(d3.interpolateGreens)
            .domain(vis.legendScale.domain());

        // Add the gradient to the legend
        vis.legend.append("defs")
            .append("linearGradient")
            .attr("id", "legend-gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%")
            .selectAll("stop")
            .data(vis.legendColor.ticks().map((t, i, n) => ({ offset: `${100 * i / n.length}%`, color: vis.legendColor(t) })))
            .enter().append("stop")
            .attr("offset", d => d.offset)
            .attr("stop-color", d => d.color);

        vis.wrangleData(selectedCategory);
    }

    wrangleData(selectedCategory) {
        let vis = this;

        vis.selectedCategory = selectedCategory;

        let filteredData = [];
        // if there is a region selected
        if (selectedTimeRange.length !== 0) {
            //console.log('region selected', vis.selectedTimeRange, vis.selectedTimeRange[0].getTime() )
            // iterate over all rows the csv (dataFill)
            vis.covidData.forEach(row => {
                // and push rows with proper dates into filteredData
                if (selectedTimeRange[0].getTime() <= vis.parseDate(row.submission_date).getTime() && vis.parseDate(row.submission_date).getTime() <= selectedTimeRange[1].getTime()) {
                    filteredData.push(row);
                }
            });
        } else {
            filteredData = vis.covidData;
        }

        // prepare covid data by grouping all rows by state
        let covidDataByState = Array.from(d3.group(filteredData, d => d.state), ([key, value]) => ({key, value}))

        // have a look
        // console.log(covidDataByState)

        // init final data structure in which both data sets will be merged into
        vis.stateInfo = []

        // merge
        covidDataByState.forEach(state => {

            // get full state name
            let stateName = nameConverter.getFullName(state.key)

            // init counters
            let newCasesSum = 0;
            let newDeathsSum = 0;
            let population = 0;

            // look up population for the state in the census data set
            vis.usaData.forEach(row => {
                if (row.state === stateName) {
                    population += +row["2020"].replaceAll(',', '');
                }
            })

            // calculate new cases by summing up all the entries for each state
            state.value.forEach(entry => {
                newCasesSum += +entry['new_case'];
                newDeathsSum += +entry['new_death'];
            });

            // populate the final data structure
            vis.stateInfo.push(
                {
                    state: stateName,
                    population: population,
                    absCases: newCasesSum,
                    absDeaths: newDeathsSum,
                    relCases: (newCasesSum / population * 100),
                    relDeaths: (newDeathsSum / population * 100)
                }
            )
        })

        vis.colorScale.domain([0, d3.max(vis.stateInfo, d => d[vis.selectedCategory])]);
        vis.legendScale.domain([0, d3.max(vis.stateInfo, d => d[vis.selectedCategory])]);

        // console.log('final data structure for mapVis', vis.stateInfo);

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        let selectedCategory =  document.getElementById('categorySelector').value;

        let stateColorMap = new Map(vis.stateInfo.map(d => [d.state, d]));

        // Draw the legend rectangle
        vis.legend.append("rect")
            .attr("width", vis.width/3)
            .attr("height", vis.height/25)
            .style("fill", "url(#legend-gradient)");

        // Create the legend axis
        vis.legendAxis = d3.axisBottom(vis.legendScale)
            .tickSize(6)
            .ticks(3)
            .tickFormat(d => {
                // Format the ticks to show 'k' for thousands
                if (d > 1000){
                    return d/1000 + 'k';
                }else{
                    return d;
                }
            });

        vis.svg.selectAll(".legend-Axis").remove();

        // Draw the legend axis
        vis.legend.append("g")
            .attr("class", "legend-Axis")
            .attr("transform", `translate(0, ${vis.height/25})`)
            .call(vis.legendAxis);

        vis.states
            .attr("fill", d => {
                let stateInfo = stateColorMap.get(d.properties.name);
                return stateInfo ? vis.colorScale(stateInfo[vis.selectedCategory]) : "#FFF";
            })
                .attr('stroke-width', '1px')
                .attr('stroke', 'black');

        vis.states
            .on('mouseover', function(event, d){
                // console.log(d)
                d3.select(this)
                    .attr('stroke-width', '2px')
                    .attr('stroke', 'black')
                    .attr('fill', '#c95151')

                let stateInfo = stateColorMap.get(d.properties.name);

                if (stateInfo) {
                    vis.tooltip
                        .style("opacity", 1)
                        .style("left", 0)
                        .style("top", 0)
                        .html(`
                         <div style="border: thin solid grey; border-radius: 5px; background: lightgray; padding: 10px">
                             <h3>${stateInfo.state}</h3>
                             <p>Population:      ${stateInfo.population}</p>
                             <p>Absolute Cases:  ${stateInfo.absCases}</p>
                             <p>Absolute Deaths: ${stateInfo.absDeaths}</p>
                             <p>Relative Cases:  ${stateInfo.relCases.toFixed(2)}%</p>
                             <p>Relative Deaths: ${stateInfo.relDeaths.toFixed(3)}%</p>
                         </div>`)
                        .style("left", (event.pageX - 150) + "px")
                        .style("top", (event.pageY - 150) + "px");
                }
            })
            // Mouseout event listener to remove tooltip and revert fill
            .on('mouseout', function(event, d){
                d3.select(this)
                    .attr('stroke-width', 0.5)
                    .attr("fill", d => {
                        let stateInfo = stateColorMap.get(d.properties.name);
                        return stateInfo ? vis.colorScale(stateInfo[vis.selectedCategory]) : "#FFF";
                    });
                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            });
    }

}

