// Script to add MOD10A1 snow melt out date statistics to GMBA polygons
// IACS joint body on mountain snow cover, working group 2 
// simon.gascoin@univ-tlse3.fr

// config
var config = {
  name:'snowMeltDate', 
  ymin:2000, 
  ymax:2023
};

// input datasets
var gmba0 = ee.FeatureCollection("users/sgascoin/GMBA_lite");
var dem250 = ee.Image("USGS/GMTED2010_FULL");

// function to set a (multi-)polygon to non-geodesic 
var setNoGeodesic = function(ft){
  var coords = ft.geometry().coordinates();
  var poly = ee.Geometry.MultiPolygon({
    coords:coords,
    geodesic: false
  });
 return ft.setGeometry(poly);
};

// to avoid projection issues with SR-ORG:6974 PLANAR (MOD10A1),
// set GMBA to non-geodesic 
var gmba = gmba0.map(setNoGeodesic);

// collection of interest
var coi = ee.ImageCollection("MODIS/061/MOD10A1").select('NDSI_Snow_Cover');

// function to convert mod10a1 to snow/no snow (clouds are masked)
var binarize = function(img){return img.gt(0)};

// masking water improves the output
var waterMask = ee.Image('MODIS/MOD44W/MOD44W_005_2000_02_24')
  .select('water_mask')
  .not();

// dem mask
var dem = dem250.select('mea').resample();

//*/
// smaller domain for debugging
gmba = gmba.filterBounds(debug);
//*/


// https://developers.google.com/earth-engine/tutorials/community/identifying-first-day-no-snow 
var startDate;
var startYear;

/*
// Pixels must have been 10% snow covered for at least 2 weeks in 2018.
var snowCoverEphem = coi.filterDate('2018-01-01', '2019-01-01')
  .map(function(img) {
    return img.gte(10);
  })
  .sum()
  .gte(14);

// Pixels must not be 10% snow covered more than 124 days in 2018.
var snowCoverConst = coi.filterDate('2018-01-01', '2019-01-01')
  .map(function(img) {
    return img.gte(10);
  })
  .sum()
  .lte(124);
*/

function addDateBands(img) {
  // Get image date.
  var date = img.date();
  // Get calendar day-of-year.
  var calDoy = date.getRelative('day', 'year');
  // Get relative day-of-year; enumerate from user-defined startDoy.
  var relDoy = date.difference(startDate, 'day');
  // Get the date as milliseconds from Unix epoch.
  var millis = date.millis();
  // Add all of the above date info as bands to the snow fraction image.
  var dateBands = ee.Image.constant([calDoy, relDoy, millis, startYear])
    .rename(['calDoy', 'relDoy', 'millis', 'year']);
  // Cast bands to correct data type before returning the image.
  return img.addBands(dateBands)
    .cast({'calDoy': 'int', 'relDoy': 'int', 'millis': 'long', 'year': 'int'})
    .set('millis', millis);
}

// function to get the variable of interest
var getVoi = function(y1,hem){
  // day of year to start the search for the first day with zero percent snow cover
  var startDoy = ee.Number(ee.Algorithms.If(hem.equals('N'), 1, 183));
    // Set the global startYear variable as the year being worked on so that
  // it will be accessible to the addDateBands mapped to the collection below.
  startYear = y1;
  // Get the first day-of-year for this year as an ee.Date object.
  var firstDoy = ee.Date.fromYMD(y1, 1, 1);
  // Advance from the firstDoy to the user-defined startDay; subtract 1 since
  // firstDoy is already 1. Set the result as the global startDate variable so
  // that it is accessible to the addDateBands mapped to the collection below.
  startDate = firstDoy.advance(startDoy.subtract(1), 'day');
  // Get endDate for this year by advancing 1 year from startDate.
  // Need to advance an extra day because end date of filterDate() function
  // is exclusive.
  var endDate = startDate.advance(1, 'year').advance(1, 'day');
  // Filter the complete collection by the start and end dates just defined.
  var yearCol = coi.filterDate(startDate, endDate);
  // Construct an image where pixels represent the first day within the date
  // range that the lowest snow fraction is observed.
  var noSnowImg = yearCol
    // Add date bands to all images in this particular collection.
    .map(addDateBands)
    // Sort the images by ascending time to identify the first day without
    // snow. Alternatively, you can use .sort('millis', false) to
    // reverse sort (find first day of snow in the fall).
    .sort('millis')
    // Make a mosaic composed of pixels from images that represent the
    // observation with the minimum percent snow cover (defined by the
    // NDSI_Snow_Cover band); include all associated bands for the selected
    // image.
    .reduce(ee.Reducer.min(5))
    // Rename the bands - band names were altered by previous operation.
    .rename(['snowCover', 'calDoy', 'relDoy', 'millis', 'year'])
    // Apply the mask.
    .updateMask(analysisMask)
    // Set the year as a property for filtering by later.
    .set('year', y1);

  // Mask by minimum snow fraction - only include pixels that reach 0
  // percent cover. Return the resulting image.
  return noSnowImg.updateMask(noSnowImg.select('snowCover').eq(0))
      .select('relDoy').int16();
};

// load function to fill gmba 
var addToGmba = require('users/sgascoin/iacs_jb_wg2:addToGmba.js');

// min elevation of the lower bound
var low0 = 0;

// max elevation of the lower bound
var low1 = 9000;

// elevation band width
var step = 500;

// output filename prefix
var name0 = config.name;

// all elevations
var elevParam = {low:low0, up:low1};

// adjust output filename
var zmin = ee.Number(elevParam.low).format('%04d');
var zmax = ee.Number(elevParam.up).format('%04d');
config.name = ee.String(name0+'_').cat(zmin).cat(zmax).cat('_');

// create DEM mask
var demMask = dem.gte(elevParam.low).and(dem.lt(elevParam.up));
var analysisMask = waterMask.multiply(demMask);

// run computations
addToGmba.addToGmba(config,coi,gmba,getVoi);

// elevation band loop (client-side)
while (low0 < low1) {
  // define elevation range
  var elevParam = {low:low0, up:low0 + step};
  
  // adjust output filename
  var zmin = ee.Number(elevParam.low).format('%04d');
  var zmax = ee.Number(elevParam.up).format('%04d');
  config.name = ee.String(name0+'_').cat(zmin).cat(zmax).cat('_');

  // create DEM mask
  var demMask = dem.gte(elevParam.low).and(dem.lt(elevParam.up));
  var analysisMask = waterMask.multiply(demMask);

  // run computations
  addToGmba.addToGmba(config,coi,gmba,getVoi);
  
  // increment lower elevation
  low0 = low0 + step;
}
