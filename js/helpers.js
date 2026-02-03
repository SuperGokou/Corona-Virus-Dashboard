/* State Name Converter */
class NameConverter {
    constructor() {
        this.states = [
            ['Alabama', 'AL'], ['Alaska', 'AK'], ['American Samoa', 'AS'],
            ['Arizona', 'AZ'], ['Arkansas', 'AR'], ['Armed Forces Americas', 'AA'],
            ['Armed Forces Europe', 'AE'], ['Armed Forces Pacific', 'AP'],
            ['California', 'CA'], ['Colorado', 'CO'], ['Connecticut', 'CT'],
            ['Delaware', 'DE'], ['District of Columbia', 'DC'], ['Florida', 'FL'],
            ['Georgia', 'GA'], ['Guam', 'GU'], ['Hawaii', 'HI'], ['Idaho', 'ID'],
            ['Illinois', 'IL'], ['Indiana', 'IN'], ['Iowa', 'IA'], ['Kansas', 'KS'],
            ['Kentucky', 'KY'], ['Louisiana', 'LA'], ['Maine', 'ME'],
            ['Marshall Islands', 'MH'], ['Maryland', 'MD'], ['Massachusetts', 'MA'],
            ['Michigan', 'MI'], ['Minnesota', 'MN'], ['Mississippi', 'MS'],
            ['Missouri', 'MO'], ['Montana', 'MT'], ['Nebraska', 'NE'],
            ['Nevada', 'NV'], ['New Hampshire', 'NH'], ['New Jersey', 'NJ'],
            ['New Mexico', 'NM'], ['New York', 'NY'], ['North Carolina', 'NC'],
            ['North Dakota', 'ND'], ['Northern Mariana Islands', 'NP'], ['Ohio', 'OH'],
            ['Oklahoma', 'OK'], ['Oregon', 'OR'], ['Pennsylvania', 'PA'],
            ['Puerto Rico', 'PR'], ['Rhode Island', 'RI'], ['South Carolina', 'SC'],
            ['South Dakota', 'SD'], ['Tennessee', 'TN'], ['Texas', 'TX'],
            ['US Virgin Islands', 'VI'], ['Utah', 'UT'], ['Vermont', 'VT'],
            ['Virginia', 'VA'], ['Washington', 'WA'], ['West Virginia', 'WV'],
            ['Wisconsin', 'WI'], ['Wyoming', 'WY']
        ];

        this.abbrevMap = new Map(this.states.map(s => [s[1], s[0]]));
        this.nameMap = new Map(this.states.map(s => [s[0], s[1]]));
    }

    getAbbreviation(fullName) {
        return this.nameMap.get(fullName) || '';
    }

    getFullName(abbrev) {
        return this.abbrevMap.get(abbrev) || '';
    }
}

const nameConverter = new NameConverter();


/* Data Processing Utilities */
const DataUtils = {
    parseDate: d3.timeParse("%m/%d/%Y"),

    filterByDateRange(data, timeRange) {
        if (!timeRange || timeRange.length === 0) {
            return data;
        }

        const startTime = timeRange[0].getTime();
        const endTime = timeRange[1].getTime();

        return data.filter(row => {
            const rowTime = this.parseDate(row.submission_date).getTime();
            return rowTime >= startTime && rowTime <= endTime;
        });
    },

    aggregateByState(covidData, censusData, timeRange) {
        const filteredData = this.filterByDateRange(covidData, timeRange);
        const dataByState = d3.group(filteredData, d => d.state);

        const populationMap = new Map();
        censusData.forEach(row => {
            const pop = parseInt(row["2020"].replace(/,/g, ''), 10) || 0;
            populationMap.set(row.state, pop);
        });

        const stateInfo = [];

        dataByState.forEach((entries, abbrev) => {
            const stateName = nameConverter.getFullName(abbrev);
            const population = populationMap.get(stateName) || 0;

            let newCasesSum = 0;
            let newDeathsSum = 0;

            entries.forEach(entry => {
                newCasesSum += +entry.new_case || 0;
                newDeathsSum += +entry.new_death || 0;
            });

            stateInfo.push({
                state: stateName,
                population: population,
                absCases: newCasesSum,
                absDeaths: newDeathsSum,
                relCases: population > 0 ? (newCasesSum / population * 100) : 0,
                relDeaths: population > 0 ? (newDeathsSum / population * 100) : 0
            });
        });

        return stateInfo;
    },

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(0) + 'k';
        }
        return num.toString();
    }
};


/* Bootstrap Carousel */
const carousel = new bootstrap.Carousel(document.getElementById('stateCarousel'), {
    interval: false
});

function switchView() {
    carousel.next();
    const btn = document.getElementById('switchView');
    btn.textContent = btn.textContent === 'map view' ? 'table view' : 'map view';
}
