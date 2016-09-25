/* 
 * This file contains all the global variables and the functions responsible for
 * uploading data, creating the proper page layout depending on whether the
 * given data is timeseries data or not, and initiates the graph creation
 * process.
 */


// Data for all the SVGs
var svgData = {};

// SVG and chart properties
var svgCount = 0;
var width = 650;
var height = 650;
var svgPadding = 5;
var chartPadding = 40;
var scalePadding = 0.05;
var maxLabelLength = 7;

// Graph-specific data for heatmaps and barchart overviews or timelines
var numHeatSquares = 400;
var timelineKeyStartIndex = 4;
var isTimeseries;

// Types of keys for the graph layout
var KEY_TYPES = Object.freeze({ X_KEY: 0, Y_KEY: 1, COLOR_KEY: 2, SIZE_KEY: 3,
    SHAPE_KEY: 4 });
var NO_SELECTION = Object.freeze("--None--");

// D3-supported shapes for nodes
var SHAPES = Object.freeze(["circle", "cross", "diamond", "square",
    "triangle-down", "triangle-up"]);

// Variables for types of supported graphs and the default graph type
var GRAPH_TYPES;
var defaultGraph;

// Function that ensures that the fileChooser button is active and adds an event
// listener to it that triggers a file upload, setting up the page layout, and
// creating any graphs from the data in the given file
function onLoad() {
    // Make sure that the user can click the fileChooser button and add
    // the fileReader event listener to it. The disabled attribute must
    // be set to false in case of page reload (which doesn't reset this
    // attribute)
    var fileButton = document.getElementById("fileChooser");
    fileButton.disabled = false;
    fileButton.addEventListener("change", fileReader, false);
}

// Function that allows users to select a local file to upload when the
// fileChoser button is clicked, which then triggers the page layout to change
// and the creation of graphs based on the given data
function fileReader(e) {
    // Allow the user to select a file from their local filesystem
    var file =  e.target.files[0];
    
    // If no file was uploaded, do nothing
    if (!file) {
        return;
    }
    // If a file was uploaded, ensure that it has a ".csv" extension before
    // parsing it, setting up the page layout, and creating any graphs from it
    else {
        // Ensure the file is a CSV file before uploading
        if (file.name.endsWith(".csv")) {
            // Read in CSV
            var reader = new FileReader();
            reader.onload = function(e) {
                // Disable the button to upload a file. This prevents a separate
                // SVG chain being appended to the existing one
                document.getElementById("fileChooser").disabled = true;

                // Read the contents of the CSV file and parse it
                var contents = e.target.result;
                var parsedContents = d3.csv.parse(contents);

                // Ask the user whether the uploaded CSV contains timeseries
                // data or not. This helps determine the best page layout and
                // what graphs to create first
                $("<div><p>Does this CSV contain time series data?</p></div>").dialog({
                    buttons: {
                        "Yes": function() {
                            $(this).dialog("close");
                            isTimeseries = true;
                            setUpPageLayout(isTimeseries, parsedContents);
                            createTimelines(parsedContents, 1, d3.select("#leftContainer"));
                        },
                        "No": function() {
                            $(this).dialog("close");
                            isTimeseries = false;
                            setUpPageLayout(isTimeseries);
                            createSVG(parsedContents, d3.select("#mainInnerContainer")
                                .append("div").style("margin", "10px 0px"));
                        }
                    },

                    // Make sure the dialog box is removed from the DOM when it
                    // closes
                    close: function() { $(this).dialog("destroy"); }
                });
            }
            
            // Process the given file as a text file and trigger the onload
            // function above
            reader.readAsText(file);
        }

        // Tell users that they have uploaded an incorrect file type
        else {
            alert(file.name + " is not a CSV file. Please upload a CSV file.");
        }
    }
}

