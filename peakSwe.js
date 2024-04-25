// Script to add ERA5 land "peak SWE" statistics to GMBA polygons
// Peak SWE is defined as SWE on Oct 01 (S hemisphere) or Apr 01 (N hemisphere) 
// IACS joint body on mountain snow cover, working group 2 
// simon.gascoin@univ-tlse3.fr

// config
var config = {name:'peakSwe', ymin:2000, ymax:2022};

// input datasets
var gmba = ee.FeatureCollection("users/sgascoin/GMBA_lite");

// collection of interest
var coi = ee.ImageCollection("ECMWF/ERA5_LAND/DAILY_AGGR")
      .select('snow_depth_water_equivalent');

/*
// smaller domain for debugging
gmba = gmba.filterBounds(debug);
*/

// function to get the variable of interest
// peak SWE for a hydrological year
var getVoi = function(y1,hem){
  // select day of year April 01 (north) or Oct 01 (south) 
  var doy = ee.Algorithms.If(hem.equals('N'),91,274);
  return coi.filter(
    ee.Filter.and(
      ee.Filter.calendarRange(doy, null, 'day_of_year'),
      ee.Filter.eq('year',y1)))
    .first();
};

// load function to fill gmba 
var addToGmba = require('users/sgascoin/iacs_jb_wg2:addToGmba.js');

// run computations
addToGmba.addToGmba(config,coi,gmba,getVoi)

