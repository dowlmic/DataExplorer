/*
 * This file contains all functions responsible for creating the graph legends
 * for each graph in the SVG chain.
 */


// Function that creates the legend for the given SVG
function createGraphLegend(svgObj, heatColorScale) {
    // Remove all elements from the graph's legend and make it invisible
    svgObj.legend.selectAll("div").remove();
    svgObj.legend.selectAll("br").remove();
    svgObj.legend.classed("invisible", true).classed("visible", false);

    // A color legend is only applicable to scatterplots, barcharts and heatmaps
    if (svgObj.currentGraph == GRAPH_TYPES.SCATTERPLOT ||
      svgObj.currentGraph == GRAPH_TYPES.BARCHART ||
      svgObj.currentGraph == GRAPH_TYPES.HEATMAP) {
      
        // Put the color scale in the legend if one exists
        if (svgObj.colorKey != NO_SELECTION || svgObj.currentGraph == GRAPH_TYPES.HEATMAP) {
            // Start off the section in the legend for the color scale
            var colorLegend = initiateLegendSection("color", svgObj, KEY_TYPES.COLOR_KEY);

            // Depending on which variable has been chosen to determine the
            // color scale, set isCategoricalColor and collect a list of colors
            // and their associated value to put in the legend
            var isCategoricalColor;
            var colors;
            
            // If the colorKey is categorical, then selectedColors shouldn't be
            // null. Use the hashmap in svgObj for selectedColors as the list
            // of colors for the legend and set isCategoricalColor to true
            if (svgObj.selectedColors != null &&
              svgObj.currentGraph != GRAPH_TYPES.HEATMAP) {
                colors = svgObj.selectedColors;
                isCategoricalColor = true;
            }
            // For heatmaps or colorKeys with continuous data, create a legend
            // with a total of 5 color samples and their associated values
            else if (svgObj.colorScale != null ||
              svgObj.currentGraph == GRAPH_TYPES.HEATMAP) {
              
                // If the currentGraph is a heatmap, set colorScale to the
                // heatColorScale. Otherwise, use svgObj.colorScale
                var colorScale;
                if (svgObj.currentGraph == GRAPH_TYPES.HEATMAP) {
                    colorScale = heatColorScale;
                }
                else {
                    colorScale = svgObj.colorScale;
                }

                // Calculate the initial value in the colorScale domain and
                // calculate how much to step by in each iteration of the loop
                var colorDomain = colorScale.domain();
                var numSteps = 4;
                var legendStep = (colorDomain[colorDomain.length-1] - colorDomain[0]) / numSteps;
                
                // For each step in the loop, add a key: value pair to the
                // colors hash where the key is the value in the colorScale
                // domain and the value is the color associated with it
                colors = {};
                var i;
                for (i = 0; i < numSteps+1; i++) {
                    var value = colorDomain[0] + legendStep*i;
                    var color = colorScale(value);
                    colors[value] = color;

                    // If the legendStep is 0, then there is no need to continue
                    // iterating
                    if (legendStep == 0) {
                        break;
                    }
                }
                
                // Make sure isCategoricalColor is false
                isCategoricalColor = false;
            }

            // Iterate through the dictionary of values and their associated
            // colors and create a color sample for each one
            var colorKeys = Object.keys(colors);
            var i;
            for (i = 0; i < colorKeys.length; i++) {
                // If the currentGraph is not a heatmap, create buttons for the
                // color sample if the scale is categorical or if it is the
                // first or last color sample in a continuous scale
                var shouldMakeButton = (isCategoricalColor ||
                    i == 0 || i == colorKeys.length-1) &&
                    svgObj.currentGraph != GRAPH_TYPES.HEATMAP;
                
                // Get the next value and its associated color from the hashmap
                var value = colorKeys[i];
                var color = colors[value];
                
                // Make each color sample a small square
                var symbol = d3.svg.symbol().size(75).type("square");
                
                // Determine the margin and onClickFunction based on whether
                // a button will be made or not
                var margin;
                var onClickFunction = null;
                if (shouldMakeButton) {
                    margin = "10px";
                    onClickFunction = createColorChooserWrapper(svgObj, color,
                        value, isCategoricalColor);
                }
                else {
                    margin = "16px";
                }

                // Use the variables above to create a new row in the color
                // legend
                createLegendRow(colorLegend, value, color, symbol,
                    svgObj, shouldMakeButton, margin, onClickFunction);
            }
        }
    }
    
    // Size and shape legends are only applicable to scatterplots
    if (svgObj.currentGraph == GRAPH_TYPES.SCATTERPLOT) {
        // Add the size scale to the legend if one exists
        if (svgObj.sizeKey != NO_SELECTION) {
            var sizeLegend = initiateLegendSection("size", svgObj, KEY_TYPES.SIZE_KEY);

            // Calculate how much to increase the size by for each row in the
            // legend
            var sizeDomain = svgObj.sizeScale.domain();
            var numSteps = 4;
            var legendStep = (sizeDomain[sizeDomain.length-1] - sizeDomain[0]) / numSteps;
            var i;
            for (i = 0; i < numSteps+1; i++) {
                // Create the next circle in the size legend
                var value = sizeDomain[0] + legendStep*i;
                var symbol = d3.svg.symbol()
                    .size(svgObj.sizeScale(value))
                    .type("circle");
                    
                // Pass all variables into the function to create a new row in
                // the shape legend
                createLegendRow(sizeLegend, value, "black", symbol, svgObj,
                    false, "6px");
                    
                // If the legendStep is 0, there is no need to continue iterating
                if (legendStep == 0) {
                    break;
                }
            }
        }

        // Add the shapes legend if a shape key has been selected
        if (svgObj.shapeKey != NO_SELECTION) {
            var shapeLegend = initiateLegendSection("shape", svgObj, KEY_TYPES.SHAPE_KEY);

            // Iterate through the key values in the shapeDict and their
            // associated shapes to create a new row in the shape legend for each
            for (var key in svgObj.shapeDict) {
                var symbol = d3.svg.symbol()
                    .size(75)
                    .type(svgObj.shapeDict[key]);
                var onClickFunction = function() { createShapeChooser(svgObj, key); };
                createLegendRow(shapeLegend, key, "black", symbol, svgObj, true,
                    "10px", onClickFunction);
            }
        }
    }

    // Make sure the mainInnerContainer has the proper width to have the legend
    // remain to the right of the graph
    setMainInnerContainerWidth();
}

