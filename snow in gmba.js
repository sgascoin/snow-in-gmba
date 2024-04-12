// Script to add MOD10A1 snow probability statistics to GMBA polygons
// IACS joint body on mountain snow cover, working group 2 
// simon.gascoin@univ-tlse3.fr

// config
var yrParam = {min:2000, max:2022},
    elevParam = {low:2500, up:3000},
    m0 = 9; // first month of water year (9 = north hemisphere)

// input datasets    
var gmba = ee.FeatureCollection("users/sgascoin/GMBA_lite"),
    mod10a1 = ee.ImageCollection("MODIS/061/MOD10A1"),
    dem250 = ee.Image("USGS/GMTED2010_FULL");

/*
// smaller domain for debugging
var gmba = gmba.filterBounds(debug);
var mod10a1 = mod10a1.filterBounds(debug)
  .filter(ee.Filter.calendarRange(3, 6, 'month')) ;
*/

// function to convert mod10a1 to snow/no snow (clouds are masked)
var binarize = function(img){return img.gt(0)};

// masking water improves the output
var waterMask = ee.Image('MODIS/MOD44W/MOD44W_005_2000_02_24')
  .select('water_mask')
  .not();

// spatial statistics to export
var reducer = ee.Reducer.mean()
  .combine({
    reducer2: ee.Reducer.stdDev(),
    sharedInputs: true
    }).combine({
      reducer2: ee.Reducer.count(),
      sharedInputs: true
  });

// function to compute annual snow probability in days/year 
var snowProba = function(y1){
  // filter one water year 
  var t1 = ee.Date.fromYMD(y1,m0,1);
  var t2 = t1.advance(1,'year');
  var filteredCol = mod10a1
    .filterDate(t1,t2)
    .select('NDSI_Snow_Cover');
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
  return snowProba.rename(t1.format('yMMdd'));
};

// function to add snow proba statistics to gmba polygons 
var snowProbaGmba = function(y1){
  // compute snow proba
  var sp = snowProba(y1);
  // compute spatial statistics
  var gmbaSnow0 = sp.reduceRegions({
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
  // get corresponding stats
  var stats = snowProbaGmbaYear.filter(
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

// dem mask
var dem = dem250.select('mea').resample();
var demMask = dem.gte(elevParam.low).and(dem.lt(elevParam.up));

// keep projection to reduce from original scale and crs
var proj = mod10a1.first().projection();

// years to process
var yrList =  ee.List.sequence(
  yrParam.min, 
  yrParam.max);

// compute stats for every year
var snowProbaGmbaYear = ee.FeatureCollection(
  yrList.map(snowProbaGmba)).flatten();

// aggregate by gmba polygon
var snowProbaGmbaYearAgg = gmba.map(aggregateYear);

// copy config in the filename
var fname = ee.String(
    'snowProbaGmba_year'+yrParam.min+yrParam.max+'_elev'+elevParam.low+elevParam.up+'_m'+m0);

// export results as a csv file
Export.table.toDrive({
  collection: snowProbaGmbaYearAgg, 
  description:fname.getInfo(), 
  folder:'GEE', 
  fileNamePrefix:fname.getInfo(), 
  fileFormat:'CSV',
  selectors:['GMBA_V2_ID','count','mean','means','stdDevs','years'] 
  }); 

// export results as a FeatureView asset
Export.table.toFeatureView({
  collection: snowProbaGmbaYearAgg.select(['GMBA_V2_ID','MapName','mean']),
  assetId: fname.getInfo(),
  description: fname.getInfo()
});
