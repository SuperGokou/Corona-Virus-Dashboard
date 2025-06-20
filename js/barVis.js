/* * * * * * * * * * * * * *
*      class BarVis        *
* * * * * * * * * * * * * */

class BarVis {
    constructor(parentElement, covidData, usaData, descending, Title){

        this.parentElement = parentElement;
        this.covidData = covidData;
        this.usaData = usaData;
        this.parseDate = d3.timeParse("%m/%d/%Y");
        this.descending = descending;
        this.Title = Title;

        this.initVis()
    }

    initVis(){
        let vis = this;
        vis.selectedCategory = 'absCases';
        vis.margin = {top: 20, right: 20, bottom: 30, left: 40};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append('g')
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        // add title
        vis.svg.append('g')
            .attr('class', 'title bar-title')
            .append('text')
            .text(vis.Title)
            .attr('transform', `translate(${vis.width / 2}, 10)`)
            .attr('text-anchor', 'middle');

        vis.colorScale = d3.scaleSequential()
            .interpolator(d3.interpolateGreens);

        vis.yScale = d3.scaleLinear()
            .range([vis.height, 0]);

        vis.yAxis = d3.axisLeft()
            .scale(vis.yScale)

        vis.svg.append("g")
            .attr("class", "y-axis axis")

        vis.xScale=d3.scaleBand()
            .range([10, vis.width])
            .paddingInner(0.2);

        vis.xAxis = d3.axisBottom()
            .scale(vis.xScale)

        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0,"+vis.height+")");

        // tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', 'barTooltip')

        this.wrangleData(vis.selectedCategory);
    }

    wrangleData(selectedCategory){
        let vis = this
        // Pulling this straight from dataTable.js

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

        // maybe a boolean in the constructor could come in handy
        // to decide whether to sort by absolute or relative values

        if (vis.descending){
            vis.stateInfo.sort((a,b) => {return b[vis.selectedCategory] - a[vis.selectedCategory]})
        } else {
            vis.stateInfo.sort((a,b) => {return a[vis.selectedCategory] - b[vis.selectedCategory]})
        }

        // console.log('final data structure', vis.stateInfo);

        vis.topTenData = vis.stateInfo.slice(0, 10)

        // console.log('final data structure', vis.topTenData);

        // }

        vis.colorScale.domain([0, d3.max(vis.stateInfo, d => +d[vis.selectedCategory])]);

        vis.updateVis()

    }

    updateVis(){
        let vis = this;

        // update the axes
        vis.xScale.domain(vis.topTenData.map(d=>d.state))
        vis.yScale.domain([0,d3.max(vis.topTenData, d=>d[vis.selectedCategory])])

        console.log("10 top ---->", vis.topTenData)

        vis.svg.select(".x-axis")
            .transition()
            .duration(300)
            .call(vis.xAxis)
            .selectAll("text")
            .attr("transform", "rotate(-15)");

        vis.svg.select(".y-axis")
            .transition()
            .duration(300)
            .call(vis.yAxis);

        vis.bar = vis.svg.selectAll("rect")
            .data(vis.topTenData);

        vis.bar
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", d => vis.xScale(d.state))
            .attr("y", d => vis.yScale(d[vis.selectedCategory]))
            .attr("height", d => vis.height - vis.yScale(d[vis.selectedCategory]))
            .attr("width", vis.xScale.bandwidth())
            .attr("fill", d=> vis.colorScale(d[vis.selectedCategory]))
            .attr("stroke-width", "2px")
            .attr('stroke', 'black')
            .on('mouseover', function(event, d){
                d3.select(this)
                    .attr('stroke-width', '2px')
                    .attr('stroke', 'black')
                    .attr('fill', '#c95151')

                vis.tooltip
                    .style("opacity", 1)
                    .style("left", 0)
                    .style("top", 0)
                    .html(`
                         <div style="border: thin solid grey; border-radius: 5px; background: lightgray; padding: 10px">
                         <h3>${d.state}</h3>
                             <p>Population:      ${d.population}</p>
                             <p>Absolute Cases:  ${d.absCases}</p>
                             <p>Absolute Deaths: ${d.absDeaths}</p>
                             <p>Relative Cases:  ${d.relCases.toFixed(2)}%</p>
                             <p>Relative Deaths: ${d.relDeaths.toFixed(3)}%</p>
                     </div>`)
                    .style("left", (event.pageX ) + "px")
                    .style("top", (event.pageY) + "px");
            })

            .on('mouseout', function(event, d){
                d3.select(this)
                    .attr('stroke-width', '2px')
                    .attr("fill", function(d){
                        return vis.colorScale(d[vis.selectedCategory])
                    })

                vis.tooltip
                    .style("opacity", 1)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            })
            .merge(vis.bar)
            .transition()
            .duration(300)
            .attr("x", d => vis.xScale(d.state))
            .attr("y", d => vis.yScale(d[vis.selectedCategory]))
            .attr("width", vis.xScale.bandwidth())
            .attr("height", d => vis.height - vis.yScale(d[vis.selectedCategory]))
            .style("opacity", 1);

        //add tooltip functions
        vis.bar.exit().remove();
    }
}