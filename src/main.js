import * as d3 from "d3";
import * as d3Composite from "d3-composite-projections";
import * as topojson from "topojson";
import * as spam from "spamjs";

// First we will create an array of additional points to display (some main cities locations):
var cities = [
    {
        name: "Madrid",
        coordinates: [-3.723472, 40.429348]
    },
    { name: "Barcelona", coordinates: [2.18559, 41.394579] },
    { name: "Bilbao", coordinates: [-2.930737, 43.282435] },
    { name: "Valencia", coordinates: [-0.33419, 39.494676] },
    { name: "Sevilla", coordinates: [-5.990362, 37.389681] },
    { name: "Santiago", coordinates: [-8.544953, 42.906538] },
    { name: "Málaga", coordinates: [-4.3971722, 36.7585406] },
    { name: "Alicante", coordinates: [-0.4814900, 38.3451700] },
    { name: "Palma de Mallorca", coordinates: [2.6502400, 39.5693900] },
    { name: "Zaragoza", coordinates: [-0.876566, 41.6563497] },
    {
        name: "Santa Cruz de Tenerife",
        coordinates: [-16.251692, 28.46326]
    }
];

var communities = [
    {
        name: "Andalucía",
        coordinates: [-4.5000000, 37.6000000]
    },
    {
        name: "Comunidad Valenciana",
        coordinates: [-0.3545661, 39.4561165]
    },
    {
        name: "Cataluña",
        coordinates: [1.8676800, 41.8204600]
    },
    {
        name: "Aragón",
        coordinates: [-0.7279349, 41.4519970]
    },
    {
        name: "Madrid",
        coordinates: [-3.723472, 40.429348]
    },
    {
        name: "Islas Baleares",
        coordinates: [2.971163, 39.582362]
    },
    {
        name: "Galicia",
        coordinates: [-8.1338558, 42.5750554]
    },
    {
        name: "Extremadura",
        coordinates: [-6.1666700, 39.1666700]
    },
    {
        name: "Asturias",
        coordinates: [-5.8611200, 43.3666200]
    },
    {
        name: "Castilla y León",
        coordinates: [-4.7285413, 41.6522966]
    },
    {
        name: "Castilla-La Mancha",
        coordinates: [-2.984430, 39.429895]
    },
    {
        name: "Murcia",
        coordinates: [-1.131592, 37.987503]
    },
    {
        name: "La Rioja",
        coordinates: [-2.552169, 42.292470]
    },
    {
        name: "País Vasco",
        coordinates: [-2.630668, 43.021637]
    },
    {
        name: "Navarra",
        coordinates: [-1.656592, 42.812704]
    },
    {
        name: "Islas Canarias",
        coordinates: [-16.599415, 28.239233]
    },
    {
        name: "Cantabria",
        coordinates: [-4.036580, 43.204608]
    },
    {
        name: "Ceuta y Melilla",
        coordinates: [-5.3520718, 35.8941157]
    }
];

// Let's add some declarations (hover callback, mouse coords, widht and height of the canvas)
var hover = null;
var mouseX, mouseY;

var width = 960;
var height = 630;
var aspect = width / height;
var elementContainer = '#mapContainer';

var colors1 = [
    "#FEFCED",
    "#FFF8D9",
    "#FEF5BD",
    "#FFEDB8",
    "#FDE3B3",
    "#F8CFAA",
    "#F1A893",
    "#E47479",
    "#C03F58",
    "#760420"
];

var colors2 = [
    "#D1DBDF",
    "#C9D4DA",
    "#AEBFC7",
    "#93A9B4",
    "#7794A1",
    "#607D8B",
    "#4D6570",
    "#3A4C55",
    "#28343A",
    "#151B1E"
];

// Let's define a range of colors per range of population, and a numeric format.
var color = d3.scaleThreshold()
    .domain([5, 9, 19, 49, 74, 124, 249, 499, 1000])
    .range(colors1);

var colors = [];
colors["PP"] = "#0cb2ff";
colors["PSOE"] = "#e81515";
colors["PODEMOS"] = "#9a569a";
colors["ECP"] = "#01c6a4";

var format = d3.format(".4");

// Let's add a tooltip (it will hook under the body dom item)
var tooltip = d3
    .select(elementContainer)
    .append("div")
    .attr("class", "g-tooltip")
    .style("opacity", 0);

// Let's hook on to the dom mouse move event and change the position of the tooltip when the mouse coords are changing.
document.onmousemove = handleMouseMove;

function handleMouseMove(event) {
    mouseX = event.pageX;
    mouseY = event.pageY;

    tooltip.style("left", mouseX - 100 + "px").style("top", mouseY + 25 + "px");
}

