// Script to add ERA5 land "peak SWE" statistics to GMBA polygons
// Peak SWE is defined as SWE on Oct 01 (S hemisphere) or Apr 01 (N hemisphere) 
// IACS joint body on mountain snow cover, working group 2 
// simon.gascoin@univ-tlse3.fr

// config
var yrParam = {min:1990, max:2022};

// input datasets    
var gmba = ee.FeatureCollection("users/sgascoin/GMBA_lite");
var swe = ee.ImageCollection("ECMWF/ERA5_LAND/DAILY_AGGR")
      .select('snow_depth_water_equivalent');

/*
// smaller domain for debugging
gmba = gmba.filterBounds(debug);
*/

// spatial statistics to export
var reducer = ee.Reducer.mean()
  .combine({
    reducer2: ee.Reducer.stdDev(),
    sharedInputs: true
    }).combine({
      reducer2: ee.Reducer.count(),
      sharedInputs: true
  });

// function to get peak SWE for a hydrological year
var getVoi = function(y1){
  return peakSwe.filter(
    ee.Filter.eq('year',y1)).first();
};

// function to add statistics to gmba polygons 
var addStatGmba = function(y1){
  // compute variable of interest
  var voi = getVoi(y1);
  // compute spatial statistics
  var gmbaSnow0 = voi.reduceRegions({
    collection:gmba, 
    reducer:reducer, 
    scale:proj.nominalScale(), 
    crs:proj.crs(), 
    });
  // add year property
  var yearIm = ee.Image.constant(y1);
  var gmbaSnow = yearIm.reduceRegions({
    collection:gmbaSnow0, 
    reducer:ee.Reducer.first().setOutputs(['year']), 
    scale:proj.nominalScale(), 
    crs:proj.crs(), 
    });
  return gmbaSnow ;
};

// function to aggregate annual statistics to a gmba polygon
var aggregateYear = function(e){
  // get gmba polygon id
  var id = e.get('GMBA_V2_ID');
  // compute polygon centroid latitude
  var lat = e.geometry().centroid().coordinates().getNumber(1)
  // select N or S hemisphere
  var statGmbaYear = ee.Algorithms.If(lat.gt(0),statGmbaYearN,statGmbaYearS)
  // get corresponding stats
  var stats = ee.FeatureCollection(statGmbaYear).filter(
    ee.Filter.eq('GMBA_V2_ID',id));
  var mean = stats.aggregate_mean('mean');
  var count = stats.aggregate_mean('count');
  var means = stats.aggregate_array('mean');
  var stds = stats.aggregate_array('stdDev');
  var years = stats.aggregate_array('year');
  // add them to the polygon attribute table
  return e.set({
    'count':count,
    'mean':mean,
    'means':means,
    'stdDevs':stds,
    'years':years
  });
};

// keep projection to reduce from original scale and crs
var proj = swe.first().projection();

// years to process
var yrList =  ee.List.sequence(
  yrParam.min, 
  yrParam.max);

// north hemisphere: April 1st SWE 
var peakSwe = swe
  .filter(ee.Filter.calendarRange(91, null, 'day_of_year'));

// compute stats for every year
var statGmbaYearN = ee.FeatureCollection(
  yrList.map(addStatGmba)).flatten();
  
// south hemisphere: Oct 1st SWE 
var peakSwe = swe
  .filter(ee.Filter.calendarRange(274, null, 'day_of_year'));

// compute stats for every year
var statGmbaYearS = ee.FeatureCollection(
  yrList.map(addStatGmba)).flatten();

// aggregate by gmba polygon
var statGmbaYearAgg = gmba.map(aggregateYear);

// copy config in the filename
var fname = ee.String(
    'peakSweGmba_year'+yrParam.min+yrParam.max);

// export results as a csv file
Export.table.toDrive({
  collection: statGmbaYearAgg, 
  description:fname.getInfo(), 
  folder:'GEE', 
  fileNamePrefix:fname.getInfo(), 
  fileFormat:'CSV',
  selectors:['GMBA_V2_ID','count','mean','means','stdDevs','years'] 
  }); 

// export results as a FeatureView asset
Export.table.toFeatureView({
  collection: statGmbaYearAgg.select(['GMBA_V2_ID','MapName','mean']),
  assetId: fname.getInfo(),
  description: fname.getInfo()
});