// Function to initialize a new section of the legend with a title for the
// section and the table headers
function initiateLegendSection(sectionName, svgObj, key) {
    // Make sure the legend is visible
    svgObj.legend.classed("visible", true).classed("invisible", false);
    
    // Add some space and append the section name to the legend
    svgObj.legend.append("br");
    var legendSectionDiv = svgObj.legend.append("div")
            .attr("id", svgObj.name + "-" + sectionName + "-legend");
            
            
    // Add a table to the legend section and add table headers based on the
    // given sectionName and key
    var legend = legendSectionDiv.append("table");
    var legendHeader = legend.append("tr");
    // Capitalize the sectionName
    legendHeader.append("th")
        .text(sectionName[0].toUpperCase() +
            sectionName.substring(1, sectionName.length));
    legendHeader.append("th")
        .style("padding-left","20px")
        .text(function() {
            // If the key is a colorKey, then either make the table header have
            // the name of the colorKey or "Number of Data Points" for heatmaps
            if (key == KEY_TYPES.COLOR_KEY) {
                if (svgObj.currentGraph == GRAPH_TYPES.HEATMAP) {
                    return "Number of Data Points";
                }
                else {
                    return svgObj.colorKey;
                }
            }
            // If the key is a sizeKey, then make the table header the name of
            // the sizeKey
            else if (key == KEY_TYPES.SIZE_KEY) {
                return svgObj.sizeKey;
            }
            // If the key is a shapeKey, then make the table header the name of
            // the shapeKey
            else if (key == KEY_TYPES.SHAPE_KEY) {
                return svgObj.shapeKey;
            }
            // If a bad key type was given, log the issue to the console and
            // leave the header blank
            else {
                console.log("Cannot determine key type. Got: " + key);
                return null;
            }
        });
        
    // Return the table in this legend section to continue building off of
    return legend;
}

