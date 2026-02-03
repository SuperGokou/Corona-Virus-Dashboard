/* Global State */
let myDataTable, myMapVis, myBarVisOne, myBarVisTwo, myBrushVis;
let selectedTimeRange = [];
let selectedState = '';
let selectedCategory = document.getElementById('categorySelector').value;

/* Load Data */
Promise.all([
    d3.json("data/states-albers-10m.json"),
    d3.csv("data/covid_data_20.csv"),
    d3.csv("data/census_usa.csv")
])
.then(initMainPage)
.catch(err => {
    document.body.innerHTML = '<div class="alert alert-danger m-5">Failed to load data. Please run this page from a local server.</div>';
});

function initMainPage(dataArray) {
    const [geoData, covidData, censusData] = dataArray;

    myDataTable = new DataTable('tableDiv', covidData, censusData);
    myBrushVis = new BrushVis('brushDiv', covidData);
    myMapVis = new MapVis('mapDiv', geoData, covidData, censusData);
    myBarVisOne = new BarVis('barDiv', covidData, censusData, true, "Top 10 States");
    myBarVisTwo = new BarVis('barTwoDiv', covidData, censusData, false, "Bottom 10 States");
}

function categoryChange() {
    selectedCategory = document.getElementById('categorySelector').value;
    myMapVis.wrangleData(selectedCategory);
    myBarVisOne.wrangleData(selectedCategory);
    myBarVisTwo.wrangleData(selectedCategory);
}