// Function to set up the page layout depending on whether the given CSV
// contains timeseries data or not. The types of supported graphs are stored in
// GRAPH_TYPES and the defaultGraph are also determined
function setUpPageLayout(isTimeseries, data=null) {
    // Variables to help calculate the height of the divs
    var windowHeight = d3.select("html")[0][0].clientHeight;
    var windowHeightOffset = 210;
    var divMargin = 10;
    var scrollBarWidth = 10;

    // If the CSV file contains timeseries data, create 2 independently
    // scrolling divs: one on the left for the categorized timelines for the
    // user to select from and one on the right to contain the SVG chain
    if (isTimeseries) {
        // Create an outer container
        var outerContainer = d3.select("body").append("div")
            .attr("id", "outerContainer");
            
        // Capture the windowWidth to help calculate the width of the divs
        var outerContainerWidth = outerContainer[0][0].clientWidth -
            divMargin*4 - scrollBarWidth*2;

        // Create the container for everything on the left side of
        // the page. Append the instructions and a br to separate
        // the instructions from the leftContainer
        var leftDiv = outerContainer.append("div")
            .style("width", (outerContainerWidth/3) + "px")
            .style("overflow", "hidden");
        var instructions = leftDiv.append("h4")
            .text("Click on the chart with the data you wish to explore:");
        var br = leftDiv.append("br");

        // Append a div to contain all the searching-related elements
        // Append the instructions, input box, and button
        var searchDiv = leftDiv.append("div")
            .style("float", "left")
            .style("overflow", "hidden");
        searchDiv.append("p")
            .style("display", "inline-block")
            .style("margin", "0px")
            .text("Search for a timeline:");
        searchDiv.append("input")
            .attr("id", "searchTerm")
            .attr("type", "text")
            .style("margin", "0px");
        searchDiv.append("button")
            .style("margin", "0px")
            .text("Search")
            .on("click", function() { searchForTimeline(data); });

        // The leftContainer will be shorter than the mainContainer so that the
        // bottoms of their divs line up
        var leftContainerHeightOffset = instructions[0][0].clientHeight +
            br[0][0].clientHeight + searchDiv[0][0].clientHeight + divMargin*6;

        // Append the leftContainer, where all the timelines will be appended
        leftDiv.append("div")
            .attr("id", "leftContainer")
            .style("width", "98%")
            .style("height",
                (windowHeight-windowHeightOffset-leftContainerHeightOffset) + "px")
            .style("overflow-y", "scroll");

        // Append the mainContainer, where the SVG chain will be contained
        outerContainer.append("div")
            .attr("id", "mainContainer")
            .style("width", (outerContainerWidth*2/3) + "px")
            .style("height", (windowHeight-windowHeightOffset) + "px")
            .style("overflow", "scroll")
            .append("div").attr("id", "mainInnerContainer");

        // Set the supported GRAPH_TYPES to include BARCHART_OVERVIEW and
        // TIMELINE
        GRAPH_TYPES = Object.freeze({ SCATTERPLOT: 0, HEATMAP: 1,
            BARCHART: 2, BARCHART_OVERVIEW: 3, TIMELINE: 4 });
    }
    // For non-timeseries data, only a scrolling div for the SVG chain is needed
    else {

        // For non-timeseries data, only the mainContainer and
        // mainInnerContainer are necessary
        d3.select("body").append("div")
            .attr("id", "mainContainer")
            .style("width", d3.select("html")[0][0].clientWidth - divMargin*2 -
                scrollBarWidth)
            .style("height", (windowHeight-windowHeightOffset) + "px")
            .style("overflow-y", "scroll")
            .append("div").attr("id", "mainInnerContainer");

        // Support only graphs types that do not rely on timeseries data (i.e.
        // exlude BARCHART_OVERVIEW and TIMELINE)
        GRAPH_TYPES = Object.freeze({ SCATTERPLOT: 0, HEATMAP: 1,
            BARCHART: 2 });
    }
    
    // Set the default graph type to SCATTERPLOT
    defaultGraph = GRAPH_TYPES.SCATTERPLOT;
}