// A wrapper function to allow for a color chooser to appear when a button is
// clicked. Because JavaScript evaluates parameters lazily, using a wrapper
// function for an onClick function that is created inside a loop ensures that
// all variables are properly assigned for that specific button
function createColorChooserWrapper(svgObj, color, value, isCategoricalColor) {
    return function() { createColorChooser(svgObj, color, value, isCategoricalColor); };
}

// A helper function to create a row in the table for a legend using specific
// visual attributed given
function createLegendRow(legend, value, color, symbol, svgObj,
  shouldMakeButton, margin, buttonClickFunction=null) {
      
    // Add a row for this part of the legend and a column for the attribute
    // sample
    var row = legend.append("tr");
    var sample = row.append("td");

    // If the color sample should be contained in the button, make it, add the
    // buttonClickFunction as the onclick action, and shift the button to the
    // left the given amount. This helps center the button in the column
    if (shouldMakeButton) {
        sample = sample.append("button")
            .style("margin-left", margin)
            .on("click", function() {
                buttonClickFunction();
            });
    }
    
    // Make the SVG with the attribute sample a fixed size
    var sampleSVG = sample.append("svg")
        .attr("width", 20)
        .attr("height", 20);

    // If a button was not made, shift the SVG to the left the given amount.
    // This helps center the SVG in the column
    if (!shouldMakeButton) {
        sampleSVG.style("margin-left", margin);
    }

    // Add the given symbol to the SVG with the given color. Shift it right and
    // down to center the sybmol
    sampleSVG.append("path")
        .attr("transform", "translate(9,9)")
        .style("fill", color)
        .attr("d", symbol);
        
    // Add another column to the legend with the value associated with the given
    // attribute sample
    row.append("td").style("padding-left", "10px").text(value);
}

// A helper function to create a dialog box for users to select colors for the
// endpoints of a continuous color scale or for each of the categorical colors
// used. The selected color is passed to the changeColor function that processes
// what to do with the user's selection
function createColorChooser(svgObj, color, value, isCategoricalColor) {
    // Initialize the list of available colors
    var colors = ["black", "white", "darkblue", "lightgrey"];
    var colorScale = d3.scale.category20();
    var i;
    for (i = 0; i < 20; i ++) {
        colors.push(colorScale(i));
    }

    // Create the HTML for all the SVGs for the color samples in the dialog
    var colorSelections = "";
    for (i = 0; i < colors.length; i++) {
        colorSelections += '<div id="' + colors[i] +
            '" style="float: left; margin: 0px;"><svg width="20" ' +
            'height="20" style="background-color: ' + colors[i] +
            ';" onclick="listClick(this)"></svg></div>';
    }

    // Create a dialog box for the color samples
    var colorChooser = $('<div><h2>Colors</h2><div id="' +
        svgObj.name + '-colors" style="display: block; ' +
        'margin: auto;">' + colorSelections + '</div></div>');
    var selectedColor;
    $(colorChooser).dialog({
        // When the dialog opens, select SVG with the current color
        open: function() {
            color = getRGBColor(color);
            d3.select(this).selectAll("svg")[0].forEach( function(d) {
                if (d3.select(d).style("background-color") == color) {
                    d3.select(d).style("border", "3px solid lightgreen");
                }
            });
        },
        buttons: {
            // The Ok button finds the selected color and passes it to the
            // changeColor function to process what to do with the user's
            // selection
            "Ok": function() {
                // Determine what color was selected
                var selectedColor;
                d3.select(this).selectAll("svg")[0].forEach( function(d) {
                    // d3.select(d).style("border") returns an empty string...
                    // must use a workaround
                    if (d3.select(d).attr("style").indexOf("3px solid lightgreen") >= 0) {
                        selectedColor = d3.select(d).style("background-color");
                    }
                });

                // Close the dialog
                $(this).dialog("close");
                
                // If the user has selected a new color, trigger a color change
                if (color != selectedColor) {
                    changeColor(svgObj, isCategoricalColor, color, value, selectedColor);
                }
            },

            // The cancel button ignores the user's selection and closes the
            // dialog
            "Cancel": function() { $(this).dialog("close"); }
        },

        // When the dialog closes, remove it from the DOM
        close: function() { $(this).dialog("destroy"); }

    });
}

