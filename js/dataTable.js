class DataTable {
    constructor(parentElement, covidData, usaData) {
        this.parentElement = parentElement;
        this.covidData = covidData;
        this.usaData = usaData;

        this.initTable();
    }

    initTable() {
        const vis = this;

        vis.table = d3.select(`#${vis.parentElement}`)
            .append("table")
            .attr("class", "table table-hover");

        vis.thead = vis.table.append("thead");
        vis.thead.html(`
            <tr>
                <th scope="col">State</th>
                <th scope="col">Population</th>
                <th scope="col">Cases</th>
                <th scope="col">Deaths</th>
                <th scope="col">Cases %</th>
                <th scope="col">Deaths %</th>
            </tr>
        `);

        vis.tbody = vis.table.append("tbody");

        vis.wrangleData();
    }

    wrangleData() {
        const vis = this;

        vis.stateInfo = DataUtils.aggregateByState(vis.covidData, vis.usaData, selectedTimeRange);
        vis.stateInfo.sort((a, b) => b.absCases - a.absCases);

        vis.updateTable();
    }

    updateTable() {
        const vis = this;

        vis.tbody.html('');

        vis.stateInfo.forEach(state => {
            const row = vis.tbody.append("tr");
            row.html(`
                <td>${state.state}</td>
                <td>${state.population.toLocaleString()}</td>
                <td>${state.absCases.toLocaleString()}</td>
                <td>${state.absDeaths.toLocaleString()}</td>
                <td>${state.relCases.toFixed(2)}%</td>
                <td>${state.relDeaths.toFixed(3)}%</td>
            `);

            row.on('mouseover', function() {
                selectedState = state.state;
                myBrushVis.wrangleDataResponsive();
            });
        });
    }
}
