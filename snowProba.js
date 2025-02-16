// Script to add MOD10A1 snow probability statistics to GMBA polygons
// IACS joint body on mountain snow cover, working group 2 
// simon.gascoin@univ-tlse3.fr

// config
var config = {
  name:'snowProba', 
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

/*
// smaller domain for debugging
gmba = gmba.filterBounds(debug);
*/

// function to get the variable of interest
// annual snow probability in days/year 
var getVoi = function(y1,hem){
  // select first month of water year according to hemisphere
  var m0 = ee.Algorithms.If(hem.equals('N'),9,3);
  // filter one water year 
  var t1 = ee.Date.fromYMD(y1,m0,1);
  var t2 = t1.advance(1,'year');
  var filteredCol = coi.filterDate(t1,t2);
  // count cloud-free snow days 
  var snow = filteredCol.map(binarize).sum(); 
  // count cloud-free days 
  var clear = filteredCol.count(); 
  // compute snow probability
  var snowProba = snow.divide(clear)
    .multiply(t2.difference(t1,'day'))
    // mask water
    .updateMask(waterMask)
    // mask non-valid elevations
    .updateMask(demMask);
  return snowProba;
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

  // run computations
  addToGmba.addToGmba(config,coi,gmba,getVoi);
  
  // increment lower elevation
  low0 = low0 + step;
}
