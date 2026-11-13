var ImageLoader = (function () {
    var seriesData = [];
    var travelData = [];
    var dataCache = null;

    function loadDataJson() {
        if (dataCache) return Promise.resolve(dataCache);
        return fetch('data.json')
            .then(function (res) {
                if (!res.ok) throw new Error('No data.json');
                return res.json();
            })
            .then(function (data) {
                dataCache = data;
                return data;
            })
            .catch(function () {
                return { series: [], travel: [] };
            });
    }

    async function loadAllSeries() {
        var data = await loadDataJson();
        var results = [];
        if (data.series && data.series.length > 0) {
            data.series.forEach(function (series) {
                var folderPath = series.folder || ('photos/系列作品/' + series.name);
                results.push({
                    name: series.name,
                    images: (series.images || []).map(function (img) {
                        return folderPath + '/' + img;
                    })
                });
            });
        }
        seriesData = results;
        return results;
    }

    async function loadTravelImages() {
        var data = await loadDataJson();
        var images = [];
        if (data.travel && data.travel.length > 0) {
            images = data.travel.map(function (img) {
                return 'photos/旅行风光/' + img;
            });
        }
        travelData = images;
        return travelData;
    }

    function getSeriesData() {
        return seriesData;
    }

    function getTravelData() {
        return travelData;
    }

    function getFeaturedImages() {
        var featured = [];
        if (seriesData.length > 0) {
            seriesData.forEach(function (series) {
                if (series.images.length > 0) {
                    featured.push(series.images[0]);
                }
            });
        }
        if (travelData.length > 0) {
            featured = featured.concat(travelData.slice(0, 4));
        }
        return featured.slice(0, 8);
    }

    function getHeroSlides() {
        var all = [];
        seriesData.forEach(function (series) {
            all = all.concat(series.images.slice(0, 2));
        });
        all = all.concat(travelData.slice(0, 3));
        return all.slice(0, 6);
    }

    return {
        loadAllSeries: loadAllSeries,
        loadTravelImages: loadTravelImages,
        getSeriesData: getSeriesData,
        getTravelData: getTravelData,
        getFeaturedImages: getFeaturedImages,
        getHeroSlides: getHeroSlides
    };
})();
