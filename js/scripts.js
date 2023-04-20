/*Using the "Create and style clusters" mapbox tutorial we discussed at the beginning of last class.
I am implementing data from NYC Open Data regarding drinking fountain locations. Attached below is the link to the tutorial.
https://docs.mapbox.com/mapbox-gl-js/example/cluster/ */

mapboxgl.accessToken = 'pk.eyJ1Ijoia2h5MjM2IiwiYSI6ImNsZzVxYTVnNDA1d2kzZW45b3l5d280N3oifQ.GqfNX5HwLaA5utEN2iQkXg';

const NYC_COORDINATES = [-74.00214, 40.71882]

// 
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v11',
    center: NYC_COORDINATES,
    zoom: 9.7,
    pitch: 15,
    bearing: 0,
    container: 'map',
    antialias: true
});

// 
map.on('load', () => {

    map.addSource('drinkingfountains', {
        type: 'geojson',
        data: './data/fountains.geojson', 
        cluster: true,
        clusterMaxZoom: 14, // Max zoom to cluster points on
        clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
    });

    map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'drinkingfountains',
        filter: ['has', 'point_count'],
        paint: {
            // Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
            // with three steps to implement three types of circles:
            //   * yellow, 20px circles when point count is less than 100
            //   * green, 30px circles when point count is between 100 and 750
            //   * orange, 40px circles when point count is greater than or equal to 750
            'circle-color': [
                'step',
                ['get', 'point_count'],
                '#9ee5ff',
                50,
                '#0091ff',
                200,
                '#003cff'
            ],
            'circle-radius': [
                'step',
                ['get', 'point_count'],
                20,
                100,
                30,
                750,
                40
            ]
        }
    });

    map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'drinkingfountains',
        filter: ['has', 'point_count'],
        layout: {
            'text-field': ['get', 'point_count_abbreviated'],
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12
        }
    });

    map.addLayer({
        id: 'unclustered-fountain-point',
        type: 'circle',
        source: 'drinkingfountains',
        filter: ['!', ['has', 'point_count']],
        paint: {
            'circle-color': '#11b4da',
            'circle-radius': 4,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff'
        }
    });

    // inspect a cluster on click
    map.on('click', 'clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, {
            layers: ['clusters']
        });
        const clusterId = features[0].properties.cluster_id;
        map.getSource('drinkingfountains').getClusterExpansionZoom(
            clusterId,
            (err, zoom) => {
                if (err) return;

                map.easeTo({
                    center: features[0].geometry.coordinates,
                    zoom: zoom
                });
            }
        );
    });

    // When a click event occurs on a feature in
    // the unclustered-point layer, open a popup at
    // the location of the feature, with
    // description HTML from its properties.
    map.on('click', 'unclustered-fountain-point', (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const park = e.features[0].properties.signname;
        const open = e.features[0].properties.featuresta;
        const location = e.features[0].properties.descriptio;

        // Ensure that if the map is zoomed out such that
        // multiple copies of the feature are visible, the
        // popup appears over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(
                `
                <dt>NYC Park: 
                <dd>${park}
                <dt>Active/Inactive: 
                <dd>${open}
                <dt>Exact Location:
                <dd>${location}`
            )
            .addTo(map);
    });

    map.on('mouseenter', 'clusters', () => {
        map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'clusters', () => {
        map.getCanvas().style.cursor = '';
    });
});