// Function that handles color changes from the color chooser dialog
function changeColor(svgObj, isCategoricalColor, color, value, selectedColor) {
    // If the color is for a categorical scale, simply iterate through the
    // selectedColors dictionary and change the associated color to the new color
    if (isCategoricalColor) {
        // Iterate through all the keys in selectedColors to find the value for
        // which the assiciated color should change
        var colorKeys = Object.keys(svgObj.selectedColors);
        var i;
        for (i = 0; i < colorKeys.length; i++) {
            if (colorKeys[i] == value) {
                svgObj.selectedColors[colorKeys[i]] = selectedColor;
            }
        }
    }
    // If the color is for a continuous scale, determine whether the color
    // being changed is for the beginning of the scale or the end of the scale,
    // then change it
    else {
        // Get a copy of the range of the colorScale
        var colorScaleRange = $.extend(true, [], svgObj.colorScale.range());
        
        // If the original color is the first item in the colorScaleRange, then
        // change it to the selected color
        if (color == getRGBColor(colorScaleRange[0])) {
            colorScaleRange[0] = selectedColor;
        }
        // If the original color is the last item in the colorScaleRange, then
        // change it to the selected color
        else if (color == getRGBColor(colorScaleRange[colorScaleRange.length-1])) {
            colorScaleRange[colorScaleRange.length-1] = selectedColor;
        }
        
        // Save the changes made to the scale by setting the colorScale range
        // to the new colorScaleRange
        svgObj.colorScale.range(colorScaleRange);
    }

    // Trigger an update to the graph
    updateGraph(svgObj);
}

// A helper function to make sure the given color is an RGB color
function getRGBColor(color) {
    // If the current color is a hex number, convert it to RGB values
    if (color[0] == "#") {
        color = color.substring(1, color.length);
        var colorRGB = "rgb(";
        var i;
        for (i = 0; i < color.length; i+=2) {
            var hexNum = color.substring(i, i+2);
            colorRGB += parseInt("0x" + hexNum) + ", ";
        }
        return colorRGB.substring(0, colorRGB.length-2) + ")";
    }
    // If the current color is not a hex number, just return it
    else {
        return color;
    }
}