var data = [
    { party: 'PP', color: '#0cb2ff'},
    { party: 'PSOE', color: '#e81515'},
    { party: 'Podemos', color: '#9a569a'},
    { party: 'ECP', color: '#01c6a4'},
];

var legend = d3
    .select(elementContainer)
    .append("div")
    .attr("class", "g-legend")
    .append("span")
    .text("Elections result")
    .attr("class", "g-legendText");

var legendList = d3
    .select(".g-legend")
    .append("ul")
    .attr("class", "list-inline");

var keys = legendList.selectAll("li.key").data(data);

keys
    .enter()
    .append("li")
    .attr("class", "key")
    .style("border-top-color", function (d) {
        return d.color;
    })
    .text(function (d) {
        return d.party;
    });

// Let's load the geo info (name + path) of each municipality (municipio),
// plus the geo info (name + path) of each regin (comunidad autonoma),
// we can find this json files in the following urls:
// Municipalities json: https://bl.ocks.org/martgnz/raw/77d30f5adf890ef7465c/municipios.json
// Regions json: https://bl.ocks.org/martgnz/raw/77d30f5adf890ef7465c/ccaa.json

const comm = require('./content/communities.json');
const el = require('./content/elections.json');

d3.queue()
    // .defer(d3.json, json)
    // .defer(d3.json, "./content/elections.json")
    .await(ready);


var map;

function ready(error) {
    topojson.presimplify(comm);
    topojson.presimplify(el);
    map = new spam.ZoomableCanvasMap({
        element: elementContainer,
        zoomScale: 0.8,
        width: width,
        height: height,
        projection: d3Composite.geoConicConformalSpain()
            //.translate([width / 2 + 300, height / 2 + 100])
           .scale(960 * 2.9)
           ,
        data: [
            {
                features: topojson.feature(el, el.objects["ESP_adm1"]),
                static: {
                    paintfeature: function (parameters, d) {
                        if (d.properties.EL) {
                            parameters.context.fillStyle = colors[d.properties.EL];
                            parameters.context.fill();
                        }
                    }
                },
                dynamic: {
                    postpaint: function (parameters) {
                        if (!hover) {
                            tooltip.style("opacity", 0);
                            return;
                        }

                        parameters.context.beginPath();
                        parameters.context.lineWidth = 1.5 / parameters.scale;
                        parameters.path(hover);
                        parameters.context.stroke();

                        tooltip
                            .style("opacity", 1)
                            .html(
                            "<div class='g-place'>" +
                            "<span class='g-headline'>" +
                            hover.properties.NAME_1 +
                            "</span>" +
                            "</div>" +
                            "<span>Elecciones</span>" +
                            "<span class='g-value'>" +
                            hover.properties.EL +
                            "</span>"
                        );
                    }
                },
                events: {
                    hover: function (parameters, d) {
                        hover = d;
                        parameters.map.paint();
                    }
                }
            },
            {
                features: topojson.feature(comm, comm.objects["ESP_adm1"]),
                static: {
                    paintfeature: function (parameters, d) {
                        parameters.context.lineWidth = 0.5 / parameters.scale;
                        parameters.context.strokeStyle = "rgb(130,130,130)";
                        parameters.context.stroke();
                    },
                    postpaint: function (parameters) {
                        for (var i in communities) {
                            // Assign the cities to a variable for a cleaner access
                            var community = communities[i];

                            // Project the coordinates into our Canvas map
                            var projectedPoint = parameters.projection(community.coordinates);

                            // Create the label dot
                            parameters.context.beginPath();

                            parameters.context.arc(
                                projectedPoint[0],
                                projectedPoint[1],
                                2 / parameters.scale,
                                0,
                                2 * Math.PI,
                                true
                            );

                            // Font properties
                            var fontSize = 11 / parameters.scale;
                            parameters.context.textAlign = "center";
                            parameters.context.font = fontSize + "px sans-serif";

                            // Create the text shadow
                            parameters.context.shadowColor = "black";
                            parameters.context.shadowBlur = 5;
                            parameters.context.lineWidth = 1 / parameters.scale;
                            parameters.context.strokeText(
                                community.name,
                                projectedPoint[0],
                                projectedPoint[1] - 7 / parameters.scale
                            );

                            // Paint the labels
                            parameters.context.fillStyle = "white";
                            parameters.context.fillText(
                                community.name,
                                projectedPoint[0],
                                projectedPoint[1] - 7 / parameters.scale
                            );

                            parameters.context.fill();
                        }
                    }
                },
                events: {
                    // click: function (parameters, d) {
                    //     parameters.map.zoom(d);
                    // }
                }
            }
        ]
    });
    map.init();

    d3.select(window).on('resize', resize);
}
function resize() {
   console.log(map.scale(960 * 2.9));
}