// Function to create a popup window that enables the user to choose what shapes
// they want to attribute to which category
function createShapeChooser(svgObj, shapeVar) {
    // Create a list of radio buttons and their shape labels
    var shapeRadioButtons = "<ul>";
    var i;
    for (i = 0; i < SHAPES.length; i++) {
        shapeRadioButtons += '<li id="' + SHAPES[i] +
            '"><input type="radio" style="margin-top: 15px;" ' +
            'onclick="listClick(this)"><p>' + SHAPES[i] +
            '</p></input></li>';
    }
    shapeRadioButtons += "</ul>";

    // Finish creating the dialog
    var shapeChooser = $('<div><h2>Shapes</h2><div id="' +
        svgObj.name + '-shapes">' + shapeRadioButtons + '</div></div>');
    $(shapeChooser).dialog({
        // When the dialog button opens, make the radio button for
        // the current shape be selected
        open: function() {
            var currentShape = svgObj.shapeDict[shapeVar];
            d3.select(this).selectAll("li")[0].forEach( function(d) {
                if (d3.select(d).attr("id") == currentShape) {
                    d3.select(d).select("input")[0][0].checked = true;
                }
            });
        },
        buttons: {
                // The Ok button which shape was selected, changes the shape
                // to the new shape, and updates the graph
                "Ok": function() {
                    // Determine what shape was selected
                    var selectedShape;
                    d3.select(this).selectAll("li")[0].forEach( function(d) {
                        if (d3.select(d).select("input")[0][0].checked) {
                            selectedShape = d3.select(d).select("p").text();
                        }
                    });

                    // Only update the graph if the shape changed
                    if (svgObj.shapeDict[shapeVar] != selectedShape) {
                        svgObj.shapeDict[shapeVar] = selectedShape;
                        updateGraph(svgObj);
                    }

                    // Close the dialog
                    $(this).dialog("close");
                },

                // The cancel button ignores the user's selection and closes the
                // dialog
                "Cancel": function() { $(this).dialog("close"); }
            },

        // When the dialog closes, remove it from the DOM
        close: function() { $(this).dialog("destroy"); }
    });
}

// A helper method to ensure that only one radio button or SVG can be selected.
// This function assumes that the element that is selected lies within a
// container that lies within another container that has all radio buttons or
// SVG that can be selected
function listClick(e) {
    // Get the tag name for the parent of the clicked element
    var tagType = e.parentNode.tagName;
    
    // Select the container that has all radio buttons or SVGs that can be
    // selected, then select all child tags with the above tagType. Iterate
    // through each of these to determine what to do
    d3.select(e.parentNode.parentNode).selectAll(tagType)[0].forEach( function(d) {
        // Try to select a radio button within the current tagType
        var inputSelection = d3.select(d).select("input")[0][0];

        // If the ID of the current tagType matches the ID of the parent of the
        // clicked element, select it
        if (d3.select(d).attr("id") == d3.select(e.parentNode).attr("id")) {
            // If a radio button exists, check it
            if (inputSelection) {
                inputSelection.checked = true;
            }
            // If a radio button does not exist, assume that the clicked element
            // was an SVG and highlight it
            else {
                d3.select(d).select("svg").style("border", "3px solid lightgreen");
            }
        }
        // If the IDs don't match, make sure the element is not selected
        else {
            // If a radio button exists, make sure it is unchecked
            if (inputSelection) {
                inputSelection.checked = false;
            }
            // If a radio button does not exist, assume that the clicked element
            // was an SVG and make sure it is not highlighted
            else {
                d3.select(d).select("svg").style("border", "1px solid black");
            }
        }
    });
}

// Function to set the width of the #mainInnerContainer div to the width of the
// SVG with the widest legend to make sure the legend remains on the right side
// of the graph
function setMainInnerContainerWidth() {
    // Iterate through all SVG divs to determine the width of the widest legend
    var maxLegendWidth = 0;
    var i;
    for (i = 0; i < svgCount || i == 0; i++) {
        // Get the width of a legend
        var svgName = svgData["svg-"+i].name;
        var legend = d3.select("#"+svgName).select(".legend");
        var legendWidth = legend[0][0].clientWidth;
        
        // Save the largest legendWidth
        if (legendWidth > maxLegendWidth) {
            maxLegendWidth = legendWidth;
        }
    }

    // Calculate the width of the widest SVG div and the current width of
    // #mainInnerContainer
    var maxSVGDivWidth = width+maxLegendWidth+100;
    var currentWidth = d3.select("#mainInnerContainer").style("width");
    currentWidth = Number(currentWidth.substring(0, currentWidth.length-2));

    // If the currentWidth is not the right size, change it
    if (currentWidth != maxSVGDivWidth) {
        d3.select("#mainInnerContainer").style("width", maxSVGDivWidth+"px");
    }
}